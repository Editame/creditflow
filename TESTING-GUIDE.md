# 🧪 GUÍA DE PRUEBAS - CreditFlow

Pasos para probar que el sistema funciona correctamente.

---

## 📋 PRE-REQUISITOS

1. PostgreSQL instalado y corriendo
2. Node.js >= 18 instalado
3. Puertos 3000 y 3001 disponibles

---

## 🚀 PASO 1: Configurar Base de Datos

```bash
# Crear base de datos
createdb creditflow

# O con psql
psql -U postgres
CREATE DATABASE creditflow;
\q
```

---

## 🔧 PASO 2: Configurar Backend

```bash
cd creditflow-api

# Instalar dependencias
npm install

# Compilar paquetes compartidos
cd ../packages/shared-types
npm install
npm run build

cd ../licensing
npm install
npm run build

cd ../features
npm install
npm run build

cd ../../creditflow-api

# Configurar .env
cp .env.example .env

# Editar .env con tu DATABASE_URL:
# DATABASE_URL="postgresql://usuario:password@localhost:5432/creditflow?schema=public"
# JWT_SECRET=tu-secreto-super-seguro-cambialo

# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Iniciar servidor
npm run start:dev
```

**Verificar:** Deberías ver:
```
✅ Database connected
🚀 CreditFlow API running on: http://localhost:3001
📚 Swagger docs: http://localhost:3001/api/docs
```

---

## 🌐 PASO 3: Configurar Frontend

```bash
# En otra terminal
cd creditflow-web

# Instalar dependencias
npm install

# Configurar .env.local
cp .env.example .env.local

# Editar .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:3001

# Iniciar servidor
npm run dev
```

**Verificar:** Deberías ver:
```
✓ Ready in 2s
○ Local: http://localhost:3000
```

---

## ✅ PASO 4: Crear Usuario de Prueba

### Opción A: Con Prisma Studio

```bash
cd creditflow-api
npm run prisma:studio
```

1. Abrir http://localhost:5555
2. Ir a tabla `Tenant`
3. Crear tenant:
   ```
   id: (auto UUID)
   nombre: Empresa Demo
   slug: demo
   plan: BASICO
   activo: true
   ```
4. Copiar el `id` del tenant
5. Ir a tabla `Usuario`
6. Crear usuario:
   ```
   tenantId: (pegar el id del tenant)
   username: admin
   password: $2b$10$... (ver abajo cómo generar)
   role: ADMIN
   activo: true
   ```

### Generar password hasheado:

```bash
node -e "console.log(require('bcrypt').hashSync('admin123', 10))"
```

Copiar el resultado y usarlo como password.

### Opción B: Con SQL directo

```sql
-- Crear tenant
INSERT INTO "Tenant" (id, nombre, slug, plan, activo, "maxRutas", "maxClientes", "maxUsuarios")
VALUES (
  gen_random_uuid(),
  'Empresa Demo',
  'demo',
  'BASICO',
  true,
  1,
  100,
  2
);

-- Obtener el tenant ID
SELECT id FROM "Tenant" WHERE slug = 'demo';

-- Crear usuario (reemplazar TENANT_ID_AQUI con el ID obtenido)
INSERT INTO "Usuario" ("tenantId", username, password, role, activo)
VALUES (
  'TENANT_ID_AQUI',
  'admin',
  '$2b$10$YourHashedPasswordHere',
  'ADMIN',
  true
);
```

---

## 🧪 PASO 5: Probar Login

1. Abrir http://localhost:3000
2. Deberías ser redirigido a `/login`
3. Ingresar:
   - Usuario: `admin`
   - Contraseña: `admin123` (o la que usaste)
4. Click en "Iniciar Sesión"

**Resultado esperado:**
- ✅ Redirige a `/dashboard`
- ✅ Muestra "Bienvenido, admin (ADMIN)"
- ✅ Muestra el Tenant ID
- ✅ Botón de "Cerrar Sesión" funciona

---

## 🔍 PASO 6: Verificar API

### Test 1: Health Check

```bash
curl http://localhost:3001
```

**Esperado:**
```json
{
  "status": "ok",
  "message": "CreditFlow API is running",
  "timestamp": "2025-01-..."
}
```

### Test 2: Login API

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Esperado:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "ADMIN",
      "tenantId": "..."
    }
  }
}
```

### Test 3: Profile (con token)

```bash
# Reemplazar TOKEN con el access_token obtenido
curl http://localhost:3001/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

---

## 📊 PASO 7: Verificar Swagger

1. Abrir http://localhost:3001/api/docs
2. Deberías ver la documentación de la API
3. Probar endpoint `/auth/login`

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Backend:
- [ ] Servidor corriendo en puerto 3001
- [ ] Base de datos conectada
- [ ] Swagger accesible
- [ ] Health check responde
- [ ] Login API funciona

### Frontend:
- [ ] Servidor corriendo en puerto 3000
- [ ] Página de login carga
- [ ] Login funciona
- [ ] Redirige a dashboard
- [ ] Dashboard muestra datos del usuario
- [ ] Logout funciona

### Integración:
- [ ] Frontend se conecta al backend
- [ ] Token se guarda en cookies
- [ ] Interceptor de axios funciona
- [ ] Redirección en 401 funciona

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot connect to database"
```bash
# Verificar que PostgreSQL está corriendo
pg_isready

# Verificar DATABASE_URL en .env
cat creditflow-api/.env | grep DATABASE_URL
```

### Error: "Port 3001 already in use"
```bash
# Matar proceso en puerto 3001
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3001 | xargs kill -9
```

### Error: "Module not found @creditflow/shared-types"
```bash
# Recompilar paquetes
cd packages/shared-types && npm run build
cd ../licensing && npm run build
cd ../features && npm run build
```

### Error: "Invalid credentials"
- Verificar que el usuario existe en la BD
- Verificar que el password está hasheado correctamente
- Verificar que el tenant está activo

---

## 🎉 ÉXITO

Si todos los pasos funcionan:
- ✅ Backend configurado
- ✅ Frontend configurado
- ✅ Base de datos funcionando
- ✅ Autenticación funcionando
- ✅ Multi-tenant funcionando

**¡Listo para empezar a migrar módulos!**

---

## 📝 PRÓXIMOS PASOS

1. Migrar módulo de Rutas
2. Migrar módulo de Clientes
3. Migrar módulo de Préstamos
4. Migrar módulo de Pagos
5. Implementar sistema de licencias
6. Implementar control de features

---

**Fecha:** Enero 2025  
**Versión:** 1.0.0
