/**
 * GreeksChart Component - Visualización de griegas por strike
 */

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatGreek } from '../../utils/formatting';

const GREEKS_CONFIG = {
  delta: { name: 'Delta (Δ)', color: '#3B82F6', enabled: true },
  gamma: { name: 'Gamma (Γ)', color: '#10B981', enabled: true },
  theta: { name: 'Theta (Θ)', color: '#EF4444', enabled: true },
  vega: { name: 'Vega (ν)', color: '#8B5CF6', enabled: true },
  rho: { name: 'Rho (ρ)', color: '#F59E0B', enabled: false }, // Deshabilitado por defecto
};

export default function GreeksChart({ greeksData, spotPrice, atmStrike }) {
  const [selectedGreeks, setSelectedGreeks] = useState({
    delta: true,
    gamma: true,
    theta: true,
    vega: true,
    rho: false,
  });

  const [viewMode, setViewMode] = useState('both'); // 'calls', 'puts', 'both'

  if (!greeksData || !greeksData.calls || !greeksData.puts) {
    return (
      <div className="flex items-center justify-center h-64 text-bloomberg-text-muted">
        Sin datos de griegas disponibles
      </div>
    );
  }

  // Preparar datos para el gráfico
  const prepareChartData = () => {
    const callsMap = new Map();
    const putsMap = new Map();

    // Organizar calls por strike
    greeksData.calls.forEach((call) => {
      callsMap.set(call.strike, {
        delta: call.delta,
        gamma: call.gamma,
        theta: call.theta,
        vega: call.vega,
        rho: call.rho,
      });
    });

    // Organizar puts por strike
    greeksData.puts.forEach((put) => {
      putsMap.set(put.strike, {
        delta: put.delta,
        gamma: put.gamma,
        theta: put.theta,
        vega: put.vega,
        rho: put.rho,
      });
    });

    // Obtener todos los strikes únicos y ordenarlos
    const allStrikes = Array.from(
      new Set([...callsMap.keys(), ...putsMap.keys()])
    ).sort((a, b) => a - b);

    // Crear array de datos para el gráfico
    return allStrikes.map((strike) => {
      const dataPoint = { strike };

      const callGreeks = callsMap.get(strike);
      const putGreeks = putsMap.get(strike);

      if (viewMode === 'calls' || viewMode === 'both') {
        if (callGreeks) {
          dataPoint.call_delta = callGreeks.delta;
          dataPoint.call_gamma = callGreeks.gamma;
          dataPoint.call_theta = callGreeks.theta;
          dataPoint.call_vega = callGreeks.vega;
          dataPoint.call_rho = callGreeks.rho;
        }
      }

      if (viewMode === 'puts' || viewMode === 'both') {
        if (putGreeks) {
          dataPoint.put_delta = putGreeks.delta;
          dataPoint.put_gamma = putGreeks.gamma;
          dataPoint.put_theta = putGreeks.theta;
          dataPoint.put_vega = putGreeks.vega;
          dataPoint.put_rho = putGreeks.rho;
        }
      }

      return dataPoint;
    });
  };

  const chartData = prepareChartData();

  const toggleGreek = (greek) => {
    setSelectedGreeks((prev) => ({
      ...prev,
      [greek]: !prev[greek],
    }));
  };

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const strike = payload[0].payload.strike;
      return (
        <div className="bg-bloomberg-bg-secondary border border-bloomberg-border rounded px-3 py-2 shadow-lg">
          <p className="text-xs text-bloomberg-text-muted mb-1">Strike: ${strike}</p>
          {payload.map((entry, index) => (
            <div key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {formatGreek(entry.value, 4)}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex items-center justify-between">
        {/* Toggle de Griegas */}
        <div className="flex gap-2">
          {Object.entries(GREEKS_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => toggleGreek(key)}
              className={`
                px-3 py-1 text-xs font-medium rounded transition-colors
                ${
                  selectedGreeks[key]
                    ? 'bg-bloomberg-accent-blue text-white'
                    : 'bg-bloomberg-bg-tertiary text-bloomberg-text-secondary hover:bg-bloomberg-bg-hover'
                }
              `}
            >
              {config.name}
            </button>
          ))}
        </div>

        {/* Toggle Calls/Puts */}
        <div className="flex gap-1 bg-bloomberg-bg-tertiary rounded p-1">
          <button
            onClick={() => setViewMode('calls')}
            className={`
              px-3 py-1 text-xs font-medium rounded transition-colors
              ${
                viewMode === 'calls'
                  ? 'bg-bloomberg-financial-call text-white'
                  : 'text-bloomberg-text-secondary hover:text-bloomberg-text-primary'
              }
            `}
          >
            Calls
          </button>
          <button
            onClick={() => setViewMode('both')}
            className={`
              px-3 py-1 text-xs font-medium rounded transition-colors
              ${
                viewMode === 'both'
                  ? 'bg-bloomberg-accent-blue text-white'
                  : 'text-bloomberg-text-secondary hover:text-bloomberg-text-primary'
              }
            `}
          >
            Ambos
          </button>
          <button
            onClick={() => setViewMode('puts')}
            className={`
              px-3 py-1 text-xs font-medium rounded transition-colors
              ${
                viewMode === 'puts'
                  ? 'bg-bloomberg-financial-put text-white'
                  : 'text-bloomberg-text-secondary hover:text-bloomberg-text-primary'
              }
            `}
          >
            Puts
          </button>
        </div>
      </div>

      {/* Gráfico */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A3038" />
          <XAxis
            dataKey="strike"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            tickFormatter={(value) => `$${value}`}
            label={{
              value: 'Strike Price',
              position: 'insideBottom',
              offset: -5,
              fill: '#9CA3AF',
              fontSize: 11,
            }}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            tickFormatter={(value) => formatGreek(value, 2)}
            label={{
              value: 'Valor de la Griega',
              angle: -90,
              position: 'insideLeft',
              fill: '#9CA3AF',
              fontSize: 11,
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            formatter={(value) => {
              // Formatear nombre de la leyenda
              if (value.startsWith('call_')) {
                const greek = value.replace('call_', '');
                return `${GREEKS_CONFIG[greek]?.name} (Call)`;
              } else if (value.startsWith('put_')) {
                const greek = value.replace('put_', '');
                return `${GREEKS_CONFIG[greek]?.name} (Put)`;
              }
              return value;
            }}
          />

          {/* Línea ATM */}
          {atmStrike && (
            <ReferenceLine
              x={atmStrike}
              stroke="#22C55E"
              strokeDasharray="3 3"
              label={{
                value: 'ATM',
                position: 'top',
                fill: '#22C55E',
                fontSize: 10,
              }}
            />
          )}

          {/* Línea de cero */}
          <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="2 2" />

          {/* Líneas de Calls */}
          {(viewMode === 'calls' || viewMode === 'both') && (
            <>
              {selectedGreeks.delta && (
                <Line
                  type="monotone"
                  dataKey="call_delta"
                  stroke={GREEKS_CONFIG.delta.color}
                  strokeWidth={2}
                  dot={false}
                  opacity={0.8}
                />
              )}
              {selectedGreeks.gamma && (
                <Line
                  type="monotone"
                  dataKey="call_gamma"
                  stroke={GREEKS_CONFIG.gamma.color}
                  strokeWidth={2}
                  dot={false}
                  opacity={0.8}
                />
              )}
              {selectedGreeks.theta && (
                <Line
                  type="monotone"
                  dataKey="call_theta"
                  stroke={GREEKS_CONFIG.theta.color}
                  strokeWidth={2}
                  dot={false}
                  opacity={0.8}
                />
              )}
              {selectedGreeks.vega && (
                <Line
                  type="monotone"
                  dataKey="call_vega"
                  stroke={GREEKS_CONFIG.vega.color}
                  strokeWidth={2}
                  dot={false}
                  opacity={0.8}
                />
              )}
              {selectedGreeks.rho && (
                <Line
                  type="monotone"
                  dataKey="call_rho"
                  stroke={GREEKS_CONFIG.rho.color}
                  strokeWidth={2}
                  dot={false}
                  opacity={0.8}
                />
              )}
            </>
          )}

          {/* Líneas de Puts */}
          {(viewMode === 'puts' || viewMode === 'both') && (
            <>
              {selectedGreeks.delta && (
                <Line
                  type="monotone"
                  dataKey="put_delta"
                  stroke={GREEKS_CONFIG.delta.color}
                  strokeWidth={2}
                  dot={false}
                  opacity={0.6}
                  strokeDasharray="5 5"
                />
              )}
              {selectedGreeks.gamma && (
                <Line
                  type="monotone"
                  dataKey="put_gamma"
                  stroke={GREEKS_CONFIG.gamma.color}
                  strokeWidth={2}
                  dot={false}
                  opacity={0.6}
                  strokeDasharray="5 5"
                />
              )}
              {selectedGreeks.theta && (
                <Line
                  type="monotone"
                  dataKey="put_theta"
                  stroke={GREEKS_CONFIG.theta.color}
                  strokeWidth={2}
                  dot={false}
                  opacity={0.6}
                  strokeDasharray="5 5"
                />
              )}
              {selectedGreeks.vega && (
                <Line
                  type="monotone"
                  dataKey="put_vega"
                  stroke={GREEKS_CONFIG.vega.color}
                  strokeWidth={2}
                  dot={false}
                  opacity={0.6}
                  strokeDasharray="5 5"
                />
              )}
              {selectedGreeks.rho && (
                <Line
                  type="monotone"
                  dataKey="put_rho"
                  stroke={GREEKS_CONFIG.rho.color}
                  strokeWidth={2}
                  dot={false}
                  opacity={0.6}
                  strokeDasharray="5 5"
                />
              )}
            </>
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Leyenda adicional para Calls vs Puts */}
      {viewMode === 'both' && (
        <div className="flex justify-center gap-4 text-xs text-bloomberg-text-muted">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-white opacity-80"></div>
            <span>Calls (línea sólida)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 border-t-2 border-dashed border-white opacity-60"></div>
            <span>Puts (línea punteada)</span>
          </div>
        </div>
      )}
    </div>
  );
}
