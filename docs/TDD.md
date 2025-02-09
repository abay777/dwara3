# Technical Design Document

## Document Information
| Field | Value |
|-------|--------|
| **Author(s)** | @girindra |
| **Version/Status** | Draft #1 |
| **Date** | 10/10/24 |
| **Reviewers** | @swami.kevala |

### Sign Offs
- [ ] Swami Kevala

---

## Table of Contents

[1. Overview](#1-overview)  
[1.1. Objective](#11-objective)  
[1.2. Background](#12-background)  
[1.3. Requirements](#13-requirements)  

[2. System Architecture](#2-system-architecture)  
[2.1. Component Overview](#21-component-overview)  
[2.1.1. Frontend (React)](#211-frontend-react)  
[2.1.2. Backend (FastAPI)](#212-backend-fastapi)  
[2.1.3. Agents (Rust)](#213-agents-rust)  
[2.1.4. Workflow (Airflow)](#214-workflow-airflow)  

[3. Technical Implementation](#3-technical-implementation)  
[3.1. Airflow Workflow Implementation](#31-airflow-workflow-implementation)  
[3.1.1. Archive DAG Overview](#311-archive-dag-overview)  
[3.1.2. DAG Tasks and Flow](#312-dag-tasks-and-flow)  
[3.1.2.1. Authentication Task](#3121-authentication-task)  
[3.1.2.2. Folder Validation Task](#3122-folder-validation-task)  
[3.1.2.3. File Preparation Task](#3123-file-preparation-task)  
[3.1.2.4. Archive Submission Task](#3124-archive-submission-task)  
[3.1.2.5. Progress Monitoring Task](#3125-progress-monitoring-task)  
[3.1.3. Task Dependencies](#313-task-dependencies)  
[3.1.4. Configuration Parameters](#314-configuration-parameters)  
[3.1.5. Error Handling Strategy](#315-error-handling-strategy)  
[3.1.6. Monitoring and Observability](#316-monitoring-and-observability)  
[3.1.7. Integration Touchpoints](#317-integration-touchpoints)  
[3.1.7.1. Frontend Integration](#3171-frontend-integration)  
[3.1.7.2. Miria API Integration](#3172-miria-api-integration)  
[3.1.7.3. Database Integration](#3173-database-integration)  
[3.1.8. Performance Considerations](#318-performance-considerations)  

[3.2. Miria API Workflow Implementation](#32-miria-api-workflow-implementation)  
[3.2.1. API Authentication](#321-api-authentication)  
[3.2.2. Archival Process API Calls](#322-archival-process-api-calls)  
[3.2.3. Restoration API Calls](#323-restoration-api-calls)  
[3.2.4. Error Response Examples](#324-error-response-examples)  
[3.2.5. API Response Codes](#325-api-response-codes)  

[3.3. Data Models](#33-data-models)  
[3.3.1. Files Table](#331-files-table)  
[3.3.2. Proxy Files](#332-proxy-files)  

[3.4. API Layer](#34-api-layer)  
[3.4.1. Ingest Operations](#341-ingest-operations)  
[3.4.2. File Management](#342-file-management)  

[3.5. UI Layer](#35-ui-layer)  
[3.5.1. Components](#351-components)  
[3.5.2. Integration](#352-integration)  

[3.6. Testing Strategy](#36-testing-strategy)  
[3.6.1. Unit Tests](#361-unit-tests)  
[3.6.2. Integration Tests](#362-integration-tests)  

[4. Non-Functional Requirements](#4-non-functional-requirements)  
[4.1. Privacy](#41-privacy)  
[4.2. Security](#42-security)  
[4.3. Performance](#43-performance)  
[4.4. Operations](#44-operations)  
[4.4.1. Deployment](#441-deployment)  
[4.4.2. Monitoring](#442-monitoring)  

[5. References](#5-references)


---

# 1. Overview

## 1.1. Objective

Create a distributed archival system that:
- Scans and validates folders across NAS locations using Rust agents
- Archives files using Miria API integration
- Orchestrates workflows through Airflow
- Provides a React-based UI for operation management

## 1.2. Background

Current challenges:
- Manual archival processes are error-prone
- Lack of centralized monitoring
- Need for automated validation
- Missing workflow orchestration

## 1.3. Requirements

Core System Requirements:
- Distributed folder scanning
- File validation and checksums
- Archival workflow automation
- Progress tracking and monitoring
- UI for operation management

# 2. System Architecture

## 2.1. Component Overview

### 2.1.1. Frontend (React)
- FolderScan component for folder management
- Real-time status updates
- Filtering by NAS and content type
- Progress visualization

### 2.1.2. Backend (FastAPI)
- REST API endpoints for operations
- Database integration (PostgreSQL)
- Miria API client integration
- Error handling and validation

### 2.1.3. Agents (Rust)
- Distributed scanning service
- Path validation
- File metadata collection
- Progress reporting

### 2.1.4. Workflow (Airflow)
- DAG orchestration
- Task scheduling
- Error handling
- Progress monitoring

# 3. Technical Implementation

## 3.1. Airflow Workflow Implementation

### 3.1.1. Archive DAG Overview

The `miria_archive_workflow` DAG handles the end-to-end process of archiving folders through the Miria system. This workflow is triggered on-demand and includes comprehensive error handling and monitoring capabilities.

### 3.1.2. DAG Tasks and Flow

#### 3.1.2.1. Authentication Task (get_miria_token)
**Purpose**: Securely obtain authentication token for Miria API access

**Implementation Details**:
- Retrieves credentials from Airflow connections
- Makes authenticated request to Miria token endpoint
- Validates response and token format
- Implements retry logic for transient failures

**Error Handling**:
- Retries on connection timeouts
- Proper error messages for invalid credentials
- Slack notifications for repeated failures

#### 3.1.2.2. Folder Validation Task (validate_folder)
**Purpose**: Ensure folder is ready for archival

**Implementation Details**:
- Verifies folder existence and accessibility
- Checks file permissions
- Validates folder structure
- Ensures sufficient space available

**Validation Rules**:
- Folder must exist
- Must have read permissions
- Must meet minimum size requirements
- Must follow naming conventions

#### 3.1.2.3. File Preparation Task (prepare_files)
**Purpose**: Prepare file manifest for Miria ingestion

**Implementation Details**:
- Generates complete file listing
- Calculates file checksums
- Creates database entries
- Prepares metadata package

**Data Collection**:
- File paths
- File sizes
- Modified timestamps
- Checksums
- Metadata attributes

#### 3.1.2.4. Archive Submission Task (submit_archive_job)
**Purpose**: Submit archive job to Miria

**Implementation Details**:
- Formats job request payload
- Submits to Miria API
- Handles response validation
- Stores job tracking information

**Job Parameters**:
- Source paths
- Destination details
- Priority settings
- Retention policies

#### 3.1.2.5. Progress Monitoring Task (monitor_archive_progress)
**Purpose**: Track archive job progress

**Implementation Details**:
- Polls Miria job status endpoint
- Updates database with progress
- Handles completion notification
- Manages error scenarios

**Status Updates**:
- Percentage complete
- Files processed
- Transfer rates
- Error conditions

### 3.1.3. Task Dependencies

- Authentication and validation can run in parallel
- File preparation requires successful validation
- Job submission needs both token and prepared files
- Progress monitoring starts after job submission

### 3.1.4. Configuration Parameters

- **Required Parameters**:
    - `folder_name`: Name of folder to archive
    - `folder_path`: Full path to source folder
- **Optional Parameters**:
    - `retention_days`: Data retention period
    - `priority`: Job priority level
    - `notification_email`: Alert recipient

### 3.1.5. Error Handling Strategy

- **Retry Mechanism**:
    - Authentication: 2 retries, 2-minute delay
    - Job Submission: 3 retries, 5-minute delay
    - Progress Monitoring: 5 retries, 5-minute delay
- **Notification System**:
    - Slack alerts for critical failures
    - Email notifications for completion
    - Dashboard updates for status
- **Error Recovery**:
    - Automatic retry for transient failures
    - Manual intervention triggers
    - Rollback procedures

### 3.1.6. Monitoring and Observability

- **Airflow UI Integration**:
    - Real-time task status
    - Progress indicators
    - Log access
    - Error details
- **External Monitoring**:
    - Prometheus metrics
    - Grafana dashboards
    - Custom alerts
    - Performance tracking

### 3.1.7. Integration Touchpoints

#### 3.1.7.1. Frontend Integration
- **Trigger Method**:
    - REST API call to Airflow
    - Webhook notifications
    - Status polling endpoint
- **Data Flow**:
    - Configuration parameters
    - Status updates
    - Error notifications

#### 3.1.7.2. Miria API Integration
- **Authentication**:
    - Token-based auth
    - Session management
    - Credential rotation
- **Operations**:
    - Job submission
    - Status checking
    - Error handling

#### 3.1.7.3. Database Integration
- **Write Operations**:
    - Job status updates
    - Progress tracking
    - Error logging
- **Read Operations**:
    - Configuration lookup
    - Status queries
    - Report generation

### 3.1.8. Performance Considerations

- **Parallel Processing**:
    - Multiple concurrent archives
    - Batch file processing
    - Distributed checksums
- **Resource Management**:
    - CPU usage limits
    - Memory constraints
    - Network bandwidth control
- **Optimization Techniques**:
    - Caching strategies
    - Batch operations
    - Connection pooling

## 3.2. Miria API Workflow Implementation

### 3.2.1. API Authentication

- **Endpoint**: `/api/token-auth/`
- **Method**: POST
- **Headers**:
    ```
    Content-Type: application/json
    ```
- **Request Payload**:
    ```json
    {  "username": "api_user",  "password": "api_password"}
    ```
- **Response**:
    ```json
    {  "token": "eyJhbGciOiJIUzI1NiIs..."}
    ```

### 3.2.2. Archival Process API Calls

#### 1. Initialize Archive Job
- **Endpoint**: `/api/files/init-archiving/`
- **Method**: POST
- **Headers**:
    ```
    Authorization: Bearer <token>
    Content-Type: application/json
    ```
- **Request Payload**:
    ```json
    {  "destination": {    "name": "archive_destination_name"  },  "priority": 50,  "isRestartable": true}
    ```
- **Success Response**:
    ```json
    {  "jobId": 123,  "message": "Job successfully created"}
    ```

#### 2. Add Files to Archive Job
- **Endpoint**: `/api/files/add-to-archiving/{jobId}/`
- **Method**: POST
- **Headers**: Same as above
- **Request Payload**:
    ```json
    {  "defaultRootPath": "/path/to/source",  "pathInfo": [    {      "source": "relative/path/file1.mov",      "type": 1,      "size": 1048576,      "mtime": 1678886400    },    {      "source": "relative/path/folder1",      "type": 2,      "size": 0,      "mtime": 0    }  ]}
    ```
- **Success Response**:
    ```json
    {  "message": "Files successfully added to job"}
    ```

#### 3. Trigger Archive Job
- **Endpoint**: `/api/files/trigger-archiving/{jobId}/`
- **Method**: POST
- **Headers**: Same as above
- **Request Payload**: `{}`
- **Success Response**:
    ```json
    {  "message": "Archiving job launched",  "jobId": 123}
    ```

#### 4. Monitor Archive Progress
- **Endpoint**: `/api/activity/jobs/{jobId}/`
- **Method**: GET
- **Headers**: Same as above
- **Success Response**:
    ```json
    {  "jobId": 123,  "status": "Running",  "queue": [    {      "id": 456,      "currentType": "object",      "currentValue": 50,      "totalValue": 100,      "queueStatus": "Running"    }  ]}
    ```

#### 5. Browse Directory Contents
- **Endpoint**: `/api/datamanagement/repositories/{repoId}/browse/{objectId}/`
- **Method**: GET
- **Headers**: Same as above
- **Success Response**:
    ```json
    {  "object": [    {      "id": 789,      "name": "video1.mov",      "objectType": 1,      "size": 1048576,      "creationDate": "2024-03-14T17:18:19.822671Z"    }  ]}
    ```

### 3.2.3. Restoration API Calls

#### 1. File Server Restoration
- **Endpoint**: `/api/files/retrieve/`
- **Method**: POST
- **Headers**: Same as above
- **Request Payload**:
    ```json
    {  "archive": {    "name": "archive_name"  },  "destination": {    "path": "/restore/path"  },  "pathInfo": [    {      "source": "/archived/path/file1.mov",      "type": 1    }  ]}
    ```

#### 2. LTO Tape Restoration
- **Endpoint**: `/api/files/retrieve/`
- **Method**: POST
- **Headers**: Same as above
- **Request Payload**:
    ```json
    {  "archive": {    "name": "archive_name"  },  "destination": {    "path": "/restore/path"  },  "media": {    "id": 123  },  "pathInfo": [    {      "source": "/archived/path/file1.mov",      "objectId": 456,      "type": 1    }  ]}
    ```
- **Success Response (both types)**:
    ```json
    {  "message": "Retrieving job launched",  "jobId": 124}
    ```

### 3.2.4. Error Response Examples

#### 1. Authentication Error
    ```json
    {  "error": "Invalid credentials",  "code": "AUTH_001"}
    ```

#### 2. Job Creation Error
    ```json
    {  "error": "Invalid destination",  "code": "DEST_001",  "details": "Archive destination not found"}
    ```

#### 3. File Addition Error
    ```json
    {  "error": "Invalid path",  "code": "PATH_001",  "details": "Source path does not exist"}
    ```

### 3.2.5. API Response Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
- 503: Service Unavailable

## 3.3. Data Models

### 3.3.1. Files Table
- Path tracking
- File metadata
- Archival status
- Checksum storage

### 3.3.2. Proxy Files
- Original file references
- Proxy type indicators
- Status tracking
- Creation timestamps

## 3.4. API Layer

### 3.4.1. Ingest Operations
- Folder scanning
- Validation checks
- Archival triggers
- Status monitoring

### 3.4.2. File Management
- Listing capabilities
- Folder scanning
- Status updates
- Error reporting

## 3.5. UI Layer

### 3.5.1. Components
- FolderScan for selection
- Progress indicators
- Status alerts
- Filter controls

### 3.5.2. Integration
- Airflow DAG triggers
- Status polling
- Error handling
- User notifications

## 3.6. Testing Strategy

### 3.6.1. Unit Tests
- Component testing
- API endpoint validation
- Agent functionality
- Workflow verification

### 3.6.2. Integration Tests
- End-to-end workflows
- API interactions
- Database operations
- Error scenarios

# 4. Non-Functional Requirements

## 4.1 Privacy
- Metadata handling
- Access controls
- Data retention
- Deletion workflows

## 4.2 Security
- Token authentication
- API rate limiting
- Input validation
- Error masking

## 4.3 Performance
- Concurrent operations
- Resource management
- Connection pooling
- Caching strategies

## 4.4 Operations

### 4.4.1 Deployment
- Service containers
- Database setup
- Network configuration
- Volume management

### 4.4.2 Monitoring
- Airflow dashboard
- Agent health checks
- API metrics
- Log aggregation

# 5. References

- Miria API Documentation
- Agent Design Document
- Project README
