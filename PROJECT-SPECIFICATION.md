# 📋 CreditFlow - Especificación Técnica Completa

> **DOCUMENTO MAESTRO**: Esta especificación debe ser respetada en todas las implementaciones. No se permiten atajos que comprometan la funcionalidad existente.

---

## 🎯 Visión General del Proyecto

**CreditFlow** es un sistema completo de gestión de microcréditos por rutas con soporte para **SaaS Multi-Tenant** y **Self-Hosted con Licencias**. El proyecto está basado en un sistema funcional para una sola empresa que se adaptó para ser multi-tenant.

### Arquitectura Tecnológica

- **Backend**: NestJS + Prisma ORM + PostgreSQL + JWT
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Packages**: Monorepo con tipos compartidos, licencias y features
- **Deployment**: SaaS Multi-Tenant + Self-Hosted con licencias RSA

---

## 🗄️ Estructura de Base de Datos

### Entidades Principales

#### **Tenant** (Multi-tenancy)
```sql
- id: string (UUID)
- name: string
- slug: string (unique)
- mode: DeploymentMode (SAAS | SELF_HOSTED)
- plan: Plan (BASIC | PROFESSIONAL | ENTERPRISE)
- maxRoutes, maxClients, maxUsers: int
- subscriptionStatus, trialEndsAt
```

#### **User** (Usuarios del sistema)
```sql
- id: int (autoincrement)
- tenantId: string (FK)
- username: string
- email: string
- password: string (hashed)
- role: UserRole (SUPER_ADMIN | ADMIN | SUPERVISOR | COLLECTOR | ACCOUNTANT)
- active: boolean
```

#### **Route** (Rutas de cobranza)
```sql
- id: int (autoincrement)
- tenantId: string (FK)
- name: string
- description: string
- active: boolean
```

#### **Client** (Clientes)
```sql
- id: int (autoincrement)
- tenantId: string (FK)
- routeId: int (FK)
- idNumber: string (unique per tenant)
- fullName: string
- phone, address: string
- idPhotoUrl: string
- active: boolean
- blocked: boolean
- blockReason: string
```

#### **Loan** (Préstamos) - **ENTIDAD CORE**
```sql
- id: int (autoincrement)
- tenantId: string (FK)
- clientId: int (FK)
- loanAmount: Decimal(12,2)           # Monto del préstamo
- receivedAmount: Decimal(12,2)       # Monto recibido (después descuentos)
- totalDiscounts: Decimal(12,2)       # Total descuentos aplicados
- totalCosts: Decimal(12,2)           # Total costos aplicados
- disbursedAmount: Decimal(12,2)      # Monto desembolsado (recibido + costos)
- interestRate: Decimal(5,2)          # Tasa de interés %
- paymentFrequency: PaymentFrequency  # DAILY | WEEKLY
- installmentValue: Decimal(10,2)     # Valor de la cuota
- pendingBalance: Decimal(12,2)       # Saldo pendiente
- disbursementDate: DateTime          # Fecha de desembolso
- collectionStartDate: DateTime       # Fecha inicio cobro
- endDate: DateTime                   # Fecha fin calculada
- originalEndDate: DateTime           # Fecha fin original (para refinanciamientos)
- status: LoanStatus                  # ACTIVE | PAID | OVERDUE
- createdById: int (FK User)
```

#### **Refinancing** (Refinanciamientos) - **FUNCIONALIDAD CLAVE**
```sql
- id: int (autoincrement)
- tenantId: string (FK)
- previousLoanId: int (FK Loan)       # Préstamo anterior
- newLoanId: int (FK Loan)            # Nuevo préstamo
- previousPendingBalance: Decimal(12,2) # Saldo pendiente anterior
- newAmount: Decimal(12,2)            # Nuevo monto
- deliveredAmount: Decimal(12,2)      # Monto entregado al cliente
- refinancingReason: string           # Motivo del refinanciamiento
- refinancingDate: DateTime
- createdById: int (FK User)
```

#### **Payment** (Pagos)
```sql
- id: int (autoincrement)
- tenantId: string (FK)
- loanId: int (FK)
- collectorId: int (FK User)
- routeId: int (FK)
- amountPaid: Decimal(10,2)
- paidBy: PaidBy (CLIENT | COLLECTOR)
- paymentDate: DateTime
- notes: string
```

#### **ChargeConcept** (Conceptos de Cobro)
```sql
- id: int (autoincrement)
- tenantId: string (FK)
- name: string
- percentage: Decimal(5,2)
- type: ConceptType (DISCOUNT | COST)
- isCalculated: boolean
- active: boolean
```

#### **LoanDiscount** y **LoanCost** (Descuentos y Costos por Préstamo)
```sql
- loanId: int (FK)
- conceptId: int (FK)
- discountAmount/costAmount: Decimal(12,2)
- percentage: Decimal(5,2)
```

#### **Expense** (Gastos)
```sql
- id: int (autoincrement)
- tenantId: string (FK)
- routeId: int (FK)
- amount: Decimal(10,2)
- description: string
- category: string
- date: DateTime
```

---

## 🔧 Funcionalidades Implementadas y Validadas

### ✅ **Sistema Multi-Tenant**
- **Estado**: FUNCIONAL
- **Validación**: Aislamiento completo de datos por tenant
- **Features**: Planes, límites configurables, control de features

### ✅ **Autenticación y Usuarios**
- **Estado**: FUNCIONAL
- **Validación**: JWT, roles, permisos granulares
- **Roles**: SUPER_ADMIN, ADMIN, SUPERVISOR, COLLECTOR, ACCOUNTANT

### ✅ **Gestión de Rutas**
- **Estado**: FUNCIONAL
- **Validación**: CRUD completo, presupuestos mensuales

### ✅ **Gestión de Clientes**
- **Estado**: FUNCIONAL
- **Validación**: CRUD completo, asignación a rutas, bloqueo

### ✅ **Sistema de Préstamos (Core)**
- **Estado**: FUNCIONAL
- **Validación**: 
  - ✅ Creación con conceptos de descuento y costo
  - ✅ Cálculo automático de cuotas y fechas
  - ✅ Estados automáticos (ACTIVE, PAID, OVERDUE)
  - ✅ Frecuencia DAILY/WEEKLY
  - ✅ Modelo de refinanciamiento en BD

### ✅ **Sistema de Pagos**
- **Estado**: FUNCIONAL
- **Validación**: Registro por cobrador, actualización de saldos

### ✅ **Control de Gastos**
- **Estado**: FUNCIONAL
- **Validación**: Gastos por ruta, categorías, presupuestos

### ✅ **Dashboard y Reportes Básicos**
- **Estado**: FUNCIONAL
- **Validación**: Métricas principales, filtros por fecha

### ✅ **Sistema de Licencias**
- **Estado**: FUNCIONAL
- **Validación**: Licencias RSA, validación de módulos

---

## 🚧 Funcionalidades Pendientes de Implementación

### ❌ **Refinanciamiento de Préstamos** - **PRIORIDAD ALTA**
- **Frontend**: ✅ IMPLEMENTADO (página completa)
- **Backend**: ❌ FALTA IMPLEMENTAR
- **Modelo BD**: ✅ EXISTE
- **Requerimiento**: Endpoint POST /prestamos/:id/refinanciar

#### Lógica de Refinanciamiento Requerida:
1. **Validaciones**:
   - Préstamo anterior debe existir y estar ACTIVE
   - Nuevo monto > saldo pendiente anterior
   - Cliente debe estar activo
   - Usuario debe tener permisos

2. **Proceso**:
   - Marcar préstamo anterior como PAID
   - Crear nuevo préstamo con monto mayor
   - Crear registro en tabla Refinancing
   - Calcular monto entregado = nuevo monto - saldo pendiente - descuentos + costos

3. **Cálculos**:
   - `deliveredAmount = newAmount - previousPendingBalance - totalDiscounts + totalCosts`
   - Aplicar conceptos de descuento y costo al nuevo préstamo
   - Recalcular fechas y cuotas

### ❌ **Cobranza del Día** - **PRIORIDAD ALTA**
- **Estado**: NO IMPLEMENTADO
- **Requerimiento**: Vista para cobradores con préstamos del día
- **Funcionalidad**: 
  - Filtrar préstamos por ruta y fecha
  - Mostrar clientes con cuotas vencidas
  - Registro rápido de pagos

### ❌ **Exportación a Excel** - **PRIORIDAD MEDIA**
- **Estado**: NO IMPLEMENTADO
- **Requerimiento**: Exportar reportes y listados
- **Scope**: Clientes, préstamos, pagos, gastos

### ❌ **API REST Completa** - **PRIORIDAD MEDIA**
- **Estado**: PARCIAL
- **Requerimiento**: Documentación Swagger completa
- **Scope**: Todos los endpoints documentados

### ❌ **Webhooks** - **PRIORIDAD BAJA**
- **Estado**: NO IMPLEMENTADO
- **Requerimiento**: Notificaciones a sistemas externos
- **Eventos**: Nuevo préstamo, pago recibido, préstamo vencido

---

## 🎯 Reglas de Negocio Críticas

### **Préstamos**
1. **Cálculo de Interés**: `totalAmount = loanAmount * (1 + interestRate/100)`
2. **Descuentos**: Se restan del `loanAmount` → `receivedAmount = loanAmount - totalDiscounts`
3. **Costos**: Se suman al desembolso → `disbursedAmount = receivedAmount + totalCosts`
4. **Cuotas**: Se calculan sobre `totalAmount` → `installmentValue = totalAmount / numPeriods`
5. **Saldo**: Se actualiza con cada pago → `pendingBalance -= amountPaid`

### **Refinanciamiento**
1. **Condición**: `newAmount > previousPendingBalance`
2. **Entrega**: `deliveredAmount = newAmount - previousPendingBalance - discounts + costs`
3. **Estado**: Préstamo anterior → PAID, Nuevo préstamo → ACTIVE
4. **Fechas**: Se recalculan desde fecha de refinanciamiento

### **Estados de Préstamo**
1. **ACTIVE**: `pendingBalance > 0` y no vencido
2. **PAID**: `pendingBalance <= 0`
3. **OVERDUE**: `pendingBalance > 0` y cuotas atrasadas

### **Multi-Tenant**
1. **Aislamiento**: Todos los datos filtrados por `tenantId`
2. **Límites**: Validar antes de crear (rutas, clientes, usuarios)
3. **Features**: Validar permisos por plan antes de ejecutar

---

## 🔒 Principios de Desarrollo

### **Integridad de Datos**
- ✅ Todas las operaciones deben mantener consistencia
- ✅ Transacciones para operaciones complejas
- ✅ Validaciones en backend y frontend
- ✅ Rollback en caso de errores

### **Seguridad**
- ✅ Autenticación JWT obligatoria
- ✅ Autorización por roles y permisos
- ✅ Aislamiento de datos por tenant
- ✅ Validación de entrada en todos los endpoints

### **Compatibilidad**
- ✅ No romper funcionalidades existentes
- ✅ Mantener contratos de API existentes
- ✅ Migrar datos si es necesario
- ✅ Pruebas de regresión

### **Calidad de Código**
- ✅ TypeScript estricto
- ✅ Manejo de errores consistente
- ✅ Logging apropiado
- ✅ Documentación de APIs

---

## 📋 Plan de Implementación

### **Fase 1: Refinanciamiento (CRÍTICO)**
1. Implementar endpoint POST /prestamos/:id/refinanciar
2. Validar lógica de negocio
3. Probar integración con frontend existente
4. Validar cálculos y estados

### **Fase 2: Cobranza del Día**
1. Crear endpoint GET /cobranza/dia
2. Implementar filtros por ruta y fecha
3. Crear vista en frontend
4. Integrar con sistema de pagos

### **Fase 3: Mejoras y Features Avanzadas**
1. Exportación a Excel
2. API REST completa
3. Webhooks
4. Reportes avanzados

---

## ✅ Criterios de Aceptación

### **Para cada funcionalidad implementada**:
1. ✅ **Funciona correctamente** según especificación
2. ✅ **No rompe funcionalidades existentes**
3. ✅ **Mantiene integridad de datos**
4. ✅ **Respeta reglas de negocio**
5. ✅ **Incluye validaciones apropiadas**
6. ✅ **Maneja errores correctamente**
7. ✅ **Es compatible con multi-tenant**
8. ✅ **Incluye logging apropiado**

---

## 🚨 Restricciones Críticas

### **PROHIBIDO**:
- ❌ Modificar lógica existente sin validación completa
- ❌ Romper aislamiento de datos entre tenants
- ❌ Implementar atajos que comprometan integridad
- ❌ Cambiar contratos de API sin migración
- ❌ Omitir validaciones de seguridad
- ❌ Implementar sin pruebas de regresión

### **OBLIGATORIO**:
- ✅ Validar todas las funcionalidades existentes después de cambios
- ✅ Mantener consistencia en cálculos financieros
- ✅ Preservar integridad referencial
- ✅ Documentar cambios significativos
- ✅ Seguir patrones arquitectónicos existentes

---

**Versión**: 1.0  
**Fecha**: Enero 2025  
**Estado**: DOCUMENTO MAESTRO - NO MODIFICAR SIN APROBACIÓN

---

> **NOTA IMPORTANTE**: Este documento debe ser consultado antes de cualquier implementación. Cualquier desviación debe ser justificada y documentada.