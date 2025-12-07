/**
 * HistoricalChartModal Component - Full-screen historical price chart
 */

import { useState, useEffect } from 'react';
import { X, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTerminalStore } from '../../stores/terminalStore';

export default function HistoricalChartModal({ isOpen, onClose }) {
  const {
    selectedUnderlying,
    historicalData,
    loading,
    fetchHistoricalPrices
  } = useTerminalStore();

  const [period, setPeriod] = useState('3mo');

  // Fetch data when period changes
  useEffect(() => {
    if (isOpen && selectedUnderlying) {
      fetchHistoricalPrices(period, '1d');
    }
  }, [period, isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-bloomberg-bg-secondary border border-bloomberg-border rounded px-3 py-2 shadow-lg">
          <p className="text-xs text-bloomberg-text-muted mb-1">{data.date}</p>
          <div className="text-xs space-y-0.5">
            <div className="flex justify-between gap-4">
              <span className="text-bloomberg-text-muted">Apertura:</span>
              <span className="text-bloomberg-accent-blue font-mono">${data.open.toFixed(2)}</span>
            </div>
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
            <div className="flex justify-between gap-4">
              <span className="text-bloomberg-text-muted">Volumen:</span>
              <span className="text-bloomberg-text-primary font-mono">{data.volume.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Period options
  const periodOptions = [
    { value: '5d', label: '5 Días' },
    { value: '1mo', label: '1 Mes' },
    { value: '3mo', label: '3 Meses' },
    { value: '6mo', label: '6 Meses' },
    { value: '1y', label: '1 Año' },
    { value: '2y', label: '2 Años' },
    { value: '5y', label: '5 Años' },
    { value: 'ytd', label: 'Este Año' },
    { value: 'max', label: 'Máximo' },
  ];

  const prices = historicalData?.data?.map(d => d.close) || [];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.1;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-bloomberg-bg-primary border border-bloomberg-border rounded-lg shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-bloomberg-border">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-bloomberg-accent-blue" />
            <div>
              <h2 className="text-lg font-semibold text-bloomberg-text-primary">
                Gráfico Histórico
              </h2>
              <p className="text-xs text-bloomberg-text-muted">
                {historicalData?.long_name || selectedUnderlying}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-bloomberg-text-muted hover:text-bloomberg-text-primary transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-bloomberg-border bg-bloomberg-bg-secondary">
          <div className="flex items-center gap-2">
            <label className="text-xs text-bloomberg-text-muted uppercase">Período:</label>
            <div className="flex gap-1">
              {periodOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    period === opt.value
                      ? 'bg-bloomberg-accent-blue text-white'
                      : 'bg-bloomberg-bg-primary text-bloomberg-text-muted hover:text-bloomberg-text-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Content */}
        <div className="p-6">
          {loading.historical ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bloomberg-accent-blue mx-auto mb-4"></div>
                <div className="text-bloomberg-text-secondary">Cargando datos...</div>
              </div>
            </div>
          ) : historicalData && historicalData.data && historicalData.data.length > 0 ? (
            <>
              {/* Price Header */}
              <div className="flex items-baseline justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-bloomberg-text-primary">
                    {historicalData.long_name} ({historicalData.underlying})
                  </h3>
                  <p className="text-sm text-bloomberg-text-muted">
                    {historicalData.start_date} a {historicalData.end_date}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-mono text-bloomberg-accent-blue">
                    ${historicalData.current_price.toFixed(2)}
                  </div>
                  <div className="text-xs text-bloomberg-text-muted uppercase">
                    Precio Actual
                  </div>
                </div>
              </div>

              {/* Chart */}
              <ResponsiveContainer width="100%" height={500}>
                <LineChart
                  data={historicalData.data}
                  margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A3038" />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().slice(-2)}`;
                    }}
                    minTickGap={50}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                    domain={[minPrice - padding, maxPrice + padding]}
                    width={70}
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
              <div className="grid grid-cols-6 gap-4 mt-6 pt-6 border-t border-bloomberg-border">
                <div>
                  <div className="text-xs text-bloomberg-text-muted uppercase mb-1">Apertura</div>
                  <div className="text-lg font-mono text-bloomberg-text-primary">
                    ${historicalData.data[0]?.open.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-bloomberg-text-muted uppercase mb-1">Cierre</div>
                  <div className="text-lg font-mono text-bloomberg-text-primary">
                    ${historicalData.data[historicalData.data.length - 1]?.close.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-bloomberg-text-muted uppercase mb-1">Máximo</div>
                  <div className="text-lg font-mono text-bloomberg-financial-positive">
                    ${Math.max(...prices).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-bloomberg-text-muted uppercase mb-1">Mínimo</div>
                  <div className="text-lg font-mono text-bloomberg-financial-negative">
                    ${Math.min(...prices).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-bloomberg-text-muted uppercase mb-1">Cambio</div>
                  <div className={`text-lg font-mono ${
                    historicalData.data[historicalData.data.length - 1]?.close >= historicalData.data[0]?.close
                      ? 'text-bloomberg-financial-positive'
                      : 'text-bloomberg-financial-negative'
                  }`}>
                    {((historicalData.data[historicalData.data.length - 1]?.close / historicalData.data[0]?.close - 1) * 100).toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-bloomberg-text-muted uppercase mb-1">Volumen Prom.</div>
                  <div className="text-lg font-mono text-bloomberg-text-primary">
                    {(historicalData.data.reduce((sum, d) => sum + d.volume, 0) / historicalData.data.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center text-bloomberg-text-muted">
                Sin datos históricos disponibles
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
