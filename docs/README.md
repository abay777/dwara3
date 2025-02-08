# Data Archival and Retrieval Framework
## Project Brief

### Project Overview
This project aims to develop a scalable and modular data archival and retrieval framework, primarily focused on managing video content. The system will handle the complete lifecycle of data, from initial ingestion through archival to restoration, with robust job orchestration and proxy generation capabilities.

### Technical Architecture

#### Core Components
- **Job Orchestration**: Apache Airflow for workflow management and job scheduling
- **Data Archival**: Integration with Atempo Miria for LTO tape and disk operations
- **Database**: PostgreSQL for file tracking and metadata management
- **API Layer**: FastAPI-based Python middleware
- **Frontend**: React-based user interface
- **Containerization**: Docker for deployment and portability
- **Version Control**: Git and GitHub for source code management

#### Database Schema
The PostgreSQL database will track:
- File metadata (path, name, size)
- SHA-256 checksums
- Storage locations for all copies
- Unique identifier for each asset
- Archival status and history

### Core Workflows

#### Ingest Process
1. Users organize data in staging folders on designated servers
2. UI provides folder scanning functionality with validation rules
3. Upon ingestion initiation, parallel workflow tasks begin:
   - Data archival to LTO/disk via Atempo Miria
   - Proxy generation for video files (HD and H.264 preview versions)
   - SHA-256 checksum calculation
   - Database record creation and metadata storage

#### Retrieval Process
1. Users search archived content through the UI
2. Preview proxy playback available for video content
3. Shopping cart functionality for batch restoration requests
4. Automated restoration workflow:
   - API communication with Atempo Miria
   - Custom destination specification
   - Status tracking and notification

### Technical Requirements

#### Modularity
- Independent component development capability
- Clear API contracts between modules
- Standardized interfaces for third-party integrations

#### Abstraction Layer
- Vendor-agnostic design for archival system integration
- Pluggable architecture for storage backend changes
- Standardized API interfaces for core operations

#### Testing
- Automated test suite for all components
- Integration testing for workflow validation
- API endpoint testing
- Frontend component testing

### Development Guidelines

#### Code Organization
- Microservices-based architecture
- Docker containerization for all components
- Clear separation of concerns between modules
- Comprehensive API documentation

#### Quality Assurance
- Continuous Integration/Continuous Deployment (CI/CD)
- Automated testing on pull requests
- Code review requirements
- Documentation requirements for all major components

### Security Considerations
- Secure API authentication and authorization
- Audit logging for all operations
- Data integrity verification through checksums
- Access control for different user roles

### Integration Points
- Atempo Miria API integration
- Storage system interfaces
- Job orchestration workflows
- Database interactions
- Frontend-backend communication

### Scalability Considerations
- Horizontal scaling capability for processing nodes
- Load balancing for API requests
- Efficient handling of large-scale data operations
- Performance optimization for database queries

This framework emphasizes modularity, scalability, and maintainability while providing a robust solution for enterprise-level data archival and retrieval needs. The architecture allows for future expansion and component replacement while maintaining system integrity and performance.