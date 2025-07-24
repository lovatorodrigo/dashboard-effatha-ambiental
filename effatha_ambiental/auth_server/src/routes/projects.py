from flask import Blueprint, request, jsonify, session
from datetime import datetime
from src.models.project import Project, UserProject, Measurement, db
import json

projects_bp = Blueprint('projects', __name__)

def require_auth():
    """Decorator para verificar autenticação"""
    if not session.get('authenticated') or not session.get('user_id'):
        return jsonify({'error': 'Não autenticado'}), 401
    return None

def get_user_projects(user_id, permission_level=None):
    """Retorna projetos do usuário com nível de permissão específico"""
    query = UserProject.query.filter_by(user_id=user_id)
    if permission_level:
        query = query.filter_by(permission_level=permission_level)
    return query.all()

def has_project_permission(user_id, project_id, required_permissions=None):
    """Verifica se usuário tem permissão no projeto"""
    if required_permissions is None:
        required_permissions = ['admin', 'analista', 'visualizador']
    
    user_project = UserProject.query.filter_by(
        user_id=user_id, 
        project_id=project_id
    ).first()
    
    if not user_project:
        return False
    
    return user_project.permission_level in required_permissions

@projects_bp.route('/list', methods=['GET'])
def list_projects():
    """Lista projetos do usuário autenticado"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        user_id = session.get('user_id')
        user_projects = get_user_projects(user_id)
        
        projects_data = []
        for up in user_projects:
            project_dict = up.project.to_dict()
            project_dict['permission_level'] = up.permission_level
            project_dict['granted_at'] = up.granted_at.isoformat() if up.granted_at else None
            projects_data.append(project_dict)
        
        return jsonify({
            'projects': projects_data,
            'total': len(projects_data),
            'user_id': user_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@projects_bp.route('/create', methods=['POST'])
def create_project():
    """Cria um novo projeto (apenas super admin)"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        user_id = session.get('user_id')
        
        # Verificar se é super admin
        if user_id != 'admin':
            return jsonify({'error': 'Permissão insuficiente'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        project_id = data.get('id', '').strip()
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        client = data.get('client', '').strip()
        settings = data.get('settings', {})
        
        if not project_id or not name:
            return jsonify({'error': 'ID e nome do projeto são obrigatórios'}), 400
        
        # Verificar se projeto já existe
        existing_project = Project.query.filter_by(id=project_id).first()
        if existing_project:
            return jsonify({'error': 'Projeto com este ID já existe'}), 400
        
        # Criar projeto
        project = Project(
            id=project_id,
            name=name,
            description=description,
            client=client,
            settings=settings
        )
        
        db.session.add(project)
        
        # Adicionar admin como usuário do projeto
        user_project = UserProject(
            user_id=user_id,
            project_id=project_id,
            permission_level='admin'
        )
        
        db.session.add(user_project)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Projeto criado com sucesso',
            'project': project.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@projects_bp.route('/<project_id>', methods=['GET'])
def get_project(project_id):
    """Obtém detalhes de um projeto específico"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        user_id = session.get('user_id')
        
        # Verificar permissão
        if not has_project_permission(user_id, project_id):
            return jsonify({'error': 'Acesso negado ao projeto'}), 403
        
        project = Project.query.filter_by(id=project_id).first()
        if not project:
            return jsonify({'error': 'Projeto não encontrado'}), 404
        
        # Obter permissão do usuário
        user_project = UserProject.query.filter_by(
            user_id=user_id, 
            project_id=project_id
        ).first()
        
        project_data = project.to_dict()
        project_data['user_permission'] = user_project.permission_level if user_project else None
        
        return jsonify({
            'project': project_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@projects_bp.route('/<project_id>/data', methods=['GET'])
def get_project_data(project_id):
    """Obtém dados de medição de um projeto"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        user_id = session.get('user_id')
        
        # Verificar permissão
        if not has_project_permission(user_id, project_id):
            return jsonify({'error': 'Acesso negado ao projeto'}), 403
        
        # Parâmetros de filtro
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        ponto = request.args.get('ponto')
        
        # Query base
        query = Measurement.query.filter_by(project_id=project_id)
        
        # Aplicar filtros
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date)
                query = query.filter(Measurement.data_hora >= start_dt)
            except:
                pass
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date)
                query = query.filter(Measurement.data_hora <= end_dt)
            except:
                pass
        
        if ponto:
            query = query.filter(Measurement.ponto == ponto)
        
        # Ordenar por data
        measurements = query.order_by(Measurement.data_hora).all()
        
        # Converter para formato compatível com o frontend
        data = []
        for measurement in measurements:
            data.append({
                'data_hora': measurement.data_hora.isoformat(),
                'ponto': measurement.ponto,
                'respostas': measurement.get_respostas(),
                'coordinates': measurement.get_coordinates(),
                'metadata': measurement.get_metadata()
            })
        
        return jsonify({
            'data': data,
            'total': len(data),
            'project_id': project_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@projects_bp.route('/<project_id>/upload', methods=['POST'])
def upload_project_data(project_id):
    """Upload de dados para um projeto específico"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        user_id = session.get('user_id')
        
        # Verificar permissão (admin ou analista)
        if not has_project_permission(user_id, project_id, ['admin', 'analista']):
            return jsonify({'error': 'Permissão insuficiente para upload'}), 403
        
        # Verificar se projeto existe
        project = Project.query.filter_by(id=project_id).first()
        if not project:
            return jsonify({'error': 'Projeto não encontrado'}), 404
        
        data = request.get_json()
        if not data or 'measurements' not in data:
            return jsonify({'error': 'Dados de medição não fornecidos'}), 400
        
        measurements_data = data['measurements']
        if not isinstance(measurements_data, list):
            return jsonify({'error': 'Dados devem ser uma lista de medições'}), 400
        
        # Processar e salvar medições
        saved_count = 0
        errors = []
        
        for i, measurement_data in enumerate(measurements_data):
            try:
                # Validar campos obrigatórios
                if 'data_hora' not in measurement_data or 'ponto' not in measurement_data:
                    errors.append(f'Medição {i+1}: campos obrigatórios ausentes')
                    continue
                
                # Converter data
                try:
                    data_hora = datetime.fromisoformat(measurement_data['data_hora'].replace('Z', '+00:00'))
                except:
                    errors.append(f'Medição {i+1}: formato de data inválido')
                    continue
                
                # Criar medição
                measurement = Measurement(
                    project_id=project_id,
                    data_hora=data_hora,
                    ponto=measurement_data['ponto'],
                    respostas=measurement_data.get('respostas', []),
                    coordinates=measurement_data.get('coordinates'),
                    metadata=measurement_data.get('metadata'),
                    uploaded_by=user_id
                )
                
                db.session.add(measurement)
                saved_count += 1
                
            except Exception as e:
                errors.append(f'Medição {i+1}: {str(e)}')
        
        # Commit se houver dados válidos
        if saved_count > 0:
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'{saved_count} medições salvas com sucesso',
            'saved_count': saved_count,
            'total_count': len(measurements_data),
            'errors': errors
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@projects_bp.route('/<project_id>/config', methods=['GET', 'POST'])
def project_config(project_id):
    """Obtém ou atualiza configurações do projeto"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        user_id = session.get('user_id')
        
        # Verificar permissão
        required_permissions = ['admin', 'analista'] if request.method == 'POST' else ['admin', 'analista', 'visualizador']
        if not has_project_permission(user_id, project_id, required_permissions):
            return jsonify({'error': 'Permissão insuficiente'}), 403
        
        project = Project.query.filter_by(id=project_id).first()
        if not project:
            return jsonify({'error': 'Projeto não encontrado'}), 404
        
        if request.method == 'GET':
            return jsonify({
                'config': project.get_settings()
            }), 200
        
        else:  # POST
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Configurações não fornecidas'}), 400
            
            # Atualizar configurações
            current_settings = project.get_settings()
            current_settings.update(data)
            project.set_settings(current_settings)
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Configurações atualizadas com sucesso',
                'config': project.get_settings()
            }), 200
        
    except Exception as e:
        if request.method == 'POST':
            db.session.rollback()
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@projects_bp.route('/<project_id>/users', methods=['GET', 'POST'])
def project_users(project_id):
    """Lista ou adiciona usuários ao projeto"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        user_id = session.get('user_id')
        
        # Verificar permissão (apenas admin do projeto)
        if not has_project_permission(user_id, project_id, ['admin']):
            return jsonify({'error': 'Apenas administradores podem gerenciar usuários'}), 403
        
        project = Project.query.filter_by(id=project_id).first()
        if not project:
            return jsonify({'error': 'Projeto não encontrado'}), 404
        
        if request.method == 'GET':
            user_projects = UserProject.query.filter_by(project_id=project_id).all()
            users_data = [up.to_dict() for up in user_projects]
            
            return jsonify({
                'users': users_data,
                'total': len(users_data)
            }), 200
        
        else:  # POST
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Dados não fornecidos'}), 400
            
            new_user_id = data.get('user_id', '').strip()
            permission_level = data.get('permission_level', 'analista')
            
            if not new_user_id:
                return jsonify({'error': 'ID do usuário é obrigatório'}), 400
            
            if permission_level not in ['admin', 'analista', 'visualizador']:
                return jsonify({'error': 'Nível de permissão inválido'}), 400
            
            # Verificar se usuário já tem acesso
            existing = UserProject.query.filter_by(
                user_id=new_user_id, 
                project_id=project_id
            ).first()
            
            if existing:
                return jsonify({'error': 'Usuário já tem acesso ao projeto'}), 400
            
            # Adicionar usuário
            user_project = UserProject(
                user_id=new_user_id,
                project_id=project_id,
                permission_level=permission_level
            )
            
            db.session.add(user_project)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Usuário adicionado ao projeto com sucesso',
                'user_project': user_project.to_dict()
            }), 201
        
    except Exception as e:
        if request.method == 'POST':
            db.session.rollback()
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

