/**
 * Formatting Utilities for Financial Data
 */

import numeral from 'numeral';
import { format } from 'date-fns';

/**
 * Format price with 2 decimal places
 */
export function formatPrice(value) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return numeral(value).format('0,0.00');
}

/**
 * Format strike price
 */
export function formatStrike(value) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return numeral(value).format('0,0.00');
}

/**
 * Format volume/open interest (no decimals)
 */
export function formatVolume(value) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  if (value === 0) return '0';
  return numeral(value).format('0,0');
}

/**
 * Format percentage (implied volatility, Greeks)
 */
export function formatPercent(value) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return numeral(value * 100).format('0.00') + '%';
}

/**
 * Format Greek value (delta, gamma, theta, vega, rho)
 */
export function formatGreek(value, decimals = 4) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  const format = '0.' + '0'.repeat(decimals);
  return numeral(value).format(format);
}

/**
 * Format date from YYYY-MM-DD or timestamp
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy');
  } catch (e) {
    return dateString;
  }
}

/**
 * Format datetime
 */
export function formatDateTime(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy HH:mm');
  } catch (e) {
    return dateString;
  }
}

/**
 * Calculate days to expiration
 */
export function calculateDTE(expirationDate) {
  if (!expirationDate) return 0;
  try {
    const expiration = new Date(expirationDate);
    const today = new Date();
    const diffTime = expiration - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  } catch (e) {
    return 0;
  }
}

/**
 * Get color class for P&L
 */
export function getPnLColor(value) {
  if (value === null || value === undefined || isNaN(value)) return 'text-bloomberg-financial-neutral';
  if (value > 0) return 'text-bloomberg-financial-positive';
  if (value < 0) return 'text-bloomberg-financial-negative';
  return 'text-bloomberg-financial-neutral';
}

/**
 * Get color class for ITM/OTM
 */
export function getMoneyColor(inTheMoney) {
  return inTheMoney ? 'text-bloomberg-financial-positive' : 'text-bloomberg-text-muted';
}

/**
 * Format moneyness (strike/spot ratio)
 */
export function formatMoneyness(strike, spot) {
  if (!strike || !spot) return '-';
  const moneyness = strike / spot;
  return numeral(moneyness).format('0.000');
}
