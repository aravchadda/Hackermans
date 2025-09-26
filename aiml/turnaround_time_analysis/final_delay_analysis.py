import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

def load_and_clean_data(file_path):
    """Load and clean the shipment data with improved date handling"""
    print("Loading data...")
    df = pd.read_csv(file_path)
    
    # Clean column names (remove extra spaces)
    df.columns = df.columns.str.strip()
    
    print(f"Original data shape: {df.shape}")
    
    # Convert datetime columns with error handling
    print("Converting datetime columns...")
    
    # Handle ExitTime
    df['ExitTime'] = pd.to_datetime(df['ExitTime'], errors='coerce')
    
    # Handle ScheduledDate - this might be the issue
    df['ScheduledDate'] = pd.to_datetime(df['ScheduledDate'], errors='coerce')
    
    # Handle CreatedTime
    df['CreatedTime'] = pd.to_datetime(df['CreatedTime'], errors='coerce')
    
    # Remove rows with invalid dates
    initial_count = len(df)
    df = df.dropna(subset=['ExitTime', 'ScheduledDate'])
    print(f"Removed {initial_count - len(df)} rows with invalid dates")
    
    # Calculate delay in minutes
    df['DelayMinutes'] = (df['ExitTime'] - df['ScheduledDate']).dt.total_seconds() / 60
    
    # Filter out extreme outliers (delays > 30 days or < -30 days)
    df = df[(df['DelayMinutes'] > -43200) & (df['DelayMinutes'] < 43200)]
    print(f"After outlier removal: {len(df)} records")
    
    # Add additional time-based features
    df['Hour'] = df['ExitTime'].dt.hour
    df['DayOfWeek'] = df['ExitTime'].dt.day_name()
    df['Month'] = df['ExitTime'].dt.month
    df['Year'] = df['ExitTime'].dt.year
    
    # Create delay categories
    df['DelayCategory'] = pd.cut(df['DelayMinutes'], 
                                bins=[-np.inf, 0, 30, 60, 120, np.inf],
                                labels=['Early', 'OnTime', 'MinorDelay', 'ModerateDelay', 'MajorDelay'])
    
    print(f"Final data shape: {df.shape}")
    print(f"Date range: {df['ExitTime'].min()} to {df['ExitTime'].max()}")
    
    return df

def calculate_delay_statistics(df):
    """Calculate comprehensive delay statistics"""
    print("Calculating delay statistics...")
    
    stats = {
        'overall_stats': {
            'total_shipments': len(df),
            'average_delay_minutes': round(df['DelayMinutes'].mean(), 2),
            'median_delay_minutes': round(df['DelayMinutes'].median(), 2),
            'max_delay_minutes': round(df['DelayMinutes'].max(), 2),
            'min_delay_minutes': round(df['DelayMinutes'].min(), 2),
            'std_delay_minutes': round(df['DelayMinutes'].std(), 2),
            'on_time_percentage': round((df['DelayMinutes'] <= 0).mean() * 100, 2),
            'delayed_shipments': int((df['DelayMinutes'] > 0).sum()),
            'early_shipments': int((df['DelayMinutes'] < 0).sum())
        },
        'delay_distribution': df['DelayCategory'].value_counts().to_dict(),
        'delay_percentiles': {
            'p25': round(df['DelayMinutes'].quantile(0.25), 2),
            'p50': round(df['DelayMinutes'].quantile(0.50), 2),
            'p75': round(df['DelayMinutes'].quantile(0.75), 2),
            'p90': round(df['DelayMinutes'].quantile(0.90), 2),
            'p95': round(df['DelayMinutes'].quantile(0.95), 2),
            'p99': round(df['DelayMinutes'].quantile(0.99), 2)
        }
    }
    
    return stats

def analyze_by_bay(df):
    """Analyze delays by bay"""
    print("Analyzing delays by bay...")
    
    bay_analysis = df.groupby('BayCode').agg({
        'DelayMinutes': ['count', 'mean', 'median', 'std', 'max', 'min'],
        'ShipmentID': 'nunique'
    }).round(2)
    
    bay_analysis.columns = ['shipment_count', 'avg_delay', 'median_delay', 'std_delay', 'max_delay', 'min_delay', 'unique_shipments']
    bay_analysis = bay_analysis.sort_values('avg_delay', ascending=False)
    
    # Calculate delay rate by bay
    bay_delay_rate = df.groupby('BayCode').apply(
        lambda x: (x['DelayMinutes'] > 0).mean() * 100
    ).round(2)
    
    bay_analysis['delay_rate_percentage'] = bay_delay_rate
    
    # Convert to JSON-serializable format
    result = {}
    for bay, row in bay_analysis.iterrows():
        result[str(bay)] = {
            'shipment_count': int(row['shipment_count']),
            'avg_delay': float(row['avg_delay']),
            'median_delay': float(row['median_delay']),
            'std_delay': float(row['std_delay']),
            'max_delay': float(row['max_delay']),
            'min_delay': float(row['min_delay']),
            'unique_shipments': int(row['unique_shipments']),
            'delay_rate_percentage': float(row['delay_rate_percentage'])
        }
    
    return result

def analyze_by_product(df):
    """Analyze delays by product"""
    print("Analyzing delays by product...")
    
    product_analysis = df.groupby('BaseProductCode').agg({
        'DelayMinutes': ['count', 'mean', 'median', 'std', 'max', 'min'],
        'ShipmentID': 'nunique'
    }).round(2)
    
    product_analysis.columns = ['shipment_count', 'avg_delay', 'median_delay', 'std_delay', 'max_delay', 'min_delay', 'unique_shipments']
    product_analysis = product_analysis.sort_values('avg_delay', ascending=False)
    
    # Calculate delay rate by product
    product_delay_rate = df.groupby('BaseProductCode').apply(
        lambda x: (x['DelayMinutes'] > 0).mean() * 100
    ).round(2)
    
    product_analysis['delay_rate_percentage'] = product_delay_rate
    
    # Convert to JSON-serializable format
    result = {}
    for product, row in product_analysis.iterrows():
        result[str(product)] = {
            'shipment_count': int(row['shipment_count']),
            'avg_delay': float(row['avg_delay']),
            'median_delay': float(row['median_delay']),
            'std_delay': float(row['std_delay']),
            'max_delay': float(row['max_delay']),
            'min_delay': float(row['min_delay']),
            'unique_shipments': int(row['unique_shipments']),
            'delay_rate_percentage': float(row['delay_rate_percentage'])
        }
    
    return result

def analyze_by_time_patterns(df):
    """Analyze delays by time patterns"""
    print("Analyzing time patterns...")
    
    # By hour
    hourly_analysis = df.groupby('Hour').agg({
        'DelayMinutes': ['count', 'mean', 'median', 'std'],
        'ShipmentID': 'nunique'
    }).round(2)
    hourly_analysis.columns = ['shipment_count', 'avg_delay', 'median_delay', 'std_delay', 'unique_shipments']
    
    # By day of week
    daily_analysis = df.groupby('DayOfWeek').agg({
        'DelayMinutes': ['count', 'mean', 'median', 'std'],
        'ShipmentID': 'nunique'
    }).round(2)
    daily_analysis.columns = ['shipment_count', 'avg_delay', 'median_delay', 'std_delay', 'unique_shipments']
    
    # By month
    monthly_analysis = df.groupby('Month').agg({
        'DelayMinutes': ['count', 'mean', 'median', 'std'],
        'ShipmentID': 'nunique'
    }).round(2)
    monthly_analysis.columns = ['shipment_count', 'avg_delay', 'median_delay', 'std_delay', 'unique_shipments']
    
    # Convert to JSON-serializable format
    def convert_to_serializable(df_grouped):
        result = {}
        for key, row in df_grouped.iterrows():
            result[str(key)] = {
                'shipment_count': int(row['shipment_count']),
                'avg_delay': float(row['avg_delay']),
                'median_delay': float(row['median_delay']),
                'std_delay': float(row['std_delay']),
                'unique_shipments': int(row['unique_shipments'])
            }
        return result
    
    return {
        'hourly': convert_to_serializable(hourly_analysis),
        'daily': convert_to_serializable(daily_analysis),
        'monthly': convert_to_serializable(monthly_analysis)
    }

def identify_bottlenecks(df):
    """Identify bottlenecks and root causes"""
    print("Identifying bottlenecks...")
    
    # Find worst performing combinations
    worst_combinations = df.groupby(['BayCode', 'BaseProductCode']).agg({
        'DelayMinutes': ['count', 'mean', 'std'],
        'ShipmentID': 'nunique'
    }).round(2)
    
    worst_combinations.columns = ['shipment_count', 'avg_delay', 'std_delay', 'unique_shipments']
    worst_combinations = worst_combinations.sort_values('avg_delay', ascending=False).head(20)
    
    # Find most problematic hours
    problematic_hours = df.groupby('Hour')['DelayMinutes'].agg(['count', 'mean']).round(2)
    problematic_hours = problematic_hours[problematic_hours['count'] >= 10]  # Only hours with significant data
    problematic_hours = problematic_hours.sort_values('mean', ascending=False).head(10)
    
    # Find most problematic days
    problematic_days = df.groupby('DayOfWeek')['DelayMinutes'].agg(['count', 'mean']).round(2)
    problematic_days = problematic_days.sort_values('mean', ascending=False)
    
    # Convert to JSON-serializable format
    def convert_combinations_to_serializable(df_grouped):
        result = {}
        for (bay, product), row in df_grouped.iterrows():
            key = f"{bay}_{product}"
            result[key] = {
                'bay': str(bay),
                'product': str(product),
                'shipment_count': int(row['shipment_count']),
                'avg_delay': float(row['avg_delay']),
                'std_delay': float(row['std_delay']),
                'unique_shipments': int(row['unique_shipments'])
            }
        return result
    
    def convert_single_to_serializable(df_grouped):
        result = {}
        for key, row in df_grouped.iterrows():
            result[str(key)] = {
                'count': int(row['count']),
                'mean': float(row['mean'])
            }
        return result
    
    return {
        'worst_bay_product_combinations': convert_combinations_to_serializable(worst_combinations),
        'problematic_hours': convert_single_to_serializable(problematic_hours),
        'problematic_days': convert_single_to_serializable(problematic_days)
    }

def calculate_weighted_averages(df):
    """Calculate weighted averages by delay and volume"""
    print("Calculating weighted averages...")
    
    # Weight by delay time and volume
    df['delay_weight'] = df['DelayMinutes'].abs()
    df['volume_weight'] = df['GrossQuantity'] + 1  # Add 1 to avoid zero weights
    
    # Weighted averages by bay
    bay_weighted = df.groupby('BayCode').apply(
        lambda x: np.average(x['DelayMinutes'], weights=x['delay_weight'] * x['volume_weight'])
    ).round(2)
    
    # Weighted averages by product
    product_weighted = df.groupby('BaseProductCode').apply(
        lambda x: np.average(x['DelayMinutes'], weights=x['delay_weight'] * x['volume_weight'])
    ).round(2)
    
    # Weighted averages by hour
    hourly_weighted = df.groupby('Hour').apply(
        lambda x: np.average(x['DelayMinutes'], weights=x['delay_weight'] * x['volume_weight'])
    ).round(2)
    
    return {
        'bay_weighted_averages': {str(k): float(v) for k, v in bay_weighted.to_dict().items()},
        'product_weighted_averages': {str(k): float(v) for k, v in product_weighted.to_dict().items()},
        'hourly_weighted_averages': {str(k): float(v) for k, v in hourly_weighted.to_dict().items()}
    }

def generate_recommendations(df, stats, bottlenecks):
    """Generate optimization recommendations"""
    print("Generating recommendations...")
    
    recommendations = []
    
    # Overall performance recommendations
    if stats['overall_stats']['on_time_percentage'] < 80:
        recommendations.append({
            'category': 'Overall Performance',
            'priority': 'High',
            'recommendation': f"Only {stats['overall_stats']['on_time_percentage']:.1f}% of shipments are on time. Implement comprehensive delay reduction strategy.",
            'impact': 'High'
        })
    
    # Bay-specific recommendations
    bay_stats = analyze_by_bay(df)
    worst_bays = sorted(bay_stats.items(), key=lambda x: x[1]['avg_delay'], reverse=True)[:3]
    
    for bay, stats in worst_bays:
        if stats['avg_delay'] > 60:  # More than 1 hour average delay
            recommendations.append({
                'category': 'Bay Optimization',
                'priority': 'High',
                'recommendation': f"Bay {bay} has average delay of {stats['avg_delay']:.1f} minutes. Review processes and resource allocation.",
                'impact': 'High',
                'bay': bay
            })
    
    # Time-based recommendations
    hourly_stats = analyze_by_time_patterns(df)['hourly']
    worst_hours = sorted(hourly_stats.items(), key=lambda x: x[1]['avg_delay'], reverse=True)[:3]
    
    for hour, stats in worst_hours:
        if stats['avg_delay'] > 45:  # More than 45 minutes average delay
            recommendations.append({
                'category': 'Time Optimization',
                'priority': 'Medium',
                'recommendation': f"Hour {hour}:00 has average delay of {stats['avg_delay']:.1f} minutes. Consider resource reallocation during peak delay hours.",
                'impact': 'Medium',
                'hour': hour
            })
    
    return recommendations

def main():
    """Main analysis function"""
    print("Starting Final Delay Analysis & Bottleneck Identification")
    print("=" * 70)
    
    # Load data
    file_path = r"C:\Users\dell\Desktop\hackspace\Hackermans\backend\Shipment 1.xlsx - Sheet1.csv"
    df = load_and_clean_data(file_path)
    
    print(f"Loaded {len(df)} shipment records")
    print(f"Date range: {df['ExitTime'].min()} to {df['ExitTime'].max()}")
    print()
    
    # Calculate statistics
    stats = calculate_delay_statistics(df)
    
    # Analyze by different dimensions
    bay_analysis = analyze_by_bay(df)
    product_analysis = analyze_by_product(df)
    time_analysis = analyze_by_time_patterns(df)
    
    # Identify bottlenecks
    bottlenecks = identify_bottlenecks(df)
    
    # Calculate weighted averages
    weighted_analysis = calculate_weighted_averages(df)
    
    # Generate recommendations
    recommendations = generate_recommendations(df, stats, bottlenecks)
    
    # Compile final results
    results = {
        'analysis_metadata': {
            'analysis_date': datetime.now().isoformat(),
            'total_records': len(df),
            'date_range': {
                'start': df['ExitTime'].min().isoformat(),
                'end': df['ExitTime'].max().isoformat()
            },
            'data_quality': {
                'missing_scheduled_dates': int(df['ScheduledDate'].isna().sum()),
                'missing_exit_times': int(df['ExitTime'].isna().sum()),
                'negative_delays': int((df['DelayMinutes'] < 0).sum())
            }
        },
        'overall_statistics': stats,
        'bay_analysis': bay_analysis,
        'product_analysis': product_analysis,
        'time_pattern_analysis': time_analysis,
        'bottleneck_analysis': bottlenecks,
        'weighted_analysis': weighted_analysis,
        'recommendations': recommendations,
        'summary': {
            'worst_performing_bay': max(bay_analysis.items(), key=lambda x: x[1]['avg_delay'])[0],
            'worst_performing_product': max(product_analysis.items(), key=lambda x: x[1]['avg_delay'])[0],
            'worst_performing_hour': max(time_analysis['hourly'].items(), key=lambda x: x[1]['avg_delay'])[0],
            'worst_performing_day': max(time_analysis['daily'].items(), key=lambda x: x[1]['avg_delay'])[0],
            'total_delay_hours': round(df['DelayMinutes'].sum() / 60, 2),
            'cost_impact_estimate': f"Estimated cost impact: {round(df['DelayMinutes'].sum() / 60 * 50, 0):.0f} hours of delay time"
        }
    }
    
    # Save results
    output_file = r"C:\Users\dell\Desktop\hackspace\Hackermans\aiml\turnaround_time_analysis\delay_analysis_results.json"
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print("Analysis completed!")
    print(f"Results saved to: {output_file}")
    print()
    print("Key Findings:")
    print(f"- Total shipments analyzed: {stats['overall_stats']['total_shipments']:,}")
    print(f"- Average delay: {stats['overall_stats']['average_delay_minutes']:.1f} minutes")
    print(f"- On-time percentage: {stats['overall_stats']['on_time_percentage']:.1f}%")
    print(f"- Worst performing bay: {results['summary']['worst_performing_bay']}")
    print(f"- Worst performing hour: {results['summary']['worst_performing_hour']}:00")
    print(f"- Total delay hours: {results['summary']['total_delay_hours']:.1f}")

if __name__ == "__main__":
    main()
