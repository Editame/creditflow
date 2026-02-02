export declare enum DeploymentMode {
    SAAS = "SAAS",
    SELF_HOSTED = "SELF_HOSTED"
}
export declare enum Plan {
    BASIC = "BASIC",
    PROFESSIONAL = "PROFESSIONAL",
    ENTERPRISE = "ENTERPRISE"
}
export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    SUPERVISOR = "SUPERVISOR",
    COLLECTOR = "COLLECTOR",
    ACCOUNTANT = "ACCOUNTANT"
}
export declare enum PaymentFrequency {
    DAILY = "DAILY",
    WEEKLY = "WEEKLY"
}
export declare enum LoanStatus {
    ACTIVE = "ACTIVE",
    PAID = "PAID",
    OVERDUE = "OVERDUE"
}
export declare enum FeatureModule {
    CLIENTS_BASIC = "CLIENTS_BASIC",
    LOANS_BASIC = "LOANS_BASIC",
    PAYMENTS_BASIC = "PAYMENTS_BASIC",
    ROUTES_BASIC = "ROUTES_BASIC",
    EXPENSES = "EXPENSES",
    REPORTS_ADVANCED = "REPORTS_ADVANCED",
    USERS_MANAGEMENT = "USERS_MANAGEMENT",
    API_REST = "API_REST",
    EXPORT_EXCEL = "EXPORT_EXCEL",
    CUSTOM_CONCEPTS = "CUSTOM_CONCEPTS",
    WHITE_LABEL = "WHITE_LABEL",
    CUSTOM_DOMAIN = "CUSTOM_DOMAIN",
    WEBHOOKS = "WEBHOOKS",
    SSO = "SSO",
    AUDIT_LOGS = "AUDIT_LOGS",
    CUSTOM_REPORTS = "CUSTOM_REPORTS"
}
export declare enum SubscriptionStatus {
    ACTIVE = "ACTIVE",
    CANCELED = "CANCELED",
    PAST_DUE = "PAST_DUE",
    TRIALING = "TRIALING"
}
export declare const FrecuenciaPago: typeof PaymentFrequency;
export declare const EstadoPrestamo: typeof LoanStatus;
export type FrecuenciaPago = PaymentFrequency;
export type EstadoPrestamo = LoanStatus;
