/**
 * DistributionTab Component - Probability distribution visualization
 */

import { useState } from 'react';
import { useTerminalStore } from '../../stores/terminalStore';
import DistributionChart from '../charts/DistributionChart';
import { Download } from 'lucide-react';

export default function DistributionTab() {
  const {
    selectedUnderlying,
    selectedExpiration,
    distributionData,
    loading,
    fetchDistribution,
  } = useTerminalStore();

  const [minMoneyness, setMinMoneyness] = useState(0.7);
  const [maxMoneyness, setMaxMoneyness] = useState(1.3);

  const handleCalculate = () => {
    if (selectedUnderlying && selectedExpiration) {
      fetchDistribution(minMoneyness, maxMoneyness);
    }
  };

  const handleExportCSV = () => {
    if (!distributionData || !distributionData.distribution_summary) return;

    const headers = ['Strike Price', 'Probability (%)'];
    const rows = distributionData.distribution_summary.map((item) => [
      item.strike_bin.toFixed(2),
      (item.probability * 100).toFixed(4),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedUnderlying}_${selectedExpiration}_distribution.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading.distribution) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bloomberg-accent-blue mx-auto mb-4"></div>
          <div className="text-bloomberg-text-secondary">Calculando distribución...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      {/* Controls Panel */}
      <div className="panel-container">
        <div className="panel-header">
          <h2 className="terminal-header">Parámetros de Distribución</h2>
        </div>
        <div className="panel-content">
          <div className="grid grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-xxs text-bloomberg-text-muted uppercase mb-1 block">
                Moneyness Mín
              </label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="1.0"
                value={minMoneyness}
                onChange={(e) => setMinMoneyness(parseFloat(e.target.value))}
                className="input-field w-full"
              />
              <p className="text-xxs text-bloomberg-text-muted mt-1">
                Ratio al spot (0.7 = 30% debajo)
              </p>
            </div>
            <div>
              <label className="text-xxs text-bloomberg-text-muted uppercase mb-1 block">
                Moneyness Máx
              </label>
              <input
                type="number"
                step="0.05"
                min="1.0"
                max="2.0"
                value={maxMoneyness}
                onChange={(e) => setMaxMoneyness(parseFloat(e.target.value))}
                className="input-field w-full"
              />
              <p className="text-xxs text-bloomberg-text-muted mt-1">
                Ratio al spot (1.3 = 30% arriba)
              </p>
            </div>
            <div>
              <button onClick={handleCalculate} className="btn-primary w-full">
                Calcular Distribución
              </button>
            </div>
          </div>
        </div>
      </div>

      {!distributionData ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-bloomberg-text-secondary text-lg mb-2">
              Sin datos de distribución
            </div>
            <div className="text-bloomberg-text-muted text-sm">
              Selecciona un ticker y vencimiento, luego haz clic en Calcular Distribución
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Chart Panel */}
          <div className="panel-container">
            <div className="panel-header">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-bloomberg-text-primary">
                    Distribución de Probabilidad - {selectedUnderlying} {selectedExpiration}
                  </h2>
                  <p className="text-xs text-bloomberg-text-muted mt-1">
                    Densidad de probabilidad neutral al riesgo (método Breeden-Litzenberger)
                  </p>
                </div>
                <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </button>
              </div>
            </div>
            <div className="panel-content">
              <DistributionChart
                distributionData={distributionData}
                spotPrice={distributionData.spot}
              />
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-4 gap-4">
            {/* Expected Price */}
            <div className="panel-container">
              <div className="panel-content">
                <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                  Precio Esperado
                </div>
                <div className="terminal-metric text-bloomberg-accent-blue">
                  ${distributionData.mean?.toFixed(2) || 'N/A'}
                </div>
                <div className="text-xxs text-bloomberg-text-muted mt-1">
                  Media de la distribución
                </div>
              </div>
            </div>

            {/* Standard Deviation */}
            <div className="panel-container">
              <div className="panel-content">
                <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                  Desv. Estándar
                </div>
                <div className="terminal-metric">
                  ${distributionData.std_dev?.toFixed(2) || 'N/A'}
                </div>
                <div className="text-xxs text-bloomberg-text-muted mt-1">
                  Volatilidad del precio
                </div>
              </div>
            </div>

            {/* Skewness */}
            <div className="panel-container">
              <div className="panel-content">
                <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                  Asimetría
                </div>
                <div className="terminal-metric">
                  {distributionData.skewness?.toFixed(4) || 'N/A'}
                </div>
                <div className="text-xxs text-bloomberg-text-muted mt-1">
                  Asimetría de la distribución
                </div>
              </div>
            </div>

            {/* Kurtosis */}
            <div className="panel-container">
              <div className="panel-content">
                <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                  Curtosis
                </div>
                <div className="terminal-metric">
                  {distributionData.kurtosis?.toFixed(4) || 'N/A'}
                </div>
                <div className="text-xxs text-bloomberg-text-muted mt-1">
                  Pesadez de las colas
                </div>
              </div>
            </div>
          </div>

          {/* Quantiles and Risk Metrics */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Quantiles */}
            <div className="panel-container">
              <div className="panel-header">
                <h3 className="terminal-header">Cuantiles</h3>
              </div>
              <div className="panel-content">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-bloomberg-text-secondary">Percentil 25</span>
                    <span className="terminal-metric text-sm">
                      ${distributionData.quantile_25?.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-bloomberg-text-secondary">Percentil 50 (Mediana)</span>
                    <span className="terminal-metric text-sm">
                      ${distributionData.quantile_50?.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-bloomberg-text-secondary">Percentil 75</span>
                    <span className="terminal-metric text-sm">
                      ${distributionData.quantile_75?.toFixed(2) || 'N/A'}
                    </span>
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
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-bloomberg-text-secondary">VaR 95%</span>
                    <span className="terminal-metric text-sm text-bloomberg-financial-negative">
                      ${distributionData.VaR_95?.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-bloomberg-text-secondary">P(Debajo del Spot)</span>
                    <span className="terminal-metric text-sm">
                      {distributionData.probability_below_spot
                        ? (distributionData.probability_below_spot * 100).toFixed(2) + '%'
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-bloomberg-text-secondary">P(Encima del Spot)</span>
                    <span className="terminal-metric text-sm">
                      {distributionData.probability_above_spot
                        ? (distributionData.probability_above_spot * 100).toFixed(2) + '%'
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
