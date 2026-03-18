// ============================================
// AUTHENTICATION
// ============================================

export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: any; // Will be typed by User from usuario.types
}

// ============================================
// PAGINATION
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

// ============================================
// USER DTOs
// ============================================

// User DTOs are defined in entities/usuario.types.ts
// to avoid duplication

// ============================================
// CLIENT DTOs
// ============================================

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
// ROUTE DTOs
// ============================================

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
// LOAN DTOs
// ============================================

export interface CreateLoanDto {
  clientId: number;
  loanAmount: number;
  interestRate: number;
  paymentFrequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
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

export interface RefinanceLoanDto {
  newAmount: number;
  interestRate: number;
  paymentFrequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
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
// PAYMENT DTOs
// ============================================

export interface CreatePaymentDto {
  loanId: number;
  amountPaid: number;
  paidBy?: 'CLIENT' | 'COLLECTOR';
  notes?: string;
}

// ============================================
// EXPENSE DTOs
// ============================================

export interface CreateExpenseDto {
  routeId: number;
  amount: number;
  description: string;
  category?: string;
  date?: string;
}

export interface UpdateExpenseDto {
  routeId?: number;
  amount?: number;
  description?: string;
  category?: string;
  date?: string;
}

// ============================================
// CHARGE CONCEPT DTOs
// ============================================

export interface CreateChargeConceptDto {
  name: string;
  percentage: number;
  type: 'DISCOUNT' | 'COST';
  isCalculated?: boolean;
  description?: string;
}

export interface UpdateChargeConceptDto {
  name?: string;
  percentage?: number;
  type?: 'DISCOUNT' | 'COST';
  isCalculated?: boolean;
  description?: string;
  active?: boolean;
}

// ============================================
// CASH / CAPITAL DTOs
// ============================================

export interface CreateCashRegisterDto {
  name: string;
  routeId?: number; // null = global
}

export interface CreateCashMovementConceptDto {
  name: string;
  type: 'IN' | 'OUT';
  description?: string;
}

export interface CreateCashMovementDto {
  cashRegisterId: number;
  conceptId: number;
  amount: number;
  description?: string;
}

export interface FilterCashMovementDto extends PaginationParams {
  cashRegisterId?: number;
  type?: 'IN' | 'OUT';
  dateFrom?: string;
  dateTo?: string;
}

// ============================================
// LEGACY ALIASES (for backward compatibility)
// ============================================

export type CreateClienteDto = CreateClientDto;
export type UpdateClienteDto = UpdateClientDto;
export type CreateRutaDto = CreateRouteDto;
export type UpdateRutaDto = UpdateRouteDto;
export type CreatePrestamoDto = CreateLoanDto;
export type RefinanciarPrestamoDto = RefinanceLoanDto;
export type CreatePagoDto = CreatePaymentDto;
export type CreateGastoDto = CreateExpenseDto;
export type UpdateGastoDto = UpdateExpenseDto;
// User DTOs aliases are in entities/usuario.types.ts

export interface FilterClientDto extends PaginationParams {
  routeId?: number;
  search?: string;
  active?: boolean;
}

export interface FilterLoanDto extends PaginationParams {
  clientId?: number;
  status?: string;
  routeId?: number;
}

export interface FilterPaymentDto extends PaginationParams {
  routeId?: number;
  date?: string;
  collectorId?: number;
}

export interface FilterExpenseDto extends PaginationParams {
  routeId?: number;
  month?: number;
  year?: number;
  category?: string;
}

// Legacy aliases for backward compatibility
export type FilterClienteDto = FilterClientDto;
export type FilterPrestamoDto = FilterLoanDto;
export type FilterPagoDto = FilterPaymentDto;
export type FilterGastoDto = FilterExpenseDto;

// ============================================
// INVESTMENT DTOs
// ============================================

export interface CreateInvestmentDto {
  name: string;
  description?: string;
  amount: number;
  interestRate: number;
  frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  startDate: string;
  notes?: string;
}

export interface UpdateInvestmentDto {
  name?: string;
  description?: string;
  notes?: string;
}

export interface CreateInvestmentReturnDto {
  amount: number;
  date?: string;
  notes?: string;
}
