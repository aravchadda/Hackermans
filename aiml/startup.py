"""
Startup script for Flask application in IIS HttpPlatformHandler
This script is used by IIS to start the Flask application
"""

import sys
import os

# Get the directory where this script is located (aiml directory)
script_dir = os.path.dirname(os.path.abspath(__file__))

# Add to Python path
if script_dir not in sys.path:
    sys.path.insert(0, script_dir)

# Change to script directory
os.chdir(script_dir)

# Import Flask app
from flask_ollama_app import app

if __name__ == '__main__':
    # HttpPlatformHandler provides the port via HTTP_PLATFORM_PORT environment variable
    # Flask needs to bind to 127.0.0.1 and the port provided by IIS
    port = os.environ.get('HTTP_PLATFORM_PORT', os.environ.get('PORT', '5001'))
    
    # Run Flask app
    # HttpPlatformHandler will forward requests to this process
    app.run(host='127.0.0.1', port=int(port), debug=False, use_reloader=False)

