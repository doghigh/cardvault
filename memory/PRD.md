# CardVault - Trading Card Scanner App PRD

## Original Problem Statement
An app that can scan trading cards, put the scan into a database, read the text on the card and fill in the fields of the database, [card type, card year, name of card, note any damage] search the internet for any sales of that card, and add the average sale, top sale, and bottom sale, to the database.

## User Choices
- **Card Upload**: Both file upload and camera capture
- **OCR/Analysis**: OpenAI GPT-5.2 Vision
- **Price Lookup**: eBay scraping + manual entry
- **Card Types**: All trading cards (Sports, Pokemon, TCG)
- **Authentication**: Google OAuth via doghigh

## Architecture

### Backend (FastAPI)
- **Server**: `/app/backend/server.py`
- **Database**: MongoDB
- **Auth**: doghigh Google OAuth with session tokens
- **AI**: GPT-5.2 Vision via doghighintegrations

### Frontend (React)
- **Components**: Shadcn UI
- **Styling**: Tailwind CSS with dark theme
- **Pages**: Landing, Dashboard, Scanner, CardDetail

## User Personas
1. **Collector**: Wants to catalog and track value of collection
2. **Trader**: Needs quick price lookups for buying/selling decisions
3. **Casual User**: Wants to identify cards they find

## Core Requirements (Static)
- [x] Scan trading cards via file upload or camera
- [x] AI-powered text extraction (card name, type, year, damage)
- [x] Store cards in database with metadata
- [x] eBay price scraping (avg, top, bottom)
- [x] Manual price entry option
- [x] User authentication (Google OAuth)

## What's Been Implemented (March 28, 2026)

### Backend API Endpoints
- `GET /api/` - Health check
- `GET /api/auth/session` - OAuth session exchange
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/cards/analyze` - Analyze card image (file upload)
- `POST /api/cards/analyze-base64` - Analyze card image (base64)
- `POST /api/cards` - Create card
- `GET /api/cards` - List user's cards
- `GET /api/cards/{id}` - Get card details
- `PUT /api/cards/{id}` - Update card
- `DELETE /api/cards/{id}` - Delete card
- `POST /api/cards/{id}/lookup-price` - eBay price lookup
- `PUT /api/cards/{id}/manual-price` - Manual price update
- `GET /api/stats` - Collection statistics

### Frontend Pages
- Landing page with Google OAuth
- Dashboard with card grid/list views
- Scanner with file upload + camera capture
- Card detail with edit/delete/price lookup

## Prioritized Backlog

### P0 (Critical)
- All features implemented ✅

### P1 (High Priority)
- Bulk card upload
- Export collection to CSV/PDF
- Card grading integration (PSA, BGS)

### P2 (Medium Priority)
- Price alerts/notifications
- Collection sharing
- Card comparison tool
- Advanced search/filters

## Next Tasks
1. Add bulk card upload feature
2. Implement collection export (CSV)
3. Add more robust error handling for eBay scraping
4. Consider integrating card grading services
