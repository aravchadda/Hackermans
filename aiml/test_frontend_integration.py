#!/usr/bin/env python3
"""
Test script to verify the frontend-backend integration
"""

import requests
import json
import time

def test_nodejs_chatbot_endpoint():
    """Test the Node.js chatbot endpoint directly"""
    print("🧪 Testing Node.js chatbot endpoint...")
    
    try:
        response = requests.post(
            "http://localhost:4000/api/chatbot/query",
            json={"query": "create a bar graph between ScheduledDate and GrossQuantity"},
            timeout=120  # 120 seconds
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Node.js chatbot endpoint working")
            print(f"Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ Node.js API error: {response.status_code}")
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Node.js API connection failed: {e}")
        return False

def test_health_endpoints():
    """Test health endpoints"""
    print("\n🧪 Testing health endpoints...")
    
    # Test Node.js health
    try:
        response = requests.get("http://localhost:4000/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Node.js health check passed")
            print(f"Flask status: {data.get('flask', {}).get('status', 'unknown')}")
        else:
            print(f"❌ Node.js health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Node.js health check failed: {e}")

def main():
    print("🚀 Testing Frontend-Backend Integration")
    print("=" * 60)
    
    # Test health endpoints first
    test_health_endpoints()
    
    # Test Node.js chatbot endpoint
    chatbot_working = test_nodejs_chatbot_endpoint()
    
    print("\n" + "=" * 60)
    print("📊 Integration Test Results:")
    print(f"Node.js Chatbot API: {'✅ Working' if chatbot_working else '❌ Failed'}")
    
    if chatbot_working:
        print("🎉 Integration successful! The frontend should now work properly.")
        print("\n📝 Next steps:")
        print("1. Start the React frontend: cd Hackermans/frontend/terminal && npm start")
        print("2. Test the chatbot functionality in the UI")
    else:
        print("⚠️  Issues detected. Check the logs above.")

if __name__ == "__main__":
    main()
