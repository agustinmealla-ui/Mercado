/**
 * Terminal Store - Global state management using Zustand
 *
 * Manages all terminal state including:
 * - UI state (active tab, modals, selections)
 * - Data state (option chains, Greeks, distributions, payoffs)
 * - Loading state for async operations
 */

import { create } from 'zustand';
import { mcpClient } from '../api/mcpClient';

export const useTerminalStore = create((set, get) => ({
  // UI State
  activeTab: 'chain',
  selectedUnderlying: 'AAPL',
  selectedExpiration: null,
  modalOpen: false,
  modalData: null,

  // Data State
  availableExpirations: [],
  optionChainData: null,
  greeksData: null,
  distributionData: null,
  historicalData: null,
  payoffPositions: [], // List of positions for multi-leg strategies

  // Loading State
  loading: {
    expirations: false,
    chain: false,
    greeks: false,
    distribution: false,
    payoff: false,
    historical: false,
  },

  // Error State
  error: null,

  // UI Actions
  setActiveTab: (tab) => set({ activeTab: tab }),

  setUnderlying: (ticker) => set({
    selectedUnderlying: ticker,
    selectedExpiration: null,
    optionChainData: null,
    greeksData: null,
    distributionData: null,
  }),

  setExpiration: (expiration) => set({
    selectedExpiration: expiration,
    optionChainData: null,
    greeksData: null,
    distributionData: null,
  }),

  openModal: (data) => set({ modalOpen: true, modalData: data }),
  closeModal: () => set({ modalOpen: false, modalData: null }),

  // Data Actions
  fetchExpirations: async (underlying) => {
    set((state) => ({
      loading: { ...state.loading, expirations: true },
      error: null
    }));

    try {
      const data = await mcpClient.getExpirations(underlying || get().selectedUnderlying);
      set({
        availableExpirations: data.expirations,
        selectedExpiration: data.expirations[0] || null,
      });
    } catch (error) {
      console.error('Failed to fetch expirations:', error);
      set({ error: error.message });
    } finally {
      set((state) => ({
        loading: { ...state.loading, expirations: false }
      }));
    }
  },

  fetchChain: async () => {
    const { selectedUnderlying, selectedExpiration } = get();
    if (!selectedUnderlying || !selectedExpiration) {
      console.warn('Cannot fetch chain: missing underlying or expiration');
      return;
    }

    set((state) => ({
      loading: { ...state.loading, chain: true },
      error: null
    }));

    try {
      const data = await mcpClient.getChain(selectedUnderlying, selectedExpiration);
      set({ optionChainData: data });
    } catch (error) {
      console.error('Failed to fetch option chain:', error);
      set({ error: error.message });
    } finally {
      set((state) => ({
        loading: { ...state.loading, chain: false }
      }));
    }
  },

  fetchGreeks: async () => {
    const { selectedUnderlying, selectedExpiration } = get();
    if (!selectedUnderlying || !selectedExpiration) return;

    set((state) => ({
      loading: { ...state.loading, greeks: true },
      error: null
    }));

    try {
      const data = await mcpClient.computeGreeks(selectedUnderlying, selectedExpiration);
      set({ greeksData: data });
    } catch (error) {
      console.error('Failed to fetch Greeks:', error);
      set({ error: error.message });
    } finally {
      set((state) => ({
        loading: { ...state.loading, greeks: false }
      }));
    }
  },

  fetchDistribution: async (minMoneyness = 0.7, maxMoneyness = 1.3) => {
    const { selectedUnderlying, selectedExpiration } = get();
    if (!selectedUnderlying || !selectedExpiration) return;

    set((state) => ({
      loading: { ...state.loading, distribution: true },
      error: null
    }));

    try {
      const data = await mcpClient.getDistribution(
        selectedUnderlying,
        selectedExpiration,
        minMoneyness,
        maxMoneyness
      );
      set({ distributionData: data });
    } catch (error) {
      console.error('Failed to fetch distribution:', error);
      set({ error: error.message });
    } finally {
      set((state) => ({
        loading: { ...state.loading, distribution: false }
      }));
    }
  },

  fetchHistoricalPrices: async (period = '3mo', interval = '1d') => {
    const { selectedUnderlying } = get();
    if (!selectedUnderlying) return;

    set((state) => ({
      loading: { ...state.loading, historical: true },
      error: null
    }));

    try {
      const data = await mcpClient.getHistoricalPrices(selectedUnderlying, period, interval);
      set({ historicalData: data });
    } catch (error) {
      console.error('Failed to fetch historical prices:', error);
      set({ error: error.message });
    } finally {
      set((state) => ({
        loading: { ...state.loading, historical: false }
      }));
    }
  },

  // Payoff Position Management
  addPosition: async (position) => {
    const { selectedUnderlying, selectedExpiration, optionChainData } = get();

    set((state) => ({
      loading: { ...state.loading, payoff: true },
      error: null
    }));

    try {
      // Determine spot range for payoff calculation
      const currentSpot = optionChainData?.spot || 100;
      const spotMin = currentSpot * 0.5;
      const spotMax = currentSpot * 1.5;

      // Fetch payoff profile for this position
      const payoff = await mcpClient.computePayoff(
        position.side,
        position.option_type,
        selectedUnderlying,
        position.strike,
        selectedExpiration,
        spotMin,
        spotMax
      );

      // Fetch Greeks if not provided
      let greeks = position.greeks;
      if (!greeks) {
        try {
          const greeksData = get().greeksData;
          if (!greeksData) {
            await get().fetchGreeks();
          }
          const allGreeks = get().greeksData;
          const greeksList = position.option_type === 'call' ? allGreeks?.calls : allGreeks?.puts;
          const foundGreeks = greeksList?.find((g) => g.strike === position.strike);
          greeks = foundGreeks || null;
        } catch (err) {
          console.warn('Could not fetch Greeks for position:', err);
        }
      }

      set((state) => ({
        payoffPositions: [...state.payoffPositions, {
          ...position,
          payoff,
          greeks,
        }]
      }));
    } catch (error) {
      console.error('Failed to add position:', error);
      set({ error: error.message });
    } finally {
      set((state) => ({
        loading: { ...state.loading, payoff: false }
      }));
    }
  },

  removePosition: (index) => {
    set((state) => ({
      payoffPositions: state.payoffPositions.filter((_, i) => i !== index)
    }));
  },

  clearPositions: () => set({ payoffPositions: [] }),

  // Clear all data
  clearData: () => set({
    availableExpirations: [],
    optionChainData: null,
    greeksData: null,
    distributionData: null,
    historicalData: null,
    payoffPositions: [],
    error: null,
  }),
}));
