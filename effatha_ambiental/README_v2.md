# Dashboard ProVaso v2.0 - Versão Aprimorada

## 🎉 Novas Funcionalidades Implementadas

### ✅ 1. Upload Dinâmico de Arquivos JSON
**Funcionalidade**: Permite carregar novos arquivos respostas.json sempre que necessário

**Como usar**:
- Arraste e solte o arquivo JSON na área de upload
- Ou clique em "Selecionar Arquivo" para escolher o arquivo
- O sistema valida automaticamente o formato e estrutura
- Dados são processados e gráficos atualizados em tempo real

**Benefícios**:
- Flexibilidade total para analisar diferentes projetos
- Não dependência de arquivos fixos
- Validação robusta de dados
- Feedback visual durante o processamento

### ✅ 2. Configuração de Períodos Personalizados
**Funcionalidade**: Permite definir intervalos de datas customizados para comparação baseline vs tratamento

**Como usar**:
- Configure as datas de início e fim do período baseline
- Configure as datas de início e fim do período tratamento
- Clique em "Aplicar Configuração"
- Sistema valida as datas e recalcula automaticamente as métricas

**Validações**:
- Data de fim deve ser posterior ao início
- Período de tratamento deve começar após o baseline
- Feedback de erro para configurações inválidas

**Benefícios**:
- Análises mais precisas e flexíveis
- Adaptação a diferentes cronogramas de projeto
- Comparações personalizadas
- Persistência das configurações

### ✅ 3. Sistema de Login e Autenticação
**Funcionalidade**: Controle de acesso com login e senha para usuários autorizados

**Credenciais de Demonstração**:
- **admin** / admin123
- **provaso** / provaso2025
- **analista** / analise123

**Como usar**:
1. Acesse `login.html` primeiro
2. Insira suas credenciais
3. Sistema valida e cria sessão segura
4. Redirecionamento automático para dashboard protegido
5. Botão "Sair" no header para logout

**Segurança**:
- Senhas criptografadas com hash
- Gerenciamento de sessões
- Proteção automática das páginas
- Redirecionamento para login se não autenticado

## 📁 Estrutura de Arquivos

### Versões do Dashboard
- `final.html` - Dashboard original (sem autenticação)
- `dashboard_v2.html` - Dashboard com upload e períodos (sem autenticação)
- `auth_dashboard.html` - Dashboard completo com autenticação
- `login.html` - Página de login

### Backend de Autenticação
- `auth_server/` - Aplicação Flask para autenticação
  - `src/main.py` - Servidor principal
  - `src/routes/auth.py` - Rotas de autenticação
  - `src/models/user.py` - Modelos de usuário

### Scripts e Estilos
- `dashboard_v2.js` - JavaScript com todas as funcionalidades
- Estilos CSS integrados nos arquivos HTML

### Dados e Documentação
- `data.json` - Dados padrão do projeto
- `README_v2.md` - Esta documentação
- `requisitos_melhorias.md` - Análise de requisitos

## 🚀 Como Executar

### 1. Servidor de Autenticação (Flask)
```bash
# Navegar para o diretório do servidor
cd auth_server

# Ativar ambiente virtual
source venv/bin/activate

# Instalar dependências (se necessário)
pip install flask-cors

# Iniciar servidor Flask
python src/main.py
```
O servidor Flask rodará em `http://localhost:5000`

### 2. Servidor Web (Dashboard)
```bash
# Em outro terminal, navegar para o diretório principal
cd effatha_ambiental

# Iniciar servidor HTTP
python3 -m http.server 8000
```
O dashboard estará disponível em `http://localhost:8000`

### 3. Acessar o Sistema
1. **Com Autenticação**: `http://localhost:8000/login.html`
2. **Sem Autenticação**: `http://localhost:8000/dashboard_v2.html`
3. **Versão Original**: `http://localhost:8000/final.html`

## 🔧 Funcionalidades Técnicas

### Upload de Arquivos
- Suporte a drag & drop
- Validação de formato JSON/JSONL
- Processamento assíncrono
- Feedback visual de progresso
- Tratamento de erros robusto

### Configuração de Períodos
- Interface intuitiva com campos de data
- Validação de lógica temporal
- Recálculo automático de métricas
- Atualização dinâmica dos títulos das seções

### Sistema de Autenticação
- Backend Flask com CORS configurado
- Hash seguro de senhas (Werkzeug)
- Gerenciamento de sessões
- Proteção automática de rotas
- Logout seguro

### Responsividade
- Mantém todas as características responsivas originais
- Adaptação para mobile e tablet
- Grid system de 12 colunas
- Breakpoints otimizados

## 📊 Tipos de Gráficos Mantidos

Todos os 5 tipos de gráficos solicitados originalmente foram mantidos:

1. **Gráfico de Linha**: Evolução temporal da intensidade do odor
2. **Gráfico de Barras**: Intensidade de odor por local
3. **Gráfico de Pizza**: Distribuição das direções do vento
4. **Gráfico Candlestick**: Variações diárias dos dados
5. **Gráfico de Gantt**: Timeline das coletas por ponto

## 🎯 Melhorias de UX/UI

### Interface de Upload
- Área de drag & drop visualmente atrativa
- Animações suaves de hover
- Feedback imediato de status
- Mensagens de erro claras

### Configuração de Períodos
- Layout organizado em grid
- Campos de data nativos do HTML5
- Validação em tempo real
- Botão de aplicação destacado

### Sistema de Login
- Design moderno e limpo
- Gradiente temático
- Credenciais de demonstração visíveis
- Animações de carregamento

### Dashboard Protegido
- Header com informações do usuário
- Botão de logout acessível
- Todas as funcionalidades integradas
- Experiência fluida

## 🔒 Segurança

### Autenticação
- Senhas nunca armazenadas em texto plano
- Hash seguro com salt automático
- Sessões com tokens únicos
- Timeout automático de sessão

### Validação de Dados
- Sanitização de inputs
- Validação de tipos de arquivo
- Verificação de estrutura JSON
- Tratamento de erros seguro

### CORS e Comunicação
- Configuração CORS adequada
- Comunicação segura entre frontend e backend
- Credenciais incluídas nas requisições
- Proteção contra ataques comuns

## 📈 Métricas e Análises

### KPIs Dinâmicos
- Total de medições (atualizado conforme filtros)
- Pontos monitorados (baseado nos dados carregados)
- Período de análise (calculado automaticamente)
- Odor médio (recalculado em tempo real)

### Comparação Baseline vs Tratamento
- Cálculos automáticos baseados nos períodos configurados
- Percentuais de melhoria
- Métricas de eficácia
- Visualização clara das diferenças

### Filtros Interativos
- Por período (Todos, Baseline, Tratamento)
- Por localização (dinâmico baseado nos dados)
- Atualização automática de todos os gráficos
- Sincronização entre filtros e dados

## 🚀 Próximos Passos Sugeridos

### Melhorias Futuras
1. **Banco de Dados**: Migrar de usuários hardcoded para banco de dados
2. **Múltiplos Projetos**: Suporte a múltiplos projetos simultâneos
3. **Exportação**: Funcionalidade de exportar relatórios em PDF
4. **Notificações**: Sistema de alertas para valores críticos
5. **API REST**: Endpoints para integração com outros sistemas

### Deployment
1. **Produção**: Deploy em servidor cloud (AWS, Azure, GCP)
2. **HTTPS**: Certificado SSL para segurança
3. **Domínio**: Configuração de domínio personalizado
4. **Backup**: Sistema de backup automático dos dados

## 📞 Suporte

Para dúvidas, melhorias ou problemas:
1. Consulte esta documentação
2. Verifique os logs do console do navegador
3. Confirme se ambos os servidores estão rodando
4. Teste com as credenciais de demonstração fornecidas

---

**Dashboard ProVaso v2.0** - Análise de Monitoramento Ambiental com Funcionalidades Avançadas

