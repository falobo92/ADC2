import { ESTADO_COLORS, ESTADO_ORDER } from '../config/constants.js';

// ===== CONTROLADOR DE DATOS =====
export class DataController {
    constructor(appState, dataManager, filterManager, chartManager, dataAnalyzer, notificationManager) {
        this.state = appState;
        this.dataManager = dataManager;
        this.filterManager = filterManager;
        this.chartManager = chartManager;
        this.dataAnalyzer = dataAnalyzer;
        this.notifications = notificationManager;
    }
    
    // Procesamiento de archivos
    async handleFileUpload(files) {
        if (!files.length) return;
        
        const result = await this.dataManager.handleFileUpload(files);
        
        if (result.success) {
            this.filterManager.updateDynamicSelectors();
            this.initializeView();
        }
        
        return result;
    }
    
    // Inicialización de vista
    initializeView() {
        if (this.state.allRawData.length > 0) {
            const weeks = this.dataManager.getUniqueValues('Semana')
                .map(w => String(w))
                .sort((a, b) => parseInt(b) - parseInt(a));
            
            const weekSelect = document.getElementById('weekSelect');
            if (weekSelect && weeks.length > 0) {
                weekSelect.value = weeks[0];
                this.filterManager.updateDaySelector(weeks[0], true);
            }
            
            this.applyFiltersAndAnalyze();
            document.getElementById('noDataMessage').classList.add('hidden');
        } else {
            this.clearDisplayElements();
            document.getElementById('noDataMessage').classList.remove('hidden');
            document.getElementById('analysisContainer').classList.add('hidden');
            this.filterManager.enableControls(false);
        }
    }
    
    // Aplicación de filtros y análisis
    applyFiltersAndAnalyze() {
        if (this.state.isProcessing) return;
        
        this.state.isProcessing = true;
        
        try {
            if (this.state.allRawData.length === 0) {
                this.clearDisplayElements();
                document.getElementById('analysisContainer').classList.add('hidden');
                document.getElementById('noDataMessage').classList.remove('hidden');
                this.filterManager.enableControls(false);
                return;
            }
            
            this.filterManager.enableControls(true);
            
            if (this.state.currentFilteredData.length > 0) {
                this.state.previousStats = this.getCurrentStats();
            }
            
            const filters = this.filterManager.getCurrentFilters();
            
            this.state.currentFilteredData = this.applyPunctualFilters(filters);
            this.state.currentEvolutionData = this.applyEvolutionFilters(filters);
            
                this.renderMainView();
            
            this.updateHeaderStats();
        } finally {
            setTimeout(() => {
                this.state.isProcessing = false;
            }, 50);
        }
    }
    
    // Filtros para vistas puntuales
    applyPunctualFilters(filters) {
        return this.state.allRawData.filter(item => {
            if (filters.week !== 'all' && String(item.Semana) !== filters.week) return false;
            if (filters.day && item.FechaReporte !== filters.day) return false;
            if (filters.tematica !== 'all' && item.Tematica !== filters.tematica) return false;
            if (filters.item !== 'all' && item.Item !== filters.item) return false;
            if (filters.state !== 'all' && item.Estado !== filters.state) return false;
            if (filters.person !== 'all') {
                const personMatch = item.Elaborador === filters.person || 
                                  item.Revisor === filters.person || 
                                  item.Coordinador === filters.person;
                if (!personMatch) return false;
            }
            return true;
        });
    }
    
    // Filtros para vista de evolución
    applyEvolutionFilters(filters) {
        return this.state.allRawData.filter(item => {
            if (filters.tematica !== 'all' && item.Tematica !== filters.tematica) return false;
            if (filters.item !== 'all' && item.Item !== filters.item) return false;
            if (filters.state !== 'all' && item.Estado !== filters.state) return false;
            if (filters.person !== 'all') {
                const personMatch = item.Elaborador === filters.person || 
                                  item.Revisor === filters.person || 
                                  item.Coordinador === filters.person;
                if (!personMatch) return false;
            }
            return true;
        });
    }
    
    // Renderizado de vista principal
    renderMainView() {
        document.getElementById('analysisContainer').classList.remove('hidden');
        this.analyzeAndDisplayData();
    }
    
    // Análisis y display de datos
    analyzeAndDisplayData() {
        const stateAnalysis = this.dataAnalyzer.analyzeStates(this.state.currentFilteredData);
        this.renderActiveMainTab(stateAnalysis);
    }
    
    // Renderizado de pestaña principal activa
    renderActiveMainTab(stateAnalysis) {
        switch (this.state.currentMainTab) {
            case 'dashboard':
                this.updateAllCharts(stateAnalysis);
                break;
            case 'evolution':
                this.renderEvolutionTab();
                break;
            case 'subcontracts':
                this.renderSubcontractsTab();
                break;
            case 'roles':
                this.analyzeRoles();
                break;
            case 'reports':
                this.renderReportsSection();
                break;
        }
    }
    
    // Actualización de gráficos
    updateAllCharts(stateAnalysis) {
        this.chartManager.destroyAllCharts();
        
        const chartConfigs = [
            { key: 'total', canvasId: 'chartTotal', cardId: 'chartTotalCard', legendId: 'legendTotal' },
            { key: 'ADC', canvasId: 'chartADC', cardId: 'chartADCCard', legendId: 'legendADC' },
            { key: 'PAC', canvasId: 'chartPAC', cardId: 'chartPACCard', legendId: 'legendPAC' }
        ];
        
        chartConfigs.forEach(config => {
            if (stateAnalysis[config.key] && Object.keys(stateAnalysis[config.key]).length > 0) {
                this.createChartWithLegend(config.canvasId, config.key, stateAnalysis[config.key], config.cardId, config.legendId);
            }
        });
    }
    
    // Creación de gráfico con leyenda
    createChartWithLegend(canvasId, chartKey, data, cardId, legendId) {
        const chart = this.chartManager.createDonutChart(canvasId, chartKey, data);
        if (chart) {
            this.populateLegendTable(legendId, data, chartKey);
            document.getElementById(cardId).classList.remove('hidden');
        }
    }
    
    // Poblado de tabla de leyenda
    populateLegendTable(tableId, data, chartKey) {
        const tableBody = document.querySelector(`#${tableId} tbody`);
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        const total = Object.values(data).reduce((acc, val) => acc + val, 0);
        
        // Ordenar los estados según ESTADO_ORDER
        const orderedStates = ESTADO_ORDER.filter(state => data.hasOwnProperty(state));
        
        orderedStates.forEach(state => {
            const count = data[state];
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1).replace('.', ',') : '0,0';
            const color = ESTADO_COLORS[state] || ESTADO_COLORS.default;
            
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 12px; height: 12px; background-color: ${color}; border-radius: 2px; flex-shrink: 0;"></div>
                    <span style="font-weight: normal;">${state}</span>
                </td>
                <td style="text-align: center; font-weight: 700;">${count}</td>
                <td style="text-align: center; font-weight: 700;">${percentage}%</td>
            `;
            
            // Hacer la fila interactiva
            row.style.cursor = 'pointer';
            row.addEventListener('click', () => {
                // Llamar al método showQuestionsInModal del DashboardApp
                if (window.app && window.app.showQuestionsInModal) {
                    window.app.showQuestionsInModal(state, chartKey);
                }
            });
            
            // Efectos hover
            row.addEventListener('mouseenter', () => {
                row.style.backgroundColor = 'var(--bg-tertiary)';
            });
            
            row.addEventListener('mouseleave', () => {
                row.style.backgroundColor = '';
            });
        });
    }
    
    // Actualización de estadísticas del header
    updateHeaderStats() {
        const stats = this.getCurrentStats();
        
        const elements = {
            'headerTotalItems': stats.total,
            'headerTotalADC': stats.adc,
            'headerTotalPAC': stats.pac,
            'headerIncorporated': stats.incorporated,
            'headerEditorial': stats.editorial
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }
    
    // Obtención de estadísticas actuales
    getCurrentStats() {
        const data = this.state.currentFilteredData;
        return {
            total: data.length,
            adc: data.filter(item => item.Documento === 'ADC').length,
            pac: data.filter(item => item.Documento === 'PAC').length,
            incorporated: data.filter(item => item.Estado === 'Incorporada').length,
            editorial: data.filter(item => item.Estado === 'En revisor editorial').length
        };
    }
    
    // Limpieza de elementos de display
    clearDisplayElements() {
        const elementsToClear = [
            'headerTotalItems', 'headerTotalADC', 'headerTotalPAC',
            'headerIncorporated', 'headerEditorial'
        ];
        
        elementsToClear.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = '0';
        });
    }
    
    // Métodos placeholder para funcionalidades futuras
    renderEvolutionTab() {
        // Implementar lógica de evolución
        if (window.app && window.app.updateEvolutionView) {
            // Asegurar que los datos de evolución estén actualizados
            const filters = this.filterManager.getCurrentFilters();
            this.state.currentEvolutionData = this.applyEvolutionFilters(filters);
            
            window.app.updateEvolutionView();
        } else {
            console.error('Función updateEvolutionView no está disponible');
        }
    }
    
    renderSubcontractsTab() {
        // Obtener el valor seleccionado del filtro de subcontrato
        const subcontractSelect = document.getElementById('subcontractSelect');
        const selectedSubcontract = subcontractSelect ? subcontractSelect.value : 'all';
        let filteredData = this.state.currentFilteredData;
        if (selectedSubcontract && selectedSubcontract !== 'all') {
            filteredData = filteredData.filter(item => item.Subcontrato === selectedSubcontract);
        }
        // Renderizar la vista de subcontratos con el filtrado aplicado
        const subcontracts = this.getSubcontractsData(filteredData);
        this.updateSubcontractStats(subcontracts);
        this.renderSubcontractsGrid(subcontracts);
        this.renderSubcontractEvolutionChart(subcontracts);
    }
    
    analyzeRoles() {
        const data = this.state.currentFilteredData;
        const roleAnalysis = this.dataAnalyzer.analyzeRoles(data);
        // Estados y colores
        const estados = [
            'En elaboración',
            'En elaboración cartografía',
            'Subcontrato',
            'En revisor técnico',
            'En coordinador',
            'En revisor editorial',
            'Incorporada'
        ];
        const estadoColors = {
            'En elaboración': '#f87171',
            'En elaboración cartografía': '#fde047',
            'Subcontrato': '#9ca3af',
            'En revisor técnico': '#38bdf8',
            'En coordinador': '#6366f1',
            'En revisor editorial': '#be185d',
            'Incorporada': '#4ade80'
        };
        // Filtros
        const sortSelect = document.getElementById('rolesSortSelect');
        const stateSelect = document.getElementById('rolesStateSelect');
        const searchInput = document.getElementById('rolesSearch');
        const filtroEstado = stateSelect ? stateSelect.value : 'todos';
        const filtroTexto = searchInput ? searchInput.value.trim().toLowerCase() : '';
        // Filtrar personas
        let personas = Object.keys(roleAnalysis);
        if (filtroTexto) {
            personas = personas.filter(p => p.toLowerCase().includes(filtroTexto));
        }
        // Ordenar
        const sortBy = sortSelect ? sortSelect.value : 'carga';
        if (sortBy === 'carga') {
            personas = personas.sort((a, b) => {
                const sumaA = estados.reduce((acc, est) => acc + (roleAnalysis[a][est] || 0), 0);
                const sumaB = estados.reduce((acc, est) => acc + (roleAnalysis[b][est] || 0), 0);
                return sumaB - sumaA;
            });
        } else {
            personas = personas.sort((a, b) => a.localeCompare(b));
        }
        // Construir datasets
        const estadosGraficar = filtroEstado === 'todos' ? estados : [filtroEstado];
        const datasets = estadosGraficar.map(estado => ({
            label: estado,
            data: personas.map(persona => roleAnalysis[persona][estado] || 0),
            backgroundColor: estadoColors[estado] || '#ccc',
            stack: 'stack1',
            borderWidth: 1,
            barThickness: 28,
            maxBarThickness: 32
        }));
        // Totales por persona
        const totales = personas.map(persona => estados.reduce((acc, est) => acc + (roleAnalysis[persona][est] || 0), 0));
        // Destruir gráfico anterior si existe
        if (window.app && window.app.state && window.app.state.charts && window.app.state.charts.roles) {
            window.app.state.charts.roles.destroy();
        }
        // Crear gráfico
        const ctx = document.getElementById('rolesChart').getContext('2d');
        window.app.state.charts.roles = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: personas,
                datasets: datasets
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.x}`;
                            },
                            afterBody: function(context) {
                                const idx = context[0].dataIndex;
                                return `Total: ${totales[idx]}`;
                            }
                        }
                    },
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        color: '#222',
                        font: { weight: 'bold', size: 12 },
                        formatter: (value, ctx) => {
                            // Solo mostrar total en la última barra apilada
                            if (ctx.datasetIndex === datasets.length - 1) {
                                return totales[ctx.dataIndex];
                            }
                            return '';
                        }
                    }
                },
                scales: {
                    x: { stacked: true, title: { display: false }, beginAtZero: true },
                    y: { stacked: true, title: { display: false } }
                },
                barPercentage: 0.8,
                categoryPercentage: 0.7
            },
            plugins: [ChartDataLabels]
        });
        // Leyenda compacta
        const legendDiv = document.getElementById('rolesLegend');
        if (legendDiv) {
            legendDiv.innerHTML = estadosGraficar.map(est => `<span style=\"display:inline-block;width:14px;height:14px;background:${estadoColors[est]};margin-right:5px;border-radius:3px;vertical-align:middle;\"></span><span style=\"font-size:0.95em;margin-right:12px;vertical-align:middle;\">${est}</span>`).join('');
        }
        // Listeners para filtros
        if (sortSelect && !sortSelect._rolesListener) {
            sortSelect.addEventListener('change', () => this.analyzeRoles());
            sortSelect._rolesListener = true;
        }
        if (stateSelect && !stateSelect._rolesListener) {
            stateSelect.addEventListener('change', () => this.analyzeRoles());
            stateSelect._rolesListener = true;
        }
        if (searchInput && !searchInput._rolesListener) {
            searchInput.addEventListener('input', () => this.analyzeRoles());
            searchInput._rolesListener = true;
        }
        // Exportar a Excel
        const exportBtn = document.getElementById('exportRolesExcelBtn');
        if (exportBtn && !exportBtn._rolesListener) {
            exportBtn.addEventListener('click', () => window.app.exportRolesToExcel && window.app.exportRolesToExcel());
            exportBtn._rolesListener = true;
        }
        // Exponer exportación global
        window.app.exportRolesToExcel = () => {
            const exportData = personas.map((persona, idx) => {
                const row = { Persona: persona, Total: totales[idx] };
                estadosGraficar.forEach(est => { row[est] = roleAnalysis[persona][est] || 0; });
                return row;
            });
            const ws = window.XLSX.utils.json_to_sheet(exportData);
            const wb = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(wb, ws, 'Roles');
            window.XLSX.writeFile(wb, 'analisis_roles.xlsx');
        };
    }
    
    renderReportsSection() {
        // Implementar sección de reportes
        console.log('Sección de reportes en desarrollo');
    }
    
    renderSubcontractsOverview() {
        const data = this.state.currentFilteredData;
        const subcontracts = this.getSubcontractsData(data);
        
        // Actualizar estadísticas generales
        this.updateSubcontractStats(subcontracts);
        
        // Renderizar grid de subcontratos
        this.renderSubcontractsGrid(subcontracts);
        
        // Renderizar gráfico de evolución temporal
        this.renderSubcontractEvolutionChart(subcontracts);
    }
    
    getSubcontractsData(data) {
        const subcontractsMap = new Map();
        
        data.forEach(item => {
            const subcontract = item.Subcontrato || 'Sin Subcontrato';
            if (!subcontractsMap.has(subcontract)) {
                subcontractsMap.set(subcontract, {
                    name: subcontract,
                    total: 0,
                    incorporated: 0,
                    editorial: 0,
                    inProgress: 0,
                    items: []
                });
            }
            
            const subData = subcontractsMap.get(subcontract);
            subData.total++;
            subData.items.push(item);
            
            if (item.Estado === 'Incorporada') {
                subData.incorporated++;
            } else if (item.Estado === 'En revisor editorial') {
                subData.editorial++;
            } else {
                subData.inProgress++;
            }
        });
        
        return Array.from(subcontractsMap.values());
    }
    
    updateSubcontractStats(subcontracts) {
        const totalSubcontracts = subcontracts.length;
        const completedSubcontracts = subcontracts.filter(sub => 
            sub.incorporated === sub.total && sub.total > 0
        ).length;
        const inProgressSubcontracts = subcontracts.filter(sub => 
            sub.inProgress > 0 || sub.editorial > 0
        ).length;
        
        const totalItems = subcontracts.reduce((acc, sub) => acc + sub.total, 0);
        const totalIncorporated = subcontracts.reduce((acc, sub) => acc + sub.incorporated, 0);
        const overallProgress = totalItems > 0 ? Math.round((totalIncorporated / totalItems) * 100) : 0;
        
        // Actualizar elementos del DOM
        const elements = {
            'totalSubcontracts': totalSubcontracts,
            'completedSubcontracts': completedSubcontracts,
            'inProgressSubcontracts': inProgressSubcontracts,
            'overallProgress': `${overallProgress}%`
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }
    
    renderSubcontractsGrid(subcontracts) {
        const gridContainer = document.getElementById('subcontractsGrid');
        if (!gridContainer) return;
        // Calcular el total de preguntas (items) del dataset filtrado
        const totalItems = subcontracts.reduce((acc, sub) => acc + sub.total, 0);
        const gridHTML = subcontracts.map(subcontract => {
            const progressPercentage = subcontract.total > 0 ? 
                Math.round((subcontract.incorporated / subcontract.total) * 100) : 0;
            const statusClass = subcontract.incorporated === subcontract.total && subcontract.total > 0 ? 
                'completed' : subcontract.inProgress > 0 || subcontract.editorial > 0 ? 
                'in-progress' : 'pending';
            // Calcular % de incidencia
            const incidencia = totalItems > 0 ? ((subcontract.total / totalItems) * 100).toFixed(1).replace('.', ',') : '0,0';
            // Calcular pendientes
            const pendientes = subcontract.total - subcontract.incorporated - subcontract.editorial;
            // Obtener responsable principal (si existe)
            let responsable = '';
            if (subcontract.items && subcontract.items.length > 0) {
                responsable = subcontract.items[0].Coordinador || subcontract.items[0].Elaborador || subcontract.items[0].Revisor || '';
            }
            return `
                <div class="subcontract-card" data-subcontract="${subcontract.name}">
                    <div class="subcontract-header">
                        <div>
                            <h4 class="subcontract-title">${subcontract.name}</h4>
                        <span class="subcontract-status ${statusClass}">
                            ${statusClass === 'completed' ? 'Completado' : 
                              statusClass === 'in-progress' ? 'En Progreso' : 'Pendiente'}
                        </span>
                            <span class="subcontract-incidencia" title="Porcentaje de incidencia en el total de preguntas">${incidencia}% del total</span>
                        </div>
                        <button class="btn btn-info btn-details" onclick="window.app.showSubcontractDetailsModal('${subcontract.name}')" title="Ver detalles"><i class="fas fa-eye"></i></button>
                        <button class="btn btn-success btn-export" onclick="window.app.exportSubcontractToExcel('${subcontract.name}')" title="Exportar preguntas a Excel"><i class="fas fa-file-excel"></i></button>
                        </div>
                    <div class="progress-bar-outer">
                        <div class="progress-bar-inner" style="width: ${progressPercentage}%"></div>
                        <span class="progress-bar-label">${progressPercentage}%</span>
                        </div>
                    <div class="subcontract-stats-row">
                        <div class="stat-block"><span class="stat-label">Total</span><span class="stat-value">${subcontract.total}</span></div>
                        <div class="stat-block"><span class="stat-label">Incorporadas</span><span class="stat-value completed">${subcontract.incorporated}</span></div>
                        <div class="stat-block"><span class="stat-label">Editorial</span><span class="stat-value editorial">${subcontract.editorial}</span></div>
                        <div class="stat-block"><span class="stat-label">Pendientes</span><span class="stat-value pending">${pendientes}</span></div>
                    </div>
                    <div class="subcontract-footer">
                        <span class="footer-label"><i class="fas fa-user"></i> Responsable: ${responsable || 'N/A'}</span>
                    </div>
                </div>
            `;
        }).join('');
        gridContainer.innerHTML = gridHTML;
    }
    
    renderSubcontractEvolutionChart(subcontracts) {
        const container = document.getElementById('subcontractEvolutionChart')?.parentElement;
        if (!container) return;
        // Recrear el canvas para asegurar que esté limpio
        container.innerHTML = '<div class="chart-wrapper"><canvas id="subcontractEvolutionChart"></canvas></div>';
        const canvas = document.getElementById('subcontractEvolutionChart');
        if (!canvas) {
            container.innerHTML = '<p>Error: No se pudo crear el canvas para el gráfico.</p>';
            return;
        }
        // Obtener el subcontrato seleccionado
        const subcontractSelect = document.getElementById('subcontractSelect');
        const selectedSubcontract = subcontractSelect ? subcontractSelect.value : 'all';
        // Obtener los datos filtrados
        let data = [];
        if (selectedSubcontract && selectedSubcontract !== 'all') {
            const found = subcontracts.find(sub => sub.name === selectedSubcontract);
            data = found ? found.items : [];
        } else {
            data = subcontracts.flatMap(sub => sub.items);
        }
        if (!data.length) {
            container.innerHTML = '<p>No hay datos para mostrar el gráfico de evolución.</p>';
            return;
        }
        // Destruir gráfico anterior si existe
        if (window.app && window.app.state && window.app.state.charts && window.app.state.charts.subcontractEvolution) {
            window.app.state.charts.subcontractEvolution.destroy();
        }
        // Importar y graficar usando EvolutionChart
        import('../app/EvolutionChart.js').then(module => {
            // Usar una clave separada para el gráfico de subcontrato
            if (!window.app.state.charts) window.app.state.charts = {};
            module.updateEvolutionChart(
                data,
                'TODOS',
                { evolutionChartContainer: container },
                window.app.state.charts,
                canvas
            );
        }).catch(error => {
            container.innerHTML = '<p>Error al cargar el gráfico de evolución.</p>';
        });
    }
} 