import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LicenseValidator } from '@creditflow/licensing';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LicenseService {
  private validator: LicenseValidator;
  private licenseData: Record<string, unknown> | null = null;

  constructor() {
    const publicKeyPath = path.join(process.cwd(), 'keys', 'public.pem');
    const publicKey = fs.readFileSync(publicKeyPath, 'utf-8');
    this.validator = new LicenseValidator(publicKey);
    this.loadLicense();
  }

  private loadLicense() {
    try {
      const licensePath = path.join(process.cwd(), 'license.json');
      if (fs.existsSync(licensePath)) {
        const licenseContent = fs.readFileSync(licensePath, 'utf-8');
        const license = JSON.parse(licenseContent);
        
        if (this.validator.validate(license)) {
          this.licenseData = license;
        }
      }
    } catch (error) {
      console.error('Error loading license:', error);
    }
  }

  validateLicense(): boolean {
    if (!this.licenseData) {
      throw new UnauthorizedException('No valid license found');
    }
    return true;
  }

  getLicenseInfo() {
    if (!this.licenseData) {
      throw new UnauthorizedException('No valid license found');
    }
    return this.licenseData;
  }

  hasFeature(feature: string): boolean {
    if (!this.licenseData) return false;
    const modules = this.licenseData.modules as string[];
    return modules?.includes(feature) || false;
  }

  isExpired(): boolean {
    if (!this.licenseData) return true;
    const expiresAt = this.licenseData.expiresAt as string;
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }
}
