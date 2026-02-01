# 💰 CreditFlow

Sistema de gestión de microcréditos por rutas con arquitectura multi-tenant.

## 🚀 Inicio Rápido

### Requisitos
- Node.js >= 18
- PostgreSQL >= 14
- npm >= 8

### Instalación

```bash
# 1. Clonar repositorio
git clone <tu-repo-url>
cd creditflow

# 2. Instalar dependencias de paquetes compartidos
cd packages/shared-types && npm install && npm run build
cd ../licensing && npm install && npm run build
cd ../features && npm install && npm run build

# 3. Backend
cd ../../creditflow-api
npm install
cp .env.example .env
# Editar .env con tu DATABASE_URL y JWT_SECRET
npm run prisma:generate
npm run prisma:migrate
npm run start:dev

# 4. Frontend (en otra terminal)
cd creditflow-web
npm install
cp .env.example .env.local
# Editar .env.local
npm run dev
```

## 📚 Documentación

- [Modelo de Negocio](./README.md)
- [Guía de Ventas](./SALES-GUIDE.md)
- [Arquitectura](./ARCHITECTURE.md)
- [Guía de Pruebas](./TESTING-GUIDE.md)
- [Estado de Migración](./MIGRATION-STATUS.md)

## 🏗️ Estructura

```
creditflow/
├── packages/          # Paquetes compartidos
├── creditflow-api/    # Backend NestJS
├── creditflow-web/    # Frontend Next.js
└── docs/              # Documentación
```

## 🔑 Características

- ✅ Multi-tenant
- ✅ TypeScript estricto
- ✅ API REST con Swagger
- ✅ Autenticación JWT
- ✅ Transacciones atómicas
- ✅ Paginación
- ✅ Validaciones

## 📊 Stack

- **Backend:** NestJS + Prisma + PostgreSQL
- **Frontend:** Next.js 15 + React 19 + Tailwind CSS 4
- **Lenguaje:** TypeScript 5.7 (strict mode)

## 🌐 URLs

- **API:** http://localhost:3001
- **Swagger:** http://localhost:3001/api/docs
- **Web:** http://localhost:3000

## 📝 Licencia

UNLICENSED - Privado

---

**Versión:** 1.0.0  
**Fecha:** Enero 2025
