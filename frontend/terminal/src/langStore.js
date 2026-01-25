// Language store for internationalization
class LangStore {
    constructor() {
        this.lang = 'en'; // Default language
        this.translations = {
            en: {
                // Chart labels
                chart: 'Chart',
                data: 'Data',
                fields: 'Fields',
                filters: 'Filters',
                export: 'Export',
                save: 'Save',
                reset: 'Reset',
                
                // Field types
                fieldTypes: {
                    quantitative: 'Quantitative',
                    nominal: 'Nominal',
                    ordinal: 'Ordinal',
                    temporal: 'Temporal'
                },
                
                // Chart types
                chartTypes: {
                    bar: 'Bar Chart',
                    line: 'Line Chart',
                    area: 'Area Chart',
                    scatter: 'Scatter Plot',
                    pie: 'Pie Chart',
                    histogram: 'Histogram',
                    boxplot: 'Box Plot'
                },
                
                // Actions
                actions: {
                    addField: 'Add Field',
                    removeField: 'Remove Field',
                    clearAll: 'Clear All',
                    applyFilter: 'Apply Filter',
                    removeFilter: 'Remove Filter'
                },
                
                // Messages
                messages: {
                    noData: 'No data available',
                    loading: 'Loading...',
                    error: 'An error occurred',
                    success: 'Operation completed successfully'
                }
            },
            es: {
                // Chart labels
                chart: 'Gráfico',
                data: 'Datos',
                fields: 'Campos',
                filters: 'Filtros',
                export: 'Exportar',
                save: 'Guardar',
                reset: 'Reiniciar',
                
                // Field types
                fieldTypes: {
                    quantitative: 'Cuantitativo',
                    nominal: 'Nominal',
                    ordinal: 'Ordinal',
                    temporal: 'Temporal'
                },
                
                // Chart types
                chartTypes: {
                    bar: 'Gráfico de Barras',
                    line: 'Gráfico de Líneas',
                    area: 'Gráfico de Área',
                    scatter: 'Gráfico de Dispersión',
                    pie: 'Gráfico Circular',
                    histogram: 'Histograma',
                    boxplot: 'Gráfico de Cajas'
                },
                
                // Actions
                actions: {
                    addField: 'Agregar Campo',
                    removeField: 'Eliminar Campo',
                    clearAll: 'Limpiar Todo',
                    applyFilter: 'Aplicar Filtro',
                    removeFilter: 'Eliminar Filtro'
                },
                
                // Messages
                messages: {
                    noData: 'No hay datos disponibles',
                    loading: 'Cargando...',
                    error: 'Ocurrió un error',
                    success: 'Operación completada exitosamente'
                }
            }
        };
    }
    
    // Get current language
    getCurrentLang() {
        return this.lang;
    }
    
    // Set language
    setLang(lang) {
        if (this.translations[lang]) {
            this.lang = lang;
        } else {
            console.warn(`Language ${lang} not supported. Falling back to English.`);
            this.lang = 'en';
        }
    }
    
    // Get translation for a key
    getTranslation(key) {
        const keys = key.split('.');
        let translation = this.translations[this.lang];
        
        for (const k of keys) {
            if (translation && translation[k]) {
                translation = translation[k];
            } else {
                // Fallback to English
                translation = this.translations.en;
                for (const k of keys) {
                    if (translation && translation[k]) {
                        translation = translation[k];
                    } else {
                        return key; // Return key if translation not found
                    }
                }
                break;
            }
        }
        
        return translation;
    }
    
    // Get all translations for current language
    getAllTranslations() {
        return this.translations[this.lang];
    }
    
    // Add custom translation
    addTranslation(lang, key, value) {
        if (!this.translations[lang]) {
            this.translations[lang] = {};
        }
        
        const keys = key.split('.');
        let current = this.translations[lang];
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
    }
}

// Create and export a singleton instance
const langStore = new LangStore();

export default langStore;
