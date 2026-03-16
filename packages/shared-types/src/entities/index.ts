import { PaymentFrequency, LoanStatus } from '../enums';

// ============================================
// CLIENT
// ============================================

export interface Client {
  id: number;
  tenantId: string;
  routeId: number;
  idNumber: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  idPhotoUrl: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClientDto {
  routeId: number;
  idNumber: string;
  fullName: string;
  phone?: string;
  address?: string;
  idPhotoUrl?: string;
}

export interface UpdateClientDto {
  routeId?: number;
  idNumber?: string;
  fullName?: string;
  phone?: string;
  address?: string;
  idPhotoUrl?: string;
  active?: boolean;
}

// ============================================
// LOAN
// ============================================

export interface Loan {
  id: number;
  tenantId: string;
  clientId: number;
  loanAmount: number;
  interestRate: number;
  paymentFrequency: PaymentFrequency;
  installmentValue: number;
  pendingBalance: number;
  startDate: Date;
  endDate: Date;
  status: LoanStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLoanDto {
  clientId: number;
  loanAmount: number;
  interestRate: number;
  paymentFrequency: PaymentFrequency;
  installmentValue?: number;
  disbursementDate: string;
  collectionStartDate?: string;
  endDate?: string;
  discountConcepts?: Array<{
    conceptId: number;
    percentage?: number;
    fixedAmount?: number;
  }>;
  costConcepts?: Array<{
    conceptId: number;
    percentage?: number;
    fixedAmount?: number;
  }>;
}

export interface LoanWithRelations extends Loan {
  client: Client;
  payments: Payment[];
}

export interface RefinanceLoanDto {
  newAmount: number;
  interestRate: number;
  paymentFrequency: PaymentFrequency;
  installmentValue?: number;
  disbursementDate: string;
  collectionStartDate?: string;
  endDate?: string;
  refinancingReason?: string;
  discountConcepts?: Array<{
    conceptId: number;
    percentage?: number;
    fixedAmount?: number;
  }>;
  costConcepts?: Array<{
    conceptId: number;
    percentage?: number;
    fixedAmount?: number;
  }>;
}

// ============================================
// PAYMENT
// ============================================

export interface Payment {
  id: number;
  tenantId: string;
  loanId: number;
  collectorId: number;
  routeId: number;
  paidAmount: number;
  paymentDate: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentDto {
  loanId: number;
  paidAmount: number;
  paidBy?: 'CLIENT' | 'COLLECTOR';
  notes?: string;
}

export interface PaymentWithRelations extends Payment {
  loan: Loan;
  collector: {
    id: number;
    username: string;
  };
}

// ============================================
// ROUTE
// ============================================

export interface Route {
  id: number;
  tenantId: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRouteDto {
  name: string;
  description?: string;
}

export interface UpdateRouteDto {
  name?: string;
  description?: string;
  active?: boolean;
}

// ============================================
// EXPENSE
// ============================================

export interface Expense {
  id: number;
  tenantId: string;
  routeId: number;
  amount: number;
  description: string;
  category: string | null;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExpenseDto {
  routeId: number;
  amount: number;
  description: string;
  category?: string;
  date?: string;
}

// ============================================
// LEGACY ALIASES (for backward compatibility)
// ============================================

export type Cliente = Client;
export type CreateClienteDto = CreateClientDto;
export type UpdateClienteDto = UpdateClientDto;
export type Prestamo = Loan;
export type CreatePrestamoDto = CreateLoanDto;
export type RefinancePrestamoDto = RefinanceLoanDto;
export type PrestamoWithRelations = LoanWithRelations;
export type Pago = Payment;
export type CreatePagoDto = CreatePaymentDto;
export type PagoWithRelations = PaymentWithRelations;
export type Ruta = Route;
export type CreateRutaDto = CreateRouteDto;
export type UpdateRutaDto = UpdateRouteDto;
export type Gasto = Expense;
export type CreateGastoDto = CreateExpenseDto;
