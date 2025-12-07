/**
 * PriceHistoryChart Component - Historical price visualization
 */

import { Maximize2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function PriceHistoryChart({ historicalData, onExpand }) {
  if (!historicalData || !historicalData.data || historicalData.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-bloomberg-text-muted text-sm">
        Sin datos históricos disponibles
      </div>
    );
  }

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-bloomberg-bg-secondary border border-bloomberg-border rounded px-3 py-2 shadow-lg">
          <p className="text-xs text-bloomberg-text-muted mb-1">{data.date}</p>
          <div className="text-xs space-y-0.5">
            <div className="flex justify-between gap-4">
              <span className="text-bloomberg-text-muted">Cierre:</span>
              <span className="text-bloomberg-accent-blue font-mono">${data.close.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-bloomberg-text-muted">Máximo:</span>
              <span className="text-bloomberg-financial-positive font-mono">${data.high.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-bloomberg-text-muted">Mínimo:</span>
              <span className="text-bloomberg-financial-negative font-mono">${data.low.toFixed(2)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate min and max for Y-axis domain
  const prices = historicalData.data.map(d => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.1;

  return (
    <div className="space-y-2">
      {/* Chart Header */}
      <div className="flex items-baseline justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-bloomberg-text-primary">
            {historicalData.long_name} ({historicalData.underlying})
          </h3>
          <p className="text-xs text-bloomberg-text-muted">
            {historicalData.start_date} a {historicalData.end_date}
          </p>
        </div>
        {onExpand && (
          <button
            onClick={onExpand}
            className="mr-3 p-1 text-bloomberg-text-muted hover:text-bloomberg-accent-blue transition-colors"
            title="Ampliar gráfico"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
        <div className="text-right">
          <div className="text-xl font-mono text-bloomberg-accent-blue">
            ${historicalData.current_price.toFixed(2)}
          </div>
          <div className="text-xs text-bloomberg-text-muted uppercase">
            Precio Actual
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart
          data={historicalData.data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2A3038" />
          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
            minTickGap={30}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            domain={[minPrice - padding, maxPrice + padding]}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="close"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-bloomberg-border">
        <div>
          <div className="text-xxs text-bloomberg-text-muted uppercase">Apertura</div>
          <div className="text-xs font-mono text-bloomberg-text-primary">
            ${historicalData.data[0]?.open.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xxs text-bloomberg-text-muted uppercase">Máximo</div>
          <div className="text-xs font-mono text-bloomberg-financial-positive">
            ${Math.max(...prices).toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xxs text-bloomberg-text-muted uppercase">Mínimo</div>
          <div className="text-xs font-mono text-bloomberg-financial-negative">
            ${Math.min(...prices).toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xxs text-bloomberg-text-muted uppercase">Cambio</div>
          <div className={`text-xs font-mono ${
            historicalData.data[historicalData.data.length - 1]?.close >= historicalData.data[0]?.close
              ? 'text-bloomberg-financial-positive'
              : 'text-bloomberg-financial-negative'
          }`}>
            {((historicalData.data[historicalData.data.length - 1]?.close / historicalData.data[0]?.close - 1) * 100).toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
}
