import { CONFIG, ESTADO_COLORS, ESTADO_FONT_COLORS, ESTADO_ORDER } from '../config/constants.js';

// ===== GESTIÓN DE GRÁFICOS =====
export class ChartManager {
    constructor(appState) {
        this.state = appState;
        this.initializePlugins();
    }
    
    initializePlugins() {
        // Registrar Chart.js plugins
        if (typeof Chart !== 'undefined') {
            Chart.register(ChartDataLabels);
            
            // Plugin de texto central para gráficos de dona
            const centerTextPlugin = {
                id: 'centerText',
                beforeDraw: (chart) => {
                    if (chart.config.type === 'doughnut' && chart.config.options.plugins.centerText?.display) {
                        this.drawCenterText(chart);
                    }
                }
            };
            
            Chart.register(centerTextPlugin);
            
            // Registrar plugin de anotación
            setTimeout(() => {
                if (typeof window.chartjsPluginAnnotation !== 'undefined') {
                    Chart.register(window.chartjsPluginAnnotation);
                }
            }, CONFIG.ANIMATION.LOADER_DELAY);
        }
    }
    
    drawCenterText(chart) {
        const ctx = chart.ctx;
        const { top, right, bottom, left } = chart.chartArea;
        const centerX = (left + right) / 2;
        const centerY = (top + bottom) / 2;
        const config = chart.config.options.plugins.centerText;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Texto principal
        ctx.font = `bold ${config.fontSize || '32'}px ${config.fontFamily || 'Inter, sans-serif'}`;
        ctx.fillStyle = config.color || getComputedStyle(document.documentElement)
            .getPropertyValue('--text-primary').trim();
        ctx.fillText(config.text, centerX, centerY - 8);

        // Subtítulo
        if (config.subText) {
            ctx.font = `normal ${config.subFontSize || '14'}px ${config.fontFamily || 'Inter, sans-serif'}`;
            ctx.fillStyle = config.subColor || getComputedStyle(document.documentElement)
                .getPropertyValue('--text-secondary').trim();
            ctx.fillText(config.subText, centerX, centerY + 16);
        }
        ctx.restore();
    }
    
    destroyAllCharts() {
        Object.values(this.state.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.state.charts = {};
    }
    
    getChartInstances() {
        return this.state.charts;
    }
    
    createDonutChart(canvasId, chartKey, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        
        // Destruir gráfico existente
        if (this.state.charts[chartKey]) {
            this.state.charts[chartKey].destroy();
        }
        
        const total = Object.values(data).reduce((acc, val) => acc + val, 0);
        if (total === 0) return null;
        
        const sortedStates = this.sortStatesByOrder(Object.keys(data));
        const chartData = {
            labels: sortedStates,
            datasets: [{
                data: sortedStates.map(state => data[state]),
                backgroundColor: sortedStates.map(state => ESTADO_COLORS[state] || ESTADO_COLORS.default),
                borderWidth: 2,
                borderColor: getComputedStyle(document.documentElement)
                    .getPropertyValue('--bg-secondary').trim(),
            }]
        };
        
        const chartOptions = this.getDonutChartOptions(chartKey, total, options);
        
        // Agregar evento de click al gráfico
        chartOptions.onClick = (event, elements) => {
            if (elements.length > 0) {
                const dataIndex = elements[0].index;
                const clickedLabel = chartData.labels[dataIndex];
                if (window.app && window.app.showQuestionsInModal) {
                    window.app.showQuestionsInModal(clickedLabel, chartKey);
                }
            }
        };
        
        this.state.charts[chartKey] = new Chart(canvas, {
            type: 'doughnut',
            data: chartData,
            options: chartOptions
        });
        
        return this.state.charts[chartKey];
    }
    
    getDonutChartOptions(chartType, totalItems, customOptions = {}) {
        const subTextMap = {
            'total': totalItems === 1 ? 'Pregunta' : 'Preguntas',
            'ADC': 'ADC',
            'PAC': 'PAC'
        };
        
        return {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '50%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    titleFont: { size: 13, weight: '600' },
                    bodyFont: { size: 12 },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: ctx => `${ctx.label}: ${ctx.raw} (${(ctx.raw / ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0) * 100).toFixed(1).replace('.', ',')}%)`
                    }
                },
                centerText: {
                    display: true,
                    text: totalItems.toString(),
                    subText: subTextMap[chartType] || 'Items',
                    fontSize: 32,
                    subFontSize: 14,
                },
                datalabels: {
                    display: function(context) {
                        const value = context.dataset.data[context.dataIndex];
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        return total > 0 && (value / total * 100) > 8;
                    },
                    color: (ctx) => ESTADO_FONT_COLORS[ctx.chart.data.labels[ctx.dataIndex]] || '#fff',
                    font: { weight: 'bold', size: 12 },
                    formatter: (value, ctx) => {
                        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        return total === 0 ? '' : (value / total * 100).toFixed(0).replace('.', ',') + '%';
                    }
                }
            },
            ...customOptions
        };
    }
    
    sortStatesByOrder(states) {
        return states.sort((a, b) => {
            const indexA = ESTADO_ORDER.indexOf(a);
            const indexB = ESTADO_ORDER.indexOf(b);
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
    }
} 