# 🚀 CreditFlow API

Backend de CreditFlow - Sistema de gestión de microcréditos por rutas.

---

## 📋 Requisitos

- Node.js >= 18
- PostgreSQL >= 14
- npm >= 8

---

## 🔧 Instalación

```bash
# Instalar dependencias
npm install

# Compilar paquetes compartidos
cd ../packages/shared-types && npm install && npm run build
cd ../licensing && npm install && npm run build
cd ../features && npm install && npm run build
cd ../../creditflow-api

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# (Opcional) Seed de datos
npm run prisma:seed
```

---

## 🚀 Ejecución

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

---

## 📚 Documentación API

Una vez iniciado el servidor:
- Swagger: http://localhost:3001/api/docs

---

## 🗄️ Base de Datos

```bash
# Generar cliente Prisma
npm run prisma:generate

# Crear migración
npm run prisma:migrate

# Abrir Prisma Studio
npm run prisma:studio
```

---

## 🔑 Generar Llaves RSA (Self-Hosted)

```bash
# Crear carpeta keys
mkdir keys

# Generar llave privada
openssl genrsa -out keys/private.pem 2048

# Generar llave pública
openssl rsa -in keys/private.pem -outform PEM -pubout -out keys/public.pem
```

**IMPORTANTE:** NO commitear `keys/private.pem`

---

## 🏗️ Estructura

```
src/
├── auth/           # Autenticación y autorización
├── common/         # Utilidades compartidas
├── config/         # Configuración
├── database/       # Prisma service
├── app.module.ts   # Módulo principal
└── main.ts         # Entry point
```

---

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests con coverage
npm run test:cov

# Tests E2E
npm run test:e2e
```

---

## 📝 Notas

- TypeScript estricto (sin `any`)
- Validación automática con class-validator
- Swagger automático
- Multi-tenant ready
- Sistema de licencias integrado
