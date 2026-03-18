// Enums compartidos entre backend y frontend

export enum DeploymentMode {
  SAAS = 'SAAS',
  SELF_HOSTED = 'SELF_HOSTED',
}

export enum Plan {
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  COLLECTOR = 'COLLECTOR',
  ACCOUNTANT = 'ACCOUNTANT',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Administrador',
  [UserRole.ADMIN]: 'Administrador',
  [UserRole.SUPERVISOR]: 'Supervisor',
  [UserRole.COLLECTOR]: 'Cobrador',
  [UserRole.ACCOUNTANT]: 'Contador',
};

export enum PaymentFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum LoanStatus {
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export enum FeatureModule {
  // Base modules
  CLIENTS_BASIC = 'CLIENTS_BASIC',
  LOANS_BASIC = 'LOANS_BASIC',
  PAYMENTS_BASIC = 'PAYMENTS_BASIC',
  ROUTES_BASIC = 'ROUTES_BASIC',
  
  // Professional modules
  EXPENSES = 'EXPENSES',
  REPORTS_ADVANCED = 'REPORTS_ADVANCED',
  USERS_MANAGEMENT = 'USERS_MANAGEMENT',
  API_REST = 'API_REST',
  EXPORT_EXCEL = 'EXPORT_EXCEL',
  CUSTOM_CONCEPTS = 'CUSTOM_CONCEPTS',
  
  // Enterprise modules
  WHITE_LABEL = 'WHITE_LABEL',
  CUSTOM_DOMAIN = 'CUSTOM_DOMAIN',
  WEBHOOKS = 'WEBHOOKS',
  SSO = 'SSO',
  AUDIT_LOGS = 'AUDIT_LOGS',
  CUSTOM_REPORTS = 'CUSTOM_REPORTS',

  // Standalone modules (SUPER_ADMIN only)
  INVESTMENTS = 'INVESTMENTS',
}

export enum InvestmentStatus {
  ACTIVE = 'ACTIVE',
  RECOVERED = 'RECOVERED',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  PAST_DUE = 'PAST_DUE',
  TRIALING = 'TRIALING',
}

export enum CashMovementType {
  IN = 'IN',
  OUT = 'OUT',
}

// Legacy aliases for backward compatibility
export const FrecuenciaPago = PaymentFrequency;
export const EstadoPrestamo = LoanStatus;
export type FrecuenciaPago = PaymentFrequency;
export type EstadoPrestamo = LoanStatus;
