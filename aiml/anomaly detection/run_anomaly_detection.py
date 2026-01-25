#!/usr/bin/env python3
"""
Simple runner script for anomaly detection
"""

import sys
import os
from anomaly_detector import main

if __name__ == "__main__":
    print("Starting Shipment Anomaly Detection...")
    print("=" * 50)
    
    try:
        result = main()
        if result:
            print("\n" + "=" * 50)
            print("ANOMALY DETECTION SUMMARY")
            print("=" * 50)
            print(f"Total Records Processed: {result['summary']['total_records']:,}")
            print(f"Anomalies Detected: {result['summary']['anomaly_count']:,}")
            print(f"Anomaly Rate: {result['summary']['anomaly_percentage']:.2f}%")
            print(f"Date Range: {result['summary']['date_range']['start']} to {result['summary']['date_range']['end']}")
            
            print("\nTop Anomaly Patterns:")
            print("-" * 30)
            
            # Show top hourly patterns
            hourly = result['anomaly_patterns']['hourly_frequency']
            if hourly:
                top_hours = sorted(hourly.items(), key=lambda x: x[1], reverse=True)[:5]
                print("Top Hours with Anomalies:")
                for hour, count in top_hours:
                    print(f"  Hour {hour}: {count} anomalies")
            
            # Show top bays
            bays = result['anomaly_patterns']['bay_frequency']
            if bays:
                top_bays = sorted(bays.items(), key=lambda x: x[1], reverse=True)[:3]
                print("\nTop Bays with Anomalies:")
                for bay, count in top_bays:
                    print(f"  {bay}: {count} anomalies")
            
            print(f"\nDetailed results saved to: anomaly_results.json")
        else:
            print("Anomaly detection failed!")
            sys.exit(1)
            
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)
