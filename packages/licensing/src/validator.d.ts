import { SignedLicense, LicenseValidationResult } from './types';
export declare class LicenseValidator {
    private publicKey;
    constructor(publicKeyPath: string);
    validate(license: SignedLicense): LicenseValidationResult;
    private isValidPayload;
}
