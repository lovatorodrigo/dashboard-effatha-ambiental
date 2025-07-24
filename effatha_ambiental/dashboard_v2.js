// Variáveis globais
let rawData = [];
let filteredData = [];
let charts = {};
let periodConfig = {
    baselineStart: null,
    baselineEnd: null,
    treatmentStart: null,
    treatmentEnd: null
};

// Mapeamento de valores para números
const intensityMap = {
    'Nenhum': 0,
    'Fraco': 1,
    'Medio': 2,
    'Médio': 2,
    'Forte': 3
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
    setupEventListeners();
    loadDefaultData();
});

// Event listeners
function setupEventListeners() {
    // Upload de arquivo
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    fileInput.addEventListener('change', handleFileSelect);
    
    // Filtros
    document.getElementById('period-filter').addEventListener('change', filterData);
    document.getElementById('location-filter').addEventListener('change', filterData);
}

// Manipulação de drag and drop
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

// Seleção de arquivo
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

// Processamento de arquivo
function processFile(file) {
    if (!file.name.endsWith('.json')) {
        showMessage('Erro: Por favor, selecione um arquivo JSON válido.', 'error');
        return;
    }
    
    showLoading(true);
    showMessage('Carregando arquivo...', 'info');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            parseAndLoadData(content);
            showMessage(`Arquivo "${file.name}" carregado com sucesso!`, 'success');
        } catch (error) {
            console.error('Erro ao processar arquivo:', error);
            showMessage('Erro ao processar arquivo. Verifique o formato JSON.', 'error');
        } finally {
            showLoading(false);
        }
    };
    
    reader.onerror = function() {
        showMessage('Erro ao ler o arquivo.', 'error');
        showLoading(false);
    };
    
    reader.readAsText(file);
}

// Parse e carregamento de dados
function parseAndLoadData(content) {
    try {
        // Tentar como JSON array primeiro
        rawData = JSON.parse(content);
        
        // Se não for array, tentar como JSONL
        if (!Array.isArray(rawData)) {
            rawData = content.trim().split('\n').map(line => JSON.parse(line));
        }
    } catch (error) {
        // Tentar como JSONL
        rawData = content.trim().split('\n').map(line => JSON.parse(line));
    }
    
    if (!rawData || rawData.length === 0) {
        throw new Error('Nenhum dado encontrado no arquivo');
    }
    
    // Validar estrutura dos dados
    validateDataStructure(rawData[0]);
    
    // Processar dados
    filteredData = [...rawData];
    
    // Atualizar interface
    updateLocationFilter();
    detectAndSetPeriods();
    updateKPIs();
    createAllCharts();
    updateComparison();
}

// Validação da estrutura dos dados
function validateDataStructure(sample) {
    const requiredFields = ['data_hora', 'ponto', 'respostas'];
    
    for (const field of requiredFields) {
        if (!sample.hasOwnProperty(field)) {
            throw new Error(`Campo obrigatório "${field}" não encontrado`);
        }
    }
    
    if (!Array.isArray(sample.respostas)) {
        throw new Error('Campo "respostas" deve ser um array');
    }
    
    if (sample.respostas.length === 0) {
        throw new Error('Array "respostas" não pode estar vazio');
    }
    
    const firstResponse = sample.respostas[0];
    if (!firstResponse.pergunta || !firstResponse.resposta) {
        throw new Error('Estrutura de resposta inválida');
    }
}

// Carregar dados padrão
function loadDefaultData() {
    fetch('data.json')
        .then(response => response.text())
        .then(content => {
            parseAndLoadData(content);
            showMessage('Dados padrão carregados. Você pode fazer upload de novos dados a qualquer momento.', 'info');
        })
        .catch(error => {
            console.error('Erro ao carregar dados padrão:', error);
            showMessage('Nenhum dado disponível. Por favor, faça upload de um arquivo JSON.', 'info');
        });
}

// Atualizar filtro de localização
function updateLocationFilter() {
    const locationFilter = document.getElementById('location-filter');
    const locations = [...new Set(rawData.map(item => item.ponto))];
    
    // Limpar opções existentes (exceto "Todos os Pontos")
    locationFilter.innerHTML = '<option value="all">Todos os Pontos</option>';
    
    // Adicionar novas opções
    locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        locationFilter.appendChild(option);
    });
}

// Detectar e configurar períodos automaticamente
function detectAndSetPeriods() {
    const dates = rawData.map(item => new Date(item.data_hora)).sort();
    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];
    
    // Calcular ponto médio
    const midPoint = new Date((minDate.getTime() + maxDate.getTime()) / 2);
    
    // Configurar períodos padrão
    periodConfig.baselineStart = minDate;
    periodConfig.baselineEnd = midPoint;
    periodConfig.treatmentStart = midPoint;
    periodConfig.treatmentEnd = maxDate;
    
    // Atualizar campos de data
    document.getElementById('baselineStart').value = formatDateForInput(minDate);
    document.getElementById('baselineEnd').value = formatDateForInput(midPoint);
    document.getElementById('treatmentStart').value = formatDateForInput(midPoint);
    document.getElementById('treatmentEnd').value = formatDateForInput(maxDate);
}

// Aplicar configuração de períodos
function applyPeriodConfiguration() {
    const baselineStart = document.getElementById('baselineStart').value;
    const baselineEnd = document.getElementById('baselineEnd').value;
    const treatmentStart = document.getElementById('treatmentStart').value;
    const treatmentEnd = document.getElementById('treatmentEnd').value;
    
    // Validar datas
    if (!baselineStart || !baselineEnd || !treatmentStart || !treatmentEnd) {
        showMessage('Por favor, preencha todas as datas.', 'error');
        return;
    }
    
    const bStart = new Date(baselineStart);
    const bEnd = new Date(baselineEnd);
    const tStart = new Date(treatmentStart);
    const tEnd = new Date(treatmentEnd);
    
    if (bStart >= bEnd) {
        showMessage('Data de fim do baseline deve ser posterior ao início.', 'error');
        return;
    }
    
    if (tStart >= tEnd) {
        showMessage('Data de fim do tratamento deve ser posterior ao início.', 'error');
        return;
    }
    
    if (bEnd > tStart) {
        showMessage('Período de tratamento deve começar após o baseline.', 'error');
        return;
    }
    
    // Atualizar configuração
    periodConfig.baselineStart = bStart;
    periodConfig.baselineEnd = bEnd;
    periodConfig.treatmentStart = tStart;
    periodConfig.treatmentEnd = tEnd;
    
    // Atualizar títulos das seções
    document.getElementById('baseline-title').textContent = 
        `Baseline (${formatDateForDisplay(bStart)} - ${formatDateForDisplay(bEnd)})`;
    document.getElementById('treatment-title').textContent = 
        `Tratamento (${formatDateForDisplay(tStart)} - ${formatDateForDisplay(tEnd)})`;
    
    // Reprocessar dados
    filterData();
    updateComparison();
    
    showMessage('Configuração de períodos aplicada com sucesso!', 'success');
}

// Filtrar dados
function filterData() {
    const periodFilter = document.getElementById('period-filter').value;
    const locationFilter = document.getElementById('location-filter').value;
    
    filteredData = rawData.filter(item => {
        const date = new Date(item.data_hora);
        let periodMatch = true;
        
        if (periodFilter === 'baseline') {
            periodMatch = date >= periodConfig.baselineStart && date <= periodConfig.baselineEnd;
        } else if (periodFilter === 'treatment') {
            periodMatch = date >= periodConfig.treatmentStart && date <= periodConfig.treatmentEnd;
        }
        
        const locationMatch = locationFilter === 'all' || item.ponto === locationFilter;
        
        return periodMatch && locationMatch;
    });
    
    updateKPIs();
    updateAllCharts();
}

// Atualizar KPIs
function updateKPIs() {
    const totalMeasurements = filteredData.length;
    const uniqueLocations = [...new Set(filteredData.map(item => item.ponto))].length;
    
    const dates = filteredData.map(item => new Date(item.data_hora));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const period = `${formatDateForDisplay(minDate)} - ${formatDateForDisplay(maxDate)}`;
    
    // Calcular odor médio
    const odorValues = filteredData.map(item => {
        const odorResponse = item.respostas.find(r => r.pergunta.toLowerCase().includes('odor'));
        return intensityMap[odorResponse?.resposta] || 0;
    });
    const avgOdor = odorValues.length > 0 ? 
        (odorValues.reduce((a, b) => a + b, 0) / odorValues.length).toFixed(1) : '0';
    
    document.getElementById('total-measurements').textContent = totalMeasurements;
    document.getElementById('total-locations').textContent = uniqueLocations;
    document.getElementById('analysis-period').textContent = period;
    document.getElementById('avg-odor').textContent = avgOdor;
}

// Criar todos os gráficos
function createAllCharts() {
    if (filteredData.length === 0) {
        showMessage('Nenhum dado disponível para os filtros selecionados.', 'info');
        return;
    }
    
    try {
        createLineChart();
        createBarChart();
        createPieChart();
        createCandlestickChart();
        createGanttChart();
    } catch (error) {
        console.error('Erro ao criar gráficos:', error);
        showMessage('Erro ao criar gráficos. Verifique os dados.', 'error');
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

// Gráfico de Linha
function createLineChart() {
    const ctx = document.getElementById('line-chart');
    if (!ctx) return;
    
    // Agrupar dados por data
    const dataByDate = {};
    filteredData.forEach(item => {
        const date = new Date(item.data_hora).toLocaleDateString('pt-BR');
        const odorResponse = item.respostas.find(r => r.pergunta.toLowerCase().includes('odor'));
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

// Gráfico de Barras
function createBarChart() {
    const ctx = document.getElementById('bar-chart');
    if (!ctx) return;
    
    // Agrupar dados por local
    const dataByLocation = {};
    filteredData.forEach(item => {
        const location = item.ponto;
        const odorResponse = item.respostas.find(r => r.pergunta.toLowerCase().includes('odor'));
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
                    '#F44336',
                    '#2196F3',
                    '#FF5722'
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

// Gráfico de Pizza
function createPieChart() {
    const ctx = document.getElementById('pie-chart');
    if (!ctx) return;
    
    // Contar direções do vento
    const directionCounts = {};
    filteredData.forEach(item => {
        const windResponse = item.respostas.find(r => r.pergunta.toLowerCase().includes('direcao'));
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
                    '#F44336',
                    '#2196F3',
                    '#FF5722'
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

// Gráfico Candlestick
function createCandlestickChart() {
    const element = document.getElementById('candlestick-chart');
    if (!element || typeof Plotly === 'undefined') return;
    
    // Agrupar dados por dia
    const dataByDay = {};
    filteredData.forEach(item => {
        const date = new Date(item.data_hora).toLocaleDateString('pt-BR');
        const odorResponse = item.respostas.find(r => r.pergunta.toLowerCase().includes('odor'));
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
        paper_bgcolor: '#FFFFFF',
        margin: { t: 20, r: 20, b: 40, l: 60 }
    };
    
    Plotly.newPlot(element, [trace], layout, { responsive: true });
}

// Gráfico de Gantt
function createGanttChart() {
    const element = document.getElementById('gantt-chart');
    if (!element || typeof Plotly === 'undefined') return;
    
    // Agrupar dados por ponto e data
    const locationColors = [
        colors.primary, colors.secondary, colors.accent, 
        '#9C27B0', '#F44336', '#2196F3', '#FF5722'
    ];
    
    const dataByLocation = {};
    filteredData.forEach(item => {
        const location = item.ponto;
        const date = new Date(item.data_hora);
        
        if (!dataByLocation[location]) {
            dataByLocation[location] = [];
        }
        dataByLocation[location].push(date);
    });
    
    const traces = Object.keys(dataByLocation).map((location, index) => {
        const dates = dataByLocation[location].sort();
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        
        return {
            x: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
            y: [location, location],
            mode: 'lines',
            line: {
                color: locationColors[index % locationColors.length],
                width: 20
            },
            name: location,
            showlegend: false
        };
    });
    
    const layout = {
        title: '',
        xaxis: { title: 'Data' },
        yaxis: { title: 'Pontos de Medição' },
        font: { family: 'Roboto, sans-serif' },
        plot_bgcolor: '#F8F9FA',
        paper_bgcolor: '#FFFFFF',
        margin: { t: 20, r: 20, b: 40, l: 120 }
    };
    
    Plotly.newPlot(element, traces, layout, { responsive: true });
}

// Atualizar comparação
function updateComparison() {
    // Separar dados por período configurado
    const baselineData = rawData.filter(item => {
        const date = new Date(item.data_hora);
        return date >= periodConfig.baselineStart && date <= periodConfig.baselineEnd;
    });
    
    const treatmentData = rawData.filter(item => {
        const date = new Date(item.data_hora);
        return date >= periodConfig.treatmentStart && date <= periodConfig.treatmentEnd;
    });
    
    // Calcular métricas
    const baselineOdor = calculateAverageOdor(baselineData);
    const baselineWind = calculateAverageWind(baselineData);
    const baselineCount = baselineData.length;
    
    const treatmentOdor = calculateAverageOdor(treatmentData);
    const treatmentWind = calculateAverageWind(treatmentData);
    const treatmentCount = treatmentData.length;
    
    // Calcular melhorias
    const odorImprovement = baselineOdor > 0 ? 
        ((baselineOdor - treatmentOdor) / baselineOdor * 100).toFixed(1) : '0';
    const windVariation = baselineWind > 0 ? 
        ((treatmentWind - baselineWind) / baselineWind * 100).toFixed(1) : '0';
    const effectiveness = parseFloat(odorImprovement) > 0 ? 'Positiva' : 'Negativa';
    
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
    if (data.length === 0) return 0;
    
    const odorValues = data.map(item => {
        const odorResponse = item.respostas.find(r => r.pergunta.toLowerCase().includes('odor'));
        return intensityMap[odorResponse?.resposta] || 0;
    });
    return odorValues.reduce((a, b) => a + b, 0) / odorValues.length;
}

function calculateAverageWind(data) {
    if (data.length === 0) return 0;
    
    const windValues = data.map(item => {
        const windResponse = item.respostas.find(r => 
            r.pergunta.toLowerCase().includes('intensidade') && 
            r.pergunta.toLowerCase().includes('vento')
        );
        return intensityMap[windResponse?.resposta] || 0;
    });
    return windValues.reduce((a, b) => a + b, 0) / windValues.length;
}

function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

function formatDateForDisplay(date) {
    return date.toLocaleDateString('pt-BR');
}

function showMessage(message, type) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.innerHTML = `<div class="status-message status-${type}">${message}</div>`;
    
    // Auto-hide success and info messages
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 5000);
    }
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.add('show');
    } else {
        loading.classList.remove('show');
    }
}

