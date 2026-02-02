"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseValidator = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const fs_1 = require("fs");
class LicenseValidator {
    publicKey;
    constructor(publicKeyPath) {
        this.publicKey = (0, fs_1.readFileSync)(publicKeyPath, 'utf8');
    }
    validate(license) {
        const warnings = [];
        try {
            const decoded = (0, jsonwebtoken_1.verify)(license.signature, this.publicKey, {
                algorithms: ['RS256'],
            });
            const payload = decoded;
            if (!this.isValidPayload(payload)) {
                return {
                    isValid: false,
                    payload: null,
                    error: 'Invalid license structure',
                    warnings: [],
                };
            }
            if (payload.expiresAt) {
                const expiresAt = new Date(payload.expiresAt);
                if (expiresAt < new Date()) {
                    return {
                        isValid: false,
                        payload: null,
                        error: 'License has expired',
                        warnings: [],
                    };
                }
                const daysUntilExpiration = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                if (daysUntilExpiration <= 30) {
                    warnings.push(`License expires in ${daysUntilExpiration} days`);
                }
            }
            if (payload.supportEndsAt) {
                const supportEndsAt = new Date(payload.supportEndsAt);
                if (supportEndsAt < new Date()) {
                    warnings.push('Support period has ended. Updates may not be available.');
                }
                else {
                    const daysUntilSupportEnds = Math.floor((supportEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    if (daysUntilSupportEnds <= 30) {
                        warnings.push(`Support ends in ${daysUntilSupportEnds} days`);
                    }
                }
            }
            return {
                isValid: true,
                payload,
                error: null,
                warnings,
            };
        }
        catch (error) {
            return {
                isValid: false,
                payload: null,
                error: error instanceof Error ? error.message : 'Invalid license signature',
                warnings: [],
            };
        }
    }
    isValidPayload(payload) {
        if (!payload || typeof payload !== 'object')
            return false;
        const p = payload;
        return (typeof p.licenseId === 'string' &&
            typeof p.tenantName === 'string' &&
            typeof p.contactEmail === 'string' &&
            typeof p.plan === 'string' &&
            Array.isArray(p.modules) &&
            typeof p.limits === 'object' &&
            typeof p.issuedAt === 'string' &&
            typeof p.version === 'string');
    }
}
exports.LicenseValidator = LicenseValidator;
//# sourceMappingURL=validator.js.map