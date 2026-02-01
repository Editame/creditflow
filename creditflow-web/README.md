# 🌐 CreditFlow Web

Frontend de CreditFlow - Sistema de gestión de microcréditos por rutas.

---

## 📋 Requisitos

- Node.js >= 18
- npm >= 8

---

## 🔧 Instalación

```bash
# Instalar dependencias
npm install

# Compilar paquetes compartidos (si no lo hiciste)
cd ../packages/shared-types && npm install && npm run build
cd ../../creditflow-web

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores
```

---

## 🚀 Ejecución

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm run start
```

La aplicación estará disponible en: http://localhost:3000

---

## 🏗️ Estructura

```
src/
├── app/
│   ├── login/          # Página de login
│   ├── dashboard/      # Dashboard principal
│   ├── layout.tsx      # Layout principal
│   ├── page.tsx        # Página de inicio
│   └── globals.css     # Estilos globales
├── components/         # Componentes reutilizables
├── contexts/
│   └── AuthContext.tsx # Contexto de autenticación
├── hooks/              # Custom hooks
└── lib/
    └── api.ts          # Cliente API
```

---

## 🔐 Autenticación

El sistema usa JWT almacenado en cookies:

```typescript
// Login
await login({ username: 'admin', password: 'password' });

// Logout
logout();

// Usuario actual
const { user } = useAuth();
```

---

## 🎨 Estilos

- Tailwind CSS 4
- Diseño responsive
- Mobile-first

---

## 📝 Notas

- TypeScript estricto (sin `any`)
- Tipos compartidos con backend
- Validación automática
- Manejo de errores centralizado
