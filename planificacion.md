# GlowOS — Estado del Proyecto y Planificación

> Última actualización: 2026-05-04  
> Rama activa: `development`  
> Demo principal: `https://c02e-181-131-164-77.ngrok-free.app/es?tenant=fm-glow-studio`

---

## Arquitectura general

**Stack:**
- Next.js 16.2.3 App Router (breaking changes vs versiones anteriores — leer `node_modules/next/dist/docs/`)
- Tailwind CSS v4 (sin `@apply`, todo CSS custom properties)
- next-intl v4.9.1 (`getTranslations()` server, `useTranslations()` client)
- Supabase (solo producción — dev mode usa datos en memoria)
- TypeScript strict

**Patrones clave:**
- **Multi-tenant**: tenant detectado por `?tenant=slug` en dev, subdominio en producción
- **Dev mode**: `NEXT_PUBLIC_SUPABASE_URL.includes("xxxx")` → todo data es mock hardcodeado en `lib/data/`
- **Cookie de sesión dev**: `dev-session` contiene JSON serializado del perfil completo `{ id, role, email, full_name, specialist_id, referral_code, points }`
- **Ediciones en memoria**: cambios admin (servicios, horarios, puntos) viven en `Map`s a nivel de módulo Node.js — se pierden al reiniciar servidor (correcto para dev)
- **Protección de rutas**: cada página protegida lee la cookie server-side y verifica el rol antes de renderizar

**Usuarios de prueba (FM Glow Studio):**

| Usuario | Contraseña | Rol | Email |
|---|---|---|---|
| `admin` | `123456789` | admin | admin@fmglow.test |
| `cliente` | `123456789` | cliente | cliente@fmglow.test |
| `empleada` | `123456789` | trabajadora | empleada@fmglow.test |

---

## Lo que está implementado ✅

### Auth y sesión
- [x] `middleware.ts` — wiring de `proxy.ts` como middleware Next.js (detección de tenant)
- [x] `app/api/dev-auth/route.ts` — login con username/email + password, 3 usuarios con roles y perfiles completos
- [x] `hooks/useAuth.ts` — lee cookie `dev-session` en dev mode (no llama Supabase)
- [x] `components/auth/LoginForm.tsx` — selector de 3 roles con credenciales visibles + login email/password
- [x] `app/[locale]/auth/login/page.tsx` — redirige si ya hay sesión activa
- [x] `components/auth/SignOutButton.tsx` — cierra sesión dev y producción

### Datos mock FM Glow Studio
- [x] `lib/data/services.ts` — 32 servicios reales (facial, corporal, uñas, pestañas, depilación, masajes)
- [x] `lib/data/specialists.ts` — 3 especialistas con horarios lun–sáb, vinculados a usuarios de prueba
- [x] `lib/data/appointments.ts` — 7 citas mock con distintos estados (confirmed, pending, completed, cancelled). `getAllMyAppointments(tenantId, userId?)` y `getMyAppointments(tenantId, userId?)` filtran por `client_id` en dev mode.
- [x] `lib/data/products.ts` — 8 productos tienda en COP (sérum vitamina C, cremas, aceites, kits)
- [x] `lib/data/calendar.ts` — bloques de calendario por especialista
- [x] `lib/data/users.ts` — usuarios dev con roles y puntos. Funciones nuevas: `findUserByReferralCode(tenantId, code)` busca cliente por código de referido; `addLoyaltyPoints(tenantId, userId, points)` suma puntos en dev y prod.
- [x] `lib/data/inventory.ts` — 7 ventas mock para dashboard de ganancias

### Admin panel (`/[locale]/admin/`)
- [x] **Layout admin** — lectura de rol desde cookie en dev, protección por rol (admin/trabajadora), nav con: Dashboard, Agenda, Servicios, Horarios, Inventario, Ventas, Fidelización, Usuarios, Configuración
- [x] **Dashboard** (`/admin`) — `GananciasOverview` con tabs Hoy/Esta semana/Este mes, desglose servicios + tienda, tabla de transacciones recientes
- [x] **CMS Servicios** (`/admin/servicios`) — tabla filtrable por categoría, modal de edición (nombre, descripción, categoría, duración, precio, activo), crear nuevo servicio; ediciones persisten en memoria del servidor
- [x] **Horarios** (`/admin/horarios`) — tabla por especialista con toggle día (activo/inactivo) + inputs de hora inicio/fin, botón guardar que persiste vía `PUT /api/admin/horarios`
- [x] **Fidelización** (`/admin/fidelizacion`) — `AdminPointsManager`: lista todos los usuarios con sus puntos, modal para sumar/restar con razón obligatoria
- [x] **Inventario** (`/admin/inventario`) — `AdminInventoryTable`: lista productos (parcialmente implementado)
- [x] **Ventas** (`/admin/ventas`) — `AdminSalesList` (datos mock)
- [x] **Agenda** (`/admin/agenda`) — `AdminAgendaView` (estructura base)
- [x] **Calendario** (`/admin/calendario`) — `TeamCalendarView` (estructura base)

### APIs admin
- [x] `GET/PATCH/POST /api/admin/servicios` — CRUD servicios con ediciones en memoria
- [x] `GET /api/admin/analytics?period=today|week|month` — ingresos mock por período
- [x] `GET/PUT /api/admin/horarios?specialist_id=` — horarios de especialistas
- [x] `GET/POST /api/admin/puntos` — lista usuarios + ajuste de puntos con razón
- [x] `GET/POST /api/admin/productos` — productos tienda (estructura lista)
- [x] `GET/PATCH/DELETE /api/admin/usuarios/role|invite|deactivate` — gestión de usuarios (producción)
- [x] `GET /api/referral/validate?tenant=&code=` — valida código de referido contra `DEV_USERS` en dev, contra Supabase en prod
- [x] `GET /api/availability/dates?tenant=&service=&month=` — fechas del mes con disponibilidad para un servicio

### Booking (`/[locale]/agendar/`)
- [x] `BookingWizard` — flujo 4 pasos: Servicio → Fecha → Hora → Confirmar
- [x] `ServiceSelector` — grid de servicios con filtro por categoría
- [x] `CalendarPicker` — calendario mensual, bloquea días pasados, muestra indicador verde (●) en días con slots disponibles, navegación mensual recarga disponibilidad
- [x] `TimeSlotGrid` — slots horarios por especialista con filtro por nombre
- [x] `BookingConfirmation` — resumen + campo referral code con validación en tiempo real (debounce fetch a `/api/referral/validate`) + campo notas
- [x] `POST /api/booking` — crea cita en dev (mock) y producción (Supabase), valida referral code y suma puntos al dueño del código
- [x] `GET /api/availability` — disponibilidad real desde horarios de especialistas
- [x] `GET /api/availability/dates` — fechas del mes con al menos un slot disponible (por servicio), filtra por horarios de especialistas activos y duración del servicio

### Perfil cliente (`/[locale]/perfil/`)
- [x] Protegido por sesión, lee dev-session server-side (incluye `id` del perfil)
- [x] `ReferralSection` — código de referido copiable (solo rol `cliente`)
- [x] `EmpleadaStats` — sesiones hoy + semana con reinicio lunes (solo rol `trabajadora`)
- [x] `UpcomingAppointments` — próximas citas **filtradas por `client_id`** del dev-session cookie
- [x] `NotificationCenter` — notificaciones del tenant
- [x] `ThemeToggle`, `LocaleSelector`, `SignOutButton`

### Puntos / fidelidad (`/[locale]/puntos/`)
- [x] `PointsWallet` — saldo actual e historial de movimientos
- [x] `RedeemSection` — 4 opciones de canje, genera código único, botón copiar
- [x] `GET /api/empleada/stats` — sesiones hoy y semana en tiempo real

### Tienda (`/[locale]/tienda/`)
- [x] `ProductGrid` — catálogo con búsqueda y filtro por categoría
- [x] `ProductCard` — tarjeta de producto con precio y botón "agregar al carrito" (check verde al añadir)
- [x] `CartContext` — React context con `addItem/removeItem/updateQuantity/clearCart/setPointsToUse`, expuesto vía `useCart()`
- [x] `CartProvider` — envuelve la sección tienda desde `app/[locale]/tienda/layout.tsx`
- [x] `CartButton` — botón en el header de tienda con badge de contador, link a `/tienda/carrito`
- [x] `CartPage` — página `/tienda/carrito` con lista de items, controles ±/🗑, total, campo puntos de fidelidad, checkout y confirmación de compra
- [x] `POST /api/shop/checkout` — crea pedido en dev (mock) y producción (Supabase)

### Infra / base
- [x] `proxy.ts` — resolución de tenant por `?tenant=` query param en dev, subdominio en prod
- [x] `lib/tenant.ts` — DEV_TENANTS con FM Glow Studio completo (colores, fuentes, features)
- [x] `lib/supabase/server.ts` y `client.ts` — fallback dev sin credenciales reales
- [x] PWA manifest dinámico por tenant (`/api/manifest/[slug]`)
- [x] Tema dinámico por tenant (`/api/theme/[slug]`)
- [x] Sincronización de calendario iCal (`/api/calendar/[token]`)

---

## Lo que falta implementar ❌

### Sprint 6 — Completar flujos core

#### Booking end-to-end en dev mode
- [x] **Availability real en dev** — `CalendarPicker` muestra indicador verde (●) en días con slots disponibles. `BookingWizard` fetchea `GET /api/availability/dates?tenant=&service=&month=` al seleccionar servicio y al navegar entre meses. La API filtra por horarios de `lib/data/specialists.ts`, día de la semana en la timezone del tenant y duración del servicio.
- [ ] **Selección de especialista explícita** — el paso "Hora" muestra slots y filtro por especialista, pero no es un paso separado; ya permite elegir vía botones de filtro en `TimeSlotGrid`
- [ ] **Confirmación con feedback** — después de POST /api/booking exitoso, `BookingConfirmation` muestra pantalla de éxito con resumen; falta redirigir a `/perfil` con toast
- [x] **`/citas` page** — `app/[locale]/citas/page.tsx` lee `dev-session` cookie para extraer `client_id`, lo pasa a `getAllMyAppointments(tenantId, userId)` que filtra por usuario en dev mode. Muestra lista con `CancelButton` y agrupación próximas/historial.

#### Tienda con carrito funcional
- [x] **`CartContext`** — `contexts/CartContext.tsx`: React context con `addItem/removeItem/updateQuantity/clearCart/setPointsToUse`. `CartProvider` envuelve `/tienda` desde `app/[locale]/tienda/layout.tsx`. `useCart()` hook expone `items, itemCount, subtotal, pointsToUse`.
- [x] **Vista del carrito** — `components/shop/CartPage.tsx` montado en `app/[locale]/tienda/carrito/page.tsx`. Muestra: lista de items con imagen, nombre, precio, controles ±/🗑, subtotal, campo puntos a usar, botón checkout.
- [x] **Checkout en dev mode conectado** — `POST /api/shop/checkout` recibe items y puntos, retorna `orderId` mock en dev. `CartPage` llama el endpoint y muestra pantalla de confirmación con ID del pedido.
- [x] **Confirmación de compra** — pantalla post-checkout con check verde, número de pedido, puntos ganados y botones "Seguir comprando" / "Ir a mi perfil".
- [x] **`CartButton`** — `components/shop/CartButton.tsx`: badge con contador en el header de `/tienda`, link al carrito.

#### Código de referido en booking
- [x] **Validar referral code en `/api/booking`** — verifica que el código existe en `DEV_USERS` (o Supabase en prod) vía `findUserByReferralCode()`. Si es válido, suma `referral_bonus_pts` al dueño del código con `addLoyaltyPoints()`.
- [x] **Feedback en `BookingConfirmation`** — fetch debounced (400ms) a `GET /api/referral/validate?tenant=&code=`. Muestra borde verde/rojo en el input, nombre del referente y puntos de bonus.

---

### Sprint 7 — Admin completo

#### CMS Horarios de especialistas
- [x] **Página `/admin/horarios`** — `app/[locale]/admin/horarios/page.tsx`: acordeón por especialista, tabla Lun–Sáb con toggle activo/inactivo + inputs time de inicio y fin, botón guardar que persiste vía `PUT /api/admin/horarios`. Agregado al nav del admin layout con ícono Clock.

#### CMS Productos tienda
- [ ] **Tab "Productos" en `/admin/inventario`** — `AdminInventoryTable` muestra solo stock físico; agregar tab con tabla de catálogo conectada a `/api/admin/productos`
- [ ] **Formulario crear/editar producto** — nombre (multilingual), precio, categoría, descripción, imagen URL, activo

#### Dashboard enriquecido
- [ ] **Gráfica de ingresos** — `GananciasOverview` muestra solo números; agregar gráfica de barras con recharts o similar
- [ ] **Ocupación de especialistas** — % de slots utilizados vs disponibles por semana
- [ ] **`/admin/usuarios` conectado a datos dev** — `UserManagement` component existe pero lee de Supabase; agregar path dev con `DEV_USERS`

---

### Sprint 8 — Empleada completa

- [ ] **`/[locale]/calendario` filtrado por empleada** — actualmente muestra calendario global; filtrar por `specialist_id` del `dev-session` cookie
- [ ] **`WorkerActivity` integrado** — creado en `components/profile/WorkerActivity.tsx` pero no está en ninguna página; integrarlo en `/calendario` o `/perfil` de empleada
- [ ] **Vista diaria de citas** — para la empleada: lista de sus citas del día con detalle (cliente, servicio, hora, notas)

---

### Sprint 9 — Producción

- [ ] **Supabase real** — reemplazar `xxxx` en `.env.local` con URL y keys del proyecto Supabase
- [ ] **Migraciones** — ejecutar `supabase/migrations/` contra el proyecto real
- [ ] **Seed FM Glow Studio** — script para insertar tenant, especialistas, servicios y productos en Supabase
- [ ] **RLS policies** — verificar: cliente solo ve sus citas; trabajadora ve las de su `specialist_id`; admin ve todo
- [ ] **OAuth en producción** — configurar Google/Apple en Supabase dashboard
- [ ] **Email templates** — confirmación de cita vía Resend o SendGrid (`/api/send-confirmation` ya existe, falta transporte real)
- [ ] **Push notifications backend** — VAPID keys + suscripciones en Supabase (la UI ya existe en `EnhancedInstallPrompt`)
- [ ] **Protección de rutas en middleware** — `proxy.ts` no verifica sesión Supabase para rutas protegidas en producción

---

### Sprint 10 — Multi-tenant real

- [ ] **Onboarding de nuevos clientes** — formulario público para crear tenant nuevo (datos del salón, plan, pago)
- [ ] **Logo upload** — UI para subir logo (actualmente hardcodeado en `components/ui/logo-registry.tsx`)
- [ ] **Editor de tema** — sliders/color pickers para `--brand-primary`, `--brand-secondary`, etc.
- [ ] **Panel super-admin** — vista de todos los tenants: plan, estado, métricas

---

## Orden de prioridad sugerido

1. ~~**Carrito de tienda**~~ ✅ — flujo más corto de completar, alto impacto visual en la demo
2. ~~**Availability real en dev**~~ ✅ — conectar `CalendarPicker` con horarios de especialistas
3. ~~**`/citas` page**~~ ✅ — mostrar citas del usuario con cancelación
4. ~~**Validar referral code en booking**~~ ✅ — el campo ya está, solo falta la lógica
5. ~~**`/admin/horarios` UI**~~ ✅ — el API ya existe, solo falta la página
6. **CMS Productos tienda** — tab "Productos" en `/admin/inventario` + formulario crear/editar
7. **Dashboard enriquecido** — gráfica de ingresos, ocupación de especialistas
8. **Selección de especialista explícita** — paso intermedio o modal con datos de la especialista
9. **Conectar Supabase real** — cuando los flujos dev estén 100%, migrar a producción

---

## Estructura de archivos clave

```
app/
  [locale]/
    admin/
      page.tsx          → dashboard con GananciasOverview ✅
      servicios/        → CMS servicios ✅
      horarios/         → editor de horarios por especialista ✅
      fidelizacion/     → gestión puntos ✅
      inventario/       → stock (parcial), productos ❌
      usuarios/         → placeholder ❌
    agendar/            → BookingWizard 4 pasos ✅
    tienda/             → catálogo ✅, carrito ✅
      carrito/          → CartPage con checkout ✅
    puntos/             → wallet + canje ✅
    perfil/             → perfil usuario completo ✅
    citas/              → lista de citas con CancelButton ✅
    calendario/         → parcial (no filtra por empleada)
  api/
    dev-auth/           → login dev ✅
    booking/            → crear cita ✅ (valida referral + suma puntos)
    availability/       → slots disponibles ✅
      dates/            → fechas con disponibilidad por servicio ✅
    referral/
      validate/         → validar código de referido ✅
    shop/checkout/      → checkout tienda ✅ (dev mock)
    admin/
      analytics/        → ingresos por período ✅
      horarios/         → CRUD horarios ✅
      puntos/           → ajuste puntos ✅
      servicios/        → CRUD servicios ✅
      productos/        → CRUD productos ✅

lib/data/              → capa de datos mock completa ✅
components/
  admin/               → GananciasOverview, AdminPointsManager, ServiceEditor ✅
  booking/             → BookingWizard, CalendarPicker (dots), TimeSlotGrid ✅
  loyalty/             → PointsWallet, RedeemSection, ReferralCodeCard ✅
  profile/             → ReferralSection, EmpleadaStats, WorkerActivity ✅
  shop/                → ProductGrid, ProductCard, CartPage, CartButton ✅
contexts/
  CartContext.tsx      → CartProvider + useCart hook ✅
```

---

## Notas técnicas importantes

### Next.js 16 — diferencias críticas
- `cookies()` y `headers()` son **async** → siempre `await`
- `params` en page components es `Promise<{...}>` → siempre `await params`
- Casting necesario: `(await cookies() as any).get?.("dev-session")?.value`

### Tailwind v4
- No existe `@apply` — todo inline o CSS custom properties
- Variables: `var(--brand-primary)`, `var(--brand-surface)`, `var(--brand-border)`, `var(--brand-text)`

### TypeScript + Supabase
- Queries dinámicas → `(supabase as any).from(...)` (patrón pre-existente en el codebase)

### Dev mode — patrón estándar
```typescript
const isDevMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

if (isDevMode) {
  return NextResponse.json({ /* mock data */ });
}

// Producción:
const { createServiceClient } = await import("@/lib/supabase/server");
```

### Leer sesión dev en server components
```typescript
import { cookies } from "next/headers";

const raw = (await cookies() as any).get?.("dev-session")?.value as string | undefined;
const devProfile = raw && raw !== "1" ? JSON.parse(decodeURIComponent(raw)) : null;
```

### CartContext — patrón de uso
```typescript
// Envolver la sección que necesita acceso al carrito:
// app/[locale]/tienda/layout.tsx
export default function TiendaLayout({ children }) {
  return <CartProvider>{children}</CartProvider>;
}

// En cualquier componente hijo:
import { useCart } from "@/contexts/CartContext";
const { items, addItem, removeItem, itemCount, subtotal } = useCart();
```

### Validación de referral code — flujo completo
1. `BookingConfirmation` hace fetch debounced (400ms) a `GET /api/referral/validate?tenant=&code=`
2. La API llama `findUserByReferralCode(tenantId, code)` → busca en `DEV_USERS` por `referral_code` (solo rol `cliente`)
3. Al confirmar, `POST /api/booking` recibe `referralCode`, re-valida y llama `addLoyaltyPoints()` para sumar `referral_bonus_pts` al dueño del código
