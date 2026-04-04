"""
Backend API Tests for NeuroBuddy AI
Tests authentication, chat, and game session endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "student@test.com"
TEST_PASSWORD = "student123"


class TestHealthAndRoot:
    """Basic API health checks"""
    
    def test_root_endpoint(self):
        """Test root API endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"Root endpoint response: {data}")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test successful login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"Login successful for user: {data['user']['name']}")
    
    def test_login_invalid_credentials(self):
        """Test login fails with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("Invalid credentials correctly rejected")
    
    def test_get_current_user(self):
        """Test getting current user with valid token"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Get current user
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_EMAIL
        print(f"Current user: {data['name']}")
    
    def test_get_user_without_token(self):
        """Test that /auth/me requires authentication"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code in [401, 403]
        print("Unauthenticated request correctly rejected")


class TestChatEndpoints:
    """Chat/AI Tutor endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_suggested_topics(self, auth_token):
        """Test getting suggested topics"""
        response = requests.get(
            f"{BASE_URL}/api/chat/suggested-topics",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "topics" in data
        assert isinstance(data["topics"], list)
        print(f"Suggested topics: {data['topics']}")
    
    def test_send_chat_message(self, auth_token):
        """Test sending a chat message and receiving AI response"""
        response = requests.post(
            f"{BASE_URL}/api/chat/send",
            json={
                "session_id": "test_session_123",
                "message": "What is 2+2?"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert len(data["response"]) > 0
        print(f"AI response received (length: {len(data['response'])} chars)")
        
        # Check follow-ups are returned
        if "follow_ups" in data:
            print(f"Follow-up suggestions: {data['follow_ups']}")
    
    def test_quick_action(self, auth_token):
        """Test quick action endpoint (Explain Simpler, Give Example, etc.)"""
        response = requests.post(
            f"{BASE_URL}/api/chat/quick-action",
            json={
                "action": "simpler",
                "last_response": "This is a test response about math.",
                "session_id": "test_session_123"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        print(f"Quick action response received (length: {len(data['response'])} chars)")
    
    def test_get_chat_history(self, auth_token):
        """Test getting chat history for a session"""
        response = requests.get(
            f"{BASE_URL}/api/chat/history/test_session_123",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Chat history contains {len(data)} messages")


class TestGameEndpoints:
    """Game session endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_game_stats(self, auth_token):
        """Test getting game statistics"""
        response = requests.get(
            f"{BASE_URL}/api/games/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_games" in data
        assert "average_score" in data
        assert "average_accuracy" in data
        print(f"Game stats: {data['total_games']} games, avg score: {data['average_score']}")
    
    def test_create_game_session(self, auth_token):
        """Test creating a new game session"""
        response = requests.post(
            f"{BASE_URL}/api/games/session",
            json={
                "game_type": "memory",
                "score": 85.0,
                "accuracy": 90.0,
                "response_time": 2.5,
                "mistakes": 2,
                "completion_time": 60.0,
                "metadata": {"level": 1}
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["game_type"] == "memory"
        assert data["score"] == 85.0
        print(f"Game session created with ID: {data['id']}")
    
    def test_get_game_sessions(self, auth_token):
        """Test getting list of game sessions"""
        response = requests.get(
            f"{BASE_URL}/api/games/sessions",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} game sessions")


class TestAnalyticsEndpoints:
    """Analytics dashboard endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_analytics_dashboard(self, auth_token):
        """Test getting analytics dashboard data"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/dashboard",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "recent_progress" in data
        assert "total_games_played" in data
        print(f"Analytics: {data['total_games_played']} total games")


class TestLearningProfile:
    """Learning profile endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_learning_profile(self, auth_token):
        """Test getting learning profile (may return 404 if not enough games played)"""
        response = requests.get(
            f"{BASE_URL}/api/profile/learning",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # Profile may not exist if user hasn't played enough games
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "attention_level" in data
            assert "learning_style" in data
            print(f"Learning profile: {data['learning_style']} learner")
        else:
            print("Learning profile not yet generated (need more game sessions)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
