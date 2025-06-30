import { AppState } from '../models/AppState.js';
import { DOMManager } from '../managers/DOMManager.js';
import { NotificationManager } from '../managers/NotificationManager.js';
import { DataManager } from '../managers/DataManager.js';
import { FilterManager } from '../managers/FilterManager.js';
import { ChartManager } from '../managers/ChartManager.js';
import { DataAnalyzer } from '../analyzers/DataAnalyzer.js';
import { UIController } from '../controllers/UIController.js';
import { DataController } from '../controllers/DataController.js';
import { ExportModule } from '../modules/ExportModule.js';
import { Utils } from '../utils/helpers.js';
import { CONFIG, ESTADO_COLORS, ESTADO_FONT_COLORS } from '../config/constants.js';
import { updateEvolutionChart } from './EvolutionChart.js';

// ===== CONTROLADOR PRINCIPAL DE LA APLICACIÓN =====
export class DashboardApp {
    constructor() {
        this.state = new AppState();
        this.dom = new DOMManager();
        this.notifications = new NotificationManager(this.dom);
        this.dataManager = new DataManager(this.state, this.notifications);
        this.filterManager = new FilterManager(this.dom, this.dataManager, this.notifications);
        this.chartManager = new ChartManager(this.state);
        this.uiController = new UIController(this.state, this.dom, this.notifications);
        this.dataController = new DataController(
            this.state, this.dataManager, this.filterManager, this.chartManager, DataAnalyzer, this.notifications
        );
        this.exportModule = new ExportModule(this.dataManager, this.notifications);
        this.initialize();
    }

    async initialize() {
        try {
            this.state.loadFromStorage();
            this.setupEventListeners();
            this.filterManager.initializeSelectors();
            this.dataController.initializeView();
            console.log('Dashboard inicializado correctamente');
        } catch (error) {
            console.error('Error inicializando dashboard:', error);
            this.notifications.showToast('Error inicializando la aplicación', 'error');
        }
    }

    setupEventListeners() {
        const fileInput = this.dom.get('fileInput');
        if (fileInput) fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        const filterElements = [
            'weekSelect', 'daySelect', 'tematicaSelect', 'itemSelect', 'personSelect', 'stateSelect', 'subcontractSelect'
        ];
        const debouncedAnalyze = Utils.debounce(() => this.dataController.applyFiltersAndAnalyze(), 300);
        filterElements.forEach(id => {
            const el = this.dom.get(id);
            if (el) el.addEventListener('change', debouncedAnalyze);
        });
        const weekSelect = this.dom.get('weekSelect');
        if (weekSelect) {
            weekSelect.addEventListener('change', (e) => {
                this.filterManager.updateDaySelector(e.target.value, true);
                this.state.previousStats = null;
                debouncedAnalyze();
            });
        }
        document.addEventListener('keydown', (e) => this.uiController.handleKeyboard(e));
        document.addEventListener('click', (e) => this.uiController.handleOutsideClick(e));
        window.addEventListener('resize', Utils.throttle(() => this.uiController.handleResize(), 250));
    }

    async handleFileUpload(event) {
        const files = event.target.files;
        if (!files.length) {
            this.uiController.updateFileDisplay('Ningún archivo seleccionado');
            return;
        }
        this.uiController.updateFileDisplay(files);
        await this.dataController.handleFileUpload(files);
        event.target.value = '';
    }

    // Métodos públicos para funciones globales
    clearAllFilters() { this.filterManager.clearAllFilters(); }
    exportToExcel() { this.exportModule.exportToExcel(); }
    clearAllData() {
        if (confirm('¿Seguro que deseas eliminar todos los datos cargados?')) {
            this.dataManager.clearAllData();
            this.filterManager.updateDynamicSelectors();
            this.dataController.initializeView();
            this.notifications.showToast('Datos eliminados correctamente', 'success');
        }
    }
    toggleSidebar() { this.uiController.toggleSidebar(); }
    switchMainTab(tab) {
        this.uiController.switchMainTab(tab);
        setTimeout(() => this.dataController.applyFiltersAndAnalyze(), 10);
    }
    switchTab(tab) {
        this.uiController.switchTab(tab);
        this.renderActiveSubcontractTab();
    }
    closeModal(modalId) { this.uiController.closeModal(modalId); }
    updateEvolutionView() {
        const filterType = document.getElementById('evolutionFilterType')?.value || 'TODOS';
        const evolutionData = this.state.currentEvolutionData.length > 0 
            ? this.state.currentEvolutionData 
            : this.state.currentFilteredData;
        this.updateEvolutionChart(evolutionData, filterType);
    }
    updateSubcontractView() {
        // Obtener el valor seleccionado
        const subcontractSelect = document.getElementById('subcontractSelect');
        const selectedSubcontract = subcontractSelect ? subcontractSelect.value : 'all';
        
        // Filtrar los datos según el subcontrato seleccionado
        let filteredData = this.state.currentFilteredData;
        if (selectedSubcontract && selectedSubcontract !== 'all') {
            filteredData = filteredData.filter(item => item.Subcontrato === selectedSubcontract);
        }
        
        // Actualizar la grid y estadísticas de subcontratos en la pestaña principal
        const subcontracts = this.dataController.getSubcontractsData(filteredData);
        this.dataController.updateSubcontractStats(subcontracts);
        this.dataController.renderSubcontractsGrid(subcontracts);
        this.dataController.renderSubcontractEvolutionChart(subcontracts);
    }
    viewSubcontractDetails(subcontract) {
        const subcontractSelect = document.getElementById('subcontractSelect');
        if (subcontractSelect) {
            subcontractSelect.value = subcontract;
            subcontractSelect.dispatchEvent(new Event('change'));
        }
    }
    showQuestionsInModal(clickedState, chartType) {
        let filteredData = this.state.currentFilteredData.filter(item => item.Estado === clickedState);
        if (chartType !== 'total') filteredData = filteredData.filter(item => item.Documento === chartType);
        if (!filteredData.length) {
            this.notifications.showToast('No hay preguntas para mostrar', 'info');
            return;
        }
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) modalTitle.textContent = `${clickedState} (${filteredData.length} items)`;
        const questionsList = document.getElementById('questionsList');
        if (questionsList) {
            questionsList.innerHTML = '';
            const maxDisplayItems = CONFIG.PAGINATION.MAX_MODAL_ITEMS || 200;
            filteredData.slice(0, maxDisplayItems).forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="question-item-compact">
                        <div class="question-header-compact">
                            <div class="question-info">
                                <span class="question-id">${item.ID_Corregido || item.ID}</span>
                                <span class="document-badge">${item.Documento || 'N/A'}</span>
                                <span class="status-badge-compact" style="background: ${ESTADO_COLORS[item.Estado] || ESTADO_COLORS.default};color: ${ESTADO_FONT_COLORS[item.Estado] || ESTADO_FONT_COLORS.default};">${item.Estado}</span>
                            </div>
                        </div>
                        <div class="question-meta">
                            <span class="meta-item"><strong>Temática:</strong> ${item.Tematica || 'N/A'}</span>
                            <span class="meta-separator">•</span>
                            <span class="meta-item"><strong>Elaborador:</strong> ${item.Elaborador || 'N/A'}</span>
                            <span class="meta-separator">•</span>
                            <span class="meta-item"><strong>Revisor:</strong> ${item.Revisor || 'N/A'}</span>
                            <span class="meta-separator">•</span>
                            <span class="meta-item"><strong>Coordinador:</strong> ${item.Coordinador || 'N/A'}</span>
                            ${item.Subcontrato ? `<span class="meta-separator">•</span><span class="meta-item"><strong>Subcontrato:</strong> ${item.Subcontrato}</span>` : ''}
                        </div>
                        ${item.Pregunta || item.Consulta ? `<div class="question-text"><div class="question-content">${item.Pregunta || item.Consulta}</div></div>` : ''}
                    </div>
                `;
                questionsList.appendChild(li);
            });
            const modalOverflowNote = document.getElementById('modalOverflowNote');
            if (modalOverflowNote) {
                if (filteredData.length > maxDisplayItems) {
                    modalOverflowNote.innerHTML = `<div style="text-align: center; padding: 1rem; background: var(--bg-tertiary); border-radius: 8px; margin-top: 1rem;"><i class="fas fa-info-circle" style="color: var(--info-color); margin-right: 0.5rem;"></i><strong>Mostrando ${maxDisplayItems} de ${filteredData.length} items</strong><br><small>Usa filtros para ver resultados más específicos</small></div>`;
                    modalOverflowNote.classList.remove('hidden');
                } else {
                    modalOverflowNote.classList.add('hidden');
                }
            }
        }
        this.uiController.showModal('questionsModal');
    }
    updateEvolutionChart(data, filterType = 'TODOS') {
        const domElements = {
            evolutionChartContainer: document.querySelector('.evolution-chart-container'),
            evolutionDataContainer: document.querySelector('.evolution-data-container')
        };
        if (!data || !data.length) {
            if (domElements.evolutionChartContainer) domElements.evolutionChartContainer.innerHTML = '<p>No hay datos disponibles para mostrar el gráfico de evolución.</p>';
            return;
        }
        import('./EvolutionChart.js').then(module => {
            module.updateEvolutionChart(data, filterType, domElements, this.state.charts);
        }).catch(error => {
            console.error('Error al cargar el gráfico de evolución:', error);
            this.notifications.showToast('Error al cargar el gráfico de evolución', 'error');
        });
    }
    // Métodos placeholder para funcionalidades futuras
    renderActiveSubcontractTab() {}
    updateSubcontractSelector() {}
    showSubcontractDetailsModal(subcontractName) {
        // Filtrar los datos del subcontrato
        const filteredData = this.state.currentFilteredData.filter(item => item.Subcontrato === subcontractName);
        if (!filteredData.length) {
            this.notifications.showToast('No hay datos para este subcontrato', 'info');
            return;
        }
        // Calcular estadísticas
        const total = filteredData.length;
        const incorporadas = filteredData.filter(item => item.Estado === 'Incorporada').length;
        const editorial = filteredData.filter(item => item.Estado === 'En revisor editorial').length;
        const progreso = total > 0 ? Math.round((incorporadas / total) * 100) : 0;
        // Actualizar título del modal
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) modalTitle.textContent = `Subcontrato: ${subcontractName}`;
        // Construir lista de items
        const questionsList = document.getElementById('questionsList');
        if (questionsList) {
            questionsList.innerHTML = `
                <li><strong>Total Items:</strong> ${total}</li>
                <li><strong>Incorporadas:</strong> ${incorporadas}</li>
                <li><strong>En Editorial:</strong> ${editorial}</li>
                <li><strong>Progreso:</strong> ${progreso}%</li>
                <hr>
            `;
            filteredData.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="question-item-compact">
                        <div class="question-header-compact">
                            <div class="question-info">
                                <span class="question-id">${item.ID_Corregido || item.ID}</span>
                                <span class="document-badge">${item.Documento || 'N/A'}</span>
                                <span class="status-badge-compact" style="background: ${ESTADO_COLORS[item.Estado] || ESTADO_COLORS.default};color: ${ESTADO_FONT_COLORS[item.Estado] || ESTADO_FONT_COLORS.default};">${item.Estado}</span>
                            </div>
                        </div>
                        <div class="question-meta">
                            <span class="meta-item"><strong>Temática:</strong> ${item.Tematica || 'N/A'}</span>
                            <span class="meta-separator">•</span>
                            <span class="meta-item"><strong>Elaborador:</strong> ${item.Elaborador || 'N/A'}</span>
                            <span class="meta-separator">•</span>
                            <span class="meta-item"><strong>Revisor:</strong> ${item.Revisor || 'N/A'}</span>
                            <span class="meta-separator">•</span>
                            <span class="meta-item"><strong>Coordinador:</strong> ${item.Coordinador || 'N/A'}</span>
                        </div>
                        ${item.Pregunta || item.Consulta ? `<div class="question-text"><div class="question-content">${item.Pregunta || item.Consulta}</div></div>` : ''}
                    </div>
                `;
                questionsList.appendChild(li);
            });
        }
        // Mostrar el modal
        this.uiController.showModal('questionsModal');
    }
    // Exportar preguntas de un subcontrato a Excel
    exportSubcontractToExcel(subcontractName) {
        // Filtrar los datos del subcontrato
        const filteredData = this.state.currentFilteredData.filter(item => item.Subcontrato === subcontractName);
        if (!filteredData.length) {
            this.notifications.showToast('No hay datos para este subcontrato', 'info');
            return;
        }
        // Convertir a hoja Excel
        const ws = window.XLSX.utils.json_to_sheet(filteredData);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, subcontractName.substring(0, 31));
        window.XLSX.writeFile(wb, `subcontrato_${subcontractName}.xlsx`);
    }

    // Exportar todos los subcontratos a una sola planilla Excel (una hoja por subcontrato)
    exportAllSubcontractsToExcel() {
        // Agrupar por subcontrato
        const allData = this.state.currentFilteredData;
        if (!allData.length) {
            this.notifications.showToast('No hay datos para exportar', 'info');
            return;
        }
        const grouped = {};
        allData.forEach(item => {
            const name = item.Subcontrato || 'Sin Subcontrato';
            if (!grouped[name]) grouped[name] = [];
            grouped[name].push(item);
        });
        const wb = window.XLSX.utils.book_new();
        Object.entries(grouped).forEach(([name, items]) => {
            const ws = window.XLSX.utils.json_to_sheet(items);
            window.XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31));
        });
        window.XLSX.writeFile(wb, 'todos_los_subcontratos.xlsx');
    }
} 