"""
MCP Client Wrapper for subprocess communication with stdio-based MCP server.

This module manages the lifecycle of the MCP server process and handles
JSON-RPC protocol communication via stdin/stdout.
"""

import asyncio
import json
import subprocess
import logging
from typing import Dict, Any, Optional
import os
import sys

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MCPClient:
    """Client for communicating with MCP server via stdio subprocess."""

    def __init__(self):
        self.process: Optional[subprocess.Popen] = None
        self.connected = False
        self.request_id = 0

    async def connect(self):
        """Start the MCP server process with stdin/stdout pipes."""
        try:
            # Get the path to the Server directory
            server_dir = os.path.dirname(os.path.abspath(__file__))
            main_py = os.path.join(server_dir, "main.py")

            logger.info(f"Starting MCP server from: {main_py}")

            # Start the MCP server process
            self.process = subprocess.Popen(
                [sys.executable, main_py],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,  # Line buffered
                cwd=server_dir
            )

            self.connected = True
            logger.info("MCP server started successfully")

        except Exception as e:
            logger.error(f"Failed to start MCP server: {e}")
            raise RuntimeError(f"Failed to start MCP server: {e}")

    async def disconnect(self):
        """Stop the MCP server process."""
        if self.process:
            try:
                self.process.terminate()
                self.process.wait(timeout=5)
                logger.info("MCP server stopped")
            except subprocess.TimeoutExpired:
                self.process.kill()
                logger.warning("MCP server killed (timeout)")
            except Exception as e:
                logger.error(f"Error stopping MCP server: {e}")
            finally:
                self.connected = False

    def is_connected(self) -> bool:
        """Check if the MCP server process is running."""
        return self.connected and self.process and self.process.poll() is None

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call an MCP tool via JSON-RPC protocol.

        Args:
            tool_name: Name of the MCP tool to call
            arguments: Dictionary of arguments for the tool

        Returns:
            Dictionary containing the tool's response data

        Raises:
            RuntimeError: If MCP server is not connected
            Exception: If tool execution fails
        """
        if not self.is_connected():
            raise RuntimeError("MCP server not connected")

        # Increment request ID
        self.request_id += 1

        # Construct JSON-RPC request
        request = {
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            },
            "id": self.request_id
        }

        try:
            # Write request to stdin
            request_str = json.dumps(request) + "\n"
            logger.debug(f"Sending request: {request_str.strip()}")
            self.process.stdin.write(request_str)
            self.process.stdin.flush()

            # Read response from stdout
            response_str = self.process.stdout.readline()
            logger.debug(f"Received response: {response_str.strip()}")

            if not response_str:
                raise Exception("Empty response from MCP server")

            response = json.loads(response_str)

            # Check for JSON-RPC error
            if "error" in response:
                error = response["error"]
                error_msg = error.get("message", "Unknown error")
                logger.error(f"MCP tool error: {error_msg}")
                raise Exception(f"MCP tool error: {error_msg}")

            # Return the result
            if "result" in response:
                return response["result"]
            else:
                raise Exception("No result in MCP response")

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            raise Exception(f"Invalid JSON response from MCP server: {e}")
        except Exception as e:
            logger.error(f"Tool call failed: {e}")
            raise


# Global MCP client instance
_mcp_client: Optional[MCPClient] = None


def get_mcp_client() -> MCPClient:
    """Get or create the global MCP client instance."""
    global _mcp_client
    if _mcp_client is None:
        _mcp_client = MCPClient()
    return _mcp_client
