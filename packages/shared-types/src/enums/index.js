"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstadoPrestamo = exports.FrecuenciaPago = exports.SubscriptionStatus = exports.FeatureModule = exports.LoanStatus = exports.PaymentFrequency = exports.UserRole = exports.Plan = exports.DeploymentMode = void 0;
var DeploymentMode;
(function (DeploymentMode) {
    DeploymentMode["SAAS"] = "SAAS";
    DeploymentMode["SELF_HOSTED"] = "SELF_HOSTED";
})(DeploymentMode || (exports.DeploymentMode = DeploymentMode = {}));
var Plan;
(function (Plan) {
    Plan["BASIC"] = "BASIC";
    Plan["PROFESSIONAL"] = "PROFESSIONAL";
    Plan["ENTERPRISE"] = "ENTERPRISE";
})(Plan || (exports.Plan = Plan = {}));
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["SUPERVISOR"] = "SUPERVISOR";
    UserRole["COLLECTOR"] = "COLLECTOR";
    UserRole["ACCOUNTANT"] = "ACCOUNTANT";
})(UserRole || (exports.UserRole = UserRole = {}));
var PaymentFrequency;
(function (PaymentFrequency) {
    PaymentFrequency["DAILY"] = "DAILY";
    PaymentFrequency["WEEKLY"] = "WEEKLY";
})(PaymentFrequency || (exports.PaymentFrequency = PaymentFrequency = {}));
var LoanStatus;
(function (LoanStatus) {
    LoanStatus["ACTIVE"] = "ACTIVE";
    LoanStatus["PAID"] = "PAID";
    LoanStatus["OVERDUE"] = "OVERDUE";
})(LoanStatus || (exports.LoanStatus = LoanStatus = {}));
var FeatureModule;
(function (FeatureModule) {
    FeatureModule["CLIENTS_BASIC"] = "CLIENTS_BASIC";
    FeatureModule["LOANS_BASIC"] = "LOANS_BASIC";
    FeatureModule["PAYMENTS_BASIC"] = "PAYMENTS_BASIC";
    FeatureModule["ROUTES_BASIC"] = "ROUTES_BASIC";
    FeatureModule["EXPENSES"] = "EXPENSES";
    FeatureModule["REPORTS_ADVANCED"] = "REPORTS_ADVANCED";
    FeatureModule["USERS_MANAGEMENT"] = "USERS_MANAGEMENT";
    FeatureModule["API_REST"] = "API_REST";
    FeatureModule["EXPORT_EXCEL"] = "EXPORT_EXCEL";
    FeatureModule["CUSTOM_CONCEPTS"] = "CUSTOM_CONCEPTS";
    FeatureModule["WHITE_LABEL"] = "WHITE_LABEL";
    FeatureModule["CUSTOM_DOMAIN"] = "CUSTOM_DOMAIN";
    FeatureModule["WEBHOOKS"] = "WEBHOOKS";
    FeatureModule["SSO"] = "SSO";
    FeatureModule["AUDIT_LOGS"] = "AUDIT_LOGS";
    FeatureModule["CUSTOM_REPORTS"] = "CUSTOM_REPORTS";
})(FeatureModule || (exports.FeatureModule = FeatureModule = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["CANCELED"] = "CANCELED";
    SubscriptionStatus["PAST_DUE"] = "PAST_DUE";
    SubscriptionStatus["TRIALING"] = "TRIALING";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
exports.FrecuenciaPago = PaymentFrequency;
exports.EstadoPrestamo = LoanStatus;
//# sourceMappingURL=index.js.map