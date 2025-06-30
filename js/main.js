import { DashboardApp } from './app/DashboardApp.js';
import { TestUtils } from './utils/testUtils.js';

// Instancia global de la app
const app = new DashboardApp();

// Hacer la app disponible globalmente para otros controladores
window.app = app;

// Exponer funciones globales para los botones del HTML
defineGlobal('clearAllFilters', () => app.clearAllFilters());
defineGlobal('exportToExcel', () => app.exportToExcel());
defineGlobal('clearAllData', () => app.clearAllData());
defineGlobal('toggleSidebar', () => app.toggleSidebar());
defineGlobal('switchMainTab', (tab) => app.switchMainTab(tab));
defineGlobal('switchTab', (tab) => app.switchTab(tab));
defineGlobal('closeModal', (modalId) => app.closeModal(modalId));
defineGlobal('updateEvolutionView', () => app.updateEvolutionView());
defineGlobal('updateSubcontractView', () => app.updateSubcontractView());
defineGlobal('viewSubcontractDetails', (subcontract) => app.viewSubcontractDetails(subcontract));

// Funciones para exportación de tablas específicas
defineGlobal('exportEvolutionTableToCSV', () => {
    const table = document.querySelector('#evolutionTableContainer .evolution-data-table');
    if (!table) return;
    let csv = '';
    table.querySelectorAll('tr').forEach(row => {
        const rowData = Array.from(row.querySelectorAll('th, td')).map(cell => '"' + cell.textContent.trim().replace(/"/g, '""') + '"');
        csv += rowData.join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tabla_evolucion_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Función global para probar el gráfico de evolución
defineGlobal('testEvolutionChart', () => {
    if (!app.state.currentFilteredData.length) return;
    app.switchMainTab('evolution');
    setTimeout(() => app.updateEvolutionView(), 100);
});

function defineGlobal(name, fn) {
    window[name] = fn;
}

// Ejecutar pruebas automáticas después de que la app se inicialice
setTimeout(() => {
    TestUtils.runCompleteTest();
    console.log('📊 Para probar el gráfico de evolución, ejecuta: testEvolutionChart()');
}, 1000); 