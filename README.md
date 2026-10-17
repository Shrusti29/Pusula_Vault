# Pusula Vault

> **Enterprise AI-Powered Secure Knowledge Management & Document Management System**

Pusula Vault is a production-grade, enterprise-scale Knowledge & Document Management Platform engineered with defense-in-depth security, hierarchical Role-Based Access Control (RBAC), multi-tenant workspaces, granular resource permissions, full-text and semantic search, rich document collaboration, automated document retention & governance policies, and immutable audit logging.

---

## 📑 Table of Contents

- [System Architecture](#system-architecture)
- [Prerequisites & Technology Matrix](#prerequisites--technology-matrix)
- [Quick Start (Local Development)](#quick-start-local-development)
  - [Option A: Integrated Single Command](#option-a-integrated-single-command-recommended)
  - [Option B: Separate Backend & Frontend Servers](#option-b-separate-backend--frontend-servers)
- [Default Seed Accounts & Credentials](#default-seed-accounts--credentials)
- [Hosting & Deployment Guide](#hosting--deployment-guide)
  - [Hosting on Render (Blueprint / Docker)](#1-hosting-on-render-blueprint--docker)
  - [Hosting via Docker / Container Platforms](#2-hosting-via-docker--container-platforms)
  - [Hosting on a Linux VPS / Cloud VM](#3-hosting-on-a-linux-vps--cloud-vm)
- [Environment Variables & Configuration](#environment-variables--configuration)
- [Database Configuration (H2 vs PostgreSQL)](#database-configuration)
- [File Storage & Backups](#file-storage--backups)
- [Security & Defense-In-Depth Statement](#security--defense-in-depth-statement)

---

## 🏛 System Architecture

The application is structured as a unified full-stack system:

- **Frontend**: Single Page Application built with **Angular 17+** (Standalone Components, Signals API, TipTap WYSIWYG editor, Handsontable spreadsheet viewer, Chart.js analytics). Compiled directly into the backend static resources during packaging.
- **Backend**: **Spring Boot 3.2+** REST API & SSE engine with Spring Security 6, JWT bearer authentication, rate-limiting bucket filters, MDC structured logging, and AES-256-GCM encrypted local asset storage.
- **Persistence**: File-backed/in-memory **H2 Database** for local development and self-contained zero-config mode, and **PostgreSQL 14+** for production deployments.
- **Detailed Architecture Specification**: See [.trae/specs/architecture.md](.trae/specs/architecture.md).

```
   ┌─────────────────────────────────────────────────────────────┐
   │                  Pusula Vault Web Client                    │
   │           (Angular 17 Standalone + Signals SPA)            │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ HTTPS / REST / SSE
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                   Spring Boot 3.2 Service                   │
   │  ┌────────────────────────────────────────────────────────┐  │
   │  │ Spring Security (JWT / Rate-Limit / CORS / Authz AOP)  │  │
   │  ├────────────────────────────────────────────────────────┤  │
   │  │ REST Controllers (/api/v1/workspaces, documents, etc.) │  │
   │  ├────────────────────────────────────────────────────────┤  │
   │  │ Business Logic & Authorization Engine (Deny-Wins-All) │  │
   │  ├────────────────────────────────────────────────────────┤  │
   │  │ Storage Engine (AES-256-GCM / SHA-256 Checksums)      │  │
   │  └────────────────────────────────────────────────────────┘  │
   └───────────────┬─────────────────────────────┬───────────────┘
                   │                             │
                   ▼                             ▼
       ┌──────────────────────┐      ┌──────────────────────┐
       │ PostgreSQL / H2 Data │      │ Local Disk / Volumes │
       │  (JPA / Hibernate)   │      │  (Encrypted Assets)  │
       └──────────────────────┘      └──────────────────────┘
```

---

## 🧰 Prerequisites & Technology Matrix

| Component | Required Version | Supported Environments |
|-----------|------------------|------------------------|
| **Java JDK** | OpenJDK / Temurin **17+** | Linux, macOS, Windows |
| **Apache Maven** | **3.9+** | Embedded or standalone |
| **Node.js** | **v20.x+** (LTS) | Linux, macOS, Windows |
| **npm** | **10.x+** | Bundled with Node |
| **Angular CLI** | **17.3+** | Managed locally via package.json |
| **Database** | H2 (built-in) or PostgreSQL 14+ | Any standard JDBC PostgreSQL |
| **Container Engine** *(Optional)* | Docker 20.10+ / Podman | For containerized hosting |

---

## 🚀 Quick Start (Local Development)

### Option A: Integrated Single Command (Recommended)

The backend Maven build automatically triggers npm install, Angular compilation, and bundles the frontend static files into the executable JAR:

```bash
# 1. Package the entire project into a self-contained JAR
mvn clean package -DskipTests -f backend/pom.xml

# 2. Run the application with the local H2 profile
java -Dspring.profiles.active=local -jar backend/target/pusula-km-backend-1.0.0.jar
```

Once started:
- **Application URL**: [http://localhost:8080](http://localhost:8080)
- **H2 Web Console**: [http://localhost:8080/h2-console](http://localhost:8080/h2-console) (JDBC URL: `jdbc:h2:file:./PusulaKM_Data/pv_local_db`, Username: `sa`, Password: empty)
- **Actuator Health Check**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)
- **Swagger / OpenAPI Documentation**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

---

### Option B: Separate Backend & Frontend Servers

For active UI development with live reloading:

**Terminal 1 — Spring Boot Backend:**
```bash
mvn spring-boot:run -f backend/pom.xml -Dspring-boot.run.profiles=local
```
*(Backend runs on port `8080`)*

**Terminal 2 — Angular Dev Server:**
```bash
cd frontend
npm install
npm start
```
*(Frontend runs on port `4200` with proxy to backend)*

---

## 🔑 Default Seed Accounts & Credentials

When launched against an empty database, the platform automatically seeds initial administrative and demonstration accounts:

> [!WARNING]
> **DEVELOPMENT / DEMO USE ONLY**  
> Change all passwords or disable seed data in a public-facing production environment!

| Role | Username | Password | Default Feature Permissions |
|------|----------|----------|-----------------------------|
| **ADMIN** | `admin` | `admin123` | Full workspace, document, user management, audit logs, analytics, governance |
| **MANAGER** | `manager` | `manager123` | Workspace management, document authoring, audit views, governance view |
| **EMPLOYEE** | `employee` | `employee123` | Document viewing, creation, and editing within assigned workspaces |

---

## 🌐 Hosting & Deployment Guide

### 1. Hosting on Render (Blueprint / Docker)

The repository includes a ready-to-deploy [`render.yaml`](render.yaml) blueprint with automated container packaging, health checks, and managed PostgreSQL support:

1. Push this repository to **GitHub** or **GitLab**.
2. Log in to [Render.com](https://render.com).
3. Click **New +** → **Blueprint**.
4. Connect your repository. Render detects [`render.yaml`](render.yaml) and provisions:
   - **`pusula-vault`**: A Docker Web Service built using the root [`Dockerfile`](Dockerfile).
   - **`pusula-db`**: A managed PostgreSQL database linked via environment variables (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`).
5. Click **Apply**. Render will build the container, bundle frontend assets, launch the Spring Boot service, and verify health on `/actuator/health`.

---

### 2. Hosting via Docker / Container Platforms

Build and run the container on any Docker host (Docker Compose, AWS ECS, Google Cloud Run, Railway, DigitalOcean App Platform):

#### Build the image:
```bash
docker build -t pusula-vault:latest .
```

#### Run with local embedded storage:
```bash
docker run -d \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=local \
  -v pusula_data:/app/PusulaKM_Data \
  --name pusula-vault \
  pusula-vault:latest
```

#### Run with PostgreSQL in production:
```bash
docker run -d \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e PGHOST=postgres.yourdomain.internal \
  -e PGPORT=5432 \
  -e PGDATABASE=pusula_km \
  -e PGUSER=pusula \
  -e PGPASSWORD=YourSecurePassword123! \
  -e PV_ENC_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef \
  -v pusula_data:/app/PusulaKM_Data \
  --name pusula-vault \
  pusula-vault:latest
```

---

### 3. Hosting on a Linux VPS / Cloud VM

1. Install OpenJDK 17:
   ```bash
   sudo apt update && sudo apt install -y openjdk-17-jre-headless
   ```
2. Upload the built `pusula-km-backend-1.0.0.jar` to `/opt/pusula/app.jar`.
3. Create a systemd service file `/etc/systemd/system/pusula.service`:
   ```ini
   [Unit]
   Description=Pusula Vault Enterprise DMS
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/opt/pusula
   ExecStart=/usr/bin/java -Dspring.profiles.active=prod -jar /opt/pusula/app.jar
   Environment="PORT=8080"
   Environment="PGHOST=localhost"
   Environment="PGPORT=5432"
   Environment="PGDATABASE=pusula_km"
   Environment="PGUSER=pusula"
   Environment="PGPASSWORD=your_db_password"
   Environment="FILE_UPLOAD_DIR=/var/pusula/data"
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```
4. Start and enable the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now pusula
   ```
5. Configure Nginx or Caddy as a reverse proxy for TLS termination (HTTPS).

---

## ⚙️ Environment Variables & Configuration

| Environment Variable | Default Value | Description |
|----------------------|---------------|-------------|
| `SPRING_PROFILES_ACTIVE` | `local` | Active Spring profile (`local`, `dev`, `prod`). |
| `PORT` | `8080` | Port on which the Spring Boot web server listens. |
| `FILE_UPLOAD_DIR` | `./PusulaKM_Data` | Directory path where uploaded files and encrypted assets are stored. |
| `PV_ENC_KEY` | *(empty)* | 64-character hex key for AES-256-GCM file encryption. |
| `PV_CORS` | `http://localhost:4200` | Allowed CORS origins. In production, wildcard `*` is disallowed for security. |
| `SPRING_DATASOURCE_URL` | *(derived from PGHOST/PGPORT)* | JDBC connection URL (e.g. `jdbc:postgresql://host:5432/db`). |
| `PGHOST` / `PG_HOST` | `localhost` | PostgreSQL host. |
| `PGPORT` / `PG_PORT` | `5432` | PostgreSQL port. |
| `PGDATABASE` / `PG_DB` | `pusula_km` | PostgreSQL database name. |
| `PGUSER` / `PG_USER` | `pusula` | Database user. |
| `PGPASSWORD` / `PG_PWD` | *(empty)* | Database password. |
| `PV_AI_PROVIDER` | `stub` | AI backend provider: `stub`, `ollama`, or `openai`. |
| `PV_OLLAMA_BASE_URL` | `http://localhost:11434` | Endpoint for Ollama local AI model instances. |
| `PV_OPENAI_API_KEY` | *(empty)* | API key if OpenAI integration is selected. |

---

## 🗄️ Database Configuration

### H2 (Default for Local / Quick Testing)
- Activated via profile `local` or `dev`.
- Files are saved locally to `./PusulaKM_Data/pv_local_db.mv.db`.
- Automatic table creation and schema updates via `spring.jpa.hibernate.ddl-auto=update`.

### PostgreSQL (Recommended for Production)
- Activated via profile `prod`.
- Tables and constraints are automatically initialized via Hibernate on first boot.
- Supports external connection pooling via HikariCP.

---

## 💾 File Storage & Backups

1. **Storage Structure**:
   ```
   PusulaKM_Data/
   ├── assets/       # Encrypted binaries uploaded to the vault
   ├── documents/    # Stored markdown and generated files
   ├── versions/     # Historical document snapshots
   ├── exports/      # Batch ZIP and PDF exports
   └── backups/      # Local database and configuration backups
   ```
2. **Backup Recommendations**:
   - Backup the storage directory specified in `FILE_UPLOAD_DIR` using standard incremental filesystem backups.
   - For PostgreSQL in production, schedule periodic `pg_dump` jobs:
     ```bash
     pg_dump -U pusula -d pusula_km -Fc > pusula_backup_$(date +%Y%m%d).dump
     ```

---

## 🛡️ Security & Defense-In-Depth Statement

- **Stateless Authentication**: Uses cryptographic JSON Web Tokens (JWT) signed with HMAC-SHA.
- **Hierarchical RBAC & Explicit Scopes**: Every resource modification checks role privilege and resource hierarchy (Workspace → Folder → Document → Asset) with a strict "deny-wins-by-default" policy.
- **Protection Against Path Traversal**: Storage keys are validated against strict regex masks (`^[a-zA-Z0-9_-]+/[0-9a-fA-F-]+\.[a-zA-Z0-9]+$`).
- **Encrypted At Rest**: Sensitive file assets are encrypted using AES-256-GCM authenticated encryption with unique IVs.
- **Brute Force Defense**: Embedded rate-limiting filters mitigate abusive authentication requests.
- **Immutable Audit Trail**: All authentication, access grants, document modifications, downloads, and security events are logged with actor details, timestamps, and previous state snapshots.
