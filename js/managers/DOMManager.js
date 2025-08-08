// ===== GESTIÓN DEL DOM =====
export class DOMManager {
    constructor() {
        this.elements = this.initializeElements();
    }
    
    initializeElements() {
        const selectors = {
            // Contenedores principales
            analysisContainer: 'analysisContainer',
            subcontractView: 'subcontractView',
            subcontractProgressContainer: 'subcontractProgressContainer',
            noDataMessage: 'noDataMessage',
            
            // Controles
            fileInput: 'fileInput',
            fileNameDisplay: 'fileNameDisplay',
            weekSelect: 'weekSelect',
            daySelect: 'daySelect',
            tematicaSelect: 'tematicaSelect',
            itemSelect: 'itemSelect',
            personSelect: 'personSelect',
            stateSelect: 'stateSelect',
            originSelect: 'originSelect',
            subcontractSelect: 'subcontractSelect',
            
            // Indicadores
            loadingIndicator: 'loadingIndicator',
            alertBox: 'alertBox',
            globalLoader: 'globalLoader',
            
            // Estadísticas header
            headerTotalItems: 'headerTotalItems',
            headerTotalADC: 'headerTotalADC',
            headerTotalPAC: 'headerTotalPAC',
            headerIncorporated: 'headerIncorporated',
            headerEditorial: 'headerEditorial',
            
            // Modales
            questionsModal: 'questionsModal',
            modalTitle: 'modalTitle',
            questionsList: 'questionsList',
            modalOverflowNote: 'modalOverflowNote',
            
            // Estadísticas
            totalItems: 'totalItems',
            totalADC: 'totalADC',
            totalPAC: 'totalPAC',
            totalItemsPrev: 'totalItemsPrev',
            totalADCPrev: 'totalADCPrev',
            totalPACPrev: 'totalPACPrev',
            
            // Otros
            roleStats: 'roleStats',
            evolutionContainer: 'evolutionContainer',
            comparisonContainer: 'comparisonContainer',
            comparisonResults: 'comparisonResults',
            sidebar: 'sidebar',
            toastContainer: 'toastContainer'
        };
        
        const elements = {};
        for (const [key, id] of Object.entries(selectors)) {
            elements[key] = document.getElementById(id);
        }
        
        // Elementos especiales que requieren querySelector
        elements.legendADCBody = document.getElementById('legendADC')?.querySelector('tbody');
        elements.legendPACBody = document.getElementById('legendPAC')?.querySelector('tbody');
        elements.legendTotalBody = document.getElementById('legendTotal')?.querySelector('tbody');
        
        return elements;
    }
    
    get(elementKey) {
        return this.elements[elementKey];
    }
    
    show(elementKey) {
        const element = this.get(elementKey);
        if (element) element.classList.remove('hidden');
    }
    
    hide(elementKey) {
        const element = this.get(elementKey);
        if (element) element.classList.add('hidden');
    }
    
    toggle(elementKey, force) {
        const element = this.get(elementKey);
        if (element) element.classList.toggle('hidden', force);
    }
} 