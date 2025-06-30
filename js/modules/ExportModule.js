// ===== MÓDULO DE EXPORTACIÓN =====
export class ExportModule {
    constructor(dataManager, notificationManager) {
        this.dataManager = dataManager;
        this.notifications = notificationManager;
    }
    
    // Exportación a Excel
    async exportToExcel() {
        try {
            this.notifications.showGlobalLoader('Generando archivo Excel...');
            
            const data = this.dataManager.state.currentFilteredData;
            if (!data.length) {
                this.notifications.showAlert('No hay datos para exportar', 'warning');
                return;
            }
            
            const summaryData = this.generateSummaryData();
            const workbook = this.createExcelWorkbook(data, summaryData);
            
            // Generar y descargar archivo usando SheetJS
            const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
            
            // Convertir a blob y descargar
            const blob = new Blob([this.s2ab(wbout)], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `ADC_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            link.click();
            
            window.URL.revokeObjectURL(url);
            this.notifications.showToast('Archivo Excel generado correctamente', 'success');
            
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            this.notifications.showToast('Error generando archivo Excel', 'error');
        } finally {
            this.notifications.hideGlobalLoader();
        }
    }
    
    // Función auxiliar para convertir string a ArrayBuffer
    s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }
    
    // Generación de datos de resumen
    generateSummaryData() {
        const data = this.dataManager.state.currentFilteredData;
        const total = data.length;
        const adc = data.filter(item => item.Documento === 'ADC').length;
        const pac = data.filter(item => item.Documento === 'PAC').length;
        const incorporated = data.filter(item => item.Estado === 'Incorporada').length;
        const editorial = data.filter(item => item.Estado === 'En revisor editorial').length;
        
        return {
            total,
            adc,
            pac,
            incorporated,
            editorial,
            completionRate: total > 0 ? Math.round((incorporated / total) * 100) : 0
        };
    }
    
    // Creación de workbook de Excel usando SheetJS
    createExcelWorkbook(data, summaryData) {
        const workbook = XLSX.utils.book_new();
        
        // Hoja principal con datos
        const wsData = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, wsData, 'Datos_Completos');
        
        // Hoja de resumen
        const summarySheet = [
            ['RESUMEN DEL PROYECTO ADC'],
            [''],
            ['Métrica', 'Valor'],
            ['Total de Items', summaryData.total],
            ['Items ADC', summaryData.adc],
            ['Items PAC', summaryData.pac],
            ['Incorporadas', summaryData.incorporated],
            ['En Revisor Editorial', summaryData.editorial],
            ['Tasa de Completitud (%)', summaryData.completionRate],
            [''],
            ['Fecha de Exportación', new Date().toLocaleDateString('es-CL')]
        ];
        
        const wsSummary = XLSX.utils.aoa_to_sheet(summarySheet);
        XLSX.utils.book_append_sheet(workbook, wsSummary, 'Resumen');
        
        // Hoja de estadísticas por estado
        const statesData = this.generateStatesReport(data);
        const wsStates = XLSX.utils.json_to_sheet(statesData);
        XLSX.utils.book_append_sheet(workbook, wsStates, 'Estados');
        
        return workbook;
    }
    
    // Exportación a CSV
    exportToCSV() {
        try {
            const data = this.dataManager.state.currentFilteredData;
            if (!data.length) {
                this.notifications.showAlert('No hay datos para exportar', 'warning');
                return;
            }
            
            const csvContent = this.convertToCSV(data);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `ADC_Report_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            
            window.URL.revokeObjectURL(url);
            this.notifications.showToast('Archivo CSV generado correctamente', 'success');
            
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            this.notifications.showToast('Error generando archivo CSV', 'error');
        }
    }
    
    // Conversión a CSV
    convertToCSV(data) {
        if (!data.length) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        
        data.forEach(item => {
            const values = headers.map(header => {
                const value = item[header] || '';
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
        });
        
        return csvRows.join('\n');
    }
    
    // Exportación de reporte específico
    exportSpecificReport(reportType, filters = {}) {
        try {
            let data = this.dataManager.state.currentFilteredData;
            
            // Aplicar filtros específicos si se proporcionan
            if (Object.keys(filters).length > 0) {
                data = this.applySpecificFilters(data, filters);
            }
            
            if (!data.length) {
                this.notifications.showAlert('No hay datos para el reporte especificado', 'warning');
                return;
            }
            
            const reportData = this.generateReportData(data, reportType);
            const csvContent = this.convertToCSV(reportData);
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `${reportType}_Report_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            
            window.URL.revokeObjectURL(url);
            this.notifications.showToast(`Reporte ${reportType} generado correctamente`, 'success');
            
        } catch (error) {
            console.error(`Error exporting ${reportType} report:`, error);
            this.notifications.showToast(`Error generando reporte ${reportType}`, 'error');
        }
    }
    
    // Aplicación de filtros específicos
    applySpecificFilters(data, filters) {
        return data.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
                if (value === 'all' || value === '' || !value) return true;
                return item[key] === value;
            });
        });
    }
    
    // Generación de datos de reporte
    generateReportData(data, reportType) {
        switch (reportType) {
            case 'estados':
                return this.generateStatesReport(data);
            case 'personas':
                return this.generatePeopleReport(data);
            case 'tematicas':
                return this.generateThematicsReport(data);
            case 'semanas':
                return this.generateWeeksReport(data);
            default:
                return data;
        }
    }
    
    // Reporte por estados
    generateStatesReport(data) {
        const statesCount = {};
        data.forEach(item => {
            statesCount[item.Estado] = (statesCount[item.Estado] || 0) + 1;
        });
        
        return Object.entries(statesCount).map(([state, count]) => ({
            Estado: state,
            Cantidad: count,
            Porcentaje: ((count / data.length) * 100).toFixed(1)
        }));
    }
    
    // Reporte por personas
    generatePeopleReport(data) {
        const peopleCount = {};
        data.forEach(item => {
            [item.Elaborador, item.Revisor, item.Coordinador].forEach(person => {
                if (person && person.trim() !== '') {
                    peopleCount[person] = (peopleCount[person] || 0) + 1;
                }
            });
        });
        
        return Object.entries(peopleCount).map(([person, count]) => ({
            Persona: person,
            Cantidad: count,
            Porcentaje: ((count / data.length) * 100).toFixed(1)
        }));
    }
    
    // Reporte por temáticas
    generateThematicsReport(data) {
        const thematicsCount = {};
        data.forEach(item => {
            thematicsCount[item.Tematica] = (thematicsCount[item.Tematica] || 0) + 1;
        });
        
        return Object.entries(thematicsCount).map(([thematic, count]) => ({
            Tematica: thematic,
            Cantidad: count,
            Porcentaje: ((count / data.length) * 100).toFixed(1)
        }));
    }
    
    // Reporte por semanas
    generateWeeksReport(data) {
        const weeksCount = {};
        data.forEach(item => {
            weeksCount[item.Semana] = (weeksCount[item.Semana] || 0) + 1;
        });
        
        return Object.entries(weeksCount)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([week, count]) => ({
                Semana: week,
                Cantidad: count,
                Porcentaje: ((count / data.length) * 100).toFixed(1)
            }));
    }
} 