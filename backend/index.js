const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

// Load override loader utility
const overrideLoader = require('./core/utils/overrideLoader');

// Load database functions (can be overridden)
const dbModule = overrideLoader.load('database', 'index');
const { connectDatabase, runQuery, runQueryFirst, runQueryCount } = dbModule;

const app = express();

// Configure CORS with specific options
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

const PORT = process.env.PORT || 4000;
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'), false);
    }
  }
});

// Handle preflight requests
app.options('*', cors());

// Prepare database functions object to pass to routes
const dbFunctions = { runQuery, runQueryFirst, runQueryCount };

// Load and register all routes (with override support)
const schemaRoutes = overrideLoader.load('routes', 'schema');
schemaRoutes.registerSchemaRoutes(app, dbFunctions);

const viewsRoutes = overrideLoader.load('routes', 'views');
viewsRoutes.registerViewsRoutes(app, dbFunctions);

const shipmentsRoutes = overrideLoader.load('routes', 'shipments');
shipmentsRoutes.registerShipmentsRoutes(app, dbFunctions);

const chartDataRoutes = overrideLoader.load('routes', 'chartData');
chartDataRoutes.registerChartDataRoutes(app, dbFunctions);

const chatbotRoutes = overrideLoader.load('routes', 'chatbot');
chatbotRoutes.registerChatbotRoutes(app);

const insightsRoutes = overrideLoader.load('routes', 'insights');
insightsRoutes.registerInsightsRoutes(app, dbFunctions);

const layoutRoutes = overrideLoader.load('routes', 'layout');
layoutRoutes.registerLayoutRoutes(app, dbFunctions);

const importRoutes = overrideLoader.load('routes', 'import');
importRoutes.registerImportRoutes(app, dbFunctions, upload);

const healthRoutes = overrideLoader.load('routes', 'health');
healthRoutes.registerHealthRoutes(app, PORT);

// Initialize database and start server
const startServer = async () => {
    try {
        // Connect to database
        await connectDatabase();
        console.log('✅ Database connected successfully');
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
            console.log(`📊 Schema API (Views): http://localhost:${PORT}/api/schema`);
            console.log(`👁️  Views Management: http://localhost:${PORT}/api/views`);
            console.log(`📦 Shipments API: http://localhost:${PORT}/api/shipments`);
            console.log(`📈 Chart Data: http://localhost:${PORT}/api/chart-data`);
            console.log(`🤖 Chatbot API: http://localhost:${PORT}/api/chatbot/query`);
            console.log(`🔍 Insights: http://localhost:${PORT}/api/insights/queries`);
            console.log(`⚡ Execute Insights: http://localhost:${PORT}/api/insights/execute`);
            console.log(`💾 Layout API: http://localhost:${PORT}/api/layout`);
            
            // Show which overrides are active
            const routeModules = ['schema', 'views', 'shipments', 'chartData', 'chatbot', 'insights', 'layout', 'import', 'health'];
            const activeOverrides = routeModules.filter(module => overrideLoader.hasOverride('routes', module));
            if (activeOverrides.length > 0) {
                console.log(`\n📦 Active route overrides: ${activeOverrides.join(', ')}`);
            }
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
    