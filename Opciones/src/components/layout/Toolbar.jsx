/**
 * Toolbar Component - Top toolbar with ticker input and controls
 */

import { useEffect } from 'react';
import { useTerminalStore } from '../../stores/terminalStore';
import { RefreshCw } from 'lucide-react';

export default function Toolbar() {
  const {
    selectedUnderlying,
    selectedExpiration,
    availableExpirations,
    loading,
    setUnderlying,
    setExpiration,
    fetchExpirations,
    fetchChain,
  } = useTerminalStore();

  // Fetch expirations on mount
  useEffect(() => {
    if (selectedUnderlying) {
      fetchExpirations(selectedUnderlying);
    }
  }, []);

  const handleUnderlyingChange = (e) => {
    const ticker = e.target.value.toUpperCase();
    setUnderlying(ticker);
    if (ticker.length >= 1) {
      fetchExpirations(ticker);
    }
  };

  const handleExpirationChange = (e) => {
    setExpiration(e.target.value);
  };

  const handleRefresh = () => {
    if (selectedUnderlying && selectedExpiration) {
      fetchChain();
    }
  };

  return (
    <div className="h-full flex items-center justify-between px-4 bg-bloomberg-bg-secondary border-b border-bloomberg-border">
      <div className="flex items-center gap-4">
        {/* Ticker Input */}
        <div className="flex flex-col">
          <label className="text-xxs text-bloomberg-text-muted uppercase mb-1">
            Ticker
          </label>
          <input
            type="text"
            value={selectedUnderlying}
            onChange={handleUnderlyingChange}
            className="input-field w-24 uppercase"
            placeholder="AAPL"
            maxLength={5}
          />
        </div>

        {/* Expiration Selector */}
        <div className="flex flex-col">
          <label className="text-xxs text-bloomberg-text-muted uppercase mb-1">
            Vencimiento
          </label>
          <select
            value={selectedExpiration || ''}
            onChange={handleExpirationChange}
            disabled={loading.expirations || availableExpirations.length === 0}
            className="select-field w-40"
          >
            <option value="" disabled>
              {loading.expirations ? 'Cargando...' : 'Seleccionar fecha'}
            </option>
            {availableExpirations.map((exp) => (
              <option key={exp} value={exp}>
                {exp}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh Button */}
        <div className="flex flex-col">
          <label className="text-xxs text-bloomberg-text-muted uppercase mb-1 opacity-0">
            Acción
          </label>
          <button
            onClick={handleRefresh}
            disabled={!selectedUnderlying || !selectedExpiration || loading.chain}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading.chain ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        {loading.chain && (
          <span className="text-xs text-bloomberg-accent-blue">Cargando datos...</span>
        )}
      </div>
    </div>
  );
}
