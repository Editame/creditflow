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
  disbursementDate: Date;
  collectionStartDate: Date;
  endDate: Date;
  originalEndDate: Date;
  status: LoanStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanWithRelations extends Loan {
  client: Client;
  payments: Payment[];
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
  amountPaid: number;
  paidBy: 'CLIENT' | 'COLLECTOR';
  paymentDate: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
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

// ============================================
// CHARGE CONCEPT
// ============================================

export interface ChargeConcept {
  id: number;
  tenantId: string;
  name: string;
  percentage: number;
  type: 'DISCOUNT' | 'COST';
  isCalculated: boolean;
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// INVESTMENT
// ============================================

export interface Investment {
  id: number;
  tenantId: string;
  name: string;
  description: string | null;
  amount: number;
  interestRate: number;
  frequency: PaymentFrequency;
  expectedReturn: number;
  status: 'ACTIVE' | 'RECOVERED';
  startDate: Date;
  recoveredAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  returns?: InvestmentReturn[];
}

export interface InvestmentReturn {
  id: number;
  investmentId: number;
  amount: number;
  date: Date;
  notes: string | null;
  createdAt: Date;
}

// ============================================
// LEGACY ALIASES (for backward compatibility)
// ============================================

export type Cliente = Client;
export type Prestamo = Loan;
export type Pago = Payment;
export type Ruta = Route;
export type Gasto = Expense;
