# GlowOS — Plataforma SaaS para Spas y Centros de Bienestar

## La idea de negocio

**GlowOS** es un SaaS multi-tenant diseñado exclusivamente para spas, centros de estética y bienestar. No es una herramienta genérica de agendamiento: es una plataforma pensada desde el primer día para los flujos reales de este negocio — tratamientos de múltiples sesiones, equipos pequeños, clientes frecuentes y la necesidad de que la dueña tenga control total sin depender de un técnico.

---

## A quién va dirigido

### Dueña / Propietaria
- Quiere ver todo el negocio de un vistazo: qué pasa hoy, esta semana, quién está ocupada.
- Necesita crear y eliminar trabajadoras, asignarles servicios, ver sus calendarios.
- Quiere que sus clientes tengan una experiencia bonita y profesional, no un link de WhatsApp.
- No tiene tiempo para capacitar a nadie en software complicado.

### Trabajadoras / Especialistas
- Solo necesitan saber qué tienen hoy y mañana.
- No deben poder cambiar citas, mover horarios ni ver datos sensibles de otras.
- Acceso simple: entro, veo mi agenda, listo.

### Clientas
- Quieren agendar desde el celular en 2 minutos, a cualquier hora.
- Quieren recordatorios, no tener que llamar a preguntar si su cita está confirmada.
- Si tienen tratamiento de varias sesiones, quieren ver cuántas llevan y cuántas faltan.
- El programa de puntos las incentiva a regresar.

---

## Flujos clave que resuelve

| Problema real | Cómo lo resuelve GlowOS |
|---|---|
| "¿A qué hora tengo libre a Valentina el viernes?" | Vista de agenda por especialista con drag & drop |
| "Mi clienta lleva 4 de 6 sesiones de lifting" | Tratamientos multi-sesión con progreso visible |
| "Se me olvidó confirmar las citas de mañana" | Cron de recordatorios 24h automático por email + push |
| "Quiero que mis clientas agenden solas" | App PWA instalable, booking en 3 pasos |
| "Necesito agregar a mi nueva empleada" | Panel admin: crear usuario con rol y especialidad en <1 min |
| "Mi clienta quiere ver su calendario en iPhone" | Sincronización con Google Calendar y Apple Calendar (iCal) |
| "¿Cuántos puntos tiene esta clienta?" | Balance de puntos en tiempo real, canjeable desde la app |

---

## GlowOS vs AgendaPRO

| Característica | **GlowOS** | **AgendaPRO** |
|---|---|---|
| **Enfoque** | Spas y estética | Genérico (médicos, coaches, salones) |
| **Roles diferenciados** | Dueña / Trabajadora / Cliente | Solo admin y cliente |
| **Tratamientos multi-sesión** | ✅ Con progreso y alertas | ❌ Cada cita es independiente |
| **Calendario propio integrado** | ✅ Vista de equipo + personal | ⚠️ Solo lista de citas |
| **Sincronización Google/Apple** | ✅ iCal feed + OAuth | ⚠️ Google Calendar básico |
| **Programa de puntos** | ✅ Puntos por cita, compra y referido | ❌ No incluido |
| **Tienda de productos** | ✅ Catálogo con reserva | ❌ No incluido |
| **Bronceo solar (sesiones UV)** | ✅ Módulo dedicado con contador | ❌ No incluido |
| **Multi-tenant / multi-sucursal** | ✅ Por subdominio | ⚠️ Limitado |
| **PWA instalable** | ✅ App nativa sin App Store | ❌ Solo web |
| **Precio** | Desde $0 (free tier) | Desde $29/mes |
| **Setup** | <30 min self-service | Requiere onboarding pagado |
| **Personalización de marca** | ✅ Logo, colores, tipografía | ⚠️ Templates fijos |
| **Idiomas** | ✅ ES + EN nativo | ⚠️ Solo idioma base |
| **Open source / exportable** | ✅ Datos siempre tuyos | ❌ Vendor lock-in |

---

## Clientes activos

| Spa | País | Moneda | Plan | Estado |
|---|---|---|---|---|
| **Channel Spa** | Colombia 🇨🇴 | COP | Premium | Activo — servicios en proceso de carga |
| **Gio Spa** | USA 🇺🇸 | USD | Starter | Activo — servicios en proceso de carga |
| **Glow Studio by Fabiana Madrigal** | Colombia 🇨🇴 | COP | Premium Plus | POC completo — tenant de demostración |

> Logos pendientes — se instalarán cuando los clientes los envíen.  
> Servicios de Channel Spa y Gio Spa son placeholder hasta recibir la lista oficial.

---

## Modelo de negocio

Los spas pagan desde el primer mes. No hay plan free.

```
Starter       → 3 trabajadoras, tienda, programa de puntos,
                calendario personal + iCal sync,
                tratamientos multi-sesión,
                recordatorios automáticos (email + push)    → $19/mes

Premium       → 10 trabajadoras,
                calendario del equipo, gestión de usuarios,
                inventario, historial de ventas,
                reseñas y calificaciones                    → $39/mes

Premium Plus  → Todo Premium + dominio propio,
                branding 100% personalizado,
                soporte prioritario,
                multi-sucursal                              → $79/mes
```

### Add-ons (se contratan por separado, cualquier plan)

```
☀️  Módulo de Bronceo Solar   → contador de sesiones UV, alertas,
                                historial por cabina          → $9/mes

🤖  Chatbot IA (WPP / Telegram) → asistente con IA que aprende de
                                  conversaciones pasadas, escala al
                                  dueño ante dudas nuevas y logea
                                  todo para no fallar dos veces.
                                  Canal: WhatsApp o Telegram
                                  (WPP requiere número verificado
                                  y tiene mayor costo de API)
                                  Integración via n8n            → $25/mes
                                  ⚠️ PENDIENTE DE DESARROLLO

📋  Arma tu plan              → constructor de plan personalizado:
                                el cliente selecciona módulos
                                à la carte                    → precio dinámico
                                ⚠️ PENDIENTE DE DESARROLLO
```

> **¿Por qué solar es add-on y no parte del plan?**  
> No todos los spas tienen camas UV. Es un equipo especializado que no tiene
> sentido cobrar a quien no lo usa. Se activa por tenant bajo demanda.

> **¿Por qué el chatbot es add-on?**  
> El canal (WPP vs Telegram) varía por cliente y tiene costos de API muy
> distintos. Se contrata individualmente con configuración personalizada.

---

## Roadmap de producto

### ✅ Sprint 1-2 — Base
- Multi-tenant con subdominio
- Branding por tenant (colores, fuentes, logo)
- Booking en 3 pasos
- Módulo de puntos
- Tienda básica

### ✅ Sprint 3 — Notificaciones
- Email de confirmación (Resend)
- Edge Function de recordatorios 24h
- Página `/citas` del cliente

### ✅ Sprint 4 — Roles y Calendario
- Roles: dueña (`admin`) / trabajadora / recepcionista / cliente
- Panel de gestión de usuarias con invite por email
- Calendario semanal propio para clientes y trabajadoras (read-only)
- Calendario de equipo con filtro por especialista y colores
- Sincronización Google Calendar / Apple Calendar (feed iCal privado)
- Tratamientos multi-sesión: `TreatmentPlan` + `TreatmentSession` + barra de progreso
- Módulo de bronceo convertido a **add-on** separado

### 🔜 Sprint 5 — Primeros clientes reales
- Cargar servicios reales de Channel Spa y Gio Spa
- Subir logos de ambos spas
- Migración de datos en Supabase
- Tests de booking end-to-end con usuarios reales

### 🔜 Sprint 6 — Monetización
- Stripe para planes Starter/Premium/Premium Plus
- Add-on Bronceo Solar vía Stripe ($9/mes)
- Portal de facturación self-service
- Límites por plan (cuota de citas, trabajadoras)

### 🔜 Sprint 7 — Crecimiento
- Sistema de reseñas con aprobación y respuesta del spa
- Analytics para la dueña (ingresos, ocupación, retención, NPS)
- Referidos con link único y tracking

### 🔜 Sprint 8 — Chatbot IA + Arma tu plan ⚠️ PENDIENTE
- Chatbot IA via n8n (WPP o Telegram a elección del cliente)
  - Aprende de conversaciones pasadas
  - Escala al dueño en situaciones desconocidas
  - Log de fallos para aprendizaje continuo
- "Arma tu plan" — constructor de plan personalizado (módulos à la carte)
