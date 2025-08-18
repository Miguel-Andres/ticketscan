# Mejoras en la Precisión del OCR para Etiquetas de Envío

## Cambios Implementados

### 1. Configuración Optimizada de Tesseract

#### Modo de Segmentación de Página
- Cambiado de PSM 6 (bloque uniforme) a **PSM 3** (texto totalmente segmentado)
- Mejor para etiquetas con diferentes secciones, tamaños de texto y formatos

#### Parámetros para Reconocimiento de Números y Códigos
- Reducida la penalización para palabras fuera del diccionario (`language_model_penalty_non_dict_word: 0.5`)
- Preservación de palabras muy cortas como CP, ID (`tessedit_preserve_min_wd_len: 1`)
- Optimización para números de envío/venta largos con ajustes en detección de bordes
- Habilitado reconocimiento numérico mejorado (`classify_bln_numeric_mode: 1`)

#### Mejoras para Texto Problemático
- Corrección de espacios borrosos (`tessedit_fix_fuzzy_spaces: 1`)
- Corrección basada en diccionario (`tessedit_enable_dict_correction: 1`)
- Fragmentación de caracteres pegados (`chop_enable: 1`)
- Modelo de lenguaje n-gram (`language_model_ngram_on: 1`)
- Reducción del límite de tamaño de ruido (`textord_noise_sizelimit: 0.2`)

### 2. Preprocesamiento de Imágenes

Se ha implementado una función de preprocesamiento que:
- Convierte la imagen a escala de grises usando ponderación de luminosidad percibida
- Aplica umbral adaptativo simple (binarización) para mejorar el contraste
- Maneja errores graciosamente, devolviendo la imagen original si hay problemas
- Utiliza la biblioteca `canvas` si está disponible (instalación opcional)

## Resultados Esperados

Estas mejoras deberían proporcionar:
- Mayor precisión en el reconocimiento de números de venta/envío largos
- Mejor detección de códigos postales y referencias
- Mejor manejo de caracteres especiales y acentos en nombres y direcciones
- Mayor robustez ante imágenes de baja calidad o con problemas de contraste

### 3. Post-procesamiento de Texto Reconocido

Se ha implementado un sistema de post-procesamiento que:

- **Extrae campos específicos** de las etiquetas de envío:
  - Número de venta/ID
  - Número de envío
  - Código postal
  - Dirección
  - Fecha de entrega
  - Referencia
  - Barrio
  - Destinatario
  - Tienda

- **Corrige patrones comunes de errores** en el texto reconocido:
  - Conversión de "Venta 1D:" a "Venta ID:"
  - Formato consistente para códigos postales
  - Detección inteligente de direcciones sin etiqueta explícita

- **Utiliza expresiones regulares** para identificar patrones específicos en diferentes formatos de etiquetas

## Próximos Pasos Recomendados

1. **Pruebas con imágenes reales** de etiquetas para validar las mejoras
2. **Instalación de la biblioteca canvas** para habilitar el preprocesamiento de imágenes
   ```
   npm install canvas --save
   ```
3. **Ajuste fino** de los parámetros de umbral en el preprocesamiento según resultados
4. **Refinar las expresiones regulares** para la extracción de campos según los resultados de pruebas reales
5. Considerar implementar **técnicas adicionales** como:
   - Detección y corrección de rotación
   - Eliminación de ruido avanzada
   - Mejora de bordes para texto más nítido
