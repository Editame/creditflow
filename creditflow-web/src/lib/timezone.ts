export const TIMEZONE_OFFSET_HOURS = -5;
export const TIMEZONE_OFFSET_MS = TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000;
export const TIMEZONE_NAME = 'America/Bogota';

export function getNowInTimezone(): Date {
  const now = new Date();
  return new Date(now.getTime() + TIMEZONE_OFFSET_MS);
}

export function getTodayInTimezone(): Date {
  const nowInTz = getNowInTimezone();
  return new Date(Date.UTC(
    nowInTz.getUTCFullYear(),
    nowInTz.getUTCMonth(),
    nowInTz.getUTCDate(),
    0, 0, 0, 0
  ));
}

export function getTodayString(): string {
  const today = getTodayInTimezone();
  return today.toISOString().split('T')[0];
}

export function toTimezone(date: Date): Date {
  return new Date(date.getTime() + TIMEZONE_OFFSET_MS);
}

export function getCurrentMonthYear(): { mes: number; anio: number } {
  const now = getNowInTimezone();
  return {
    mes: now.getUTCMonth() + 1,
    anio: now.getUTCFullYear()
  };
}

export function formatDateDisplay(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00Z');
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: TIMEZONE_NAME
  });
}

export function formatTimeInTimezone(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  return d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE_NAME
  });
}

export function getGreeting(): string {
  const now = getNowInTimezone();
  const hour = now.getUTCHours();

  if (hour < 12) {
    return 'Buenos días';
  } else if (hour < 18) {
    return 'Buenas tardes';
  } else {
    return 'Buenas noches';
  }
}

export function formatDateShort(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: TIMEZONE_NAME
  });
}

export function formatDateTimeInTimezone(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE_NAME
  });
}

export function formatTodayHeader(): string {
  const now = new Date();
  return now.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: TIMEZONE_NAME
  });
}

export function formatBusinessDate(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const day = d.getUTCDate().toString().padStart(2, '0');
  const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}
