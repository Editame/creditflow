# 🚀 CreditFlow - Sistema de Microcréditos

Sistema completo de gestión de microcréditos por rutas con soporte para **SaaS Multi-Tenant** y **Self-Hosted con Licencias**.

---

## 📋 Características

### ✅ Funcionalidades Core
- 🔐 Autenticación JWT
- 👥 Gestión de Clientes
- 💰 Gestión de Préstamos
- 💵 Registro de Pagos
- 📍 Gestión de Rutas
- 💸 Control de Gastos
- 📊 Reportes y Dashboard
- 📅 Cobranza del Día

### ✅ Multi-Tenant (SaaS)
- 🏢 Aislamiento completo de datos por tenant
- 📦 Planes: Básico, Profesional, Empresarial
- 🔒 Límites configurables por plan
- ✨ Control de features por plan

### ✅ Licencias (Self-Hosted)
- 🔑 Licencias firmadas con RSA
- 📜 Validación de firma digital
- ⏰ Control de expiración
- 🎯 Módulos habilitables por licencia

---

## 🛠️ Stack Tecnológico

### Backend
- **NestJS** - Framework Node.js
- **Prisma** - ORM
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **TypeScript** - Tipado estricto

### Frontend
- **Next.js 15** - Framework React
- **Tailwind CSS** - Estilos
- **TypeScript** - Tipado estricto
- **Axios** - Cliente HTTP

### Packages
- **@creditflow/shared-types** - Tipos compartidos
- **@creditflow/licensing** - Sistema de licencias
- **@creditflow/features** - Gestión de features

---

## 📦 Instalación

### 1. Clonar Repositorio
```bash
git clone https://github.com/Editame/creditflow.git
cd creditflow
```

### 2. Instalar Dependencias

**Backend:**
```bash
cd creditflow-api
npm install
```

**Frontend:**
```bash
cd creditflow-web
npm install
```

**Packages:**
```bash
cd packages/shared-types && npm install
cd ../licensing && npm install
cd ../features && npm install
```

### 3. Configurar Variables de Entorno

**Backend (.env):**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/creditflow"
JWT_SECRET="your-secret-key-here"
PORT=3001
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Configurar Base de Datos
```bash
cd creditflow-api
npx prisma migrate dev
npx prisma db seed
```

---

## 🚀 Ejecución

### Desarrollo

**Backend:**
```bash
cd creditflow-api
npm run start:dev
```

**Frontend:**
```bash
cd creditflow-web
npm run dev
```

### Producción

**Backend:**
```bash
cd creditflow-api
npm run build
npm run start:prod
```

**Frontend:**
```bash
cd creditflow-web
npm run build
npm start
```

---

## 🔑 Sistema de Licencias (Self-Hosted)

### 1. Generar Llaves RSA
```bash
cd creditflow-api
npm run generate:keys
```

Esto crea:
- `keys/private.pem` - **MANTENER SECRETA**
- `keys/public.pem` - Incluir en distribución

### 2. Generar Licencia para Cliente
```bash
npm run generate:license
```

Editar `scripts/generate-license.ts` con datos del cliente:
```typescript
const licenseData = {
  tenantName: 'Cliente XYZ',
  contactEmail: 'cliente@example.com',
  plan: 'PROFESIONAL',
  modules: ['CLIENTES_BASIC', 'PRESTAMOS_BASIC', ...],
  maxRutas: 10,
  maxClientes: 1000,
  maxUsuarios: 5,
  expiresAt: new Date('2026-01-20'),
  supportEndsAt: new Date('2026-01-20'),
  version: '1.0.0',
};
```

### 3. Distribuir Licencia
Enviar `license-demo.json` al cliente. Cliente debe colocar en raíz del proyecto como `license.json`.

---

## 🏢 Multi-Tenant (SaaS)

### Crear Tenant
```bash
POST /tenants
{
  "nombre": "Empresa ABC",
  "slug": "empresa-abc",
  "plan": "PROFESIONAL",
  "maxRutas": 10,
  "maxClientes": 1000,
  "maxUsuarios": 5
}
```

### Verificar Límites
```bash
GET /tenants/:id/limits
```

Respuesta:
```json
{
  "usuarios": { "current": 2, "max": 5, "available": 3 },
  "clientes": { "current": 150, "max": 1000, "available": 850 },
  "rutas": { "current": 3, "max": 10, "available": 7 }
}
```

---

## 📚 Documentación API

### Endpoints Principales

**Auth:**
- `POST /auth/login` - Iniciar sesión
- `GET /auth/profile` - Obtener perfil

**Tenants:**
- `GET /tenants` - Listar tenants
- `POST /tenants` - Crear tenant
- `GET /tenants/:id/limits` - Verificar límites

**Rutas:**
- `GET /rutas` - Listar rutas
- `POST /rutas` - Crear ruta
- `PATCH /rutas/:id` - Actualizar ruta

**Clientes:**
- `GET /clientes` - Listar clientes
- `POST /clientes` - Crear cliente
- `PATCH /clientes/:id` - Actualizar cliente

**Préstamos:**
- `GET /prestamos` - Listar préstamos
- `POST /prestamos` - Crear préstamo

**Pagos:**
- `GET /pagos` - Listar pagos
- `POST /pagos` - Registrar pago

**Gastos:**
- `GET /gastos` - Listar gastos
- `POST /gastos` - Crear gasto

---

## 🎨 Planes y Features

### Plan Básico
- ✅ Clientes básicos
- ✅ Préstamos básicos
- ✅ Pagos básicos
- ✅ Rutas básicas
- ❌ Reportes avanzados
- ❌ API REST
- ❌ Exportar Excel

### Plan Profesional
- ✅ Todo lo del Básico
- ✅ Gastos
- ✅ Reportes avanzados
- ✅ Gestión de usuarios
- ✅ API REST
- ✅ Exportar Excel
- ❌ White Label

### Plan Empresarial
- ✅ Todo lo del Profesional
- ✅ White Label
- ✅ Dominio personalizado
- ✅ Webhooks
- ✅ SSO
- ✅ Logs de auditoría
- ✅ Reportes personalizados

---

## 🔒 Seguridad

- ✅ Autenticación JWT
- ✅ Aislamiento de datos por tenant
- ✅ Validación de entrada
- ✅ Licencias firmadas digitalmente
- ✅ HTTPS en producción
- ✅ Variables de entorno

---

## 📝 Scripts Disponibles

### Backend
```bash
npm run start:dev      # Desarrollo
npm run build          # Build producción
npm run start:prod     # Producción
npm run generate:keys  # Generar llaves RSA
npm run generate:license # Generar licencia
```

### Frontend
```bash
npm run dev           # Desarrollo
npm run build         # Build producción
npm start             # Producción
npm run lint          # Linter
```

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

---

## 📄 Licencia

Este proyecto está bajo licencia MIT.

---

## 👨‍💻 Autor

**Edilberto Tapias M.**
- Email: betoben1442@gmail.com
- GitHub: [@Editame](https://github.com/Editame)

---

## 🙏 Agradecimientos

- NestJS Team
- Next.js Team
- Prisma Team
- Comunidad Open Source

---

**Versión:** 1.0.0  
**Última actualización:** Enero 2025
