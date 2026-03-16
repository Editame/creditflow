import { PaymentFrequency } from '@prisma/client';

export const TIMEZONE_OFFSET_HOURS = -5;
export const TIMEZONE_OFFSET_MS = TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000;
export const TIMEZONE_NAME = 'America/Bogota';

export function getNowInTimezone(): Date {
  const now = new Date();
  return new Date(now.getTime() + TIMEZONE_OFFSET_MS);
}

export function getTodayInTimezone(): Date {
  const nowInTz = getNowInTimezone();
  return new Date(Date.UTC(nowInTz.getUTCFullYear(), nowInTz.getUTCMonth(), nowInTz.getUTCDate(), 0, 0, 0, 0));
}

export function getStartOfDayUTC(date: Date): Date {
  if (!date) throw new Error('Date parameter is required');
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
}

export function getEndOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

export function getTodayRangeInTimezone(): { start: Date; end: Date } {
  const todayInTz = getTodayInTimezone();
  const startUTC = new Date(todayInTz.getTime() - TIMEZONE_OFFSET_MS);
  const endUTC = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000);
  return { start: startUTC, end: endUTC };
}

export function getYesterdayRangeInTimezone(): { start: Date; end: Date } {
  const todayInTz = getTodayInTimezone();
  const yesterdayInTz = new Date(todayInTz.getTime() - 24 * 60 * 60 * 1000);
  const startUTC = new Date(yesterdayInTz.getTime() - TIMEZONE_OFFSET_MS);
  const endUTC = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000);
  return { start: startUTC, end: endUTC };
}

export function getDateRangeInTimezone(dateString: string): { start: Date; end: Date } {
  const [year, month, day] = dateString.split('-').map(Number);
  const dateInTz = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const startUTC = new Date(dateInTz.getTime() - TIMEZONE_OFFSET_MS);
  const endUTC = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000);
  return { start: startUTC, end: endUTC };
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
  return { mes: now.getUTCMonth() + 1, anio: now.getUTCFullYear() };
}

export function getMonthRangeInTimezone(mes: number, anio: number): { start: Date; end: Date } {
  const startOfMonth = new Date(Date.UTC(anio, mes - 1, 1, 0, 0, 0, 0));
  const startUTC = new Date(startOfMonth.getTime() - TIMEZONE_OFFSET_MS);
  const startOfNextMonth = new Date(Date.UTC(anio, mes, 1, 0, 0, 0, 0));
  const endUTC = new Date(startOfNextMonth.getTime() - TIMEZONE_OFFSET_MS);
  return { start: startUTC, end: endUTC };
}

export function getLocalDateFromUTC(date: Date): Date {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export function aplicaCobroHoy(fechaInicioCobro: Date, frecuencia: PaymentFrequency): boolean {
  const inicio = getStartOfDayUTC(fechaInicioCobro);
  const hoy = getTodayInTimezone();
  if (hoy.getTime() < inicio.getTime()) return false;
  if (frecuencia === PaymentFrequency.DAILY) return true;
  return inicio.getUTCDay() === hoy.getUTCDay();
}

export function calculatePeriodsElapsed(fechaInicioCobro: Date, frecuencia: PaymentFrequency): number {
  const now = getTodayInTimezone();
  const start = getStartOfDayUTC(fechaInicioCobro);
  if (now.getTime() <= start.getTime()) return 0;
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return frecuencia === PaymentFrequency.DAILY ? diffDays : Math.floor(diffDays / 7);
}

export function addDaysToDate(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function calcularDiasEnMora(fechaInicioCobro: Date, frecuencia: PaymentFrequency, totalPaid: number, valorCuota: number): number {
  if (valorCuota <= 0) return 0;
  const periodosTranscurridos = calculatePeriodsElapsed(fechaInicioCobro, frecuencia);
  const aplicaHoy = aplicaCobroHoy(fechaInicioCobro, frecuencia);
  const periodosCompletados = aplicaHoy ? Math.max(0, periodosTranscurridos - 1) : periodosTranscurridos;
  const cuotasCubiertas = Math.floor(totalPaid / valorCuota);
  return Math.max(0, periodosCompletados - cuotasCubiertas);
}
