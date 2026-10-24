'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Car } from 'lucide-react';
import { getBrandIconUrl } from '@/lib/brandIcons';

interface BrandLogoProps {
  brand?: string | null;
  model?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallbackText?: boolean;
}

export function BrandLogo({
  brand = '',
  model = '',
  size = 'md',
  className = '',
  showFallbackText = false,
}: BrandLogoProps) {
  const [hasError, setHasError] = useState(false);
  const iconUrl = getBrandIconUrl(brand, model);

  // Size mapping
  const sizeConfig = {
    sm: {
      box: 'w-8 h-8 rounded-lg',
      px: 32,
      iconSize: 'w-4 h-4',
      fontSize: 'text-[9px]',
    },
    md: {
      box: 'w-11 h-11 rounded-xl',
      px: 44,
      iconSize: 'w-5 h-5',
      fontSize: 'text-[11px]',
    },
    lg: {
      box: 'w-14 h-14 rounded-2xl',
      px: 56,
      iconSize: 'w-6 h-6',
      fontSize: 'text-xs',
    },
    xl: {
      box: 'w-16 h-16 rounded-2xl',
      px: 64,
      iconSize: 'w-8 h-8',
      fontSize: 'text-sm',
    },
  }[size];

  const brandDisplayName = brand?.trim() || 'Car';
  const brandInitials = brandDisplayName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .substring(0, 3)
    .toUpperCase();

  if (iconUrl && !hasError) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 ${sizeConfig.box} ${className}`}
        title={`${brandDisplayName} ${model || ''}`}
      >
        <Image
          src={iconUrl}
          alt={`${brandDisplayName} icon`}
          width={sizeConfig.px}
          height={sizeConfig.px}
          className="w-full h-full object-cover select-none"
          onError={() => setHasError(true)}
          referrerPolicy="no-referrer"
          priority={size === 'lg' || size === 'xl'}
        />
      </div>
    );
  }

  // Graceful fallback emblem
  return (
    <div
      className={`relative shrink-0 overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200/80 dark:border-white/10 shadow-xs select-none transition-transform group-hover:scale-105 ${sizeConfig.box} ${className}`}
      title={`${brandDisplayName} ${model || ''}`}
    >
      <Car className={`${sizeConfig.iconSize} text-slate-500 dark:text-slate-400`} />
      {showFallbackText && (
        <span className={`font-black text-slate-600 dark:text-slate-300 leading-none mt-0.5 tracking-tighter ${sizeConfig.fontSize}`}>
          {brandInitials}
        </span>
      )}
    </div>
  );
}
