// ===== CONFIGURACIÓN Y CONSTANTES =====
export const CONFIG = {
    VERSION: '3.0.0',
    STORAGE_KEY: 'adcReportData_v3',
    STATS_KEY: 'reportStats',
    
    // Metas de proyecto
    META_TOTAL: 494,
    META_ADC: 318,
    META_PAC: 176,
    
    // Límites y configuración
    PAGINATION: {
        DETAILS_PER_PAGE: 494,
        MAX_MODAL_ITEMS: 200
    },
    
    // Duraciones de animación
    ANIMATION: {
        NUMBER_DURATION: 500,
        TOAST_DURATION: 2000,
        LOADER_DELAY: 100
    },
    
    // Fechas del proyecto
    DATES: {
        PROJECT_START: '2024-06-01',
        PROJECT_END: '2024-08-29',
        WEEK_START: 23,
        WEEK_END: 35
    }
};

export const REQUIRED_FIELDS = ['ID', 'ID_Corregido', 'Documento', 'Estado', 'Elaborador', 'Revisor', 'Coordinador', 'FechaReporte', 'Tematica', 'Pregunta'];

export const OPTIONAL_FIELDS = ['Semana', 'Item', 'Subcontrato', 'Consulta', 'ModificadoPor', 'FechaEntrega', 'UltimaModificacion'];

export const ESTADO_ORDER = [
    'En elaboración',
    'En elaboración cartografía', 
    'Subcontrato',
    'En revisor técnico',
    'En coordinador',
    'En revisor editorial',
    'Incorporada',
    'Pendiente'
];

export const ESTADO_COLORS = {
    'En elaboración': '#E76F51',
    'En elaboración cartografía': '#FFCA3A',
    'Subcontrato': '#9CA3AF',
    'En revisor técnico': '#43AA8B',
    'En coordinador': '#577590',
    'En revisor editorial': '#B56576',
    'Incorporada': '#90BE6D',
    'Pendiente': '#D1D5DB',
    'default': '#9CA3AF'
};

export const ESTADO_FONT_COLORS = {
    'En elaboración': '#FFFFFF',
    'En elaboración cartografía': '#000000',
    'En revisor técnico': '#FFFFFF',
    'En coordinador': '#FFFFFF',
    'En revisor editorial': '#FFFFFF',
    'Incorporada': '#000000',
    'Subcontrato': '#000000',
    'Pendiente': '#000000',
    'default': '#FFFFFF'
};

export const PREDEFINED_DATA = {
    people: [
        "Nicolas Ibañez", "Oscar Perez", "Eduardo Elgueta", "Tomás Fernández", 
        "Sofia Ramos Basulto", "Felipe Lobo", "Marcelo Araya", "Chi-le Sun", 
        "Gloria Arriagada", "Vivian Hernandez"
    ],
    
    subcontracts: [
        "SEDNA - Arqueología", "FISIOAQUA - Medio marino", "ECODIVERSIDAD - Chinchilla",
        "EIS AMBIENTAL - Medio humano", "CELAB - Infiltraciones PAS 138", 
        "PAISAJE AMBIENTAL - Paisaje", "HUGO DÍAZ - Microrruteo y avifauna",
        "ECOTECNOS - Modelación pluma salina", "RUIDO AMBIENTAL - Ruido",
        "CRAMSA-ECOS"
    ],
    
    tematicas: [
        "Descripción proyecto", "Medio marino", "Hidro", "Calidad aire, emisiones",
        "Fauna", "Misceláneas", "Arqueología", "Turismo, paisaje", "Medio humano",
        "GGP", "Flora y vegetación", "Flora, fauna, Ecosistemas Marinos", "Luminosidad", 
        "PAS (DP)", "Ruido y vibraciones", "Flora, fauna", "Suelos"
    ],
    
    items: {
        "01. Descripción Proyecto": true,
        "02. Determinación y justificación del área de influencia (AI) del proyecto o actividad": true,
        "03. Línea de Base (LDB)": true,
        "04. Normativa Ambiental Aplicable": true,
        "05. Permisos Ambientales Sectoriales.": true,
        "06. Efectos, características o circunstancias del Artículo 11 de la Ley que dan origen a la necesidad de efectuar un EIA.": true,
        "07. Predicción y evaluación del impacto ambiental del proyecto o actividad": true,
        "08. Plan de medidas de mitigación, reparación y compensación": true,
        "09. Plan de prevención de contingencias y de emergencias": true,
        "10. Plan de seguimiento de las variables ambientales relevantes": true,
        "11. Ficha resumen para cada fase del proyecto o actividad": true,
        "12. Relación con las políticas, planes y programas de desarrollo regional": true,
        "13. Compromisos ambientales voluntarios": true,
        "14. Otras Consideraciones Relacionadas con el Proceso de Evaluación de Impacto Ambiental del Proyecto": true,
        "15. Participación Ciudadana": true,
        "Anexo PAC ADC": true
    }
}; 