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
  - [x] 1.7 Verificar que `npm run dev` inicia sin errores

- [x] 2.0 API de OCR en el backend (`POST /api/ocr`) con Tesseract.js (spa)
  - [x] 2.1 Crear `src/pages/api/ocr.ts` como manejador de ruta API
  - [x] 2.2 Parsear `multipart/form-data` desde `Request` y extraer archivos (campo `images`)
  - [x] 2.3 Validar tipos de archivo: jpg/jpeg/png/webp/tiff; advertir sobre archivos muy grandes
  - [x] 2.4 Integrar `tesseract.js` con idioma `spa`; precargar worker si aplica
  - [x] 2.5 Procesar imágenes secuencialmente o con concurrencia limitada (configurable)
  - [x] 2.6 Construir y devolver JSON `{ results: [...], errors: [...] }` según el ejemplo del PRD
  - [x] 2.7 Añadir manejo de errores robusto y códigos HTTP; no persistir archivos más allá del ciclo de la petición
  - [x] 2.8 Registrar tiempos de proceso para apoyar el ajuste de rendimiento (solo dev)

- [x] 3.0 Fundamentos de frontend (Astro + integración React) y estilos globales
  - [x] 3.1 Crear `src/pages/index.astro` con layout base y punto de montaje para el cargador React
  - [x] 3.2 Agregar `src/components/Header.astro` con un botón "BUSQUEDA" (sin acción)
  - [x] 3.3 Crear e importar `src/styles/global.css` (o base de Tailwind)
  - [x] 3.4 Asegurar que el island de React funciona mediante un componente simple de prueba

- [x] 4.0 Cargador de imágenes en React (arrastrar y soltar, vista previa, eliminar, subir con progreso)
  - [x] 4.1 Crear andamiaje de `src/components/ImageUploader.tsx` con React/TSX
  - [x] 4.2 Implementar área de arrastrar y soltar + input múltiple; aceptar solo tipos MIME permitidos
  - [x] 4.3 Mostrar vistas previas (miniatura o nombre de archivo) y permitir eliminar antes de subir
  - [x] 4.4 Construir `FormData` (`images`) y hacer POST a `/api/ocr`
  - [x] 4.5 Mostrar progreso por imagen (lado cliente) mientras se espera el procesamiento del servidor
  - [x] 4.6 Manejar la respuesta del servidor y mapear resultados/errores a cada tarjeta de imagen
  - [x] 4.7 Gestionar estados: pendiente, procesando, completado, error

- [x] 5.0 UI de resultados: mostrar texto OCR por imagen y estados (pendiente/procesando/completado/error)
  - [x] 5.1 Crear diseño de tarjetas para cada imagen con nombre de archivo y texto OCR
  - [x] 5.2 Añadir copiar-al-portapapeles para el texto extraído
  - [x] 5.3 Manejar texto largo: expandir/contraer
  - [x] 5.4 Estado visual de error para OCR fallido con mensaje

- [x] 6.0 Validaciones básicas, manejo de errores y limpieza de temporales
  - [x] 6.1 Validación en cliente para tipo de archivo y advertencia opcional por tamaño
  - [x] 6.2 Guardas en servidor: limitar número de archivos por solicitud; manejar payloads vacíos
  - [x] 6.3 Asegurar liberación de buffers/streams temporales; sin persistencia en disco
  - [x] 6.4 Añadir manejo de timeout/abort para evitar solicitudes colgadas

- [x] 7.0 QA local con ~30–50 imágenes y captura de métricas; ajustes de rendimiento
  - [x] 7.1 Preparar un set de imágenes de etiquetas (calidad variada)
  - [x] 7.2 Medir tiempo de proceso y tasa de éxito; anotar observaciones de precisión
  - [x] 7.3 Ajustar concurrencia y uso de memoria si es necesario; verificar estabilidad
  - [x] 7.4 Corregir bugs encontrados; re-probar hasta estabilizar

- [x] 8.0 Reintento OCR con pipeline alternativo optimizado para etiquetas de envío
  - [x] 8.1 Crear endpoint `/api/ocr/retry` que acepte imagen individual y parámetros
    - [x] 8.1.1 Definir interfaz para parámetros de reintento (ROIs, PSM, whitelist, etc.)
    - [x] 8.1.2 Implementar validación de parámetros y manejo de errores
  - [x] 8.2 Implementar pipeline alternativo de preprocesamiento avanzado
    - [x] 8.2.1 Mejorar `imageProcessing.ts` con deskew automático y binarización adaptativa
    - [x] 8.2.2 Añadir upscaling (1.5-2x) para textos pequeños y normalización de contraste
    - [x] 8.2.3 Implementar filtros de despeckle y sharpening suave
  - [x] 8.3 Implementar procesamiento por ROIs (Regions of Interest)
    - [x] 8.3.1 Crear función para detectar/definir ROIs para campos específicos (IDs, CP, direcciones)
    - [x] 8.3.2 Configurar PSM específico por tipo de campo (7 para IDs/CP, 6/4 para direcciones, 11 para texto disperso)
    - [x] 8.3.3 Aplicar whitelist/blacklist por tipo de campo (numérico para IDs/CP, alfanumérico para direcciones)
  - [x] 8.4 Implementar soporte multi-idioma y optimización LSTM
    - [x] 8.4.1 Configurar worker con `lang: 'spa'` y `oem: 1` (LSTM)
    - [x] 8.4.2 Crear patrones de usuario para formatos específicos (IDs, CP, fechas)
  - [x] 8.5 Comparar confianza entre resultado original y reintento; devolver mejor
    - [x] 8.5.1 Implementar métricas de confianza por campo y global
    - [x] 8.5.2 Crear lógica de fusión para seleccionar mejor resultado
  - [x] 8.6 Agregar botón "Reintentar" por imagen en ImageItem.tsx
    - [x] 8.6.1 Diseñar UI para mostrar opciones de reintento (básico/avanzado)
    - [x] 8.6.2 Implementar llamada al endpoint `/api/ocr/retry`
  - [x] 8.7 Manejar estado de reintento (loading, merge de resultados)
    - [x] 8.7.1 Actualizar modelo de datos para almacenar resultados originales y de reintento
    - [x] 8.7.2 Implementar UI para comparar resultados antes/después
  - [x] 8.8 Validación post-OCR para campos específicos
    - [x] 8.8.1 Implementar validadores regex para IDs, CP y otros campos estructurados
    - [x] 8.8.2 Crear corrección automática para errores comunes (O vs 0, I vs 1, etc.)

- [x] 9.0 Modal de visualización de imagen completa
  - [x] 9.1 Crear componente ImageModal.tsx con React Portal
  - [x] 9.2 Implementar estado global para modal (Context o prop drilling)
  - [x] 9.3 Agregar click handler en miniatura de ImageItem.tsx
  - [x] 9.4 Estilos responsive para modal (overlay, imagen centrada, botón cerrar)
  - [x] 9.5 Navegación entre imágenes con teclado (opcional)

- [x] 10.0 Documentación: README guía rápida, configuración y uso
  - [x] 10.1 Escribir `README.md` con pasos de instalación y comandos
  - [x] 10.2 Documentar cómo ejecutar la app, subir imágenes e interpretar resultados
  - [x] 10.3 Listar restricciones (sin PDF, sin persistencia) y próximos pasos planeados (Fase 2)
  - [x] 10.4 Añadir sección de resolución de problemas (issues comunes de OCR, consejos de rendimiento)

- [ ] 11.0 Interpretación IA de texto OCR (Opción B1 - Tesseract + OpenAI)
  - [ ] 11.1 Configurar integración con OpenAI API (variables de entorno, cliente)
  - [ ] 11.2 Crear endpoint `/api/interpret` para procesar texto OCR con IA
  - [ ] 11.3 Diseñar prompt específico para etiquetas Envío Flex argentinas
  - [ ] 11.4 Implementar servicio `AITextInterpreter` con manejo de errores y reintentos
  - [ ] 11.5 Crear tipos TypeScript para respuesta estructurada de IA
  - [ ] 11.6 Integrar interpretación IA en pipeline OCR existente (opcional/configurable)
  - [ ] 11.7 Añadir límites de costo y monitoreo de uso de API
  - [ ] 11.8 Modificar frontend para mostrar datos interpretados por IA
  - [ ] 11.9 Crear tests con ejemplos reales de texto OCR sucio
  - [ ] 11.10 Documentar configuración y uso de la interpretación IA
