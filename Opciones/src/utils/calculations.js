/**
 * Calculations utility - Greeks aggregation and P&L calculations
 */

/**
 * Aggregate Greeks from multiple positions
 * @param {Array} positions - Array of position objects with greeks
 * @returns {Object} Aggregated Greeks
 */
export function aggregateGreeks(positions) {
  if (!positions || positions.length === 0) {
    return {
      delta: 0,
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0,
    };
  }

  const aggregated = {
    delta: 0,
    gamma: 0,
    theta: 0,
    vega: 0,
    rho: 0,
  };

  positions.forEach((pos) => {
    if (pos.greeks) {
      // For short positions, negate the Greeks
      const multiplier = pos.side === 'long' ? 1 : -1;

      aggregated.delta += (pos.greeks.delta || 0) * multiplier;
      aggregated.gamma += (pos.greeks.gamma || 0) * multiplier;
      aggregated.theta += (pos.greeks.theta || 0) * multiplier;
      aggregated.vega += (pos.greeks.vega || 0) * multiplier;
      aggregated.rho += (pos.greeks.rho || 0) * multiplier;
    }
  });

  return aggregated;
}

/**
 * Calculate max profit and max loss from payoff data
 * @param {Array} positions - Array of position objects with payoff data
 * @returns {Object} {maxProfit, maxLoss}
 */
export function calculateMaxProfitLoss(positions) {
  if (!positions || positions.length === 0) {
    return { maxProfit: 0, maxLoss: 0 };
  }

  // Get combined P&L for all spot prices
  const spotPrices = positions[0].payoff.spot_prices;
  const combinedProfits = spotPrices.map((_, idx) =>
    positions.reduce((sum, pos) => sum + pos.payoff.profits[idx], 0)
  );

  const maxProfit = Math.max(...combinedProfits);
  const maxLoss = Math.min(...combinedProfits);

  return { maxProfit, maxLoss };
}

/**
 * Find breakeven points where combined P&L crosses zero
 * @param {Array} positions - Array of position objects with payoff data
 * @returns {Array} Array of breakeven spot prices
 */
export function findBreakevens(positions) {
  if (!positions || positions.length === 0) {
    return [];
  }

  const spotPrices = positions[0].payoff.spot_prices;
  const combinedProfits = spotPrices.map((_, idx) =>
    positions.reduce((sum, pos) => sum + pos.payoff.profits[idx], 0)
  );

  const breakevens = [];
  for (let i = 0; i < combinedProfits.length - 1; i++) {
    const current = combinedProfits[i];
    const next = combinedProfits[i + 1];

    // Check if profit crosses zero between these two points
    if ((current <= 0 && next >= 0) || (current >= 0 && next <= 0)) {
      // Linear interpolation to find exact breakeven
      const spotCurrent = spotPrices[i];
      const spotNext = spotPrices[i + 1];
      const breakevenSpot =
        spotCurrent + ((0 - current) / (next - current)) * (spotNext - spotCurrent);
      breakevens.push(breakevenSpot);
    }
  }

  return breakevens;
}

/**
 * Calculate total premium paid/received for all positions
 * @param {Array} positions - Array of position objects
 * @returns {number} Net premium (negative = paid, positive = received)
 */
export function calculateNetPremium(positions) {
  if (!positions || positions.length === 0) {
    return 0;
  }

  return positions.reduce((sum, pos) => {
    const premium = pos.premium || 0;
    // Long positions pay premium (negative), short positions receive premium (positive)
    return sum + (pos.side === 'long' ? -premium : premium);
  }, 0);
}
