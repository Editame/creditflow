"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseGenerator = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const fs_1 = require("fs");
const shared_types_1 = require("@creditflow/shared-types");
class LicenseGenerator {
    privateKey;
    constructor(privateKeyPath) {
        this.privateKey = (0, fs_1.readFileSync)(privateKeyPath, 'utf8');
    }
    generate(config) {
        const payload = {
            licenseId: this.generateLicenseId(),
            tenantName: config.tenantName,
            contactEmail: config.contactEmail,
            plan: config.plan,
            modules: this.getModulesByPlan(config.plan),
            limits: this.getLimitsByPlan(config.plan),
            issuedAt: new Date().toISOString(),
            expiresAt: config.perpetual ? null : this.calculateExpiration(1),
            supportEndsAt: this.calculateExpiration(config.supportYears),
            version: '1.0.0',
        };
        const signature = (0, jsonwebtoken_1.sign)(payload, this.privateKey, {
            algorithm: 'RS256',
        });
        return { payload, signature };
    }
    getModulesByPlan(plan) {
        const baseModules = [
            shared_types_1.FeatureModule.CLIENTS_BASIC,
            shared_types_1.FeatureModule.LOANS_BASIC,
            shared_types_1.FeatureModule.PAYMENTS_BASIC,
            shared_types_1.FeatureModule.ROUTES_BASIC,
        ];
        const professionalModules = [
            ...baseModules,
            shared_types_1.FeatureModule.EXPENSES,
            shared_types_1.FeatureModule.REPORTS_ADVANCED,
            shared_types_1.FeatureModule.USERS_MANAGEMENT,
            shared_types_1.FeatureModule.API_REST,
            shared_types_1.FeatureModule.EXPORT_EXCEL,
            shared_types_1.FeatureModule.CUSTOM_CONCEPTS,
        ];
        const enterpriseModules = [
            ...professionalModules,
            shared_types_1.FeatureModule.WHITE_LABEL,
            shared_types_1.FeatureModule.CUSTOM_DOMAIN,
            shared_types_1.FeatureModule.WEBHOOKS,
            shared_types_1.FeatureModule.SSO,
            shared_types_1.FeatureModule.AUDIT_LOGS,
            shared_types_1.FeatureModule.CUSTOM_REPORTS,
        ];
        const planModules = {
            [shared_types_1.Plan.BASIC]: baseModules,
            [shared_types_1.Plan.PROFESSIONAL]: professionalModules,
            [shared_types_1.Plan.ENTERPRISE]: enterpriseModules,
        };
        return planModules[plan];
    }
    getLimitsByPlan(plan) {
        const planLimits = {
            [shared_types_1.Plan.BASIC]: {
                maxRutas: 1,
                maxClientes: 100,
                maxUsuarios: 2,
            },
            [shared_types_1.Plan.PROFESSIONAL]: {
                maxRutas: 5,
                maxClientes: 500,
                maxUsuarios: 10,
            },
            [shared_types_1.Plan.ENTERPRISE]: {
                maxRutas: 999,
                maxClientes: 9999,
                maxUsuarios: 100,
            },
        };
        return planLimits[plan];
    }
    calculateExpiration(years) {
        const date = new Date();
        date.setFullYear(date.getFullYear() + years);
        return date.toISOString();
    }
    generateLicenseId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 11).toUpperCase();
        return `LIC-${timestamp}-${random}`;
    }
}
exports.LicenseGenerator = LicenseGenerator;
//# sourceMappingURL=generator.js.map