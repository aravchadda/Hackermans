#!/usr/bin/env python3
"""
Quick test script for insights functionality
Simple script to test one query at a time
"""

import requests
import json

def test_single_query(query):
    """Test a single query and print the result"""
    url = "http://localhost:5001/insights/query"
    payload = {"query": query}
    
    print(f"Testing: '{query}'")
    print("-" * 50)
    
    try:
        response = requests.post(url, json=payload, timeout=100)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Success!")
            print(f"Query ID: {data.get('query_identifier')}")
            print(f"Description: {data.get('description')}")
            print("\nSQL Query:")
            print(data.get('sql_query'))
        else:
            print(f"❌ Failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    print("Quick Insights Test")
    print("=" * 30)
    
    # Test if server is running
    try:
        health = requests.get("http://localhost:5001/health", timeout=5)
        if health.status_code == 200:
            print("✅ Flask server is running")
        else:
            print("❌ Flask server not responding")
            return
    except:
        print("❌ Cannot connect to Flask server")
        print("Make sure to run: python flask-ollama-app.py")
        return
    
    # Test queries
    test_queries = [
        "Show me daily throughput trends",
        "Which bays are performing best?",
        "What are the flow rate issues?",
        "How are we doing with schedule adherence?",
        "Which products are most profitable?",
        "What are the peak operating hours?"
    ]
    
    for query in test_queries:
        test_single_query(query)
        print("\n" + "=" * 50 + "\n")

if __name__ == "__main__":
    main()
