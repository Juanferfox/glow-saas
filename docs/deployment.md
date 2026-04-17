# Guía de Despliegue en Producción

Este documento describe los pasos para desplegar la plataforma `spa-saas` en un entorno de producción utilizando Vercel y Supabase.

## 1. Requisitos Previos

- Una cuenta en [Vercel](https://vercel.com).
- Un proyecto en [Supabase](https://supabase.com).
- Un dominio registrado (ej: `spa-saas.com`).

## 2. Configuración de Supabase

1. Ejecuta el archivo `docs/database-schema.sql` en el SQL Editor de Supabase.
2. Configura los **Auth Providers**:
   - Activa Google OAuth.
   - Configura las URIs de redirección: `https://*.spa-saas.com/auth/callback`.
3. Configura las políticas de **Storage**:
   - Crea un bucket público llamado `logos`.
   - Permite lectura pública a todos.

## 3. Configuración en Vercel

### Variables de Entorno

Añade las siguientes variables en el Dashboard de Vercel:

| Variable | Valor |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Tu URL de proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tu Anon Key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Tu Service Role Key (¡Mantenla secreta!) |
| `NEXT_PUBLIC_APP_DOMAIN` | `spa-saas.com` |
| `NODE_ENV` | `production` |

### Dominios Wildcard

Para que los subdominios funcionen automáticamente:

1. En Vercel, ve a **Settings > Domains**.
2. Añade `*.spa-saas.com`.
3. Sigue las instrucciones para configurar el registro CNAME en tu proveedor de DNS.

## 4. Despliegue (CI/CD)

La plataforma está configurada para desplegarse automáticamente al hacer push a la rama `master` o `main`.

```bash
git push origin master
```

## 5. Verificación Post-Despliegue

1. Accede a `spa-luna.spa-saas.com`.
2. Verifica que el logo y colores correspondan al tenant "Luna".
3. Prueba el flujo de agendamiento y el login.
4. Valida que el archivo `manifest.json` dinámico devuelva los datos correctos del tenant.
