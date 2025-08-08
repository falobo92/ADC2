// ===== ANALIZADOR DE DATOS =====
export class DataAnalyzer {
    static analyzeStates(data) {
        const analysis = { ADC: {}, PAC: {}, total: {} };
        
        data.forEach(item => {
            if (item.Documento === 'ADC' || item.Documento === 'PAC') {
                analysis[item.Documento][item.Estado] = (analysis[item.Documento][item.Estado] || 0) + 1;
            }
            analysis.total[item.Estado] = (analysis.total[item.Estado] || 0) + 1;
        });
        
        return analysis;
    }
    
    static analyzeRoles(data) {
        const roleAnalysis = {};
        
        data.forEach(item => {
            [item.Elaborador, item.Revisor, item.Coordinador].forEach(person => {
                if (person && person.trim() !== '') {
                    if (!roleAnalysis[person]) {
                        roleAnalysis[person] = {};
                    }
                    roleAnalysis[person][item.Estado] = (roleAnalysis[person][item.Estado] || 0) + 1;
                }
            });
        });
        
        return roleAnalysis;
    }
    
    static analyzeTimeline(data) {
        const timeline = {};
        
        data.forEach(item => {
            const week = item.Semana;
            if (!timeline[week]) {
                timeline[week] = {
                    total: 0,
                    incorporadas: 0,
                    enLineaEditorial: 0
                };
            }
            
            timeline[week].total++;
            if (item.Estado === 'Incorporada') timeline[week].incorporadas++;
            if (item.Estado === 'En revisor editorial') timeline[week].enLineaEditorial++;
        });
        
        return timeline;
    }
    
    static calculateCompletionStats(data) {
        const total = data.length;
        const completed = data.filter(item => item.Estado === 'Incorporada').length;
        const inProgress = data.filter(item => 
            item.Estado !== 'Incorporada' && item.Estado !== 'En elaboración' && item.Estado !== 'En elaboración cartografía' && item.Estado !== 'Pendiente'
        ).length;
        
        return {
            total,
            completed,
            inProgress,
            pending: data.filter(item => item.Estado === 'Pendiente' || item.Estado === 'En elaboración' || item.Estado === 'En elaboración cartografía').length,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }
} 