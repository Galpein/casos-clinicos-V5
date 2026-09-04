# AtlasCases — Arquitectura y roadmap

> Documento vivo. Consolida la visión, las dos specs internas (creación CARE +
> indexación) y lo que ya está implementado en este repo. Pensado para alinear
> a todo el equipo.

## 1. Posicionamiento (y el pivote)

AtlasCases es una plataforma de **casos clínicos reales y anonimizados** que el
profesional sanitario (HCP) redacta **con ayuda de una IA agente**, indexados
para poder venderse como **analítica agregada** a clientes (farma, estudios de
mercado).

Esto es un cambio de producto respecto a la versión anterior (un *simulador de
prescripción* sobre casos ficticios). El modelo de datos antiguo
(`types` legacy + `mock/cases.ts` + `mock/prescriptions.ts`) sostiene aún la
vertical de Analytics y se reconstruirá sobre el Library Index más adelante.

Dos roles:
- **Profesional sanitario (HCP):** crea, completa y valida casos. Quiere que la
  herramienta le ahorre tiempo y le deje sacar el caso para presentar.
- **Cliente:** compra acceso a la analítica. Quiere explorar datos a su manera,
  no 4 gráficas fijas.

Principio rector: **el médico no codifica.** La IA propone (diagnóstico,
tratamiento, producto, outcome, evento adverso, etiquetas, códigos); el HCP solo
valida o corrige.

## 2. Modelo de datos: dos objetos por caso

Cada caso vive como **dos objetos separados** (ver `types/`):

1. **Clinical Case** (`types/clinical-case.ts`) — el objeto rico, orientado a
   lectura/edición/exportación. Estructura **CARE simplificada**: 13 bloques
   mínimos obligatorios + campos complementarios. No es una checklist académica.
2. **Library Index** (`types/library-index.ts`) — versión ligera y estructurada,
   **derivada automáticamente** del caso (`lib/library-index.ts`). Es lo que la
   biblioteca y la analítica consumen para buscar, filtrar y agregar.

El pegamento entre ambos es el **Atlas Concept Dictionary**
(`types/concepts.ts`, semilla en `mock/atlasDictionary.ts`): diccionario interno
propio que normaliza términos a conceptos (`atlas_disease_atopic_dermatitis`,
`atlas_drug_tacrolimus`…). Resolución en `lib/dictionary.ts`. La búsqueda usa
conceptos, no texto literal: "DA", "dermatitis atópica" y "atopic dermatitis"
caen en el mismo concepto.

### Estado de cada dato (`types/field.ts`)

Casi ningún campo es un `string` pelado. Va envuelto en `FieldValue<T>`:

```
{ value, status, source, validatedByHcp, confidence }
```

- `status`: `present | none | not_applicable | not_documented | unknown | pending_review`.
  Diferenciarlos importa: no es lo mismo "no aplica" que "se desconoce" que
  "la IA lo propone pero falta validar".
- `source` (`Provenance`): de dónde salió (documento, diapositiva, fragmento,
  chat). Inspirado en FHIR DocumentReference.
- `validatedByHcp`: el médico lo confirmó.

Tratamientos, resultados, eventos adversos y referencias a concepto son
**estructurados** (no texto narrativo), porque son la clave comercial y
analítica.

## 3. Regla de producto: semáforo rojo / naranja / verde

Implementada en `lib/case-status.ts` (`computeCaseStatus`). **No mide gravedad;
mide completitud.** Sustituye al antiguo "7/10 de severidad".

- 🔴 **Rojo — `draft_incomplete`:** faltan campos mínimos obligatorios.
- 🟠 **Naranja — `internal_usable`:** mínimos obligatorios completos → usable en
  biblioteca interna/docente. **Es el umbral de "publicable".**
- 🟢 **Verde — `care_ready`:** además completa los campos CARE para exportar.

Matiz clave: el **contenido propuesto por IA cuenta para la presencia** del
campo (sube a naranja), pero la **validación humana** de diagnóstico, tratamiento
y outcome es lo que abre el **verde**. Así el flujo natural es: IA rellena →
naranja → el HCP valida y completa CARE → verde.

Mínimos para 🔴→🟠 (regla literal de la spec): título, resumen, diagnóstico,
especialidad, paciente desidentificado, tratamiento principal (aunque "no
aplica"), resultado principal (aunque "no documentado"), timeline básico,
aprendizaje y estado de privacidad/consentimiento.

## 4. Flujo IA + validación HCP

Frontera limpia en `lib/assistant/types.ts` (`AssistantTurn`): un motor solo
tiene que devolver mensaje + parches sobre el caso + (opcional) las 3 mejores
propuestas para un hueco. **Hoy hay un motor scripteado** dirigido por el
diccionario (`lib/assistant/engine.ts`), pensado para sustituirse por una
llamada real a Claude sin tocar la UI.

1. **Entrada:** el HCP escribe/pega un caso (o adjunta un .txt). *(Voz, PPT, PDF,
   imagen → backend, pendiente.)*
2. **Extracción** (`lib/assistant/extract.ts`): entidades clínicas.
3. **Normalización** contra el diccionario → concepto + confianza.
4. **Relleno en vivo:** el documento de la izquierda se va completando
   (`components/create/DocumentPanel.tsx` + `components/case/CaseDocument.tsx`),
   con cada campo marcado como *propuesto por IA*.
5. **Propuestas top-3:** para cada hueco, las 3 mejores opciones de NUESTRA base
   (no 50). El HCP elige; nunca teclea códigos.
6. **Validación:** "Revisar y validar" pasa lo propuesto a *validado por HCP* y
   recalcula el estado.

UX: `app/create-case` es pantalla partida — documento (izq) + chat (der).

## 5. Qué está implementado (mapa de ficheros)

| Capa | Ficheros |
|------|----------|
| Modelo | `types/field.ts`, `types/concepts.ts`, `types/clinical-case.ts`, `types/library-index.ts` |
| Reglas | `lib/case-status.ts` (semáforo), `lib/library-index.ts` (derivación), `lib/case-factory.ts` |
| Diccionario | `mock/atlasDictionary.ts`, `lib/dictionary.ts` |
| Datos demo | `mock/clinicalCases.ts` (5 casos: 2 verdes, 2 naranjas, 1 rojo) |
| Asistente IA | `lib/assistant/*`, `stores/creation.store.ts` |
| UI casos | `components/CaseSummaryCard.tsx`, `components/case/*`, `app/cases/*` |
| Biblioteca | `app/biblioteca/page.tsx` (filtros simples sobre el índice) |
| Creación IA | `app/create-case/page.tsx`, `components/create/*` |

## 6. Estándares: qué usamos y qué dejamos preparado

- **Usar ya:** CARE simplificado, metadatos estilo Dublin Core, gestión
  documental estilo FHIR DocumentReference, **diccionario interno Atlas**.
- **Campo preparado (vacío) para fase 2+:** ATC, ICD/CIE, SNOMED CT, MeSH,
  LOINC, MedDRA, CTCAE → `ExternalCode[]` ya existe en el modelo.
- **No implementar aún:** SNOMED/MeSH/LOINC/MedDRA completos, servidor
  terminológico FHIR, UMLS, codificación automática obligatoria.

## 7. Roadmap

- **MVP (en curso):** modelo + Library Index + diccionario semilla + filtros +
  validación HCP + estados + tratamiento/outcome estructurados + asistente.
- **Fase 2:** mapeo semiautomático a ATC/ICD, normalización fina de productos,
  severidad compatible CTCAE, primeros dashboards agregados, exportación por
  patología/tratamiento/producto/outcome.
- **Fase 3:** SNOMED/MedDRA/LOINC/MeSH, UMLS, servidor terminológico FHIR,
  interoperabilidad con HCE, analítica investigadora avanzada.

## 8. Dependencias abiertas (no técnicas / bloqueantes)

- **Anonimización y LOPD:** detección de datos identificables + estructura legal
  de consentimientos. Es la única pieza con riesgo legal real. Está modelado el
  bloque de privacidad/consentimiento, pero la *detección* automática es backend
  pendiente.
- **Contenido mínimo CARE definitivo + estándar de indexación:** a confirmar por
  Enrique (en standby). Las dos specs internas ya sirven como versión de
  trabajo.
- **Backend de IA real:** conectar la API de Claude detrás de `AssistantTurn` y
  la extracción de PPT/PDF/imagen/voz.
- **Persistencia:** hoy todo es mock en memoria. Falta capa de datos real.
- **Vertical de Analytics del cliente:** dashboard configurable + copiloto sobre
  el Library Index (siguiente gran bloque, aún sobre el modelo legacy).
