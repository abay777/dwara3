# Dwara Agent Design Document

## Overview
The Dwara agent is a Rust-based service that runs on NAS (Network Attached Storage) systems to provide folder scanning capabilities for the Dwara ingest system. It exposes a REST API that the main Dwara service calls to initiate and monitor scan operations. Each agent operates independently and handles one scan operation at a time.

## System Architecture

### Component Interaction
```
[User Interface] → [Dwara Service] → [Agent]
         ↑              ↑              |
         |              |              |
         +──────────────+-─────────────+
              Results Flow
```

1. User initiates scan via UI
2. Dwara service receives request
3. Service looks up appropriate agent
4. Service calls agent's scan API
5. Agent performs scan
6. Agent returns results directly
7. Service updates UI with results

### Component Structure
```
agent/
├── src/
│   ├── main.rs           // Async runtime and HTTP server setup
│   ├── scanner/
│   │   ├── mod.rs        // Scanner coordination
│   │   └── walker.rs     // Async directory traversal
│   ├── api/
│   │   ├── handlers.rs   // REST endpoints
│   │   └── models.rs     // Data structures
│   └── error.rs
```

## Core Components

### Agent
```rust
struct Agent {
    id: String,           // UUID generated at startup
    current_scan: Option<ScanOperation>,
}

struct ScanOperation {
    path: PathBuf,        // Directory being scanned
    progress: ScanProgress,
    start_time: DateTime<Utc>,
}

struct ScanProgress {
    files_processed: usize,
    current_path: Option<PathBuf>,
    status: ScanStatus,
}
```

### API Interface
```rust
// REST Endpoints
POST /api/v1/scan
    Request: {
        path: String,
        recursive: bool,
        include_patterns?: Vec<String>,
        exclude_patterns?: Vec<String>
    }
    Response: {
        agent_id: String  // Unique ID of the agent
    }

GET /api/v1/scan/status
    Response: {
        scanning: bool,
        progress?: {
            files_processed: number,
            current_path?: string
        },
        results?: Array<FileInfo>
    }
```

## Configuration

### Agent Configuration (config.toml)
```toml
[agent]
host = "0.0.0.0"  # Listen on all interfaces
port = 8080       # Port for server to connect to

[logging]
level = "info"
file = "/var/log/dwara-agent.log"
```

### Dwara Service Configuration (Database)
```sql
-- Servers table
servers {
    id: uuid
    name: string        # e.g. "nas-01"
    agent_url: string   # e.g. "http://nas-01:8080"
    status: enum        # active/inactive
}

-- Scan Paths table
scan_paths {
    id: uuid
    server_id: uuid     # reference to servers
    path: string        # e.g. "/data/ingest"
    category: string    # e.g. "raw", "processed"
    data_type: string   # e.g. "video", "audio"
    active: boolean
}
```

### Key Features
1. Single Agent Identity
   - UUID generated at startup
   - One scan at a time per agent
   - Simple state management

2. Asynchronous Directory Scanning
   - Non-blocking I/O operations
   - Progress tracking
   - Memory-efficient traversal

3. Central Configuration
   - Path configurations in Dwara service
   - Data categorization managed centrally
   - Agent focuses purely on scanning

4. Error Handling
   - Graceful error recovery
   - Detailed error reporting
   - Automatic scan cleanup

## Implementation Plan

### Phase 1: Core Scanning
1. Project Setup
   - [ ] Initialize Rust project
   - [ ] Configure async runtime (tokio)
   - [ ] Set up HTTP server
   - [ ] Implement agent ID generation

2. Scanner Implementation
   - [ ] Create Agent structure
   - [ ] Implement async directory walker
   - [ ] Add progress tracking
   - [ ] Handle file metadata collection

3. API Layer
   - [ ] Implement scan endpoint
   - [ ] Add status endpoint
   - [ ] Create response models

### Phase 2: Integration
1. Dwara Service Integration
   - [ ] Implement agent client in service
   - [ ] Add error handling
   - [ ] Update UI components

2. Testing & Validation
   - [ ] Unit tests
   - [ ] Integration tests
   - [ ] Performance testing
   - [ ] Error scenario testing

### Phase 3: Deployment
1. Build & Packaging
   - [ ] Create build pipeline
   - [ ] Configure logging
   - [ ] Add configuration file

2. Documentation
   - [ ] API documentation
   - [ ] Deployment guide
   - [ ] Configuration reference

## Future Extensions

### Potential Features
1. File Transfer Operations
   ```rust
   trait Operation {
       fn execute(&self) -> Future<Result<(), Error>>;
       fn progress(&self) -> OperationProgress;
   }
   
   struct TransferOperation;
   ```

2. Operation System
   - Abstract operation trait
   - Plugin architecture
   - Progress tracking

## Development Guidelines

### Code Style
- Follow Rust idioms
- Comprehensive error handling
- Clear documentation
- Type-driven development

### Testing Strategy
- Unit tests for core logic
- Integration tests for API
- Performance benchmarks
- Error scenario coverage

### Performance Considerations
- Async I/O operations
- Memory-efficient processing
- Progress tracking overhead
- Resource cleanup

## Deployment

### Requirements
- Rust 1.70+
- Linux/Unix environment
- Network access to Dwara service
- File system permissions

### Installation Steps
1. Build from source
2. Configure service
3. Set up logging
4. Configure permissions

This design provides a simple yet robust foundation for the scanning functionality. The server-calls-agent model provides a clear and direct flow of operations, while the central configuration in the Dwara service enables easy management of paths and data categories. The focus on simplicity and reliability ensures we can deliver core features quickly while keeping the codebase maintainable.