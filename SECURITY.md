# Política de Seguridad

## Reporte de vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, por favor no la reportes en issues públicos.

En su lugar:
- Reporta por **GitHub Security Advisories** (si está habilitado en el repositorio) o contacta al mantenedor por un canal privado acordado.
- Incluye pasos de reproducción, impacto estimado, y evidencia mínima necesaria.
- Si el reporte incluye un secreto expuesto, indica si ya fue rotado o si necesita rotación inmediata.

## Alcance

Este repositorio incluye:
- Endpoints server-side (Next.js App Router) que integran Google OAuth, Google Tasks y Google Calendar.
- Código cliente para UI de productividad.

Riesgos principales:
- Exposición de secretos (OAuth client secret, cookies/encryption secret, tokens).
- Logs que incluyan datos de usuario (títulos de tareas/eventos, IDs, fechas).

## Manejo de secretos

- No se aceptan credenciales hardcodeadas en el repositorio.
- Todos los secretos deben vivir en variables de entorno del runtime (por ejemplo, Vercel/hosting).
- Archivos `.env*` se consideran sensibles y no deben ser commitados.

Variables esperadas:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

## Rotación y respuesta a incidentes

Si un secreto fue expuesto (en cualquier branch, PR, release o historial):
- Rota inmediatamente el secreto en el proveedor (Google, GitHub, etc.).
- Invalida tokens/sesiones cuando aplique.
- Elimina el secreto del historial con herramientas de reescritura (ver sección “Limpieza de historial”).
- Fuerza push con cuidado y coordina con colaboradores.

## Limpieza de historial (cuando aplique)

Si se detecta un secreto en el historial Git, se recomienda:
- Preferir `git filter-repo` (más seguro y mantenido que `git filter-branch`).
- Alternativa: BFG Repo-Cleaner.

Después de reescribir historial:
- Ejecutar garbage collection local.
- Forzar actualización del remoto (`--force-with-lease`) en todas las ramas afectadas.
- Validar que no quede rastro en tags/releases.
