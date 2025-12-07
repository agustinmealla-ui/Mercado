/**
 * MCP API Client - Interface to the backend API server
 *
 * Provides methods to call all 6 MCP tools via HTTP
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class MCPClient {
  /**
   * Call an MCP tool with given arguments
   * @param {string} toolName - Name of the tool to call
   * @param {object} toolArgs - Tool arguments
   * @returns {Promise<object>} - Tool response data
   */
  async callTool(toolName, toolArgs) {
    const response = await fetch(`${API_BASE_URL}/api/mcp/call-tool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: toolName, arguments: toolArgs })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'API call failed');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Tool execution failed');
    }

    return result.data;
  }

  /**
   * Get all available expiration dates for a ticker
   * @param {string} underlying - Stock ticker symbol
   * @returns {Promise<object>} - Expirations data
   */
  async getExpirations(underlying) {
    return this.callTool('get_expirations', { underlying });
  }

  /**
   * Get option chain (calls and puts) for a specific expiration
   * @param {string} underlying - Stock ticker symbol
   * @param {string} expiration - Expiration date (YYYY-MM-DD)
   * @returns {Promise<object>} - Option chain data
   */
  async getChain(underlying, expiration) {
    return this.callTool('get_chain', { underlying, expiration });
  }

  /**
   * Compute Greeks for all options at a specific expiration
   * @param {string} underlying - Stock ticker symbol
   * @param {string} expiration - Expiration date (YYYY-MM-DD)
   * @returns {Promise<object>} - Greeks data
   */
  async computeGreeks(underlying, expiration) {
    return this.callTool('compute_greeks', { underlying, expiration });
  }

  /**
   * Get probability distribution from option prices
   * @param {string} underlying - Stock ticker symbol
   * @param {string} expiration - Expiration date (YYYY-MM-DD)
   * @param {number} minMoneyness - Min strike/spot ratio (default: 0.7)
   * @param {number} maxMoneyness - Max strike/spot ratio (default: 1.3)
   * @returns {Promise<object>} - Distribution data
   */
  async getDistribution(underlying, expiration, minMoneyness = 0.7, maxMoneyness = 1.3) {
    return this.callTool('get_distribution', {
      underlying,
      expiration,
      min_moneyness: minMoneyness,
      max_moneyness: maxMoneyness
    });
  }

  /**
   * Compute payoff profile for an option position
   * @param {string} side - 'long' or 'short'
   * @param {string} optionType - 'call' or 'put'
   * @param {string} underlying - Stock ticker symbol
   * @param {number} strike - Strike price
   * @param {string} expiration - Expiration date (YYYY-MM-DD)
   * @param {number} spotMin - Min spot price for range
   * @param {number} spotMax - Max spot price for range
   * @returns {Promise<object>} - Payoff profile data
   */
  async computePayoff(side, optionType, underlying, strike, expiration, spotMin, spotMax) {
    const args = {
      side,
      option_type: optionType,
      underlying,
      strike,
      expiration
    };

    if (spotMin !== undefined) args.spot_min = spotMin;
    if (spotMax !== undefined) args.spot_max = spotMax;

    return this.callTool('compute_payoff_profile', args);
  }

  /**
   * Get historical price data (OHLCV) for an underlying asset
   * @param {string} underlying - Stock ticker symbol
   * @param {string} period - Time period (e.g., "1mo", "3mo", "6mo", "1y")
   * @param {string} interval - Data interval (e.g., "1d", "1h", "1wk")
   * @returns {Promise<object>} - Historical price data
   */
  async getHistoricalPrices(underlying, period = '3mo', interval = '1d') {
    return this.callTool('get_historical_prices_tool', {
      underlying,
      period,
      interval
    });
  }

  /**
   * Get list of available tools
   * @returns {Promise<object>} - Tools metadata
   */
  async listTools() {
    const response = await fetch(`${API_BASE_URL}/api/mcp/tools`);
    return response.json();
  }

  /**
   * Check API health
   * @returns {Promise<object>} - Health status
   */
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.json();
  }
}

// Export singleton instance
export const mcpClient = new MCPClient();
