# Changelog

## [0.12.0] - 2026-07-27

### <!--icon:rocket--> Nuevas Características

- **Buscador de tareas**: Nuevo campo de búsqueda en la parte superior de la sección de tareas para filtrar y encontrar cualquier tarea al instante mientras escribes.

- **Búsqueda sin tildes ni mayúsculas**: Escribir «practica» encuentra «Práctica» y «Practicar», así no recuerdes cómo la escribiste originalmente.

- **Filtra pendientes y terminadas**: La búsqueda cubre también el acordeón de tareas terminadas y el nombre de la lista de Google, con un contador de resultados y un botón para limpiar el filtro (o la tecla `Esc`).

- **Jerarquía conservada**: Si la coincidencia es una subtarea, su tarea principal se mantiene visible para no perder el contexto.

---

## [0.11.0] - 2026-07-27

### <!--icon:bug--> Correcciones

- **Ahora se ven TODAS tus tareas pendientes**: La app solo mostraba las primeras 20 tareas que devolvía Google. Ahora se recorren todas las páginas de resultados, así tengas cientos de tareas pendientes.

- **Se incluyen todas tus listas de Google Tasks**: Antes solo se leía la primera lista de tu cuenta; las tareas guardadas en otras listas (Trabajo, Personal, Mercado, etc.) quedaban invisibles. Ahora aparecen todas juntas.

- **Subtareas huérfanas visibles**: Las subtareas cuya tarea principal ya estaba completada desaparecían de la lista sin dejar rastro. Ahora se muestran al final en lugar de perderse.

- **Acciones en la lista correcta**: Completar, reactivar o editar una tarea ahora se envía siempre a la lista de Google a la que realmente pertenece, evitando errores al trabajar con varias listas.

- **Tareas terminadas de todas las listas**: El acordeón de tareas terminadas de los últimos 7 días ya recopila las tareas completadas en todas tus listas, no solo en la primera.

### <!--icon:rocket--> Nuevas Características

- **Etiqueta de lista**: Cuando tienes más de una lista de Google Tasks, cada tarea muestra una pequeña etiqueta con el nombre de la lista a la que pertenece, tanto en las pendientes como en las terminadas.

### <!--icon:gear--> Mejoras Internas

- **Lectura de tareas paginada**: Las peticiones a la API de Google Tasks piden 100 elementos por página y siguen el `nextPageToken` hasta agotar los resultados, con un tope de seguridad para evitar bucles infinitos.

- **Consultas en paralelo por lista**: Las tareas de cada lista se solicitan simultáneamente, de modo que sumar listas no ralentiza la carga del panel.

---

## [0.10.0] - 2026-07-17

### <!--icon:shield--> Seguridad

- **Permisos de Google reducidos al mínimo**: La aplicación ahora solicita acceso únicamente a los eventos de tu calendario (`calendar.events`) en lugar del control total de Google Calendar. Todo sigue funcionando igual, pero la app ya no puede tocar la configuración ni la compartición de tus calendarios.
- **Credenciales fuera de las URLs**: El refresco de sesión con Google ahora envía las credenciales en el cuerpo de la petición, donde no pueden quedar registradas en logs intermedios.
- **Política de seguridad de contenido más estricta**: Eliminada la directiva `unsafe-eval` del CSP en producción y actualizadas las cabeceras de protección del navegador.
- **Política de privacidad reforzada**: Nueva declaración de Uso Limitado (Limited Use) conforme a la Política de Datos de Usuario de las APIs de Google, con secciones de cookies/analítica, revocación de acceso y contacto.

### <!--icon:rocket--> Nuevas Características

- **Términos de Servicio multilingües**: La página de términos ahora está disponible en Español, English, Français, 日本語 y Português con un selector de idioma integrado.

### <!--icon:bug--> Correcciones

- **Sesión estable con Google**: Corregido un error que hacía que el token de acceso se renovara contra Google en cada petición; ahora se renueva solo cuando expira.
- **Confeti al terminar cada fase**: El festejo al completar un ciclo Pomodoro ahora se dispara de forma fiable al finalizar la fase.
- **Textos legales exactos**: Fechas de actualización fijas en las páginas legales y corrección de los géneros musicales mencionados (Lofi, Clásica, Rock).

### <!--icon:lightning--> Rendimiento

- **Carga del panel más rápida**: Las tareas, tareas completadas y eventos del calendario ahora se solicitan en paralelo, reduciendo el tiempo de carga hasta 3 veces.
- **Menos trabajo por render**: Las listas de reproducción del reproductor ambiental ya no se reconstruyen en cada render.

### <!--icon:gear--> Mejoras Internas

- **Código sin advertencias**: Resueltos todos los errores y avisos de ESLint (reglas de React Hooks) refactorizando los efectos del temporizador, el reproductor y la lista de tareas.

---

## [0.9.0] - 2026-06-27

### <!--icon:rocket--> Nuevas Características

- **Tareas Terminadas**: Se agregó un acordeón al final de la lista de tareas para visualizar las tareas completadas en los últimos 7 días con su respectiva fecha de finalización y una opción para restaurarlas.
## [0.8.0] - 2026-06-19

### <!--icon:rocket--> Nuevas Características

- **Diseño Mejorado de Chibi Pomodoro**: Se ha actualizado la mascota animada a un diseño de cuerpo completo estilo anime. Incluye patitas, pancita, collar con cascabel y almohadillas negras (toe beans) en las patas traseras.
- **Animaciones Optimizadas**: Parpadeo y movimiento de orejas sincronizados para el nuevo diseño.

---

## [0.7.0] - 2026-06-11

### <!--icon:rocket--> Nuevas Características

- **Barra de volumen para notificaciones**: Se agrega un control deslizante de volumen para los sonidos de inicio de tarea y descansos del temporizador Pomodoro, con persistencia en `localStorage`, replicando el diseño del reproductor de música.

---

## [0.6.0] - 2026-05-17

### <!--icon:shield--> Seguridad

- **Protección reforzada contra amenazas web**: Nuevas políticas de seguridad que protegen tu navegación y datos personales.
- **Escudo protector contra accesos no autorizados**: Sistema que limita peticiones excesivas y previene abusos.
- **Cifrado avanzado de tu identidad digital**: Tu información de sesión ahora se maneja de forma más segura.
- **Gestión de sesiones más robusta**: Cuando tu sesión expira, se te redirige automáticamente de forma segura.
- **Respuestas de error seguras**: Los mensajes de error ya no exponen información técnica interna.
- **Detección proactiva de vulnerabilidades**: Mejorado el escaneo automático de credenciales en el repositorio.
- **Permisos optimizados para Google Calendar**: Ajustados los permisos para mayor seguridad y funcionalidad.

### <!--icon:gear--> Mejoras Internas

- **Dashboard más rápido y responsivo**: Optimizada la estructura interna para un rendimiento superior.
- **Paleta de colores refinada**: Actualizados los tonos neutros para un aspecto más profesional.
- **Tipografía refinada**: Ajustado el peso de las fuentes para mejor legibilidad.
- **Imágenes optimizadas**: Mejorada la carga visual para un rendimiento superior.
- **Experiencia visual más fluida**: Eliminados parpadeos al cargar la fecha del footer.

### <!--icon:palette--> Estilo Visual

- **Footer simplificado**: Diseño más limpio sin enlaces externos.
- **Título con diseño más limpio**: El encabezado del Dashboard ahora es más legible.

---

## [0.5.0] - 2026-05-06

### Features
- **Nueva Mascota Animada**: Integración de "Chibi Pomodoro", una mascota animada en SVG que reacciona visualmente al paso del tiempo (sincronizada con el segundero).
- **Layout Responsivo**: Optimización del dashboard para mostrar la mascota de forma fluida tanto en PC como en dispositivos móviles.

### Fixes
- **Ajuste de Tareas Largas**: Se eliminó el recorte de texto (`truncate`) en los títulos de tareas y eventos. Ahora el alto de la tarjeta se ajusta automáticamente al contenido.
- **Alineación de Iconos**: Mejora en la alineación flex de las tarjetas de tareas para mantener los controles en la parte superior cuando el texto es multilínea.


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
