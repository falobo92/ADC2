import { PREDEFINED_DATA, ESTADO_ORDER } from '../config/constants.js';

// ===== GESTIÓN DE FILTROS =====
export class FilterManager {
    constructor(domManager, dataManager, notificationManager) {
        this.dom = domManager;
        this.data = dataManager;
        this.notifications = notificationManager;
        this.currentFilters = {};
    }
    
    initializeSelectors() {
        this.populateStaticSelectors();
        this.updateDynamicSelectors();
    }
    
    populateStaticSelectors() {
        // Temáticas
        this.populateSelect('tematicaSelect', PREDEFINED_DATA.tematicas, 'Todas las temáticas');
        
        // Items
        this.populateSelect('itemSelect', Object.keys(PREDEFINED_DATA.items), 'Todos los ítems');
        
        // Personas
        this.populateSelect('personSelect', PREDEFINED_DATA.people.sort(), 'Todas las personas');
        
        // Estados (usar orden predefinido)
        const states = ESTADO_ORDER;
        this.populateSelect('stateSelect', states, 'Todos los estados');
        
        // Subcontratos
        this.populateSelect('subcontractSelect', PREDEFINED_DATA.subcontracts.sort(), 'Todos los subcontratos');

        // Origen
        this.populateSelect('originSelect', ['OWNER TEAM', 'Subcontratos (todas las demás)'], 'Todos los orígenes');
    }
    
    populateSelect(selectId, options, defaultText) {
        const select = this.dom.get(selectId);
        if (!select) return;
        
        select.innerHTML = `<option value="all">${defaultText}</option>`;
        options.forEach(option => {
            const optionEl = new Option(option, option);
            select.appendChild(optionEl);
        });
    }
    
    updateDynamicSelectors() {
        this.updateWeekSelector();
        this.updateDaySelector();
        this.updateSubcontractSelector();
    }
    
    updateWeekSelector() {
        const weekSelect = this.dom.get('weekSelect');
        if (!weekSelect) return;
        
        const currentWeek = weekSelect.value;
        const weeks = this.data.getUniqueValues('Semana')
            .map(w => String(w))
            .sort((a, b) => parseInt(b) - parseInt(a));
        
        weekSelect.innerHTML = weeks.length === 0 ? 
            '<option value="">Cargue datos</option>' : 
            '<option value="all">Todas las semanas</option>';
        
        weeks.forEach(week => {
            weekSelect.appendChild(new Option(`Semana ${week}`, week));
        });
        
        weekSelect.value = weeks.includes(currentWeek) ? currentWeek : 
            (weeks.length > 0 && currentWeek !== "all" ? weeks[0] : "all");
    }
    
    updateDaySelector(selectedWeek = 'all', selectLastDate = false) {
        const daySelect = this.dom.get('daySelect');
        if (!daySelect) return;
        
        const currentDayVal = daySelect.value;
        daySelect.innerHTML = '';
        
        let relevantData = selectedWeek === 'all' || selectedWeek === '' ? 
            this.data.state.allRawData : 
            this.data.state.allRawData.filter(item => String(item.Semana) === selectedWeek);
        
        const dates = [...new Set(relevantData.map(item => item.FechaReporte))]
            .sort((a, b) => b.localeCompare(a));
        
        if (dates.length > 0) {
            dates.forEach(date => {
                const parts = date.split('-');
                const optionText = `${parts[2]}/${parts[1]}/${parts[0]}`;
                daySelect.appendChild(new Option(optionText, date));
            });
            daySelect.value = selectLastDate ? dates[0] : 
                (dates.includes(currentDayVal) ? currentDayVal : dates[0]);
        } else {
            daySelect.innerHTML = '<option value="">No hay fechas</option>';
        }
        
        daySelect.disabled = selectedWeek === '' || dates.length === 0;
    }
    
    updateSubcontractSelector() {
        const subcontractSelect = this.dom.get('subcontractSelect');
        if (!subcontractSelect) return;
        
        let subcontractsToShow = [];
        
        if (this.data.state.allRawData.length > 0) {
            const allDates = this.data.getUniqueValues('FechaReporte').sort();
            const latestDate = allDates[allDates.length - 1];
            const latestReportData = this.data.state.allRawData.filter(item => item.FechaReporte === latestDate);
            subcontractsToShow = [...new Set(latestReportData.map(item => item.Subcontrato).filter(Boolean))].sort();
            
            if (subcontractsToShow.length === 0) {
                subcontractsToShow = this.data.getUniqueValues('Subcontrato').sort();
            }
        } else {
            subcontractsToShow = [...PREDEFINED_DATA.subcontracts].sort();
        }
        
        subcontractSelect.innerHTML = `<option value="all">Todos los subcontratos</option>`;
        subcontractsToShow.forEach(subcontract => {
            subcontractSelect.appendChild(new Option(subcontract, subcontract));
        });
    }
    
    getCurrentFilters() {
        return {
            week: this.dom.get('weekSelect')?.value || 'all',
            day: this.dom.get('daySelect')?.value || '',
            tematica: this.dom.get('tematicaSelect')?.value || 'all',
            item: this.dom.get('itemSelect')?.value || 'all',
            person: this.dom.get('personSelect')?.value || 'all',
            state: this.dom.get('stateSelect')?.value || 'all',
            subcontract: this.dom.get('subcontractSelect')?.value || 'all',
            origin: this.dom.get('originSelect')?.value || 'all'
        };
    }
    
    clearAllFilters() {
        const selectors = ['weekSelect', 'daySelect', 'tematicaSelect', 'itemSelect', 
                          'personSelect', 'stateSelect', 'subcontractSelect'];
        
        selectors.forEach(selector => {
            const element = this.dom.get(selector);
            if (element) {
                element.value = selector === 'weekSelect' ? 'all' : 
                              (selector === 'daySelect' ? '' : 'all');
            }
        });
        
        this.updateDaySelector('all', true);
        this.notifications.showToast('Filtros eliminados', 'info');
    }
    
    enableControls(enable = true) {
        const controls = ['weekSelect', 'daySelect', 'tematicaSelect', 'itemSelect', 
                         'personSelect', 'stateSelect', 'subcontractSelect'];
        
        controls.forEach(control => {
            const element = this.dom.get(control);
            if (element) element.disabled = !enable;
        });
    }
} 