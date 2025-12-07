/**
 * OptionChainTable Component - Sortable table for calls or puts
 */

import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { callColumns, putColumns } from './columns.jsx';

export default function OptionChainTable({ data = [], type = 'call', spotPrice, onRowClick }) {
  const [sorting, setSorting] = useState([{ id: 'strike', desc: false }]);

  const columns = useMemo(() => {
    return type === 'call' ? callColumns : putColumns;
  }, [type]);

  // Find ATM strike (closest to spot price)
  const atmStrike = useMemo(() => {
    if (!spotPrice || !data || data.length === 0) return null;

    let closest = data[0]?.strike;
    let minDiff = Math.abs(spotPrice - closest);

    data.forEach((option) => {
      const diff = Math.abs(spotPrice - option.strike);
      if (diff < minDiff) {
        minDiff = diff;
        closest = option.strike;
      }
    });

    return closest;
  }, [data, spotPrice]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-bloomberg-text-muted text-sm">
        No {type === 'call' ? 'call' : 'put'} options available
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-[600px] border border-bloomberg-border rounded">
      <table className="w-full text-xs font-mono">
        <thead className="bg-bloomberg-bg-tertiary sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-2 py-1.5 text-left terminal-header cursor-pointer hover:bg-bloomberg-bg-hover select-none"
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ width: header.column.columnDef.size }}
                >
                  <div className="flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() && (
                      <span className="text-bloomberg-accent-blue">
                        {header.column.getIsSorted() === 'asc' ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const isATM = row.original.strike === atmStrike;
            const isITM = row.original.intheMoney;

            return (
              <tr
                key={row.id}
                onClick={() => onRowClick && onRowClick(row.original)}
                className={`
                  border-b border-bloomberg-border hover:bg-bloomberg-bg-hover cursor-pointer transition-colors
                  ${isATM ? 'bg-bloomberg-bg-tertiary' : ''}
                `}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`
                      px-2 py-1 terminal-cell text-right
                      ${cell.column.id === 'strike' ? 'text-left font-semibold' : ''}
                      ${isITM && cell.column.id !== 'strike' ? 'text-bloomberg-text-primary' : ''}
                    `}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
