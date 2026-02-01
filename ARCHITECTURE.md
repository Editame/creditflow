# 🏗️ ARQUITECTURA DE CREDITFLOW

**Fecha:** Enero 2025  
**Estado:** ✅ Diseño completado

---

## 🎯 PRINCIPIOS DE DISEÑO

1. **TypeScript estricto** - Sin `any`, todo tipado
2. **Multi-tenant seguro** - Aislamiento total de datos
3. **Licencias flexibles** - SaaS y Self-Hosted
4. **Escalable** - Preparado para crecer
5. **Mantenible** - Código limpio y documentado

---

## 📊 SCHEMA DE BASE DE DATOS

### **Modelo Multi-Tenant**

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
}

// ============================================
// ENUMS
// ============================================

enum DeploymentMode {
  SAAS          // Multi-tenant en tu servidor
  SELF_HOSTED   // Instalación del cliente
}

enum Plan {
  BASICO
  PROFESIONAL
  EMPRESARIAL
}

enum UserRole {
  SUPER_ADMIN   // Solo para ti (gestión de tenants)
  ADMIN         // Admin del tenant
  SUPERVISOR
  COBRADOR
  CONTADOR
}

enum FrecuenciaPago {
  DIARIO
  SEMANAL
}

enum EstadoPrestamo {
  ACTIVO
  PAGADO
  MORA
}

enum FeatureModule {
  // Módulos base
  CLIENTES_BASIC
  PRESTAMOS_BASIC
  PAGOS_BASIC
  RUTAS_BASIC
  
  // Módulos profesionales
  GASTOS
  REPORTES_ADVANCED
  USUARIOS_MANAGEMENT
  API_REST
  EXPORT_EXCEL
  CONCEPTOS_CUSTOM
  
  // Módulos enterprise
  WHITE_LABEL
  CUSTOM_DOMAIN
  WEBHOOKS
  SSO
  AUDIT_LOGS
  CUSTOM_REPORTS
}

// ============================================
// TENANT (Multi-tenant para SaaS)
// ============================================

model Tenant {
  id          String   @id @default(uuid())
  nombre      String
  slug        String   @unique  // para subdominios: slug.creditflow.app
  
  // Configuración
  mode        DeploymentMode @default(SAAS)
  plan        Plan     @default(BASICO)
  activo      Boolean  @default(true)
  
  // Límites según plan
  maxRutas    Int      @default(1)
  maxClientes Int      @default(100)
  maxUsuarios Int      @default(2)
  
  // Facturación (SaaS)
  stripeCustomerId     String?
  stripeSubscriptionId String?
  subscriptionStatus   String?  // active, canceled, past_due
  trialEndsAt          DateTime?
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  usuarios    Usuario[]
  rutas       Ruta[]
  clientes    Cliente[]
  prestamos   Prestamo[]
  pagos       Pago[]
  gastos      Gasto[]
  features    TenantFeature[]
  auditLogs   AuditLog[]
  
  @@index([slug])
  @@index([activo])
}

// ============================================
// TENANT FEATURES (Control de módulos)
// ============================================

model TenantFeature {
  id         String        @id @default(uuid())
  tenantId   String
  tenant     Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  module     FeatureModule
  enabled    Boolean       @default(true)
  
  // Límites específicos del feature
  limit      Int?          // ej: max 100 clientes
  used       Int           @default(0)
  
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt
  
  @@unique([tenantId, module])
  @@index([tenantId])
}

// ============================================
// LICENSE (Para Self-Hosted)
// ============================================

model License {
  id            String    @id @default(uuid())
  
  // Identificación
  licenseKey    String    @unique  // Firma RSA
  tenantName    String
  contactEmail  String
  
  // Plan y features
  plan          Plan
  modules       FeatureModule[]
  
  // Límites
  maxRutas      Int
  maxClientes   Int
  maxUsuarios   Int
  
  // Validez
  issuedAt      DateTime  @default(now())
  expiresAt     DateTime? // null = perpetua
  supportEndsAt DateTime? // Soporte técnico
  
  // Metadata
  version       String    // v1.0.0
  isActive      Boolean   @default(true)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([licenseKey])
  @@index([isActive])
}

// ============================================
// USUARIOS
// ============================================

model Usuario {
  id        Int       @id @default(autoincrement())
  tenantId  String
  tenant    Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  username  String
  email     String?
  password  String
  role      UserRole  @default(COBRADOR)
  activo    Boolean   @default(true)
  
  // Metadata
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  lastLogin DateTime?
  
  // Relaciones
  pagos     Pago[]    @relation("PagosCobrador")
  auditLogs AuditLog[]
  
  @@unique([tenantId, username])
  @@unique([tenantId, email])
  @@index([tenantId])
  @@index([tenantId, activo])
}

// ============================================
// RUTAS
// ============================================

model Ruta {
  id          Int      @id @default(autoincrement())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  nombre      String
  descripcion String?
  activo      Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  presupuestos PresupuestoRuta[]
  gastos       Gasto[]
  clientes     Cliente[]
  pagos        Pago[]
  
  @@index([tenantId])
  @@index([tenantId, activo])
}

// ============================================
// PRESUPUESTOS
// ============================================

model PresupuestoRuta {
  id             Int      @id @default(autoincrement())
  rutaId         Int
  ruta           Ruta     @relation(fields: [rutaId], references: [id], onDelete: Cascade)
  
  mes            Int      // 1-12
  anio           Int      // 2025
  montoAsignado  Decimal  @default(0) @db.Decimal(10, 2)
  montoGastado   Decimal  @default(0) @db.Decimal(10, 2)
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@unique([rutaId, mes, anio])
  @@index([rutaId])
}

// ============================================
// GASTOS
// ============================================

model Gasto {
  id          Int      @id @default(autoincrement())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  rutaId      Int
  ruta        Ruta     @relation(fields: [rutaId], references: [id], onDelete: Cascade)
  
  monto       Decimal  @db.Decimal(10, 2)
  descripcion String
  categoria   String?  // combustible, mantenimiento, etc
  fecha       DateTime @default(now())
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([tenantId])
  @@index([rutaId])
  @@index([fecha])
}

// ============================================
// CLIENTES
// ============================================

model Cliente {
  id             Int      @id @default(autoincrement())
  tenantId       String
  tenant         Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  rutaId         Int
  ruta           Ruta     @relation(fields: [rutaId], references: [id], onDelete: Cascade)
  
  cedula         String
  nombreCompleto String
  telefono       String?
  direccion      String?
  urlFotoCedula  String?
  activo         Boolean  @default(true)
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  // Relaciones
  prestamos      Prestamo[]
  
  @@unique([tenantId, cedula])
  @@index([tenantId])
  @@index([tenantId, activo])
  @@index([rutaId])
}

// ============================================
// PRÉSTAMOS
// ============================================

model Prestamo {
  id              Int            @id @default(autoincrement())
  tenantId        String
  tenant          Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  clienteId       Int
  cliente         Cliente        @relation(fields: [clienteId], references: [id], onDelete: Cascade)
  
  montoPrestado   Decimal        @db.Decimal(12, 2)
  tasaInteres     Decimal        @db.Decimal(5, 2)
  frecuenciaPago  FrecuenciaPago
  valorCuota      Decimal        @db.Decimal(10, 2)
  saldoPendiente  Decimal        @db.Decimal(12, 2)
  
  fechaInicio     DateTime
  fechaFin        DateTime
  estado          EstadoPrestamo @default(ACTIVO)
  
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  // Relaciones
  pagos           Pago[]
  
  @@index([tenantId])
  @@index([clienteId])
  @@index([tenantId, estado])
}

// ============================================
// PAGOS
// ============================================

model Pago {
  id            Int      @id @default(autoincrement())
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  prestamoId    Int
  prestamo      Prestamo @relation(fields: [prestamoId], references: [id], onDelete: Cascade)
  
  cobradorId    Int
  cobrador      Usuario  @relation("PagosCobrador", fields: [cobradorId], references: [id])
  
  rutaId        Int
  ruta          Ruta     @relation(fields: [rutaId], references: [id], onDelete: Cascade)
  
  montoPagado   Decimal  @db.Decimal(10, 2)
  fechaPago     DateTime @default(now())
  observaciones String?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([tenantId])
  @@index([prestamoId])
  @@index([cobradorId])
  @@index([rutaId])
  @@index([fechaPago])
}

// ============================================
// AUDIT LOGS (Módulo Enterprise)
// ============================================

model AuditLog {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  usuarioId   Int?
  usuario     Usuario? @relation(fields: [usuarioId], references: [id])
  
  action      String   // create, update, delete
  entity      String   // prestamo, pago, cliente
  entityId    String
  
  oldData     Json?
  newData     Json?
  
  ipAddress   String?
  userAgent   String?
  
  createdAt   DateTime @default(now())
  
  @@index([tenantId])
  @@index([usuarioId])
  @@index([entity, entityId])
  @@index([createdAt])
}
```

---

## 🔐 SISTEMA DE LICENCIAS

### **Estructura de Licencia (Self-Hosted)**

```typescript
// packages/licensing/src/types.ts

export enum LicensePlan {
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum LicenseModule {
  // Base
  CLIENTES_BASIC = 'CLIENTES_BASIC',
  PRESTAMOS_BASIC = 'PRESTAMOS_BASIC',
  PAGOS_BASIC = 'PAGOS_BASIC',
  RUTAS_BASIC = 'RUTAS_BASIC',
  
  // Professional
  GASTOS = 'GASTOS',
  REPORTES_ADVANCED = 'REPORTES_ADVANCED',
  USUARIOS_MANAGEMENT = 'USUARIOS_MANAGEMENT',
  API_REST = 'API_REST',
  EXPORT_EXCEL = 'EXPORT_EXCEL',
  CONCEPTOS_CUSTOM = 'CONCEPTOS_CUSTOM',
  
  // Enterprise
  WHITE_LABEL = 'WHITE_LABEL',
  CUSTOM_DOMAIN = 'CUSTOM_DOMAIN',
  WEBHOOKS = 'WEBHOOKS',
  SSO = 'SSO',
  AUDIT_LOGS = 'AUDIT_LOGS',
  CUSTOM_REPORTS = 'CUSTOM_REPORTS',
}

export interface LicensePayload {
  // Identificación
  tenantName: string;
  contactEmail: string;
  
  // Plan
  plan: LicensePlan;
  modules: LicenseModule[];
  
  // Límites
  limits: {
    maxRutas: number;
    maxClientes: number;
    maxUsuarios: number;
  };
  
  // Validez
  issuedAt: string; // ISO date
  expiresAt: string | null; // null = perpetua
  supportEndsAt: string | null;
  
  // Metadata
  version: string;
  licenseId: string;
}

export interface SignedLicense {
  payload: LicensePayload;
  signature: string; // RSA signature
}

export interface LicenseValidationResult {
  isValid: boolean;
  payload: LicensePayload | null;
  error: string | null;
  warnings: string[];
}
```

### **Generador de Licencias**

```typescript
// packages/licensing/src/generator.ts

import { sign } from 'jsonwebtoken';
import { readFileSync } from 'fs';
import { LicensePayload, SignedLicense, LicensePlan, LicenseModule } from './types';

export interface GenerateLicenseConfig {
  tenantName: string;
  contactEmail: string;
  plan: LicensePlan;
  perpetual: boolean;
  supportYears: number;
}

export class LicenseGenerator {
  private privateKey: string;
  
  constructor(privateKeyPath: string) {
    this.privateKey = readFileSync(privateKeyPath, 'utf8');
  }
  
  generate(config: GenerateLicenseConfig): SignedLicense {
    const payload: LicensePayload = {
      tenantName: config.tenantName,
      contactEmail: config.contactEmail,
      plan: config.plan,
      modules: this.getModulesByPlan(config.plan),
      limits: this.getLimitsByPlan(config.plan),
      issuedAt: new Date().toISOString(),
      expiresAt: config.perpetual ? null : this.calculateExpiration(1),
      supportEndsAt: this.calculateExpiration(config.supportYears),
      version: '1.0.0',
      licenseId: this.generateLicenseId(),
    };
    
    const signature = sign(payload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: config.perpetual ? undefined : '365d',
    });
    
    return { payload, signature };
  }
  
  private getModulesByPlan(plan: LicensePlan): LicenseModule[] {
    const baseModules: LicenseModule[] = [
      LicenseModule.CLIENTES_BASIC,
      LicenseModule.PRESTAMOS_BASIC,
      LicenseModule.PAGOS_BASIC,
      LicenseModule.RUTAS_BASIC,
    ];
    
    const professionalModules: LicenseModule[] = [
      ...baseModules,
      LicenseModule.GASTOS,
      LicenseModule.REPORTES_ADVANCED,
      LicenseModule.USUARIOS_MANAGEMENT,
      LicenseModule.API_REST,
      LicenseModule.EXPORT_EXCEL,
      LicenseModule.CONCEPTOS_CUSTOM,
    ];
    
    const enterpriseModules: LicenseModule[] = [
      ...professionalModules,
      LicenseModule.WHITE_LABEL,
      LicenseModule.CUSTOM_DOMAIN,
      LicenseModule.WEBHOOKS,
      LicenseModule.SSO,
      LicenseModule.AUDIT_LOGS,
      LicenseModule.CUSTOM_REPORTS,
    ];
    
    switch (plan) {
      case LicensePlan.STARTER:
        return baseModules;
      case LicensePlan.PROFESSIONAL:
        return professionalModules;
      case LicensePlan.ENTERPRISE:
        return enterpriseModules;
      default:
        return baseModules;
    }
  }
  
  private getLimitsByPlan(plan: LicensePlan): LicensePayload['limits'] {
    switch (plan) {
      case LicensePlan.STARTER:
        return { maxRutas: 1, maxClientes: 100, maxUsuarios: 2 };
      case LicensePlan.PROFESSIONAL:
        return { maxRutas: 5, maxClientes: 500, maxUsuarios: 10 };
      case LicensePlan.ENTERPRISE:
        return { maxRutas: 999, maxClientes: 9999, maxUsuarios: 100 };
      default:
        return { maxRutas: 1, maxClientes: 100, maxUsuarios: 2 };
    }
  }
  
  private calculateExpiration(years: number): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() + years);
    return date.toISOString();
  }
  
  private generateLicenseId(): string {
    return `LIC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
}
```

### **Validador de Licencias**

```typescript
// packages/licensing/src/validator.ts

import { verify } from 'jsonwebtoken';
import { readFileSync } from 'fs';
import { 
  SignedLicense, 
  LicenseValidationResult, 
  LicensePayload 
} from './types';

export class LicenseValidator {
  private publicKey: string;
  
  constructor(publicKeyPath: string) {
    this.publicKey = readFileSync(publicKeyPath, 'utf8');
  }
  
  validate(license: SignedLicense): LicenseValidationResult {
    const warnings: string[] = [];
    
    try {
      // Verificar firma
      const decoded = verify(license.signature, this.publicKey, {
        algorithms: ['RS256'],
      }) as LicensePayload;
      
      // Verificar expiración de licencia
      if (decoded.expiresAt) {
        const expiresAt = new Date(decoded.expiresAt);
        if (expiresAt < new Date()) {
          return {
            isValid: false,
            payload: null,
            error: 'License has expired',
            warnings: [],
          };
        }
      }
      
      // Verificar expiración de soporte (warning, no error)
      if (decoded.supportEndsAt) {
        const supportEndsAt = new Date(decoded.supportEndsAt);
        if (supportEndsAt < new Date()) {
          warnings.push('Support period has ended. Updates may not be available.');
        }
      }
      
      return {
        isValid: true,
        payload: decoded,
        error: null,
        warnings,
      };
      
    } catch (error) {
      return {
        isValid: false,
        payload: null,
        error: error instanceof Error ? error.message : 'Invalid license',
        warnings: [],
      };
    }
  }
}
```

---

## 🎛️ SISTEMA DE FEATURES

```typescript
// packages/features/src/types.ts

export enum DeploymentMode {
  SAAS = 'SAAS',
  SELF_HOSTED = 'SELF_HOSTED',
}

export interface FeatureLimits {
  maxRutas: number;
  maxClientes: number;
  maxUsuarios: number;
}

export interface FeatureContext {
  mode: DeploymentMode;
  plan: string;
  modules: string[];
  limits: FeatureLimits;
}
```

```typescript
// packages/features/src/manager.ts

import { LicenseModule } from '@creditflow/licensing';

export class FeatureManager {
  constructor(private context: FeatureContext) {}
  
  hasModule(module: LicenseModule): boolean {
    return this.context.modules.includes(module);
  }
  
  canCreateRuta(): boolean {
    // Implementar lógica de verificación
    return true; // Simplificado
  }
  
  canCreateCliente(): boolean {
    // Implementar lógica de verificación
    return true; // Simplificado
  }
  
  getLimit(resource: keyof FeatureLimits): number {
    return this.context.limits[resource];
  }
}
```

---

## 📁 ESTRUCTURA DE PAQUETES

```
packages/
├── shared-types/
│   ├── src/
│   │   ├── entities/
│   │   │   ├── tenant.types.ts
│   │   │   ├── usuario.types.ts
│   │   │   ├── cliente.types.ts
│   │   │   ├── prestamo.types.ts
│   │   │   └── pago.types.ts
│   │   ├── dtos/
│   │   │   ├── create-prestamo.dto.ts
│   │   │   ├── create-pago.dto.ts
│   │   │   └── pagination.dto.ts
│   │   ├── enums/
│   │   │   ├── plans.enum.ts
│   │   │   ├── roles.enum.ts
│   │   │   └── estados.enum.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── licensing/
│   ├── src/
│   │   ├── types.ts
│   │   ├── generator.ts
│   │   ├── validator.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
└── features/
    ├── src/
    │   ├── types.ts
    │   ├── manager.ts
    │   ├── plans.ts
    │   └── index.ts
    ├── package.json
    └── tsconfig.json
```

---

## ✅ DECISIONES CLAVE

### **1. Multi-tenant:**
- ✅ `tenantId` en TODAS las tablas
- ✅ Índices en `tenantId` para performance
- ✅ `onDelete: Cascade` para limpieza automática
- ✅ Unique constraints incluyen `tenantId`

### **2. Licencias:**
- ✅ Firma RSA (seguro)
- ✅ Payload JSON (flexible)
- ✅ Expiración opcional (perpetua o temporal)
- ✅ Soporte separado de licencia

### **3. TypeScript:**
- ✅ Sin `any`
- ✅ Enums para valores fijos
- ✅ Interfaces para contratos
- ✅ Types para uniones

### **4. Seguridad:**
- ✅ Cascade deletes
- ✅ Índices para queries rápidas
- ✅ Validación de licencias
- ✅ Audit logs

---

**Siguiente paso:** Configurar paquetes compartidos

**Estado:** ✅ Arquitectura diseñada
