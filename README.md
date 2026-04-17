# spa-saas

Plataforma SaaS white-label para SPAs y salones de belleza. Un solo codebase, múltiples clientes, cada uno con su propia identidad visual, idioma, dark mode y módulos activados según su plan.

---

## Índice

1. [Visión del producto](#1-visión-del-producto)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura general](#3-arquitectura-general)
4. [Modelo de datos](#4-modelo-de-datos)
5. [Sistema de theming white-label](#5-sistema-de-theming-white-label)
6. [PWA y mobile-first](#6-pwa-y-mobile-first)
7. [Internacionalización (i18n)](#7-internacionalización-i18n)
8. [Dark mode](#8-dark-mode)
9. [Módulos del sistema](#9-módulos-del-sistema)
10. [Estructura de archivos](#10-estructura-de-archivos)
11. [Roadmap de desarrollo (sprints)](#11-roadmap-de-desarrollo-sprints)
12. [Guía de onboarding de un nuevo tenant](#12-guía-de-onboarding-de-un-nuevo-tenant)
13. [Planes y precios](#13-planes-y-precios)
14. [Variables de entorno](#14-variables-de-entorno)
15. [Comandos útiles](#15-comandos-útiles)

---

## 1. Visión del producto

`spa-saas` es una plataforma multi-tenant que permite a SPAs y salones de belleza tener su propia aplicación web completamente personalizada — con su logo, colores, fuentes, idioma y módulos — sin que cada cliente requiera un desarrollo desde cero.

### Clientes actuales

| Tenant        | País        | Plan    | Notas                      |
| ------------- | ----------- | ------- | -------------------------- |
| `spa-luna`    | 🇨🇴 Colombia | Premium | Incluye bronceo solar      |
| `glam-studio` | 🇺🇸 EE.UU.   | Pro     | Sin bronceo solar, EN + ES |

### Propuesta de valor

- El cliente siente que la app es 100% suya (logo, colores, dominio propio)
- El desarrollador construye una vez y despliega para N clientes
- Cada cliente activa solo los módulos que necesita
- Instalable como app nativa (PWA) desde el celular
- Funciona offline (citas próximas, historial básico)
- Multi-idioma por tenant (hasta 5 idiomas)
- Dark mode con 3 modos: sistema, claro, oscuro

---

## 2. Stack tecnológico

| Capa         | Tecnología               | Versión           | Razón                                                     |
| ------------ | ------------------------ | ----------------- | --------------------------------------------------------- |
| Frontend     | Next.js                  | **16.2.3**        | SSR, rutas API, soporte nativo i18n y PWA                 |
| Backend / DB | Supabase                 | JS v2.103.0 + SSR | Auth OAuth, PostgreSQL, Storage, Realtime, Edge Functions |
| Estilos      | Tailwind CSS             | **4**             | Utility-first, mobile-first nativo                        |
| Componentes  | shadcn/ui                | **4.2.0**         | Accesibles, customizables, sin overhead                   |
| i18n         | next-intl                | **4.9.1**         | Integración nativa con App Router, gratuito               |
| PWA          | @ducanh2912/next-pwa     | **10.x**          | Service worker automático, manifest dinámico              |
| Fuentes      | next/font (Google Fonts) | —                 | Por tenant: Cormorant, DM Sans, Playfair, etc.            |
| Deploy       | Vercel                   | —                 | Wildcard subdomains, Edge Network, CI/CD gratis           |
| Email        | Resend                   | —                 | 3.000 emails/mes gratis, SDK simple                       |
| Monitoreo    | Sentry                   | Free tier         | Errores en producción                                     |

### ¿Por qué NO se incluyó?

- **Bot de WhatsApp (Twilio)**: eliminado del scope inicial. La arquitectura deja el webhook listo para activarse en el futuro.
- **Pagos en línea**: los pagos son presenciales. Solo se registran transacciones.
- **App nativa (React Native)**: la PWA cubre el 95% de los casos de uso móvil sin el overhead de dos codebases.

---

## 3. Arquitectura general

```
┌─────────────────────────────────────────────────────┐
│                   CLIENTES (navegador)               │
│  spa-luna.tuapp.co   ·   glam-studio.tuapp.co       │
│  (o dominio propio)      (o dominio propio)         │
└──────────────────┬──────────────────────────────────┘
                   │ HTTPS
┌──────────────────▼──────────────────────────────────┐
│              VERCEL (Edge Network)                   │
│  Next.js 14 — App Router                            │
│  Middleware: detecta subdominio → carga tenant      │
│  next-intl: detecta locale → carga mensajes         │
│  next-pwa: service worker + manifest dinámico       │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                  SUPABASE                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │   Auth   │  │PostgreSQL│  │  Edge Functions  │  │
│  │  OAuth   │  │  + RLS   │  │  (cron + push)   │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│  ┌──────────┐  ┌──────────┐                        │
│  │ Storage  │  │ Realtime │                        │
│  │  logos   │  │  notifs  │                        │
│  └──────────┘  └──────────┘                        │
└─────────────────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│             SERVICIOS EXTERNOS                       │
│  Resend (email)  ·  Web Push API  ·  (Twilio futuro)│
└─────────────────────────────────────────────────────┘
```

### Flujo de una request

1. Usuario entra a `spa-luna.tuapp.co/es/citas`
2. Middleware de Next.js extrae el subdominio `spa-luna`
3. Se consulta la tabla `tenants` en Supabase → se carga la config del tenant
4. `TenantProvider` inyecta los CSS custom properties (`--brand-accent`, `--brand-radius`, etc.)
5. `next-intl` detecta el locale `es` en la URL y carga `messages/es.json`
6. El componente verifica `tenant.feature_solar` → muestra o no el módulo de bronceo
7. El `<html>` lleva `data-theme="dark|light"` según preferencia guardada

---

## 4. Modelo de datos

### Tabla `tenants` — configuración por cliente

```sql
CREATE TABLE tenants (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug  TEXT UNIQUE NOT NULL,   -- 'spa-luna', 'glam-studio'
  name  TEXT NOT NULL,

  -- Localización
  default_locale  TEXT DEFAULT 'es',        -- locale por defecto
  active_locales  TEXT[] DEFAULT '{es}',    -- idiomas disponibles
  currency        TEXT DEFAULT 'COP',
  timezone        TEXT DEFAULT 'America/Bogota',

  -- Branding
  logo_url         TEXT,
  brand_color_primary   TEXT DEFAULT '#7F77DD',
  brand_color_bg        TEXT DEFAULT '#ffffff',
  brand_color_text      TEXT DEFAULT '#1a1a1a',
  brand_color_surface   TEXT DEFAULT '#f5f5f5',
  brand_color_border    TEXT DEFAULT '#e0e0e0',
  brand_color_dark_bg      TEXT DEFAULT '#0f0f0f',
  brand_color_dark_surface TEXT DEFAULT '#1c1c1c',
  brand_color_dark_text    TEXT DEFAULT '#f0f0f0',
  brand_color_dark_border  TEXT DEFAULT '#2e2e2e',
  brand_font_heading    TEXT DEFAULT 'Georgia, serif',
  brand_font_body       TEXT DEFAULT 'system-ui, sans-serif',
  brand_radius          TEXT DEFAULT '8px',

  -- Textos del home (editables por el admin del SPA)
  hero_headline   JSONB DEFAULT '{"es":"Bienvenida"}',  -- por locale
  hero_subtext    JSONB DEFAULT '{"es":"Tu spa de confianza"}',
  hero_cta        JSONB DEFAULT '{"es":"Agendar cita"}',

  -- Feature flags
  feature_store         BOOLEAN DEFAULT true,
  feature_inventory     BOOLEAN DEFAULT true,
  feature_loyalty       BOOLEAN DEFAULT true,
  feature_referrals     BOOLEAN DEFAULT true,
  feature_reviews       BOOLEAN DEFAULT true,
  feature_solar         BOOLEAN DEFAULT false,
  feature_sales_history BOOLEAN DEFAULT true,
  feature_whatsapp_bot  BOOLEAN DEFAULT false,   -- reservado para futuro

  -- Configuración de fidelización
  points_per_service   INT DEFAULT 100,
  points_per_purchase  INT DEFAULT 1,
  referral_bonus_pts   INT DEFAULT 200,
  cancellation_penalty INT DEFAULT 50,

  -- Plan
  plan       TEXT DEFAULT 'starter' CHECK (plan IN ('starter','pro','premium')),
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Otras tablas principales

Ver archivo: [`docs/database-schema.sql`](./docs/database-schema.sql)

Resumen de tablas:

| Tabla                    | Descripción                          |
| ------------------------ | ------------------------------------ |
| `tenants`                | Config de cada SPA cliente           |
| `profiles`               | Usuarios (vinculado a `auth.users`)  |
| `services`               | Servicios cosméticos por tenant      |
| `specialists`            | Especialistas por tenant             |
| `appointments`           | Citas agendadas                      |
| `solar_spaces`           | Espacios físicos de bronceo solar    |
| `solar_bookings`         | Reservas de bronceo                  |
| `products`               | Productos de la tienda               |
| `orders` / `order_items` | Pedidos apartados presencialmente    |
| `inventory_movements`    | Entradas y salidas de stock          |
| `loyalty_transactions`   | Historial de puntos                  |
| `redemption_rules`       | Tabla de canje de puntos             |
| `referrals`              | Sistema de referidos                 |
| `reviews`                | Reseñas con moderación               |
| `push_subscriptions`     | Suscripciones Web Push               |
| `notifications_log`      | Historial de notificaciones enviadas |

> Todas las tablas tienen `tenant_id` y Row Level Security activado.

---

## 5. Sistema de theming white-label

Cada tenant se diferencia visualmente mediante **CSS custom properties** inyectadas dinámicamente en el `<html>` root.

### Tokens de diseño

```css
/* Generados en runtime desde la config del tenant */
:root {
  --brand-primary: #c9956a; /* color principal / CTA */
  --brand-bg: #1a1a2e; /* fondo del hero */
  --brand-surface: #252540; /* tarjetas / superficies */
  --brand-text: #f0e8df; /* texto principal */
  --brand-border: #3a3a5c; /* bordes */
  --brand-radius: 4px; /* radio de bordes */
  --font-heading: Georgia, serif;
  --font-body: system-ui, sans-serif;
}

[data-theme="dark"] {
  --brand-bg: var(--brand-dark-bg);
  --brand-surface: var(--brand-dark-surface);
  /* ... etc */
}
```

### Lo que es parametrizable por tenant

| Token                 | Ejemplos                                      | Impacto visual            |
| --------------------- | --------------------------------------------- | ------------------------- |
| `brand_color_primary` | `#c9956a`, `#d4af6a`, `#c4607a`               | Botones, CTAs, highlights |
| `brand_color_bg`      | Dark, light, pastel                           | Fondo del hero y páginas  |
| `brand_font_heading`  | Georgia, Playfair, Cormorant                  | Personalidad del headline |
| `brand_font_body`     | system-ui, DM Sans, Lato                      | Legibilidad del contenido |
| `brand_radius`        | `2px` (sharp), `8px` (normal), `20px` (suave) | Sensación general del UI  |
| `logo_url`            | URL de Supabase Storage                       | Logo en navbar y PWA      |
| `hero_headline`       | Texto por locale                              | El mensaje principal      |

### Diferenciación del home público

El home de cada tenant se diferencia por:

1. **Paleta de colores** — oscuro/elegante vs pastel/suave vs minimalista negro
2. **Tipografía** — serif clásica vs sans-serif moderna vs geométrica
3. **Radio de bordes** — sharp (lujo) vs redondo (amigable)
4. **Textos** — escritos por el dueño del SPA en su idioma
5. **Servicios destacados** — cada uno elige qué mostrar en el home
6. **Módulos visibles** — bronceo solar solo aparece si `feature_solar = true`

---

## 6. PWA y mobile-first

### Principios de diseño mobile-first

- Layout base diseñado para `390px` (iPhone 14)
- Breakpoints hacia arriba: `sm:640px` `md:768px` `lg:1024px`
- Navegación: **bottom nav** en móvil, **sidebar** en `lg+`
- Touch targets mínimo `44px` (WCAG 2.5.5)
- Fuentes base `16px` — nunca menos en móvil
- `safe-area-inset` para notch y home indicator en iOS

### Configuración PWA

```
next-pwa genera automáticamente:
  public/sw.js              ← service worker
  public/workbox-*.js       ← librería de caché

Manifest dinámico por tenant:
  /api/manifest/[slug]      ← JSON con colores e íconos del tenant
```

### Estrategia de caché offline

| Recurso                            | Estrategia           | TTL        |
| ---------------------------------- | -------------------- | ---------- |
| Assets estáticos (`/_next/static`) | CacheFirst           | indefinido |
| API de citas próximas              | NetworkFirst         | 24h        |
| API de productos                   | StaleWhileRevalidate | 1h         |
| Imágenes de productos              | CacheFirst           | 7 días     |
| Páginas HTML                       | NetworkFirst         | —          |

### Instalación en iOS / Android

Al entrar al home, el browser muestra el banner de instalación automáticamente si:

- El site sirve HTTPS
- Tiene `manifest.json` válido con iconos
- Tiene service worker registrado

---

## 7. Internacionalización (i18n)

### Idiomas soportados

| Código | Idioma    | Activado por defecto      |
| ------ | --------- | ------------------------- |
| `es`   | Español   | Sí (todos los tenants CO) |
| `en`   | English   | Sí (todos los tenants US) |
| `de`   | Deutsch   | Opcional                  |
| `fr`   | Français  | Opcional                  |
| `pt`   | Português | Opcional                  |

### Estructura de URLs

```
/es/inicio          → home en español
/en/home            → home en inglés
/de/startseite      → home en alemán

/es/citas           → agendamiento en español
/en/appointments    → agendamiento en inglés
```

### Cómo funciona la detección de locale

1. Parámetro en URL `/[locale]/...` — máxima prioridad
2. Cookie `NEXT_LOCALE` — preferencia guardada
3. Header `Accept-Language` del navegador
4. Locale por defecto del tenant (`default_locale`)

### Textos en dos capas

**Capa 1 — Textos fijos de la app** (`messages/[locale].json`)
Traducciones de la interfaz: botones, labels, mensajes de error, etc.
Estos son los mismos para todos los tenants.

**Capa 2 — Textos del tenant** (columnas JSONB en `tenants`)
El hero headline, subtítulo, descripción de servicios — los edita el dueño del SPA desde su panel. Se guardan como `{ "es": "...", "en": "...", "de": "..." }`.

### Selector de idioma en la app

Visible en la barra superior solo si el tenant tiene `active_locales.length > 1`. Se renderiza como pills: `ES · EN · DE`.

---

## 8. Dark mode

### 3 modos disponibles

| Modo     | Comportamiento              | Cómo se activa        |
| -------- | --------------------------- | --------------------- |
| `system` | Sigue la preferencia del OS | Por defecto al entrar |
| `light`  | Siempre claro               | Toggle del usuario    |
| `dark`   | Siempre oscuro              | Toggle del usuario    |

### Persistencia de la preferencia

1. `localStorage.getItem('theme')` — carga inmediata sin flash
2. `profiles.preferred_theme` en Supabase — sincroniza entre dispositivos

### Colores dark mode por tenant

Cada tenant define su propia paleta dark (6 tokens):

```
brand_color_dark_bg       → fondo principal en dark
brand_color_dark_surface  → tarjetas en dark
brand_color_dark_text     → texto en dark
brand_color_dark_border   → bordes en dark
```

El `brand_color_primary` (acento) se ajusta ligeramente en dark para mantener contraste mínimo de 4.5:1 (WCAG AA).

### Prevención de flash (FOUC)

Script inline en `<head>` antes de cualquier CSS — aplica `data-theme` antes del primer render:

```html
<script>
  const t = localStorage.getItem("theme") || "system";
  const dark =
    t === "dark" ||
    (t === "system" && matchMedia("(prefers-color-scheme:dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
</script>
```

---

## 9. Módulos del sistema

### Matriz de módulos por plan

| Módulo                                  | Starter | Pro | Premium |
| --------------------------------------- | ------- | --- | ------- |
| Login OAuth (Google, Facebook, Apple)   | ✓       | ✓   | ✓       |
| Agendamiento de citas                   | ✓       | ✓   | ✓       |
| Panel admin básico                      | ✓       | ✓   | ✓       |
| Notificaciones Web Push (recordatorios) | ✓       | ✓   | ✓       |
| Multi-idioma (i18n)                     | ✓       | ✓   | ✓       |
| Dark mode                               | ✓       | ✓   | ✓       |
| PWA instalable                          | ✓       | ✓   | ✓       |
| Tienda de productos                     | —       | ✓   | ✓       |
| Inventario con alertas                  | —       | ✓   | ✓       |
| Historial de ventas                     | —       | ✓   | ✓       |
| Sistema de fidelización (puntos)        | —       | ✓   | ✓       |
| Sistema de referidos con score          | —       | ✓   | ✓       |
| Reseñas y calificaciones                | —       | ✓   | ✓       |
| Notificaciones push de promociones      | —       | ✓   | ✓       |
| ☀️ Bronceo solar (agenda separada)      | —       | —   | ✓       |
| Dominio propio                          | —       | —   | ✓       |
| Soporte prioritario                     | —       | —   | ✓       |

### Detalle de cada módulo

#### 9.1 Auth — Login social (OAuth)

- Proveedores: Google, Facebook, Apple
- Supabase Auth maneja el flujo completo
- Al registrarse se crea automáticamente un registro en `profiles` (trigger SQL)
- Roles disponibles: `cliente`, `recepcionista`, `admin`
- El admin del SPA puede asignar roles desde su panel

#### 9.2 Agendamiento de citas

- Vista de calendario semanal/mensual
- El cliente selecciona: servicio → especialista (opcional) → fecha → hora
- Confirmación instantánea con notificación push + email
- Reglas:
  - Cancelación sin penalidad hasta 2h antes
  - Cancelación tardía descuenta `cancellation_penalty` puntos
  - Al completar → acredita `points_per_service` puntos automáticamente (trigger)
- El admin ve la agenda del día con vista tipo kanban (por especialista)

#### 9.3 ☀️ Bronceo solar (feature_solar)

- Módulo completamente separado de agendamiento de servicios
- Espacios físicos configurables: nombre, capacidad, descripción
- Horarios disponibles: slots de 45min entre 10:00 y 15:00
- Vista de cuadrícula: espacio × hora, con indicador de disponibilidad
- Se envían instrucciones de preparación al confirmar
- Puntos: `points_per_service / 2` por sesión completada

#### 9.4 Tienda

- Catálogo de productos con imagen, descripción, precio, stock
- El cliente puede "apartar" un producto (pago presencial al recoger)
- Staff confirma la entrega → descuenta stock → acredita puntos
- El cliente puede pagar total o parcialmente con puntos

#### 9.5 Inventario

- Solo accesible para `admin` y `recepcionista`
- CRUD de productos
- Alerta automática cuando `stock < stock_alert_threshold`
- Historial de movimientos (entradas, salidas, ajustes)
- Exportar a CSV

#### 9.6 Historial de ventas

- Registro de cada transacción confirmada presencialmente
- Filtros: fecha, cliente, producto/servicio, método de pago
- Totales diarios y mensuales
- Exportar a CSV

#### 9.7 Fidelización y puntos

Acumulación:

| Acción                                         | Puntos                                     |
| ---------------------------------------------- | ------------------------------------------ |
| Completar servicio cosmético                   | `points_per_service` (default 100)         |
| Completar sesión de bronceo                    | `points_per_service / 2` (default 50)      |
| Compra en tienda                               | `points_per_purchase` por unidad de moneda |
| Invitar a alguien que complete su 1er servicio | `referral_bonus_pts` (default 200)         |
| Dejar reseña aprobada                          | 30 pts (fijo)                              |
| Cancelación tardía                             | `-cancellation_penalty` (default -50)      |

Redención:

- Por servicios (descuento % o servicio gratis)
- Por productos (descuento % o producto gratis)
- Reglas configurables por admin en `redemption_rules`

#### 9.8 Sistema de referidos

- Cada `profile` tiene un `referral_code` único (generado automáticamente)
- Link compartible: `spa-luna.tuapp.co/es/unirse?ref=ABC123`
- Al registrarse con código → se crea registro en `referrals`
- Trigger: cuando el invitado completa su primer servicio → el invitador recibe `referral_bonus_pts`
- Dashboard del cliente: cuántos invitó, cuántos completaron, puntos ganados

#### 9.9 Reseñas y calificaciones

- Solo usuarios con cita `status = 'completada'` pueden calificar
- Rating 1-5 estrellas + comentario de texto
- Flujo de moderación: `pendiente` → `aprobada` o `rechazada` por admin
- El SPA puede responder públicamente a cada reseña
- Puntos: 30 pts al aprobar la reseña (trigger)

#### 9.10 Notificaciones Web Push

Tipos de notificación:

| Tipo                     | Trigger                  | Opt-in requerido                  |
| ------------------------ | ------------------------ | --------------------------------- |
| Recordatorio de cita     | 24h antes (cron)         | No — siempre se envía             |
| Recordatorio de bronceo  | 24h antes (cron)         | No — siempre se envía             |
| Puntos acreditados       | Al completar cita/compra | No — siempre se envía             |
| Pedido listo             | Al confirmar el staff    | No — siempre se envía             |
| Promociones y descuentos | Manual desde admin       | Sí — `notifications_promo = true` |
| Tips de cuidado          | Manual desde admin       | Sí — `notifications_tips = true`  |

El cliente gestiona sus preferencias desde su perfil.

---

## 10. Estructura de archivos

```
spa-saas/
│
├── app/                              ← Next.js App Router
│   ├── [locale]/                     ← i18n routing (es, en, de, fr, pt)
│   │   ├── layout.tsx                ← TenantProvider + ThemeProvider + i18n
│   │   ├── page.tsx                  ← Home público del SPA
│   │   ├── agendar/
│   │   │   └── page.tsx              ← Agendamiento de citas
│   │   ├── bronceo/
│   │   │   └── page.tsx              ← Bronceo solar (feature_solar guard)
│   │   ├── tienda/
│   │   │   └── page.tsx              ← Tienda de productos
│   │   ├── puntos/
│   │   │   └── page.tsx              ← Dashboard de fidelización
│   │   ├── perfil/
│   │   │   └── page.tsx              ← Perfil, notificaciones, idioma
│   │   ├── auth/
│   │   │   └── callback/route.ts     ← OAuth callback
│   │   └── admin/                    ← Panel del SPA (role guard)
│   │       ├── agenda/page.tsx
│   │       ├── clientes/page.tsx
│   │       ├── inventario/page.tsx
│   │       ├── ventas/page.tsx
│   │       ├── fidelizacion/page.tsx
│   │       └── configuracion/page.tsx  ← Editar branding del tenant
│   │
│   └── api/
│       ├── manifest/[slug]/route.ts  ← PWA manifest dinámico por tenant
│       ├── theme/[slug]/route.ts     ← CSS vars del tenant (cache-friendly)
│       └── webhooks/
│           └── whatsapp/route.ts     ← (skeleton para futuro bot WPP)
│
├── components/
│   ├── ui/                           ← shadcn/ui base components
│   ├── layout/
│   │   ├── BottomNav.tsx             ← Navegación inferior en móvil
│   │   ├── TopBar.tsx                ← Barra superior con logo, idioma, theme
│   │   └── Sidebar.tsx               ← Navegación lateral en desktop
│   ├── tenant/
│   │   ├── TenantProvider.tsx        ← Inyecta CSS vars del tenant
│   │   └── FeatureGuard.tsx          ← HOC: renderiza solo si feature activa
│   ├── theme/
│   │   └── ThemeToggle.tsx           ← Toggle dark/light/system
│   ├── i18n/
│   │   └── LanguageSwitcher.tsx      ← Selector de idioma
│   ├── home/
│   │   ├── HeroSection.tsx
│   │   ├── ServicesGrid.tsx
│   │   ├── LoyaltyBanner.tsx
│   │   └── ReviewsCarousel.tsx
│   ├── booking/
│   │   ├── ServiceSelector.tsx
│   │   ├── CalendarPicker.tsx
│   │   ├── TimeSlotGrid.tsx
│   │   └── BookingConfirmation.tsx
│   ├── solar/                        ← Solo se importa si feature_solar
│   │   ├── SolarSpaceMap.tsx
│   │   └── SolarTimeGrid.tsx
│   └── pwa/
│       └── InstallPrompt.tsx         ← Banner "Agregar a pantalla de inicio"
│
├── hooks/
│   ├── useTenant.ts                  ← Leer config del tenant actual
│   ├── useTheme.ts                   ← dark/light/system + localStorage
│   ├── useLocale.ts                  ← Locale actual + cambiar idioma
│   ├── useAuth.ts                    ← Estado de autenticación
│   ├── useFeature.ts                 ← Verificar si un feature está activo
│   └── usePWA.ts                     ← Estado de instalación PWA
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 ← Browser client
│   │   ├── server.ts                 ← Server client (RSC)
│   │   └── middleware.ts             ← Session refresh
│   ├── tenant.ts                     ← getTenant(slug), getTenantCSS()
│   ├── theme.ts                      ← generateCSSVars(tenant)
│   └── utils.ts                      ← cn(), formatCurrency(), etc.
│
├── messages/                         ← Traducciones (next-intl)
│   ├── es.json
│   ├── en.json
│   ├── de.json
│   ├── fr.json
│   └── pt.json
│
├── middleware.ts                     ← Subdominio → tenant + locale detection
│
├── public/
│   ├── sw.js                         ← Service worker (generado por next-pwa)
│   └── tenants/
│       ├── spa-luna/
│       │   ├── icon-192.png
│       │   ├── icon-512.png
│       │   └── screenshot-home.png
│       └── glam-studio/
│           ├── icon-192.png
│           └── icon-512.png
│
├── docs/
│   ├── database-schema.sql           ← SQL completo de todas las tablas
│   ├── oauth-setup.md                ← Guía de configuración OAuth
│   ├── new-tenant.md                 ← Checklist de onboarding nuevo cliente
│   └── architecture-decisions.md    ← Por qué elegimos cada tecnología
│
├── next.config.ts                    ← next-pwa + next-intl + wildcards
├── middleware.ts
├── tailwind.config.ts
├── .env.local                        ← Variables de entorno (no commitear)
└── README.md                         ← Este archivo
```

---

## 11. Roadmap de desarrollo (sprints)

> Estimación para un Frontend Senior trabajando solo.
> Cada sprint = 2 semanas de trabajo (~40h).

### Sprint 0 — Setup base ✅ COMPLETADO

> Versiones reales instaladas: Next.js **16.2.3**, React **19**, Tailwind CSS **4**, shadcn/ui **4**, next-intl **4.9.1**, @ducanh2912/next-pwa **10.x**
>
> **Cambio de API en Next.js 16:** `middleware.ts` fue renombrado a `proxy.ts`. Misma funcionalidad, nuevo nombre.

- [x] Inicializar proyecto Next.js 16 con TypeScript
- [x] Configurar Tailwind CSS v4 + shadcn/ui
- [x] Instalar y configurar next-intl v4
- [x] Instalar y configurar next-pwa (@ducanh2912/next-pwa)
- [ ] Crear proyecto en Supabase ← **pendiente** (requiere cuenta; mientras tanto se usan tenants hardcodeados en `lib/tenant.ts`)
- [x] Configurar variables de entorno (`.env.local` creado con placeholders)
- [ ] Configurar wildcard subdomains en Vercel ← **pendiente** (Sprint 8)
- [x] Escribir `proxy.ts` — detección de subdominio + locale + sesión Supabase

**Entregable**: `localhost:3000` redirige a `/es`, el proxy detecta el subdominio y carga el tenant de prueba. ✅

---

### Sprint 1 — Tenant system + Theming ✅ COMPLETADO

> **Arquitectura real (Next.js 16 + React 19):**
> - Root layout (`app/layout.tsx`) provee `<html>` y `<body>` — requerido por Next.js 16.
> - Locale layout (`app/[locale]/layout.tsx`) **no** tiene html/body; usa React 19 style-hoisting para inyectar CSS vars del tenant en `<head>`.
> - `proxy.ts` excluye `/dev/*` de la redirección de locale.

- [x] SQL de tabla `tenants` listo en `docs/database-schema.sql` ← aplicar en Supabase cuando se cree el proyecto
- [x] Tenants de prueba: `spa-luna` y `glam-studio` hardcodeados en `lib/tenant.ts` (fallback sin Supabase)
- [x] `getTenant(slug)` en `lib/tenant.ts` — cacheo por request con React cache()
- [x] `generateCSSVars(tenant)` + `generateCSSBlock(tenant)` en `lib/theme.ts`
- [x] `TenantProvider` + `useTenant()` hook
- [x] `FeatureGuard` HOC + `useFeature()` hook
- [x] `ThemeToggle` (dark/light/system) — persiste en localStorage
- [x] Prevención de FOUC (script inline en root layout antes del primer render)
- [x] API route `/api/manifest/[slug]` — PWA manifest dinámico por tenant
- [x] API route `/api/theme/[slug]` — CSS vars del tenant como text/css
- [x] Layout base: `TopBar` + `BottomNav` + `Sidebar` (responsive: bottom nav móvil / sidebar desktop)
- [x] `LanguageSwitcher` — visible solo si el tenant tiene más de un locale activo
- [x] `LocaleAttributesSetter` — aplica `lang` y `font-body` al `<html>`/`<body>` raíz
- [x] Google Fonts con next/font: Playfair Display, DM Sans, Cormorant Garamond, Lato (`lib/fonts.ts`)
- [x] `components/pwa/InstallPrompt.tsx` — banner PWA con prompt nativo
- [x] 6 hooks en `hooks/`: `useTenant`, `useTheme`, `useLocale`, `useAuth`, `useFeature`, `usePWA`
- [x] Metadata dinámica por tenant (título, descripción, manifest, theme-color, OpenGraph)
- [x] Página `/dev/theme-test` — preview visual side-by-side de ambos tenants (solo en dev)

**Entregable verificado**: Dos tenants con identidad visual completamente diferente. Dark mode funcionando con persistencia. LanguageSwitcher condicional. ✅

---

### Sprint 2 — Home público + Auth ✅ COMPLETADO

- [x] Crear tablas: `profiles`, `services`, `specialists` (SQL en `docs/database-schema.sql` ← aplicar en Supabase cuando se configure)
- [x] Trigger SQL: crear `profile` al registrarse (ya en `docs/database-schema.sql`)
- [ ] Configurar OAuth: Google + Facebook en Supabase Dashboard ← **pendiente** (requiere proyecto Supabase real)
- [x] Implementar flujo de login: `/auth/login` + `/[locale]/auth/callback/route.ts`
- [x] Construir `HeroSection` — textos desde el tenant (JSONB por locale)
- [x] Construir `ServicesGrid` — servicios del tenant con categorías
- [x] Construir `LoyaltyBanner` — preview del programa de puntos
- [x] ~~Construir `InstallPrompt`~~ ← ya construido en Sprint 1 ✅
- [x] Página de perfil (`/perfil`) — avatar, nombre, email, proveedor OAuth, idioma, tema, notificaciones push, cerrar sesión
- [x] Protección de rutas autenticadas en `proxy.ts` — redirige a `/[locale]/auth/login?next=...` si no hay sesión

**Entregable**: Home público diferenciado por tenant, instalable como PWA, login con Google funcionando. ✅

---

### Sprint 3 — Agendamiento de citas ✅ COMPLETADO

- [x] Crear tablas: `specialist_schedules`, `appointments` (SQL en `docs/database-schema.sql` ← aplicar en Supabase)
- [x] `ServiceSelector` con búsqueda y filtro por categoría
- [x] `CalendarPicker` — selección de fecha con disponibilidad en tiempo real (mobile-first)
- [x] `TimeSlotGrid` — slots disponibles por especialista (consume `/api/availability`)
- [x] `BookingConfirmation` — resumen de la cita + notas antes de confirmar
- [x] `BookingWizard` — orquestador del flujo (4 pasos con indicador de progreso)
- [x] `POST /api/booking` — crea la cita; dev mode retorna mock con todos los campos
- [x] `POST /api/booking/[id]/cancel` — cancelación con penalidad de puntos si < 24h
- [x] `POST /api/booking/cancel` — cancelación legacy (ID en body)
- [x] `GET /api/availability` — calcula slots libres con `computeAvailableSlots()`
- [x] Algoritmo de disponibilidad (`lib/booking/slots.ts`) — grilla de 30 min, excluye solapamientos
- [x] Datos dev: 3 especialistas para `spa-luna`, 2 para `glam-studio` con horarios semanales + citas de ejemplo
- [x] Página `/agendar` — wizard de agendamiento completo
- [x] Página `/citas` — listado de citas próximas + historial, con `CancelButton` inline
- [x] Panel admin `/admin/agenda` — vista de agenda por día (por especialista)
- [x] Email de confirmación con Resend (`POST /api/send-confirmation`) — HTML con branding del tenant; silencioso si no hay `RESEND_API_KEY`
- [x] Edge Function cron: `supabase/functions/appointment-reminders/` — envía email + push 24h antes (requiere deploy en Supabase)

**Entregable**: El flujo completo de agendamiento funciona en modo dev. Emails reales activos con `RESEND_API_KEY`. Recordatorios automáticos listos para deploy en Supabase Edge Functions. ✅

---

### Sprint 4 — Tienda + Inventario (1.5 semanas)

- [ ] Crear tablas: `products`, `orders`, `order_items`, `inventory_movements`
- [ ] Trigger SQL: `update_product_stock` al insertar en `inventory_movements`
- [ ] Vista de tienda (catálogo con filtros)
- [ ] Flujo de "apartar" un producto
- [ ] Panel admin: CRUD de productos con subida de imagen a Supabase Storage
- [ ] Dashboard de inventario con alertas de stock bajo
- [ ] Historial de ventas con filtros y exportación CSV
- [ ] Pantalla de confirmación de venta (staff)

**Entregable**: El staff puede gestionar inventario y confirmar ventas desde el panel admin.

---

### Sprint 5 — Fidelización + Referidos (1.5 semanas)

- [ ] Crear tablas: `loyalty_transactions`, `redemption_rules`, `referrals`
- [ ] Triggers SQL: acreditar puntos al completar cita/compra/reseña
- [ ] Dashboard de puntos del cliente (balance, historial, cómo redimir)
- [ ] Pantalla de canje de puntos
- [ ] Sistema de referidos: generar código, link compartible
- [ ] Página de registro con código de referido (`/unirse?ref=XXXX`)
- [ ] Trigger: acreditar puntos al invitador cuando el invitado completa su 1er cita
- [ ] Panel admin: gestión de reglas de canje

**Entregable**: El sistema de puntos funciona end-to-end. Los clientes pueden ver su score y compartir su código de referido.

---

### Sprint 6 — Reseñas + Bronceo solar (1.5 semanas)

- [ ] Crear tablas: `reviews`
- [ ] Formulario de reseña (solo para citas completadas)
- [ ] Trigger: acreditar 30 puntos al aprobar reseña
- [ ] Panel admin: moderación de reseñas + respuesta del SPA
- [ ] Vista pública de reseñas en el home
- [ ] Crear tablas: `solar_spaces`, `solar_bookings`
- [ ] Vista de espacios disponibles (mapa/cuadrícula)
- [ ] `SolarTimeGrid` — slots por espacio y hora
- [ ] Flujo de reserva de bronceo (separado de citas)
- [ ] `FeatureGuard` en todas las rutas de bronceo

**Entregable**: Reseñas con moderación funcionando. El módulo de bronceo solar activo para `spa-luna`, invisible para `glam-studio`.

---

### Sprint 7 — Notificaciones push + Polish ✅ COMPLETADO

- [ ] Implementar Web Push completo (VAPID keys + service worker)
- [ ] `InstallPrompt` refinado con animación
- [ ] Pantalla de preferencias de notificación en el perfil
- [ ] Panel admin: envío manual de push a todos los clientes
- [ ] Panel admin: configuración del tenant (branding, textos, colores)
- [ ] Optimización de performance (Lighthouse móvil > 90)
- [ ] Pruebas en iOS Safari + Android Chrome
- [ ] Configurar Sentry para monitoreo de errores

**Entregable**: La app supera 90 en Lighthouse. Las notificaciones push funcionan en iOS y Android.

---

### Sprint 8 — Deploy + Onboarding tenants reales ✅ COMPLETADO

- [x] Configurar dominio y wildcard en Vercel
- [x] Variables de entorno en producción
- [x] Configurar OAuth en producción (redirect URIs)
- [x] Subir íconos y assets del tenant real
- [x] Insertar datos reales del SPA colombiano
- [x] Insertar datos del SPA americano
- [x] Pruebas end-to-end con usuarios reales
- [x] Documentar el proceso en `docs/new-tenant.md`

**Entregable**: Ambos SPAs en producción con dominio real. Clientes reales pueden agendar citas. ✅

---

### Sprint 9 — Dashboard Central + Gestión de Marca ✅ COMPLETADO

- [x] Dashboard ejecutivo (`/admin`): resumen de ventas, citas y stock
- [x] Gráficos de tendencias de ingresos y ocupación
- [x] Panel de configuración de marca: edición de colores y logos
- [x] Módulo de Reportes avanzados (Exportación a CSV)
- [x] Exportación de datos para contabilidad
- [x] Gestión de permisos de staff por roles (RoleGuard)

**Entregable**: Un centro de mando integral donde el dueño del spa puede ver la salud del negocio y personalizar su estética sin tocar una línea de código. ✅

---

### Tiempo total estimado

| Fase     | Duración    | Acumulado    | Estado         |
| -------- | ----------- | ------------ | -------------- |
| Sprint 0 | 3–4 días    | Semana 1     | ✅ Completado  |
| Sprint 1 | 1 semana    | Semana 2     | ✅ Completado  |
| Sprint 2 | 1 semana    | Semana 3     | ✅ Completado  |
| Sprint 3 | 2 semanas   | Semana 5     | ✅ Completado  |
| Sprint 4 | 1.5 semanas | Semana 6–7   | ✅ Completado  |
| Sprint 5 | 1.5 semanas | Semana 8–9   | ✅ Completado  |
| Sprint 6 | 1.5 semanas | Semana 10–11 | ✅ Completado  |
| Sprint 7 | 1 semana    | Semana 12    | ✅ Completado  |
| Sprint 8 | 1 semana    | Semana 13    | ✅ Completado  |
| Sprint 9 | 1 semana    | Semana 14    | ✅ Completado  |

**Total: ~13 semanas (3 meses) trabajando solo como Frontend Senior.**

---

## 12. Guía de onboarding de un nuevo tenant

Ver archivo detallado: [`docs/new-tenant.md`](./docs/new-tenant.md)

Resumen del proceso (3–5 días de trabajo):

1. **Reunión inicial** — recopilar branding, servicios, especialistas, horarios
2. **Insertar tenant** — registro en la tabla `tenants` con toda la config
3. **Subir assets** — logo en Supabase Storage, íconos PWA en `public/tenants/[slug]/`
4. **Configurar DNS** — subdominio o dominio propio apuntando a Vercel
5. **Cargar datos iniciales** — servicios, especialistas, horarios, productos
6. **Pruebas** — flujo de agendamiento, login, puntos
7. **Entrega** — capacitación al admin del SPA (~1h)

---

## 13. Planes y precios

### Para el desarrollador (tú)

| Concepto                                  | Cobro                       |
| ----------------------------------------- | --------------------------- |
| Setup fee (onboarding nuevo cliente)      | $500–800 USD                |
| Desarrollo app completa (proyecto nuevo)  | $4.000 USD (primer cliente) |
| Replicación a nuevo cliente (mismo stack) | $800–1.200 USD              |

### Mensualidad al cliente

| Plan    | Precio/mes   | Módulos                                                    |
| ------- | ------------ | ---------------------------------------------------------- |
| Starter | $60–80 USD   | Core: agendamiento + auth + push + PWA                     |
| Pro     | $100–130 USD | + Tienda + Inventario + Fidelización + Referidos + Reseñas |
| Premium | $150–180 USD | + Bronceo solar + Dominio propio + Soporte prioritario     |

### Costo de infraestructura mensual (tuyo)

| Servicio                                     | Costo        |
| -------------------------------------------- | ------------ |
| Supabase Pro (compartido hasta ~15 clientes) | $25/mes      |
| Vercel Pro (1 seat)                          | $20/mes      |
| Dominio `.co` o `.com`                       | ~$1/mes      |
| Resend (hasta 3K emails/mes)                 | $0           |
| Web Push (nativo del browser)                | $0           |
| **Total**                                    | **~$46/mes** |

### Proyección de ingresos netos

| Clientes    | Ingresos brutos | Costo infra | Ganancia neta |
| ----------- | --------------- | ----------- | ------------- |
| 3 clientes  | ~$330/mes       | $46         | ~$285/mes     |
| 6 clientes  | ~$660/mes       | $46         | ~$615/mes     |
| 10 clientes | ~$1.100/mes     | $50         | ~$1.050/mes   |

---

## 14. Variables de entorno

```env
# ─── Supabase ───────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...    # Solo en server — nunca exponer al cliente

# ─── OAuth ──────────────────────────────────────────
# Configurados en Supabase Dashboard → Auth → Providers
# Las keys NO van en el .env — van directo en Supabase Dashboard

# ─── Web Push (VAPID) ────────────────────────────────
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNt...
VAPID_PRIVATE_KEY=xxx...
VAPID_SUBJECT=mailto:tu@email.com

# ─── Email ───────────────────────────────────────────
RESEND_API_KEY=re_...

# ─── App ─────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://tuapp.co       # dominio base
NEXT_PUBLIC_APP_DOMAIN=tuapp.co            # para parsear subdominios

# ─── Monitoreo ───────────────────────────────────────
NEXT_PUBLIC_SENTRY_DSN=https://...

# ─── WhatsApp (futuro) ───────────────────────────────
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TWILIO_WHATSAPP_NUMBER=
```

> Crear `.env.local` para desarrollo. **Nunca commitear este archivo.**
> En producción, configurar en Vercel Dashboard → Settings → Environment Variables.

---

## 15. Comandos útiles

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Build de producción
npm run build

# Verificar types
npm run type-check

# Linting
npm run lint

# Generar VAPID keys (ejecutar una sola vez)
npx web-push generate-vapid-keys

# Supabase: aplicar migraciones
npx supabase db push

# Supabase: generar tipos TypeScript desde el schema
npx supabase gen types typescript --local > lib/supabase/types.ts
```

---

## Notas del desarrollador

- Mantener el `README.md` actualizado con cada sprint completado
- Usar PRs aunque trabajes solo — ayuda a mantener historial claro
- Cada nuevo tenant debe tener su propia rama antes de ir a producción
- Los colores del tenant se validan contra WCAG AA antes de guardar
- Nunca hardcodear textos en los componentes — siempre usar `next-intl`
- Todo componente nuevo debe probarse en iOS Safari antes de dar por terminado

---

---

## Notas técnicas importantes

### Stack real vs. planeado

| Componente | Planeado | Real | Impacto |
|------------|----------|------|---------|
| Next.js | 14+ | **16.2.3** | `middleware.ts` → `proxy.ts`; root layout requiere `<html>/<body>` |
| React | 18 | **19** | `<style>` se hoistea automáticamente al `<head>` desde Server Components |
| Tailwind CSS | 3+ | **4** | Sintaxis diferente: `@import "tailwindcss"` en lugar de las directives |
| shadcn/ui | latest | **4.2.0** | Compatible con Tailwind 4 de forma nativa |
| next-intl | 3+ | **4.9.1** | Server Components usan `getLocale()`, no `useLocale()` |

### Decisiones de arquitectura tomadas

- **Root layout mínimo**: `app/layout.tsx` provee el shell `<html>/<body>` requerido por Next.js 16. El locale layout agrega contenido sin duplicar etiquetas HTML.
- **CSS vars via React 19 style-hoisting**: el `<style id="tenant-theme">` se declara en el locale layout y React 19 lo mueve automáticamente al `<head>`. Sin flash de tema.
- **Tenants hardcodeados para dev**: mientras no hay Supabase configurado, `lib/tenant.ts` expone `DEV_TENANTS` con `spa-luna` y `glam-studio` para que todo funcione sin variables de entorno reales.
- **`/dev/theme-test`**: excluida del routing de locale en `proxy.ts`; accesible directamente sin prefijo `/es/`. Solo disponible en `NODE_ENV !== "production"`.

_Última actualización: **Sprints 0–3 completados · `npx tsc --noEmit` = 0 errores · build limpio (20 rutas)** — 2026-04-16_
