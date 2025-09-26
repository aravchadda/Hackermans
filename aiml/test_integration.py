#!/usr/bin/env python3
"""
Test script to verify the Node.js and Flask API integration
"""

import requests
import json
import time

def test_flask_api():
    """Test Flask API directly"""
    print("🧪 Testing Flask API directly...")
    try:
        response = requests.post(
            "http://localhost:5000/generate-graph-json",
            json={"query": "Create a small bar chart showing sales data"},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Flask API working")
            print(f"Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ Flask API error: {response.status_code}")
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Flask API connection failed: {e}")
        return False

def test_nodejs_api():
    """Test Node.js API chatbot endpoint"""
    print("\n🧪 Testing Node.js API chatbot endpoint...")
    try:
        response = requests.post(
            "http://localhost:4000/api/chatbot/query",
            json={"query": "Create a small bar chart showing sales data"},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Node.js API working")
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
    
    # Test Flask health
    try:
        response = requests.get("http://localhost:5000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Flask health check passed")
        else:
            print(f"❌ Flask health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Flask health check failed: {e}")
    
    # Test Node.js health
    try:
        response = requests.get("http://localhost:4000/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Node.js health check passed")
            print(f"Flask status: {data.get('flask', {}).get('status', 'unknown')}")
        else:
            print(f"❌ Node.js health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Node.js health check failed: {e}")

def main():
    print("🚀 Testing Node.js and Flask API Integration")
    print("=" * 60)
    
    # Test health endpoints first
    test_health_endpoints()
    
    # Test Flask API directly
    flask_working = test_flask_api()
    
    # Test Node.js API (which should call Flask)
    nodejs_working = test_nodejs_api()
    
    print("\n" + "=" * 60)
    print("📊 Integration Test Results:")
    print(f"Flask API: {'✅ Working' if flask_working else '❌ Failed'}")
    print(f"Node.js API: {'✅ Working' if nodejs_working else '❌ Failed'}")
    
    if flask_working and nodejs_working:
        print("🎉 Integration successful! Both APIs are working together.")
    else:
        print("⚠️  Some issues detected. Check the logs above.")

if __name__ == "__main__":
    main()
