# PENDIENTES — Capturadora Hauser v0.5

Registro de decisiones pendientes e incidencias abiertas. No implementar sin alineación con el dueño.

---

## Esquema Notion — estado actual

- ~~**PROP-3 / TERR-**~~: **RESUELTO en v0.6.** El campo Código en Notion es auto-incremental; la app ya no genera ni escribe prefijos. El conflicto PROP-3 queda sin efecto.

- **Campos de terreno en Notas**: `uso_de_suelo_densidad`, `estatus_legal` y `servicios_disponibles` se registran en el campo **Notas** de forma estructurada. Pendiente confirmar si se crearán como propiedades independientes en la base.

- **Operación "Ambas" → Venta en Notion**: Confirmado en v0.6. Cuando el asesor elige "Ambas", el markdown registra `Operación = Venta` y los datos de renta van en los campos Precio renta, Ganancia renta y Tiempo mínimo de renta.

---

## Funcionalidades pendientes de backend o plataforma

- **Lector de URL ("Leer publicación y autorrellenar")**: Solo funciona dentro de Claude.ai; depende de la API de Anthropic sin backend propio. Dependiente de la futura migración a PWA hosteada o integración de backend. No implementar en la versión estática actual.

- **Carpeta de Drive / subir fotos**: El backend de creación de carpetas y subida de imágenes sigue sin implementar. Dependiente de migración con backend (Apps Script / Worker).

---

## Geolocalización y mapa

- **"Usar mi ubicación" devolvió coordenadas en India**: Posiblemente por IP/proxy de la red durante la prueba. Verificar comportamiento y precisión en dispositivos móviles reales antes de lanzar a producción. No reproducible en red normal.

- ~~**"Elegir en el mapa" no centra en México**~~: **RESUELTO en Fase 4.5.** El mapa ya centra por defecto en Cuernavaca (18.9261, -99.2308).

---

## Mejoras futuras (evaluación)

- **Catálogo de Fuentes**: Revisar y actualizar las opciones del select. Las fuentes actuales no reflejan todas las vías reales de captación del equipo. Pendiente revisión con el equipo.

- **Migración a IndexedDB**: Actualmente se usa localStorage. Para historial grande, ranking y capturas estructuradas, evaluar migración a IndexedDB/Dexie.

- **Sincronización de ranking/capturas**: Pendiente conexión con Notion o Google Sheets como backend de datos.

- **Campo "Acuerdo comercial"**: El propósito actual es ambiguo. Evaluar en próxima versión si renombrar, dividir en campos específicos (tipo de exclusiva, plazo, condiciones) o eliminar.

- **Buscador de direcciones con autocompletado Nominatim**: Mejora al campo de dirección para sugerir desde la escritura, reduciendo dependencia de geolocalización manual.

- **Reducción de animaciones configurable en app**: Actualmente la app respeta `prefers-reduced-motion` del SO vía CSS. Pendiente agregar toggle manual en Configuración para usuarios que no quieren tocar ajustes del sistema.

---

*Última actualización: Fase 8 — Pulido final · v0.5*
