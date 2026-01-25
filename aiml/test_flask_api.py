#!/usr/bin/env python3
"""
Test script for Flask Ollama API
This script helps test the Flask API endpoints
"""

import requests
import json
import time

# Configuration
FLASK_URL = "http://localhost:5001"
OLLAMA_URL = "http://localhost:11434"

def test_health():
    """Test the health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{FLASK_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_ollama_connection():
    """Test if Ollama is running"""
    print("🔍 Testing Ollama connection...")
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags")
        if response.status_code == 200:
            data = response.json()
            models = [model['name'] for model in data.get('models', [])]
            print(f"✅ Ollama is running. Available models: {models}")
            return True
        else:
            print(f"❌ Ollama connection failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ollama connection error: {e}")
        return False

def test_generate_graph_json(query):
    """Test the graph JSON generation endpoint"""
    print(f"🔍 Testing graph generation with query: '{query}'")
    try:
        payload = {"query": query}
        response = requests.post(
            f"{FLASK_URL}/generate-graph-json",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Graph generation successful!")
            print(f"📊 Generated JSON: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ Graph generation failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Graph generation error: {e}")
        return False

def test_list_models():
    """Test the list models endpoint"""
    print("🔍 Testing list models endpoint...")
    try:
        response = requests.get(f"{FLASK_URL}/list-models")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Models listed successfully: {data}")
            return True
        else:
            print(f"❌ List models failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ List models error: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Starting Flask Ollama API Tests")
    print("=" * 50)
    
    # Test 1: Health check
    if not test_health():
        print("❌ Health check failed. Make sure Flask server is running.")
        return
    
    # Test 2: Ollama connection
    if not test_ollama_connection():
        print("❌ Ollama connection failed. Make sure Ollama is running.")
        return
    
    # Test 3: List models
    test_list_models()
    
    # Test 4: Generate graph JSON with different queries
    test_queries = [
        "Create a small bar chart showing sales data",
        "Create a line chart for temperature trends",
        "Make a pie chart for market share",
        "Create a large scatter plot for correlation analysis"
    ]
    
    print("\n📊 Testing graph generation with various queries:")
    print("-" * 50)
    
    for i, query in enumerate(test_queries, 1):
        print(f"\nTest {i}: {query}")
        test_generate_graph_json(query)
        time.sleep(1)  # Small delay between requests
    
    print("\n🎉 All tests completed!")

if __name__ == "__main__":
    main()
