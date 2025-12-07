/**
 * PayoffTab Component - Multi-leg strategy payoff visualization
 */

import { useState } from 'react';
import { useTerminalStore } from '../../stores/terminalStore';
import PayoffChart from '../charts/PayoffChart';
import { Plus, Trash2 } from 'lucide-react';
import { formatGreek, formatPrice } from '../../utils/formatting';
import { aggregateGreeks, calculateMaxProfitLoss, findBreakevens } from '../../utils/calculations';

export default function PayoffTab() {
  const {
    selectedUnderlying,
    selectedExpiration,
    optionChainData,
    payoffPositions,
    loading,
    addPosition,
    removePosition,
    clearPositions,
  } = useTerminalStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPosition, setNewPosition] = useState({
    side: 'long',
    option_type: 'call',
    strike: '',
    premium: '',
  });

  const handleAddPosition = async () => {
    if (!newPosition.strike) {
      alert('Por favor ingresa un precio strike');
      return;
    }

    await addPosition({
      side: newPosition.side,
      option_type: newPosition.option_type,
      strike: parseFloat(newPosition.strike),
      premium: parseFloat(newPosition.premium) || 0,
    });

    // Reset form
    setNewPosition({
      side: 'long',
      option_type: 'call',
      strike: '',
      premium: '',
    });
    setShowAddForm(false);
  };

  // Calculate aggregated metrics
  const aggregatedGreeks = aggregateGreeks(payoffPositions);
  const { maxProfit, maxLoss } = calculateMaxProfitLoss(payoffPositions);
  const breakevens = findBreakevens(payoffPositions);

  if (!optionChainData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-bloomberg-text-secondary text-lg mb-2">
            Sin cadena de opciones cargada
          </div>
          <div className="text-bloomberg-text-muted text-sm">
            Carga una cadena de opciones primero para construir estrategias
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      {/* Positions Panel */}
      <div className="panel-container">
        <div className="panel-header">
          <div className="flex items-center justify-between">
            <h2 className="terminal-header">Posiciones ({payoffPositions.length})</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar Leg
              </button>
              {payoffPositions.length > 0 && (
                <button onClick={clearPositions} className="btn-secondary">
                  Limpiar Todo
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="panel-content">
          {/* Add Position Form */}
          {showAddForm && (
            <div className="bg-bloomberg-bg-tertiary rounded p-4 mb-4 border border-bloomberg-border">
              <h3 className="text-xs font-semibold text-bloomberg-text-primary mb-3">
                Agregar Nueva Posición
              </h3>
              <div className="grid grid-cols-5 gap-3">
                <div>
                  <label className="text-xxs text-bloomberg-text-muted uppercase mb-1 block">
                    Lado
                  </label>
                  <select
                    value={newPosition.side}
                    onChange={(e) => setNewPosition({ ...newPosition, side: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="long">Long</option>
                    <option value="short">Short</option>
                  </select>
                </div>
                <div>
                  <label className="text-xxs text-bloomberg-text-muted uppercase mb-1 block">
                    Tipo
                  </label>
                  <select
                    value={newPosition.option_type}
                    onChange={(e) => setNewPosition({ ...newPosition, option_type: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="call">Call</option>
                    <option value="put">Put</option>
                  </select>
                </div>
                <div>
                  <label className="text-xxs text-bloomberg-text-muted uppercase mb-1 block">
                    Strike
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={newPosition.strike}
                    onChange={(e) => setNewPosition({ ...newPosition, strike: e.target.value })}
                    className="input-field w-full"
                    placeholder="Precio strike"
                  />
                </div>
                <div>
                  <label className="text-xxs text-bloomberg-text-muted uppercase mb-1 block">
                    Prima
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPosition.premium}
                    onChange={(e) => setNewPosition({ ...newPosition, premium: e.target.value })}
                    className="input-field w-full"
                    placeholder="Opcional"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={handleAddPosition}
                    disabled={loading.payoff}
                    className="btn-primary w-full"
                  >
                    {loading.payoff ? 'Agregando...' : 'Agregar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Positions List */}
          {payoffPositions.length === 0 ? (
            <div className="text-center py-8 text-bloomberg-text-muted text-sm">
              No hay posiciones agregadas. Haz clic en "Agregar Leg" para construir una estrategia multi-leg.
            </div>
          ) : (
            <div className="space-y-2">
              {payoffPositions.map((pos, idx) => (
                <div
                  key={idx}
                  className="bg-bloomberg-bg-tertiary rounded p-3 border border-bloomberg-border flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-semibold ${
                        pos.side === 'long'
                          ? 'text-bloomberg-financial-positive'
                          : 'text-bloomberg-financial-negative'
                      }`}>
                        {pos.side === 'long' ? '▲ LONG' : '▼ SHORT'}
                      </span>
                      <span className={`text-sm font-mono ${
                        pos.option_type === 'call'
                          ? 'text-bloomberg-financial-call'
                          : 'text-bloomberg-financial-put'
                      }`}>
                        {pos.option_type.toUpperCase()} ${pos.strike}
                      </span>
                      {pos.premium > 0 && (
                        <span className="text-xs text-bloomberg-text-muted">
                          Prima: ${formatPrice(pos.premium)}
                        </span>
                      )}
                      {pos.greeks && (
                        <div className="flex gap-3 text-xs">
                          <span className="text-bloomberg-text-muted">
                            Δ: {formatGreek(pos.greeks.delta, 3)}
                          </span>
                          <span className="text-bloomberg-text-muted">
                            Γ: {formatGreek(pos.greeks.gamma, 3)}
                          </span>
                          <span className="text-bloomberg-text-muted">
                            Θ: {formatGreek(pos.greeks.theta, 3)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removePosition(idx)}
                    className="text-bloomberg-text-muted hover:text-bloomberg-financial-negative transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart Panel */}
      {payoffPositions.length > 0 && (
        <>
          <div className="panel-container">
            <div className="panel-header">
              <h2 className="text-base font-semibold text-bloomberg-text-primary">
                Payoff Combinado - {selectedUnderlying} {selectedExpiration}
              </h2>
            </div>
            <div className="panel-content">
              <PayoffChart
                positions={payoffPositions}
                spotPrice={optionChainData.spot}
              />
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-4">
            {/* Aggregated Greeks */}
            <div className="panel-container col-span-2">
              <div className="panel-header">
                <h3 className="terminal-header">Griegas Agregadas</h3>
              </div>
              <div className="panel-content">
                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                      Delta (Δ)
                    </div>
                    <div className="terminal-metric">
                      {formatGreek(aggregatedGreeks.delta, 4)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                      Gamma (Γ)
                    </div>
                    <div className="terminal-metric">
                      {formatGreek(aggregatedGreeks.gamma, 4)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                      Theta (Θ)
                    </div>
                    <div className="terminal-metric text-bloomberg-financial-negative">
                      {formatGreek(aggregatedGreeks.theta, 4)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                      Vega (ν)
                    </div>
                    <div className="terminal-metric">
                      {formatGreek(aggregatedGreeks.vega, 4)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                      Rho (ρ)
                    </div>
                    <div className="terminal-metric">
                      {formatGreek(aggregatedGreeks.rho, 4)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Metrics */}
            <div className="panel-container">
              <div className="panel-header">
                <h3 className="terminal-header">Métricas de Riesgo</h3>
              </div>
              <div className="panel-content">
                <div className="space-y-3">
                  <div>
                    <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                      Ganancia Máxima
                    </div>
                    <div className={`terminal-metric ${
                      maxProfit === Infinity
                        ? 'text-bloomberg-text-muted'
                        : 'text-bloomberg-financial-positive'
                    }`}>
                      {maxProfit === Infinity ? 'Ilimitada' : `$${formatPrice(maxProfit)}`}
                    </div>
                  </div>
                  <div>
                    <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                      Pérdida Máxima
                    </div>
                    <div className={`terminal-metric ${
                      maxLoss === -Infinity
                        ? 'text-bloomberg-text-muted'
                        : 'text-bloomberg-financial-negative'
                    }`}>
                      {maxLoss === -Infinity ? 'Ilimitada' : `$${formatPrice(Math.abs(maxLoss))}`}
                    </div>
                  </div>
                  {breakevens.length > 0 && (
                    <div>
                      <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                        Punto{breakevens.length > 1 ? 's' : ''} de Equilibrio
                      </div>
                      <div className="space-y-1">
                        {breakevens.map((be, idx) => (
                          <div key={idx} className="text-sm font-mono text-bloomberg-accent-blue">
                            ${formatPrice(be)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
