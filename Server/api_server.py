"""
FastAPI HTTP Server - Direct bridge to MCP tool functions.

This server exposes REST endpoints that directly call the MCP tool functions,
allowing the React frontend to access options analysis capabilities via HTTP.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
import logging
import uvicorn
import sys
import os

# Add Server directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import MCP tool functions directly
from Server.core.tools.get_expiration import get_option_expiration
from Server.core.tools.get_option_chain import get_option_chain
from Server.core.tools.greeks import compute_greeks_chain
from Server.core.tools.get_implied_distribution import get_implied_distribution
from Server.core.tools.compute_payoff import compute_option_payoff
from Server.core.tools.get_historical_prices import get_historical_prices

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Options Terminal API",
    description="HTTP bridge to options analysis tools",
    version="1.0.0"
)

# Configure CORS
origins = [
    "http://localhost:5173",  # Vite default port
    "http://localhost:5174",  # Vite alternative port
    "http://localhost:3000",  # Alternative port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
    # Explicit ngrok domain provided
    "https://tenuously-unswitched-alma.ngrok-free.dev",
    "http://tenuously-unswitched-alma.ngrok-free.dev",
]

# Support a stable/custom ngrok domain via environment (e.g., your-name.ngrok-free.dev)
ngrok_domain = os.getenv("NGROK_DOMAIN")
if ngrok_domain:
    # Accept both http and https depending on how it's exposed
    origins.extend([
        f"http://{ngrok_domain}",
        f"https://{ngrok_domain}",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # Allow all ngrok subdomains (http and https) without editing this file each run.
    # Matches e.g., http(s)://*.ngrok-free.dev and http(s)://*.ngrok.app
    allow_origin_regex=r"https?://.*\.ngrok(-free)?\.dev|https?://.*\.ngrok(-free)?\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class ToolCallRequest(BaseModel):
    """Request model for tool calls."""
    tool: str
    arguments: Dict[str, Any] = Field(default_factory=dict)


class ToolCallResponse(BaseModel):
    """Response model for tool calls."""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# Tool dispatch map
TOOL_MAP = {
    "get_expirations": get_option_expiration,
    "get_chain": get_option_chain,
    "compute_greeks": compute_greeks_chain,
    "get_distribution": get_implied_distribution,
    "compute_payoff_profile": compute_option_payoff,
    "get_historical_prices_tool": get_historical_prices,
}


# API endpoints
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "tools_available": list(TOOL_MAP.keys())
    }


@app.get("/api/mcp/tools")
async def list_tools():
    """List available tools with their parameters."""
    return {
        "tools": [
            {
                "name": "get_expirations",
                "description": "Get all available option expiration dates for a ticker",
                "parameters": [
                    {"name": "underlying", "type": "str", "required": True, "description": "Stock ticker symbol"}
                ]
            },
            {
                "name": "get_chain",
                "description": "Get complete option chain (calls and puts) for a specific expiration",
                "parameters": [
                    {"name": "underlying", "type": "str", "required": True, "description": "Stock ticker symbol"},
                    {"name": "expiration", "type": "str", "required": True, "description": "Expiration date in YYYY-MM-DD format"}
                ]
            },
            {
                "name": "compute_greeks",
                "description": "Calculate Black-Scholes Greeks (delta, gamma, theta, vega, rho) for all options",
                "parameters": [
                    {"name": "underlying", "type": "str", "required": True, "description": "Stock ticker symbol"},
                    {"name": "expiration", "type": "str", "required": True, "description": "Expiration date in YYYY-MM-DD format"}
                ]
            },
            {
                "name": "get_distribution",
                "description": "Extract risk-neutral probability distribution from option prices (Breeden-Litzenberger)",
                "parameters": [
                    {"name": "underlying", "type": "str", "required": True, "description": "Stock ticker symbol"},
                    {"name": "expiration", "type": "str", "required": True, "description": "Expiration date in YYYY-MM-DD format"},
                    {"name": "min_moneyness", "type": "float", "required": False, "description": "Minimum strike/spot ratio (default: 0.7)"},
                    {"name": "max_moneyness", "type": "float", "required": False, "description": "Maximum strike/spot ratio (default: 1.3)"}
                ]
            },
            {
                "name": "compute_payoff_profile",
                "description": "Calculate complete payoff and profit/loss profile for an option position",
                "parameters": [
                    {"name": "side", "type": "str", "required": True, "description": "Position side: 'long' or 'short'"},
                    {"name": "option_type", "type": "str", "required": True, "description": "Option type: 'call' or 'put'"},
                    {"name": "underlying", "type": "str", "required": True, "description": "Stock ticker symbol"},
                    {"name": "strike", "type": "float", "required": True, "description": "Strike price"},
                    {"name": "expiration", "type": "str", "required": True, "description": "Expiration date in YYYY-MM-DD format"},
                    {"name": "spot_min", "type": "float", "required": False, "description": "Minimum spot price for payoff range"},
                    {"name": "spot_max", "type": "float", "required": False, "description": "Maximum spot price for payoff range"}
                ]
            },
            {
                "name": "get_historical_prices_tool",
                "description": "Get historical price data (OHLCV) for an underlying asset",
                "parameters": [
                    {"name": "underlying", "type": "str", "required": True, "description": "Stock ticker symbol"},
                    {"name": "period", "type": "str", "required": False, "description": "Time period (e.g., '1mo', '3mo', '6mo', '1y')"},
                    {"name": "interval", "type": "str", "required": False, "description": "Data interval (e.g., '1d', '1h', '1wk')"}
                ]
            }
        ]
    }


@app.get("/api/mcp/call-tool")
async def call_tool_info():
    """
    Information about the call-tool endpoint.
    This endpoint requires POST requests.
    """
    return {
        "error": "Method Not Allowed",
        "message": "This endpoint requires a POST request",
        "usage": {
            "method": "POST",
            "endpoint": "/api/mcp/call-tool",
            "content_type": "application/json",
            "body": {
                "tool": "string (required)",
                "arguments": "object (optional)"
            },
            "example": {
                "tool": "get_expirations",
                "arguments": {
                    "underlying": "AAPL"
                }
            }
        },
        "available_tools": list(TOOL_MAP.keys())
    }


@app.post("/api/mcp/call-tool", response_model=ToolCallResponse)
async def call_tool(request: ToolCallRequest):
    """
    Call a tool with the given arguments.

    Args:
        request: ToolCallRequest containing tool name and arguments

    Returns:
        ToolCallResponse with success status, data, or error message
    """
    # Get arguments, default to empty dict if not provided
    args = request.arguments or {}
    
    logger.info(f"Calling tool: {request.tool} with args: {args}")

    try:
        # Get the tool function
        tool_func = TOOL_MAP.get(request.tool)
        if not tool_func:
            raise HTTPException(
                status_code=404,
                detail=f"Tool '{request.tool}' not found. Available tools: {list(TOOL_MAP.keys())}"
            )

        # Special handling for compute_payoff_profile (parameter name mapping)
        if request.tool == "compute_payoff_profile":
            # Map 'strike' to 'Strike' (capital S) as the function expects
            if "strike" in args:
                args["Strike"] = args.pop("strike")

        # Call the tool function
        result = tool_func(**args)

        # Convert result to dict if it's a dataclass
        if hasattr(result, '__dict__'):
            result_dict = vars(result)
        else:
            result_dict = result

        # Handle nested dataclasses (like calls/puts lists in option chains)
        def convert_to_dict(obj):
            if isinstance(obj, list):
                return [convert_to_dict(item) for item in obj]
            elif hasattr(obj, '__dict__'):
                return {k: convert_to_dict(v) for k, v in vars(obj).items()}
            else:
                return obj

        result_dict = convert_to_dict(result_dict)

        logger.info(f"Tool {request.tool} executed successfully")
        return ToolCallResponse(success=True, data=result_dict)

    except TypeError as e:
        # Handle invalid arguments
        logger.error(f"Invalid arguments: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid arguments: {str(e)}")

    except ValueError as e:
        # Handle validation errors from tools (e.g., invalid expiration)
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        # Handle other errors
        logger.error(f"Tool execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Tool execution failed: {str(e)}")


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Options Terminal API",
        "version": "1.0.0",
        "description": "HTTP bridge to options analysis tools",
        "endpoints": {
            "health": "/api/health",
            "tools": "/api/mcp/tools",
            "call_tool": "/api/mcp/call-tool"
        }
    }


if __name__ == "__main__":
    # Run the server
    logger.info("Starting Options Terminal API Server...")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,  
        log_level="info"
    )
