import { SignedLicense, GenerateLicenseConfig } from './types';
export declare class LicenseGenerator {
    private privateKey;
    constructor(privateKeyPath: string);
    generate(config: GenerateLicenseConfig): SignedLicense;
    private getModulesByPlan;
    private getLimitsByPlan;
    private calculateExpiration;
    private generateLicenseId;
}
