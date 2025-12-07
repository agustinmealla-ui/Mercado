/**
 * Column Definitions for Option Chain Tables
 */

import { formatPrice, formatStrike, formatVolume, formatPercent, getMoneyColor } from '../../utils/formatting';

/**
 * Common column configuration for both calls and puts
 */
const createColumns = (type = 'call') => [
  {
    accessorKey: 'strike',
    header: 'Strike',
    cell: (info) => (
      <span className="font-semibold">{formatStrike(info.getValue())}</span>
    ),
    size: 80,
  },
  {
    accessorKey: 'lastPrice',
    header: 'Last',
    cell: (info) => formatPrice(info.getValue()),
    size: 70,
  },
  {
    accessorKey: 'bid',
    header: 'Bid',
    cell: (info) => formatPrice(info.getValue()),
    size: 70,
  },
  {
    accessorKey: 'ask',
    header: 'Ask',
    cell: (info) => formatPrice(info.getValue()),
    size: 70,
  },
  {
    accessorKey: 'mid',
    header: 'Mid',
    cell: (info) => (
      <span className="text-bloomberg-accent-blue">{formatPrice(info.getValue())}</span>
    ),
    size: 70,
  },
  {
    accessorKey: 'volume',
    header: 'Volume',
    cell: (info) => formatVolume(info.getValue()),
    size: 80,
  },
  {
    accessorKey: 'openInterest',
    header: 'Open Int',
    cell: (info) => formatVolume(info.getValue()),
    size: 80,
  },
  {
    accessorKey: 'impliedVolatility',
    header: 'IV',
    cell: (info) => {
      const value = info.getValue();
      return value ? formatPercent(value) : '-';
    },
    size: 70,
  },
  {
    accessorKey: 'intheMoney',
    header: 'ITM',
    cell: (info) => {
      const value = info.getValue();
      return (
        <span className={getMoneyColor(value)}>
          {value ? '✓' : ''}
        </span>
      );
    },
    size: 50,
  },
];

/**
 * Call option columns
 */
export const callColumns = createColumns('call');

/**
 * Put option columns
 */
export const putColumns = createColumns('put');
