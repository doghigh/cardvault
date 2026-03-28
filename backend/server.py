from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import base64
import httpx
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Card(BaseModel):
    card_id: str = Field(default_factory=lambda: f"card_{uuid.uuid4().hex[:12]}")
    user_id: str
    card_name: str
    card_type: str  # Sports, Pokemon, TCG, etc.
    card_year: Optional[str] = None
    damage_notes: Optional[str] = None
    image_base64: Optional[str] = None
    avg_price: Optional[float] = None
    top_price: Optional[float] = None
    bottom_price: Optional[float] = None
    price_source: Optional[str] = None
    price_updated_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CardCreate(BaseModel):
    card_name: str
    card_type: str
    card_year: Optional[str] = None
    damage_notes: Optional[str] = None
    image_base64: Optional[str] = None

class CardUpdate(BaseModel):
    card_name: Optional[str] = None
    card_type: Optional[str] = None
    card_year: Optional[str] = None
    damage_notes: Optional[str] = None
    avg_price: Optional[float] = None
    top_price: Optional[float] = None
    bottom_price: Optional[float] = None

class PriceUpdate(BaseModel):
    avg_price: float
    top_price: float
    bottom_price: float
    price_source: str = "manual"

class CardAnalysisResult(BaseModel):
    card_name: str
    card_type: str
    card_year: Optional[str] = None
    damage_notes: Optional[str] = None

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request) -> User:
    """Get current user from session token cookie or Authorization header"""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

# ==================== AUTH ROUTES ====================

@api_router.get("/auth/session")
async def exchange_session(session_id: str, response: Response):
    """Exchange session_id from Emergent Auth for user data and set cookie"""
    try:
        async with httpx.AsyncClient() as client_http:
            auth_response = await client_http.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            
            auth_data = auth_response.json()
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    email = auth_data.get("email")
    name = auth_data.get("name")
    picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        new_user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one(session_doc)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user"""
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user and clear session"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(
        key="session_token",
        httponly=True,
        secure=True,
        samesite="none",
        path="/"
    )
    return {"message": "Logged out successfully"}

# ==================== CARD ANALYSIS (GPT-5.2 Vision) ====================

async def analyze_card_image(image_base64: str) -> CardAnalysisResult:
    """Analyze card image using GPT-5.2 Vision"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"card_analysis_{uuid.uuid4().hex[:8]}",
        system_message="""You are an expert trading card analyst. Analyze the card image and extract:
1. Card Name: The name of the card/player/character
2. Card Type: One of (Sports - Baseball, Sports - Basketball, Sports - Football, Sports - Hockey, Pokemon, Yu-Gi-Oh, Magic: The Gathering, Other TCG, Other)
3. Card Year: The year printed on the card (if visible)
4. Damage Notes: Note any visible damage such as creases, scratches, whitening, centering issues, etc.

Respond in this exact JSON format:
{
    "card_name": "Name here",
    "card_type": "Type here",
    "card_year": "Year or null",
    "damage_notes": "Description or null if no damage visible"
}"""
    ).with_model("openai", "gpt-5.2")
    
    image_content = ImageContent(image_base64=image_base64)
    
    user_message = UserMessage(
        text="Please analyze this trading card image and extract the card details.",
        file_contents=[image_content]
    )
    
    response = await chat.send_message(user_message)
    
    try:
        import json
        json_match = re.search(r'\{[^{}]*\}', response, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            return CardAnalysisResult(
                card_name=data.get("card_name", "Unknown Card"),
                card_type=data.get("card_type", "Other"),
                card_year=data.get("card_year"),
                damage_notes=data.get("damage_notes")
            )
    except Exception as e:
        logger.error(f"Failed to parse GPT response: {e}")
    
    return CardAnalysisResult(
        card_name="Unknown Card",
        card_type="Other",
        card_year=None,
        damage_notes=None
    )

# ==================== PRICE SCRAPING ====================

async def scrape_ebay_prices(card_name: str, card_year: Optional[str] = None) -> dict:
    """Scrape eBay sold listings for card prices"""
    search_query = card_name
    if card_year:
        search_query = f"{card_year} {card_name}"
    
    search_query = search_query.replace(" ", "+")
    url = f"https://www.ebay.com/sch/i.html?_nkw={search_query}&_sacat=0&LH_Sold=1&LH_Complete=1"
    
    try:
        async with httpx.AsyncClient() as client_http:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            response = await client_http.get(url, headers=headers, timeout=15.0)
            
            if response.status_code != 200:
                return {"success": False, "error": "Failed to fetch eBay data"}
            
            html = response.text
            price_pattern = r'\$(\d+(?:,\d{3})*(?:\.\d{2})?)'
            prices = re.findall(price_pattern, html)
            
            if not prices:
                return {"success": False, "error": "No sold listings found"}
            
            numeric_prices = []
            for p in prices[:20]:
                try:
                    numeric_prices.append(float(p.replace(",", "")))
                except:
                    pass
            
            if not numeric_prices:
                return {"success": False, "error": "No valid prices found"}
            
            return {
                "success": True,
                "avg_price": round(sum(numeric_prices) / len(numeric_prices), 2),
                "top_price": round(max(numeric_prices), 2),
                "bottom_price": round(min(numeric_prices), 2),
                "source": "eBay Sold Listings"
            }
    except Exception as e:
        logger.error(f"eBay scrape error: {e}")
        return {"success": False, "error": str(e)}

# ==================== CARD ROUTES ====================

@api_router.post("/cards/analyze")
async def analyze_card(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    """Analyze uploaded card image and extract details"""
    content = await file.read()
    image_base64 = base64.b64encode(content).decode('utf-8')
    
    result = await analyze_card_image(image_base64)
    
    return {
        "card_name": result.card_name,
        "card_type": result.card_type,
        "card_year": result.card_year,
        "damage_notes": result.damage_notes,
        "image_base64": image_base64
    }

@api_router.post("/cards/analyze-base64")
async def analyze_card_base64(
    data: dict,
    user: User = Depends(get_current_user)
):
    """Analyze card image from base64 string"""
    image_base64 = data.get("image_base64", "")
    
    if "," in image_base64:
        image_base64 = image_base64.split(",")[1]
    
    result = await analyze_card_image(image_base64)
    
    return {
        "card_name": result.card_name,
        "card_type": result.card_type,
        "card_year": result.card_year,
        "damage_notes": result.damage_notes,
        "image_base64": image_base64
    }

@api_router.post("/cards", response_model=dict)
async def create_card(
    card_data: CardCreate,
    user: User = Depends(get_current_user)
):
    """Create a new card in the collection"""
    card = Card(
        user_id=user.user_id,
        card_name=card_data.card_name,
        card_type=card_data.card_type,
        card_year=card_data.card_year,
        damage_notes=card_data.damage_notes,
        image_base64=card_data.image_base64
    )
    
    card_dict = card.model_dump()
    card_dict['created_at'] = card_dict['created_at'].isoformat()
    card_dict['updated_at'] = card_dict['updated_at'].isoformat()
    
    await db.cards.insert_one(card_dict)
    
    card_dict.pop('_id', None)
    return card_dict

@api_router.get("/cards")
async def get_cards(user: User = Depends(get_current_user)):
    """Get all cards for current user"""
    cards = await db.cards.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    return cards

@api_router.get("/cards/{card_id}")
async def get_card(card_id: str, user: User = Depends(get_current_user)):
    """Get a specific card"""
    card = await db.cards.find_one(
        {"card_id": card_id, "user_id": user.user_id},
        {"_id": 0}
    )
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card

@api_router.put("/cards/{card_id}")
async def update_card(
    card_id: str,
    update_data: CardUpdate,
    user: User = Depends(get_current_user)
):
    """Update a card"""
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.cards.update_one(
        {"card_id": card_id, "user_id": user.user_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Card not found")
    
    updated_card = await db.cards.find_one(
        {"card_id": card_id},
        {"_id": 0}
    )
    return updated_card

@api_router.delete("/cards/{card_id}")
async def delete_card(card_id: str, user: User = Depends(get_current_user)):
    """Delete a card"""
    result = await db.cards.delete_one(
        {"card_id": card_id, "user_id": user.user_id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Card not found")
    
    return {"message": "Card deleted successfully"}

@api_router.post("/cards/{card_id}/lookup-price")
async def lookup_card_price(card_id: str, user: User = Depends(get_current_user)):
    """Scrape eBay for card prices"""
    card = await db.cards.find_one(
        {"card_id": card_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    price_data = await scrape_ebay_prices(card["card_name"], card.get("card_year"))
    
    if price_data["success"]:
        await db.cards.update_one(
            {"card_id": card_id},
            {"$set": {
                "avg_price": price_data["avg_price"],
                "top_price": price_data["top_price"],
                "bottom_price": price_data["bottom_price"],
                "price_source": price_data["source"],
                "price_updated_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {
            "success": True,
            "avg_price": price_data["avg_price"],
            "top_price": price_data["top_price"],
            "bottom_price": price_data["bottom_price"],
            "source": price_data["source"]
        }
    else:
        return {
            "success": False,
            "error": price_data.get("error", "Failed to fetch prices")
        }

@api_router.put("/cards/{card_id}/manual-price")
async def update_manual_price(
    card_id: str,
    price_data: PriceUpdate,
    user: User = Depends(get_current_user)
):
    """Manually update card prices"""
    result = await db.cards.update_one(
        {"card_id": card_id, "user_id": user.user_id},
        {"$set": {
            "avg_price": price_data.avg_price,
            "top_price": price_data.top_price,
            "bottom_price": price_data.bottom_price,
            "price_source": price_data.price_source,
            "price_updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Card not found")
    
    updated_card = await db.cards.find_one(
        {"card_id": card_id},
        {"_id": 0}
    )
    return updated_card

# ==================== STATS ROUTE ====================

@api_router.get("/stats")
async def get_stats(user: User = Depends(get_current_user)):
    """Get collection statistics"""
    cards = await db.cards.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).to_list(1000)
    
    total_cards = len(cards)
    total_value = sum(c.get("avg_price", 0) or 0 for c in cards)
    cards_with_price = sum(1 for c in cards if c.get("avg_price"))
    
    type_counts = {}
    for c in cards:
        t = c.get("card_type", "Other")
        type_counts[t] = type_counts.get(t, 0) + 1
    
    return {
        "total_cards": total_cards,
        "total_value": round(total_value, 2),
        "cards_with_price": cards_with_price,
        "type_breakdown": type_counts
    }

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "Card Catalog API", "status": "healthy"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
