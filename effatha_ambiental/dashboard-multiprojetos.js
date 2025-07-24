// Configuração da API
const API_BASE = 'http://localhost:5000/api';
const AUTH_API_BASE = 'http://localhost:5000/api/auth';

// Variáveis globais
let currentProject = null;
let projectData = [];
let filteredData = [];
let charts = {};

// Configurações de cores por projeto
const PROJECT_THEMES = {
    'provaso': {
        primary: '#2E7D32',
        secondary: '#4CAF50',
        accent: '#81C784'
    },
    'industrial_abc': {
        primary: '#1976D2',
        secondary: '#2196F3',
        accent: '#64B5F6'
    },
    'urbano_xyz': {
        primary: '#FF9800',
        secondary: '#FFC107',
        accent: '#FFB74D'
    }
};

// Inicialização
window.addEventListener('load', function() {
    initializeDashboard();
});

async function initializeDashboard() {
    try {
        showLoading(true);
        
        // Verificar autenticação
        await checkAuthentication();
        
        // Obter projeto da URL ou localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('project') || localStorage.getItem('selectedProject');
        
        if (!projectId) {
            window.location.href = 'project-selector.html';
            return;
        }
        
        // Carregar projeto
        await loadProject(projectId);
        
        // Carregar dados do projeto
        await loadProjectData(projectId);
        
        // Configurar eventos
        setupEventListeners();
        
        // Aplicar tema do projeto
        applyProjectTheme(projectId);
        
        // Inicializar gráficos
        initializeCharts();
        
    } catch (error) {
        console.error('Erro ao inicializar dashboard:', error);
        showError('Erro ao carregar dashboard. Verifique sua conexão.');
    } finally {
        showLoading(false);
    }
}

async function checkAuthentication() {
    try {
        const response = await fetch(`${AUTH_API_BASE}/check-auth`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            window.location.href = 'login.html';
            return;
        }

        const data = await response.json();
        if (!data.authenticated) {
            window.location.href = 'login.html';
            return;
        }

        document.getElementById('currentUser').textContent = data.user;
        
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        window.location.href = 'login.html';
    }
}

async function loadProject(projectId) {
    try {
        const response = await fetch(`${API_BASE}/projects/${projectId}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 403) {
                alert('Você não tem permissão para acessar este projeto.');
                window.location.href = 'project-selector.html';
                return;
            }
            throw new Error('Erro ao carregar projeto');
        }

        const data = await response.json();
        currentProject = data.project;
        
        // Atualizar interface
        document.getElementById('projectName').textContent = currentProject.name;
        document.getElementById('breadcrumbProject').textContent = currentProject.name;
        document.title = `${currentProject.name} - Effatha Ambiental`;
        
        // Carregar configurações de período se existirem
        const settings = currentProject.settings || {};
        const periodConfig = settings.period_config || {};
        
        if (periodConfig.baseline_start) {
            document.getElementById('baselineStart').value = periodConfig.baseline_start;
        }
        if (periodConfig.baseline_end) {
            document.getElementById('baselineEnd').value = periodConfig.baseline_end;
        }
        if (periodConfig.treatment_start) {
            document.getElementById('treatmentStart').value = periodConfig.treatment_start;
        }
        if (periodConfig.treatment_end) {
            document.getElementById('treatmentEnd').value = periodConfig.treatment_end;
        }
        
    } catch (error) {
        console.error('Erro ao carregar projeto:', error);
        throw error;
    }
}

async function loadProjectData(projectId) {
    try {
        const response = await fetch(`${API_BASE}/projects/${projectId}/data`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar dados do projeto');
        }

        const data = await response.json();
        projectData = data.data || [];
        filteredData = [...projectData];
        
        // Atualizar interface
        updateKPIs();
        updateLocationFilter();
        updateCharts();
        updateComparison();
        
        if (projectData.length === 0) {
            showInfo('Nenhum dado encontrado para este projeto. Faça upload de um arquivo JSON.');
        }
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showError('Erro ao carregar dados do projeto.');
    }
}

function applyProjectTheme(projectId) {
    const theme = PROJECT_THEMES[projectId] || PROJECT_THEMES['provaso'];
    
    // Aplicar variáveis CSS
    document.documentElement.style.setProperty('--primary-color', theme.primary);
    document.documentElement.style.setProperty('--secondary-color', theme.secondary);
    document.documentElement.style.setProperty('--accent-color', theme.accent);
}

function setupEventListeners() {
    // Upload de arquivo
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    fileInput.addEventListener('change', handleFileUpload);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleFileDrop);
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // Filtros
    document.getElementById('period-filter').addEventListener('change', applyFilters);
    document.getElementById('location-filter').addEventListener('change', applyFilters);
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

function handleFileDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

async function processFile(file) {
    if (!file.name.toLowerCase().endsWith('.json')) {
        showError('Por favor, selecione um arquivo JSON válido.');
        return;
    }
    
    try {
        showInfo('Processando arquivo...');
        
        const text = await file.text();
        let jsonData;
        
        try {
            jsonData = JSON.parse(text);
        } catch (parseError) {
            showError('Arquivo JSON inválido. Verifique a sintaxe.');
            return;
        }
        
        // Validar estrutura dos dados
        if (!Array.isArray(jsonData)) {
            showError('O arquivo deve conter um array de medições.');
            return;
        }
        
        // Preparar dados para upload
        const measurements = jsonData.map(item => ({
            data_hora: item.data_hora,
            ponto: item.ponto,
            respostas: item.respostas || [],
            coordinates: item.coordinates,
            metadata: item.metadata
        }));
        
        // Fazer upload para o projeto
        await uploadProjectData(measurements);
        
    } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        showError('Erro ao processar arquivo. Tente novamente.');
    }
}

async function uploadProjectData(measurements) {
    try {
        const response = await fetch(`${API_BASE}/projects/${currentProject.id}/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                measurements: measurements
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showSuccess(`${result.saved_count} medições carregadas com sucesso!`);
            
            if (result.errors && result.errors.length > 0) {
                console.warn('Erros durante upload:', result.errors);
            }
            
            // Recarregar dados
            await loadProjectData(currentProject.id);
            
        } else {
            showError(result.error || 'Erro ao fazer upload dos dados');
        }
        
    } catch (error) {
        console.error('Erro no upload:', error);
        showError('Erro de conexão durante upload.');
    }
}

async function applyPeriodConfiguration() {
    const baselineStart = document.getElementById('baselineStart').value;
    const baselineEnd = document.getElementById('baselineEnd').value;
    const treatmentStart = document.getElementById('treatmentStart').value;
    const treatmentEnd = document.getElementById('treatmentEnd').value;
    
    // Validações
    if (!baselineStart || !baselineEnd || !treatmentStart || !treatmentEnd) {
        showError('Por favor, preencha todas as datas.');
        return;
    }
    
    if (new Date(baselineEnd) <= new Date(baselineStart)) {
        showError('Data de fim do baseline deve ser posterior ao início.');
        return;
    }
    
    if (new Date(treatmentEnd) <= new Date(treatmentStart)) {
        showError('Data de fim do tratamento deve ser posterior ao início.');
        return;
    }
    
    if (new Date(treatmentStart) <= new Date(baselineEnd)) {
        showError('Período de tratamento deve começar após o baseline.');
        return;
    }
    
    try {
        // Salvar configuração no projeto
        const config = {
            period_config: {
                baseline_start: baselineStart,
                baseline_end: baselineEnd,
                treatment_start: treatmentStart,
                treatment_end: treatmentEnd
            }
        };
        
        const response = await fetch(`${API_BASE}/projects/${currentProject.id}/config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(config)
        });
        
        if (response.ok) {
            showSuccess('Configuração de períodos aplicada com sucesso!');
            
            // Atualizar projeto local
            currentProject.settings = currentProject.settings || {};
            currentProject.settings.period_config = config.period_config;
            
            // Atualizar análises
            updateComparison();
            
        } else {
            showError('Erro ao salvar configuração.');
        }
        
    } catch (error) {
        console.error('Erro ao aplicar configuração:', error);
        showError('Erro de conexão ao salvar configuração.');
    }
}

function applyFilters() {
    const periodFilter = document.getElementById('period-filter').value;
    const locationFilter = document.getElementById('location-filter').value;
    
    filteredData = projectData.filter(item => {
        // Filtro por período
        if (periodFilter !== 'all') {
            const itemDate = new Date(item.data_hora);
            const settings = currentProject.settings || {};
            const periodConfig = settings.period_config || {};
            
            if (periodFilter === 'baseline') {
                const start = periodConfig.baseline_start ? new Date(periodConfig.baseline_start) : null;
                const end = periodConfig.baseline_end ? new Date(periodConfig.baseline_end) : null;
                
                if (start && end) {
                    if (itemDate < start || itemDate > end) return false;
                }
            } else if (periodFilter === 'treatment') {
                const start = periodConfig.treatment_start ? new Date(periodConfig.treatment_start) : null;
                const end = periodConfig.treatment_end ? new Date(periodConfig.treatment_end) : null;
                
                if (start && end) {
                    if (itemDate < start || itemDate > end) return false;
                }
            }
        }
        
        // Filtro por localização
        if (locationFilter !== 'all') {
            if (item.ponto !== locationFilter) return false;
        }
        
        return true;
    });
    
    // Atualizar interface
    updateKPIs();
    updateCharts();
}

function updateKPIs() {
    const totalMeasurements = filteredData.length;
    const uniqueLocations = [...new Set(filteredData.map(item => item.ponto))].length;
    
    // Período de análise
    let analysisePeriod = '-';
    if (filteredData.length > 0) {
        const dates = filteredData.map(item => new Date(item.data_hora)).sort();
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        analysisePeriod = `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`;
    }
    
    // Métrica principal (adaptável por projeto)
    let mainMetric = '-';
    if (filteredData.length > 0) {
        // Para ProVaso: intensidade do odor
        if (currentProject.id === 'provaso') {
            const odorValues = filteredData.map(item => {
                const odorResponse = item.respostas.find(r => 
                    r.pergunta && r.pergunta.toLowerCase().includes('odor')
                );
                if (odorResponse) {
                    const intensityMap = { 'Nenhum': 0, 'Fraco': 1, 'Médio': 2, 'Forte': 3 };
                    return intensityMap[odorResponse.resposta] || 0;
                }
                return 0;
            });
            const avgOdor = odorValues.reduce((a, b) => a + b, 0) / odorValues.length;
            mainMetric = avgOdor.toFixed(1);
        } else {
            // Para outros projetos: primeira métrica numérica encontrada
            mainMetric = filteredData.length.toString();
        }
    }
    
    // Atualizar elementos
    document.getElementById('total-measurements').textContent = totalMeasurements;
    document.getElementById('total-locations').textContent = uniqueLocations;
    document.getElementById('analysis-period').textContent = analysisePeriod;
    document.getElementById('main-metric').textContent = mainMetric;
}

function updateLocationFilter() {
    const locationSelect = document.getElementById('location-filter');
    const uniqueLocations = [...new Set(projectData.map(item => item.ponto))];
    
    // Limpar opções existentes (exceto "Todos os Pontos")
    while (locationSelect.children.length > 1) {
        locationSelect.removeChild(locationSelect.lastChild);
    }
    
    // Adicionar localizações
    uniqueLocations.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        locationSelect.appendChild(option);
    });
}

function initializeCharts() {
    // Inicializar gráficos vazios
    initLineChart();
    initBarChart();
    initPieChart();
    initCandlestickChart();
    initGanttChart();
}

function updateCharts() {
    updateLineChart();
    updateBarChart();
    updatePieChart();
    updateCandlestickChart();
    updateGanttChart();
}

function initLineChart() {
    const ctx = document.getElementById('line-chart').getContext('2d');
    const theme = PROJECT_THEMES[currentProject.id] || PROJECT_THEMES['provaso'];
    
    charts.lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Evolução Temporal',
                data: [],
                borderColor: theme.primary,
                backgroundColor: theme.accent + '20',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateLineChart() {
    if (!charts.lineChart || filteredData.length === 0) return;
    
    // Preparar dados baseados no projeto
    let chartData = [];
    let labels = [];
    
    if (currentProject.id === 'provaso') {
        // Para ProVaso: evolução da intensidade do odor
        const sortedData = filteredData.sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
        
        labels = sortedData.map(item => new Date(item.data_hora).toLocaleDateString('pt-BR'));
        chartData = sortedData.map(item => {
            const odorResponse = item.respostas.find(r => 
                r.pergunta && r.pergunta.toLowerCase().includes('odor')
            );
            if (odorResponse) {
                const intensityMap = { 'Nenhum': 0, 'Fraco': 1, 'Médio': 2, 'Forte': 3 };
                return intensityMap[odorResponse.resposta] || 0;
            }
            return 0;
        });
    } else {
        // Para outros projetos: contagem por dia
        const dailyCounts = {};
        filteredData.forEach(item => {
            const date = new Date(item.data_hora).toLocaleDateString('pt-BR');
            dailyCounts[date] = (dailyCounts[date] || 0) + 1;
        });
        
        labels = Object.keys(dailyCounts).sort();
        chartData = labels.map(date => dailyCounts[date]);
    }
    
    charts.lineChart.data.labels = labels;
    charts.lineChart.data.datasets[0].data = chartData;
    charts.lineChart.update();
}

function initBarChart() {
    const ctx = document.getElementById('bar-chart').getContext('2d');
    const theme = PROJECT_THEMES[currentProject.id] || PROJECT_THEMES['provaso'];
    
    charts.barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Análise por Local',
                data: [],
                backgroundColor: theme.primary,
                borderColor: theme.secondary,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateBarChart() {
    if (!charts.barChart || filteredData.length === 0) return;
    
    // Agrupar por local
    const locationCounts = {};
    filteredData.forEach(item => {
        locationCounts[item.ponto] = (locationCounts[item.ponto] || 0) + 1;
    });
    
    const labels = Object.keys(locationCounts);
    const data = Object.values(locationCounts);
    
    charts.barChart.data.labels = labels;
    charts.barChart.data.datasets[0].data = data;
    charts.barChart.update();
}

function initPieChart() {
    const ctx = document.getElementById('pie-chart').getContext('2d');
    const theme = PROJECT_THEMES[currentProject.id] || PROJECT_THEMES['provaso'];
    
    charts.pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    theme.primary,
                    theme.secondary,
                    theme.accent,
                    '#FF9800',
                    '#9C27B0',
                    '#607D8B'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function updatePieChart() {
    if (!charts.pieChart || filteredData.length === 0) return;
    
    let categories = {};
    
    if (currentProject.id === 'provaso') {
        // Para ProVaso: distribuição das direções do vento
        filteredData.forEach(item => {
            const windResponse = item.respostas.find(r => 
                r.pergunta && r.pergunta.toLowerCase().includes('vento')
            );
            if (windResponse && windResponse.resposta) {
                const direction = windResponse.resposta;
                categories[direction] = (categories[direction] || 0) + 1;
            }
        });
    } else {
        // Para outros projetos: distribuição por local
        filteredData.forEach(item => {
            categories[item.ponto] = (categories[item.ponto] || 0) + 1;
        });
    }
    
    const labels = Object.keys(categories);
    const data = Object.values(categories);
    
    charts.pieChart.data.labels = labels;
    charts.pieChart.data.datasets[0].data = data;
    charts.pieChart.update();
}

function initCandlestickChart() {
    // Placeholder para gráfico candlestick usando Plotly
    const chartDiv = document.getElementById('candlestick-chart');
    
    Plotly.newPlot(chartDiv, [], {
        title: 'Variações Diárias',
        xaxis: { title: 'Data' },
        yaxis: { title: 'Valores' },
        responsive: true
    });
}

function updateCandlestickChart() {
    if (filteredData.length === 0) return;
    
    // Agrupar dados por dia para criar candlestick
    const dailyData = {};
    
    filteredData.forEach(item => {
        const date = new Date(item.data_hora).toISOString().split('T')[0];
        
        if (!dailyData[date]) {
            dailyData[date] = [];
        }
        
        // Extrair valor numérico (adaptável por projeto)
        let value = 0;
        if (currentProject.id === 'provaso') {
            const odorResponse = item.respostas.find(r => 
                r.pergunta && r.pergunta.toLowerCase().includes('odor')
            );
            if (odorResponse) {
                const intensityMap = { 'Nenhum': 0, 'Fraco': 1, 'Médio': 2, 'Forte': 3 };
                value = intensityMap[odorResponse.resposta] || 0;
            }
        } else {
            value = Math.random() * 100; // Placeholder para outros projetos
        }
        
        dailyData[date].push(value);
    });
    
    // Calcular OHLC para cada dia
    const dates = Object.keys(dailyData).sort();
    const open = [];
    const high = [];
    const low = [];
    const close = [];
    
    dates.forEach(date => {
        const values = dailyData[date];
        if (values.length > 0) {
            open.push(values[0]);
            high.push(Math.max(...values));
            low.push(Math.min(...values));
            close.push(values[values.length - 1]);
        }
    });
    
    const trace = {
        x: dates,
        open: open,
        high: high,
        low: low,
        close: close,
        type: 'candlestick',
        name: 'Variações Diárias'
    };
    
    const layout = {
        title: 'Variações Diárias',
        xaxis: { title: 'Data' },
        yaxis: { title: 'Intensidade' },
        responsive: true
    };
    
    Plotly.react('candlestick-chart', [trace], layout);
}

function initGanttChart() {
    // Placeholder para gráfico Gantt usando Plotly
    const chartDiv = document.getElementById('gantt-chart');
    
    Plotly.newPlot(chartDiv, [], {
        title: 'Timeline das Coletas',
        xaxis: { title: 'Data' },
        yaxis: { title: 'Pontos de Medição' },
        responsive: true
    });
}

function updateGanttChart() {
    if (filteredData.length === 0) return;
    
    // Agrupar por ponto e criar timeline
    const locationTimelines = {};
    
    filteredData.forEach(item => {
        const location = item.ponto;
        const date = new Date(item.data_hora);
        
        if (!locationTimelines[location]) {
            locationTimelines[location] = [];
        }
        
        locationTimelines[location].push(date);
    });
    
    // Criar traces para Gantt
    const traces = [];
    const locations = Object.keys(locationTimelines);
    
    locations.forEach((location, index) => {
        const dates = locationTimelines[location].sort();
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        
        traces.push({
            x: [startDate, endDate],
            y: [location, location],
            mode: 'lines+markers',
            type: 'scatter',
            name: location,
            line: { width: 10 }
        });
    });
    
    const layout = {
        title: 'Timeline das Coletas por Ponto',
        xaxis: { title: 'Data' },
        yaxis: { title: 'Pontos de Medição' },
        responsive: true,
        showlegend: false
    };
    
    Plotly.react('gantt-chart', traces, layout);
}

function updateComparison() {
    const settings = currentProject.settings || {};
    const periodConfig = settings.period_config || {};
    
    if (!periodConfig.baseline_start || !periodConfig.treatment_start) {
        // Limpar comparação se não há configuração
        document.getElementById('baseline-main').textContent = '-';
        document.getElementById('baseline-secondary').textContent = '-';
        document.getElementById('baseline-count').textContent = '-';
        document.getElementById('treatment-main').textContent = '-';
        document.getElementById('treatment-secondary').textContent = '-';
        document.getElementById('treatment-count').textContent = '-';
        document.getElementById('main-improvement').textContent = '-';
        document.getElementById('secondary-variation').textContent = '-';
        document.getElementById('effectiveness').textContent = '-';
        return;
    }
    
    // Filtrar dados por período
    const baselineData = projectData.filter(item => {
        const date = new Date(item.data_hora);
        const start = new Date(periodConfig.baseline_start);
        const end = new Date(periodConfig.baseline_end);
        return date >= start && date <= end;
    });
    
    const treatmentData = projectData.filter(item => {
        const date = new Date(item.data_hora);
        const start = new Date(periodConfig.treatment_start);
        const end = new Date(periodConfig.treatment_end);
        return date >= start && date <= end;
    });
    
    // Calcular métricas baseadas no projeto
    let baselineMain = 0, baselineSecondary = 0;
    let treatmentMain = 0, treatmentSecondary = 0;
    
    if (currentProject.id === 'provaso') {
        // Para ProVaso: odor e vento
        baselineMain = calculateAverageOdor(baselineData);
        baselineSecondary = calculateAverageWind(baselineData);
        treatmentMain = calculateAverageOdor(treatmentData);
        treatmentSecondary = calculateAverageWind(treatmentData);
    } else {
        // Para outros projetos: contagens
        baselineMain = baselineData.length;
        baselineSecondary = [...new Set(baselineData.map(item => item.ponto))].length;
        treatmentMain = treatmentData.length;
        treatmentSecondary = [...new Set(treatmentData.map(item => item.ponto))].length;
    }
    
    // Calcular melhorias
    const mainImprovement = baselineMain > 0 ? 
        ((baselineMain - treatmentMain) / baselineMain * 100).toFixed(1) + '%' : '-';
    
    const secondaryVariation = baselineSecondary > 0 ? 
        ((treatmentSecondary - baselineSecondary) / baselineSecondary * 100).toFixed(1) + '%' : '-';
    
    const effectiveness = (baselineMain > treatmentMain) ? 'Positiva' : 
                         (baselineMain < treatmentMain) ? 'Negativa' : 'Neutra';
    
    // Atualizar interface
    document.getElementById('baseline-main').textContent = baselineMain.toFixed(1);
    document.getElementById('baseline-secondary').textContent = baselineSecondary.toFixed(1);
    document.getElementById('baseline-count').textContent = baselineData.length;
    document.getElementById('treatment-main').textContent = treatmentMain.toFixed(1);
    document.getElementById('treatment-secondary').textContent = treatmentSecondary.toFixed(1);
    document.getElementById('treatment-count').textContent = treatmentData.length;
    document.getElementById('main-improvement').textContent = mainImprovement;
    document.getElementById('secondary-variation').textContent = secondaryVariation;
    document.getElementById('effectiveness').textContent = effectiveness;
}

function calculateAverageOdor(data) {
    if (data.length === 0) return 0;
    
    const odorValues = data.map(item => {
        const odorResponse = item.respostas.find(r => 
            r.pergunta && r.pergunta.toLowerCase().includes('odor')
        );
        if (odorResponse) {
            const intensityMap = { 'Nenhum': 0, 'Fraco': 1, 'Médio': 2, 'Forte': 3 };
            return intensityMap[odorResponse.resposta] || 0;
        }
        return 0;
    });
    
    return odorValues.reduce((a, b) => a + b, 0) / odorValues.length;
}

function calculateAverageWind(data) {
    if (data.length === 0) return 0;
    
    const windValues = data.map(item => {
        const windResponse = item.respostas.find(r => 
            r.pergunta && r.pergunta.toLowerCase().includes('vento')
        );
        if (windResponse) {
            // Mapear direções para valores numéricos
            const directionMap = { 
                'Norte': 1, 'Norte-Sul': 1.5, 'Sul': 2, 
                'Leste': 3, 'Oeste': 4, 'Nordeste': 1.25,
                'Noroeste': 1.75, 'Sudeste': 2.25, 'Sudoeste': 2.75
            };
            return directionMap[windResponse.resposta] || 0;
        }
        return 0;
    });
    
    return windValues.reduce((a, b) => a + b, 0) / windValues.length;
}

// Funções de navegação
function changeProject() {
    window.location.href = 'project-selector.html';
}

async function logout() {
    try {
        const response = await fetch(`${AUTH_API_BASE}/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            localStorage.removeItem('selectedProject');
            window.location.href = 'login.html';
        } else {
            alert('Erro ao fazer logout');
        }
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        localStorage.removeItem('selectedProject');
        window.location.href = 'login.html';
    }
}

// Funções de UI
function showLoading(show) {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.style.display = show ? 'block' : 'none';
}

function showMessage(message, type) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.innerHTML = `<div class="status-message status-${type}">${message}</div>`;
    
    setTimeout(() => {
        statusDiv.innerHTML = '';
    }, 5000);
}

function showSuccess(message) {
    showMessage(message, 'success');
}

function showError(message) {
    showMessage(message, 'error');
}

function showInfo(message) {
    showMessage(message, 'info');
}

