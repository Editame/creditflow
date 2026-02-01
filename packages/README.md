# 📦 Paquetes Compartidos de CreditFlow

Código compartido entre backend y frontend.

---

## 📁 Estructura

```
packages/
├── shared-types/     # Tipos TypeScript compartidos
├── licensing/        # Sistema de licencias
└── features/         # Control de módulos/features
```

---

## 🔧 Instalación

```bash
# En cada paquete
cd packages/shared-types
npm install
npm run build

cd ../licensing
npm install
npm run build

cd ../features
npm install
npm run build
```

---

## 📚 Uso

### **shared-types**

```typescript
import { 
  Plan, 
  FeatureModule, 
  Usuario, 
  Prestamo,
  CreatePrestamoDto 
} from '@creditflow/shared-types';

const plan: Plan = Plan.PROFESIONAL;
const module: FeatureModule = FeatureModule.GASTOS;
```

### **licensing**

```typescript
import { LicenseGenerator, LicenseValidator } from '@creditflow/licensing';

// Generar licencia
const generator = new LicenseGenerator('./keys/private.pem');
const license = generator.generate({
  tenantName: 'Empresa XYZ',
  contactEmail: 'admin@empresa.com',
  plan: Plan.PROFESIONAL,
  perpetual: true,
  supportYears: 2,
});

// Validar licencia
const validator = new LicenseValidator('./keys/public.pem');
const result = validator.validate(license);

if (result.isValid) {
  console.log('Licencia válida:', result.payload);
} else {
  console.error('Licencia inválida:', result.error);
}
```

### **features**

```typescript
import { FeatureManager } from '@creditflow/features';
import { FeatureModule, Plan } from '@creditflow/shared-types';

const manager = new FeatureManager({
  mode: DeploymentMode.SAAS,
  plan: Plan.PROFESIONAL,
  modules: [
    FeatureModule.CLIENTES_BASIC,
    FeatureModule.GASTOS,
    // ...
  ],
  limits: {
    maxRutas: 5,
    maxClientes: 500,
    maxUsuarios: 10,
  },
});

// Verificar módulo
if (manager.hasModule(FeatureModule.GASTOS)) {
  // Permitir acceso
}

// Verificar límites
const check = manager.canCreate('maxClientes', currentCount);
if (!check.allowed) {
  throw new Error(check.reason);
}
```

---

## 🎯 Características

### **TypeScript Estricto**
- ✅ Sin `any`
- ✅ Strict mode habilitado
- ✅ Todos los tipos exportados

### **Reutilizable**
- ✅ Backend y frontend usan los mismos tipos
- ✅ Menos errores de integración
- ✅ Sincronización automática

### **Mantenible**
- ✅ Un solo lugar para cambios
- ✅ Versionado independiente
- ✅ Fácil de actualizar

---

## 🔑 Generar Llaves RSA

Para el sistema de licencias:

```bash
# Generar llave privada
openssl genrsa -out private.pem 2048

# Generar llave pública
openssl rsa -in private.pem -outform PEM -pubout -out public.pem
```

Guardar en:
- `creditflow-api/keys/private.pem` (NO commitear)
- `creditflow-api/keys/public.pem` (sí commitear)

---

## 📝 Notas

- Los paquetes usan `file:` protocol para desarrollo local
- En producción, publicar a npm privado o usar monorepo tools
- Compilar antes de usar en backend/frontend
