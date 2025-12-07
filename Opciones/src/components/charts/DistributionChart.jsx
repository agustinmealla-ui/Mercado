/**
 * DistributionChart Component - Probability distribution visualization
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { formatPrice, formatPercent } from '../../utils/formatting';

export default function DistributionChart({ distributionData, spotPrice }) {
  if (!distributionData || !distributionData.distribution_summary) {
    return (
      <div className="flex items-center justify-center h-64 text-bloomberg-text-muted">
        No distribution data available
      </div>
    );
  }

  // Prepare chart data
  const chartData = distributionData.distribution_summary.map((item) => ({
    price: item.strike_bin,
    probability: item.probability // Convert to percentage
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bloomberg-bg-secondary border border-bloomberg-border rounded px-3 py-2 shadow-lg">
          <p className="text-xs text-bloomberg-text-muted">Price</p>
          <p className="text-sm font-mono text-bloomberg-text-primary">
            ${formatPrice(payload[0].payload.price)}
          </p>
          <p className="text-xs text-bloomberg-text-muted mt-1">Probability</p>
          <p className="text-sm font-mono text-bloomberg-accent-blue">
            {payload[0].value.toFixed(3)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorProbability" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0061FF" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#0061FF" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A3038" />
        <XAxis
          dataKey="price"
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          tickFormatter={(value) => `$${value.toFixed(0)}`}
        />
        <YAxis
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          tickFormatter={(value) => `${value.toFixed(2)}%`}
        />
        <Tooltip content={<CustomTooltip />} />

        {/* Current spot price line */}
        {spotPrice && (
          <ReferenceLine
            x={spotPrice}
            stroke="#22C55E"
            strokeDasharray="3 3"
            label={{
              value: `Spot: $${spotPrice.toFixed(2)}`,
              position: 'top',
              fill: '#22C55E',
              fontSize: 11,
            }}
          />
        )}

        {/* VaR 95% line */}
        {distributionData.VaR_95 && (
          <ReferenceLine
            x={distributionData.VaR_95}
            stroke="#EF4444"
            strokeDasharray="3 3"
            label={{
              value: `VaR 95%: $${distributionData.VaR_95.toFixed(2)}`,
              position: 'bottom',
              fill: '#EF4444',
              fontSize: 11,
            }}
          />
        )}

        <Area
          type="monotone"
          dataKey="probability"
          stroke="#0061FF"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorProbability)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
