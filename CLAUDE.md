# Proyecto: Capturadora Hauser v0.5

## Qué es esto
Continuación de la app capturadora de propiedades Hauser/Inmobitera, versión v0.5.
Repo COPIA del estable. Aislado: no mezclar con otros proyectos.

## Antes de hacer cualquier cosa
1. Lee docs/PROMPT_MAESTRO_v0.5.md (especificación completa, fuente de verdad).
2. Lee docs/spec_capturadora_v0.5.json (misma spec, estructurada).
3. Revisa el código existente (index.html, app.js, manifest.json, sw.js) antes de editar.

## Reglas de trabajo
- NO rehacer desde cero. Conservar la lógica inmobiliaria existente.
- Mantener app estática HTML/CSS/JS. No migrar a React sin justificarlo.
- Mantener compatibilidad con GitHub Pages.
- Mobile-first.
- No usar servicios ni APIs de pago.
- Respetar las 16 decisiones de producto (sección 18 del prompt maestro).
- Trabajar por fases. Pedir mi aprobación antes de cada fase grande.
- No tocar el repo estable original. Esto es una copia.

## Esquema destino: base de datos Notion 🏠 Propiedades
El markdown que genera la app es la interfaz de salida hacia un agente Notion. DEBE
ajustarse al esquema canónico de la base 🏠 Propiedades para garantizar integridad
referencial y evitar campos huérfanos:
- Fuente de verdad del esquema: docs/spec_capturadora_v0.5.json → clave
  "notion_property_database.parameters" (21 propiedades con su tipo y mapeo).
- Respetar nombre, tipo de dato y cardinalidad de cada propiedad. No renombrar ni
  inventar propiedades fuera del esquema.
- Propiedades de tipo relation (Zona→Zonas, Propietario→Contactos, Operaciones,
  Proyectos, Tareas) se referencian por nombre/título del registro relacionado, no
  como texto plano. Si el registro relacionado no existe, el markdown debe instruir
  su alta previa (upsert) antes de vincular.
- Propiedades select (Tipo de inmueble, Operación, Estatus, Fuente, Estatus legal):
  usar solo opciones existentes del esquema. Si el valor capturado es nuevo (p. ej.
  zona inexistente), emitir instrucción explícita de crear la nueva opción del select
  antes de asignarla.
- Campos sin dato → "S/I"; campos no aplicables → "N/A". Nunca omitir ni autocompletar
  con valores inventados.
- Generación de Código condicional por Tipo de inmueble: PROP-XX (casa/depto),
  TERR-XX (terreno).
- Estatus: default "En análisis"; transición automática a "Captada" solo con 3 estrellas.
- Campos de terreno aún no presentes en el esquema (uso_de_suelo_densidad,
  estatus_legal, servicios_disponibles): el markdown debe instruir su creación como
  nuevas propiedades, o su registro en Notas. NO asumir; marcar como pendiente.

## Pendientes abiertos (no decidir solo)
- Conflicto de código PROP-3 (terreno) vs regla TERR-.
- Si los campos nuevos de terreno van como propiedades de Notion o en Notas.
