# Changelog

## [0.4.0] - 2026-04-15

### Features

- Reproductor de SFX robusto para Pomodoro con precarga, verificación de disponibilidad y reintentos automáticos en fallos de reproducción inicial.
- Integración de eventos de fase para disparar sonidos de forma consistente: `star.wav` al iniciar foco, `break.wav` en descansos, y `large-break.wav` en descansos largos.
- Nueva opción de duración de foco de **40 minutos** integrada en la UI y en la lógica de transición del temporizador.
- Integración de controles de seguridad del repositorio: escaneo de secretos en pre-commit y documentación de reporte de vulnerabilidades.

### Fixes

- Corrección de condiciones de carrera entre transición de estados del temporizador y disparo de efectos de audio.
- Corrección del ducking de audio ambiental para restablecer volumen correctamente incluso ante errores de reproducción.
- Sanitización de logs en endpoints para evitar exposición de datos sensibles en producción.
- Actualización de dependencias para resolver vulnerabilidades reportadas por `npm audit`.

### Breaking Changes

- No se identifican breaking changes en esta versión.

### Enlaces de commits relevantes

- [Commit base anterior `19f638c`](https://github.com/leotinoco/pomodoro-chibcha-app/commit/19f638c071cdc62858152ea1a7a9c44d09825400)
- [Comparación de cambios `0.3.0...0.4.0`](https://github.com/leotinoco/pomodoro-chibcha-app/compare/19f638c071cdc62858152ea1a7a9c44d09825400...main)

---

## [0.3.0] - 2026-03-31

### Añadido

- Botón de edición inline para tareas: al hacer clic en ✏️ el título y la fecha se vuelven editables y se sincronizan con Google Tasks al guardar.
- Botón de edición inline para eventos de calendario: permite actualizar el título (summary) de eventos de Google Calendar directamente desde la lista.
- Endpoint `PATCH /api/calendar` para actualizar eventos de Google Calendar por ID.
- Soporte completo de `title` en el endpoint `PATCH /api/tasks` para renombrar tareas en Google Tasks.

### Cambiado

- Historial de commits del repositorio limpiado para eliminar versiones anteriores que contenían información sensible expuesta públicamente.

---

## [0.2.0] - 2026-02-16

### Añadido

- **Tu propia música**: Soporte para carpetas de música local (Lofi, Clásica, Rock).
- **Control de reproducción**: Botones para siguiente, anterior y repetir playlist.
- **Nuevo Logo**: Logo oficial visible en la barra superior.
- **Icono de la App**: Favicon actualizado en la pestaña del navegador.
- Google Analytics, sitemap y robots.txt para visibilidad SEO.
- Páginas legales (términos y privacidad) y links en el footer.
- Archivo de verificación de Google Search Console.

### Corregido

- Reproducción automática en el ambient player.
- Visualización de imagen de perfil de Google.
- Carga de changelog en producción.

### Seguridad

- Implementadas nuevas medidas de protección de la aplicación y datos.
- Secretos y credenciales eliminados del repositorio.

---

## [0.1.0] - 2026-02-15

### Añadido

- **Temporizador Pomodoro**: Ciclo continuo personalizable con audio.
- **Gestión de Tareas**: Crear, completar y sincronizar tareas con Google Tasks. Soporte para tareas locales sin login.
- **Drag & Drop**: Reordenamiento y anidamiento de subtareas.
- **Calendario**: Eventos de Google Calendar integrados (hoy y mañana).
- **Reproductor de audio ambient**: Personalizado con control de pistas.
- **Modo Offline**: La aplicación funciona sin conexión.
- **SEO y Seguridad**: Meta tags, Open Graph, headers de seguridad, favicon personalizado.
- **Changelog**: Sistema de changelog y documentación inicial.

### Corregido

- Visualización de iconos de fecha y hora.
- Sincronización de tareas completadas.
- Error de tipos en build de Vercel (NextAuth).
- Rotación de tokens de acceso de Google.
