// =================================================================================
// EVOLUCIÓN TEMPORAL - IMPLEMENTACIÓN SEGÚN ESPECIFICACIONES
// =================================================================================

/**
 * @typedef {object} DataItem
 * @property {string} ID_Corregido
 * @property {string} ID
 * @property {string} Documento - 'ADC' o 'PAC'.
 * @property {string} Tematica
 * @property {string} Elaborador
 * @property {string} Estado - 'Incorporada', 'En revisor editorial', etc.
 * @property {string} Semana - Número de la semana como string (ej. "23").
 * @property {string} FechaReporte - Fecha en formato que se pueda parsear con new Date().
 */

/**
 * Función principal para actualizar el gráfico de evolución
 * @param {Array} data - Datos completos
 * @param {string} filterType - Tipo de filtro ('TODOS', 'ADC', 'PAC')
 * @param {Object} domElements - Elementos DOM necesarios
 * @param {Object} charts - Instancias de gráficos
 * @param {HTMLCanvasElement} [canvasOverride] - Canvas opcional para renderizar el gráfico
 */
function updateEvolutionChart(data, filterType = 'TODOS', domElements, charts, canvasOverride) {
  console.log('📈 [EvolutionChart] Iniciando actualización del gráfico de evolución');
  console.log('📊 [EvolutionChart] Datos recibidos:', data ? data.length : 0);
  console.log('🔍 [EvolutionChart] Tipo de filtro:', filterType);

  const { evolutionChartContainer: evolutionContainer, evolutionDataContainer } = domElements;
  
  if (!evolutionContainer) {
    console.error('❌ [EvolutionChart] Contenedor del gráfico no encontrado');
    return;
  }

  // --- Definir meta global según filtro principal ---
  let META_TOTAL_ITEMS = 494;
  if (filterType === 'ADC') META_TOTAL_ITEMS = 318;
  if (filterType === 'PAC') META_TOTAL_ITEMS = 176;

  // --- 1. Filtrado inicial de datos por tipo ---
  let filteredData = data;
  if (filterType === 'ADC') {
    filteredData = data.filter(item => item.Documento === 'ADC');
  } else if (filterType === 'PAC') {
    filteredData = data.filter(item => item.Documento === 'PAC');
  }

  // Si no hay datos después de filtrar, ocultar y salir
  if (filteredData.length === 0) {
    evolutionContainer.classList.add('hidden');
    if (charts.evolution) charts.evolution.destroy();
    return;
  }

  evolutionContainer.classList.remove('hidden');

  // --- 2. Preparar el rango completo de semanas para el eje X ---
  const START_WEEK = 23;
  const END_WEEK = 35;
  const allWeeksInRange = Array.from({ length: END_WEEK - START_WEEK + 1 }, (_, i) => START_WEEK + i);

  // --- 3. Función para obtener la fecha de inicio de una semana del año ---
function getWeekStartDate(weekNumber, year = 2024) {
    const d = new Date(Date.UTC(year, 0, 1));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

    if (weekNo < weekNumber) {
        d.setUTCDate(d.getUTCDate() + (weekNumber - weekNo) * 7);
    } else if (weekNo > weekNumber) {
        d.setUTCDate(d.getUTCDate() - (weekNo - weekNumber) * 7);
    }
    
    // Ajustar para que la semana comience en domingo
    d.setUTCDate(d.getUTCDate() - d.getUTCDay());
    return d;
}

  // --- 4. Obtener el conteo del último día para cada semana ---
    const incorporatedCounts = [];
    const editorialCounts = [];
  const totalProgress = []; // Nuevo array para el progreso total acumulado

  for (const week of allWeeksInRange) {
    const weekData = filteredData.filter(item => parseInt(item.Semana) === week);

    if (weekData.length === 0) {
            incorporatedCounts.push(null);
            editorialCounts.push(null);
            totalProgress.push(null);
    } else {
      // Encontrar la fecha más reciente de esta semana
        const latestDateInWeek = new Date(
        Math.max(...weekData.map(item => new Date(item.FechaReporte)))
      );

      // Filtrar solo los datos de ese último día
      const latestDayData = weekData.filter(item => {
        const itemDate = new Date(item.FechaReporte);
        return itemDate.toDateString() === latestDateInWeek.toDateString();
      });

        const incorporatedCount = latestDayData.filter(item => item.Estado === 'Incorporada').length;
        const editorialCount = latestDayData.filter(item => item.Estado === 'En revisor editorial').length;
      
      // Calcular el total acumulado hasta esta semana
      // Obtener todos los datos hasta esta semana (inclusive) con estado final único por ID
      const dataUpToThisWeek = filteredData.filter(item => parseInt(item.Semana) <= week);
      
      // Obtener el estado más reciente de cada ID único
      const latestStatesByID = {};
      dataUpToThisWeek.forEach(item => {
        const id = item.ID_Corregido || item.ID;
        const itemDate = new Date(item.FechaReporte);
        
        if (!latestStatesByID[id] || new Date(latestStatesByID[id].FechaReporte) < itemDate) {
          latestStatesByID[id] = item;
        }
      });
      
      // Contar estados relevantes de elementos únicos
      const uniqueItems = Object.values(latestStatesByID);
      const totalIncorporatedUpToWeek = uniqueItems.filter(item => item.Estado === 'Incorporada').length;
      const totalEditorialUpToWeek = uniqueItems.filter(item => item.Estado === 'En revisor editorial').length;
      let totalUpToWeek = totalIncorporatedUpToWeek + totalEditorialUpToWeek;
      
      // Asegurar que no exceda la meta según el filtro
      totalUpToWeek = Math.min(totalUpToWeek, META_TOTAL_ITEMS);

        incorporatedCounts.push(incorporatedCount);
        editorialCounts.push(editorialCount);
        totalProgress.push(totalUpToWeek);
    }
  }

  // --- 5. Crear labels con formato S. X y fecha ---
  const labels = allWeeksInRange.map(week => {
    const weekStart = getWeekStartDate(week);
    const day = weekStart.getDate();
    const month = weekStart.toLocaleDateString('es-CL', { month: 'short' });
    return [`S. ${week}`, `${day}/${month}`];
  });

  // Permitir canvas personalizado
  let canvas = canvasOverride;
  if (!canvas) {
    canvas = document.getElementById('evolutionChart');
  }
  if (!canvas) return;

  // Destruir gráfico existente
  if (charts.evolution) {
    charts.evolution.destroy();
  }

  // --- 6. Crear gradientes ---
  const ctx = canvas.getContext('2d');
  
  const gradientIncorporated = ctx.createLinearGradient(0, 0, 0, 500); // Aumentado de 400 a 500
  gradientIncorporated.addColorStop(0, 'rgba(144, 190, 109, 0.4)');
  gradientIncorporated.addColorStop(1, 'rgba(144, 190, 109, 0.05)');
  
  const gradientEditorial = ctx.createLinearGradient(0, 0, 0, 500); // Aumentado de 400 a 500
  gradientEditorial.addColorStop(0, 'rgba(181, 101, 118, 0.4)');
  gradientEditorial.addColorStop(1, 'rgba(181, 101, 118, 0.05)');

  // --- 7. Creación del gráfico ---
  charts.evolution = new Chart(canvas, {
        type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Preguntas Incorporadas',
          data: incorporatedCounts,
          backgroundColor: '#90BE6D',
          borderColor: '#6BA13F',
          borderWidth: 1,
          stack: 'stack1',
          barThickness: 60, // Aumentado de 40 a 60
          maxBarThickness: 80, // Aumentado de 50 a 80
          order: 2, // Las barras van detrás de la línea
        },
        {
          label: 'En Revisor Editorial',
          data: editorialCounts,
          backgroundColor: '#B56576',
          borderColor: '#9A4A5A',
          borderWidth: 1,
          stack: 'stack1',
          barThickness: 60, // Aumentado de 40 a 60
          maxBarThickness: 80, // Aumentado de 50 a 80
          order: 2, // Las barras van detrás de la línea
        },
        {
          label: 'Total Acumulado',
          data: totalProgress,
          type: 'line',
          borderColor: 'rgb(0, 57, 120,0.7)',
          backgroundColor: 'rgba(65, 246, 59, 0.05)',
          borderWidth: 3,
          borderDash: [8, 4],
          pointBackgroundColor: 'rgb(0, 123, 165)',
          pointBorderColor: 'rgb(0, 57, 120)',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false,
          tension: 0,
          order: 1, // La línea va delante de las barras
          yAxisID: 'y',
        }
      ]
    },
        options: {
            responsive: true,
            maintainAspectRatio: false,
      aspectRatio: 2.5, // Hacer el gráfico más alto (era aproximadamente 2 antes)
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    stacked: true,
          grid: {
            color: 'rgba(126, 126, 126, 0.3)',
            drawBorder: true,
          },
                    ticks: {
            padding: 35,
            font: {
              size: 11,
              family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            },
            color: '#6B7280',
            callback: function(value, index) {
              return this.getLabelForValue(index);
            }
          }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
          suggestedMax: Math.max(
            META_TOTAL_ITEMS + 50, 
            ...incorporatedCounts.filter(v => v !== null), 
            ...editorialCounts.filter(v => v !== null),
            ...totalProgress.filter(v => v !== null)
          ) + 20,
          grid: {
            color: 'rgba(126, 126, 126, 0.3)',
            drawBorder: true,
          },
                    ticks: {
                        padding: 10,
            font: {
              size: 12,
              family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            },
            color: '#6B7280',
            callback: function(value) {
              return value.toLocaleString('es-CL');
            }
          }
        }
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'center',
                    labels: {
                        usePointStyle: true,
                        padding: 25,
            font: {
              size: 12,
              family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              weight: 'bold'
            },
            color: '#4A5568'
          }
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#F9FAFB',
                    bodyColor: '#E5E7EB',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 16,
                    cornerRadius: 12,
          displayColors: true,
          titleFont: {
            size: 14,
            weight: '600',
            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          },
          bodyFont: {
            size: 13,
            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          },
                    callbacks: {
            title: function(tooltipItems) {
              // Mostrar solo "Semana X" en el título del tooltip
              const weekNumber = tooltipItems[0].label.replace('S. ', 'Semana ');
              return weekNumber;
            }, 
            label: function(context) {
                            const value = context.parsed.y;
              if (value === null) return null;
              
              if (context.dataset.label === 'Total Acumulado') {
                return ' ' + context.dataset.label + ': ' + value.toLocaleString('es-CL');
              }
              
              return ' ' + context.dataset.label + ': ' + value.toLocaleString('es-CL');
            },
            afterLabel: function(context) {
                            if (context.parsed.y === null) return null;
              
              if (context.dataset.label === 'Total Acumulado') {
                const percentage = ((context.parsed.y / META_TOTAL_ITEMS) * 100).toFixed(1);
                return `  (${percentage}% del total objetivo)`;
              }
              
              const percentage = ((context.parsed.y / META_TOTAL_ITEMS) * 100).toFixed(1);
              return `  (${percentage}% del total)`;
            }
          }
        },
        datalabels: {
          display: false
                },
                annotation: {
          annotations: [
            {
                        type: 'line',
                        scaleID: 'y',
              value: META_TOTAL_ITEMS,
              borderColor: 'rgba(0, 127, 163, 0.6)',
                        borderWidth: 2,
                        borderDash: [10, 5],
                        label: {
                            display: true,
                content: `Meta: ${META_TOTAL_ITEMS} preguntas`,
                            position: 'end',
                backgroundColor: 'rgba(0, 127, 163, 0.8)',
                            color: '#ffffff',
              font: {
                  size: 11,
                weight: '600'
              },
              padding: {
                top: 4,
                bottom: 4,
                left: 8,
                right: 8
              },
                            borderRadius: 4,
                            xAdjust: -10,
                yAdjust: -5
              }
            }
          ]
        }
            },
            animation: {
                duration: 750,
        easing: 'easeInOutQuart'
      }
    }
  });

  // Generar tabla de datos debajo del gráfico
  generateEvolutionDataTable(allWeeksInRange, incorporatedCounts, editorialCounts, filterType, filteredData);
}

function generateEvolutionDataTable(weeks, incorporatedData, editorialData, filterType, filteredData) {
  // Buscar el contenedor de la tabla
  let tableContainer = document.getElementById('evolutionTableContainer');
  
  // Si no existe, crearlo
  if (!tableContainer) {
    const evolutionContainer = document.querySelector('.evolution-chart-container');
    if (!evolutionContainer) return;
    
        tableContainer = document.createElement('div');
        tableContainer.id = 'evolutionTableContainer';
        tableContainer.className = 'evolution-table-container';
    evolutionContainer.appendChild(tableContainer);
  }
  
  // --- 1. Definir meta y semana objetivo ---
  let META_TOTAL_ITEMS = 494;
  if (filterType === 'ADC') META_TOTAL_ITEMS = 318;
  if (filterType === 'PAC') META_TOTAL_ITEMS = 176;
  const targetWeek = 35;
  
  // --- 2. Encontrar la última semana con datos y los totales reales a esa fecha ---
  let lastDataWeekIndex = -1;
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (incorporatedData[i] !== null || editorialData[i] !== null) {
      lastDataWeekIndex = i;
      break;
    }
  }

  // El total real es el valor de la última semana con datos, no la suma de todas.
  const lastKnownIncorporated = lastDataWeekIndex !== -1 ? (incorporatedData[lastDataWeekIndex] || 0) : 0;
  const lastKnownEditorial = lastDataWeekIndex !== -1 ? (editorialData[lastDataWeekIndex] || 0) : 0;
  
  // --- 3. Obtener el total acumulado real de la última semana con datos ---
  let lastWeekTotalAccumulated = 0;
  if (lastDataWeekIndex !== -1) {
    const lastWeek = weeks[lastDataWeekIndex];
    const dataUpToLastWeek = filteredData.filter(item => parseInt(item.Semana) <= lastWeek);
    
    // Obtener el estado más reciente de cada ID único hasta la última semana
    const latestStatesByID = {};
    dataUpToLastWeek.forEach(item => {
      const id = item.ID_Corregido || item.ID;
      const itemDate = new Date(item.FechaReporte);
      
      if (!latestStatesByID[id] || new Date(latestStatesByID[id].FechaReporte) < itemDate) {
        latestStatesByID[id] = item;
      }
    });
    
    const uniqueItems = Object.values(latestStatesByID);
    const totalIncorporated = uniqueItems.filter(item => item.Estado === 'Incorporada').length;
    const totalEditorial = uniqueItems.filter(item => item.Estado === 'En revisor editorial').length;
    lastWeekTotalAccumulated = Math.min(totalIncorporated + totalEditorial, META_TOTAL_ITEMS);
  }

  // --- 4. Calcular la proyección semanal basada en el total acumulado real ---
  const lastDataWeek = lastDataWeekIndex !== -1 ? weeks[lastDataWeekIndex] : (weeks[0] - 1);
  const weeksForProjection = targetWeek - lastDataWeek;
  const itemsToProject = META_TOTAL_ITEMS - lastWeekTotalAccumulated;
  const weeklyProjection = (weeksForProjection > 0 && itemsToProject > 0) ? Math.ceil(itemsToProject / weeksForProjection) : 0;

  // --- 5. Preparar datos para la fila de total acumulado y proyecciones ---
  const accumulatedTotalData = [];
  const projectedIncrements = weeks.map(() => null); // Inicializar con null

  // Rellenar datos históricos
  for (let i = 0; i <= lastDataWeekIndex; i++) {
    const currentWeek = weeks[i];
    const dataUpToThisWeek = filteredData.filter(item => parseInt(item.Semana) <= currentWeek);
    const latestStatesByID = {};
    dataUpToThisWeek.forEach(item => {
      const id = item.ID_Corregido || item.ID;
      const itemDate = new Date(item.FechaReporte);
      if (!latestStatesByID[id] || new Date(latestStatesByID[id].FechaReporte) < itemDate) {
        latestStatesByID[id] = item;
      }
    });
    const uniqueItems = Object.values(latestStatesByID);
    const totalIncorporatedUpToWeek = uniqueItems.filter(item => item.Estado === 'Incorporada').length;
    const totalEditorialUpToWeek = uniqueItems.filter(item => item.Estado === 'En revisor editorial').length;
    let totalUpToWeek = totalIncorporatedUpToWeek + totalEditorialUpToWeek;
    totalUpToWeek = Math.min(totalUpToWeek, META_TOTAL_ITEMS);
    accumulatedTotalData.push(totalUpToWeek);
  }

  // Rellenar datos proyectados
  if (lastDataWeekIndex < weeks.length - 1) {
    let runningTotal = lastWeekTotalAccumulated;
    let totalProjectedIncrement = 0;

    for (let i = lastDataWeekIndex + 1; i < weeks.length; i++) {
        let increment = 0;
        if (runningTotal < META_TOTAL_ITEMS) {
            increment = weeklyProjection;
            // Si el incremento va a sobrepasar el objetivo, ajustarlo
            if (totalProjectedIncrement + increment > itemsToProject) {
                increment = itemsToProject - totalProjectedIncrement;
            }
            // Asegurarse de que el incremento no sea negativo
            if (increment < 0) increment = 0;
        }
        
        projectedIncrements[i] = increment;
        totalProjectedIncrement += increment;
        runningTotal += increment;
        accumulatedTotalData.push(runningTotal);
    }
  }
  
  // --- 6. Función para obtener fecha de inicio de semana (reutilizada) ---
  function getWeekStartDate(weekNumber, year = 2024) {
    const d = new Date(Date.UTC(year, 0, 1));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

    if (weekNo < weekNumber) {
        d.setUTCDate(d.getUTCDate() + (weekNumber - weekNo) * 7);
    } else if (weekNo > weekNumber) {
        d.setUTCDate(d.getUTCDate() - (weekNo - weekNumber) * 7);
    }
    
    d.setUTCDate(d.getUTCDate() - d.getUTCDay());
    return d;
  }
  
  // --- 7. Generar HTML de la tabla ---
    const tableHTML = `
      <div class="evolution-table-header">
      <h4>
        <i class="fas fa-table"></i>
        Datos del Gráfico de Evolución ${filterType !== 'TODOS' ? `- ${filterType}` : ''}
      </h4>
        <div class="table-actions">
        <button class="table-btn" onclick="exportEvolutionTableToCSV()" title="Exportar tabla">
          <i class="fas fa-download"></i>
          Exportar
          </button>
        </div>
      </div>
    
      <div class="table-wrapper">
        <table class="evolution-data-table">
          <thead>
            <tr>
              <th class="metric-header">Métrica</th>
              ${weeks.map(week => `
                <th class="week-header">
                  <div>S.${week}</div>
                  <small>${getWeekStartDate(week).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</small>
              </th>
            `).join('')}
            </tr>
          </thead>
          <tbody>
            <tr class="incorporated-row">
            <td class="metric-cell">
              <span class="color-indicator incorporated"></span>
              Incorporadas
            </td>
            ${incorporatedData.map(count => `
              <td class="incorporated-cell">
                ${count !== null ? count : '-'}
              </td>
            `).join('')}
            </tr>
            <tr class="editorial-row">
            <td class="metric-cell">
              <span class="color-indicator editorial"></span>
              En Editorial
            </td>
            ${editorialData.map(count => `
              <td class="editorial-cell">
                ${count !== null ? count : '-'}
              </td>
            `).join('')}
            </tr>
            <tr class="projection-row">
            <td class="metric-cell">
              <span class="color-indicator projection"></span>
              Proyección (Adicional Semanal)
            </td>
            ${projectedIncrements.map(increment => `
              <td class="projection-cell">
                ${increment !== null ? increment : '-'}
              </td>
            `).join('')}
            </tr>
            <tr class="accumulated-row">
            <td class="metric-cell">
              <span class="color-indicator accumulated"></span>
              Total Acumulado (Proyectado)
            </td>
            ${accumulatedTotalData.map(total => `
                <td class="accumulated-cell">
                  <strong>${total}</strong>
                </td>
              `).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    
      <div class="projection-info">
      <p><strong>Proyección:</strong> Para alcanzar la meta de ${META_TOTAL_ITEMS} preguntas en la semana ${targetWeek}, se requieren <strong>${weeklyProjection}</strong> incorporaciones adicionales cada semana.</p>
      <p><strong>Estado actual:</strong> Total acumulado hasta la última semana con datos: <strong>${lastWeekTotalAccumulated}</strong> de ${META_TOTAL_ITEMS} (${Math.round((lastWeekTotalAccumulated/META_TOTAL_ITEMS)*100)}% del avance total).</p>
      <p><strong>Total acumulado proyectado:</strong> Se proyecta alcanzar <strong>${accumulatedTotalData[accumulatedTotalData.length - 1] || lastWeekTotalAccumulated}</strong> preguntas en la semana ${targetWeek}, lo que representa un <strong>${Math.round(((accumulatedTotalData[accumulatedTotalData.length - 1] || lastWeekTotalAccumulated)/META_TOTAL_ITEMS)*100)}%</strong> de la meta.</p>
      </div>
    `;

    tableContainer.innerHTML = tableHTML;
}

// Funciones auxiliares para modales
function showQuestionsInModal(clickedState, chartType, sourceData) {
    const filteredItems = sourceData.filter(item => {
        if (chartType === 'ADC') return item.Estado === clickedState && item.Documento === 'ADC';
        if (chartType === 'PAC') return item.Estado === clickedState && item.Documento === 'PAC';
        return item.Estado === clickedState;
    });

    const modalTitle = document.getElementById('modalTitle');
    const questionsList = document.getElementById('questionsList');
    
    if (modalTitle) modalTitle.textContent = `${clickedState} (${filteredItems.length} items)`;
    if (questionsList) questionsList.innerHTML = '';

    const maxDisplayItems = 50;
    const itemsToShow = filteredItems.slice(0, maxDisplayItems);

    itemsToShow.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 12px;">
                <div style="flex: 1;">
                    <strong>${item.ID_Corregido || item.ID}</strong> - ${item.Documento || 'N/A'}
                    <br><small style="color: var(--text-secondary);">Temática: ${item.Tematica || 'N/A'}</small>
                    <br><small style="color: var(--text-secondary);">Elaborador: ${item.Elaborador || 'N/A'}</small>
                </div>
                <span style="
                    background: ${getEstadoColor(item.Estado)};
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    white-space: nowrap;
                ">${item.Estado}</span>
            </div>
        `;
        if (questionsList) questionsList.appendChild(li);
    });

    const modalOverflowNote = document.getElementById('modalOverflowNote');
    if (filteredItems.length > maxDisplayItems) {
        if (modalOverflowNote) {
            modalOverflowNote.textContent = `Mostrando ${maxDisplayItems} de ${filteredItems.length} items. Usa filtros para ver resultados más específicos.`;
            modalOverflowNote.classList.remove('hidden');
        }
    } else {
        if (modalOverflowNote) modalOverflowNote.classList.add('hidden');
    }

    showModal('questionsModal');
}

function getEstadoColor(estado) {
    const colors = {
        'Incorporada': '#36b37e',
        'En revisor editorial': '#B56576',
        'En elaboración': '#ffab00',
        'En coordinador': '#6554c0',
        'En revisor técnico': '#00b8d9',
        'Subcontrato': '#97a0af',
        'En elaboración cartografía': '#FFCA3A',
        'Pendiente': '#D1D5DB'
    };
    return colors[estado] || '#97a0af';
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal.show').forEach(modal => {
        modal.classList.remove('show');
    });
    document.body.style.overflow = '';
}

// Función de exportación (placeholder)
function exportEvolutionTableToCSV() {
    console.log('Exportando tabla de evolución a CSV...');
    // Implementar lógica de exportación aquí
}

// Exportar la función principal
export { updateEvolutionChart };