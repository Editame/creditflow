# 📋 GUÍA: ¿Qué hacer cuando vendes?

---

## 🎯 ESCENARIO 1: Cliente compra SaaS (Pago Mensual)

### **Lo que TÚ haces:**

1. **Cliente se registra** → Creas su cuenta en tu base de datos
   ```sql
   INSERT INTO tenants (nombre, slug, plan, activo)
   VALUES ('Empresa ABC', 'empresa-abc', 'BASICO', true);
   ```

2. **Asignas su plan** → Básico/Profesional/Empresarial
   - Define qué módulos puede usar
   - Define límites (rutas, clientes, usuarios)

3. **Cliente accede** → `empresa-abc.creditflow.app`
   - Todo en TU servidor
   - TU base de datos (aislado por tenantId)
   - TU dominio

4. **Cobro automático** → Stripe/PayPal cada mes

### **Lo que el cliente hace:**
- ✅ Solo usar el sistema
- ✅ Pagar mensualmente
- ❌ NO instala nada
- ❌ NO maneja servidor
- ❌ NO maneja base de datos

### **Ventajas para ti:**
- ✅ Control total
- ✅ Ingresos recurrentes
- ✅ Actualizas una vez, todos se benefician
- ✅ Menos soporte técnico

---

## 🎯 ESCENARIO 2: Cliente compra Licencia Única

### **Lo que TÚ haces:**

1. **Cliente paga** → $1,999 / $4,999 / $9,999

2. **Generas licencia única** para ese cliente
   ```bash
   npm run generate-license -- \
     --name "Empresa XYZ" \
     --plan "PROFESSIONAL" \
     --modules "all" \
     --expires "2027-01-01"
   ```
   
   Esto crea: `empresa-xyz-license.key`

3. **Le entregas:**
   - ✅ Código compilado (carpeta `dist/`)
   - ✅ Archivo de licencia (`empresa-xyz-license.key`)
   - ✅ Documentación de instalación
   - ✅ Scripts de base de datos
   - ✅ (Si es Enterprise) Código fuente completo

4. **Cliente instala en SU servidor**
   - Vercel (su cuenta)
   - Railway (su cuenta)
   - VPS propio
   - Servidor local

5. **Cliente configura SU base de datos**
   - Supabase (su cuenta)
   - PostgreSQL propio
   - Cualquier DB compatible

### **Lo que el cliente hace:**
- ✅ Instala en su servidor
- ✅ Configura su base de datos
- ✅ Usa su dominio (ejemplo.com)
- ✅ Paga UNA sola vez
- ✅ Maneja su infraestructura

### **Ventajas para ti:**
- ✅ Ingreso grande inmediato
- ✅ Cliente paga su hosting
- ✅ No usas tus recursos
- ✅ Puedes cobrar soporte adicional

---

## 🔑 DIFERENCIAS CLAVE

| Aspecto | SaaS | Licencia Única |
|---------|------|----------------|
| **Hosting** | Tu servidor | Servidor del cliente |
| **Base de datos** | Tu BD (multi-tenant) | BD propia del cliente |
| **Dominio** | cliente.creditflow.app | sudominio.com |
| **Pago** | Mensual recurrente | Una sola vez |
| **Actualizaciones** | Automáticas | Manual (cobras soporte) |
| **Soporte** | Incluido | Cobras aparte |
| **Código fuente** | NO lo ve | Solo en plan Enterprise |
| **Personalización** | Limitada | Total (si tiene código) |

---

## 💡 EJEMPLO REAL: MixterAutos

### **Lo que hiciste:**
1. ✅ Vendiste licencia única
2. ✅ Creaste repo separado para ese cliente
3. ✅ Cliente instaló en Vercel (su cuenta)
4. ✅ Cliente usa Supabase (su cuenta, capa gratis)
5. ✅ Cliente tiene su dominio

### **Problema actual:**
- ❌ Cada cliente = repo nuevo
- ❌ Actualizaciones = copiar código manualmente
- ❌ No controlas features por licencia
- ❌ No puedes vender módulos adicionales fácilmente

### **Con CreditFlow (nuevo sistema):**
- ✅ Un solo código base
- ✅ Sistema de licencias controla features
- ✅ Puedes vender módulos adicionales
- ✅ Cliente instala, pone su licencia, listo
- ✅ Actualizaciones = nuevo release + nueva licencia

---

## 🚀 FLUJO MEJORADO PARA LICENCIA ÚNICA

### **Paso 1: Cliente compra**
```
Cliente: "Quiero licencia Professional"
Tú: "Son $4,999"
Cliente: *paga*
```

### **Paso 2: Generas licencia**
```bash
cd creditflow
npm run generate-license

# Preguntas interactivas:
? Nombre del cliente: Empresa XYZ
? Plan: Professional
? Módulos: Todos excepto White Label
? Duración soporte: 2 años
? Incluir código fuente: No

✅ Licencia generada: empresa-xyz.license
```

### **Paso 3: Entregas paquete**
```
creditflow-professional-v1.0.0.zip
├── creditflow-api/          (compilado)
├── creditflow-web/          (compilado)
├── empresa-xyz.license      (archivo de licencia)
├── INSTALL.md               (guía de instalación)
└── database.sql             (script de BD)
```

### **Paso 4: Cliente instala**
```bash
# Cliente en su servidor:
1. Sube archivos
2. Configura variables de entorno
3. Copia archivo de licencia a /config/license.key
4. Ejecuta migraciones de BD
5. Inicia aplicación
6. Sistema valida licencia automáticamente
```

### **Paso 5: Sistema valida licencia**
```typescript
// Al iniciar la app
const license = await validateLicense('./config/license.key');

if (!license.isValid) {
  throw new Error('Licencia inválida');
}

// Habilita módulos según licencia
enableFeatures(license.modules);
```

---

## 🎯 VENTAJAS DEL NUEVO SISTEMA

### **Para ti:**
1. ✅ Un solo código base (no repos duplicados)
2. ✅ Control de features por licencia
3. ✅ Fácil vender módulos adicionales
4. ✅ Actualizaciones centralizadas
5. ✅ Puedes ofrecer ambos modelos (SaaS + Licencia)

### **Para el cliente:**
1. ✅ Instalación simple
2. ✅ Paga solo lo que necesita
3. ✅ Puede comprar módulos después
4. ✅ Control de sus datos
5. ✅ Flexibilidad de hosting

---

## 📊 RESUMEN

### **SaaS = Tú manejas todo**
- Cliente solo usa
- Tú cobras mensual
- Menos trabajo para cliente
- Ingresos recurrentes para ti

### **Licencia Única = Cliente maneja todo**
- Cliente instala y administra
- Tú cobras una vez (+ soporte opcional)
- Más trabajo para cliente
- Ingreso grande inmediato para ti

### **Ambos modelos usan el MISMO código**
- Solo cambia: dónde corre y cómo se validan features

---

**¿Está claro? ¿Seguimos con la implementación del sistema de licencias?**
