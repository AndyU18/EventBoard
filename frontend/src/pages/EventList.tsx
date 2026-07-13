import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { 
  useReactTable, 
  getCoreRowModel, 
  getPaginationRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table';
import { 
  Search, SlidersHorizontal, ChevronLeft, ChevronRight,
  Eye, CornerDownRight, Box, Clock
} from 'lucide-react';

interface EventLog {
  id: string;
  type: string;
  sourceModule: string;
  payload: any;
  userId?: string;
  user?: { name: string; email: string };
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  createdAt: string;
}

export const EventList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data: events = [], isLoading } = useQuery<EventLog[]>({
    queryKey: ['events-history', severityFilter, moduleFilter],
    queryFn: async () => {
      const params: any = {};
      if (severityFilter) params.severity = severityFilter;
      if (moduleFilter) params.sourceModule = moduleFilter;
      const res = await api.get('/event-store', { params });
      return res.data;
    },
  });

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const filteredData = React.useMemo(() => {
    return events.filter(event => 
      event.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [events, searchTerm]);

  const columnHelper = createColumnHelper<EventLog>();

  const columns = React.useMemo(() => [
    columnHelper.accessor('type', {
      header: () => <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Tipo de Evento</span>,
      cell: (info) => <span className="font-extrabold text-sm text-slate-100">{info.getValue()}</span>,
    }),
    columnHelper.accessor('sourceModule', {
      header: () => <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Módulo</span>,
      cell: (info) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-md text-xs font-semibold text-slate-300">
          <Box className="h-3 w-3 text-slate-500" />
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('severity', {
      header: () => <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Severidad</span>,
      cell: (info) => {
        const val = info.getValue();
        let color = 'bg-slate-800 text-slate-400 border-slate-700/60';
        if (val === 'WARNING') color = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        if (val === 'CRITICAL') color = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        return (
          <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider ${color}`}>
            {val}
          </span>
        );
      },
    }),
    columnHelper.accessor('user.name', {
      header: () => <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Usuario</span>,
      cell: (info) => <span className="text-xs text-slate-300 font-medium">{info.getValue() || 'Sistema'}</span>,
    }),
    columnHelper.accessor('createdAt', {
      header: () => <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Fecha / Hora</span>,
      cell: (info) => {
        const date = new Date(info.getValue());
        return (
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Detalles</span>,
      cell: (info) => (
        <button
          onClick={() => toggleRow(info.row.original.id)}
          className={`p-1.5 rounded-lg border transition-all duration-200 ${
            expandedRow === info.row.original.id
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    }),
  ], [expandedRow]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
          Event Store (Historial)
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Histórico persistido de todos los eventos del sistema con búsqueda y filtros.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/30 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por tipo de evento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold mr-1">
            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            Filtros:
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-all flex-1 md:flex-initial cursor-pointer"
          >
            <option value="">Severidad (Todas)</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-all flex-1 md:flex-initial cursor-pointer"
          >
            <option value="">Módulos (Todos)</option>
            <option value="auth">Auth</option>
            <option value="documents">Documents</option>
            <option value="tasks">Tasks</option>
            <option value="payments">Payments</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900/10 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="text-center py-20 text-xs text-slate-500">Cargando eventos desde el Event Store...</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 text-xs text-slate-500">No se encontraron eventos con los filtros seleccionados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-slate-800 bg-slate-900/30">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-6 py-4">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr className="hover:bg-slate-900/20 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>

                    {expandedRow === row.original.id && (
                      <tr className="bg-slate-950/40">
                        <td colSpan={columns.length} className="px-8 py-4 border-b border-slate-800/60">
                          <div className="flex gap-2 text-xs text-slate-400 font-semibold mb-2">
                            <CornerDownRight className="h-4 w-4 text-indigo-500" />
                            Detalles del Payload de Evento:
                          </div>
                          <pre className="bg-slate-950 border border-slate-900 rounded-xl p-4 text-indigo-300 text-xs overflow-x-auto leading-relaxed shadow-inner">
                            {JSON.stringify(row.original.payload, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-center px-6 py-4 bg-slate-900/30 border-t border-slate-800">
              <span className="text-xs text-slate-500 font-semibold">
                Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="p-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg hover:bg-slate-800/80 disabled:opacity-40 disabled:hover:bg-slate-900 transition-all duration-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="p-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg hover:bg-slate-800/80 disabled:opacity-40 disabled:hover:bg-slate-900 transition-all duration-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
