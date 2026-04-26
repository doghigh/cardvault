#!/usr/bin/env python3

import requests
import sys
import json
import base64
from datetime import datetime
import time

class CardCatalogAPITester:
    def __init__(self, base_url="https://card-catalog-pro-1.preview.doghighagent.com", session_token=None):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = session_token or "test_session_frontback_123"
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_health_check(self):
        """Test API health check endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            self.log_test("API Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("API Health Check", False, str(e))
            return False

    def create_test_session(self):
        """Create test user and session in MongoDB"""
        print("\n🔧 Creating test user and session...")
        
        # Generate unique identifiers
        timestamp = int(time.time())
        self.user_id = f"test-user-{timestamp}"
        self.session_token = f"test_session_{timestamp}"
        
        # MongoDB commands to create test data
        mongo_commands = f"""
use('test_database');
db.users.insertOne({{
  user_id: '{self.user_id}',
  email: 'test.user.{timestamp}@example.com',
  name: 'Test User {timestamp}',
  picture: null,
  created_at: new Date()
}});
db.user_sessions.insertOne({{
  user_id: '{self.user_id}',
  session_token: '{self.session_token}',
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});
print('Test user created successfully');
"""
        
        try:
            # Execute MongoDB commands
            import subprocess
            result = subprocess.run(
                ['mongosh', '--eval', mongo_commands],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print(f"✅ Test user created - User ID: {self.user_id}")
                print(f"✅ Session token: {self.session_token}")
                return True
            else:
                print(f"❌ Failed to create test user: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ MongoDB setup error: {e}")
            return False

    def test_auth_me(self):
        """Test /api/auth/me endpoint"""
        headers = {"Authorization": f"Bearer {self.session_token}"}
        try:
            response = requests.get(f"{self.api_url}/auth/me", headers=headers, timeout=10)
            success = response.status_code == 200
            if success:
                user_data = response.json()
                details = f"User: {user_data.get('name', 'Unknown')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            self.log_test("Auth Me Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Auth Me Endpoint", False, str(e))
            return False

    def test_get_cards_empty(self):
        """Test GET /api/cards (should return empty array for new user)"""
        headers = {"Authorization": f"Bearer {self.session_token}"}
        try:
            response = requests.get(f"{self.api_url}/cards", headers=headers, timeout=10)
            success = response.status_code == 200
            if success:
                cards = response.json()
                success = isinstance(cards, list) and len(cards) == 0
                details = f"Cards count: {len(cards)}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            self.log_test("Get Cards (Empty)", success, details)
            return success
        except Exception as e:
            self.log_test("Get Cards (Empty)", False, str(e))
            return False

    def test_create_card(self):
        """Test POST /api/cards endpoint with front and back images"""
        headers = {
            "Authorization": f"Bearer {self.session_token}",
            "Content-Type": "application/json"
        }
        
        # Create a simple test image (1x1 pixel PNG in base64)
        test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        # Create a test card with both front and back images
        card_data = {
            "card_name": "Test Card 1986 Topps",
            "card_type": "Sports - Baseball",
            "card_year": "1986",
            "damage_notes": "Mint condition",
            "image_front_base64": test_image_b64,
            "image_back_base64": test_image_b64
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/cards", 
                headers=headers, 
                json=card_data,
                timeout=10
            )
            success = response.status_code == 200
            if success:
                card = response.json()
                self.test_card_id = card.get('card_id')
                # Verify both images are present
                has_front = card.get('image_front_base64') is not None
                has_back = card.get('image_back_base64') is not None
                success = success and has_front and has_back
                details = f"Card ID: {self.test_card_id}, Front: {has_front}, Back: {has_back}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            self.log_test("Create Card (Front/Back Images)", success, details)
            return success
        except Exception as e:
            self.log_test("Create Card (Front/Back Images)", False, str(e))
            return False

    def test_get_card_by_id(self):
        """Test GET /api/cards/{card_id} endpoint"""
        if not hasattr(self, 'test_card_id'):
            self.log_test("Get Card by ID", False, "No test card ID available")
            return False
            
        headers = {"Authorization": f"Bearer {self.session_token}"}
        try:
            response = requests.get(
                f"{self.api_url}/cards/{self.test_card_id}", 
                headers=headers, 
                timeout=10
            )
            success = response.status_code == 200
            if success:
                card = response.json()
                details = f"Card: {card.get('card_name', 'Unknown')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            self.log_test("Get Card by ID", success, details)
            return success
        except Exception as e:
            self.log_test("Get Card by ID", False, str(e))
            return False

    def test_update_card(self):
        """Test PUT /api/cards/{card_id} endpoint"""
        if not hasattr(self, 'test_card_id'):
            self.log_test("Update Card", False, "No test card ID available")
            return False
            
        headers = {
            "Authorization": f"Bearer {self.session_token}",
            "Content-Type": "application/json"
        }
        
        update_data = {
            "card_name": "Updated Test Card 1986 Topps",
            "damage_notes": "Near mint condition"
        }
        
        try:
            response = requests.put(
                f"{self.api_url}/cards/{self.test_card_id}", 
                headers=headers, 
                json=update_data,
                timeout=10
            )
            success = response.status_code == 200
            if success:
                card = response.json()
                details = f"Updated card: {card.get('card_name', 'Unknown')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            self.log_test("Update Card", success, details)
            return success
        except Exception as e:
            self.log_test("Update Card", False, str(e))
            return False

    def test_manual_price_update(self):
        """Test PUT /api/cards/{card_id}/manual-price endpoint"""
        if not hasattr(self, 'test_card_id'):
            self.log_test("Manual Price Update", False, "No test card ID available")
            return False
            
        headers = {
            "Authorization": f"Bearer {self.session_token}",
            "Content-Type": "application/json"
        }
        
        price_data = {
            "avg_price": 25.50,
            "top_price": 45.00,
            "bottom_price": 10.00,
            "price_source": "manual"
        }
        
        try:
            response = requests.put(
                f"{self.api_url}/cards/{self.test_card_id}/manual-price", 
                headers=headers, 
                json=price_data,
                timeout=10
            )
            success = response.status_code == 200
            if success:
                card = response.json()
                details = f"Price updated: ${card.get('avg_price', 0)}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            self.log_test("Manual Price Update", success, details)
            return success
        except Exception as e:
            self.log_test("Manual Price Update", False, str(e))
            return False

    def test_get_stats(self):
        """Test GET /api/stats endpoint"""
        headers = {"Authorization": f"Bearer {self.session_token}"}
        try:
            response = requests.get(f"{self.api_url}/stats", headers=headers, timeout=10)
            success = response.status_code == 200
            if success:
                stats = response.json()
                details = f"Total cards: {stats.get('total_cards', 0)}, Value: ${stats.get('total_value', 0)}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            self.log_test("Get Stats", success, details)
            return success
        except Exception as e:
            self.log_test("Get Stats", False, str(e))
            return False

    def test_card_analysis(self):
        """Test POST /api/cards/analyze-base64 endpoint"""
        headers = {
            "Authorization": f"Bearer {self.session_token}",
            "Content-Type": "application/json"
        }
        
        # Create a simple test image (1x1 pixel PNG in base64)
        test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        data = {
            "image_base64": test_image_b64,
            "side": "front"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/cards/analyze-base64", 
                headers=headers, 
                json=data,
                timeout=30  # Longer timeout for AI analysis
            )
            success = response.status_code == 200
            if success:
                result = response.json()
                has_front_image = result.get('image_front_base64') is not None
                details = f"Analyzed: {result.get('card_name', 'Unknown')}, Front image: {has_front_image}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            self.log_test("Card Analysis (GPT-5.2) - Front", success, details)
            return success
        except Exception as e:
            self.log_test("Card Analysis (GPT-5.2) - Front", False, str(e))
            return False

    def test_card_analysis_back(self):
        """Test POST /api/cards/analyze-base64 endpoint for back side"""
        headers = {
            "Authorization": f"Bearer {self.session_token}",
            "Content-Type": "application/json"
        }
        
        # Create a simple test image (1x1 pixel PNG in base64)
        test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        data = {
            "image_base64": test_image_b64,
            "side": "back"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/cards/analyze-base64", 
                headers=headers, 
                json=data,
                timeout=30  # Longer timeout for AI analysis
            )
            success = response.status_code == 200
            if success:
                result = response.json()
                has_back_image = result.get('image_back_base64') is not None
                details = f"Analyzed: {result.get('card_name', 'Unknown')}, Back image: {has_back_image}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            self.log_test("Card Analysis (GPT-5.2) - Back", success, details)
            return success
        except Exception as e:
            self.log_test("Card Analysis (GPT-5.2) - Back", False, str(e))
            return False

    def cleanup_test_data(self):
        """Clean up test data from MongoDB"""
        print("\n🧹 Cleaning up test data...")
        
        mongo_commands = f"""
use('test_database');
db.users.deleteMany({{user_id: '{self.user_id}'}});
db.user_sessions.deleteMany({{user_id: '{self.user_id}'}});
db.cards.deleteMany({{user_id: '{self.user_id}'}});
print('Test data cleaned up');
"""
        
        try:
            import subprocess
            result = subprocess.run(
                ['mongosh', '--eval', mongo_commands],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print("✅ Test data cleaned up successfully")
            else:
                print(f"⚠️ Cleanup warning: {result.stderr}")
                
        except Exception as e:
            print(f"⚠️ Cleanup error: {e}")

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Card Catalog API Tests")
        print(f"📍 Testing: {self.base_url}")
        print("=" * 50)
        
        # Basic connectivity test
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False
        
        # Use provided session token or create test session
        if self.session_token == "test_session_frontback_123":
            print(f"✅ Using provided session token: {self.session_token}")
        else:
            # Create test session
            if not self.create_test_session():
                print("❌ Test session creation failed - stopping tests")
                return False
        
        # Run auth tests
        if not self.test_auth_me():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Run CRUD tests
        self.test_get_cards_empty()
        self.test_create_card()
        self.test_get_card_by_id()
        self.test_update_card()
        self.test_manual_price_update()
        self.test_get_stats()
        
        # Test AI integration (may be slow)
        print("\n🤖 Testing AI Integration...")
        self.test_card_analysis()
        self.test_card_analysis_back()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️ Some tests failed")
            return False

def main():
    tester = CardCatalogAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())