# Testimonials Collection System

A comprehensive web application for collecting, managing, and displaying customer testimonials from AI/Automation Agency clients and Skool community members. The system provides a public submission form, admin dashboard for moderation, and embeddable widgets for external websites.

## 🚀 Features

- **Public Testimonial Submission**: Web form with spam protection and validation
- **Admin Dashboard**: React-based interface for approving, rejecting, and managing testimonials
- **Featured Testimonials**: Mark important testimonials for priority display
- **Visibility Control**: Show/hide testimonials without permanent deletion
- **Soft Deletion**: Delete testimonials with recovery capability
- **Search & Filtering**: Advanced filtering by text, source type, and rating
- **Pagination**: Efficient handling of large testimonial datasets with professional styling
- **Security**: CSRF protection, JWT authentication, rate limiting, and input sanitization
- **Modern UI**: Tailwind CSS v4 with shadcn/ui components for consistent design
- **Responsive Design**: Mobile-first design optimized for all devices

## 📋 Project Status

- ✅ **Phase 1**: Proof of Concept MVP (Complete)
- ✅ **Phase 2**: Production-Ready Core (Complete)
- 🔄 **Phase 3**: Embeddable Widgets (Planned)
- 📅 **Phase 4**: Production & Scale (Planned)

## 🏗️ Architecture

### Technology Stack
- **Backend**: Node.js/Express with PostgreSQL database
- **Frontend**: React with Vite build system and hot module replacement
- **Admin Interface**: React SPA with Tailwind CSS v4 and shadcn/ui components
- **Public Interface**: Static HTML with unified Tailwind design system
- **Database**: PostgreSQL with structured schema, indexes, and soft deletion
- **Authentication**: JWT tokens with CSRF protection and secure session management
- **Styling**: Tailwind CSS v4 with custom design tokens and component variants
- **Containerization**: Docker Compose for development environment

### Project Structure

```
/mnt/c/Code/Testimonials/
├── README.md                     # This file
├── docker-compose.yml            # Container orchestration
├── .gitignore                   # Git ignore rules
├── CLAUDE.md                    # AI assistant project context
├── Docs/                        # Project documentation
│   ├── testimonial_prd.md       # Product requirements document
│   └── tasks.md                 # Development task breakdown
├── app/                         # Application code
│   ├── backend/                 # Node.js API server
│   │   ├── server.js            # Main server file
│   │   ├── package.json         # Backend dependencies
│   │   └── Dockerfile           # Backend container config
│   └── frontend/                # Frontend applications
│       ├── public/              # Static public pages
│       │   ├── index.html       # Landing page
│       │   ├── submit.html      # Testimonial submission form
│       │   ├── testimonials.html # Public testimonials display
│       │   └── styles.css       # Public page styling
│       └── admin/               # React admin dashboard
│           ├── src/             # React source code
│           ├── package.json     # Frontend dependencies
│           ├── vite.config.js   # Vite configuration
│           └── Dockerfile       # Frontend container config
└── Screenshots/                 # Development screenshots
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git for version control
- Modern web browser

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd Testimonials

# Start all services
docker-compose up -d
```

### 2. Initial Database Setup

The database will be automatically initialized on first run. If you need to reset:

```bash
# Stop services
docker-compose down

# Remove database volume (CAUTION: This deletes all data)
docker volume rm testimonials_postgres_data

# Restart services
docker-compose up -d
```

### 3. Access the Application

- **Landing Page**: http://localhost:3000
- **Submit Testimonial**: http://localhost:3000/submit
- **View Testimonials**: http://localhost:3000/testimonials  
- **Admin Dashboard**: http://localhost:3002
- **API Documentation**: http://localhost:3001/api/docs

### 4. Default Admin Login

- **Email**: admin@testimonials.com
- **Password**: admin123

⚠️ **Change the default password immediately in production!**

## ⚙️ Configuration

### Environment Variables

Create or modify environment variables in `docker-compose.yml`:

```yaml
environment:
  # Database Configuration
  DATABASE_URL: postgresql://testimonials:testimonials123@postgres:5432/testimonials
  
  # Security
  JWT_SECRET: your-super-secret-jwt-key-change-in-production
  
  # Rate Limiting
  RATE_LIMIT_ENABLED: "true"
  RATE_LIMIT_WINDOW_MS: "3600000"  # 1 hour in milliseconds
  RATE_LIMIT_MAX: "3"              # 3 submissions per hour per IP
  
  # Server
  PORT: "3001"
  NODE_ENV: "development"
```

### Database Configuration

To change database credentials:

1. Update the `postgres` service environment in `docker-compose.yml`:
```yaml
postgres:
  environment:
    POSTGRES_DB: your_db_name
    POSTGRES_USER: your_username
    POSTGRES_PASSWORD: your_password
```

2. Update the `DATABASE_URL` in the backend service to match:
```yaml
backend:
  environment:
    DATABASE_URL: postgresql://your_username:your_password@postgres:5432/your_db_name
```

### Admin Interface Configuration

The admin dashboard runs on a separate port (3002) and requires container rebuilding when code changes:

```bash
# Rebuild admin interface after changes
docker compose build admin
docker compose up -d admin

# Or rebuild all containers
docker compose down && docker compose up -d
```

### Port Configuration

To change application ports, update the `ports` mapping in `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "8080:80"  # Change 3000 to 8080 (public pages)

admin:
  ports:
    - "8082:80"  # Change 3002 to 8082 (admin dashboard)

backend:
  ports:
    - "8081:3001"  # Change 3001 to 8081 (API server)
```

## 🛠️ Development

### Running Individual Services

```bash
# Backend only
docker-compose up backend postgres

# Frontend only  
docker-compose up frontend

# Admin dashboard only
docker-compose up admin
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Database Access

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U testimonials -d testimonials

# Common queries
SELECT * FROM testimonials ORDER BY submitted_at DESC LIMIT 10;
SELECT * FROM users;
```

### Hot Reload Development

The containers are configured for hot reload:
- **Backend**: nodemon watches for file changes
- **Admin Frontend**: Vite dev server with hot module replacement
- **Public Frontend**: nginx serves static files (manual refresh needed)

### Building for Production

```bash
# Build all containers
docker-compose build

# Build specific service
docker-compose build backend
```

## 📊 Database Schema

### Testimonials Table
```sql
CREATE TABLE testimonials (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    testimonial_text TEXT NOT NULL CHECK (LENGTH(testimonial_text) >= 50 AND LENGTH(testimonial_text) <= 500),
    star_rating INTEGER NOT NULL CHECK (star_rating >= 1 AND star_rating <= 5),
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('Agency Client', 'Skool Community Member')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_featured BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    submitted_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP DEFAULT NULL,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(status);
CREATE INDEX IF NOT EXISTS idx_testimonials_submitted_at ON testimonials(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_approved_at ON testimonials(approved_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_featured, approved_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_visible ON testimonials(is_visible, status, approved_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_not_deleted ON testimonials(deleted_at) WHERE deleted_at IS NULL;
```

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- Index for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

## 🔒 Security Features

### Authentication & Authorization
- JWT-based admin authentication
- CSRF token protection for state-changing operations
- Secure password hashing with bcrypt

### Input Protection
- Joi schema validation for all inputs
- XSS protection with input sanitization
- Honeypot fields for spam detection
- Rate limiting (3 submissions per hour per IP)

### Security Headers
- Helmet.js for security headers
- CORS configuration for cross-origin requests
- Content Security Policy (CSP)
- XSS Protection headers

## 🧪 API Documentation

### Public Endpoints

#### Get Testimonials
```
GET /api/testimonials
Query Parameters:
- limit: Number of testimonials (default: 50)
- offset: Skip number (default: 0)  
- featured: Filter featured testimonials (true/false)
```

#### Submit Testimonial
```
POST /api/testimonials
Body: {
  "full_name": "John Doe",
  "email": "john@example.com", 
  "testimonial_text": "Great service...",
  "star_rating": 5,
  "source_type": "Agency Client"
}
```

### Admin Endpoints

All admin endpoints require JWT authentication header:
```
Authorization: Bearer <jwt_token>
X-CSRF-Token: <csrf_token>
```

#### Admin Authentication
```
POST /api/auth/login
Body: { "email": "admin@testimonials.com", "password": "admin123" }
```

#### Manage Testimonials
```
GET /api/admin/testimonials/pending              # Get pending testimonials
GET /api/admin/testimonials                      # Get all testimonials
POST /api/admin/testimonials/:id/approve         # Approve testimonial
POST /api/admin/testimonials/:id/reject          # Reject testimonial
PATCH /api/admin/testimonials/:id/featured       # Toggle featured status
PATCH /api/admin/testimonials/:id/visibility     # Toggle visibility (show/hide)
DELETE /api/admin/testimonials/:id               # Soft delete testimonial
```

#### Visibility Control
```
PATCH /api/admin/testimonials/:id/visibility
Body: { "visible": true }  # true to show, false to hide
```

#### Soft Deletion
```
DELETE /api/admin/testimonials/:id
# Sets deleted_at timestamp, testimonial is hidden but recoverable
```

## 🐛 Troubleshooting

### Common Issues

#### Services Won't Start
```bash
# Check if ports are in use
netstat -tulpn | grep :3000  # Public frontend
netstat -tulpn | grep :3001  # API backend
netstat -tulpn | grep :3002  # Admin dashboard

# Stop conflicting services or change ports in docker-compose.yml
```

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Reset database
docker-compose down
docker volume rm testimonials_postgres_data
docker-compose up -d
```

#### 502 Bad Gateway Errors
```bash
# Check backend logs
docker-compose logs backend

# Rebuild backend if dependencies changed
docker-compose build backend
docker-compose up -d backend
```

#### Admin Login Issues
```bash
# Reset admin password in database
docker compose exec postgres psql -U testimonials -d testimonials
UPDATE users SET password_hash = '$2a$10$hr2Em5LT7QzyWeeZ55GFcujoJrFVJuKRSQRAAWAwFmo8kX8Z8Fvna' WHERE email = 'admin@testimonials.com';
# This sets password back to: admin123
```

#### Admin Interface Not Loading
```bash
# Rebuild admin container if React code changes
docker compose build admin
docker compose up -d admin

# Check admin container logs
docker compose logs admin
```

#### Styling Issues
```bash
# For public pages: changes are immediate (static files)
# For admin dashboard: requires container rebuild
docker compose build admin && docker compose up -d admin
```

### Development Debugging

#### Enable Debug Logs
Add to backend environment in docker-compose.yml:
```yaml
DEBUG: "testimonials:*"
LOG_LEVEL: "debug"
```

#### Access Container Shell
```bash
docker compose exec backend sh
docker compose exec postgres psql -U testimonials -d testimonials
docker compose exec admin sh
```

## 📝 Contributing

### Code Style
- Backend: ES6+ with Express.js conventions
- Frontend: React functional components with hooks
- Admin UI: Tailwind CSS v4 with shadcn/ui patterns
- Public UI: Unified Tailwind design system
- Database: PostgreSQL with proper indexing and soft deletion
- Security: Follow OWASP guidelines with comprehensive validation

### Git Workflow
1. Create feature branch from main
2. Make changes with descriptive commits
3. Test locally with `docker compose up -d`
4. Rebuild containers if needed: `docker compose build`
5. Submit pull request with description

### Testing
```bash
# Run backend tests (when implemented)
docker compose exec backend npm test

# Run frontend tests (when implemented)  
docker compose exec admin npm test

# Manual testing checklist
# 1. Submit testimonial via /submit
# 2. Login to admin at :3002
# 3. Approve/reject testimonials
# 4. Test show/hide functionality
# 5. Test soft deletion
# 6. View public testimonials at /testimonials
```

## 📄 License

This project is proprietary software for AI/Automation Agency testimonial collection.

## 🆘 Support

For technical issues:
1. Check this README first
2. Review logs: `docker compose logs -f`
3. Check existing documentation in `/Docs/`
4. Contact the development team

## 🔄 Recent Updates

### Latest Features (Phase 2 Enhanced)
- ✅ **Visibility Control**: Show/hide testimonials without deletion
- ✅ **Soft Deletion**: Recoverable testimonial deletion
- ✅ **Enhanced Admin UI**: Professional dashboard with comprehensive controls
- ✅ **Modern Styling**: Tailwind CSS v4 with shadcn/ui design system
- ✅ **Improved Pagination**: Professional styling for public testimonials page
- ✅ **Database Optimization**: Performance indexes and data integrity constraints

### Admin Dashboard Features
- Approve/reject testimonials with confirmation dialogs
- Toggle featured status with visual indicators
- Show/hide testimonials from public view
- Soft delete with recovery capability
- Real-time statistics and filtering
- Responsive design for mobile administration

---

**Last Updated**: 2025-06-26
**Version**: Phase 2 Enhanced Complete