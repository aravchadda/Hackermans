# Predictive Throughput Forecasting

## Overview

A focused solution for analyzing shipment throughput patterns and generating predictive forecasts with comprehensive data for React Chart.js visualization. This tool uses ARIMA time series forecasting to predict future demand and capacity needs.

## Features

- **Data Analysis**: Statistical analysis with mean, median, mode calculations
- **Time Series Forecasting**: ARIMA models with automatic parameter optimization
- **React Chart.js Ready**: JSON output optimized for React Chart.js visualization
- **Capacity Planning**: Threshold analysis and bottleneck prediction
- **Comprehensive Data**: Complete forecasting data in structured JSON format

## Quick Start

### Simple Run (Recommended)
```bash
python run_forecasting.py
```

### Direct Analysis
```bash
pip install -r requirements.txt
python throughput_forecasting.py
```

## Files

- `throughput_forecasting.py` - Main analysis script
- `run_forecasting.py` - Easy runner with dependency checking
- `requirements.txt` - Required Python packages
- `comprehensive_forecasting_charts.json` - Complete forecasting data for React Chart.js
- `README.md` - This documentation

## Output

### React Chart.js Data
- `comprehensive_forecasting_charts.json` - Complete forecasting data in JSON format
- Ready for direct import into React Chart.js components
- Includes all chart types: line, bar, scatter plots
- Contains historical data, forecasts, and confidence intervals

## Key Metrics

- **Current Throughput**: Average and peak historical values
- **Forecasted Demand**: Predicted future requirements
- **Capacity Utilization**: Current vs. maximum capacity usage
- **Warning Thresholds**: 120% (warning), 150% (critical)
- **Recommendations**: Automated capacity planning advice

## Usage

1. Ensure your CSV file is at the specified path
2. Run `python run_forecasting.py`
3. View the generated line graphs
4. Review `forecasting_insights.txt` for recommendations

## Requirements

- Python 3.7+
- pandas, numpy, matplotlib, seaborn
- scikit-learn, statsmodels, scipy

## Troubleshooting

- **Missing Dependencies**: Run `pip install -r requirements.txt`
- **File Not Found**: Check CSV file path
- **Memory Issues**: Script samples data for efficiency
- **Plot Issues**: Ensure matplotlib backend is available

## Results Interpretation

- **Green**: No capacity concerns
- **Yellow**: Plan capacity expansion (3-6 months)
- **Red**: Immediate capacity expansion required
- **Blue**: Historical data trends
- **Red**: Forecasted values
