# Dashboard ProVaso - Análise de Monitoramento Ambiental

## Descrição

Dashboard web responsivo e interativo para análise de dados de monitoramento ambiental do Projeto ProVaso. O sistema permite visualizar e comparar dados entre períodos baseline e tratamento através de múltiplos tipos de gráficos.

## Características

### ✅ Tipos de Gráficos Implementados
- **Gráfico de Linha**: Evolução temporal da intensidade do odor
- **Gráfico de Barras**: Intensidade de odor por local de medição
- **Gráfico de Pizza**: Distribuição das direções do vento
- **Gráfico Candlestick**: Variações diárias dos dados
- **Gráfico de Gantt**: Timeline das coletas por ponto

### 🎨 Design e Layout
- **Responsivo**: Grade CSS de 12 colunas adaptável
- **Largura Total**: 100vw sem margens laterais
- **Tema Visual**: Cores ambientais (verde) refletindo o projeto
- **Tipografia**: Roboto e Roboto Slab para consistência

### 📊 Funcionalidades
- **KPIs**: Métricas principais em cards destacados
- **Filtros**: Por período (Baseline/Tratamento) e localização
- **Comparação**: Análise lado a lado dos períodos
- **Interatividade**: Hover effects e animações suaves

## Estrutura dos Dados

### Fonte
- Arquivo JSON com dados do chatbot (formato JSONL)
- 20 medições em 5 pontos diferentes
- Período: 18/07/2025 a 22/07/2025

### Campos Analisados
- **Intensidade do Odor**: Nenhum, Fraco, Médio, Forte
- **Intensidade do Vento**: Nenhum, Fraco, Médio, Forte  
- **Direção do Vento**: Norte-Sul, Sul-Norte, Leste-Oeste, Oeste-Leste
- **Clima**: Condições meteorológicas
- **Localização**: Coordenadas GPS dos pontos

### Pontos de Medição
1. Provaso entrada
2. Barrichelo
3. Laranja madura
4. Galpão
5. Rosa

## Análise Baseline vs Tratamento

### Períodos Definidos
- **Baseline**: 18-19/07/2025 (diagnóstico inicial)
- **Tratamento**: 21-22/07/2025 (após intervenção)

### Resultados Principais
- **Redução do Odor**: 50% de melhoria
- **Variação do Vento**: -55.6% na intensidade
- **Eficácia**: Resultado positivo do tratamento

## Arquivos do Projeto

### Principais
- `final.html` - Dashboard completo e funcional
- `styles.css` - Estilos CSS responsivos
- `data.json` - Dados originais do projeto
- `README.md` - Esta documentação

### Desenvolvimento
- `index.html` - Versão inicial
- `index_v2.html` - Versão intermediária
- `script.js` - JavaScript com processamento de dados
- `debug.html` - Página de testes

### Análise
- `analise_dados.md` - Análise detalhada dos dados
- `design_plan.md` - Planejamento do design

## Tecnologias Utilizadas

### Frontend
- **HTML5**: Estrutura semântica
- **CSS3**: Grid Layout, Flexbox, Animações
- **JavaScript**: Processamento de dados e interatividade

### Bibliotecas
- **Chart.js**: Gráficos de linha, barras e pizza
- **Plotly.js**: Gráficos candlestick e Gantt
- **Google Fonts**: Tipografia Roboto

## Como Usar

### 1. Servidor Local
```bash
# Navegar para o diretório
cd dashboard-provaso

# Iniciar servidor HTTP
python3 -m http.server 8000

# Acessar no navegador
http://localhost:8000/final.html
```

### 2. Funcionalidades
- **Filtros**: Use os seletores no topo para filtrar dados
- **Navegação**: Role a página para ver todos os gráficos
- **Responsividade**: Teste em diferentes tamanhos de tela
- **Interação**: Passe o mouse sobre os gráficos para detalhes

## Responsividade

### Breakpoints
- **Desktop**: > 1024px (layout completo)
- **Tablet**: 768px - 1024px (adaptação de colunas)
- **Mobile**: < 768px (layout em coluna única)

### Adaptações Mobile
- Filtros em layout vertical
- Gráficos em altura reduzida
- Cards em coluna única
- Tipografia ajustada

## Insights dos Dados

### Principais Descobertas
1. **Melhoria Significativa**: 50% de redução na intensidade do odor
2. **Eficácia do Tratamento**: Resultados positivos mensuráveis
3. **Padrões de Vento**: Predominância Norte-Sul e Leste-Oeste
4. **Localização Crítica**: Provaso entrada com maior incidência

### Recomendações
- Continuar monitoramento no ponto Provaso entrada
- Manter protocolo de tratamento implementado
- Expandir coleta para outros períodos
- Incluir mais variáveis ambientais

## Suporte

Para dúvidas ou melhorias, consulte a documentação técnica nos arquivos de análise incluídos no projeto.

