from flask import Blueprint, request, jsonify, session
from werkzeug.security import check_password_hash, generate_password_hash
from src.models.user import User, db
import hashlib
import secrets

auth_bp = Blueprint('auth', __name__)

# Usuários padrão (em produção, usar banco de dados)
DEFAULT_USERS = {
    'admin': generate_password_hash('admin123'),
    'provaso': generate_password_hash('provaso2025'),
    'analista': generate_password_hash('analise123'),
    'industrial_admin': generate_password_hash('industrial123'),
    'industrial_analista': generate_password_hash('industrial456'),
    'urbano_admin': generate_password_hash('urbano123'),
    'urbano_analista': generate_password_hash('urbano456'),
    'supervisor': generate_password_hash('supervisor123')
}

@auth_bp.route('/login', methods=['POST'])
def login():
    """Endpoint para autenticação de usuários"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({'error': 'Usuário e senha são obrigatórios'}), 400
        
        # Verificar credenciais
        if username in DEFAULT_USERS:
            if check_password_hash(DEFAULT_USERS[username], password):
                # Criar sessão
                session['user_id'] = username
                session['authenticated'] = True
                session['session_token'] = secrets.token_hex(16)
                
                return jsonify({
                    'success': True,
                    'message': 'Login realizado com sucesso',
                    'user': username,
                    'session_token': session['session_token']
                }), 200
        
        return jsonify({'error': 'Credenciais inválidas'}), 401
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Endpoint para logout"""
    try:
        session.clear()
        return jsonify({
            'success': True,
            'message': 'Logout realizado com sucesso'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@auth_bp.route('/check-auth', methods=['GET'])
def check_auth():
    """Verificar se o usuário está autenticado"""
    try:
        if session.get('authenticated') and session.get('user_id'):
            return jsonify({
                'authenticated': True,
                'user': session.get('user_id'),
                'session_token': session.get('session_token')
            }), 200
        
        return jsonify({'authenticated': False}), 401
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@auth_bp.route('/users', methods=['GET'])
def list_users():
    """Listar usuários disponíveis (apenas para demonstração)"""
    try:
        if not session.get('authenticated'):
            return jsonify({'error': 'Não autenticado'}), 401
        
        users = list(DEFAULT_USERS.keys())
        return jsonify({
            'users': users,
            'total': len(users)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    """Alterar senha do usuário"""
    try:
        if not session.get('authenticated'):
            return jsonify({'error': 'Não autenticado'}), 401
        
        data = request.get_json()
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Senha atual e nova senha são obrigatórias'}), 400
        
        username = session.get('user_id')
        
        # Verificar senha atual
        if username in DEFAULT_USERS:
            if check_password_hash(DEFAULT_USERS[username], current_password):
                # Atualizar senha
                DEFAULT_USERS[username] = generate_password_hash(new_password)
                
                return jsonify({
                    'success': True,
                    'message': 'Senha alterada com sucesso'
                }), 200
        
        return jsonify({'error': 'Senha atual incorreta'}), 400
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

