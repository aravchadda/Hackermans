#!/usr/bin/env python3
"""
Simple runner for Predictive Throughput Forecasting
==================================================

Easy-to-use script for running the throughput forecasting analysis
with automatic dependency checking and error handling.
"""

import sys
import subprocess
import os
from pathlib import Path

def check_dependencies():
    """Check if required packages are installed."""
    required_packages = [
        'pandas', 'numpy', 'matplotlib', 'seaborn', 
        'scikit-learn', 'statsmodels', 'scipy'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    return missing_packages

def install_dependencies():
    """Install missing dependencies."""
    print("📦 Installing required dependencies...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("✅ Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def main():
    """Main function to run the forecasting analysis."""
    print("🚀 PREDICTIVE THROUGHPUT FORECASTING")
    print("=" * 50)
    
    # Check if CSV file exists
    csv_path = r"C:\Users\dell\Desktop\hackspace\Hackermans\backend\Shipment 1.xlsx - Sheet1.csv"
    if not os.path.exists(csv_path):
        print(f"❌ CSV file not found at: {csv_path}")
        print("Please ensure the shipment data file exists at the specified location.")
        return
    
    # Check dependencies
    print("🔍 Checking dependencies...")
    missing_packages = check_dependencies()
    
    if missing_packages:
        print(f"⚠️  Missing packages: {', '.join(missing_packages)}")
        print("Installing missing dependencies...")
        
        if not install_dependencies():
            print("❌ Failed to install dependencies. Please install manually:")
            print("pip install -r requirements.txt")
            return
    else:
        print("✅ All dependencies are available!")
    
    # Run the analysis
    print("\n📊 Starting throughput forecasting analysis...")
    try:
        from throughput_forecasting import ThroughputForecaster
        
        forecaster = ThroughputForecaster(csv_path)
        forecaster.run_complete_analysis()
        
        print("\n🎉 Analysis completed successfully!")
        print("📈 Check the generated line graphs for detailed insights")
        print("📋 Review the forecasting_insights.txt file for recommendations")
        
    except Exception as e:
        print(f"❌ Error during analysis: {e}")
        print("Please check the error message and try again.")

if __name__ == "__main__":
    main()
