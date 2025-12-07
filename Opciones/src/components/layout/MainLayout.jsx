/**
 * MainLayout Component - Bloomberg-style terminal layout with resizable panels
 */

import { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useTerminalStore } from '../../stores/terminalStore';
import Toolbar from './Toolbar';
import TabNavigation from './TabNavigation';
import OptionChainTab from '../tabs/OptionChainTab';
import DistributionTab from '../tabs/DistributionTab';
import PayoffTab from '../tabs/PayoffTab';
import BuilderTab from '../tabs/BuilderTab';
import PriceHistoryChart from '../charts/PriceHistoryChart';
import HistoricalChartModal from '../modals/HistoricalChartModal';

export default function MainLayout() {
  const {
    activeTab,
    selectedUnderlying,
    optionChainData,
    historicalData,
    loading,
    fetchHistoricalPrices,
  } = useTerminalStore();

  const [chartModalOpen, setChartModalOpen] = useState(false);

  // Fetch historical prices when underlying changes
  useEffect(() => {
    if (selectedUnderlying) {
      fetchHistoricalPrices('3mo', '1d');
    }
  }, [selectedUnderlying, fetchHistoricalPrices]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'chain':
        return <OptionChainTab />;
      case 'distribution':
        return <DistributionTab />;
      case 'payoff':
        return <PayoffTab />;
      case 'builder':
        return <BuilderTab />;
      default:
        return <OptionChainTab />;
    }
  };

  return (
    <div className="h-screen w-screen bg-bloomberg-bg-primary text-bloomberg-text-primary flex flex-col overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-14 flex-shrink-0">
        <Toolbar />
      </div>

      {/* Main Content Area */}
      <PanelGroup direction="horizontal" className="flex-1">
        {/* Left Panel - Main View */}
        <Panel defaultSize={75} minSize={50}>
          <div className="h-full flex flex-col">
            {/* Tab Navigation */}
            <div className="h-12 flex-shrink-0">
              <TabNavigation />
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {renderActiveTab()}
            </div>
          </div>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="w-1 bg-bloomberg-border hover:bg-bloomberg-accent-blue transition-colors cursor-col-resize" />

        {/* Right Panel - Quick Info */}
        <Panel defaultSize={25} minSize={20} maxSize={40}>
          <div className="h-full bg-bloomberg-bg-secondary p-4 overflow-auto">
            <h3 className="terminal-header mb-4">Quick Info</h3>

            {optionChainData ? (
              <div className="space-y-3">
                <div>
                  <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                    Underlying
                  </div>
                  <div className="terminal-metric">{optionChainData.underlying}</div>
                </div>

                <div>
                  <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                    Spot Price
                  </div>
                  <div className="terminal-metric">${optionChainData.spot?.toFixed(2)}</div>
                </div>

                <div>
                  <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                    Expiration
                  </div>
                  <div className="text-sm text-bloomberg-text-primary">
                    {optionChainData.expiration}
                  </div>
                </div>

                <div>
                  <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                    As Of
                  </div>
                  <div className="text-sm text-bloomberg-text-primary">
                    {optionChainData.as_of}
                  </div>
                </div>

                <div className="pt-3 border-t border-bloomberg-border">
                  <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                    Calls
                  </div>
                  <div className="text-sm text-bloomberg-financial-call">
                    {optionChainData.calls?.length || 0} contracts
                  </div>
                </div>

                <div>
                  <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                    Puts
                  </div>
                  <div className="text-sm text-bloomberg-financial-put">
                    {optionChainData.puts?.length || 0} contracts
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-bloomberg-text-muted">
                Carga una cadena de opciones para ver detalles
              </div>
            )}

            {/* Historical Price Chart */}
            {selectedUnderlying && (
              <div className="mt-6 pt-6 border-t border-bloomberg-border">
                <h3 className="terminal-header mb-4">Gráfico Histórico</h3>
                {loading.historical ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-bloomberg-accent-blue mx-auto mb-2"></div>
                      <div className="text-xs text-bloomberg-text-secondary">Cargando...</div>
                    </div>
                  </div>
                ) : historicalData ? (
                  <PriceHistoryChart
                    historicalData={historicalData}
                    onExpand={() => setChartModalOpen(true)}
                  />
                ) : (
                  <div className="text-sm text-bloomberg-text-muted">
                    Sin datos históricos disponibles
                  </div>
                )}
              </div>
            )}
          </div>
        </Panel>
      </PanelGroup>

      {/* Historical Chart Modal */}
      <HistoricalChartModal
        isOpen={chartModalOpen}
        onClose={() => setChartModalOpen(false)}
      />
    </div>
  );
}
