# Shipment Anomaly Detection System

A lightweight machine learning system for detecting anomalies in shipment data using the Scheduled Time metric.

## Features

- **Lightweight ML Model**: Uses Isolation Forest algorithm for efficient anomaly detection
- **Time-based Analysis**: Analyzes patterns based on Scheduled Time column
- **JSON Output**: Generates structured JSON output for React frontend integration
- **Pattern Analysis**: Identifies hourly, daily, monthly, bay, and product patterns
- **REST API**: Provides HTTP endpoints for frontend integration

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run Anomaly Detection

```bash
python run_anomaly_detection.py
```

This will:
- Load the CSV data from `../backend/Shipment 1.xlsx - Sheet1.csv`
- Process ~99,000 records
- Detect anomalies using Isolation Forest
- Generate `anomaly_results.json` with results

### 3. Start API Server (Optional)

```bash
python api_server.py
```

The API server will run on `http://localhost:5000` with the following endpoints:

- `GET /api/anomalies` - Get all anomaly data
- `POST /api/anomalies/refresh` - Re-run detection
- `GET /api/anomalies/summary` - Get summary statistics
- `GET /api/anomalies/patterns` - Get anomaly patterns
- `GET /api/anomalies/records` - Get anomaly records (with filtering)
- `GET /api/health` - Health check

## Output Format

The system generates a comprehensive JSON output with the following structure:

```json
{
  "summary": {
    "total_records": 98998,
    "anomaly_count": 4950,
    "anomaly_percentage": 5.0,
    "date_range": {
      "start": "2014-07-24 06:03:21",
      "end": "2017-11-07 21:30:43"
    },
    "detection_timestamp": "2025-09-27 02:15:58"
  },
  "anomaly_patterns": {
    "hourly_frequency": { "22": 533, "23": 515, ... },
    "daily_frequency": { "Sunday": 1704, "Monday": 883, ... },
    "monthly_frequency": { "January": 1011, "October": 560, ... },
    "bay_frequency": { "LANE01": 3253, "LANE02": 996, ... },
    "product_frequency": { "210403": 4500, "210404": 450, ... }
  },
  "anomaly_records": [
    {
      "shipment_id": "...",
      "shipment_code": "...",
      "scheduled_date": "2016-09-11 20:40:52",
      "bay_code": "LANE01",
      "base_product_code": "210403",
      "gross_quantity": 0,
      "flow_rate": 10,
      "anomaly_score": -0.15,
      "hour": 20,
      "day_of_week": 6,
      "month": 9
    }
  ],
  "model_info": {
    "algorithm": "Isolation Forest",
    "contamination_rate": 0.05,
    "features_used": ["GrossQuantity", "FlowRate", "hour", "day_of_week", "day_of_month", "month"]
  }
}
```

## Algorithm Details

### Isolation Forest
- **Algorithm**: Isolation Forest (lightweight and efficient)
- **Contamination Rate**: 5% (configurable)
- **Features Used**: 
  - GrossQuantity
  - FlowRate
  - Hour of day (extracted from ScheduledDate)
  - Day of week
  - Day of month
  - Month

### Time-based Features
The system extracts temporal features from the `ScheduledDate` column:
- Hour of day (0-23)
- Day of week (0-6, Monday-Sunday)
- Day of month (1-31)
- Month (1-12)

## React Frontend Integration

### Using the JSON File
```javascript
// Load the results
const results = await fetch('/path/to/anomaly_results.json').then(r => r.json());

// Access summary
console.log(`Found ${results.summary.anomaly_count} anomalies`);

// Access patterns
const hourlyPatterns = results.anomaly_patterns.hourly_frequency;

// Access individual records
const anomalies = results.anomaly_records;
```

### Using the API
```javascript
// Get all data
const response = await fetch('http://localhost:5000/api/anomalies');
const data = await response.json();

// Get filtered records
const filtered = await fetch('http://localhost:5000/api/anomalies/records?bay_code=LANE01&limit=100');
const records = await filtered.json();
```

## Performance

- **Processing Time**: ~30-60 seconds for 99,000 records
- **Memory Usage**: ~200-300 MB peak
- **Accuracy**: Isolation Forest provides good anomaly detection with minimal false positives
- **Scalability**: Can handle datasets up to several million records

## Configuration

You can modify the contamination rate in `anomaly_detector.py`:

```python
detector = ShipmentAnomalyDetector(contamination=0.05)  # 5% expected anomalies
```

Higher values will detect more anomalies, lower values will be more conservative.

## Files

- `anomaly_detector.py` - Main anomaly detection class
- `run_anomaly_detection.py` - Simple runner script
- `api_server.py` - Flask API server
- `requirements.txt` - Python dependencies
- `anomaly_results.json` - Generated results (after running detection)
