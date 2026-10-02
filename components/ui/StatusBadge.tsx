import React from 'react';
import { VehicleStatus } from '@/types/vehicle';
import { getIsofixRating } from '@/lib/calculations';
import { CheckCircle2, AlertTriangle, XCircle, Clock, Award, ShoppingBag, Eye } from 'lucide-react';

interface StatusBadgeProps {
  status: VehicleStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs py-0.5 px-2' : 'text-xs py-1 px-2.5 font-medium';

  switch (status) {
    case 'Finalista':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 ${sizeClasses}`}
        >
          <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          Finalista
        </span>
      );
    case 'Eliminado':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/80 ${sizeClasses}`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          Eliminado
        </span>
      );
    case 'Comprado':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 ${sizeClasses}`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Comprado
        </span>
      );
    case 'Testado':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          Testado
        </span>
      );
    case 'Visitei':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 ${sizeClasses}`}
        >
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          Visitei
        </span>
      );
    case 'Aguardando proposta':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/80 ${sizeClasses}`}
        >
          <Clock className="w-3.5 h-3.5 text-purple-600" />
          Proposta
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 ${sizeClasses}`}
        >
          Quero visitar
        </span>
      );
  }
}

interface IsofixBadgeProps {
  distanceCm: number | null | undefined;
  dataSource?: string;
  showDetails?: boolean;
}

export function IsofixBadge({ distanceCm, dataSource, showDetails = false }: IsofixBadgeProps) {
  if (distanceCm === null || distanceCm === undefined || distanceCm <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
        Pendente de medição
      </span>
    );
  }

  const ratingInfo = getIsofixRating(distanceCm);

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-medium tabular-nums ${ratingInfo.badgeBg} ${ratingInfo.badgeText}`}
      >
        <span className="font-semibold text-xs">{distanceCm.toFixed(1)} cm</span>
        <span aria-hidden="true" className="opacity-40">·</span>
        <span>{ratingInfo.rating}</span>
      </span>

      {dataSource && (
        <span className="text-[10px] text-slate-600 dark:text-slate-300 font-mono tracking-wider">
          [{dataSource}]
        </span>
      )}

      {showDetails && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 w-full mt-0.5">
          {ratingInfo.description}
        </p>
      )}
    </div>
  );
}
