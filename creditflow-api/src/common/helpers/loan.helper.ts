import { FrecuenciaPago } from '@prisma/client';
import { addDaysToDate } from './date.helper';

export function calculateLoanEndDate(startDate: Date, periods: number, frequency: FrecuenciaPago): Date {
  const daysToAdd = frequency === FrecuenciaPago.DIARIO ? periods : periods * 7;
  return addDaysToDate(startDate, daysToAdd);
}

export function calculatePeriodsBetween(startDate: Date, endDate: Date, frequency: FrecuenciaPago): number {
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const periods = frequency === FrecuenciaPago.DIARIO ? diffDays : Math.ceil(diffDays / 7);
  return Math.max(1, periods);
}

export function calculateTotalWithInterest(principal: number, interestRate: number): number {
  return principal * (1 + interestRate / 100);
}

export function calculateQuotaValue(totalAmount: number, periods: number): number {
  return periods > 0 ? Math.ceil(totalAmount / periods) : totalAmount;
}

export function calculateRemainingQuotas(remainingBalance: number, quotaValue: number): number {
  return quotaValue > 0 ? Math.ceil(remainingBalance / quotaValue) : 0;
}
