import pandas as pd
import numpy as np
from datetime import datetime
import json
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

class ShipmentAnomalyDetector:
    def __init__(self, contamination=0.1):
        """
        Initialize the anomaly detector with Isolation Forest
        contamination: Expected proportion of anomalies in the dataset
        """
        self.contamination = contamination
        self.model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )
        self.scaler = StandardScaler()
        self.is_fitted = False
        
    def preprocess_data(self, df):
        """
        Preprocess the data for anomaly detection
        """
        # Convert ScheduledDate to datetime
        df['ScheduledDate'] = pd.to_datetime(df['ScheduledDate'])
        
        # Extract time-based features
        df['hour'] = df['ScheduledDate'].dt.hour
        df['day_of_week'] = df['ScheduledDate'].dt.dayofweek
        df['day_of_month'] = df['ScheduledDate'].dt.day
        df['month'] = df['ScheduledDate'].dt.month
        
        # Convert to numeric timestamp for time series analysis
        df['timestamp'] = df['ScheduledDate'].astype(np.int64) // 10**9
        
        # Create features for anomaly detection
        features = ['GrossQuantity', 'FlowRate', 'hour', 'day_of_week', 'day_of_month', 'month']
        
        # Handle any missing values
        df[features] = df[features].fillna(df[features].mean())
        
        return df, features
    
    def detect_anomalies(self, csv_path):
        """
        Detect anomalies in the shipment data
        """
        print("Loading data...")
        # Load the CSV file
        df = pd.read_csv(csv_path)
        
        print(f"Loaded {len(df)} records")
        
        # Preprocess the data
        df_processed, features = self.preprocess_data(df.copy())
        
        # Prepare features for training
        X = df_processed[features].values
        
        # Scale the features
        X_scaled = self.scaler.fit_transform(X)
        
        # Fit the isolation forest model
        print("Training anomaly detection model...")
        self.model.fit(X_scaled)
        self.is_fitted = True
        
        # Predict anomalies
        print("Detecting anomalies...")
        anomaly_scores = self.model.decision_function(X_scaled)
        anomaly_predictions = self.model.predict(X_scaled)
        
        # Add anomaly information to dataframe
        df_processed['anomaly_score'] = anomaly_scores
        df_processed['is_anomaly'] = anomaly_predictions == -1
        
        # Get anomalies
        anomalies = df_processed[df_processed['is_anomaly']].copy()
        
        print(f"Found {len(anomalies)} anomalies out of {len(df_processed)} records")
        
        return df_processed, anomalies
    
    def analyze_anomaly_patterns(self, anomalies):
        """
        Analyze patterns in the detected anomalies
        """
        if len(anomalies) == 0:
            return {
                "hourly_frequency": {},
                "daily_frequency": {},
                "monthly_frequency": {},
                "bay_frequency": {},
                "product_frequency": {}
            }
        
        # Hourly frequency
        hourly_freq = anomalies['hour'].value_counts().to_dict()
        
        # Daily frequency (day of week)
        daily_freq = anomalies['day_of_week'].value_counts().to_dict()
        day_names = {0: 'Monday', 1: 'Tuesday', 2: 'Wednesday', 3: 'Thursday', 
                    4: 'Friday', 5: 'Saturday', 6: 'Sunday'}
        daily_freq = {day_names[k]: v for k, v in daily_freq.items()}
        
        # Monthly frequency
        monthly_freq = anomalies['month'].value_counts().to_dict()
        month_names = {1: 'January', 2: 'February', 3: 'March', 4: 'April',
                      5: 'May', 6: 'June', 7: 'July', 8: 'August',
                      9: 'September', 10: 'October', 11: 'November', 12: 'December'}
        monthly_freq = {month_names[k]: v for k, v in monthly_freq.items()}
        
        # Bay frequency
        bay_freq = anomalies['BayCode'].value_counts().to_dict()
        
        # Product frequency
        product_freq = anomalies['BaseProductCode'].value_counts().to_dict()
        
        return {
            "hourly_frequency": hourly_freq,
            "daily_frequency": daily_freq,
            "monthly_frequency": monthly_freq,
            "bay_frequency": bay_freq,
            "product_frequency": product_freq
        }
    
    def generate_json_output(self, df_processed, anomalies):
        """
        Generate JSON output for React frontend
        """
        # Analyze anomaly patterns
        patterns = self.analyze_anomaly_patterns(anomalies)
        
        # Prepare anomaly records for frontend
        anomaly_records = []
        for idx, row in anomalies.iterrows():
            anomaly_records.append({
                "shipment_id": row['ShipmentID'],
                "shipment_code": row['ShipmentCode'],
                "scheduled_date": row['ScheduledDate'].strftime('%Y-%m-%d %H:%M:%S'),
                "bay_code": row['BayCode'],
                "base_product_code": row['BaseProductCode'],
                "gross_quantity": int(row['GrossQuantity']),
                "flow_rate": int(row['FlowRate']),
                "anomaly_score": float(row['anomaly_score']),
                "hour": int(row['hour']),
                "day_of_week": int(row['day_of_week']),
                "month": int(row['month'])
            })
        
        # Calculate summary statistics
        total_records = len(df_processed)
        anomaly_count = len(anomalies)
        anomaly_percentage = (anomaly_count / total_records) * 100
        
        # Get date range
        min_date = df_processed['ScheduledDate'].min().strftime('%Y-%m-%d %H:%M:%S')
        max_date = df_processed['ScheduledDate'].max().strftime('%Y-%m-%d %H:%M:%S')
        
        # Create the final JSON output
        output = {
            "summary": {
                "total_records": total_records,
                "anomaly_count": anomaly_count,
                "anomaly_percentage": round(anomaly_percentage, 2),
                "date_range": {
                    "start": min_date,
                    "end": max_date
                },
                "detection_timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            },
            "anomaly_patterns": patterns,
            "anomaly_records": anomaly_records,
            "model_info": {
                "algorithm": "Isolation Forest",
                "contamination_rate": self.contamination,
                "features_used": ["GrossQuantity", "FlowRate", "hour", "day_of_week", "day_of_month", "month"]
            }
        }
        
        return output

def main():
    """
    Main function to run anomaly detection
    """
    # Initialize the detector
    detector = ShipmentAnomalyDetector(contamination=0.05)  # 5% expected anomalies
    
    # Path to the CSV file
    csv_path = r"C:\Users\dell\Desktop\hackspace\Hackermans\backend\Shipment 1.xlsx - Sheet1.csv"
    
    try:
        # Detect anomalies
        df_processed, anomalies = detector.detect_anomalies(csv_path)
        
        # Generate JSON output
        output = detector.generate_json_output(df_processed, anomalies)
        
        # Save to JSON file
        output_path = r"C:\Users\dell\Desktop\hackspace\Hackermans\aiml\anomaly detection\anomaly_results.json"
        with open(output_path, 'w') as f:
            json.dump(output, f, indent=2)
        
        print(f"\nAnomaly detection completed!")
        print(f"Results saved to: {output_path}")
        print(f"Total records: {output['summary']['total_records']}")
        print(f"Anomalies detected: {output['summary']['anomaly_count']}")
        print(f"Anomaly percentage: {output['summary']['anomaly_percentage']}%")
        
        return output
        
    except Exception as e:
        print(f"Error during anomaly detection: {str(e)}")
        return None

if __name__ == "__main__":
    main()
