"""
Flask application for generating graph operation JSON using Ollama LLM
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import logging
from datetime import datetime
import re

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ollama configuration
OLLAMA_URL = "http://localhost:11434"
MODEL_NAME = "phi3.5:latest"  # Using available model

# System prompt template for the LLM
SYSTEM_PROMPT_TEMPLATE = """You are a JSON generator for chart/graph operations. Convert natural language requests into valid JSON for chart manipulation.
Rules:

ALWAYS return ONLY valid JSON, no explanations or markdown
Strictly follow the JSON template given below
Use ONLY these operations: "create", "update", "delete"
For delete operations, only plotName and operation are required
Based on your understanding, assign the size value to "small", "medium", or "large"
Default to "medium" size and "bar" chart if not specified
Do not put the same column name for xAxis and yAxis
Already existing chart names are {existing_graphs} exactly.
If the user asks to delete or update a chart, you should put plotName as one of the existing charts exactly, if none match put the plotName as unknown.
For update and delete do not deviate from the existing chart names.

JSON template:
{{
"plotName": "<has to be filled>",
"operation": "create/update/delete",
"plotType": "line/bar/scatter/pie/area/histogram/heatmap",
"size": "small/medium/large",
"xAxis": "<GrossQuantity/FlowRate/ShipmentCompartmentID/BaseProductID/BaseProductCode/ShipmentID/ShipmentCode/ExitTime/BayCode/ScheduledDate/CreatedTime>",
"yAxis":  "<GrossQuantity/FlowRate/ShipmentCompartmentID/BaseProductID/BaseProductCode/ShipmentID/ShipmentCode/ExitTime/BayCode/ScheduledDate/CreatedTime>",
}}

Chart type keywords:

"line graph", "trend" → "line"
"bar chart", "column" → "bar"
"scatter plot", "dots" → "scatter"
"pie chart","pi chart", "donut" → "pie"
"area chart" → "area"
"histogram", "distribution" → "histogram"
"heatmap", "matrix" → "heatmap"

Example 1:
User: "Create a small bar chart showing GrossQuantity against BayCode"
Output:
{{
"plotName": "gross_quantity_chart",
"operation": "create",
"plotType": "bar",
"size":  "small",
"xAxis": "BayCode",
"yAxis": "GrossQuantity",

}}

Example2:
User: "Delete flow_rate_chart"
Output:
{{
"plotName": "flow_rate_chart",
"operation": "delete",
}}

Example3:
User: "Make the base product code chart bigger"
Output:
{{
"plotName": "base_product_code_chart",
"operation": "update",
"size": "large",
}}
Remember: Return ONLY the JSON object, nothing else."""

# System prompt for insights SQL query mapping
INSIGHTS_SYSTEM_PROMPT = """You are a SQL query mapper for bulk liquid terminal analytics. Your job is to map natural language questions to one of the predefined SQL queries.

You have access to 6 predefined SQL queries for terminal analytics:

1. DAILY_THROUGHPUT_ANALYSIS - For questions about daily productivity, throughput trends, capacity utilization, peak/low activity periods
2. BAY_PERFORMANCE_COMPARISON - For questions about bay performance, resource allocation, equipment maintenance, bay comparisons
3. FLOW_RATE_PERFORMANCE_ANALYSIS - For questions about flow rate optimization, equipment efficiency, technical issues, performance benchmarking
4. SCHEDULE_ADHERENCE_ANALYSIS - For questions about operational efficiency, scheduling bottlenecks, delays, customer service
5. PRODUCT_PORTFOLIO_PERFORMANCE - For questions about product mix, profitability, high-volume products, specialty products
6. OPERATIONAL_TIME_PATTERNS - For questions about operating hours, staffing schedules, seasonal trends, capacity planning

ALWAYS return ONLY the query identifier (e.g., "DAILY_THROUGHPUT_ANALYSIS"), no explanations or additional text.

Examples:
User: "Show me daily throughput trends"
Output: DAILY_THROUGHPUT_ANALYSIS

User: "Which bays are performing best?"
Output: BAY_PERFORMANCE_COMPARISON

User: "What are the flow rate issues?"
Output: FLOW_RATE_PERFORMANCE_ANALYSIS

User: "How are we doing with schedule adherence?"
Output: SCHEDULE_ADHERENCE_ANALYSIS

User: "Which products are most profitable?"
Output: PRODUCT_PORTFOLIO_PERFORMANCE

User: "What are the peak operating hours?"
Output: OPERATIONAL_TIME_PATTERNS

Remember: Return ONLY the query identifier, nothing else."""

# Predefined SQL queries for insights
INSIGHTS_SQL_QUERIES = {
    "DAILY_THROUGHPUT_ANALYSIS": """
        -- Daily throughput trends
        SELECT 
          CAST(STRPTIME(ScheduledDate, '%m/%d/%Y %H:%M:%S') AS DATE) AS operation_date,
          COUNT(*) AS total_shipments,
          SUM(GrossQuantity) AS daily_volume,
          AVG(FlowRate) AS avg_flow_rate,
          AVG(GrossQuantity) AS avg_shipment_size
        FROM shipments 
        GROUP BY operation_date
        ORDER BY operation_date
    """,
    
    "BAY_PERFORMANCE_COMPARISON": """
        -- Bay performance comparison
        SELECT 
          BayCode,
          COUNT(*) AS total_operations,
          AVG(GrossQuantity) AS avg_volume_per_operation,
          AVG(FlowRate) AS avg_flow_rate,
          SUM(GrossQuantity) AS total_volume_handled
        FROM shipments 
        GROUP BY BayCode
        ORDER BY total_volume_handled DESC
    """,
    
    "FLOW_RATE_PERFORMANCE_ANALYSIS": """
        -- Flow rate performance by product and bay
        SELECT 
          BayCode,
          BaseProductCode,
          AVG(FlowRate) AS avg_flow_rate,
          MIN(FlowRate) AS min_flow_rate,
          MAX(FlowRate) AS max_flow_rate,
          STDDEV_POP(FlowRate) AS flow_rate_variance,
          COUNT(*) AS operations_count
        FROM shipments 
        GROUP BY BayCode, BaseProductCode
        HAVING COUNT(*) >= 5
    """,
    
    "SCHEDULE_ADHERENCE_ANALYSIS": """
        -- Schedule vs actual performance analysis
        SELECT 
          CAST(STRPTIME(ScheduledDate, '%m/%d/%Y %H:%M:%S') AS DATE) AS scheduled_date,
          COUNT(*) AS total_shipments,
          AVG(EXTRACT(epoch FROM (STRPTIME(ExitTime, '%m/%d/%Y %H:%M:%S') - STRPTIME(ScheduledDate, '%m/%d/%Y %H:%M:%S'))) / 3600) AS avg_duration_hours,
          COUNT(CASE WHEN STRPTIME(ExitTime, '%m/%d/%Y %H:%M:%S') > STRPTIME(ScheduledDate, '%m/%d/%Y %H:%M:%S') + INTERVAL '2 hours' THEN 1 END) AS delayed_operations
        FROM shipments 
        WHERE ExitTime IS NOT NULL
        GROUP BY scheduled_date
        ORDER BY scheduled_date
    """,
    
    "PRODUCT_PORTFOLIO_PERFORMANCE": """
        -- Product performance analysis
        SELECT 
          BaseProductCode,
          COUNT(*) AS shipment_frequency,
          SUM(GrossQuantity) AS total_volume,
          AVG(GrossQuantity) AS avg_shipment_size,
          AVG(FlowRate) AS avg_processing_rate,
          100.0 * SUM(GrossQuantity) / SUM(SUM(GrossQuantity)) OVER () AS volume_percentage
        FROM shipments 
        GROUP BY BaseProductCode
        ORDER BY total_volume DESC
    """,
    
    "OPERATIONAL_TIME_PATTERNS": """
        -- Hourly, daily, weekly patterns
        SELECT 
          EXTRACT(hour FROM STRPTIME(ScheduledDate, '%m/%d/%Y %H:%M:%S')) AS hour_of_day,
          EXTRACT(dow FROM STRPTIME(ScheduledDate, '%m/%d/%Y %H:%M:%S')) AS day_of_week,
          COUNT(*) AS operation_count,
          AVG(GrossQuantity) AS avg_volume,
          AVG(FlowRate) AS avg_flow_rate
        FROM shipments 
        GROUP BY hour_of_day, day_of_week
        ORDER BY hour_of_day, day_of_week
    """
}


def call_ollama(prompt, existing_graphs="", model=MODEL_NAME):
    """
    Call Ollama API to generate response
    """
    try:
        # Create the system prompt with existing_graphs as f-string
        system_prompt = f"{SYSTEM_PROMPT_TEMPLATE.format(existing_graphs=existing_graphs)}"
        
        # Print the request being sent for debugging
        full_prompt = f"{system_prompt}\n\nUser: {prompt}\nOutput:"
        print("=" * 80)
        print("OLLAMA REQUEST:")
        print("=" * 80)
        print(f"Model: {model}")
        print(f"Full prompt: {full_prompt}")
        print("=" * 80)
        
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": model,
                "prompt": full_prompt,
                "stream": False,
                "temperature": 0.1,  # Low temperature for consistent JSON output
                "top_p": 0.9,
                "max_tokens": 500
            },
            timeout=100
        )
        
        if response.status_code == 200:
            result = response.json()
            return result.get("response", "")
        else:
            logger.error(f"Ollama API error: {response.status_code}")
            return None
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling Ollama: {str(e)}")
        return None

def call_ollama_insights(prompt, model=MODEL_NAME):
    """
    Call Ollama API specifically for insights query mapping
    """
    try:
        # Print the request being sent for debugging
        full_prompt = f"{INSIGHTS_SYSTEM_PROMPT}\n\nUser: {prompt}\nOutput:"
        print("=" * 80)
        print("OLLAMA INSIGHTS REQUEST:")
        print("=" * 80)
        print(f"Model: {model}")
        print(f"Full prompt: {full_prompt}")
        print("=" * 80)
        
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": model,
                "prompt": full_prompt,
                "stream": False,
                "temperature": 0.1,  # Low temperature for consistent output
                "top_p": 0.9,
                "max_tokens": 100  # Short response expected
            },
            timeout=100
        )
        
        if response.status_code == 200:
            result = response.json()
            return result.get("response", "").strip()
        else:
            logger.error(f"Ollama API error: {response.status_code}")
            return None
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling Ollama: {str(e)}")
        return None

def extract_json_from_response(response_text):
    """
    Robust JSON extraction from LLM response, handling various formats and edge cases
    """
    print("=" * 80)
    print("JSON EXTRACTION PROCESS:")
    print("=" * 80)
    print(f"Original response: {response_text}")
    
    if not response_text:
        print("Empty response received")
        return None
    
    # Store original for fallback
    original_text = response_text
    cleaned_text = response_text
    
    # Step 1: Remove common markdown code block patterns
    # Handle json, JSON, , etc.
    markdown_patterns = [
        r'[jJ][sS][oO][nN]?\s*\n?',  # json or JSON
        r'```\s*\n?',  # Just backticks
        r'`',  # Single backticks
    ]
    
    for pattern in markdown_patterns:
        cleaned_text = re.sub(pattern, '', cleaned_text)
    
    print(f"After removing markdown: {cleaned_text}")
    
    # Step 2: Remove common prefixes/suffixes that LLMs might add
    # Remove "Here is the JSON:", "Output:", etc.
    prefix_patterns = [
        r'^.?(?:here\s+is|output|result|json|response)[\s:]',
        r'^.?:\s',  # Any text ending with colon
    ]
    
    for pattern in prefix_patterns:
        cleaned_text = re.sub(pattern, '', cleaned_text, flags=re.IGNORECASE)
    
    # Step 3: Remove trailing explanations
    # Look for JSON object and remove everything after it
    json_match = re.search(r'(\{[^{}](?:\{[^{}]\}[^{}])\})', cleaned_text, re.DOTALL)
    if json_match:
        cleaned_text = json_match.group(1)
        print(f"Extracted JSON object: {cleaned_text}")
    
    # Step 4: Clean up comments (both // and /* */ style)
    # Remove single-line comments
    cleaned_text = re.sub(r'//.*?(?=\n|$)', '', cleaned_text)
    # Remove multi-line comments
    cleaned_text = re.sub(r'/\.?\*/', '', cleaned_text, flags=re.DOTALL)
    
    # Step 5: Fix common JSON issues
    # Remove trailing commas before closing brackets
    cleaned_text = re.sub(r',\s*(\]|\})', r'\1', cleaned_text)
    
    # Step 6: Handle escaped quotes that might be incorrectly formatted
    # Replace smart quotes with regular quotes
    cleaned_text = cleaned_text.replace('"', '"').replace('"', '"')
    cleaned_text = cleaned_text.replace(''', "'").replace(''', "'")
    
    # Step 7: Remove any remaining non-JSON content before/after braces
    # Find the first { and last }
    first_brace = cleaned_text.find('{')
    last_brace = cleaned_text.rfind('}')
    
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        cleaned_text = cleaned_text[first_brace:last_brace + 1]
    
    # Step 8: Clean up whitespace issues
    # Remove excessive whitespace while preserving structure
    cleaned_text = re.sub(r'\s+', ' ', cleaned_text)
    # Fix spacing around JSON syntax elements
    cleaned_text = re.sub(r'\s*:\s*', ':', cleaned_text)
    cleaned_text = re.sub(r'\s*,\s*', ',', cleaned_text)
    cleaned_text = re.sub(r'{\s*', '{', cleaned_text)
    cleaned_text = re.sub(r'\s*}', '}', cleaned_text)
    
    print(f"After all cleaning: {cleaned_text}")
    
    # Step 9: Try to parse the cleaned JSON
    try:
        parsed_json = json.loads(cleaned_text)
        print(f"Successfully parsed JSON: {parsed_json}")
        
        # Step 10: Validate and fix the parsed JSON structure
        parsed_json = validate_and_fix_json_structure(parsed_json)
        
        return parsed_json
    except json.JSONDecodeError as e:
        print(f"JSON decode error after cleaning: {e}")
        
        # Step 11: Fallback - try to manually construct valid JSON
        # This handles cases where the LLM returns values without proper quotes
        try:
            # Try to fix common quote issues
            fixed_text = fix_json_quotes(cleaned_text)
            parsed_json = json.loads(fixed_text)
            print(f"Successfully parsed after quote fixing: {parsed_json}")
            parsed_json = validate_and_fix_json_structure(parsed_json)
            return parsed_json
        except:
            pass
        
        # Step 12: Last resort - extract key-value pairs manually
        extracted_json = extract_json_manually(original_text)
        if extracted_json:
            print(f"Manually extracted JSON: {extracted_json}")
            return extracted_json
        
        print("Failed to extract valid JSON")
        return None


def fix_json_quotes(text):
    """
    Fix common quote issues in JSON strings
    """
    # Pattern to find key-value pairs
    # This regex looks for patterns like: key: value, "key": value, key: "value", etc.
    pattern = r'(["\']?)(\w+)\1\s*:\s*(["\']?)([^,}\]]+)\3'
    
    def replace_match(match):
        key = match.group(2)
        value = match.group(4).strip()
        
        # Check if value should be a string or not
        if value.lower() in ['true', 'false', 'null'] or value.replace('.', '').replace('-', '').isdigit():
            return f'"{key}": {value}'
        else:
            # Escape quotes in value if needed
            value = value.replace('"', '\\"')
            return f'"{key}": "{value}"'
    
    fixed = re.sub(pattern, replace_match, text)
    return fixed


def extract_json_manually(text):
    """
    Manually extract JSON key-value pairs from text as a last resort
    """
    try:
        result = {}
        
        # Define expected fields and their patterns
        field_patterns = {
            'plotName': r'plotName["\']?\s*:\s*["\']?([^",}\n]+)',
            'operation': r'operation["\']?\s*:\s*["\']?([^",}\n]+)',
            'plotType': r'plotType["\']?\s*:\s*["\']?([^",}\n]+)',
            'size': r'size["\']?\s*:\s*["\']?([^",}\n]+)',
            'xAxis': r'xAxis["\']?\s*:\s*["\']?([^",}\n]+)',
            'yAxis': r'yAxis["\']?\s*:\s*["\']?([^",}\n]+)'
        }
        
        for field, pattern in field_patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value = match.group(1).strip().strip('"').strip("'")
                result[field] = value
        
        # Only return if we found at least the required fields
        if 'plotName' in result and 'operation' in result:
            return result
        
        return None
    except Exception as e:
        print(f"Error in manual extraction: {e}")
        return None


def validate_and_fix_json_structure(data):
    """
    Validate and fix the JSON structure to ensure it matches expected format
    """
    if not isinstance(data, dict):
        return data
    
    # Ensure operation is lowercase
    if 'operation' in data:
        data['operation'] = data['operation'].lower()
    
    # Ensure plotType is lowercase if present
    if 'plotType' in data:
        data['plotType'] = data['plotType'].lower()
    
    # Ensure size is lowercase if present
    if 'size' in data:
        data['size'] = data['size'].lower()
    
    # Remove any extra fields that shouldn't be there
    valid_fields = ['plotName', 'operation', 'plotType', 'size', 'xAxis', 'yAxis']
    keys_to_remove = [key for key in data.keys() if key not in valid_fields]
    for key in keys_to_remove:
        del data[key]
    
    # For delete operation, remove unnecessary fields
    if data.get('operation') == 'delete':
        fields_to_keep = ['plotName', 'operation']
        keys_to_remove = [key for key in data.keys() if key not in fields_to_keep]
        for key in keys_to_remove:
            del data[key]
    
    return data


def validate_graph_json(data):
    """
    Validate the generated JSON structure
    """
    required_fields = ["operation", "plotName"]

    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    # Validate operation type
    valid_operations = ["create", "update", "delete"]
    if data["operation"] not in valid_operations:
        return False, f"Invalid operation: {data['operation']}"
    
    # For create operation, check additional required fields
    if data["operation"] == "create":
        if data["plotType"] == "pie":
            create_required = ["plotName", "plotType", "size"]
            if not((data["xAxis"]) or (data["yAxis"])):
                return False, "Missing required field for create operation: xAxis or yAxis"
        else:
            create_required = ["plotName", "plotType", "size", "xAxis", "yAxis"]
        for field in create_required:
            if field not in data:
                return False, f"Missing required field for create operation: {field}"
        
        # Validate plotType
        valid_plot_types = ["line", "bar", "scatter", "pie", "area", "histogram", "heatmap"]
        if data["plotType"] not in valid_plot_types:
            return False, f"Invalid plotType: {data['plotType']}"
        
        # Validate size
        valid_sizes = ["small", "medium", "large"]
        if data["size"] not in valid_sizes:
            return False, f"Invalid size: {data['size']}"
        
        # Validate that xAxis and yAxis are different
        if data.get("xAxis") == data.get("yAxis"):
            return False, "xAxis and yAxis cannot be the same"
    
    return True, "Valid"




@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "ollama_url": OLLAMA_URL, "model": MODEL_NAME})



@app.route('/generate-graph-json', methods=['POST'])
def generate_graph_json():
    try:
        data = request.get_json()
        
        # Print incoming request for debugging
        print("=" * 80)
        print("INCOMING REQUEST:")
        print("=" * 80)
        print(f"Request data: {data}")
        print("=" * 80)
        
        # Add logging to see incoming request
        logger.info(f"Received request data: {data}")
        
        if not data or 'query' not in data:
            logger.error(f"Invalid request data: {data}")
            return jsonify({
                "error": "Missing 'query' field in request body"
            }), 400
        
        user_query = data['query']
        existing_graphs = data.get('existingGraphs', '')
        print(f"User query: {user_query}")
        print(f"Existing graphs: {existing_graphs}")
        logger.info(f"Received query: {user_query}")
        logger.info(f"Existing graphs: {existing_graphs}")
        
        # Call Ollama to generate JSON
        llm_response = call_ollama(user_query, existing_graphs)
        
        # Print raw LLM output for debugging
        print("=" * 80)
        print("RAW LLM OUTPUT:")
        print("=" * 80)
        print(llm_response)
        print("=" * 80)
        logger.info(f"LLM raw response: {llm_response}")
        
        if not llm_response:
            return jsonify({
                "error": "Failed to get response from Ollama. Make sure Ollama is running."
            }), 500
        
        # Extract JSON from response
        graph_json = extract_json_from_response(llm_response)
        
        # Print JSON before validation for debugging
        print("=" * 80)
        print("EXTRACTED JSON (BEFORE VALIDATION):")
        print("=" * 80)
        print(json.dumps(graph_json, indent=2))
        print("=" * 80)
        logger.info(f"Extracted JSON: {graph_json}")
        
        # ... rest of your code
        if not graph_json:
            logger.error(f"Failed to parse JSON from LLM response: {llm_response}")
            return jsonify({
                "error": "Failed to parse valid JSON from LLM response",
                "raw_response": llm_response
            }), 500
        
        # Validate the generated JSON
        is_valid, validation_message = validate_graph_json(graph_json)
        
        # Print validation results for debugging
        print("=" * 80)
        print("VALIDATION RESULTS:")
        print("=" * 80)
        print(f"Valid: {is_valid}")
        print(f"Message: {validation_message}")
        print("=" * 80)
        
        if not is_valid:
            print("=" * 80)
            print("VALIDATION FAILED - RETURNING ERROR")
            print("=" * 80)
            return jsonify({
                "error": f"Invalid graph JSON: {validation_message}",
                "generated_json": graph_json
            }), 400
        
        # Print final JSON after validation
        print("=" * 80)
        print("FINAL JSON (AFTER VALIDATION):")
        print("=" * 80)
        print(json.dumps(graph_json, indent=2))
        print("=" * 80)
        logger.info(f"Successfully generated graph JSON: {json.dumps(graph_json)}")
        
        # Prepare final response
        final_response = {
            "success": True,
            "query": user_query,
            "graphOperation": graph_json
        }
        
        # Print final response for debugging
        print("=" * 80)
        print("FINAL RESPONSE BEING SENT:")
        print("=" * 80)
        print(json.dumps(final_response, indent=2))
        print("=" * 80)
        
        return jsonify(final_response), 200
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({
            "error": f"Internal server error: {str(e)}"
        }), 500


@app.route('/process-graph-operation', methods=['POST'])
def process_graph_operation():
    """
    Endpoint for the Node.js backend to send processed graph operations
    This can be used to store or further process the operations
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Here you can add logic to store the operation, update a database, etc.
        logger.info(f"Received graph operation from Node backend: {json.dumps(data)}")
        
        # For now, just acknowledge receipt
        return jsonify({
            "success": True,
            "message": "Graph operation processed successfully",
            "operation": data.get("operation"),
            "plotName": data.get("plotName")
        }), 200
        
    except Exception as e:
        logger.error(f"Error processing graph operation: {str(e)}")
        return jsonify({
            "error": f"Failed to process graph operation: {str(e)}"
        }), 500


@app.route('/list-models', methods=['GET'])
def list_models():
    """
    List available Ollama models
    """
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags")
        if response.status_code == 200:
            models = response.json().get("models", [])
            model_names = [model["name"] for model in models]
            return jsonify({
                "models": model_names,
                "current_model": MODEL_NAME
            }), 200
        else:
            return jsonify({"error": "Failed to fetch models from Ollama"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/insights/query', methods=['POST'])
def process_insights_query():
    """
    Process natural language insights query and return the corresponding SQL query
    """
    try:
        data = request.get_json()
        
        # Print incoming request for debugging
        print("=" * 80)
        print("INSIGHTS REQUEST:")
        print("=" * 80)
        print(f"Request data: {data}")
        print("=" * 80)
        
        if not data or 'query' not in data:
            logger.error(f"Invalid request data: {data}")
            return jsonify({
                "error": "Missing 'query' field in request body"
            }), 400
        
        user_query = data['query']
        print(f"User insights query: {user_query}")
        logger.info(f"Received insights query: {user_query}")
        
        # Call Ollama to map the query to a predefined SQL query
        llm_response = call_ollama_insights(user_query)
        
        # Print raw LLM output for debugging
        print("=" * 80)
        print("RAW LLM INSIGHTS OUTPUT:")
        print("=" * 80)
        print(llm_response)
        print("=" * 80)
        logger.info(f"LLM insights response: {llm_response}")
        
        if not llm_response:
            return jsonify({
                "error": "Failed to get response from Ollama. Make sure Ollama is running."
            }), 500
        
        # Clean the response to get the query identifier
        query_identifier = llm_response.strip().upper()
        
        # Validate that the query identifier exists in our predefined queries
        if query_identifier not in INSIGHTS_SQL_QUERIES:
            logger.error(f"Invalid query identifier: {query_identifier}")
            return jsonify({
                "error": f"Invalid query identifier: {query_identifier}",
                "available_queries": list(INSIGHTS_SQL_QUERIES.keys()),
                "raw_response": llm_response
            }), 400
        
        # Get the corresponding SQL query
        sql_query = INSIGHTS_SQL_QUERIES[query_identifier]
        
        # Print final response for debugging
        print("=" * 80)
        print("FINAL INSIGHTS RESPONSE:")
        print("=" * 80)
        print(f"Query Identifier: {query_identifier}")
        print(f"SQL Query: {sql_query}")
        print("=" * 80)
        
        # Prepare final response
        final_response = {
            "success": True,
            "query": user_query,
            "query_identifier": query_identifier,
            "sql_query": sql_query.strip(),
            "description": get_query_description(query_identifier)
        }
        
        logger.info(f"Successfully processed insights query: {json.dumps(final_response)}")
        
        return jsonify(final_response), 200
        
    except Exception as e:
        logger.error(f"Unexpected error in insights processing: {str(e)}")
        return jsonify({
            "error": f"Internal server error: {str(e)}"
        }), 500

def get_query_description(query_identifier):
    """
    Get a human-readable description for each query identifier
    """
    descriptions = {
        "DAILY_THROUGHPUT_ANALYSIS": "Track overall terminal productivity, identify peak/low activity periods, and monitor capacity utilization trends",
        "BAY_PERFORMANCE_COMPARISON": "Identify high-performing vs. underperforming bays, optimize resource allocation, and detect equipment maintenance needs",
        "FLOW_RATE_PERFORMANCE_ANALYSIS": "Optimize equipment efficiency, identify technical issues, and benchmark performance across different product types and bays",
        "SCHEDULE_ADHERENCE_ANALYSIS": "Monitor operational efficiency, identify scheduling bottlenecks, and improve customer service by reducing delays",
        "PRODUCT_PORTFOLIO_PERFORMANCE": "Analyze product mix profitability, identify high-volume vs. specialty products, and optimize terminal configuration",
        "OPERATIONAL_TIME_PATTERNS": "Identify optimal operating hours, plan staffing schedules, and discover seasonal or weekly trends for capacity planning"
    }
    return descriptions.get(query_identifier, "No description available")

@app.route('/insights/queries', methods=['GET'])
def list_insights_queries():
    """
    List all available insights queries with their descriptions
    """
    try:
        queries_info = []
        for identifier, sql_query in INSIGHTS_SQL_QUERIES.items():
            queries_info.append({
                "identifier": identifier,
                "description": get_query_description(identifier),
                "sql_query": sql_query.strip()
            })
        
        return jsonify({
            "success": True,
            "queries": queries_info,
            "total_count": len(queries_info)
        }), 200
        
    except Exception as e:
        logger.error(f"Error listing insights queries: {str(e)}")
        return jsonify({
            "error": f"Failed to list insights queries: {str(e)}"
        }), 500


if __name__ == '__main__':
    print(f"Starting Flask server...")
    print(f"Using Ollama at: {OLLAMA_URL}")
    print(f"Using model: {MODEL_NAME}")
    print(f"\nMake sure Ollama is running with: ollama serve")
    print(f"And pull the model if needed: ollama pull {MODEL_NAME}\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)