# CreditFlow

Sistema de gestión de microcréditos por rutas con soporte **SaaS Multi-Tenant** y **Self-Hosted con Licencias**.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | NestJS, Prisma, PostgreSQL, JWT |
| Frontend | Next.js 15, Tailwind CSS, TypeScript |
| Packages | `@creditflow/shared-types`, `@creditflow/licensing`, `@creditflow/features` |

---

## Funcionalidades

### Core (Plan Básico)
- Autenticación JWT con roles (SUPER_ADMIN, ADMIN, SUPERVISOR, COLLECTOR, ACCOUNTANT)
- Gestión de clientes con asignación a rutas
- Préstamos con dos modalidades: por interés o por cuotas fijas
- 4 frecuencias de pago: diario, semanal, quincenal, mensual
- Registro de pagos con actualización automática de saldos y estados
- Capital / Caja con movimientos automáticos (desembolsos, cobros, gastos)
- Dashboard con métricas en tiempo real

### Profesional
- Todo lo del Básico
- Gastos por ruta
- Conceptos de cobro configurables (descuentos y costos)
- Refinanciamiento de préstamos
- Gestión de usuarios
- Cajas por ruta (además de global)

### Empresarial
- Todo lo del Profesional
- White Label, dominio personalizado
- Webhooks, SSO, logs de auditoría
- Reportes personalizados
- Cajas ilimitadas

### Multi-Tenant
- Aislamiento completo de datos por tenant
- Límites configurables por plan (rutas, clientes, usuarios)
- Features habilitables por plan con auto-inicialización
- Panel de administración SUPER_ADMIN

### Licencias (Self-Hosted)
- Licencias firmadas con RSA
- Validación de firma digital y expiración
- Módulos habilitables por licencia
- API de generación de licencias

---

## Instalación

### Requisitos
- Node.js 18+
- PostgreSQL (o cuenta Supabase)

### Backend
```bash
cd creditflow-api
npm install
cp .env.example .env  # configurar DATABASE_URL y JWT_SECRET
npx prisma db push
npx prisma db seed
npm run start:dev
```

### Frontend
```bash
cd creditflow-web
npm install
cp .env.local.example .env.local  # configurar NEXT_PUBLIC_API_URL
npm run dev
```

### Packages
```bash
cd packages/shared-types && npm install && npm run build
cd ../licensing && npm install
cd ../features && npm install
```

### Variables de Entorno

**Backend (.env):**
```
DATABASE_URL="postgresql://user:password@localhost:5432/creditflow"
JWT_SECRET="your-secret-key"
PORT=3001
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## API

### Auth
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /auth/login | Login |
| GET | /auth/profile | Perfil con features |

### Clientes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /clientes | Listar (paginado, filtros) |
| POST | /clientes | Crear |
| GET | /clientes/:id | Detalle |
| PATCH | /clientes/:id | Actualizar |
| DELETE | /clientes/:id | Eliminar |

### Préstamos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /prestamos | Listar |
| POST | /prestamos | Crear |
| GET | /prestamos/:id | Detalle |
| DELETE | /prestamos/:id | Eliminar (solo sin pagos) |
| POST | /prestamos/:id/refinanciar | Refinanciar |

### Pagos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /pagos | Listar |
| POST | /pagos | Registrar |

### Gastos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /gastos | Listar |
| POST | /gastos | Crear |
| DELETE | /gastos/:id | Eliminar |

### Capital / Caja
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /cash/registers | Listar cajas |
| POST | /cash/registers | Crear caja |
| GET | /cash/registers/:id/summary | Resumen con stats del día |
| GET | /cash/concepts | Listar conceptos |
| POST | /cash/concepts | Crear concepto |
| GET | /cash/movements | Listar movimientos |
| POST | /cash/movements | Registrar movimiento manual |

### Rutas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /rutas | Listar |
| POST | /rutas | Crear |
| PATCH | /rutas/:id | Actualizar |
| DELETE | /rutas/:id | Eliminar |

### Dashboard
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /dashboard/admin-summary | Métricas generales |

### Admin (SUPER_ADMIN)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /admin/tenants | Listar tenants |
| POST | /admin/tenants | Crear tenant |
| PATCH | /admin/tenants/:id | Actualizar |
| GET | /admin/tenants/:id/features | Features del tenant |
| PUT | /admin/tenants/:id/features | Actualizar features |

---

## Scripts

### Backend
```bash
npm run start:dev        # Desarrollo
npm run build            # Build
npm run start:prod       # Producción
npm run generate:keys    # Generar llaves RSA
npm run generate:license # Generar licencia
```

### Frontend
```bash
npm run dev    # Desarrollo
npm run build  # Build
npm start      # Producción
```

---

## Licencia

MIT

## Autor

**Edilberto Tapias M.** — [@Editame](https://github.com/Editame)
