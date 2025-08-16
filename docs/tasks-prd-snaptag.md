## Archivos Relevantes

- `package.json` - Metadatos del proyecto y dependencias para Astro, adaptador de Node, React y Tesseract.js.
- `astro.config.mjs` - Configurar el adaptador de Node (`@astrojs/node`) y la integración de React (`@astrojs/react`).
- `src/pages/index.astro` - Página principal que monta el cargador de React y muestra resultados.
- `src/components/Header.astro` - Cabecera con un botón "BUSQUEDA" (solo visual en esta fase).
- `src/components/ImageUploader.tsx` - Componente React para arrastrar y soltar, vista previa, eliminar y subir al API.
- `src/pages/api/ocr.ts` - Ruta API para OCR: parsear multipart, ejecutar Tesseract (spa) y devolver JSON.
- `src/styles/global.css` - Estilos globales y base de Tailwind si se usa.
- `tailwind.config.js` - Configuración de Tailwind (opcional en Fase 1).
- `postcss.config.cjs` - Configuración de PostCSS (opcional en Fase 1).
- `README.md` - Guía de instalación y uso para desarrolladores.

### Notas

- En la Fase 1 no hay persistencia ni generación de PDF. Los archivos deben manejarse como temporales y limpiarse.
- Usar Tesseract.js con idioma español (`spa`) por defecto; permitir cambiar el idioma fácilmente mediante constante/variable de entorno.
- Limitar la concurrencia del OCR si es necesario para mantener la UI fluida con ~30–50 imágenes.
- El botón "BUSQUEDA" en la cabecera es solamente estético en esta fase.

## Tareas

- [x] 1.0 Configuración del proyecto y herramientas
  - [x] 1.1 Inicializar `package.json` y metadatos del proyecto Node
  - [x] 1.2 Instalar dependencias: `astro`, `@astrojs/node`, `@astrojs/react`, `react`, `react-dom`, `tesseract.js`
  - [x] 1.3 Agregar scripts: `dev`, `build`, `preview`
  - [x] 1.4 Crear `astro.config.mjs` con adaptador de Node e integración de React
  - [x] 1.5 Agregar `tsconfig.json` y ajustes básicos de TypeScript (estricto cuando sea razonable)
  - [x] 1.6 Estilos opcionales: configurar Tailwind (`tailwind.config.js`, `postcss.config.cjs`, import en `src/styles/global.css`)
  - [ ] 1.7 Verificar que `npm run dev` inicia sin errores

- [ ] 2.0 API de OCR en el backend (`POST /api/ocr`) con Tesseract.js (spa)
  - [ ] 2.1 Crear `src/pages/api/ocr.ts` como manejador de ruta API
  - [ ] 2.2 Parsear `multipart/form-data` desde `Request` y extraer archivos (campo `images`)
  - [ ] 2.3 Validar tipos de archivo: jpg/jpeg/png/webp/tiff; advertir sobre archivos muy grandes
  - [ ] 2.4 Integrar `tesseract.js` con idioma `spa`; precargar worker si aplica
  - [ ] 2.5 Procesar imágenes secuencialmente o con concurrencia limitada (configurable)
  - [ ] 2.6 Construir y devolver JSON `{ results: [...], errors: [...] }` según el ejemplo del PRD
  - [ ] 2.7 Añadir manejo de errores robusto y códigos HTTP; no persistir archivos más allá del ciclo de la petición
  - [ ] 2.8 Registrar tiempos de proceso para apoyar el ajuste de rendimiento (solo dev)

- [ ] 3.0 Fundamentos de frontend (Astro + integración React) y estilos globales
  - [ ] 3.1 Crear `src/pages/index.astro` con layout base y punto de montaje para el cargador React
  - [ ] 3.2 Agregar `src/components/Header.astro` con un botón "BUSQUEDA" (sin acción)
  - [ ] 3.3 Crear e importar `src/styles/global.css` (o base de Tailwind)
  - [ ] 3.4 Asegurar que el island de React funciona mediante un componente simple de prueba

- [ ] 4.0 Cargador de imágenes en React (arrastrar y soltar, vista previa, eliminar, subir con progreso)
  - [ ] 4.1 Crear andamiaje de `src/components/ImageUploader.tsx` con React/TSX
  - [ ] 4.2 Implementar área de arrastrar y soltar + input múltiple; aceptar solo tipos MIME permitidos
  - [ ] 4.3 Mostrar vistas previas (miniatura o nombre de archivo) y permitir eliminar antes de subir
  - [ ] 4.4 Construir `FormData` (`images`) y hacer POST a `/api/ocr`
  - [ ] 4.5 Mostrar progreso por imagen (lado cliente) mientras se espera el procesamiento del servidor
  - [ ] 4.6 Manejar la respuesta del servidor y mapear resultados/errores a cada tarjeta de imagen
  - [ ] 4.7 Gestionar estados: pendiente, procesando, completado, error

- [ ] 5.0 UI de resultados: mostrar texto OCR por imagen y estados (pendiente/procesando/completado/error)
  - [ ] 5.1 Crear diseño de tarjetas para cada imagen con nombre de archivo y texto OCR
  - [ ] 5.2 Añadir copiar-al-portapapeles para el texto extraído
  - [ ] 5.3 Manejar texto largo: expandir/contraer
  - [ ] 5.4 Estado visual de error para OCR fallido con mensaje

- [ ] 6.0 Validaciones básicas, manejo de errores y limpieza de temporales
  - [ ] 6.1 Validación en cliente para tipo de archivo y advertencia opcional por tamaño
  - [ ] 6.2 Guardas en servidor: limitar número de archivos por solicitud; manejar payloads vacíos
  - [ ] 6.3 Asegurar liberación de buffers/streams temporales; sin persistencia en disco
  - [ ] 6.4 Añadir manejo de timeout/abort para evitar solicitudes colgadas

- [ ] 7.0 QA local con ~30–50 imágenes y captura de métricas; ajustes de rendimiento
  - [ ] 7.1 Preparar un set de imágenes de etiquetas (calidad variada)
  - [ ] 7.2 Medir tiempo de proceso y tasa de éxito; anotar observaciones de precisión
  - [ ] 7.3 Ajustar concurrencia y uso de memoria si es necesario; verificar estabilidad
  - [ ] 7.4 Corregir bugs encontrados; re-probar hasta estabilizar

- [ ] 8.0 Documentación: README guía rápida, configuración y uso
  - [ ] 8.1 Escribir `README.md` con pasos de instalación y comandos
  - [ ] 8.2 Documentar cómo ejecutar la app, subir imágenes e interpretar resultados
  - [ ] 8.3 Listar restricciones (sin PDF, sin persistencia) y próximos pasos planeados (Fase 2)
  - [ ] 8.4 Añadir sección de resolución de problemas (issues comunes de OCR, consejos de rendimiento)
