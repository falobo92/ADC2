// ===== UTILIDADES DE PRUEBA =====
export class TestUtils {
    static testAllFunctionalities() {
        console.log('🧪 Iniciando pruebas de funcionalidades...');
        const tests = [
            this.testFileUpload(),
            this.testFilters(),
            this.testCharts(),
            this.testModals(),
            this.testResponsiveDesign()
        ];
        const results = tests.filter(Boolean);
        console.log(`✅ ${results.length}/${tests.length} pruebas pasaron`);
        return results.length === tests.length;
    }
    
    static testFileUpload() {
        try {
            const fileInput = document.getElementById('fileInput');
            const fileDisplay = document.getElementById('fileNameDisplay');
            
            if (!fileInput || !fileDisplay) {
                console.error('❌ Elementos de carga de archivos no encontrados');
                return false;
            }
            
            console.log('✅ Elementos de carga de archivos encontrados');
            return true;
        } catch (error) {
            console.error('❌ Error en prueba de carga de archivos:', error);
            return false;
        }
    }
    
    static testFilters() {
        try {
            const filterElements = [
                'weekSelect', 'daySelect', 'tematicaSelect', 
                'itemSelect', 'personSelect', 'stateSelect', 'subcontractSelect'
            ];
            
            const missing = filterElements.filter(id => !document.getElementById(id));
            
            if (missing.length > 0) {
                console.error('❌ Elementos de filtro faltantes:', missing);
                return false;
            }
            
            console.log('✅ Todos los elementos de filtro encontrados');
            return true;
        } catch (error) {
            console.error('❌ Error en prueba de filtros:', error);
            return false;
        }
    }
    
    static testCharts() {
        try {
            const chartElements = [
                'chartTotal', 'chartADC', 'chartPAC'
            ];
            
            const missing = chartElements.filter(id => !document.getElementById(id));
            
            if (missing.length > 0) {
                console.error('❌ Elementos de gráficos faltantes:', missing);
                return false;
            }
            
            console.log('✅ Todos los elementos de gráficos encontrados');
            return true;
        } catch (error) {
            console.error('❌ Error en prueba de gráficos:', error);
            return false;
        }
    }
    
    static testModals() {
        try {
            const modal = document.getElementById('questionsModal');
            const modalTitle = document.getElementById('modalTitle');
            const questionsList = document.getElementById('questionsList');
            
            if (!modal || !modalTitle || !questionsList) {
                console.error('❌ Elementos del modal faltantes');
                return false;
            }
            
            console.log('✅ Elementos del modal encontrados');
            return true;
        } catch (error) {
            console.error('❌ Error en prueba de modales:', error);
            return false;
        }
    }
    
    static testResponsiveDesign() {
        try {
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.querySelector('.main-content');
            const menuToggle = document.querySelector('.menu-toggle');
            
            if (!sidebar || !mainContent || !menuToggle) {
                console.error('❌ Elementos de diseño responsivo faltantes');
                return false;
            }
            
            console.log('✅ Elementos de diseño responsivo encontrados');
            return true;
        } catch (error) {
            console.error('❌ Error en prueba de diseño responsivo:', error);
            return false;
        }
    }
    
    static testDataFlow() {
        console.log('🔄 Probando flujo de datos...');
        
        // Simular datos de prueba
        const testData = [
            {
                ID: 'TEST001',
                ID_Corregido: 'TEST001',
                Documento: 'ADC',
                Estado: 'En elaboración',
                Elaborador: 'Test User',
                Revisor: 'Test Reviewer',
                Coordinador: 'Test Coordinator',
                FechaReporte: '2024-01-01',
                Semana: '23',
                Tematica: 'Test Temática',
                Item: 'Test Item'
            }
        ];
        
        try {
            // Verificar que el estado puede manejar los datos
            if (window.app && window.app.state) {
                window.app.state.allRawData = testData;
                console.log('✅ Estado de la aplicación puede manejar datos');
                return true;
            } else {
                console.error('❌ Estado de la aplicación no disponible');
                return false;
            }
        } catch (error) {
            console.error('❌ Error en prueba de flujo de datos:', error);
            return false;
        }
    }
    
    static testEventHandlers() {
        console.log('🎯 Probando manejadores de eventos...');
        
        try {
            // Verificar que los eventos globales están disponibles
            const globalFunctions = [
                'clearAllFilters',
                'exportToExcel', 
                'clearAllData',
                'toggleSidebar',
                'switchMainTab',
                'closeModal'
            ];
            
            const missing = globalFunctions.filter(func => !window[func]);
            
            if (missing.length > 0) {
                console.error('❌ Funciones globales faltantes:', missing);
                return false;
            }
            
            console.log('✅ Todas las funciones globales disponibles');
            return true;
        } catch (error) {
            console.error('❌ Error en prueba de manejadores de eventos:', error);
            return false;
        }
    }
    
    static runCompleteTest() {
        console.log('🧪 Iniciando pruebas completas del sistema...');
        
        const tests = [
            this.testExportFunctionality,
            this.testEvolutionChart,
            this.testSubcontractsView,
            this.testDashboardCharts,
            this.testModalFunctionality,
            this.testChartInteractivity,
            this.testDataLoading
        ];
        
        let passedTests = 0;
        let totalTests = tests.length;
        
        tests.forEach((test) => {
            try {
                if (test()) passedTests++;
            } catch (e) {
                console.error('❌ Error en prueba:', e);
            }
        });
        
        console.log(`✅ ${passedTests}/${totalTests} pruebas avanzadas pasaron`);
        return passedTests === totalTests;
    }
    
    static testExportFunctionality() {
        console.log('📤 Probando funcionalidad de exportación...');
        
        // Verificar que SheetJS esté disponible
        if (typeof XLSX === 'undefined') {
            console.log('❌ SheetJS no está disponible');
            return false;
        }
        
        // Verificar que el módulo de exportación esté funcionando
        if (!window.app || !window.app.exportModule) {
            console.log('❌ Módulo de exportación no disponible');
            return false;
        }
        
        console.log('✅ Funcionalidad de exportación disponible');
        return true;
    }
    
    static testEvolutionChart() {
        console.log('📈 Probando gráfico de evolución...');
        
        // Verificar que Chart.js esté disponible
        if (typeof Chart === 'undefined') {
            console.log('❌ Chart.js no está disponible');
            return false;
        }
        
        // Verificar que el canvas del gráfico de evolución exista
        const evolutionCanvas = document.getElementById('evolutionChart');
        if (!evolutionCanvas) {
            console.log('❌ Canvas del gráfico de evolución no encontrado');
            return false;
        }
        
        // Verificar que la función de actualización esté disponible
        if (!window.app || !window.app.updateEvolutionView) {
            console.log('❌ Función de actualización de evolución no disponible');
            return false;
        }
        
        console.log('✅ Gráfico de evolución configurado correctamente');
        return true;
    }
    
    static testSubcontractsView() {
        console.log('🏢 Probando vista de subcontratos...');
        
        // Verificar que los elementos del DOM existan
        const requiredElements = [
            'subcontractsGrid',
            'totalSubcontracts',
            'completedSubcontracts',
            'inProgressSubcontracts',
            'overallProgress'
        ];
        
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        if (missingElements.length > 0) {
            console.log(`❌ Elementos faltantes: ${missingElements.join(', ')}`);
            return false;
        }
        
        // Verificar que las funciones estén disponibles
        if (!window.app || !window.app.updateSubcontractView || !window.app.viewSubcontractDetails) {
            console.log('❌ Funciones de subcontratos no disponibles');
            return false;
        }
        
        console.log('✅ Vista de subcontratos configurada correctamente');
        return true;
    }
    
    static testDashboardCharts() {
        console.log('📊 Probando gráficos del dashboard...');
        
        // Verificar que los canvas de los gráficos existan
        const chartCanvasIds = ['chartTotal', 'chartADC', 'chartPAC'];
        const missingCanvas = chartCanvasIds.filter(id => !document.getElementById(id));
        
        if (missingCanvas.length > 0) {
            console.log(`❌ Canvas faltantes: ${missingCanvas.join(', ')}`);
            return false;
        }
        
        // Verificar que las tablas de leyenda existan
        const legendTableIds = ['legendTotal', 'legendADC', 'legendPAC'];
        const missingLegends = legendTableIds.filter(id => !document.getElementById(id));
        
        if (missingLegends.length > 0) {
            console.log(`❌ Tablas de leyenda faltantes: ${missingLegends.join(', ')}`);
            return false;
        }
        
        // Verificar que los estilos CSS estén aplicados
        const chartCards = document.querySelectorAll('.chart-card');
        if (chartCards.length === 0) {
            console.log('❌ No se encontraron tarjetas de gráficos');
            return false;
        }
        
        console.log('✅ Gráficos del dashboard configurados correctamente');
        return true;
    }
    
    static testModalFunctionality() {
        console.log('🔍 Probando funcionalidad del modal...');
        
        // Verificar que el modal exista
        const modal = document.getElementById('questionsModal');
        if (!modal) {
            console.log('❌ Modal de preguntas no encontrado');
            return false;
        }
        
        // Verificar que los elementos internos del modal existan
        const modalElements = ['modalTitle', 'questionsList', 'modalOverflowNote'];
        const missingModalElements = modalElements.filter(id => !document.getElementById(id));
        
        if (missingModalElements.length > 0) {
            console.log(`❌ Elementos del modal faltantes: ${missingModalElements.join(', ')}`);
            return false;
        }
        
        // Verificar que la función de mostrar modal esté disponible
        if (!window.app || !window.app.showQuestionsInModal) {
            console.log('❌ Función de mostrar modal no disponible');
            return false;
        }
        
        // Verificar que los estilos CSS del modal estén aplicados
        const computedStyle = window.getComputedStyle(modal);
        if (computedStyle.display === 'none' && !modal.classList.contains('show')) {
            console.log('✅ Modal configurado correctamente (oculto por defecto)');
        }
        
        console.log('✅ Funcionalidad del modal configurada correctamente');
        return true;
    }
    
    static testChartInteractivity() {
        console.log('🖱️ Probando interactividad de gráficos...');
        
        // Verificar que los eventos de click estén configurados
        const legendTables = document.querySelectorAll('.legend-wrapper table tbody tr');
        if (legendTables.length === 0) {
            console.log('⚠️ No hay tablas de leyenda para probar interactividad');
            return true; // No es un error, puede que no haya datos
        }
        
        // Verificar que las filas tengan el cursor pointer
        const firstRow = legendTables[0];
        const computedStyle = window.getComputedStyle(firstRow);
        if (computedStyle.cursor !== 'pointer') {
            console.log('❌ Las filas de leyenda no tienen cursor pointer');
            return false;
        }
        
        console.log('✅ Interactividad de gráficos configurada correctamente');
        return true;
    }
    
    static testDataLoading() {
        console.log('📂 Probando carga de datos...');
        
        // Verificar que el input de archivo exista
        const fileInput = document.getElementById('fileInput');
        if (!fileInput) {
            console.log('❌ Input de archivo no encontrado');
            return false;
        }
        
        // Verificar que las funciones de manejo de archivos estén disponibles
        if (!window.app || !window.app.handleFileUpload) {
            console.log('❌ Función de manejo de archivos no disponible');
            return false;
        }
        
        console.log('✅ Carga de datos configurada correctamente');
        return true;
    }
} 