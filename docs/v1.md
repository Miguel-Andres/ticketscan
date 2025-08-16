# PRD: Sistema de Procesamiento de Etiquetas de Envío con OCR

## 1. Introducción/Visión General

Este proyecto consiste en una aplicación web desarrollada con Astro que permite cargar imágenes de etiquetas de envío, extraer datos específicos mediante OCR (Tesseract.js), generar informes PDF con los datos extraídos y precios asociados, y almacenar esta información en una base de datos PostgreSQL para consultas posteriores. La aplicación está diseñada para un único usuario con conocimientos técnicos medios-altos.

## 2. Objetivos

- Crear una interfaz web atractiva y funcional para cargar lotes de imágenes de etiquetas (aproximadamente 30 por día)
- Implementar OCR preciso para extraer datos específicos de etiquetas de envío con formato consistente
- Permitir la revisión y corrección manual de los resultados del OCR antes de guardarlos
- Generar informes PDF con datos extraídos y precios según localidad/código postal
- Almacenar datos en PostgreSQL para consultas simples por número de cliente y fecha de envío
- Sentar las bases para futuras integraciones (IA para mejorar OCR, bot de Telegram)

## 3. Historias de Usuario

- Como usuario, quiero cargar múltiples imágenes de etiquetas de envío para procesarlas en lote.
- Como usuario, quiero revisar los datos extraídos por OCR para verificar su precisión antes de guardarlos.
- Como usuario, quiero generar un PDF con los datos extraídos y los precios correspondientes según la localidad.
- Como usuario, quiero consultar fácilmente los datos históricos por número de cliente y fecha de envío.

## 4. Requisitos Funcionales

1. **Carga de Imágenes**
   - El sistema debe permitir la carga de múltiples imágenes simultáneamente
   - El sistema debe mostrar miniaturas de las imágenes cargadas
   - El sistema debe permitir eliminar imágenes antes de procesarlas

2. **Procesamiento OCR**
   - El sistema debe extraer de cada etiqueta: número de cliente, número de venta, número de envío, fecha de entrega, localidad, barrio, código postal, dirección y destinatario
   - El sistema debe procesar las imágenes en lote
   - El sistema debe mostrar el progreso del procesamiento

3. **Revisión de Resultados**
   - El sistema debe mostrar los datos extraídos junto a la imagen correspondiente
   - El sistema debe permitir editar manualmente cualquier dato extraído incorrectamente
   - El sistema debe permitir marcar imágenes para reprocesamiento

4. **Generación de PDF**
   - El sistema debe generar un PDF con los datos extraídos de todas las etiquetas procesadas
   - El sistema debe incluir precios según localidad/código postal en el PDF
   - El sistema debe permitir descargar el PDF generado

5. **Almacenamiento en Base de Datos**
   - El sistema debe guardar en PostgreSQL todos los datos extraídos y validados
   - El sistema debe almacenar referencias a las imágenes originales
   - El sistema debe permitir consultas por número de cliente y fecha de envío

6. **Interfaz de Usuario**
   - El sistema debe tener una interfaz atractiva con componentes grandes
   - El sistema debe utilizar una paleta de colores profesional
   - El sistema debe ser intuitivo y fácil de usar

## 5. No-Objetivos (Fuera de Alcance)

- Autenticación de usuarios (solo un usuario)
- Procesamiento de etiquetas con formatos variables
- Integración con servicios de IA pagos para mejorar OCR
- Bot de Telegram para descarga de imágenes (fase futura)
- Optimización para dispositivos móviles

## 6. Consideraciones de Diseño

- Interfaz moderna con componentes grandes y espaciados
- Paleta de colores profesional (azules, grises, acentos)
- Diseño de una sola página con secciones claramente definidas
- Feedback visual durante el procesamiento de imágenes
- Vista previa de imágenes y resultados en formato de tarjetas

## 7. Consideraciones Técnicas

- Framework Astro para el frontend
- Tesseract.js para OCR local
- Tailwind CSS para estilos
- jsPDF para generación de PDFs
- PostgreSQL para almacenamiento de datos
- Posible uso de bibliotecas locales de IA para mejorar resultados de OCR

## 8. Métricas de Éxito

- Precisión del OCR superior al 90% para etiquetas con formato consistente
- Tiempo de procesamiento inferior a 10 segundos por imagen
- Generación de PDF en menos de 30 segundos para lotes de 30 imágenes
- Consultas a la base de datos con tiempo de respuesta inferior a 2 segundos

## 9. Preguntas Abiertas

- ¿Qué formato específico tienen las etiquetas? ¿Hay ejemplos disponibles?
- ¿Cuál es la estructura exacta de precios según localidad/código postal?
- ¿Se requiere almacenar las imágenes originales o solo los datos extraídos?
- ¿Hay alguna preferencia específica para la estructura de la base de datos?
