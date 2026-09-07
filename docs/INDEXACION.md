# Cómo se indexan los casos en AtlasCases

> Documento para la revisión de una persona con formación en biblioteconomía y
> documentación. Describe **lo que ya está implementado**, no un plan.
> Estado a 7 de septiembre de 2026.

---

## 1. El problema que resuelve

Un caso clínico se escribe en texto libre. Dos médicos pueden describir lo mismo
de tres maneras: «dermatitis atópica», «eccema atópico», «DA». Si la biblioteca
guardara sólo el texto, buscar «dermatitis atópica» dejaría fuera los otros dos
casos, y cualquier recuento agregado sería falso.

La respuesta de AtlasCases: **nunca se busca ni se agrega por texto literal**.
Cada término que aparece en un caso se resuelve contra un vocabulario controlado
propio, y lo que se guarda para buscar es el identificador del concepto.

## 2. Las tres piezas

| Pieza | Qué es | Dónde vive |
|---|---|---|
| **Clinical Case** | El documento que lee y edita una persona. Texto, con la trazabilidad de cada campo (quién lo puso, si lo propuso la IA, si lo validó el médico). | `types/clinical-case.ts` |
| **Atlas Concept Dictionary** | El vocabulario controlado: conceptos con su término preferido, sinónimos, siglas y marcas comerciales. | `mock/atlasDictionary.ts` |
| **Library Index** | Versión ligera y estructurada del caso, **derivada automáticamente**. Es lo único que consultan la búsqueda, las facetas y la analítica. | `types/library-index.ts`, `lib/library-index.ts` |

El caso nunca se busca directamente. Se busca su índice.

## 3. El vocabulario controlado

Cada concepto tiene esta forma (`types/concepts.ts`):

- `conceptId` — identificador estable, p. ej. `atlas_disease_atopic_dermatitis`.
- `conceptType` — diagnóstico, fármaco, producto, procedimiento, resultado,
  evento adverso, biomarcador, especialidad o tipo de caso.
- `preferredLabelEs` / `preferredLabelEn` — término preferido en cada idioma.
- `terms[]` — todas las formas de decirlo, cada una etiquetada como
  **preferida**, **sinónimo**, **sigla** o **marca comercial**, con su idioma.
  Las siglas pueden marcarse como `ambiguous` cuando significan varias cosas.
- `therapeuticClass` — para fármacos, la clase a la que pertenecen.
- `externalCodes[]` — hueco previsto para SNOMED CT, CIE, MeSH, ATC, LOINC,
  MedDRA, CTCAE o EMDN. **Hoy está vacío**: la estructura existe, la carga no.

Estado actual del diccionario: **49 conceptos y 95 términos** — 17 patologías,
19 fármacos, 7 especialidades y 6 tipos de caso; 31 sinónimos, 7 marcas
comerciales y 6 siglas.

## 4. Cómo se indexa un caso, paso a paso

1. El profesional describe el caso hablando con el asistente.
2. El asistente detecta entidades y las resuelve contra el diccionario
   (`lib/dictionary.ts`). El resultado es una **referencia a concepto** que
   guarda a la vez: el texto tal cual lo escribió el médico, el concepto al que
   se ha resuelto y la confianza de esa resolución.
3. Todo lo que propone la IA queda marcado como **propuesto**, no como cierto.
4. El médico **valida** campo a campo o en bloque. Sólo lo validado cuenta como
   documentación firme.
5. Al guardar, `deriveLibraryIndex()` genera el índice: diagnósticos,
   tratamientos con su clase terapéutica y línea, resultados, eventos adversos,
   especialidad, tipo de caso, datos del paciente (grupo de edad y sexo) y
   etiquetas de búsqueda.
6. La biblioteca y la analítica trabajan sobre ese índice.

## 5. Respuesta a la pregunta planteada

> *¿Hay que crear un diccionario para cuando distintos casos se refieren a la
> misma patología o producto?*

Sí, y ya existe y funciona. Dos casos que digan «dermatitis atópica» y «eccema
atópico» caen en el mismo `atlas_disease_atopic_dermatitis`, aparecen juntos al
filtrar y suman en el mismo recuento. Lo mismo con los fármacos: buscar por la
clase terapéutica «corticoide» devuelve los casos de hidrocortisona y
betametasona aunque esa palabra no aparezca escrita en ninguno.

## 6. Preguntas abiertas para la revisión

1. **Códigos externos.** La estructura admite SNOMED CT, CIE-10/11, ATC, MeSH…
   ¿Cuáles interesan primero y con qué prioridad? Nuestra intuición: ATC para
   fármacos y CIE para patologías, por ser lo que pide la industria.
2. **Gobierno del vocabulario.** ¿Quién da de alta un concepto nuevo y con qué
   criterio? Hoy no hay proceso: se añade a mano en el código.
3. **Términos ambiguos.** «DA» es dermatitis atópica en dermatología y otra cosa
   en otras especialidades. Hoy se marcan como ambiguos pero no se desambiguan
   por contexto. ¿Cómo se resuelve esto en un catálogo bien hecho?
4. **Granularidad.** ¿«Psoriasis» y «psoriasis en placas» deben ser un concepto
   con sinónimos o dos conceptos con jerarquía? Hoy no hay jerarquía:
   los conceptos son planos, sin relaciones de especificidad.
5. **Versionado.** Si se corrige un concepto, ¿qué pasa con los casos ya
   indexados? Hoy el índice se recalcula al editar el caso, pero no hay
   reindexado masivo.
6. **Multilingüe.** Los términos llevan idioma, y hay etiqueta preferida en
   español e inglés. No hay más idiomas ni traducción automática.

## 7. Lo que NO está hecho

- Cargar códigos de terminologías externas.
- Jerarquías entre conceptos (padre/hijo, «es un»).
- Herramienta de administración del diccionario: hoy se edita en el código.
- Reindexado masivo tras cambiar el vocabulario.
- Desambiguación de siglas por contexto.
