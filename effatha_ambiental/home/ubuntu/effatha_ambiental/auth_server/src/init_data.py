"""
Script para inicializar dados de demonstração
Cria projetos e usuários de exemplo para a Effatha Ambiental
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.models.user import db
from src.models.project import Project, UserProject, Measurement
from datetime import datetime, timedelta
import json

def init_demo_data(app):
    """Inicializa dados de demonstração"""
    with app.app_context():
        # Criar todas as tabelas
        db.create_all()
        
        # Limpar dados existentes (apenas para demo)
        try:
            Measurement.query.delete()
            UserProject.query.delete()
            Project.query.delete()
            db.session.commit()
        except:
            # Se as tabelas não existem, apenas continue
            pass
        
        # Criar projetos de demonstração
        projects_data = [
            {
                'id': 'provaso',
                'name': 'Projeto ProVaso',
                'description': 'Monitoramento ambiental de odores na região ProVaso',
                'client': 'ProVaso Indústria Ltda',
                'settings': {
                    'theme_color': '#2E7D32',
                    'measurement_types': ['odor', 'wind', 'temperature'],
                    'locations': ['Provaso entrada', 'Barrichelo', 'Laranja madura', 'Galpão', 'Rosa'],
                    'period_config': {
                        'baseline_start': '2025-07-18',
                        'baseline_end': '2025-07-20',
                        'treatment_start': '2025-07-21',
                        'treatment_end': '2025-07-22'
                    }
                }
            },
            {
                'id': 'industrial_abc',
                'name': 'Projeto Industrial ABC',
                'description': 'Monitoramento de emissões atmosféricas',
                'client': 'Indústria ABC S.A.',
                'settings': {
                    'theme_color': '#1976D2',
                    'measurement_types': ['emissions', 'air_quality', 'noise'],
                    'locations': ['Chaminé Principal', 'Área de Produção', 'Limite Norte', 'Limite Sul'],
                    'period_config': {
                        'baseline_start': '2025-06-01',
                        'baseline_end': '2025-06-15',
                        'treatment_start': '2025-06-16',
                        'treatment_end': '2025-06-30'
                    }
                }
            },
            {
                'id': 'urbano_xyz',
                'name': 'Monitoramento Urbano XYZ',
                'description': 'Avaliação da qualidade do ar urbano',
                'client': 'Prefeitura Municipal XYZ',
                'settings': {
                    'theme_color': '#FF9800',
                    'measurement_types': ['air_quality', 'noise', 'traffic'],
                    'locations': ['Centro', 'Zona Industrial', 'Zona Residencial', 'Parque Central'],
                    'period_config': {
                        'baseline_start': '2025-05-01',
                        'baseline_end': '2025-05-31',
                        'treatment_start': '2025-06-01',
                        'treatment_end': '2025-06-30'
                    }
                }
            }
        ]
        
        # Criar projetos
        for project_data in projects_data:
            project = Project(
                id=project_data['id'],
                name=project_data['name'],
                description=project_data['description'],
                client=project_data['client'],
                settings=project_data['settings']
            )
            db.session.add(project)
        
        # Definir usuários e suas permissões por projeto
        user_permissions = [
            # Super Admin - acesso a todos os projetos
            {'user_id': 'admin', 'project_id': 'provaso', 'permission': 'admin'},
            {'user_id': 'admin', 'project_id': 'industrial_abc', 'permission': 'admin'},
            {'user_id': 'admin', 'project_id': 'urbano_xyz', 'permission': 'admin'},
            
            # Usuários específicos do ProVaso
            {'user_id': 'provaso', 'project_id': 'provaso', 'permission': 'admin'},
            {'user_id': 'analista', 'project_id': 'provaso', 'permission': 'analista'},
            
            # Usuários específicos do Industrial ABC
            {'user_id': 'industrial_admin', 'project_id': 'industrial_abc', 'permission': 'admin'},
            {'user_id': 'industrial_analista', 'project_id': 'industrial_abc', 'permission': 'analista'},
            
            # Usuários específicos do Urbano XYZ
            {'user_id': 'urbano_admin', 'project_id': 'urbano_xyz', 'permission': 'admin'},
            {'user_id': 'urbano_analista', 'project_id': 'urbano_xyz', 'permission': 'analista'},
            
            # Usuário com acesso a múltiplos projetos
            {'user_id': 'supervisor', 'project_id': 'provaso', 'permission': 'analista'},
            {'user_id': 'supervisor', 'project_id': 'industrial_abc', 'permission': 'analista'},
        ]
        
        # Criar permissões de usuários
        for perm in user_permissions:
            user_project = UserProject(
                user_id=perm['user_id'],
                project_id=perm['project_id'],
                permission_level=perm['permission']
            )
            db.session.add(user_project)
        
        # Carregar dados de medição do ProVaso (dados existentes)
        try:
            with open('/home/ubuntu/dashboard-provaso/data.json', 'r', encoding='utf-8') as f:
                provaso_data = json.load(f)
                
                for item in provaso_data:
                    # Converter data
                    try:
                        data_hora = datetime.fromisoformat(item['data_hora'].replace('Z', '+00:00'))
                    except:
                        continue
                    
                    measurement = Measurement(
                        project_id='provaso',
                        data_hora=data_hora,
                        ponto=item.get('ponto', 'Desconhecido'),
                        respostas=item.get('respostas', []),
                        coordinates=item.get('coordinates'),
                        metadata=item.get('metadata'),
                        uploaded_by='admin'
                    )
                    db.session.add(measurement)
        except Exception as e:
            print(f"Erro ao carregar dados do ProVaso: {e}")
        
        # Criar dados de exemplo para outros projetos
        create_sample_measurements()
        
        # Commit todas as mudanças
        db.session.commit()
        print("Dados de demonstração inicializados com sucesso!")
        print("\nProjetos criados:")
        for project_data in projects_data:
            print(f"- {project_data['name']} (ID: {project_data['id']})")
        
        print("\nUsuários e permissões:")
        print("- admin: Acesso a todos os projetos (admin)")
        print("- provaso: Projeto ProVaso (admin)")
        print("- analista: Projeto ProVaso (analista)")
        print("- industrial_admin: Projeto Industrial ABC (admin)")
        print("- industrial_analista: Projeto Industrial ABC (analista)")
        print("- urbano_admin: Projeto Urbano XYZ (admin)")
        print("- urbano_analista: Projeto Urbano XYZ (analista)")
        print("- supervisor: ProVaso e Industrial ABC (analista)")

def create_sample_measurements():
    """Cria medições de exemplo para projetos de demonstração"""
    
    # Dados para Industrial ABC
    base_date = datetime(2025, 6, 1)
    for i in range(30):
        date = base_date + timedelta(days=i)
        for location in ['Chaminé Principal', 'Área de Produção', 'Limite Norte', 'Limite Sul']:
            measurement = Measurement(
                project_id='industrial_abc',
                data_hora=date + timedelta(hours=8 + (i % 12)),
                ponto=location,
                respostas=[
                    {'pergunta': 'Nível de Emissão', 'resposta': ['Baixo', 'Médio', 'Alto'][i % 3]},
                    {'pergunta': 'Qualidade do Ar', 'resposta': ['Boa', 'Regular', 'Ruim'][i % 3]},
                    {'pergunta': 'Nível de Ruído', 'resposta': f'{40 + (i % 20)} dB'}
                ],
                metadata={'temperature': 20 + (i % 15), 'humidity': 50 + (i % 30)},
                uploaded_by='industrial_admin'
            )
            db.session.add(measurement)
    
    # Dados para Urbano XYZ
    base_date = datetime(2025, 5, 1)
    for i in range(60):
        date = base_date + timedelta(days=i)
        for location in ['Centro', 'Zona Industrial', 'Zona Residencial', 'Parque Central']:
            measurement = Measurement(
                project_id='urbano_xyz',
                data_hora=date + timedelta(hours=6 + (i % 16)),
                ponto=location,
                respostas=[
                    {'pergunta': 'Índice de Qualidade do Ar', 'resposta': f'{50 + (i % 100)}'},
                    {'pergunta': 'Nível de Ruído', 'resposta': f'{35 + (i % 25)} dB'},
                    {'pergunta': 'Fluxo de Tráfego', 'resposta': ['Baixo', 'Médio', 'Alto', 'Intenso'][i % 4]}
                ],
                metadata={'weather': ['Ensolarado', 'Nublado', 'Chuvoso'][i % 3]},
                uploaded_by='urbano_admin'
            )
            db.session.add(measurement)

if __name__ == '__main__':
    # Importar app para executar standalone
    from main import app
    init_demo_data(app)

