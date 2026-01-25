#!/usr/bin/env python3
"""
Predictive Throughput Forecasting with Line Graphs
=================================================

A focused solution for analyzing shipment throughput patterns and generating
predictive forecasts with comprehensive line graph visualizations.

Author: AI Assistant
Date: 2024
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Time series analysis
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import adfuller
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
from statsmodels.tsa.seasonal import seasonal_decompose

class ThroughputForecaster:
    """
    Main class for predictive throughput forecasting with line graph visualizations.
    """
    
    def __init__(self, csv_path):
        """Initialize the forecaster with CSV file path."""
        self.csv_path = csv_path
        self.df = None
        self.insights = {}
        self.forecasts = {}
        
    def load_and_prepare_data(self):
        """Load and prepare the shipment data for analysis."""
        print("📊 Loading and preparing shipment data...")
        
        # Load data with sampling for efficiency
        self.df = pd.read_csv(self.csv_path, nrows=50000)  # Sample for faster processing
        print(f"✅ Loaded {len(self.df):,} records")
        
        # Convert time columns with better error handling
        time_columns = ['ExitTime', 'ScheduledDate', 'CreatedTime']
        for col in time_columns:
            if col in self.df.columns:
                try:
                    self.df[col] = pd.to_datetime(self.df[col], errors='coerce')
                    print(f"✅ Converted {col} to datetime")
                except Exception as e:
                    print(f"⚠️ Could not convert {col}: {e}")
        
        # Set ExitTime as index for time series (only if it exists and has valid data)
        if 'ExitTime' in self.df.columns and self.df['ExitTime'].notna().sum() > 0:
            try:
                self.df = self.df.set_index('ExitTime').sort_index()
                self.df = self.df.dropna(subset=['ExitTime'])
                print(f"✅ Set ExitTime as index, {len(self.df)} valid records")
            except Exception as e:
                print(f"⚠️ Could not set ExitTime as index: {e}")
                # Create a simple numeric index instead
                self.df = self.df.reset_index(drop=True)
        else:
            print("⚠️ No valid ExitTime data found, using numeric index")
            self.df = self.df.reset_index(drop=True)
        
        return self.df
    
    def analyze_data_statistics(self):
        """Analyze data statistics and generate insights."""
        print("\n📈 Analyzing data statistics...")
        
        # Basic statistics
        stats = {
            'total_records': len(self.df),
            'date_range': f"{self.df.index.min()} to {self.df.index.max()}",
            'numeric_columns': list(self.df.select_dtypes(include=[np.number]).columns)
        }
        
        # Analyze each numeric column
        for col in stats['numeric_columns']:
            if col in self.df.columns:
                col_data = self.df[col].dropna()
                stats[f'{col}_mean'] = col_data.mean()
                stats[f'{col}_median'] = col_data.median()
                stats[f'{col}_mode'] = col_data.mode().iloc[0] if not col_data.mode().empty else 'N/A'
                stats[f'{col}_std'] = col_data.std()
                stats[f'{col}_min'] = col_data.min()
                stats[f'{col}_max'] = col_data.max()
        
        self.insights['statistics'] = stats
        return stats
    
    def create_time_series_data(self):
        """Create time series aggregations for forecasting."""
        print("\n⏰ Creating time series data...")
        
        try:
            # Check if we have a datetime index
            if isinstance(self.df.index, pd.DatetimeIndex):
                # Daily aggregations
                daily_data = self.df.groupby(self.df.index.date).agg({
                    'GrossQuantity': 'sum',
                    'FlowRate': 'mean',
                    'ShipmentID': 'count'
                }).rename(columns={'ShipmentID': 'ShipmentCount'})
                
                # Hourly aggregations
                hourly_data = self.df.groupby([
                    self.df.index.date,
                    self.df.index.hour
                ]).agg({
                    'GrossQuantity': 'sum',
                    'FlowRate': 'mean',
                    'ShipmentID': 'count'
                }).rename(columns={'ShipmentID': 'ShipmentCount'})
                
                print(f"✅ Created daily aggregations: {len(daily_data)} days")
                print(f"✅ Created hourly aggregations: {len(hourly_data)} hour periods")
                
            else:
                # Create simple aggregations without time grouping
                print("⚠️ No datetime index found, creating simple aggregations")
                daily_data = self.df.groupby(self.df.index // 1000).agg({
                    'GrossQuantity': 'sum',
                    'FlowRate': 'mean',
                    'ShipmentID': 'count'
                }).rename(columns={'ShipmentID': 'ShipmentCount'})
                
                hourly_data = daily_data.copy()  # Use same data for both
                
                print(f"✅ Created simple aggregations: {len(daily_data)} groups")
            
            self.insights['time_series'] = {
                'daily': daily_data,
                'hourly': hourly_data
            }
            
            return daily_data, hourly_data
            
        except Exception as e:
            print(f"⚠️ Error creating time series data: {e}")
            # Create fallback simple aggregations
            daily_data = self.df.agg({
                'GrossQuantity': 'sum',
                'FlowRate': 'mean',
                'ShipmentID': 'count'
            }).to_frame().T.rename(columns={'ShipmentID': 'ShipmentCount'})
            
            hourly_data = daily_data.copy()
            
            self.insights['time_series'] = {
                'daily': daily_data,
                'hourly': hourly_data
            }
            
            return daily_data, hourly_data
    
    def check_stationarity(self, series, title="Time Series"):
        """Check if time series is stationary."""
        result = adfuller(series.dropna())
        is_stationary = result[1] <= 0.05
        return is_stationary, result[1]
    
    def make_stationary(self, series):
        """Make time series stationary using differencing."""
        # Try first difference
        diff1 = series.diff().dropna()
        is_stationary, p_value = self.check_stationarity(diff1, "First Difference")
        
        if is_stationary:
            return diff1, 1
        else:
            # Try second difference
            diff2 = series.diff().diff().dropna()
            is_stationary, p_value = self.check_stationarity(diff2, "Second Difference")
            return diff2, 2
    
    def fit_arima_forecast(self, series, forecast_days=30):
        """Fit ARIMA model and generate forecasts."""
        print(f"\n🔮 Fitting ARIMA model for {len(series)} data points...")
        
        # Make stationary
        stationary_series, diff_order = self.make_stationary(series)
        
        # Find optimal ARIMA parameters
        best_aic = float('inf')
        best_params = (1, diff_order, 1)  # Default
        
        for p in range(3):
            for q in range(3):
                try:
                    model = ARIMA(series, order=(p, diff_order, q))
                    fitted_model = model.fit()
                    if fitted_model.aic < best_aic:
                        best_aic = fitted_model.aic
                        best_params = (p, diff_order, q)
                except:
                    continue
        
        # Fit final model
        model = ARIMA(series, order=best_params)
        fitted_model = model.fit()
        
        # Generate forecast
        forecast = fitted_model.forecast(steps=forecast_days)
        forecast_ci = fitted_model.get_forecast(steps=forecast_days).conf_int()
        
        # Create forecast index
        last_date = series.index[-1]
        if isinstance(last_date, pd.Timestamp):
            forecast_index = pd.date_range(start=last_date + timedelta(days=1), 
                                         periods=forecast_days, freq='D')
        else:
            forecast_index = range(len(series), len(series) + forecast_days)
        
        forecast_series = pd.Series(forecast, index=forecast_index)
        
        return {
            'model': fitted_model,
            'forecast': forecast_series,
            'forecast_ci': forecast_ci,
            'params': best_params,
            'aic': fitted_model.aic
        }
    
    def create_line_graphs(self, series, forecast_results, title="Throughput Forecast"):
        """Create comprehensive line graph visualizations."""
        print(f"\n📊 Creating line graphs for {title}...")
        
        # Set up the plotting style
        plt.style.use('seaborn-v0_8')
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle(f'{title} - Comprehensive Analysis', fontsize=16, fontweight='bold')
        
        # Plot 1: Main forecast line graph
        ax1 = axes[0, 0]
        ax1.plot(series.index, series.values, label='Historical Data', 
                color='blue', linewidth=2, alpha=0.8)
        ax1.plot(forecast_results['forecast'].index, forecast_results['forecast'].values, 
                label='ARIMA Forecast', color='red', linewidth=2)
        
        # Add confidence intervals
        if 'forecast_ci' in forecast_results:
            ci = forecast_results['forecast_ci']
            ax1.fill_between(forecast_results['forecast'].index, 
                           ci.iloc[:, 0], ci.iloc[:, 1], 
                           alpha=0.3, color='red', label='95% Confidence Interval')
        
        ax1.set_title('Time Series Forecast with ARIMA')
        ax1.set_xlabel('Date')
        ax1.set_ylabel('Value')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # Plot 2: Trend analysis
        ax2 = axes[0, 1]
        try:
            decomposition = seasonal_decompose(series, model='additive', period=7)
            ax2.plot(series.index, decomposition.trend, color='green', linewidth=2)
            ax2.set_title('Trend Component')
            ax2.set_xlabel('Date')
            ax2.set_ylabel('Trend')
            ax2.grid(True, alpha=0.3)
        except:
            ax2.text(0.5, 0.5, 'Trend analysis\nnot available', 
                    ha='center', va='center', transform=ax2.transAxes)
            ax2.set_title('Trend Component (Not Available)')
        
        # Plot 3: ACF plot
        ax3 = axes[1, 0]
        plot_acf(series.dropna(), ax=ax3, lags=20, alpha=0.05)
        ax3.set_title('Autocorrelation Function (ACF)')
        ax3.grid(True, alpha=0.3)
        
        # Plot 4: PACF plot
        ax4 = axes[1, 1]
        plot_pacf(series.dropna(), ax=ax4, lags=20, alpha=0.05)
        ax4.set_title('Partial Autocorrelation Function (PACF)')
        ax4.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.show()
        
        # Create capacity planning line graph
        self.create_capacity_planning_graph(series, forecast_results, title)
    
    def create_capacity_planning_graph(self, series, forecast_results, title):
        """Create capacity planning specific line graphs."""
        fig, axes = plt.subplots(2, 2, figsize=(16, 10))
        fig.suptitle(f'{title} - Capacity Planning Analysis', fontsize=16, fontweight='bold')
        
        # Plot 1: Throughput vs Capacity
        ax1 = axes[0, 0]
        ax1.plot(series.index, series.values, label='Historical Throughput', 
                color='blue', linewidth=2)
        ax1.plot(forecast_results['forecast'].index, forecast_results['forecast'].values, 
                label='Forecasted Throughput', color='red', linewidth=2)
        
        # Add capacity thresholds
        mean_throughput = series.mean()
        max_throughput = series.max()
        warning_threshold = mean_throughput * 1.2
        critical_threshold = mean_throughput * 1.5
        
        ax1.axhline(y=warning_threshold, color='orange', linestyle='--', 
                   label=f'Warning Threshold ({warning_threshold:.1f})')
        ax1.axhline(y=critical_threshold, color='red', linestyle='--', 
                   label=f'Critical Threshold ({critical_threshold:.1f})')
        
        ax1.set_title('Throughput vs Capacity Thresholds')
        ax1.set_xlabel('Date')
        ax1.set_ylabel('Throughput')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # Plot 2: Capacity utilization
        ax2 = axes[0, 1]
        utilization = (series / max_throughput) * 100
        forecast_utilization = (forecast_results['forecast'] / max_throughput) * 100
        
        ax2.plot(series.index, utilization, label='Historical Utilization', 
                color='blue', linewidth=2)
        ax2.plot(forecast_results['forecast'].index, forecast_utilization, 
                label='Forecasted Utilization', color='red', linewidth=2)
        ax2.axhline(y=80, color='orange', linestyle='--', label='80% Warning')
        ax2.axhline(y=95, color='red', linestyle='--', label='95% Critical')
        
        ax2.set_title('Capacity Utilization Trends')
        ax2.set_xlabel('Date')
        ax2.set_ylabel('Utilization (%)')
        ax2.legend()
        ax2.grid(True, alpha=0.3)
        
        # Plot 3: Peak time analysis
        ax3 = axes[1, 0]
        if hasattr(series.index, 'hour'):
            hourly_avg = series.groupby(series.index.hour).mean()
            ax3.plot(hourly_avg.index, hourly_avg.values, marker='o', 
                    color='green', linewidth=2)
            ax3.set_title('Average Throughput by Hour')
            ax3.set_xlabel('Hour of Day')
            ax3.set_ylabel('Average Throughput')
            ax3.grid(True, alpha=0.3)
        else:
            # Create a simple trend line
            x = range(len(series))
            y = series.values
            z = np.polyfit(x, y, 1)
            p = np.poly1d(z)
            ax3.plot(series.index, p(x), color='green', linewidth=2)
            ax3.set_title('Throughput Trend Line')
            ax3.set_xlabel('Date')
            ax3.set_ylabel('Throughput')
            ax3.grid(True, alpha=0.3)
        
        # Plot 4: Forecast confidence
        ax4 = axes[1, 1]
        forecast = forecast_results['forecast']
        if 'forecast_ci' in forecast_results:
            ci = forecast_results['forecast_ci']
            ax4.fill_between(forecast.index, ci.iloc[:, 0], ci.iloc[:, 1], 
                           alpha=0.3, color='red', label='95% Confidence Interval')
        ax4.plot(forecast.index, forecast.values, color='red', linewidth=2, 
                label='Forecast')
        ax4.set_title('Forecast Confidence Intervals')
        ax4.set_xlabel('Date')
        ax4.set_ylabel('Forecasted Value')
        ax4.legend()
        ax4.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.show()
    
    def generate_insights(self, series, forecast_results):
        """Generate comprehensive insights and recommendations."""
        print("\n📋 Generating insights and recommendations...")
        
        # Calculate key metrics
        current_avg = series.mean()
        current_max = series.max()
        forecast_avg = forecast_results['forecast'].mean()
        forecast_max = forecast_results['forecast'].max()
        
        # Capacity thresholds
        warning_threshold = current_avg * 1.2
        critical_threshold = current_avg * 1.5
        
        insights = {
            'current_metrics': {
                'average_throughput': current_avg,
                'peak_throughput': current_max,
                'data_points': len(series)
            },
            'forecast_metrics': {
                'forecasted_average': forecast_avg,
                'forecasted_peak': forecast_max,
                'forecast_periods': len(forecast_results['forecast'])
            },
            'capacity_analysis': {
                'warning_threshold': warning_threshold,
                'critical_threshold': critical_threshold,
                'current_utilization': (current_avg / current_max) * 100,
                'forecasted_utilization': (forecast_avg / current_max) * 100
            },
            'recommendations': []
        }
        
        # Generate recommendations
        if forecast_max > critical_threshold:
            insights['recommendations'].append("🚨 CRITICAL: Forecasted peak exceeds critical threshold")
            insights['recommendations'].append("   → Immediate capacity expansion required")
        elif forecast_max > warning_threshold:
            insights['recommendations'].append("⚠️ WARNING: Forecasted peak exceeds warning threshold")
            insights['recommendations'].append("   → Plan capacity expansion within 3-6 months")
        
        if forecast_avg > current_avg * 1.1:
            insights['recommendations'].append("📈 GROWTH: 10%+ increase in average throughput forecasted")
            insights['recommendations'].append("   → Plan for sustained capacity increases")
        
        if insights['capacity_analysis']['current_utilization'] > 80:
            insights['recommendations'].append("🔴 HIGH UTILIZATION: Current capacity utilization > 80%")
            insights['recommendations'].append("   → Monitor closely for bottlenecks")
        
        self.insights['analysis'] = insights
        return insights
    
    def save_insights_to_file(self, filename="forecasting_insights.txt"):
        """Save insights to a text file."""
        print(f"\n💾 Saving insights to {filename}...")
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write("PREDICTIVE THROUGHPUT FORECASTING INSIGHTS\n")
            f.write("=" * 50 + "\n\n")
            
            # Statistics
            if 'statistics' in self.insights:
                f.write("DATA STATISTICS:\n")
                f.write("-" * 20 + "\n")
                stats = self.insights['statistics']
                f.write(f"Total Records: {stats['total_records']:,}\n")
                f.write(f"Date Range: {stats['date_range']}\n")
                f.write(f"Numeric Columns: {', '.join(stats['numeric_columns'])}\n\n")
                
                for col in stats['numeric_columns']:
                    if f'{col}_mean' in stats:
                        f.write(f"{col}:\n")
                        f.write(f"  Mean: {stats[f'{col}_mean']:.2f}\n")
                        f.write(f"  Median: {stats[f'{col}_median']:.2f}\n")
                        f.write(f"  Mode: {stats[f'{col}_mode']}\n")
                        f.write(f"  Std Dev: {stats[f'{col}_std']:.2f}\n")
                        f.write(f"  Range: {stats[f'{col}_min']:.2f} - {stats[f'{col}_max']:.2f}\n\n")
            
            # Analysis insights
            if 'analysis' in self.insights:
                analysis = self.insights['analysis']
                f.write("FORECASTING ANALYSIS:\n")
                f.write("-" * 20 + "\n")
                
                f.write("Current Metrics:\n")
                current = analysis['current_metrics']
                f.write(f"  Average Throughput: {current['average_throughput']:.2f}\n")
                f.write(f"  Peak Throughput: {current['peak_throughput']:.2f}\n")
                f.write(f"  Data Points: {current['data_points']}\n\n")
                
                f.write("Forecast Metrics:\n")
                forecast = analysis['forecast_metrics']
                f.write(f"  Forecasted Average: {forecast['forecasted_average']:.2f}\n")
                f.write(f"  Forecasted Peak: {forecast['forecasted_peak']:.2f}\n")
                f.write(f"  Forecast Periods: {forecast['forecast_periods']}\n\n")
                
                f.write("Capacity Analysis:\n")
                capacity = analysis['capacity_analysis']
                f.write(f"  Warning Threshold: {capacity['warning_threshold']:.2f}\n")
                f.write(f"  Critical Threshold: {capacity['critical_threshold']:.2f}\n")
                f.write(f"  Current Utilization: {capacity['current_utilization']:.1f}%\n")
                f.write(f"  Forecasted Utilization: {capacity['forecasted_utilization']:.1f}%\n\n")
                
                f.write("RECOMMENDATIONS:\n")
                f.write("-" * 20 + "\n")
                for rec in analysis['recommendations']:
                    f.write(f"{rec}\n")
                f.write("\n")
            
            f.write("Generated on: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + "\n")
        
        print(f"✅ Insights saved to {filename}")
    
    def run_complete_analysis(self):
        """Run the complete predictive forecasting analysis."""
        print("🚀 STARTING PREDICTIVE THROUGHPUT FORECASTING")
        print("=" * 60)
        
        # Step 1: Load and prepare data
        self.load_and_prepare_data()
        
        # Step 2: Analyze statistics
        self.analyze_data_statistics()
        
        # Step 3: Create time series data
        daily_data, hourly_data = self.create_time_series_data()
        
        # Step 4: Analyze each time series
        for freq, data in [('daily', daily_data), ('hourly', hourly_data)]:
            print(f"\n{'='*50}")
            print(f"ANALYZING {freq.upper()} TIME SERIES")
            print(f"{'='*50}")
            
            for column in data.columns:
                if pd.api.types.is_numeric_dtype(data[column]) and column != 'ShipmentCount':
                    print(f"\n--- Analyzing {column} ---")
                    
                    series = data[column].dropna()
                    if len(series) < 10:
                        print(f"⚠ Skipping {column} - insufficient data points")
                        continue
                    
                    # Fit ARIMA model
                    forecast_results = self.fit_arima_forecast(series)
                    self.forecasts[f"{freq}_{column}"] = forecast_results
                    
                    # Create line graphs
                    self.create_line_graphs(series, forecast_results, 
                                          f"{column} ({freq}) Forecast")
                    
                    # Generate insights
                    insights = self.generate_insights(series, forecast_results)
        
        # Step 5: Save insights
        self.save_insights_to_file()
        
        print("\n" + "=" * 60)
        print("✅ FORECASTING ANALYSIS COMPLETE!")
        print("=" * 60)
        print("📊 Generated comprehensive throughput forecasts")
        print("📈 Created detailed line graph visualizations")
        print("📋 Saved insights and recommendations to file")
        print("🎯 Check the generated plots for detailed analysis")


def main():
    """Main function to run the forecasting analysis."""
    csv_path = r"C:\Users\dell\Desktop\hackspace\Hackermans\backend\Shipment 1.xlsx - Sheet1.csv"
    
    forecaster = ThroughputForecaster(csv_path)
    forecaster.run_complete_analysis()


if __name__ == "__main__":
    main()
