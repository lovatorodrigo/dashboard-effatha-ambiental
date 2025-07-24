// Variáveis globais
let rawData = [];
let filteredData = [];
let charts = {};

// Mapeamento de valores para números
const intensityMap = {
    'Nenhum': 0,
    'Fraco': 1,
    'Medio': 2,
    'Médio': 2,
    'Forte': 3
};

const directionMap = {
    'Norte-Sul': 0,
    'Sul-Norte': 1,
    'Leste-Oeste': 2,
    'Oeste-Leste': 3
};

// Cores do tema
const colors = {
    primary: '#2E7D32',
    secondary: '#4CAF50',
    accent: '#FF9800',
    background: '#F5F5F5',
    text: '#212121'
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
});

// Carregar dados
async function loadData() {
    try {
        console.log('Carregando dados...');
        const response = await fetch('data.json');
        const text = await response.text();
        
        console.log('Dados carregados, processando...');
        // Processar dados linha por linha (formato JSONL)
        rawData = text.trim().split('\n').map(line => JSON.parse(line));
        
        filteredData = [...rawData];
        
        console.log('Dados processados:', rawData.length, 'registros');
        
        updateKPIs();
        createAllCharts();
        updateComparison();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        // Mostrar erro na interface
        document.getElementById('total-measurements').textContent = 'Erro';
    }
}

// Event listeners
function setupEventListeners() {
    document.getElementById('period-filter').addEventListener('change', filterData);
    document.getElementById('location-filter').addEventListener('change', filterData);
}

// Filtrar dados
function filterData() {
    const periodFilter = document.getElementById('period-filter').value;
    const locationFilter = document.getElementById('location-filter').value;
    
    filteredData = rawData.filter(item => {
        // Filtro de período
        const date = new Date(item.data_hora);
        let periodMatch = true;
        
        if (periodFilter === 'baseline') {
            periodMatch = date >= new Date('2025-07-18') && date < new Date('2025-07-20');
        } else if (periodFilter === 'treatment') {
            periodMatch = date >= new Date('2025-07-21') && date < new Date('2025-07-23');
        }
        
        // Filtro de localização
        const locationMatch = locationFilter === 'all' || item.ponto === locationFilter;
        
        return periodMatch && locationMatch;
    });
    
    updateKPIs();
    updateAllCharts();
    updateComparison();
}

// Atualizar KPIs
function updateKPIs() {
    const totalMeasurements = filteredData.length;
    const uniqueLocations = [...new Set(filteredData.map(item => item.ponto))].length;
    
    const dates = filteredData.map(item => new Date(item.data_hora));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const period = `${minDate.toLocaleDateString('pt-BR')} - ${maxDate.toLocaleDateString('pt-BR')}`;
    
    // Calcular odor médio
    const odorValues = filteredData.map(item => {
        const odorResponse = item.respostas.find(r => r.pergunta.includes('odor'));
        return intensityMap[odorResponse?.resposta] || 0;
    });
    const avgOdor = (odorValues.reduce((a, b) => a + b, 0) / odorValues.length).toFixed(1);
    
    document.getElementById('total-measurements').textContent = totalMeasurements;
    document.getElementById('total-locations').textContent = uniqueLocations;
    document.getElementById('analysis-period').textContent = period;
    document.getElementById('avg-odor').textContent = avgOdor;
}

// Criar todos os gráficos
function createAllCharts() {
    console.log('Criando gráficos...');
    try {
        createLineChart();
        createBarChart();
        createPieChart();
        createCandlestickChart();
        createGanttChart();
        console.log('Gráficos criados com sucesso');
    } catch (error) {
        console.error('Erro ao criar gráficos:', error);
    }
}

// Atualizar todos os gráficos
function updateAllCharts() {
    Object.values(charts).forEach(chart => {
        if (chart && chart.destroy) {
            chart.destroy();
        }
    });
    createAllCharts();
}

// Gráfico de Linha - Evolução temporal do odor
function createLineChart() {
    const ctx = document.getElementById('line-chart').getContext('2d');
    
    // Agrupar dados por data
    const dataByDate = {};
    filteredData.forEach(item => {
        const date = new Date(item.data_hora).toLocaleDateString('pt-BR');
        const odorResponse = item.respostas.find(r => r.pergunta.includes('odor'));
        const odorValue = intensityMap[odorResponse?.resposta] || 0;
        
        if (!dataByDate[date]) {
            dataByDate[date] = [];
        }
        dataByDate[date].push(odorValue);
    });
    
    // Calcular médias por data
    const labels = Object.keys(dataByDate).sort();
    const data = labels.map(date => {
        const values = dataByDate[date];
        return values.reduce((a, b) => a + b, 0) / values.length;
    });
    
    charts.lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Intensidade Média do Odor',
                data: data,
                borderColor: colors.primary,
                backgroundColor: colors.primary + '20',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: colors.primary,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 3,
                    ticks: {
                        callback: function(value) {
                            const labels = ['Nenhum', 'Fraco', 'Médio', 'Forte'];
                            return labels[value] || value;
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de Barras - Intensidade de odor por local
function createBarChart() {
    const ctx = document.getElementById('bar-chart').getContext('2d');
    
    // Agrupar dados por local
    const dataByLocation = {};
    filteredData.forEach(item => {
        const location = item.ponto;
        const odorResponse = item.respostas.find(r => r.pergunta.includes('odor'));
        const odorValue = intensityMap[odorResponse?.resposta] || 0;
        
        if (!dataByLocation[location]) {
            dataByLocation[location] = [];
        }
        dataByLocation[location].push(odorValue);
    });
    
    // Calcular médias por local
    const labels = Object.keys(dataByLocation);
    const data = labels.map(location => {
        const values = dataByLocation[location];
        return values.reduce((a, b) => a + b, 0) / values.length;
    });
    
    charts.barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Intensidade Média do Odor',
                data: data,
                backgroundColor: [
                    colors.primary,
                    colors.secondary,
                    colors.accent,
                    '#9C27B0',
                    '#F44336'
                ],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 3,
                    ticks: {
                        callback: function(value) {
                            const labels = ['Nenhum', 'Fraco', 'Médio', 'Forte'];
                            return labels[value] || value;
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de Pizza - Distribuição das direções do vento
function createPieChart() {
    const ctx = document.getElementById('pie-chart').getContext('2d');
    
    // Contar direções do vento
    const directionCounts = {};
    filteredData.forEach(item => {
        const windResponse = item.respostas.find(r => r.pergunta.includes('direcao'));
        const direction = windResponse?.resposta || 'Não informado';
        
        directionCounts[direction] = (directionCounts[direction] || 0) + 1;
    });
    
    const labels = Object.keys(directionCounts);
    const data = Object.values(directionCounts);
    
    charts.pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    colors.primary,
                    colors.secondary,
                    colors.accent,
                    '#9C27B0',
                    '#F44336'
                ],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Gráfico Candlestick - Variações diárias
function createCandlestickChart() {
    // Agrupar dados por dia
    const dataByDay = {};
    filteredData.forEach(item => {
        const date = new Date(item.data_hora).toLocaleDateString('pt-BR');
        const odorResponse = item.respostas.find(r => r.pergunta.includes('odor'));
        const odorValue = intensityMap[odorResponse?.resposta] || 0;
        
        if (!dataByDay[date]) {
            dataByDay[date] = [];
        }
        dataByDay[date].push(odorValue);
    });
    
    // Calcular OHLC para cada dia
    const candlestickData = Object.keys(dataByDay).sort().map(date => {
        const values = dataByDay[date];
        const open = values[0];
        const close = values[values.length - 1];
        const high = Math.max(...values);
        const low = Math.min(...values);
        
        return {
            x: date,
            open: open,
            high: high,
            low: low,
            close: close
        };
    });
    
    const trace = {
        x: candlestickData.map(d => d.x),
        open: candlestickData.map(d => d.open),
        high: candlestickData.map(d => d.high),
        low: candlestickData.map(d => d.low),
        close: candlestickData.map(d => d.close),
        type: 'candlestick',
        name: 'Intensidade do Odor',
        increasing: { line: { color: colors.secondary } },
        decreasing: { line: { color: colors.accent } }
    };
    
    const layout = {
        title: '',
        xaxis: { title: 'Data' },
        yaxis: { 
            title: 'Intensidade',
            tickvals: [0, 1, 2, 3],
            ticktext: ['Nenhum', 'Fraco', 'Médio', 'Forte']
        },
        font: { family: 'Roboto, sans-serif' },
        plot_bgcolor: '#F8F9FA',
        paper_bgcolor: '#FFFFFF'
    };
    
    Plotly.newPlot('candlestick-chart', [trace], layout, { responsive: true });
}

// Gráfico de Gantt - Timeline das coletas
function createGanttChart() {
    // Agrupar dados por ponto e data
    const ganttData = [];
    const locationColors = {
        'Provaso entrada': colors.primary,
        'Barrichelo': colors.secondary,
        'Laranja madura': colors.accent,
        'Galpão': '#9C27B0',
        'Rosa': '#F44336'
    };
    
    const dataByLocation = {};
    filteredData.forEach(item => {
        const location = item.ponto;
        const date = new Date(item.data_hora);
        
        if (!dataByLocation[location]) {
            dataByLocation[location] = [];
        }
        dataByLocation[location].push(date);
    });
    
    Object.keys(dataByLocation).forEach(location => {
        const dates = dataByLocation[location].sort();
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        
        ganttData.push({
            Task: location,
            Start: startDate.toISOString().split('T')[0],
            Finish: endDate.toISOString().split('T')[0],
            Resource: location
        });
    });
    
    const traces = ganttData.map(item => ({
        x: [item.Start, item.Finish],
        y: [item.Task, item.Task],
        mode: 'lines',
        line: {
            color: locationColors[item.Task] || colors.primary,
            width: 20
        },
        name: item.Task,
        showlegend: false
    }));
    
    const layout = {
        title: '',
        xaxis: { title: 'Data' },
        yaxis: { title: 'Pontos de Medição' },
        font: { family: 'Roboto, sans-serif' },
        plot_bgcolor: '#F8F9FA',
        paper_bgcolor: '#FFFFFF'
    };
    
    Plotly.newPlot('gantt-chart', traces, layout, { responsive: true });
}

// Atualizar comparação Baseline vs Tratamento
function updateComparison() {
    // Separar dados por período
    const baselineData = rawData.filter(item => {
        const date = new Date(item.data_hora);
        return date >= new Date('2025-07-18') && date < new Date('2025-07-20');
    });
    
    const treatmentData = rawData.filter(item => {
        const date = new Date(item.data_hora);
        return date >= new Date('2025-07-21') && date < new Date('2025-07-23');
    });
    
    // Calcular métricas para baseline
    const baselineOdor = calculateAverageOdor(baselineData);
    const baselineWind = calculateAverageWind(baselineData);
    const baselineCount = baselineData.length;
    
    // Calcular métricas para tratamento
    const treatmentOdor = calculateAverageOdor(treatmentData);
    const treatmentWind = calculateAverageWind(treatmentData);
    const treatmentCount = treatmentData.length;
    
    // Calcular melhorias
    const odorImprovement = ((baselineOdor - treatmentOdor) / baselineOdor * 100).toFixed(1);
    const windVariation = ((treatmentWind - baselineWind) / baselineWind * 100).toFixed(1);
    const effectiveness = odorImprovement > 0 ? 'Positiva' : 'Negativa';
    
    // Atualizar interface
    document.getElementById('baseline-odor').textContent = baselineOdor.toFixed(1);
    document.getElementById('baseline-wind').textContent = baselineWind.toFixed(1);
    document.getElementById('baseline-count').textContent = baselineCount;
    
    document.getElementById('treatment-odor').textContent = treatmentOdor.toFixed(1);
    document.getElementById('treatment-wind').textContent = treatmentWind.toFixed(1);
    document.getElementById('treatment-count').textContent = treatmentCount;
    
    document.getElementById('odor-improvement').textContent = `${odorImprovement}%`;
    document.getElementById('wind-variation').textContent = `${windVariation}%`;
    document.getElementById('effectiveness').textContent = effectiveness;
}

// Funções auxiliares
function calculateAverageOdor(data) {
    const odorValues = data.map(item => {
        const odorResponse = item.respostas.find(r => r.pergunta.includes('odor'));
        return intensityMap[odorResponse?.resposta] || 0;
    });
    return odorValues.reduce((a, b) => a + b, 0) / odorValues.length;
}

function calculateAverageWind(data) {
    const windValues = data.map(item => {
        const windResponse = item.respostas.find(r => r.pergunta.includes('intensidade do vento'));
        return intensityMap[windResponse?.resposta] || 0;
    });
    return windValues.reduce((a, b) => a + b, 0) / windValues.length;
}

