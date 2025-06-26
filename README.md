# Testimonials Collection System

A comprehensive web application for collecting, managing, and displaying customer testimonials from AI/Automation Agency clients and Skool community members. The system provides a public submission form, admin dashboard for moderation, and embeddable widgets for external websites.

## 🚀 Features

- **Public Testimonial Submission**: Web form with spam protection and validation
- **Admin Dashboard**: React-based interface for approving, rejecting, and managing testimonials
- **Featured Testimonials**: Mark important testimonials for priority display
- **Search & Filtering**: Advanced filtering by text, source type, and rating
- **Pagination**: Efficient handling of large testimonial datasets
- **Security**: CSRF protection, JWT authentication, rate limiting, and input sanitization
- **Responsive Design**: Mobile-first design for all interfaces

## 📋 Project Status

- ✅ **Phase 1**: Proof of Concept MVP (Complete)
- ✅ **Phase 2**: Production-Ready Core (Complete)
- 🔄 **Phase 3**: Embeddable Widgets (Planned)
- 📅 **Phase 4**: Production & Scale (Planned)

## 🏗️ Architecture

### Technology Stack
- **Backend**: Node.js/Express with PostgreSQL database
- **Frontend**: React with Vite build system
- **Admin Interface**: React SPA with Tailwind CSS styling
- **Database**: PostgreSQL with structured testimonial schema
- **Authentication**: JWT tokens with CSRF protection
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
- **Submit Testimonial**: http://localhost:3000/submit.html
- **View Testimonials**: http://localhost:3000/testimonials.html
- **Admin Dashboard**: http://localhost:3000/admin
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

### Port Configuration

To change application ports, update the `ports` mapping in `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "8080:80"  # Change 3000 to 8080

backend:
  ports:
    - "8081:3001"  # Change 3001 to 8081
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
    testimonial_text TEXT NOT NULL,
    star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5),
    source_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    is_featured BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET
);
```

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
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
GET /api/admin/testimonials/pending    # Get pending testimonials
GET /api/admin/testimonials            # Get all testimonials
POST /api/admin/testimonials/:id/approve
POST /api/admin/testimonials/:id/reject
PATCH /api/admin/testimonials/:id/featured
```

## 🐛 Troubleshooting

### Common Issues

#### Services Won't Start
```bash
# Check if ports are in use
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

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
docker-compose exec postgres psql -U testimonials -d testimonials
UPDATE users SET password_hash = '$2a$10$...' WHERE email = 'admin@testimonials.com';
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
docker-compose exec backend sh
docker-compose exec frontend sh
```

## 📝 Contributing

### Code Style
- Backend: ES6+ with Express.js conventions
- Frontend: React functional components with hooks
- Database: PostgreSQL with proper indexing
- Security: Follow OWASP guidelines

### Git Workflow
1. Create feature branch from main
2. Make changes with descriptive commits
3. Test locally with `docker-compose up`
4. Submit pull request with description

### Testing
```bash
# Run backend tests (when implemented)
docker-compose exec backend npm test

# Run frontend tests (when implemented)  
docker-compose exec admin npm test
```

## 📄 License

This project is proprietary software for AI/Automation Agency testimonial collection.

## 🆘 Support

For technical issues:
1. Check this README first
2. Review logs: `docker-compose logs -f`
3. Check existing documentation in `/Docs/`
4. Contact the development team

---

**Last Updated**: 2025-06-26
**Version**: Phase 2 Complete