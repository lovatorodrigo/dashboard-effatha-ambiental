# Dashboard Effatha Ambiental - Versão Multiprojetos

## 🌱 Visão Geral

O Dashboard Effatha Ambiental é uma solução completa para monitoramento e análise de dados ambientais, desenvolvida especificamente para gerenciar múltiplos projetos com controle de acesso granular por usuário.

## ✨ Funcionalidades Principais

### 🔐 Sistema de Autenticação
- **Login seguro** com senhas criptografadas
- **Controle de sessão** persistente
- **Múltiplos níveis de permissão** (Admin, Analista, Visualizador)
- **Logout automático** por inatividade

### 🏢 Gerenciamento de Múltiplos Projetos
- **Seleção de projetos** com interface intuitiva
- **Controle de acesso** por usuário e projeto
- **Configurações personalizadas** por projeto
- **Temas visuais** específicos por projeto

### 📊 Visualizações de Dados Avançadas
- **5 tipos de gráficos** implementados:
  - **Gráfico de Linha**: Evolução temporal
  - **Gráfico de Barras**: Análise por localização
  - **Gráfico de Pizza**: Distribuição de categorias
  - **Gráfico Candlestick**: Variações diárias
  - **Gráfico de Gantt**: Timeline das coletas

### 📁 Upload Dinâmico de Dados
- **Drag & Drop** de arquivos JSON
- **Validação automática** da estrutura dos dados
- **Processamento em tempo real**
- **Feedback visual** do progresso

### 📅 Configuração de Períodos
- **Períodos personalizáveis** (Baseline vs Tratamento)
- **Validação de datas** inteligente
- **Comparação automática** entre períodos
- **Métricas de eficácia** calculadas

### 🎨 Design Responsivo
- **Grade CSS de 12 colunas**
- **Largura total (100vw)** sem margens laterais
- **Adaptação automática** para dispositivos móveis
- **Temas personalizados** por projeto

## 🚀 Como Usar

### 1. Inicialização do Sistema

```bash
# 1. Navegar para o diretório do projeto
cd /home/ubuntu/effatha_ambiental

# 2. Ativar ambiente virtual do Flask
cd auth_server
source venv/bin/activate

# 3. Iniciar servidor de autenticação
python src/main.py &

# 4. Iniciar servidor web (em outro terminal)
cd ..
python3 -m http.server 8000
```

### 2. Acesso ao Sistema

1. **Abrir navegador** em `http://localhost:8000/login.html`
2. **Fazer login** com uma das credenciais disponíveis
3. **Selecionar projeto** na tela de seleção
4. **Usar dashboard** com todas as funcionalidades

## 👥 Usuários de Demonstração

### Super Administrador
- **admin** / admin123 (Acesso a todos os projetos)

### Projeto ProVaso
- **provaso** / provaso2025 (Administrador)
- **analista** / analise123 (Analista)

### Projeto Industrial ABC
- **industrial_admin** / industrial123 (Administrador)
- **industrial_analista** / industrial456 (Analista)

### Projeto Urbano XYZ
- **urbano_admin** / urbano123 (Administrador)
- **urbano_analista** / urbano456 (Analista)

### Múltiplos Projetos
- **supervisor** / supervisor123 (Analista em ProVaso e Industrial ABC)

## 📁 Estrutura do Projeto

```
effatha_ambiental/
├── auth_server/                 # Servidor Flask de autenticação
│   ├── src/
│   │   ├── models/             # Modelos de dados
│   │   │   ├── user.py         # Modelo de usuário
│   │   │   └── project.py      # Modelos de projeto e medições
│   │   ├── routes/             # Rotas da API
│   │   │   ├── auth.py         # Autenticação
│   │   │   ├── user.py         # Usuários
│   │   │   └── projects.py     # Projetos
│   │   ├── main.py             # Aplicação principal
│   │   └── init_data.py        # Inicialização de dados
│   └── venv/                   # Ambiente virtual Python
├── login.html                  # Página de login
├── project-selector.html       # Seleção de projetos
├── dashboard-multiprojetos.html # Dashboard principal
├── dashboard-multiprojetos.js  # JavaScript do dashboard
├── data.json                   # Dados de exemplo (ProVaso)
└── README_FINAL.md            # Esta documentação
```

## 🔧 Configuração de Projetos

### Adicionando Novo Projeto

1. **Editar** `auth_server/src/init_data.py`
2. **Adicionar** configuração do projeto:

```python
{
    'id': 'novo_projeto',
    'name': 'Nome do Projeto',
    'description': 'Descrição do projeto',
    'client': 'Nome do Cliente',
    'settings': {
        'theme_color': '#FF5722',
        'measurement_types': ['tipo1', 'tipo2'],
        'locations': ['Local 1', 'Local 2'],
        'period_config': {
            'baseline_start': '2025-01-01',
            'baseline_end': '2025-01-15',
            'treatment_start': '2025-01-16',
            'treatment_end': '2025-01-31'
        }
    }
}
```

3. **Adicionar** permissões de usuário
4. **Reinicializar** dados com `python src/init_data.py`

### Configurando Usuários

```python
# Adicionar em user_permissions
{'user_id': 'novo_usuario', 'project_id': 'novo_projeto', 'permission': 'admin'}
```

## 📊 Formato dos Dados

### Estrutura do Arquivo JSON

```json
[
  {
    "data_hora": "2025-07-18T08:00:00Z",
    "ponto": "Local de Medição",
    "respostas": [
      {
        "pergunta": "Intensidade do Odor",
        "resposta": "Médio"
      },
      {
        "pergunta": "Direção do Vento",
        "resposta": "Norte"
      }
    ],
    "coordinates": {
      "latitude": -23.5505,
      "longitude": -46.6333
    },
    "metadata": {
      "temperature": 25,
      "humidity": 60
    }
  }
]
```

## 🎯 Funcionalidades por Tipo de Usuário

### Administrador
- ✅ **Upload** de dados
- ✅ **Configuração** de períodos
- ✅ **Visualização** completa
- ✅ **Exportação** de relatórios
- ✅ **Gerenciamento** de usuários

### Analista
- ✅ **Visualização** completa
- ✅ **Filtros** e análises
- ✅ **Exportação** de dados
- ❌ Upload de dados
- ❌ Configuração de períodos

### Visualizador
- ✅ **Visualização** básica
- ✅ **Filtros** limitados
- ❌ Upload de dados
- ❌ Configuração de períodos
- ❌ Exportação de dados

## 🔍 Análises Disponíveis

### Métricas Principais
- **Total de medições** por projeto
- **Pontos monitorados** únicos
- **Período de análise** ativo
- **Métrica principal** do projeto

### Comparações
- **Baseline vs Tratamento**
- **Variação percentual** entre períodos
- **Eficácia do tratamento**
- **Tendências temporais**

### Filtros
- **Por período** (Baseline, Tratamento, Todos)
- **Por localização** (Todos os pontos, Específico)
- **Por data** (Intervalo personalizado)

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5** + **CSS3** + **JavaScript ES6**
- **Chart.js** para gráficos básicos
- **Plotly.js** para gráficos avançados
- **Design responsivo** com CSS Grid

### Backend
- **Flask** (Python 3.11)
- **SQLAlchemy** para ORM
- **SQLite** para banco de dados
- **Flask-CORS** para integração frontend

### Segurança
- **Werkzeug** para hash de senhas
- **Sessões seguras** com Flask
- **Validação** de entrada de dados
- **Controle de acesso** baseado em roles

## 📈 Roadmap Futuro

### Versão 2.1
- [ ] **Notificações** em tempo real
- [ ] **Relatórios** automatizados
- [ ] **API REST** completa
- [ ] **Integração** com sensores IoT

### Versão 2.2
- [ ] **Dashboard mobile** nativo
- [ ] **Machine Learning** para predições
- [ ] **Alertas** automáticos
- [ ] **Integração** com sistemas externos

## 🐛 Solução de Problemas

### Erro de Conexão com Backend
```bash
# Verificar se o Flask está rodando
curl http://localhost:5000/api/auth/check-auth

# Reiniciar servidor se necessário
cd auth_server
source venv/bin/activate
python src/main.py
```

### Problemas de Login
1. **Verificar credenciais** na documentação
2. **Limpar cookies** do navegador
3. **Verificar console** do navegador para erros

### Dados não Carregam
1. **Verificar formato** do arquivo JSON
2. **Validar estrutura** dos dados
3. **Verificar permissões** do usuário

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o sistema:

- **Documentação**: Este arquivo README
- **Logs**: Verificar console do navegador e logs do Flask
- **Configuração**: Arquivos em `auth_server/src/`

## 📄 Licença

© 2025 Effatha Ambiental - Todos os direitos reservados

---

**Dashboard Effatha Ambiental** - Monitoramento e Análise Ambiental Profissional

