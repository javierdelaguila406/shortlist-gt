'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CandidatosFilterProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  search: string;
  estado: string;
  scoreMin: number;
  scoreMax: number;
  disponibilidad: string;
}

export function CandidatosFilter({ onFilterChange }: CandidatosFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    estado: 'all',
    scoreMin: 0,
    scoreMax: 100,
    disponibilidad: 'all',
  });

  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange(updated);
  };

  const handleReset = () => {
    const defaultFilters: FilterState = {
      search: '',
      estado: 'all',
      scoreMin: 0,
      scoreMax: 100,
      disponibilidad: 'all',
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const isFiltered =
    filters.search ||
    filters.estado !== 'all' ||
    filters.scoreMin > 0 ||
    filters.scoreMax < 100 ||
    filters.disponibilidad !== 'all';

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Buscar candidato..."
          value={filters.search}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Filter Button */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtros {isFiltered && '(Activos)'}
        </Button>
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Filters Panel */}
      {isOpen && (
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 space-y-4">
          {/* Estado Filter */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Estado
            </label>
            <select
              value={filters.estado}
              onChange={(e) => handleFilterChange({ estado: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-zinc-700 border border-zinc-600 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_revision">En Revisión</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
              <option value="oferta">Con Oferta</option>
            </select>
          </div>

          {/* Score Range */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Score: {filters.scoreMin} - {filters.scoreMax}
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={filters.scoreMin}
                onChange={(e) =>
                  handleFilterChange({ scoreMin: parseInt(e.target.value) })
                }
                className="w-full"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={filters.scoreMax}
                onChange={(e) =>
                  handleFilterChange({ scoreMax: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>
          </div>

          {/* Disponibilidad Filter */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Disponibilidad
            </label>
            <select
              value={filters.disponibilidad}
              onChange={(e) =>
                handleFilterChange({ disponibilidad: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-zinc-700 border border-zinc-600 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Todos</option>
              <option value="inmediata">Inmediata</option>
              <option value="dos_semanas">2 Semanas</option>
              <option value="mes">1 Mes</option>
              <option value="negociable">Negociable</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
