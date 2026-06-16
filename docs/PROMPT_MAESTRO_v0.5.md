# Prompt maestro para continuar la Capturadora de Propiedades — v0.5 (rev. 2)

Actúa como desarrollador frontend senior, UX/UI designer y arquitecto de producto digital. Vas a continuar el proyecto existente.

- **Proyecto:** Capturador de propiedades Hauser / Inmobitera
- **Repositorio origen (estable):** Constructera/Capturador-de-propiedades
- **Sitio actual estable:** https://constructera.github.io/Capturador-de-propiedades/
- **Repositorio destino de esta versión:** NUEVO repo copia (no rama). Nombre sugerido: `Capturador-de-propiedades-v0.5` o `Capturadora-Hauser`. Razón: v0.5 cambia la navegación y arquitectura; conviene un GitHub Pages de staging independiente y rollback limpio.
- **Versión solicitada de producto:** v0.5
- **Objetivo de v0.5:** convertir la capturadora actual en una experiencia más profesional, modular e interactiva, con gamificación tipo app educativa, sin perder la lógica inmobiliaria existente.

> **Esta es la revisión 2 del prompt.** Incorpora 16 decisiones de producto del dueño que modifican o amplían la especificación previa. Las decisiones que cambian comportamiento existente están marcadas con ⚠️ y agrupadas al final en "Decisiones de producto (rev. 2)". El JSON de especificación adjunto (`spec_capturadora_v0.5.json`) es la fuente estructurada equivalente a este documento; ante cualquier duda, ambos deben coincidir.

---

## 1. Principios obligatorios

1. No rehacer todo desde cero si no es necesario.
2. Conservar la lógica funcional actual: captura de propiedad, historial local, generación de markdown, CRM/personas, ubicación, configuración, backend opcional y exportación.
3. Antes de editar, revisar los archivos actuales: `index.html`, `app.js`, `manifest.json`, `sw.js`, `PENDIENTES.md` y `DESPLIEGUE.md`.
4. Agregar versión visible en la app y en los comentarios principales de archivos:
   - Producto: "Capturadora Hauser v0.5"
   - Código: actualizar encabezados de archivos con fecha, versión y resumen de cambios.
5. No usar servicios de pago.
6. No depender de APIs externas de pago.
7. Si algo requiere backend, dejarlo como integración futura, mock local o configuración opcional.
8. Mantener compatibilidad con GitHub Pages.
9. Mantener la app usable en celular.
10. Priorizar HTML/CSS/JavaScript estático para v0.5. Solo migrar a React/Vite si se justifica claramente y se documenta.

---

## 2. Objetivo UX de v0.5

La app debe sentirse como una herramienta de captación inmobiliaria gamificada. La referencia emocional es una app tipo Duolingo: clara, divertida, con mascota, botones grandes, sonidos, animaciones suaves, progreso, recompensas y sensación de avance.

No copiar marca, personajes, textos ni identidad visual de Duolingo. Tomar únicamente el patrón de experiencia: misiones cortas, pasos claros, refuerzo positivo, estrellas, ranking, mascota animada, sonidos de interacción, progreso visual, navegación tipo app.

---

## 3. Nueva estructura de navegación

Crear una pantalla inicial tipo menú principal con tarjetas/botones grandes:

1. Capturar propiedad
2. Capturar cliente / socio
3. Ranking de asesores
4. Historial
5. Configuración
6. Ayuda rápida

Cada página debe tener: botón para volver al menú, título claro, versión visible "v0.5", navegación inferior o superior tipo app, diseño responsive, botones grandes para uso en campo.

---

## 4. Asesores inmobiliarios

Antes de iniciar una captura, el usuario debe seleccionar o registrar quién captura.

Módulo de asesores con: lista precargada editable, selección de asesor activo, opción "Agregar asesor", nombre completo, alias corto, teléfono opcional, color/avatar simple opcional, total de capturas, total de estrellas, promedio de estrellas por captura, mejor tiempo, última captura. La app debe recordar automáticamente el último asesor usado en el dispositivo.

Datos iniciales sugeridos: Daniel, Erica, Carlos, Gabriel. No bloquear que se agreguen más asesores.

---

## 5. Temporizador gamificado

Pantalla de preparación antes de capturar: asesor seleccionado, tiempo por defecto 10 minutos, botón para modificar tiempo antes de iniciar, opciones rápidas 5/10/15/20 min, botón "Iniciar captura".

Captura iniciada: temporizador circular arriba, minutos y segundos restantes, el círculo se vacía conforme pasa el tiempo. Estados visuales:

- 10:00–5:01: feliz / motivado.
- 5:00–2:01: atento / apurado.
- 2:00–0:01: enojado / urgente.
- 0:00: triste / fuera de tiempo.

El temporizador solo se pausa si se agrega botón explícito de pausa, y la captura debe registrar si hubo pausa.

---

## 6. Mascota animada

Casita animada con ojos, expresión y movimiento, arriba del formulario junto al temporizador. Estados: idle/esperando, bailando al iniciar, feliz al completar campos, nerviosa con poco tiempo, enojada cerca del límite, triste si faltan datos esenciales, celebrando con 2–3 estrellas.

Implementación: CSS + SVG inline, o Lottie JSON local en `/assets/animations/`, o animación ligera con JS. Evitar assets externos que rompan la app.

---

## 7. Sonidos

Sonidos ligeros: click de botón, selección de chip, avance de paso, error/dato faltante, estrella ganada, captura completada, tiempo agotado. Deben poder activarse/desactivarse desde configuración, tener volumen controlable, no reproducirse antes de una interacción del usuario, no ser molestos.

Usar Web Audio API para tonos cortos o archivos locales en `/assets/sounds/`: `click.mp3`, `success.mp3`, `error.mp3`, `star.mp3`, `timeout.mp3`.

---

## 8. Sistema de estrellas

Al finalizar una captura, calcular hasta 3 estrellas.

**Estrella 1 — Velocidad.** Se gana si `tiempo transcurrido <= 300 segundos`.

**Estrella 2 — Captura esencial.** Se gana si están completos los datos esenciales:

- tipo de inmueble
- operación
- dirección o ubicación
- zona/colonia
- precio de venta o renta según operación
- ⚠️ **m² terreno Y m² construcción** (ambos; ver Decisión 5)
- responsable / asesor que captura
- fuente
- quién ofrece la propiedad
- al menos un dato de contacto si quien ofrece no es "No sé aún"

Para casa/departamento/local/oficina/bodega agregar: recámaras si aplica, baños si aplica, estacionamientos si aplica.

Para terreno agregar:
- servicios disponibles o "Por confirmar"
- ⚠️ **uso de suelo / densidad** (ver Decisión 10)
- ⚠️ ~~topografía~~ **ELIMINADA** (ver Decisión 9)

Si no se gana esta estrella: casita triste, mensaje claro, lista de datos faltantes, botón "Completar faltantes".

**Estrella 3 — Captura completa.** Se gana si se completan todos los campos relevantes para el tipo de captura, o si los campos no conocidos están marcados explícitamente como "S/I" o "N/A". No exigir datos que no aplican. El sistema distingue: campo vacío accidental / "S/I" sin información / "N/A" no aplica.

---

## 9. Resultado de captura

Pantalla resumen: nombre de propiedad, asesor, tiempo usado, estrellas ganadas, datos faltantes, calidad de captura (Incompleta / Esencial / Publicable / Completa), y botones: Generar markdown, Guardar captura, Copiar markdown, Volver al menú, Capturar otra propiedad.

Con estrellas: animar estrellas, sonido de logro, confetti ligero solo con 3 estrellas.

---

## 10. Ranking global por asesor

Pantalla "Ranking de asesores": asesor, total de estrellas, total de capturas, promedio de estrellas, capturas completas, capturas esenciales, mejor tiempo, última captura. Orden default: más estrellas totales → mayor promedio → menor tiempo promedio. Guardar localmente; preparar estructura para sincronización futura con backend, Google Sheets o Notion.

---

## 11. Capturadora de clientes / socios

Página "Capturar cliente / socio" para registrar personas del negocio inmobiliario y de construcción.

Tipos: Propietario, Comprador, Desarrollador, Arquitecto, Notario, Maestro de obra, Broker, Asesor inmobiliario, Inversionista, Referido, Otro. Si "Otro", mostrar campo "Especifica el tipo de contacto".

Campos: nombre completo, alias, tipo de contacto, empresa, teléfono, WhatsApp, correo, zona de operación, zona de interés, presupuesto si compra, tipo de propiedad que busca/ofrece, relación con alguna propiedad, fuente del contacto, nivel de confianza, urgencia, próxima acción, fecha de seguimiento, notas.

Genera markdown para alta en base de Contactos/CRM y puede vincularse después con una propiedad capturada.

---

## 12. Calidad visual

Tarjetas con bordes suaves, botones grandes, sombras ligeras, microinteracciones, barra de progreso, chips claros, estados visuales, colores consistentes, diseño mobile first, animaciones suaves, feedback inmediato.

Paleta: verde principal, blanco/gris claro, acento amarillo para estrellas, rojo/naranja solo para urgencia o errores, azul o morado suave para socios/clientes. No saturar de colores.

---

## 13. Accesibilidad

Opción de silenciar sonidos, opción de reducir animaciones, soporte `prefers-reduced-motion`, contraste suficiente, botones con texto claro, no depender solo de color para comunicar errores, mensajes de error legibles.

---

## 14. Persistencia local

Guardar localmente: asesor activo, lista de asesores, ranking, capturas de propiedades, capturas de clientes/socios, configuración de sonidos, configuración de animaciones, duración default del temporizador. Para v0.5 puede usarse `localStorage`, pero con funciones envoltorio para migrar después a IndexedDB/Dexie.

---

## 15. Archivos esperados

Actualizar o crear: `index.html`, `app.js`, `styles.css` (si separas estilos), `manifest.json`, `sw.js`, `CHANGELOG.md`, `PENDIENTES.md`, carpetas `/assets/sounds/`, `/assets/animations/`, `/assets/icons/`.

---

## 16. Entregable esperado

1. Código funcional.
2. Resumen de cambios de v0.5.
3. Lista de archivos modificados.
4. Instrucciones de despliegue en GitHub Pages.
5. Checklist de pruebas: abrir app, seleccionar asesor, cambiar tiempo antes de iniciar, iniciar captura, llenar captura esencial, terminar en menos de 5 minutos, verificar estrellas, verificar ranking, capturar cliente/socio, guardar historial, exportar JSON, probar sin sonido, probar con animación reducida, probar en móvil.

---

## 17. Criterio de éxito

v0.5 es correcta si: el usuario entiende qué hacer desde el menú principal, la captura de propiedad sigue funcionando, el asesor se registra antes de capturar, el temporizador funciona, la casita cambia de estado, los sonidos funcionan tras interacción, las 3 estrellas se calculan correctamente, el ranking suma estrellas por asesor, existe capturadora de clientes/socios, el markdown de propiedad no se rompe, el historial local sigue funcionando, la app puede publicarse en GitHub Pages.

---

## 18. Decisiones de producto (rev. 2) — INTEGRAR EN v0.5

Estas 16 decisiones provienen del dueño y prevalecen sobre cualquier especificación previa que las contradiga.

### Dirección y ubicación
1. **Dirección con autocompletado (futuro) + geolocalización por el agente Notion.** Por ahora el asesor captura una **dirección genérica** (calle, número, colonia). El **markdown de salida debe instruir al siguiente agente** a buscar e identificar la ubicación exacta en la web y rellenar el campo Dirección con una **referencia tipo Google Maps** (link y/o coordenadas). Dejar previsto en backlog un buscador con autocompletado de direcciones.

### Zona
2. **Autocompletado de Zona desde las zonas existentes.** Al interactuar con el campo Zona, desplegar las zonas ya registradas en la base 📍 Zonas como sugerencias de autocompletado. Si el asesor escribe una **zona nueva**, dejar que termine de escribirla y agregar al markdown la **instrucción de crearla como nueva opción del select Zona** en la base de Propiedades (y/o como nuevo registro en la base Zonas).

### Código
3. **Código condicional por tipo de inmueble.** `PROP-XX` para casa o departamento; `TERR-XX` para terreno. ⚠️ **Pendiente abierto:** el terreno PROP-3 ya existe en Notion con prefijo PROP-. El dueño decidirá después si se renumera a TERR- o se deja. Mientras tanto, NO renumerar automáticamente; el markdown debe señalar este conflicto cuando aplique.

### Nombre
4. **Nombre por default = dirección sencilla.** El asesor propone el nombre; si lo deja vacío, el título de la propiedad será la **dirección sencilla (calle y número)**.

### Dimensiones
5. ⚠️ **m² terreno Y m² construcción, ambos esenciales.** Cambia la regla previa que usaba "m² terreno **o** m² construcción". Ahora ambos cuentan para la estrella esencial. (En terreno sin construcción, m² construcción puede marcarse N/A explícitamente.)

### Operación y precio
6. **Precio según operación:** venta, renta o ambos.
7. **"Ambas" despliega los dos campos de precio** (venta y renta) para capturarlos por separado.

### Datos de terreno (corrida financiera)
8. **Servicios disponibles** — se conserva (agua, luz, drenaje, pavimento, o "Por confirmar").
9. ⚠️ **Topografía ELIMINADA.** Quitar este campo del formulario y de la lista de datos esenciales de terreno (`star_2_essential.land_property`).
10. **Uso de suelo / densidad permitida** — agregar como campo de terreno; alimenta la corrida financiera.
11. **Estatus legal / escrituras** — agregar como campo **opcional tipo select** (p. ej.: Título limpio, Con gravamen, Ejidal, En trámite, S/I).

### Comercial
12. **Fuente** — se conserva. Nota del dueño: estas no son las fuentes principales de captura (considerar revisarlas en una versión futura).
13. **Propietario / quién ofrece** — se conserva (nombre + un dato de contacto, o "No sé aún").

### Estatus (lógica nueva)
14. ⚠️ **Auto-avance de estatus.** Default al crear: **En análisis**. Cuando la captura alcanza **3 estrellas (captura completa)**, el estatus pasa **automáticamente a "Captada"**. El markdown de salida debe reflejar el estatus resultante y, si es Captada, indicarlo explícitamente al agente Notion.

### Publicación y notas
15. **Publicable** — checkbox Sí / No.
16. **Notas** — se conserva (texto libre).

---

## 19. Esquema de la base de datos 🏠 Propiedades (Notion) — referencia de mapeo

El markdown generado para el agente de Notion debe mapear a estos 21 parámetros. Relaciones marcadas con →.

| Parámetro Notion | Tipo | Origen en la app |
|---|---|---|
| Propiedad (título) | Texto | Nombre propuesto o dirección sencilla (Decisión 4) |
| Código | Texto | `PROP-XX` / `TERR-XX` según tipo (Decisión 3) |
| Tipo de inmueble | Select | tipo |
| Operación | Select | Venta / Renta / Ambas (Decisiones 6–7) |
| Precio | Texto/moneda | precio venta y/o renta |
| Precio / m² | Número | calculado |
| m² terreno | Número | esencial (Decisión 5) |
| m² construcción | Número | esencial (Decisión 5; N/A si no aplica) |
| Recámaras | Número | solo construido; N/A en terreno |
| Baños | Texto | solo construido; N/A en terreno |
| Estacionamientos | Número | solo construido; N/A en terreno |
| Dirección | Texto | genérica + instrucción de geolocalizar (Decisión 1) |
| Zona | → 📍 Zonas | autocompletado o nueva opción (Decisión 2) |
| Estatus | Select | En análisis → Captada auto (Decisión 14) |
| Fuente | Select | Decisión 12 |
| Propietario | → 👥 Contactos | Decisión 13 |
| Publicable | Checkbox | Sí / No (Decisión 15) |
| Operaciones | → 🤝 Operaciones | — |
| Proyectos | → 📁 Proyectos | — |
| Tareas | → ✅ Tareas | — |
| Notas | Texto | Decisión 16 |

**Campos nuevos de terreno** (uso de suelo/densidad, estatus legal, servicios) que aún no existan como propiedad en la base de Propiedades: el markdown debe instruir al agente a crearlos como nuevas propiedades de la base, o registrarlos dentro de Notas si el dueño prefiere no alterar el esquema. Marcar como pendiente de confirmación.

---

## 20. Pendientes para PENDIENTES.md (registrar en el repo)

- Conflicto de código PROP-3 (terreno) vs. nueva regla TERR- — decisión del dueño pendiente.
- Buscador de direcciones con autocompletado (sustituirá a la geolocalización manual del agente).
- Confirmar si los campos nuevos de terreno (uso de suelo, estatus legal, servicios) se crean como propiedades en Notion o viven en Notas.
- Revisar catálogo de Fuentes (las actuales no son las principales de captación).
- Migración de almacenamiento a IndexedDB/Dexie.
- Sincronización de ranking/capturas con Notion o Google Sheets.
