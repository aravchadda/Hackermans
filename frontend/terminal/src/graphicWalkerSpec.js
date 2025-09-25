// GraphicWalker configuration specification
export const graphicWalkerSpec = {
    // Chart configuration
    chart: {
        type: 'auto', // auto, bar, line, area, scatter, pie, etc.
        title: 'Data Visualization',
        subtitle: 'Interactive Chart',
        theme: 'light', // light, dark
        colorScheme: 'default'
    },
    
    // Data configuration
    data: {
        autoInfer: true,
        enableDataExport: true,
        maxDataPoints: 10000
    },
    
    // Interaction settings
    interaction: {
        enableTooltip: true,
        enableZoom: true,
        enablePan: true,
        enableBrush: true,
        enableCrossFilter: true
    },
    
    // Layout settings
    layout: {
        width: '100%',
        height: '400px',
        responsive: true,
        padding: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
        }
    },
    
    // Feature flags
    features: {
        enableDataTable: true,
        enableFieldPanel: true,
        enableFilterPanel: true,
        enableChartPanel: true,
        enableExport: true,
        enableSave: true
    },
    
    // Default field mappings
    defaultFields: {
        x: null,
        y: null,
        color: null,
        size: null,
        shape: null,
        opacity: null
    },
    
    // Chart styling
    styling: {
        backgroundColor: '#ffffff',
        borderColor: '#e0e0e0',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }
};
