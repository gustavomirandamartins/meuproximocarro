'use client';

import React, { useState } from 'react';
import { parsePtBrNumber, parsePtBrNullableNumber, formatMoney, formatNumber } from '@/lib/calculations';

interface PtBrNumberInputProps {
  value: number | null | undefined;
  onChange: (val: any) => void;
  isCurrency?: boolean;
  allowDecimals?: boolean;
  decimalPlaces?: number;
  allowNull?: boolean;
  showZero?: boolean;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  'aria-label'?: string;
}

export function PtBrNumberInput({
  value,
  onChange,
  isCurrency = false,
  allowDecimals = false,
  decimalPlaces = 2,
  allowNull = false,
  showZero = false,
  className = '',
  disabled = false,
  id,
  name,
  'aria-label': ariaLabel,
}: PtBrNumberInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [localText, setLocalText] = useState('');

  // Formata o valor numérico para exibição formatada no padrão brasileiro
  const formatForDisplay = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return '';
    if (val === 0 && !showZero) return '';
    if (isCurrency) {
      return formatMoney(val);
    }
    if (allowDecimals) {
      return formatNumber(val, decimalPlaces);
    }
    return formatNumber(val, 0);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (value === null || value === undefined || (value === 0 && !showZero)) {
      setLocalText('');
    } else {
      if (isCurrency) {
        setLocalText(formatMoney(value));
      } else if (allowDecimals) {
        setLocalText(formatNumber(value, decimalPlaces));
      } else {
        setLocalText(formatNumber(value, 0));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalText(raw);

    const trimmed = raw.trim();
    if (trimmed === '') {
      if (allowNull) {
        onChange(null);
      } else {
        onChange(0);
      }
      return;
    }

    // Leitura de números no padrão brasileiro:
    // O ponto "." é lido como separador de milhar (1.789 => 1789)
    // A vírgula "," é o separador decimal (11,2 => 11.2)
    if (allowNull) {
      const parsed = parsePtBrNullableNumber(raw);
      onChange(parsed);
    } else {
      const parsed = parsePtBrNumber(raw, 0);
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const trimmed = localText.trim();
    if (trimmed === '') {
      if (allowNull) {
        onChange(null);
      } else {
        onChange(0);
      }
    } else {
      const parsed = parsePtBrNumber(trimmed, 0);
      if (parsed === 0 && !showZero && !allowNull) {
        onChange(0);
      } else {
        onChange(parsed);
      }
    }
  };

  const displayValue = isFocused ? localText : formatForDisplay(value);

  return (
    <input
      type="text"
      inputMode="decimal"
      id={id}
      name={name}
      disabled={disabled}
      aria-label={ariaLabel}
      value={displayValue}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      placeholder=""
    />
  );
}
