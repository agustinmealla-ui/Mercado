/**
 * OptionChainTab Component - Display option chains with calls and puts
 */

import { useEffect, useState } from 'react';
import { useTerminalStore } from '../../stores/terminalStore';
import OptionChainTable from '../tables/OptionChainTable';
import StrikeDetailModal from '../modals/StrikeDetailModal';
import GreeksChart from '../charts/GreeksChart';
import { TrendingUp } from 'lucide-react';

export default function OptionChainTab() {
  const {
    selectedUnderlying,
    selectedExpiration,
    optionChainData,
    greeksData,
    loading,
    fetchChain,
    fetchGreeks,
  } = useTerminalStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedType, setSelectedType] = useState('call');
  const [showGreeks, setShowGreeks] = useState(false);

  useEffect(() => {
    if (selectedUnderlying && selectedExpiration && !optionChainData) {
      fetchChain();
    }
  }, [selectedUnderlying, selectedExpiration]);

  // Cargar griegas cuando hay datos de cadena de opciones
  useEffect(() => {
    if (optionChainData && !greeksData && showGreeks) {
      fetchGreeks();
    }
  }, [optionChainData, showGreeks]);

  const handleRowClick = (optionData, type) => {
    setSelectedOption(optionData);
    setSelectedType(type);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedOption(null);
  };

  if (loading.chain) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bloomberg-accent-blue mx-auto mb-4"></div>
          <div className="text-bloomberg-text-secondary">Cargando cadena de opciones...</div>
        </div>
      </div>
    );
  }

  if (!optionChainData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-bloomberg-text-secondary text-lg mb-2">
            Sin cadena de opciones cargada
          </div>
          <div className="text-bloomberg-text-muted text-sm">
            Selecciona un ticker y vencimiento, luego haz clic en Actualizar
          </div>
        </div>
      </div>
    );
  }

  // Calcular ATM strike
  const atmStrike = optionChainData?.calls?.reduce((prev, curr) => {
    const prevDiff = Math.abs(prev.strike - optionChainData.spot);
    const currDiff = Math.abs(curr.strike - optionChainData.spot);
    return currDiff < prevDiff ? curr : prev;
  })?.strike;

  return (
    <>
      <div className="h-full overflow-auto p-4">
        <div className="panel-container mb-4">
          <div className="panel-header">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-bloomberg-text-primary">
                  {optionChainData.long_name} ({optionChainData.underlying})
                </h2>
                <p className="text-xs text-bloomberg-text-muted mt-1">
                  Spot: <span className="terminal-metric text-bloomberg-accent-blue">
                    ${optionChainData.spot?.toFixed(2)}
                  </span>
                  {' '} | Vencimiento: {optionChainData.expiration} | Actualizado: {optionChainData.as_of}
                </p>
              </div>
              <button
                onClick={() => setShowGreeks(!showGreeks)}
                className="btn-primary flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                {showGreeks ? 'Ocultar Griegas' : 'Mostrar Griegas'}
              </button>
            </div>
          </div>

          {/* Sección de Griegas */}
          {showGreeks && (
            <div className="panel-content border-t border-bloomberg-border">
              {loading.greeks ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bloomberg-accent-blue mx-auto mb-2"></div>
                    <div className="text-bloomberg-text-secondary text-sm">Calculando griegas...</div>
                  </div>
                </div>
              ) : greeksData ? (
                <GreeksChart
                  greeksData={greeksData}
                  spotPrice={optionChainData.spot}
                  atmStrike={atmStrike}
                />
              ) : (
                <div className="text-center py-8 text-bloomberg-text-muted text-sm">
                  Sin datos de griegas disponibles
                </div>
              )}
            </div>
          )}

          <div className="panel-content">
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Calls */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="terminal-header">
                    <span className="text-bloomberg-financial-call">●</span> CALLS ({optionChainData.calls?.length || 0})
                  </h3>
                </div>
                <OptionChainTable
                  data={optionChainData.calls || []}
                  type="call"
                  spotPrice={optionChainData.spot}
                  onRowClick={(option) => handleRowClick(option, 'call')}
                />
              </div>

              {/* Puts */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="terminal-header">
                    <span className="text-bloomberg-financial-put">●</span> PUTS ({optionChainData.puts?.length || 0})
                  </h3>
                </div>
                <OptionChainTable
                  data={optionChainData.puts || []}
                  type="put"
                  spotPrice={optionChainData.spot}
                  onRowClick={(option) => handleRowClick(option, 'put')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resumen de Estadísticas */}
        <div className="grid grid-cols-4 gap-4">
          <div className="panel-container">
            <div className="panel-content">
              <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                Total Calls
              </div>
              <div className="terminal-metric text-bloomberg-financial-call">
                {optionChainData.calls?.length || 0}
              </div>
            </div>
          </div>
          <div className="panel-container">
            <div className="panel-content">
              <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                Total Puts
              </div>
              <div className="terminal-metric text-bloomberg-financial-put">
                {optionChainData.puts?.length || 0}
              </div>
            </div>
          </div>
          <div className="panel-container">
            <div className="panel-content">
              <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                Volumen Calls
              </div>
              <div className="terminal-metric">
                {optionChainData.calls?.reduce((sum, opt) => sum + (opt.volume || 0), 0).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="panel-container">
            <div className="panel-content">
              <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                Volumen Puts
              </div>
              <div className="terminal-metric">
                {optionChainData.puts?.reduce((sum, opt) => sum + (opt.volume || 0), 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strike Detail Modal */}
      <StrikeDetailModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        optionData={selectedOption}
        optionType={selectedType}
      />
    </>
  );
}
