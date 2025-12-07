/**
 * PayoffChart Component - Multi-leg strategy payoff visualization
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatPrice } from '../../utils/formatting';

export default function PayoffChart({ positions, spotPrice }) {
  if (!positions || positions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-bloomberg-text-muted">
        No positions added. Add legs to see combined payoff.
      </div>
    );
  }

  // Determine spot price range for chart
  const minSpot = Math.min(...positions.flatMap((p) => p.payoff.spot_prices));
  const maxSpot = Math.max(...positions.flatMap((p) => p.payoff.spot_prices));

  // Combine all payoffs into a single chart data structure
  const spotPrices = positions[0].payoff.spot_prices;
  const chartData = spotPrices.map((spot, idx) => {
    const dataPoint = { spot };

    // Add individual leg profits
    positions.forEach((pos, posIdx) => {
      dataPoint[`leg${posIdx}`] = pos.payoff.profits[idx];
    });

    // Calculate combined profit
    dataPoint.combined = positions.reduce(
      (sum, pos) => sum + pos.payoff.profits[idx],
      0
    );

    return dataPoint;
  });

  // Find breakeven points (where combined profit crosses zero)
  const breakevens = [];
  for (let i = 0; i < chartData.length - 1; i++) {
    const current = chartData[i].combined;
    const next = chartData[i + 1].combined;
    if ((current <= 0 && next >= 0) || (current >= 0 && next <= 0)) {
      // Linear interpolation to find exact breakeven
      const spotCurrent = chartData[i].spot;
      const spotNext = chartData[i + 1].spot;
      const breakevenSpot = spotCurrent + ((0 - current) / (next - current)) * (spotNext - spotCurrent);
      breakevens.push(breakevenSpot);
    }
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bloomberg-bg-secondary border border-bloomberg-border rounded px-3 py-2 shadow-lg">
          <p className="text-xs text-bloomberg-text-muted">Spot Price</p>
          <p className="text-sm font-mono text-bloomberg-text-primary mb-2">
            ${formatPrice(payload[0].payload.spot)}
          </p>

          {positions.map((pos, idx) => (
            <div key={idx} className="mb-1">
              <p className="text-xxs text-bloomberg-text-muted">
                {pos.side === 'long' ? 'Long' : 'Short'} {pos.option_type.toUpperCase()} ${pos.strike}
              </p>
              <p className={`text-xs font-mono ${payload[0].payload[`leg${idx}`] >= 0 ? 'text-bloomberg-financial-positive' : 'text-bloomberg-financial-negative'}`}>
                ${formatPrice(payload[0].payload[`leg${idx}`])}
              </p>
            </div>
          ))}

          <div className="border-t border-bloomberg-border mt-2 pt-2">
            <p className="text-xs text-bloomberg-text-muted">Combined P&L</p>
            <p className={`text-sm font-mono font-semibold ${payload[0].payload.combined >= 0 ? 'text-bloomberg-financial-positive' : 'text-bloomberg-financial-negative'}`}>
              ${formatPrice(payload[0].payload.combined)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A3038" />
        <XAxis
          dataKey="spot"
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          tickFormatter={(value) => `$${value.toFixed(0)}`}
          label={{ value: 'Spot Price at Expiration', position: 'insideBottom', offset: -5, fill: '#9CA3AF', fontSize: 11 }}
        />
        <YAxis
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          tickFormatter={(value) => `$${value.toFixed(0)}`}
          label={{ value: 'Profit/Loss', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 11 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
          formatter={(value) => {
            if (value === 'combined') return 'Combined P&L';
            const idx = parseInt(value.replace('leg', ''));
            const pos = positions[idx];
            return `${pos.side === 'long' ? 'Long' : 'Short'} ${pos.option_type.toUpperCase()} $${pos.strike}`;
          }}
        />

        {/* Zero profit line */}
        <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="3 3" />

        {/* Current spot price line */}
        {spotPrice && (
          <ReferenceLine
            x={spotPrice}
            stroke="#22C55E"
            strokeDasharray="3 3"
            label={{
              value: `Current: $${spotPrice.toFixed(2)}`,
              position: 'top',
              fill: '#22C55E',
              fontSize: 11,
            }}
          />
        )}

        {/* Breakeven lines */}
        {breakevens.map((be, idx) => (
          <ReferenceLine
            key={idx}
            x={be}
            stroke="#0061FF"
            strokeDasharray="5 5"
            label={{
              value: `BE: $${be.toFixed(2)}`,
              position: idx % 2 === 0 ? 'top' : 'bottom',
              fill: '#0061FF',
              fontSize: 10,
            }}
          />
        ))}

        {/* Individual leg lines (semi-transparent) */}
        {positions.map((pos, idx) => (
          <Line
            key={idx}
            type="monotone"
            dataKey={`leg${idx}`}
            stroke={pos.option_type === 'call' ? '#3B82F6' : '#EC4899'}
            strokeWidth={1}
            strokeOpacity={0.3}
            dot={false}
          />
        ))}

        {/* Combined P&L line (bold) */}
        <Line
          type="monotone"
          dataKey="combined"
          stroke="#0061FF"
          strokeWidth={3}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
