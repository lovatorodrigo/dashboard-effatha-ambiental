from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    client = db.Column(db.String(100))
    status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    settings = db.Column(db.Text)  # JSON string
    
    # Relacionamentos
    user_projects = db.relationship('UserProject', back_populates='project', cascade='all, delete-orphan')
    measurements = db.relationship('Measurement', back_populates='project', cascade='all, delete-orphan')
    
    def __init__(self, id, name, description=None, client=None, settings=None):
        self.id = id
        self.name = name
        self.description = description
        self.client = client
        self.settings = json.dumps(settings) if settings else json.dumps({})
    
    def get_settings(self):
        """Retorna as configurações como dicionário"""
        try:
            return json.loads(self.settings) if self.settings else {}
        except:
            return {}
    
    def set_settings(self, settings_dict):
        """Define as configurações a partir de um dicionário"""
        self.settings = json.dumps(settings_dict)
    
    def to_dict(self):
        """Converte o projeto para dicionário"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'client': self.client,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'settings': self.get_settings(),
            'measurement_count': len(self.measurements),
            'user_count': len(self.user_projects)
        }

class UserProject(db.Model):
    __tablename__ = 'user_projects'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), nullable=False)
    project_id = db.Column(db.String(50), db.ForeignKey('projects.id'), nullable=False)
    permission_level = db.Column(db.String(20), nullable=False)  # admin, analista, visualizador
    granted_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    project = db.relationship('Project', back_populates='user_projects')
    
    def __init__(self, user_id, project_id, permission_level='analista'):
        self.user_id = user_id
        self.project_id = project_id
        self.permission_level = permission_level
    
    def to_dict(self):
        """Converte a permissão para dicionário"""
        return {
            'user_id': self.user_id,
            'project_id': self.project_id,
            'permission_level': self.permission_level,
            'granted_at': self.granted_at.isoformat() if self.granted_at else None,
            'project_name': self.project.name if self.project else None
        }

class Measurement(db.Model):
    __tablename__ = 'measurements'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.String(50), db.ForeignKey('projects.id'), nullable=False)
    data_hora = db.Column(db.DateTime, nullable=False)
    ponto = db.Column(db.String(100), nullable=False)
    coordinates = db.Column(db.Text)  # JSON string
    respostas = db.Column(db.Text, nullable=False)  # JSON string
    metadata_info = db.Column(db.Text)  # JSON string
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    uploaded_by = db.Column(db.String(50))
    
    # Relacionamentos
    project = db.relationship('Project', back_populates='measurements')
    
    def __init__(self, project_id, data_hora, ponto, respostas, coordinates=None, metadata=None, uploaded_by=None):
        self.project_id = project_id
        self.data_hora = data_hora
        self.ponto = ponto
        self.respostas = json.dumps(respostas) if isinstance(respostas, (list, dict)) else respostas
        self.coordinates = json.dumps(coordinates) if coordinates else None
        self.metadata_info = json.dumps(metadata) if metadata else None
        self.uploaded_by = uploaded_by
    
    def get_respostas(self):
        """Retorna as respostas como lista/dicionário"""
        try:
            return json.loads(self.respostas) if self.respostas else []
        except:
            return []
    
    def get_coordinates(self):
        """Retorna as coordenadas como dicionário"""
        try:
            return json.loads(self.coordinates) if self.coordinates else {}
        except:
            return {}
    
    def get_metadata(self):
        """Retorna os metadados como dicionário"""
        try:
            return json.loads(self.metadata_info) if self.metadata_info else {}
        except:
            return {}
    
    def to_dict(self):
        """Converte a medição para dicionário"""
        return {
            'id': self.id,
            'project_id': self.project_id,
            'data_hora': self.data_hora.isoformat() if self.data_hora else None,
            'ponto': self.ponto,
            'coordinates': self.get_coordinates(),
            'respostas': self.get_respostas(),
            'metadata': self.get_metadata(),
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
            'uploaded_by': self.uploaded_by
        }

