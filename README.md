

# Hackermans - Terminal Analytics Dashboard

A comprehensive terminal analytics system with AI-powered insights, predictive forecasting, anomaly detection, and natural language chart generation. Built with React frontend, Node.js backend, and Flask AI services.

## Contributors 

- Arav Chadda aravchadda@gmail.com 
- Suprotiv Moitra suprotiv.2003@gmail.com
- Devansh Desai devanshvd237@gmail.com
- Sourav S Gaikwad souravgaikwad581@gmail.com

## Features

- **AI-Powered Analytics**: Natural language query processing with Ollama LLM
- **Predictive Forecasting**: Time series analysis and trend prediction
- **Anomaly Detection**: Automated detection of unusual patterns in terminal operations
- **Interactive Dashboards**: Dynamic charts and visualizations
- **Real-time Data Processing**: Live terminal operation monitoring with DuckDB for ultra-fast queries
- **Live Chart Querying**: Charts are queried live every time for real-time data accuracy
- **Multiple Chart Types**: Line, bar, scatter, pie, area, histogram, and heatmap charts powered by Chart.js
- **SQL Query Generation**: Convert natural language to SQL queries
- **Comprehensive Reporting**: Delay analysis, throughput analysis, and performance metrics
- **High-Performance Database**: DuckDB integration for 10-100x faster analytical queries compared to traditional databases

## System Architecture

```
React Frontend (Port 3000) ← Chart.js for flexible visualizations
     ↓
Node.js Backend (Port 3001) ← DuckDB for ultra-fast analytics
     ↓
Flask AI Service (Port 5000) ← Ollama LLM (Port 11434)
     ↓
DuckDB Database (hackermans.db) ← 10-100x faster than traditional DBs
```

## Quick Start

### Prerequisites

- **Node.js 16+**
- **Python 3.8+**
- **8GB+ RAM** (for LLM functionality)
- **Ollama** (for AI features)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository>
   cd hackspace/Hackermans
   ```

2. **Install Ollama and pull the model:**
   ```bash
   # Install Ollama
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Pull the Microsoft Phi-3.5 model
   ollama pull microsoft/phi-3.5-mini
   
   # Start Ollama server
   ollama serve
   ```

3. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

4. **Install frontend dependencies:**
   ```bash
   cd frontend/terminal
   npm install
   ```

5. **Install Flask AI service dependencies:**
   ```bash
   cd aiml
   pip install -r requirements.txt
   ```

### Running the Application

**You need to run all 4 services simultaneously:**

1. **Start Ollama server (Terminal 1):**
   ```bash
   ollama serve
   ```

2. **Start Node.js backend (Terminal 2):**
   ```bash
   cd backend
   npm start
   ```

3. **Start React frontend (Terminal 3):**
   ```bash
   cd frontend/terminal
   npm start
   ```

4. **Start Flask AI service (Terminal 4):**
   ```bash
   cd aiml
   python flask-ollama-app.py
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Flask AI Service: http://localhost:5000

##  Usage Examples

### Terminal Analytics Features

1. **Natural Language Queries**: Ask questions about terminal operations:
   - "Show me daily throughput trends"
   - "Which bays are performing best?"
   - "What are the flow rate issues?"
   - "How are we doing with schedule adherence?"

2. **Predictive Forecasting**: Get insights on future trends:
   - Throughput forecasting
   - Capacity planning
   - Performance predictions

3. **Anomaly Detection**: Identify unusual patterns:
   - Automatic detection of operational anomalies
   - Performance deviation alerts
   - Equipment efficiency issues

4. **Chart Generation**: Create visualizations with natural language:
   - "Create a bar chart showing GrossQuantity against BayCode"
   - "Show a line chart of FlowRate over time"
   - "Make a pie chart of product distribution"

### Supported Chart Types

- **Line Charts**: For time series and trend analysis
- **Bar Charts**: For categorical comparisons
- **Scatter Plots**: For correlation analysis
- **Pie Charts**: For distribution analysis
- **Area Charts**: For cumulative data visualization
- **Histograms**: For data distribution analysis
- **Heatmaps**: For matrix data visualization

## 🔧 Configuration

### Service Ports

- **Frontend (React)**: http://localhost:3000
- **Backend (Node.js)**: http://localhost:3001
- **Flask AI Service**: http://localhost:5000
- **Ollama LLM**: http://localhost:11434

### Ollama Model Configuration

The system uses Microsoft Phi-3.5 model for AI processing:

```bash
# Pull the required model
ollama pull microsoft/phi-3.5-mini

# Verify model is available
ollama list
```

### Database Configuration

The system uses **DuckDB** database (`hackermans.db`) for storing terminal operation data. DuckDB provides:

- **10-100x faster analytical queries** compared to traditional databases
- **Columnar storage** optimized for analytics workloads
- **SQL compatibility** with advanced analytical functions
- **In-memory processing** for real-time chart generation
- **Automatic optimization** for complex analytical queries

The database is automatically created and managed by the Node.js backend with DuckDB integration.

### Environment Variables

**Backend (.env):**
```env
PORT=3001
NODE_ENV=development
DB_PATH=./data/hackermans.db
```

**Flask AI Service:**
```python
OLLAMA_URL = "http://localhost:11434"
MODEL_NAME = "microsoft/phi-3.5-mini"
```

## Architecture Details

### Frontend (React)
- **Dashboard Interface**: Interactive analytics dashboard
- **Chart Components**: Multiple chart types powered by Chart.js for maximum flexibility and compatibility
- **Chat Interface**: Natural language query processing
- **Data Visualization**: Real-time chart rendering with live data querying
- **Chart.js Integration**: Flexible chart library supporting all major chart types with responsive design

### Backend (Node.js)
- **API Server**: RESTful endpoints for data processing
- **Database Management**: DuckDB integration for ultra-fast terminal data analytics
- **Data Processing**: CSV import and data transformation with live querying
- **Chart Generation**: Integration with Flask AI service for real-time chart specifications
- **Performance Optimization**: DuckDB's columnar storage for 10-100x faster analytical queries

### AI Service (Flask)
- **Natural Language Processing**: Query understanding and mapping
- **Chart Generation**: JSON specification creation
- **SQL Query Generation**: Natural language to SQL conversion
- **Ollama Integration**: Local LLM processing

### Data Flow
1. **User Query**: Natural language input via React frontend
2. **API Processing**: Node.js backend receives and processes request
3. **AI Processing**: Flask service calls Ollama for query understanding
4. **Live Data Retrieval**: DuckDB database queries for relevant data (10-100x faster than traditional DBs)
5. **Chart Generation**: AI generates chart specifications for real-time visualization
6. **Live Visualization**: React frontend renders interactive charts with Chart.js, querying data live every time

## API Reference

### Node.js Backend Endpoints

**POST /api/upload-csv**
Upload and process CSV data for terminal operations.

**GET /api/data**
Retrieve terminal operation data from database.

**POST /api/query**
Execute SQL queries on terminal data.

### Flask AI Service Endpoints

**POST /generate-graph-json**
Generate chart specifications from natural language queries.

**POST /insights/query**
Map natural language questions to predefined SQL queries.

**GET /insights/queries**
List all available insights queries.

**GET /health**
Health check for Ollama connection.

### Example API Usage

**Generate Chart:**
```bash
curl -X POST http://localhost:5000/generate-graph-json \
  -H "Content-Type: application/json" \
  -d '{"query": "Create a bar chart showing GrossQuantity against BayCode"}'
```

**Get Insights:**
```bash
curl -X POST http://localhost:5000/insights/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me daily throughput trends"}'
```

## 🛠️ Development

### Project Structure

```
Hackermans/
├── backend/                    # Node.js API server
│   ├── data/                  # SQLite database
│   ├── database.js            # Database operations
│   ├── index.js               # Main server
│   └── package.json
├── frontend/terminal/          # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── AnalyticsChatbot.js
│   │   │   ├── ChartBubble.js
│   │   │   ├── Dashboard.js
│   │   │   └── ...
│   │   ├── charts/            # Chart components
│   │   ├── hooks/             # Custom hooks
│   │   └── services/          # API services
│   └── package.json
├── aiml/                      # Flask AI service
│   ├── flask-ollama-app.py    # Main Flask app
│   ├── anomaly_detection/     # Anomaly detection module
│   ├── predictive_forecasting/ # Forecasting module
│   ├── turnaround_time_analysis/ # Delay analysis
│   └── requirements.txt
└── README.md
```

### Key Components

**Frontend Components:**
- `AnalyticsChatbot.js`: Natural language chat interface
- `Dashboard.js`: Main analytics dashboard
- `ChartBubble.js`: Interactive chart components
- `AnomalyDetectionDisplay.js`: Anomaly visualization
- `PredictiveForecastingDisplay.js`: Forecasting charts

**Backend Services:**
- `database.js`: SQLite database operations
- `index.js`: Express server with API endpoints

**AI Services:**
- `flask-ollama-app.py`: Main Flask application with Ollama integration
- Anomaly detection and forecasting modules
- Natural language processing for chart generation

### Testing

```bash
# Test Node.js backend
cd backend
npm start

# Test Flask AI service
cd aiml
python flask-ollama-app.py

# Test API endpoints
curl http://localhost:3001/api/data
curl http://localhost:5000/health
```

## 🔍 Troubleshooting

### Common Issues

1. **Ollama Connection Failed**
   ```bash
   # Check if Ollama is running
   ollama serve
   
   # Verify model is loaded
   ollama list
   
   # Pull the required model if missing
   ollama pull microsoft/phi-3.5-mini
   ```

2. **Service Connection Issues**
   ```bash
   # Check if all services are running
   # Terminal 1: ollama serve
   # Terminal 2: cd backend && npm start
   # Terminal 3: cd frontend/terminal && npm start
   # Terminal 4: cd aiml && python flask-ollama-app.py
   ```

3. **Port Conflicts**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001
   - Flask AI: http://localhost:5000
   - Ollama: http://localhost:11434

4. **Database Issues**
   ```bash
   # Check if database exists
   ls backend/data/hackermans.db
   
   # Restart backend to recreate database if needed
   cd backend && npm start
   ```

5. **Python Dependencies**
   ```bash
   # Install Flask dependencies
   cd aiml
   pip install -r requirements.txt
   ```

### Service Health Checks

```bash
# Check Ollama
curl http://localhost:11434/api/tags

# Check Flask AI service
curl http://localhost:5000/health

# Check Node.js backend
curl http://localhost:3001/api/data
```

## Performance

### System Requirements

- **RAM**: 8GB+ (for Ollama LLM processing)
- **CPU**: Multi-core processor recommended
- **Storage**: 5GB+ for models and data
- **Network**: Local network for service communication

### Performance Benchmarks

- **Chart Generation**: 2-5 seconds (with Ollama)
- **Data Processing**: Real-time for terminal operations
- **DuckDB Queries**: <10ms for typical analytical operations (10-100x faster than traditional databases)
- **Live Chart Rendering**: <50ms with Chart.js for responsive visualizations
- **Memory Usage**: 3-5GB with Ollama running
- **Database Performance**: DuckDB's columnar storage provides 10-100x faster analytical queries

### Optimization Tips

1. **Leverage DuckDB's performance**: Columnar storage provides 10-100x faster analytical queries
2. **Use SSD storage** for better database performance
3. **Allocate sufficient RAM** for Ollama model loading
4. **Monitor service health** with provided health checks
5. **Use production-ready models** for better performance
6. **Chart.js optimization**: Leverage Chart.js's flexibility for responsive and interactive visualizations

## Quick Start Summary

**To run the project, you need to start all 4 services:**

1. **Ollama Server**: `ollama serve` (after pulling microsoft/phi-3.5-mini)
2. **Node.js Backend**: `cd backend && npm start`
3. **React Frontend**: `cd frontend/terminal && npm start`
4. **Flask AI Service**: `cd aiml && python flask-ollama-app.py`

**Access Points:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Flask AI: http://localhost:5000
- Ollama: http://localhost:11434

## Contributing

1. Fork the repository
2. Create a feature branch
3. Test all services work together
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## Support

- **Issues**: Report bugs and feature requests
- **Documentation**: Check this README for setup instructions
- **Troubleshooting**: See troubleshooting section above

---
