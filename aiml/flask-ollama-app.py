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
SYSTEM_PROMPT_TEMPLATE ="""You are a JSON generator for chart/graph operations. Convert natural language requests into valid JSON for chart manipulation.
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
INSIGHTS_SYSTEM_PROMPT = f"""
You are an expert T-SQL Data Analyst managing a bulk liquid terminal database. 
Your job is to generate accurate, executable Microsoft SQL Server (T-SQL) queries based on natural language questions.

### Database Schema
The table named `shipments` contains the following columns:
{Column_descriptions}

### Rules
1. **Dialect:** Use strict T-SQL (MSSQL) syntax.
2. **Date Handling:** Assume date columns are stored as strings in 'MM/DD/YYYY HH:MM:SS' format unless specified otherwise. Use `TRY_CONVERT` or `CAST` for date operations.
3. **Format:** Return *only* the SQL query. Do not use Markdown code blocks (```sql). Do not include explanations.
4. **Logic:** Use appropriate aggregation, `GROUP BY`, and `ORDER BY` clauses to answer the specific question.

### Few-Shot Examples
Refer to these examples to understand how to map business questions to SQL logic:

Input: "Show me daily throughput trends including total shipments and average flow rates."
Output: 
SELECT 
    CAST(ScheduledDate AS DATE) AS operation_date,
    COUNT(*) AS total_shipments,
    SUM(GrossQuantity) AS daily_volume,
    AVG(FlowRate) AS avg_flow_rate,
    AVG(GrossQuantity) AS avg_shipment_size
FROM shipments 
GROUP BY CAST(ScheduledDate AS DATE)
ORDER BY operation_date;

Input: "Compare the performance of different bays based on volume and flow rate."
Output: 
SELECT 
    BayCode,
    COUNT(*) AS total_operations,
    AVG(GrossQuantity) AS avg_volume_per_operation,
    AVG(FlowRate) AS avg_flow_rate,
    SUM(GrossQuantity) AS total_volume_handled
FROM shipments 
GROUP BY BayCode
ORDER BY total_volume_handled DESC;

Input: "Analyze flow rate consistency and variance by product and bay."
Output: 
SELECT 
    BayCode,
    BaseProductCode,
    AVG(FlowRate) AS avg_flow_rate,
    MIN(FlowRate) AS min_flow_rate,
    MAX(FlowRate) AS max_flow_rate,
    STDEV(FlowRate) AS flow_rate_variance,
    COUNT(*) AS operations_count
FROM shipments 
GROUP BY BayCode, BaseProductCode
HAVING COUNT(*) >= 5;

Input: "Check schedule adherence to see if we are facing delays."
Output: 
SELECT 
    CAST(ScheduledDate AS DATE) AS scheduled_date,
    COUNT(*) AS total_shipments,
    AVG(DATEDIFF(second, ScheduledDate, ExitTime) / 3600.0) AS avg_duration_hours,
    SUM(CASE WHEN ExitTime > DATEADD(hour, 2, ScheduledDate) THEN 1 ELSE 0 END) AS delayed_operations
FROM shipments 
WHERE ExitTime IS NOT NULL
GROUP BY CAST(ScheduledDate AS DATE)
ORDER BY scheduled_date;

Input: "Which products are performing best in terms of volume and mix?"
Output: 
SELECT 
    BaseProductCode,
    COUNT(*) AS shipment_frequency,
    SUM(GrossQuantity) AS total_volume,
    AVG(GrossQuantity) AS avg_shipment_size,
    AVG(FlowRate) AS avg_processing_rate,
    (SUM(GrossQuantity) * 100.0 / SUM(SUM(GrossQuantity)) OVER ()) AS volume_percentage
FROM shipments 
GROUP BY BaseProductCode
ORDER BY total_volume DESC;

Input: "What are the operational patterns by hour of day and day of week?"
Output: 
SELECT 
    DATEPART(hour, ScheduledDate) AS hour_of_day,
    DATEPART(weekday, ScheduledDate) AS day_of_week,
    COUNT(*) AS operation_count,
    AVG(GrossQuantity) AS avg_volume,
    AVG(FlowRate) AS avg_flow_rate
FROM shipments 
GROUP BY DATEPART(hour, ScheduledDate), DATEPART(weekday, ScheduledDate)
ORDER BY hour_of_day, day_of_week;
"""



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

def call_ollama_insights(prompt,Column_descriptions, model=MODEL_NAME):
    """
    Call Ollama API specifically for insights query mapping
    """
    try:
        # Print the request being sent for debugging
        system_prompt = f"{INSIGHTS_SYSTEM_PROMPT.format(Column_descriptions=Column_descriptions)}"
        full_prompt = f"{system_prompt}\n\nUser: {prompt}\nOutput:"
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
        #get Column_descriptions from database SUPRO
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
        llm_response = call_ollama_insights(user_query, Column_descriptions)
        
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
        code_block_pattern = r"```(?:sql|SQL)?\s*(.*?)```"
        match = re.search(code_block_pattern, llm_response, re.DOTALL)
        
        if match:
            query = match.group(1)
        else:
            # 2. If no block found, assume the whole text is the query
            query = llm_response

        # 3. Clean up generic formatting artifacts
        # Strip whitespace
        query = query.strip()
        
        # Remove leading/trailing backticks if they exist (common in inline code formatting)
        query = query.strip('`')
        query = query.strip()
        
      
        print(f"SQL Query: {query}")
        print("=" * 80)
        
        # Prepare final response
        final_response = {
            "success": True,
            "user_question": user_query,
            "sql_query": query,
        }
        
        logger.info(f"Successfully processed insights query: {json.dumps(final_response)}")
        
        return jsonify(final_response), 200
        
    except Exception as e:
        logger.error(f"Unexpected error in insights processing: {str(e)}")
        return jsonify({
            "error": f"Internal server error: {str(e)}"
        }), 500



if __name__ == '__main__':
    print(f"Starting Flask server...")
    print(f"Using Ollama at: {OLLAMA_URL}")
    print(f"Using model: {MODEL_NAME}")
    print(f"\nMake sure Ollama is running with: ollama serve")
    print(f"And pull the model if needed: ollama pull {MODEL_NAME}\n")
    
    app.run(debug=True, host='0.0.0.0', port=5001)