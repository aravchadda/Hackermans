#!/usr/bin/env python3
"""
Flask API server for anomaly detection results
"""

from flask import Flask, jsonify, request
import json
import os
from datetime import datetime
from anomaly_detector import ShipmentAnomalyDetector

app = Flask(__name__)

# Global variable to store the latest results
latest_results = None

@app.route('/api/anomalies', methods=['GET'])
def get_anomalies():
    """
    Get anomaly detection results
    """
    global latest_results
    
    # Check if we have cached results
    if latest_results is None:
        # Try to load from file if it exists
        results_file = 'anomaly_results.json'
        if os.path.exists(results_file):
            try:
                with open(results_file, 'r') as f:
                    latest_results = json.load(f)
            except Exception as e:
                return jsonify({'error': f'Failed to load results: {str(e)}'}), 500
        else:
            return jsonify({'error': 'No anomaly detection results available. Run detection first.'}), 404
    
    return jsonify(latest_results)

@app.route('/api/anomalies/refresh', methods=['POST'])
def refresh_anomalies():
    """
    Re-run anomaly detection and return fresh results
    """
    global latest_results
    
    try:
        # Initialize detector
        detector = ShipmentAnomalyDetector(contamination=0.05)
        
        # Path to CSV file
        csv_path = r"C:\Users\dell\Desktop\hackspace\Hackermans\backend\Shipment 1.xlsx - Sheet1.csv"
        
        # Run detection
        df_processed, anomalies = detector.detect_anomalies(csv_path)
        
        # Generate output
        latest_results = detector.generate_json_output(df_processed, anomalies)
        
        # Save to file
        with open('anomaly_results.json', 'w') as f:
            json.dump(latest_results, f, indent=2)
        
        return jsonify({
            'message': 'Anomaly detection completed successfully',
            'summary': latest_results['summary']
        })
        
    except Exception as e:
        return jsonify({'error': f'Anomaly detection failed: {str(e)}'}), 500

@app.route('/api/anomalies/summary', methods=['GET'])
def get_summary():
    """
    Get just the summary statistics
    """
    global latest_results
    
    if latest_results is None:
        return jsonify({'error': 'No results available'}), 404
    
    return jsonify(latest_results['summary'])

@app.route('/api/anomalies/patterns', methods=['GET'])
def get_patterns():
    """
    Get anomaly patterns
    """
    global latest_results
    
    if latest_results is None:
        return jsonify({'error': 'No results available'}), 404
    
    return jsonify(latest_results['anomaly_patterns'])

@app.route('/api/anomalies/records', methods=['GET'])
def get_anomaly_records():
    """
    Get anomaly records with optional filtering
    """
    global latest_results
    
    if latest_results is None:
        return jsonify({'error': 'No results available'}), 404
    
    # Get query parameters for filtering
    limit = request.args.get('limit', type=int)
    bay_code = request.args.get('bay_code')
    product_code = request.args.get('product_code')
    
    records = latest_results['anomaly_records']
    
    # Apply filters
    if bay_code:
        records = [r for r in records if r['bay_code'] == bay_code]
    
    if product_code:
        records = [r for r in records if r['base_product_code'] == product_code]
    
    # Apply limit
    if limit:
        records = records[:limit]
    
    return jsonify({
        'records': records,
        'total_filtered': len(records),
        'total_available': len(latest_results['anomaly_records'])
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'has_results': latest_results is not None
    })

if __name__ == '__main__':
    print("Starting Anomaly Detection API Server...")
    print("Available endpoints:")
    print("  GET  /api/anomalies - Get all anomaly data")
    print("  POST /api/anomalies/refresh - Re-run detection")
    print("  GET  /api/anomalies/summary - Get summary only")
    print("  GET  /api/anomalies/patterns - Get patterns only")
    print("  GET  /api/anomalies/records - Get anomaly records (with optional filtering)")
    print("  GET  /api/health - Health check")
    print("\nStarting server on http://localhost:5000")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
