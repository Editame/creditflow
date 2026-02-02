'use client';

import { useRef } from 'react';
import { Calendar } from 'lucide-react';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

const formatDateDisplay = (isoDate: string): string => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

const parseDisplayDate = (displayDate: string): string => {
  if (!displayDate) return '';
  const parts = displayDate.split('/');
  if (parts.length !== 3) return '';
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

export function DateInput({
  value,
  onChange,
  min,
  max,
  required,
  className = '',
  placeholder = 'dd/mm/yyyy',
}: DateInputProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    input = input.replace(/[^\d/]/g, '');

    if (input.length === 2 && !input.includes('/')) {
      input += '/';
    } else if (input.length === 5 && input.split('/').length === 2) {
      input += '/';
    }

    if (input.length > 10) {
      input = input.slice(0, 10);
    }

    if (input.length === 10) {
      const isoDate = parseDisplayDate(input);
      if (isoDate && !isNaN(new Date(isoDate).getTime())) {
        onChange(isoDate);
        return;
      }
    }

    e.target.value = input;
  };

  const handleCalendarClick = () => {
    dateInputRef.current?.showPicker();
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={formatDateDisplay(value)}
        onChange={handleTextChange}
        placeholder={placeholder}
        required={required}
        className={`w-full pr-10 ${className}`}
      />
      <button
        type="button"
        onClick={handleCalendarClick}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Calendar className="w-5 h-5" />
      </button>
      <input
        ref={dateInputRef}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={handleDatePickerChange}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  );
}
