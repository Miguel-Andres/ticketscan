/**
 * Configuración optimizada de Tesseract para etiquetas de envío
 */

/**
 * Parámetros de inicialización que deben establecerse al crear el worker
 * Optimizados para reconocimiento de etiquetas de envío
 */
export const getTesseractInitParams = () => ({
  // Modo de motor OCR: 2 = LSTM solo, 3 = LSTM + Legacy (mejor para texto mixto)
  tessedit_ocr_engine_mode: '2',
  
  // Cargar diccionarios para mejorar reconocimiento
  load_system_dawg: '1',
  load_freq_dawg: '1',
  load_number_dawg: '1',
  load_punc_dawg: '1',
  load_unambig_dawg: '1',
  
  // Activar modelo de lenguaje n-gram para mejorar precisión
  language_model_ngram_on: '1',
  language_model_ngram_order: '4',
  language_model_min_compound_length: '3',
  
  // Optimizaciones para reconocimiento de números y códigos
  tessedit_char_blacklist: '{}[]|~`^',
  tessedit_enable_doc_dict: '1'
});

/**
 * Parámetros de ejecución que pueden establecerse después de la inicialización
 * Optimizados para etiquetas de envío con códigos alfanuméricos y direcciones
 */
export const getTesseractRuntimeParams = () => ({
  // Modo de segmentación de página: 4 = Columna de texto de altura variable (mejor para etiquetas)
  tessedit_pageseg_mode: '4',
  
  // Lista de caracteres permitidos (incluye caracteres especiales para direcciones y códigos postales)
  tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:-_#\/()[]{}@&%$\'"\u00C1\u00C9\u00CD\u00D3\u00DA\u00DC\u00D1\u00E1\u00E9\u00ED\u00F3\u00FA\u00FC\u00F1 ',
  
  // Configuración de salida
  tessjs_create_hocr: '0',
  tessjs_create_tsv: '0',
  tessedit_write_images: '0',
  
  // Optimizaciones para texto en etiquetas
  tessedit_do_invert: '0',           // No invertir imagen (asumimos texto oscuro en fondo claro)
  textord_heavy_nr: '0',             // Desactivar filtro de ruido pesado
  textord_min_linesize: '1.25',      // Tamaño mínimo de línea reducido para capturar texto pequeño
  classify_bln_numeric_mode: '1',    // Modo numérico para mejor reconocimiento de dígitos
  
  // Optimizaciones para palabras cortas y códigos
  language_model_penalty_non_dict_word: '0.15',  // Menor penalización para palabras fuera del diccionario
  language_model_penalty_non_freq_dict_word: '0.01', // Menor penalización para palabras poco frecuentes
  textord_force_make_prop_words: '0',
  tessedit_preserve_min_wd_len: '2',  // Preservar palabras cortas (CP, ID, etc.)
  
  // Optimizaciones para contornos y segmentación
  edges_max_children_per_outline: '50',  // Aumentado para manejar caracteres complejos
  edges_children_count_limit: '5',       // Aumentado para mejor detección de caracteres
  edges_min_nonhole: '10',               // Aumentado para mejor detección de formas
  
  // Corrección de espacios y caracteres
  tessedit_fix_fuzzy_spaces: '1',        // Corregir espacios borrosos
  tessedit_enable_dict_correction: '1',  // Habilitar corrección de diccionario
  
  // Penalizaciones de segmentación
  segment_penalty_dict_nonword: '0.25',  // Reducido para permitir códigos y números
  segment_penalty_garbage: '0.8',        // Reducido para evitar descartar caracteres válidos
  stopper_nondict_certainty_base: '-2.5', // Aumentar certeza para palabras fuera del diccionario
  
  // Optimizaciones adicionales
  chop_enable: '1',                     // Habilitar división de caracteres pegados
  use_new_state_cost: '1',
  segment_segcost_rating: '0.1',        // Aumentado para mejor segmentación
  textord_noise_sizelimit: '0.2',       // Aumentado para ignorar manchas pequeñas
  
  // Configuración de rechazo
  tessedit_reject_mode: '0',            // No rechazar caracteres
  tessedit_zero_rejection: '1',         // No rechazar caracteres con baja confianza
  suspect_level: '80',                  // Nivel de sospecha reducido
  
  // Optimizaciones para caracteres pegados
  tessedit_tess_adapt_to_char_fragments: '1',
  tessedit_adaption_debug: '0',
  applybox_learn_chars_and_char_frags_mode: '1'
});
