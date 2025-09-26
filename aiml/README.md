# Hybrid Chart Generator

A production-ready system for natural language-driven data visualization that combines rule-based NLP with local LLM fallback for intelligent chart generation.

## 🚀 Features

- **Hybrid Architecture**: Fast rule-based patterns + AI fallback for complex queries
- **Natural Language Interface**: Ask for charts in plain English
- **Multiple Data Formats**: CSV, Excel, JSON file support with automatic schema detection
- **Vega-Lite Integration**: Declarative chart specifications with interactive rendering
- **Local LLM Support**: Ollama integration for privacy-focused AI processing
- **Confidence Scoring**: Intelligent method selection based on query complexity
- **Production Ready**: Comprehensive logging, error handling, and validation

## 🏗️ System Architecture

```
User Query → React Frontend (Vega-Lite rendering)
     ↓
Hybrid Chart Service (Node.js API)
├── Rule-Based NLP Module (Pattern matching)
└── Local LLM API (Ollama Server)
     ↓
Chart Specification (Vega-Lite JSON) → Interactive Visualization
```

## 📦 Quick Start

### Prerequisites

- **Node.js 16+**
- **8GB+ RAM** (for LLM functionality)
- **Ollama** (for AI features)

### Installation

1. **Clone and setup:**
   ```bash
   git clone <repository>
   cd hackspace
   ./setup.sh  # Linux/Mac
   # or
   setup.bat   # Windows
   ```

2. **Install Ollama (for AI features):**
   ```bash
   # Install Ollama
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Pull a model
   ollama pull phi3.5-mini    # ~2.3GB, recommended
   ```

3. **Start the system:**
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm start
   
   # Terminal 2: Start frontend  
   cd Hackermans/frontend/terminal
   npm start
   ```

4. **Access the application:**
   - Open http://localhost:3000
   - Click "🤖 Chat Generator" tab
   - Upload your data and start asking for charts!

## 🎯 Usage Examples

### Basic Chart Generation

1. **Upload Data**: Drag & drop CSV, Excel, or JSON files
2. **Ask for Charts**: Use natural language queries like:
   - "Show sales trends over time"
   - "Compare revenue by region" 
   - "Create a pie chart of market share"
   - "Plot correlation between price and sales"

### Supported Chart Types

- **Trend Analysis**: Line charts for time series data
- **Comparisons**: Bar charts for categorical comparisons
- **Distributions**: Histograms and box plots
- **Correlations**: Scatter plots for relationships
- **Compositions**: Pie charts for part-to-whole relationships

## 🔧 Configuration

### Backend Configuration

Edit `backend/.env`:

```env
# Server
PORT=3001
NODE_ENV=development

# Ollama (for AI features)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=phi3.5-mini

# Confidence thresholds
RULE_CONFIDENCE_THRESHOLD=0.8
LLM_TIMEOUT_MS=10000

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Model Recommendations

| Model | Size | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| **phi3.5-mini** | ~2.3GB | Fast | Good | Development |
| **llama3.2:3b** | ~2GB | Fast | Good | Production |
| **gemma2:2b** | ~1.6GB | Very Fast | Good | Resource-constrained |

## 🏛️ Architecture Details

### Rule-Based NLP Module

- **Intent Detection**: Pattern matching for chart types
- **Entity Extraction**: Aggregation functions, time references
- **Field Mapping**: Synonym-based column matching
- **Chart Inference**: Direct Vega-Lite generation
- **Confidence Scoring**: Based on pattern matches

### LLM Fallback Module

- **Ollama Integration**: Local LLM API calls
- **Structured Prompts**: Optimized for chart generation
- **Response Validation**: Vega-Lite spec validation
- **Error Handling**: Timeout and fallback mechanisms

### Orchestration Logic

1. **Rule-Based First**: Try pattern matching
2. **Confidence Check**: If confidence < threshold
3. **LLM Fallback**: Use AI for complex queries
4. **Validation**: Ensure valid Vega-Lite specs
5. **Logging**: Track for rule improvement

## 📊 API Reference

### POST /api/generate-chart

Generate a chart from natural language.

**Request:**
```json
{
  "query": "Show sales trends over time",
  "dataSchema": [
    {"name": "date", "type": "temporal"},
    {"name": "sales", "type": "quantitative"}
  ],
  "sampleData": [
    {"date": "2023-01-01", "sales": 500},
    {"date": "2023-02-01", "sales": 600}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "explanation": "This line chart shows sales trends over time",
  "spec": {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "mark": "line",
    "encoding": {
      "x": {"field": "date", "type": "temporal"},
      "y": {"field": "sales", "type": "quantitative"}
    }
  },
  "method": "rule-based",
  "confidence": 0.85
}
```

## 🛠️ Development

### Project Structure

```
hackspace/
├── backend/                 # Node.js API server
│   ├── routes/             # API endpoints
│   ├── services/           # Business logic
│   │   ├── nlpRules.js     # Rule-based NLP
│   │   ├── llmGateway.js   # LLM integration
│   │   └── chartOrchestrator.js
│   ├── utils/              # Utilities
│   └── server.js           # Main server
├── Hackermans/frontend/terminal/  # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Frontend utilities
│   └── public/
└── setup.sh               # Setup script
```

### Adding New Rules

1. **Intent Patterns**: Add to `INTENT_PATTERNS` in `backend/services/nlpRules.js`
2. **Entity Extraction**: Extend `ENTITY_PATTERNS` for new entities
3. **Field Mapping**: Add synonyms to `FIELD_SYNONYMS`
4. **Chart Generation**: Update `generateVegaLiteSpec` for new chart types

### Testing

```bash
# Backend tests
cd backend
npm test

# Test API endpoint
curl -X POST http://localhost:3001/api/generate-chart \
  -H "Content-Type: application/json" \
  -d '{"query": "Show sales by region", "dataSchema": [...], "sampleData": [...]}'
```

## 🚀 Production Deployment

### Docker Deployment

```dockerfile
# Backend
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Setup

1. **Ollama Service**: Run as system service
2. **Model Management**: Pre-pull required models
3. **Monitoring**: Set up logging and health checks
4. **Scaling**: Use PM2 for process management

### Security Considerations

- Input validation and sanitization
- Rate limiting for API endpoints
- CORS configuration for production
- Secure environment variable management
- Log monitoring for suspicious activity

## 🔍 Troubleshooting

### Common Issues

1. **Ollama Connection Failed**
   ```bash
   # Check if Ollama is running
   ollama serve
   
   # Verify model is loaded
   ollama list
   ```

2. **Low Chart Quality**
   - Review rule patterns in `nlpRules.js`
   - Check confidence thresholds
   - Analyze LLM fallback logs

3. **Performance Issues**
   - Use smaller LLM models
   - Increase confidence thresholds
   - Optimize rule patterns

### Logs

- **Application logs**: `backend/logs/combined.log`
- **Error logs**: `backend/logs/error.log`
- **Debug mode**: Set `LOG_LEVEL=debug` in `.env`

## 📈 Performance

### Benchmarks

- **Rule-based**: ~50ms response time
- **LLM fallback**: ~2-5s response time
- **Memory usage**: ~3-5GB with Ollama
- **Concurrent users**: 10-50 (depending on hardware)

### Optimization Tips

1. **Increase rule coverage** to reduce LLM usage
2. **Use smaller models** for faster responses
3. **Cache common patterns** for repeated queries
4. **Optimize prompts** for better LLM performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Documentation**: See `backend/README.md` for detailed setup
- **Issues**: Report bugs and feature requests
- **Community**: Join discussions for help and tips

---

**Built with ❤️ for the data visualization community**
