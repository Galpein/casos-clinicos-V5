# Backlog v5 — revisión de Enrique

Estado: **plan, sin implementar**. Cada bloque va de menor a mayor riesgo.
Notación: `[ ]` pendiente · `[?]` bloqueado por una decisión · `[—]` fuera de alcance v5.

---

## 0. Decisiones abiertas (bloquean trabajo)

| # | Decisión | Resuelta |
|---|----------|----------|
| D1 | IA real | **Sí: Gemini Flash** (nivel gratuito). Dejar la integración escrita y probada; la clave llega después. El motor actual queda de reserva cuando no haya clave. |
| D2 | Persistencia | **Postgres en el VPS**, creado como servicio desde Dokploy, con la cadena de conexión en variables de entorno. Implica añadir capa de servidor: hoy la app es 100 % cliente. |
| D3 | Terminología de estados | Pendiente de elegir entre las alternativas propuestas (ver §9). Los mockups de Enrique ya usan «nivel documental». |
| D4 | Visuales de biblioteca | **Resuelta**: tres referencias analizadas (ver §5). |

---

## 1. Correcciones de rotulado y UI — ✅ HECHO

- [x] **1.1** Nombre del médico: quitar la especialidad. Dejar `Marta Ruiz` + `col-12345` (sin el prefijo «Col.»).
- [x] **1.2** Tarjeta de caso: mostrar también los complementarios (`10/10 obligatorios · 7/11 complementarios`). Es lo que hace que «utilizable» con 10/10 parezca un error.
- [x] **1.3** Barra segmentada del detalle: hoy es ámbar (obligatorios) + verde (complementarios), y mezcla el color de estado con el de agrupación. Propuesta: un solo relleno neutro con una marca en el umbral de «obligatorios completos», y el color del semáforo sólo en el punto de estado.
- [x] **1.4** Etiqueta «Desidentificado» dentro de «Paciente anonimizado»: redundante → quitarla.
- [x] **1.5** Diagnóstico principal: quitar el código `atlas_disease_atopic_dermatitis` de la vista del médico (es identificador interno de indexación) y la etiqueta duplicada del nombre del diagnóstico.
- [x] **1.6** Privacidad: dejar «Consentimiento obtenido», quitar «compartible».
- [x] **1.7** Panel derecho: quitar `Acceso → shared / desidentificado` (jerga interna sin significado para el médico).
- [x] **1.8** Quitar «Ver datos (JSON)» del MVP (`components/case/DataInspector.tsx`). Se puede dejar tras el modo admin.
- [x] **1.9** Unificar el nombre de la acción: «Nuevo caso» en el menú lateral y en el botón (hoy «Crear caso» / «Nuevo caso»).

## 2. Explicar lo que significa cada cosa

- [ ] **2.1** Tooltips al pasar el puntero sobre las etiquetas: «Validado», «Propuesto por IA», los tres estados del semáforo.
- [ ] **2.2** La barra de completitud, al pulsarla, despliega qué son obligatorios y complementarios y cuáles faltan (el dato ya existe en `computeCaseStatus`: `missingRequired` / `missingComplementary`).
- [?] **2.3** Índice de Biblioteca en el detalle: o se explica qué es y para qué sirve, o se retira de la vista del médico. **Decisión de producto pendiente.**
- [—] **2.4** Glosario de conceptos y del estándar CARE. Enrique lo marca «para versiones finales».
- [—] **2.5** Menú de ayuda con vídeo/demo corta. Ídem.

## 3. Ciclo de vida del caso (arquitectura nueva)

> `stores/cases.store.ts` sólo tiene `addCase` y `getCase`. Todo esto es nuevo.

- [x] **3.1** **Autoguardado**: el caso existe como borrador en cuanto hay un campo. Tope de 5 s para que el asistente no aplace el guardado.
- [x] **3.2** **Editar** un caso guardado desde la lista y desde el detalle: se abre en el asistente (`/create-case?id=`).
- [x] **3.3** **Eliminar** con confirmación que explica el efecto real: el borrador se destruye, el publicado se retira de la vista del autor y permanece en la biblioteca.
- [x] **3.4** Publicación automática al dejar de ser borrador (`in_library` no revierte) y re-sincronización del índice en cada guardado.
- [x] **3.5** Guardar sin bloqueo; si falta el título se pide en ese momento.
- [~] **3.6** «Reiniciar»: ya no pierde nada porque el borrador está autoguardado y queda en «Casos clínicos». Falta decírselo al usuario al pulsarlo, que hoy no avisa.

## 4. Asistente de creación

- [x] **4.1** Etiquetas de IA homogéneas: hoy conviven «Propuesto IA · 92%» y un simple «IA» sin porcentaje. Unificar en **«Propuesto por IA»** y retirar el porcentaje (es confianza interna del motor, no información para el médico).
- [ ] **4.2** Que **todos** los campos propuestos por IA queden marcados como tales y sean validables uno a uno, además del «validar todos» que ya existe.
- [ ] **4.3** **Deshacer**: pila de acciones para revertir «Revisar y validar lo propuesto por IA» y las últimas propuestas aceptadas.
- [?] **4.4** Reconocimiento flexible de opciones cerradas: escribir «no requerido» debe mapear a «No requerido (uso interno)». Con reglas de normalización se cubre lo previsible; bien resuelto del todo depende de **D1**.
- [?] **4.5** Dar ejemplos también en los campos complementarios (hoy sólo se piden en texto libre). Depende de **D1** para que los ejemplos sean del caso concreto y no plantillas fijas.
- [x] **4.6** «Ver ejemplo» se inhabilita en cuanto el caso tiene contenido: hoy machaca lo escrito. Es un fallo real, no una mejora.

## 5. Biblioteca

### Referencias de Enrique (analizadas)

1. **Lista con facetas** — panel de filtros a la izquierda con contadores por especialidad, patología, signos y síntomas y tratamiento; resultados en lista compacta (título, una línea de resumen, 3-4 etiquetas, fecha, nivel documental); panel de detalle a la derecha con «Ver caso completo» y «Guardar caso»; conmutador Lista / Tabla; buscador con ⌘K.
2. **Tabla** — mismas facetas, resultados en columnas ordenables (Caso · Patología · Paciente · Tratamiento · Resultado · Nivel documental · Fecha), casillas de selección, fila expandible con resumen en cinco columnas, «Comparar (2)», «Guardar» y «Exportar», paginación.
3. **Portada de exploración** — explorar por especialidad y por reto clínico (diagnóstico diferencial, reacciones adversas, casos raros, presentaciones atípicas, seguimiento prolongado), colecciones destacadas, añadidos recientemente, más consultados y guardados por la comunidad. Navegación nueva: Biblioteca · Mis casos · Casos guardados · Colecciones · Contribuir caso · Actividad.

**Conceptos nuevos que introducen los mockups y que hoy no existen en el modelo:** nivel documental, colecciones, casos guardados, comparar dos casos, reto clínico, fototipo, actividad y contadores por faceta. Cada uno es trabajo aparte; hay que decidir cuáles entran.

- [x] **5.1** Vista de biblioteca propia: (a) facetas con contadores y panel de detalle ✔, (b) tabla ordenable con fila expandible ✔, (c) barra de exploración por especialidad y reto clínico ✔ — sin colecciones ni actividad, que son modelo nuevo.
- [x] **5.2** Excluir los borradores de la biblioteca.
- [x] **5.3** Terminología aplicada: Borrador · Documentación esencial · CARE completo.

## 6. Exportación

- [ ] **6.1** PDF pegado a la izquierda: el CSS declara `@page { margin: 18mm }`, así que hay que reproducirlo con el diálogo de impresión real para ver si lo rompe el navegador o el contenedor. Investigación antes de tocar.
- [ ] **6.2** Salida HTML exportable, además del PDF.
- [—] **6.3** Rediseño del contenido exportado: Enrique dice explícitamente **no tocar** hasta la sesión con médicos. Lo mismo para «Presentación».

## 7. Indexación

- [?] **7.1** Documentar cómo funciona hoy: `Atlas Concept Dictionary` + `Library Index` derivado del caso. Es exactamente la pregunta de Enrique (¿diccionario común cuando dos casos hablan de la misma patología?). La respuesta es sí y ya está implementado — hay que explicárselo, no construirlo.
- [?] **7.2** Preparar un documento para la persona de biblioteconomía: modelo actual, decisiones tomadas y preguntas abiertas.

## 8. Validación externa

- [ ] **8.1** Sesión con médicos para validar el flujo y decidir qué debe contener la exportación. Bloquea 6.3.


---

## 9. Propuesta de terminología (D3)

Enrique quiere sustituir «utilizable (interno)». Tres juegos coherentes:

| | Rojo | Naranja | Verde |
|---|---|---|---|
| **A. Nivel documental** (la de sus propios mockups) | Borrador | Documentación esencial | CARE completo |
| **B. Descriptiva** | Borrador | Caso documentado | Caso completo (CARE) |
| **C. Por uso** | Borrador | Uso interno | Publicable |

Recomendación: **A**, porque es la que ya aparece en los mockups que ha preparado y porque nombra el nivel de documentación del caso, no un juicio sobre su utilidad — que es justo lo que le chirría de «utilizable». Nota: sus mockups insinúan un cuarto nivel («Documentación ampliada») entre esencial y CARE completo; añadirlo exige definir qué campos lo separan.
