/**
 * TabNavigation Component - Tab switcher for main views
 */

import { useTerminalStore } from '../../stores/terminalStore';
import { BarChart3, TrendingUp, Layers, Code } from 'lucide-react';

const TABS = [
  { id: 'chain', label: 'Cadena de Opciones', icon: Layers },
  { id: 'distribution', label: 'Distribución', icon: BarChart3 },
  { id: 'payoff', label: 'Payoff', icon: TrendingUp },
  { id: 'builder', label: 'Constructor', icon: Code },
];

export default function TabNavigation() {
  const { activeTab, setActiveTab } = useTerminalStore();

  return (
    <div className="h-full flex items-center px-4 bg-bloomberg-bg-secondary border-b border-bloomberg-border">
      <div className="flex gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors
                ${
                  isActive
                    ? 'text-bloomberg-accent-blue border-b-2 border-bloomberg-accent-blue'
                    : 'text-bloomberg-text-secondary hover:text-bloomberg-text-primary'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
