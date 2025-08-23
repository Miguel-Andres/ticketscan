# SnapTag - OCR para Etiquetas de Envío

Sistema de reconocimiento óptico de caracteres (OCR) especializado en etiquetas de envío argentinas, optimizado para Envío Flex y otros servicios de paquetería.

## 🚀 Instalación

### Requisitos previos
- Node.js 18+ 
- npm o yarn

### Pasos de instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd snaptag
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno** (opcional)
```bash
cp .env.example .env
# Editar .env con tus configuraciones si es necesario
```

4. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

5. **Abrir en navegador**
```
http://localhost:4321
```

## 📖 Cómo usar la aplicación

### 1. Subir imágenes
- Arrastra y suelta imágenes en la zona de carga
- O haz clic en "Seleccionar archivos" para elegir desde tu dispositivo
- Formatos soportados: JPG, JPEG, PNG, WebP, TIFF
- Tamaño máximo: 10MB por imagen

### 2. Procesar con OCR
- Haz clic en "Procesar con OCR" para iniciar el reconocimiento
- El sistema procesará todas las imágenes cargadas
- Verás una barra de progreso durante el procesamiento

### 3. Interpretar resultados
- **Texto extraído**: El texto completo reconocido de la etiqueta
- **Confianza**: Porcentaje de certeza del reconocimiento (0-100%)
- **Tiempo**: Duración del procesamiento en segundos

### 4. Opciones avanzadas
- **Reintentar Avanzado**: Reprocesa la imagen con parámetros optimizados
- **Copiar**: Copia el texto extraído al portapapeles
- **Ver imagen completa**: Haz clic en la miniatura para ampliar

## 🔧 Comandos disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo
npm run build        # Construye para producción
npm run preview      # Vista previa de build de producción

# Utilidades
npm run type-check   # Verificar tipos TypeScript
npm run lint         # Ejecutar linter
```

## ⚠️ Restricciones actuales

### Limitaciones técnicas
- **Solo imágenes**: No soporta archivos PDF
- **Sin persistencia**: Los resultados no se guardan en base de datos
- **Procesamiento local**: Todo el OCR se ejecuta en el servidor local
- **Un idioma**: Optimizado únicamente para español argentino

### Tipos de etiquetas soportadas
- Etiquetas Envío Flex
- Etiquetas de paquetería argentina
- Texto en español con direcciones locales

## 🚧 Próximos pasos (Fase 2)

### Funcionalidades planeadas
- **Soporte PDF**: Procesamiento de documentos PDF multipágina
- **Base de datos**: Persistencia de resultados y historial
- **Múltiples idiomas**: Soporte para otros idiomas
- **API REST**: Endpoints para integración con otros sistemas
- **Interpretación IA**: Integración con OpenAI para mejor extracción de datos
- **Exportación**: Formatos CSV, JSON, Excel

### Mejoras técnicas
- **Batch processing**: Procesamiento masivo de imágenes
- **Cache inteligente**: Almacenamiento de resultados frecuentes
- **Optimización móvil**: Mejor experiencia en dispositivos móviles

## 🛠️ Resolución de problemas

### Problemas comunes

#### Error "Failed to fetch"
**Causa**: El servidor no está ejecutándose o hay problemas de red
**Solución**:
```bash
# Verificar que el servidor esté corriendo
npm run dev
# Verificar en http://localhost:4321
```

#### OCR con baja confianza (<50%)
**Causa**: Imagen de baja calidad, texto borroso o mal iluminado
**Solución**:
- Usar imágenes con mayor resolución (mínimo 300 DPI)
- Asegurar buena iluminación y contraste
- Evitar imágenes rotadas o distorsionadas
- Usar el botón "Reintentar Avanzado"

#### Texto mal reconocido
**Causa**: Fuentes poco comunes, texto manuscrito o caracteres especiales
**Solución**:
- Verificar que sea texto impreso (no manuscrito)
- Usar imágenes con texto horizontal
- Probar con diferentes configuraciones de reintento

#### Servidor lento o memoria alta
**Causa**: Procesamiento de imágenes muy grandes o múltiples simultáneas
**Solución**:
- Reducir tamaño de imágenes antes de subir
- Procesar pocas imágenes a la vez
- Reiniciar servidor: `Ctrl+C` y `npm run dev`

### Consejos de rendimiento

#### Para mejores resultados OCR
- **Resolución**: Usar imágenes de al menos 300 DPI
- **Contraste**: Texto oscuro sobre fondo claro
- **Formato**: PNG o TIFF para mejor calidad que JPG
- **Orientación**: Texto horizontal, sin rotación
- **Limpieza**: Evitar manchas, dobleces o reflejos

#### Para mejor rendimiento
- **Tamaño**: Imágenes entre 1-5MB son ideales
- **Cantidad**: Procesar máximo 5 imágenes simultáneas
- **Navegador**: Usar Chrome o Firefox para mejor compatibilidad

### Logs y debugging
```bash
# Ver logs del servidor
npm run dev
# Los errores aparecerán en la consola

# Verificar archivos temporales
ls -la /tmp/snaptag-*
```

## 🏗️ Arquitectura técnica

### Stack tecnológico
- **Frontend**: Astro + React + TypeScript
- **Backend**: Node.js + Astro SSR
- **OCR**: Tesseract.js v5
- **Estilos**: Tailwind CSS
- **Procesamiento**: Buffer nativo de Node.js

### Estructura del proyecto
```
src/
├── components/          # Componentes React
├── pages/              # Rutas y API endpoints
├── lib/ocr/           # Lógica OCR y utilidades
├── styles/            # Estilos globales
└── types/             # Definiciones TypeScript
```

---

**Desarrollado para procesamiento eficiente de etiquetas de envío argentinas** 🇦🇷