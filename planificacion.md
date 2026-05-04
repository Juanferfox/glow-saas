# Planificación — FM Glow Studio SaaS
## Sistema completo: Login · Booking · Tienda · CMS Admin · Roles

---

## Contexto del proyecto

**Stack:** Next.js 16.2.3 · Supabase · Tailwind CSS 4 · next-intl · shadcn/base-ui  
**Tenant principal:** `fm-glow-studio`  
**URL de prueba:** `https://c02e-181-131-164-77.ngrok-free.app/es?tenant=fm-glow-studio`  
**Modo:** Dev mode (datos en memoria, sin Supabase real)  
**Detección dev:** `process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx")` → true = dev mode  

### ⚠️ Reglas críticas para el modelo ejecutor

1. **Leer AGENTS.md primero.** Next.js 16 tiene cambios breaking. Consultar `node_modules/next/dist/docs/` antes de escribir cualquier código.
2. **Tailwind v4:** No usar `@apply` en CSS. Variables CSS nativas. Sintaxis `--variable` directa.
3. **Dev mode:** Todos los datos son hardcodeados. Nunca llamar Supabase sin verificar que no sea dev mode.
4. **i18n:** Toda string visible al usuario va en `messages/es.json`. Client components usan `useTranslations()`, server components usan `getTranslations()`.
5. **Tenant:** En dev, el slug viene de query param `?tenant=fm-glow-studio`. En headers como `x-tenant-slug`. Leer `lib/tenant.ts` para entender el sistema.
6. **Auth dev:** La sesión dev se guarda en cookie `dev-session` (JSON base64). El hook `useAuth` en `hooks/useAuth.ts` lee esta cookie en dev mode.
7. **No crear componentes UI base nuevos.** Usar los existentes en `components/ui/`.
8. **Preferir editar sobre reescribir.** Solo reescribir si el archivo requiere cambios mayores al 70%.

---

## Estado actual del proyecto

| Área | Estado |
|------|--------|
| Estructura base y multi-tenant | ✅ Completo |
| 32 servicios fm-glow-studio definidos | ✅ En `lib/data/services.ts` |
| Páginas booking, tienda, citas, perfil, puntos | ✅ Existen (parcialmente funcionales) |
| Panel admin con secciones | ✅ Existen (skeleton) |
| Login email/contraseña | ❌ Solo OAuth (Google/Facebook) |
| CMS edición de servicios | ❌ No implementado |
| Dashboard ganancias admin | ❌ No implementado |
| Gestión agenda empleadas por admin | ❌ No implementado |
| Gestión puntos por admin | ❌ No implementado |
| Contador sesiones empleada | ❌ No implementado |
| Productos fm-glow-studio en dev | ❌ No existen |
| Sistema de referidos funcional | ❌ Parcial |

---

## Usuarios de prueba

```javascript
// Definir en: app/api/dev-auth/route.ts
const DEV_USERS = [
  {
    id: "dev-admin-fmglow",
    email: "admin@fmglow.test",
    username: "admin",        // login alternativo por username
    password: "123456789",
    role: "admin",
    full_name: "Admin FM Glow",
    points: 0,
    referral_code: null,
    specialist_id: null,
    tenant_id: "dev-fm-glow-studio",
    avatar_url: null,
  },
  {
    id: "dev-cliente-fmglow",
    email: "cliente@fmglow.test",
    username: "cliente",
    password: "123456789",
    role: "cliente",
    full_name: "Laura Martínez",
    points: 250,
    referral_code: "FMCLI001",
    specialist_id: null,
    tenant_id: "dev-fm-glow-studio",
    avatar_url: null,
  },
  {
    id: "dev-empleada-fmglow",
    email: "empleada@fmglow.test",
    username: "empleada",
    password: "123456789",
    role: "trabajadora",
    full_name: "Ana García",
    points: 0,
    referral_code: null,
    specialist_id: "dev-sp-fmglow-1", // primer specialist de fm-glow-studio
    tenant_id: "dev-fm-glow-studio",
    avatar_url: null,
  },
]
```

---

## Productos de prueba (fm-glow-studio dev mode)

```javascript
// Agregar en: lib/data/products.ts dentro de DEV_PRODUCTS para "dev-fm-glow-studio"
[
  { id: "prod-fmg-1", name: "Sérum Vitamina C", price: 85000, stock: 15, category: "facial", active: true },
  { id: "prod-fmg-2", name: "Crema Hidratante Luxury", price: 120000, stock: 8, category: "facial", active: true },
  { id: "prod-fmg-3", name: "Aceite Corporal Glow", price: 65000, stock: 20, category: "corporal", active: true },
  { id: "prod-fmg-4", name: "Kit Manicure Professional", price: 45000, stock: 12, category: "uñas", active: true },
  { id: "prod-fmg-5", name: "Sérum Pestañas Crecimiento", price: 95000, stock: 6, category: "pestañas", active: true },
  { id: "prod-fmg-6", name: "Mascarilla Capilar Keratina", price: 55000, stock: 10, category: "capilar", active: true },
]
```

---

## Datos mock para dashboard de ganancias

```javascript
// Usar en: app/api/admin/analytics/route.ts
const MOCK_ANALYTICS = {
  today: { services_revenue: 450000, store_revenue: 85000, appointments_count: 6, orders_count: 2 },
  week:  { services_revenue: 2800000, store_revenue: 520000, appointments_count: 38, orders_count: 11 },
  month: { services_revenue: 11500000, store_revenue: 2100000, appointments_count: 152, orders_count: 44 },
  recent_transactions: [
    { type: "service", description: "Limpieza Facial + Hidratación", amount: 80000, client: "Laura M.", date: "hoy 10:30" },
    { type: "store",   description: "Sérum Vitamina C",              amount: 85000, client: "Sofia R.", date: "hoy 09:15" },
    { type: "service", description: "Uñas Semipermanente",           amount: 45000, client: "Ana L.",   date: "ayer 16:00" },
    { type: "store",   description: "Kit Manicure Professional",     amount: 45000, client: "Paula V.", date: "ayer 14:30" },
  ],
}
```

---

## FASE 1 — Sistema de Autenticación Email/Contraseña

**Objetivo:** Que los 3 usuarios puedan hacer login con email (o username) + contraseña.

### 1.1 Extender API dev-auth

**Archivo:** `app/api/dev-auth/route.ts`

Leer el archivo actual. Agregar soporte para `POST` con body `{ identifier, password }` donde `identifier` puede ser email o username.

Lógica:
```typescript
// POST /api/dev-auth
const { identifier, password } = await request.json()
const user = DEV_USERS.find(u => 
  (u.email === identifier || u.username === identifier) && u.password === password
)
if (!user) return Response.json({ error: "Credenciales incorrectas" }, { status: 401 })

// Crear cookie dev-session con el perfil del usuario
const profile = { id: user.id, email: user.email, role: user.role, full_name: user.full_name, ... }
// Guardar en cookie "dev-session" como JSON (ver cómo lo hace el código actual)
// Retornar { success: true, profile, redirectTo: role === "admin" ? "/admin" : "/" }
```

También agregar ruta `DELETE /api/dev-auth` para logout (borrar cookie `dev-session`).

### 1.2 Actualizar página de login

**Archivo:** `app/[locale]/auth/login/page.tsx`

Leer el archivo actual para entender la estructura. Agregar abajo de los botones OAuth (o en lugar de ellos en dev mode) un formulario:

```
[ Campo: Email o usuario    ]
[ Campo: Contraseña (****) ]
[ Botón: Iniciar sesión    ]
```

En dev mode mostrar hint con los 3 usuarios disponibles (collapsable, tipo "Usuarios de prueba ▾"):
```
admin / 123456789 — Acceso total
cliente / 123456789 — Cliente con puntos
empleada / 123456789 — Agenda personal
```

Al submit: llamar `POST /api/dev-auth`, si OK redirigir según rol:
- `admin` → `/${locale}/admin`
- `trabajadora` → `/${locale}/calendario`
- `cliente` → `/${locale}`

Mostrar error si credenciales incorrectas.

### 1.3 Agregar botón de logout

**Archivo:** buscar el componente de perfil o nav donde lógicamente va el logout (probablemente `components/layout/TopBar.tsx` o `components/profile/`).

En dev mode: llamar `DELETE /api/dev-auth` y redirigir al login.

### 1.4 Proteger rutas admin en middleware

**Archivo:** `proxy.ts`

Verificar que el middleware ya redirija `/admin/*` si el usuario no tiene rol `admin`. Si no lo hace, agregar la verificación leyendo la cookie `dev-session`.

---

## FASE 2 — CMS de Servicios (Admin)

**Objetivo:** El admin puede ver, editar precios, agregar y desactivar servicios del tenant.

### 2.1 Estado global de servicios editable en dev mode

**Archivo:** `lib/data/services.ts`

Agregar un Map en memoria que almacene las ediciones durante la sesión:
```typescript
// Solo en dev mode
const editedServices = new Map<string, Partial<ServiceRow>>()

export function updateDevService(id: string, changes: Partial<ServiceRow>) {
  editedServices.set(id, { ...editedServices.get(id), ...changes })
}
```

En la función `getServices()`, aplicar las ediciones del Map sobre los datos base.

### 2.2 API de servicios admin

**Archivo nuevo:** `app/api/admin/servicios/route.ts`

```typescript
// GET /api/admin/servicios — lista servicios del tenant
// PATCH /api/admin/servicios/[id] — actualiza precio, nombre, duración, descripción, active
// POST /api/admin/servicios — crea nuevo servicio
```

Verificar rol admin en todas las rutas. En dev mode: usar el Map de editedServices.

### 2.3 Página de gestión de servicios

**Archivo nuevo:** `app/[locale]/admin/servicios/page.tsx`

Layout:
- Título "Gestión de Servicios"
- Botón "+ Agregar Servicio" (abre modal)
- Filtro por categoría (tabs o select)
- Tabla/lista de servicios con columnas: Nombre · Categoría · Duración · Precio · Estado · Acciones
- Acciones por servicio: [Editar] [Activar/Desactivar]

### 2.4 Componente ServiceEditor (modal de edición)

**Archivo nuevo:** `components/admin/ServiceEditor.tsx`

Modal con formulario:
- Nombre del servicio
- Categoría (select: uñas, pestañas, cejas, labios, capilar, facial, corporal)
- Duración (número en minutos)
- Precio (número en COP)
- Descripción (textarea)
- Activo (toggle)

Al guardar: llamar `PATCH /api/admin/servicios/[id]`, actualizar lista.

### 2.5 Agregar "Servicios" al sidebar admin

**Archivo:** buscar `components/admin/` o el componente de navegación del admin (leer el layout de admin).

Agregar ítem de menú "Servicios" con icono `Scissors` de lucide-react, apuntando a `/${locale}/admin/servicios`.

---

## FASE 3 — CMS de Tienda (Admin)

**Objetivo:** El admin puede editar precios de productos, stock, y agregar nuevos productos.

### 3.1 Agregar productos fm-glow-studio en dev mode

**Archivo:** `lib/data/products.ts`

Leer el archivo actual. Agregar los 6 productos de prueba (definidos arriba) para el tenant `dev-fm-glow-studio`.

También agregar Map editable en memoria igual que servicios:
```typescript
const editedProducts = new Map<string, Partial<ProductRow>>()
export function updateDevProduct(id: string, changes: Partial<ProductRow>) { ... }
```

### 3.2 API de productos admin

**Archivo nuevo:** `app/api/admin/productos/route.ts`

```typescript
// GET /api/admin/productos — lista productos del tenant
// PATCH /api/admin/productos/[id] — actualiza precio, stock, nombre, active
// POST /api/admin/productos — crea nuevo producto
```

Verificar rol admin. En dev mode: usar Map editedProducts.

### 3.3 Extender página de inventario con pestaña de productos

**Archivo:** `app/[locale]/admin/inventario/page.tsx`

Leer el archivo actual. Agregar tabs: "Inventario" (lo que existe) | "Productos de Tienda".

En la pestaña "Productos de Tienda":
- Lista de productos con precio y stock
- Botón editar por producto (modal similar a ServiceEditor)
- Botón "+ Agregar Producto"
- Toggle activo/inactivo

---

## FASE 4 — Dashboard de Ganancias (Admin)

**Objetivo:** El admin ve ingresos de servicios y tienda con métricas diarias/semanales/mensuales.

### 4.1 API de analytics

**Archivo nuevo:** `app/api/admin/analytics/route.ts`

```typescript
// GET /api/admin/analytics?period=today|week|month
// Retorna: { services_revenue, store_revenue, total, appointments_count, orders_count, recent_transactions[] }
// En dev mode: retornar MOCK_ANALYTICS según el period solicitado
```

Verificar rol admin.

### 4.2 Componente GananciasOverview

**Archivo nuevo:** `components/admin/GananciasOverview.tsx`

Layout:
```
[ Hoy ]  [ Esta semana ]  [ Este mes ]   ← tabs selector de período

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Ingresos        │ │ Ingresos        │ │ Total           │
│ Servicios       │ │ Tienda          │ │ General         │
│ $2.800.000      │ │ $520.000        │ │ $3.320.000      │
│ 38 citas        │ │ 11 pedidos      │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘

Últimas transacciones:
[ tipo ] [ descripción ] [ cliente ] [ monto ] [ hora ]
```

Formatear precios en COP: `new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(n)`

### 4.3 Integrar en admin dashboard

**Archivo:** `app/[locale]/admin/page.tsx`

Leer el archivo actual. Agregar `<GananciasOverview />` como sección principal del dashboard, antes o reemplazando cualquier placeholder que exista.

---

## FASE 5 — Gestión de Agenda de Empleadas (Admin)

**Objetivo:** El admin puede ver y modificar el horario semanal de cada empleada.

### 5.1 Extender datos de especialistas con horarios editables

**Archivo:** `lib/data/specialists.ts`

Agregar Map en memoria para horarios editados:
```typescript
const editedSchedules = new Map<string, SpecialistSchedule[]>()
export function updateDevSchedule(specialistId: string, schedules: SpecialistSchedule[]) { ... }
```

Asegurar que la empleada de prueba (`dev-sp-fmglow-1`) tenga un horario inicial definido:
```javascript
// Horario de Ana García (empleada de prueba)
schedules: [
  { day_of_week: 1, start_time: "09:00", end_time: "18:00" }, // Lunes
  { day_of_week: 2, start_time: "09:00", end_time: "18:00" }, // Martes
  { day_of_week: 3, start_time: "09:00", end_time: "18:00" }, // Miércoles
  { day_of_week: 4, start_time: "09:00", end_time: "18:00" }, // Jueves
  { day_of_week: 5, start_time: "09:00", end_time: "16:00" }, // Viernes
]
```

### 5.2 API de horarios admin

**Archivo nuevo:** `app/api/admin/horarios/route.ts`

```typescript
// GET /api/admin/horarios?specialist_id=xxx — obtener horario de una empleada
// PUT /api/admin/horarios — reemplazar horario completo de una empleada
// Body: { specialist_id: string, schedules: { day_of_week: number, start_time: string, end_time: string, active: boolean }[] }
```

Verificar rol admin.

### 5.3 Extender página de agenda admin

**Archivo:** `app/[locale]/admin/agenda/page.tsx`

Leer el archivo actual. Agregar sección "Horarios de Empleadas":

- Select de empleada (listar todas las trabajadoras del tenant)
- Vista semanal con los 7 días
- Por cada día: mostrar hora inicio · hora fin o "Libre"
- Botón editar por día (abre inline editor o modal)
- Botón guardar horario

Componente del editor de día:
```
Lunes: [09:00] a [18:00]  [✓]  ← activo
Martes: [libre]            [+]  ← agregar turno
```

---

## FASE 6 — Gestión de Puntos de Fidelización (Admin)

**Objetivo:** El admin puede otorgar o quitar puntos a cualquier usuario.

### 6.1 Estado de puntos editable en dev mode

**Archivo:** `lib/data/loyalty.ts` o `lib/data/users.ts`

Agregar Map en memoria para ajustes de puntos:
```typescript
const pointsAdjustments = new Map<string, number>() // userId → delta acumulado

export function adjustDevPoints(userId: string, delta: number, reason: string) {
  const current = pointsAdjustments.get(userId) ?? 0
  pointsAdjustments.set(userId, current + delta)
  // También loggear la transacción en memoria
}
```

### 6.2 API de puntos admin

**Archivo nuevo:** `app/api/admin/puntos/route.ts`

```typescript
// GET /api/admin/puntos — lista usuarios del tenant con su saldo de puntos
// POST /api/admin/puntos — ajustar puntos de un usuario
// Body: { user_id: string, delta: number, reason: string }
// delta puede ser positivo (otorgar) o negativo (quitar)
// Verificar que saldo resultante no sea negativo
```

Verificar rol admin.

### 6.3 Extender página de fidelización admin

**Archivo:** `app/[locale]/admin/fidelizacion/page.tsx`

Leer el archivo actual. Agregar sección "Gestión de Puntos de Usuarios":

- Tabla: Nombre · Email · Saldo actual · Acciones
- Acción: [+ Otorgar] [- Quitar] abre modal con:
  - Campo: cantidad de puntos
  - Campo: razón/nota (requerido)
  - Botón confirmar

Feedback visual: toast/alert con "Se otorgaron X puntos a [nombre]".

---

## FASE 7 — Funcionalidades del Cliente

### 7.1 Mostrar código de referido en perfil

**Archivo:** `app/[locale]/perfil/page.tsx`

Leer el archivo actual. Agregar sección visible solo para rol `cliente`:

```
┌─────────────────────────────────────┐
│ Tu código de referido               │
│                                     │
│  [ FMCLI001 ]  [📋 Copiar]         │
│                                     │
│  Comparte tu código y gana 50 pts   │
│  por cada cliente que agende.       │
│                                     │
│  Referidos: 0  |  Puntos ganados: 0 │
└─────────────────────────────────────┘
```

El botón copiar usa `navigator.clipboard.writeText(code)` con feedback visual.

### 7.2 Mejorar página de puntos con canje

**Archivo:** `app/[locale]/puntos/page.tsx`

Leer el archivo actual. Agregar sección "Canjear puntos":

Opciones de canje hardcodeadas para dev mode:
```javascript
const REDEEM_OPTIONS = [
  { id: "r1", label: "Descuento 10% en próximo servicio", points_cost: 100, type: "service_discount" },
  { id: "r2", label: "Descuento 20% en tienda",           points_cost: 200, type: "store_discount" },
  { id: "r3", label: "Manicura Tradicional gratis",       points_cost: 500, type: "free_service" },
  { id: "r4", label: "Producto de tienda hasta $50.000",  points_cost: 750, type: "store_credit" },
]
```

Por cada opción: mostrar costo en puntos, descripción, y botón "Canjear" (deshabilitado si no tiene suficientes puntos).

Al canjear: mostrar modal de confirmación → generar código alfanumérico de 8 caracteres → mostrar "Tu código: XXXX-XXXX" con botón copiar.

### 7.3 Código de referido en booking

**Archivo:** `app/[locale]/agendar/page.tsx` o el wizard de booking

Leer el archivo. En el último paso del wizard (confirmación) agregar campo opcional:
```
[ Código de referido (opcional) _______________ ]
```

En dev mode: si se ingresa un código válido (`FMCLI001`), mostrar "¡Código válido! El cliente que te refirió recibirá 50 puntos."

---

## FASE 8 — Funcionalidades de la Empleada

### 8.1 Filtrar calendario por especialista logueada

**Archivo:** `app/[locale]/calendario/page.tsx`

Leer el archivo actual. Agregar lógica:

```typescript
// Si el usuario logueado tiene rol "trabajadora"
// filtrar las citas para mostrar solo las asignadas a su specialist_id
// El specialist_id viene del perfil: profile.specialist_id
```

La vista debe mostrar solo sus citas del día/semana, no las de otras empleadas.

### 8.2 API de estadísticas de la empleada

**Archivo nuevo:** `app/api/empleada/stats/route.ts`

```typescript
// GET /api/empleada/stats
// Retorna: { today_sessions, week_sessions, week_start_date }
// Lógica:
// - today_sessions: count de appointments donde specialist_id === user.specialist_id 
//   y scheduled_at es hoy (comparar solo fecha)
// - week_sessions: count de appointments donde specialist_id === user.specialist_id
//   y scheduled_at >= lunes de esta semana a las 00:00
// - week_start_date: fecha del lunes de esta semana
// 
// En dev mode: retornar datos mock
// { today_sessions: 4, week_sessions: 18, week_start_date: "2026-04-28" }
```

El lunes de la semana actual se calcula así:
```typescript
const now = new Date()
const day = now.getDay() // 0=domingo, 1=lunes...
const diff = now.getDate() - day + (day === 0 ? -6 : 1)
const monday = new Date(now.setDate(diff))
monday.setHours(0, 0, 0, 0)
```

### 8.3 Sección "Mi actividad" en perfil de empleada

**Archivo:** `app/[locale]/perfil/page.tsx`

Agregar sección visible solo para rol `trabajadora`, después del perfil básico:

```
┌─────────────────────────────────────────┐
│ Mi actividad                            │
├─────────────────┬───────────────────────┤
│ Sesiones hoy    │ Sesiones esta semana  │
│                 │                       │
│      4          │         18            │
│  tratamientos   │   (desde el lunes)    │
└─────────────────┴───────────────────────┘
  ↻ Se reinicia cada lunes a las 00:00
```

Fetching: llamar `GET /api/empleada/stats` al montar el componente.

---

## FASE 9 — Verificación del Booking

### 9.1 Flujo completo de agendamiento

**Archivo:** `app/[locale]/agendar/page.tsx` y `app/api/booking/route.ts`

Verificar que el wizard funcione end-to-end en dev mode:

1. **Paso 1:** Selección de servicio — debe listar los 32 servicios de fm-glow-studio agrupados por categoría
2. **Paso 2:** Selección de especialista — debe mostrar la empleada de prueba (Ana García) con sus servicios
3. **Paso 3:** Selección de fecha/hora — llamar `/api/availability` y mostrar slots disponibles
4. **Paso 4:** Confirmación — mostrar resumen, campo código referido opcional, botón confirmar
5. **POST** `/api/booking` — crear la cita, retornar éxito

En dev mode el appointment se guarda en un array en memoria (ya debe existir en `lib/data/appointments.ts`). Verificar que así sea.

Si `/api/availability` falla en dev, retornar slots hardcodeados para los próximos 3 días (cada hora de 9:00 a 17:00).

### 9.2 Lista de citas del cliente

**Archivo:** `app/[locale]/citas/page.tsx`

Verificar que muestre las citas del usuario logueado. En dev mode, si el usuario es `dev-cliente-fmglow`, mostrar al menos 2 citas de ejemplo (una próxima, una pasada).

---

## FASE 10 — Verificación de la Tienda

### 10.1 Flujo de compra en dev mode

**Archivo:** `app/[locale]/tienda/page.tsx` y `app/api/shop/checkout/route.ts`

Verificar que:
1. La tienda liste los 6 productos de fm-glow-studio (Fase 3.1)
2. Se pueda agregar al carrito
3. El checkout funcione en dev mode (sin pasarela real, simular pago exitoso)
4. Si el cliente tiene puntos, mostrar opción de descuento por puntos

En dev mode: el checkout solo simula la compra y retorna `{ success: true, order_id: "dev-order-xxx" }`.

### 10.2 Estado del carrito persistente

Verificar que el carrito persista entre navegaciones (probablemente en localStorage o Context). Si no existe, crear un `CartContext` simple:

```typescript
// context: { items: CartItem[], addItem, removeItem, clearCart, total }
// Persistir en localStorage con key "cart-${tenantSlug}"
```

---

## FASE 11 — Navegación y UX

### 11.1 Navegación por rol

Asegurar que el menú/sidebar muestre las opciones correctas según rol:

**Admin:**
- Dashboard · Agenda · Calendario · Servicios · Inventario/Tienda · Usuarios · Fidelización · Ventas · Configuración

**Cliente:**
- Inicio · Agendar · Mis citas · Tienda · Mis puntos · Perfil

**Empleada (trabajadora):**
- Mi agenda · Calendario · Perfil (con mi actividad)

### 11.2 Redirección post-login

Verificar en `app/api/dev-auth/route.ts` que la respuesta incluya `redirectTo` según rol:
```typescript
const redirectTo = {
  admin: `/${locale}/admin`,
  trabajadora: `/${locale}/calendario`,
  cliente: `/${locale}`,
}[user.role] ?? `/${locale}`
```

---

## Archivos críticos a leer antes de modificar

| Archivo | Por qué leerlo |
|---------|----------------|
| `app/api/dev-auth/route.ts` | Entender estructura actual del auth dev |
| `app/[locale]/auth/login/page.tsx` | Entender estructura actual del login |
| `lib/tenant.ts` | Entender cómo se definen los tenants dev |
| `lib/data/services.ts` | Entender estructura de servicios en dev |
| `lib/data/products.ts` | Entender estructura de productos en dev |
| `lib/data/specialists.ts` | Entender estructura de especialistas/horarios |
| `lib/data/appointments.ts` | Entender cómo se guardan citas en dev |
| `hooks/useAuth.ts` | Entender cómo se lee la sesión en cliente |
| `proxy.ts` | Entender middleware de auth y tenant |
| `app/[locale]/admin/page.tsx` | Estado actual del dashboard admin |
| `app/[locale]/perfil/page.tsx` | Estado actual del perfil |
| `app/[locale]/agendar/page.tsx` | Estado actual del wizard de booking |
| `components/layout/` | Entender navegación existente |
| `messages/es.json` | Agregar nuevas keys de traducción aquí |

---

## Orden de ejecución recomendado

```
FASE 1  →  Auth email/contraseña (habilita testing de todo lo demás)
FASE 9  →  Verificar booking (detectar qué está roto antes de seguir)
FASE 10 →  Verificar tienda + agregar productos fm-glow-studio
FASE 2  →  CMS servicios admin
FASE 3  →  CMS tienda admin (extiende lo de fase 10)
FASE 4  →  Dashboard ganancias
FASE 7  →  Funcionalidades cliente (referido + puntos)
FASE 8  →  Funcionalidades empleada (contador sesiones)
FASE 5  →  Gestión agenda por admin
FASE 6  →  Gestión puntos por admin
FASE 11 →  Navegación por rol (pulir UX final)
```

---

## Verificación final

Probar con cada usuario en `https://c02e-181-131-164-77.ngrok-free.app/es?tenant=fm-glow-studio`:

### Usuario: admin / 123456789
- [ ] Login exitoso, redirige a `/es/admin`
- [ ] Dashboard muestra ganancias (servicios + tienda)
- [ ] Puede editar precio de un servicio en `/es/admin/servicios`
- [ ] Puede agregar nuevo servicio
- [ ] Puede editar precio de producto en `/es/admin/inventario`
- [ ] Puede cambiar horario de Ana García en `/es/admin/agenda`
- [ ] Puede otorgar puntos a cliente en `/es/admin/fidelizacion`
- [ ] Puede quitar puntos a cliente

### Usuario: cliente / 123456789
- [ ] Login exitoso, redirige a `/es`
- [ ] Puede completar flujo de agendamiento (todos los pasos)
- [ ] Ve sus citas en `/es/citas`
- [ ] Ve su código de referido en `/es/perfil`
- [ ] Puede ver y canjear puntos en `/es/puntos`
- [ ] Puede comprar en la tienda `/es/tienda`

### Usuario: empleada / 123456789
- [ ] Login exitoso, redirige a `/es/calendario`
- [ ] Ve solo sus citas asignadas
- [ ] Ve contador "Mi actividad" en `/es/perfil` (sesiones hoy + semana)
- [ ] No tiene acceso a `/es/admin` (redirige o muestra 403)
