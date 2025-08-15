# PRD: SnapTag – Fase 1 (Front Astro + Backend Node OCR)

## 1. Introducción / Visión General
Aplicación web con frontend en Astro (componentes React) que permite cargar imágenes de etiquetas, enviarlas a un backend Node para extraer texto mediante OCR (Tesseract.js en español) y mostrar los resultados en la UI para revisión manual. En Fase 1 NO se genera PDF ni se persiste información.

## 2. Objetivos
- Mostrar en el frontend el texto OCR por imagen para revisión manual.
- Soportar carga de ~30–50 imágenes por lote.
- Progreso visible durante el procesamiento (por imagen y/o global).
- Éxito técnico medido por precisión y estabilidad (ver Métricas).

## 3. Historias de Usuario
- Como usuario, quiero cargar múltiples imágenes para ver el texto extraído por cada una.
- Como usuario, quiero ver una barra/indicador de progreso mientras se procesa el lote.
- Como usuario, quiero revisar el texto extraído antes de hacer cualquier acción futura (p. ej., generar PDF).
- (Futuro) Como usuario, quiero generar un PDF solo con los textos aceptados por mí.

## 4. Requisitos Funcionales
1. Frontend (Astro + React): componente de subida con drag & drop e input múltiple.
2. Enviar las imágenes al backend mediante `multipart/form-data`.
3. Backend (Node): procesar imágenes con Tesseract.js (idioma `spa`) y devolver JSON con el texto por imagen.
4. Mostrar resultados en la UI y permitir revisión visual del texto (sin persistencia).
5. Indicadores de progreso por imagen (y/o global) durante el OCR.
6. (Futuro) Botón "Generar PDF" visible pero deshabilitado, o movido a Fase 2.

## 5. Fuera de Alcance (Fase 1)
- Generación de PDF (se define el flujo futuro, no se implementa ahora).
- Persistencia en base de datos (se evaluará Supabase en Fase 2).
- Integraciones externas (Bot de Telegram, IA paga/externa para OCR).
- Mobile-first avanzado (se prioriza desktop).

## 6. Diseño / UX
- Astro con componentes React.
- Paleta profesional (azules/grises), tipografía legible.
- Layout de una página con secciones: Cabecera, Carga, Progreso/Resultados.
- Cabecera con un botón "BUSQUEDA" (estético, sin funcionalidad por ahora).
- Galería/lista de imágenes seleccionadas; opción de eliminar antes de enviar.
- Tarjetas de resultado con: miniatura (opcional), nombre de archivo, texto OCR.

## 7. Consideraciones Técnicas
- Frontend:
  - Astro + `@astrojs/react` + React/TSX para el componente `ImageUploader`.
  - Envío a `/api/ocr` con `fetch` y `FormData` (campo `images`).
  - Gestión de progreso por imagen; UI reactiva para estados (pendiente/procesando/completado/error).
- Backend:
  - Node (adapter `@astrojs/node`). Endpoint `POST /api/ocr`.
  - Tesseract.js con idioma `spa` por defecto.
  - Procesamiento secuencial o con concurrencia limitada para ~30 imágenes.
  - No persistir ni conservar archivos: uso de temporales y limpieza tras procesar.
  - Respuesta JSON por lote, ejemplo:
    ```json
    {
      "results": [
        {
          "id": "uuid",
          "fileName": "etiqueta1.jpg",
          "text": "...texto extraído...",
          "status": "completed"
        }
      ],
      "errors": []
    }
    ```
- Tipos de archivo: jpg/jpeg/png/webp/tiff. Sin límites estrictos en Fase 1 (lote típico 30–50 imágenes).

## 8. Datos a Extraer (referencia para Fase 2/validación)
- Número de cliente, número de venta, número de envío, fecha de entrega, localidad, barrio, código postal, dirección, destinatario.
- En Fase 1 se muestra el texto completo; la extracción de campos específicos puede iniciarse como best-effort (opcional) y formalizarse en Fase 2 cuando haya ejemplos reales.

## 9. Métricas de Éxito
- Tasa de error < 5% en imágenes legibles.
- Precisión OCR ≥ 90% en etiquetas con formato estándar (idioma español).
- Lote de ~30 imágenes procesado sin fallos críticos.

## 10. Flujo Futuro (Fase 2+)
- PDF: tras revisión/aceptación manual, generar PDF con los textos validados por imagen.
- Persistencia: almacenar resultados (y opcionalmente referencias de imágenes) en Supabase.
- Consultas históricas: por cliente/fecha.
- Mejoras de extracción de campos y validaciones.

## 11. Despliegue / Entorno
- Desarrollo local (Node), sin despliegue productivo en Fase 1.

## 12. Preguntas Abiertas
- ¿Habrá ejemplos de etiquetas para afinar el OCR y regex de extracción de campos? (sí, el usuario los proveerá luego)
- ¿Concurrencia óptima de procesamiento para 30–50 imágenes en el equipo destino?
- ¿Tamaño máximo esperado por imagen (para advertencias, no límite duro)?
