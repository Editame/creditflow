import { verify, JwtPayload } from 'jsonwebtoken';
import { 
  SignedLicense, 
  LicenseValidationResult, 
  LicensePayload 
} from './types';

export class LicenseValidator {
  private publicKey: string;
  
  constructor(publicKey: string) {
    this.publicKey = publicKey;
  }
  
  validate(license: SignedLicense): LicenseValidationResult {
    const warnings: string[] = [];
    
    try {
      // Verificar firma RSA
      const decoded = verify(license.signature, this.publicKey, {
        algorithms: ['RS256'],
      }) as JwtPayload;
      
      // Convertir a LicensePayload
      const payload = decoded as unknown as LicensePayload;
      
      // Validar estructura
      if (!this.isValidPayload(payload)) {
        return {
          isValid: false,
          payload: null,
          error: 'Invalid license structure',
          warnings: [],
        };
      }
      
      // Verificar expiración de licencia
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
        
        // Warning si expira pronto (30 días)
        const daysUntilExpiration = Math.floor(
          (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilExpiration <= 30) {
          warnings.push(`License expires in ${daysUntilExpiration} days`);
        }
      }
      
      // Verificar expiración de soporte
      if (payload.supportEndsAt) {
        const supportEndsAt = new Date(payload.supportEndsAt);
        if (supportEndsAt < new Date()) {
          warnings.push('Support period has ended. Updates may not be available.');
        } else {
          const daysUntilSupportEnds = Math.floor(
            (supportEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
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
      
    } catch (error) {
      return {
        isValid: false,
        payload: null,
        error: error instanceof Error ? error.message : 'Invalid license signature',
        warnings: [],
      };
    }
  }
  
  private isValidPayload(payload: unknown): payload is LicensePayload {
    if (!payload || typeof payload !== 'object') return false;
    
    const p = payload as Record<string, unknown>;
    
    return (
      typeof p.licenseId === 'string' &&
      typeof p.tenantName === 'string' &&
      typeof p.contactEmail === 'string' &&
      typeof p.plan === 'string' &&
      Array.isArray(p.modules) &&
      typeof p.limits === 'object' &&
      typeof p.issuedAt === 'string' &&
      typeof p.version === 'string'
    );
  }
}
