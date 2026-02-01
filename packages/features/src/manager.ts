import { FeatureModule } from '@creditflow/shared-types';
import { FeatureContext, FeatureCheckResult, FeatureLimits } from './types';

export class FeatureManager {
  constructor(private context: FeatureContext) {}
  
  /**
   * Verifica si un módulo está habilitado
   */
  hasModule(module: FeatureModule): boolean {
    return this.context.modules.includes(module);
  }
  
  /**
   * Verifica si múltiples módulos están habilitados
   */
  hasModules(modules: FeatureModule[]): boolean {
    return modules.every(module => this.hasModule(module));
  }
  
  /**
   * Verifica si al menos uno de los módulos está habilitado
   */
  hasAnyModule(modules: FeatureModule[]): boolean {
    return modules.some(module => this.hasModule(module));
  }
  
  /**
   * Obtiene el límite de un recurso
   */
  getLimit(resource: keyof FeatureLimits): number {
    return this.context.limits[resource];
  }
  
  /**
   * Verifica si se puede crear un recurso según límites
   */
  canCreate(resource: keyof FeatureLimits, currentCount: number): FeatureCheckResult {
    const limit = this.getLimit(resource);
    
    if (currentCount >= limit) {
      return {
        allowed: false,
        reason: `Limit reached. Maximum ${limit} ${resource} allowed for ${this.context.plan} plan.`,
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * Verifica si un módulo está habilitado y retorna resultado detallado
   */
  checkModule(module: FeatureModule): FeatureCheckResult {
    if (!this.hasModule(module)) {
      return {
        allowed: false,
        reason: `Module ${module} is not available in ${this.context.plan} plan.`,
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * Obtiene todos los módulos habilitados
   */
  getEnabledModules(): FeatureModule[] {
    return [...this.context.modules];
  }
  
  /**
   * Obtiene el plan actual
   */
  getPlan(): string {
    return this.context.plan;
  }
  
  /**
   * Obtiene todos los límites
   */
  getLimits(): FeatureLimits {
    return { ...this.context.limits };
  }
}
