// Enums compartidos entre backend y frontend

export enum DeploymentMode {
  SAAS = 'SAAS',
  SELF_HOSTED = 'SELF_HOSTED',
}

export enum Plan {
  BASICO = 'BASICO',
  PROFESIONAL = 'PROFESIONAL',
  EMPRESARIAL = 'EMPRESARIAL',
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  COBRADOR = 'COBRADOR',
  CONTADOR = 'CONTADOR',
}

export enum FrecuenciaPago {
  DIARIO = 'DIARIO',
  SEMANAL = 'SEMANAL',
}

export enum EstadoPrestamo {
  ACTIVO = 'ACTIVO',
  PAGADO = 'PAGADO',
  MORA = 'MORA',
}

export enum FeatureModule {
  // Módulos base
  CLIENTES_BASIC = 'CLIENTES_BASIC',
  PRESTAMOS_BASIC = 'PRESTAMOS_BASIC',
  PAGOS_BASIC = 'PAGOS_BASIC',
  RUTAS_BASIC = 'RUTAS_BASIC',
  
  // Módulos profesionales
  GASTOS = 'GASTOS',
  REPORTES_ADVANCED = 'REPORTES_ADVANCED',
  USUARIOS_MANAGEMENT = 'USUARIOS_MANAGEMENT',
  API_REST = 'API_REST',
  EXPORT_EXCEL = 'EXPORT_EXCEL',
  CONCEPTOS_CUSTOM = 'CONCEPTOS_CUSTOM',
  
  // Módulos enterprise
  WHITE_LABEL = 'WHITE_LABEL',
  CUSTOM_DOMAIN = 'CUSTOM_DOMAIN',
  WEBHOOKS = 'WEBHOOKS',
  SSO = 'SSO',
  AUDIT_LOGS = 'AUDIT_LOGS',
  CUSTOM_REPORTS = 'CUSTOM_REPORTS',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  PAST_DUE = 'PAST_DUE',
  TRIALING = 'TRIALING',
}
