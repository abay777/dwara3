from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class File(Base):
    __tablename__ = "files"
    
    id = Column(Integer, primary_key=True, index=True)
    path = Column(String, index=True)
    filename = Column(String)
    size = Column(Integer)
    checksum = Column(String)
    status = Column(String)  # e.g., "pending", "archived", "restoring"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Archive locations
    copy1_location = Column(String, nullable=True)
    copy2_location = Column(String, nullable=True)
    copy3_location = Column(String, nullable=True)

class ProxyFile(Base):
    __tablename__ = "proxy_files"
    
    id = Column(Integer, primary_key=True, index=True)
    original_file_id = Column(Integer, ForeignKey("files.id"))
    proxy_type = Column(String)  # "hd" or "preview"
    path = Column(String)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)