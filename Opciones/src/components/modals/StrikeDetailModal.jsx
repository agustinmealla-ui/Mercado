/**
 * StrikeDetailModal Component - Display Greeks and detailed info for a strike
 */

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTerminalStore } from '../../stores/terminalStore';
import { formatPrice, formatStrike, formatGreek, formatPercent, formatVolume } from '../../utils/formatting';

export default function StrikeDetailModal({ isOpen, onClose, optionData, optionType }) {
  const { selectedUnderlying, selectedExpiration, fetchGreeks, greeksData, loading } = useTerminalStore();
  const [strikeGreeks, setStrikeGreeks] = useState(null);

  useEffect(() => {
    if (isOpen && optionData && !greeksData) {
      // Fetch Greeks if not already loaded
      fetchGreeks();
    }
  }, [isOpen, optionData, greeksData, fetchGreeks]);

  useEffect(() => {
    if (greeksData && optionData) {
      // Find Greeks for this specific strike
      const greeksList = optionType === 'call' ? greeksData.calls : greeksData.puts;
      const found = greeksList?.find((g) => g.strike === optionData.strike);
      setStrikeGreeks(found);
    }
  }, [greeksData, optionData, optionType]);

  if (!optionData) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded bg-bloomberg-bg-secondary border border-bloomberg-border shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-bloomberg-border">
                  <Dialog.Title className="text-lg font-semibold text-bloomberg-text-primary">
                    {selectedUnderlying} {formatStrike(optionData.strike)} {optionType.toUpperCase()}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-bloomberg-text-muted hover:text-bloomberg-text-primary transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-6">
                  {/* Option Details */}
                  <div>
                    <h3 className="terminal-header mb-3">Option Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                          Contract Symbol
                        </div>
                        <div className="text-sm text-bloomberg-text-primary font-mono">
                          {optionData.contractSymbol}
                        </div>
                      </div>
                      <div>
                        <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                          Expiration
                        </div>
                        <div className="text-sm text-bloomberg-text-primary">
                          {selectedExpiration}
                        </div>
                      </div>
                      <div>
                        <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                          Last Price
                        </div>
                        <div className="terminal-metric">
                          ${formatPrice(optionData.lastPrice)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                          Mid Price
                        </div>
                        <div className="terminal-metric text-bloomberg-accent-blue">
                          ${formatPrice(optionData.mid)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                          Bid × Ask
                        </div>
                        <div className="text-sm text-bloomberg-text-primary font-mono">
                          ${formatPrice(optionData.bid)} × ${formatPrice(optionData.ask)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                          Volume
                        </div>
                        <div className="text-sm text-bloomberg-text-primary">
                          {formatVolume(optionData.volume)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                          Open Interest
                        </div>
                        <div className="text-sm text-bloomberg-text-primary">
                          {formatVolume(optionData.openInterest)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                          In The Money
                        </div>
                        <div className="text-sm">
                          <span
                            className={
                              optionData.intheMoney
                                ? 'text-bloomberg-financial-positive'
                                : 'text-bloomberg-text-muted'
                            }
                          >
                            {optionData.intheMoney ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Greeks */}
                  <div>
                    <h3 className="terminal-header mb-3">Greeks</h3>
                    {loading.greeks ? (
                      <div className="text-sm text-bloomberg-text-muted">Loading Greeks...</div>
                    ) : strikeGreeks ? (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-bloomberg-bg-tertiary rounded p-3">
                          <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                            Delta (Δ)
                          </div>
                          <div className="terminal-metric">
                            {formatGreek(strikeGreeks.delta, 4)}
                          </div>
                          <div className="text-xxs text-bloomberg-text-muted mt-1">
                            Price sensitivity
                          </div>
                        </div>
                        <div className="bg-bloomberg-bg-tertiary rounded p-3">
                          <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                            Gamma (Γ)
                          </div>
                          <div className="terminal-metric">
                            {formatGreek(strikeGreeks.gamma, 4)}
                          </div>
                          <div className="text-xxs text-bloomberg-text-muted mt-1">
                            Delta change rate
                          </div>
                        </div>
                        <div className="bg-bloomberg-bg-tertiary rounded p-3">
                          <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                            Theta (Θ)
                          </div>
                          <div className="terminal-metric text-bloomberg-financial-negative">
                            {formatGreek(strikeGreeks.theta, 4)}
                          </div>
                          <div className="text-xxs text-bloomberg-text-muted mt-1">
                            Time decay per day
                          </div>
                        </div>
                        <div className="bg-bloomberg-bg-tertiary rounded p-3">
                          <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                            Vega (ν)
                          </div>
                          <div className="terminal-metric">
                            {formatGreek(strikeGreeks.vega, 4)}
                          </div>
                          <div className="text-xxs text-bloomberg-text-muted mt-1">
                            Volatility sensitivity
                          </div>
                        </div>
                        <div className="bg-bloomberg-bg-tertiary rounded p-3">
                          <div className="text-xxs text-bloomberg-text-muted uppercase mb-1">
                            Rho (ρ)
                          </div>
                          <div className="terminal-metric">
                            {formatGreek(strikeGreeks.rho, 4)}
                          </div>
                          <div className="text-xxs text-bloomberg-text-muted mt-1">
                            Interest rate sensitivity
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-bloomberg-text-muted">
                        Click "Load Greeks" to see detailed Greeks for this option
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {!strikeGreeks && !loading.greeks && (
                      <button onClick={fetchGreeks} className="btn-primary">
                        Load Greeks
                      </button>
                    )}
                    <button onClick={onClose} className="btn-secondary">
                      Close
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
