# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a testimonial collection and display system designed to gather social proof from AI/Automation Agency clients and Skool community members. The system enables embedding collection forms and testimonial displays across company websites.

## Architecture Overview

The system follows a 4-phase implementation approach (see `/Docs/tasks.md`):

### Phase 1: Proof of Concept MVP (Weeks 1-2)
- **Backend**: Node.js/Express API with PostgreSQL database
- **Development Environment**: Docker Compose orchestrating backend, frontend, and PostgreSQL containers
- **Admin Interface**: Simple vanilla HTML/JS admin interface with environment variable authentication
- **Collection**: Basic web form at `/submit` for testimonial submissions  
- **Display**: Public page at `/testimonials` showing approved testimonials

### Phase 2: Production-Ready Core (Weeks 3-4)
- **Admin Dashboard**: React SPA replacing vanilla HTML interface
- **Security**: CAPTCHA integration, proper input validation, rate limiting
- **API**: Enhanced validation, error handling, JWT authentication

### Phase 3: Embeddable Widgets (Weeks 5-6)
- **Display Widget**: Vanilla JS widget for embedding testimonials on external sites
- **Collection Widget**: Cross-domain form submission widget
- **Widget Management**: Admin controls for embed code generation and customization

### Phase 4: Production & Scale (Weeks 7-8)
- **Advanced Features**: Bulk operations, enhanced search/filtering, email notifications
- **Performance**: Database optimization, caching, CDN setup
- **Deployment**: Production infrastructure, monitoring, documentation

## Database Schema

Core testimonials table includes:
- Essential fields: full_name, email, testimonial_text, star_rating, source_type, status
- Optional fields: job_title, company_name, linkedin_url, twitter_handle
- Metadata: submitted_at, approved_at, approved_by, ip_address, is_featured

## API Structure

### Public Endpoints
- `GET /api/testimonials` - Fetch approved testimonials with filtering
- `POST /api/testimonials` - Submit new testimonial

### Admin Endpoints  
- `GET /api/admin/testimonials/pending` - List pending reviews
- `POST /api/admin/testimonials/{id}/approve` - Approve testimonial
- `POST /api/admin/testimonials/{id}/reject` - Reject testimonial
- `PUT /api/admin/testimonials/{id}` - Edit testimonial

## Development Environment

### Docker Compose Setup
- **Backend**: Node.js/Express API container
- **Frontend**: Static file server for admin interface (nginx in Phase 1)
- **Database**: PostgreSQL container with persistent volumes
- **Networking**: Internal Docker network for service communication
- **Development**: Hot reload and volume mounting for rapid iteration

### Common Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service_name]

# Access database
docker-compose exec postgres psql -U testimonials -d testimonials

# Rebuild after changes
docker-compose build [service_name]
```

## Development Guidelines

### Phase-Based Development
- **Phase 1 is make-or-break** - Core system must work before proceeding
- Each phase must be fully functional before moving to next phase
- Start simple (vanilla HTML/JS) before adding framework complexity

### Security Implementation
- Basic security measures integrated throughout development, not deferred
- Input sanitization and validation on all endpoints
- Rate limiting: 1 submission per IP per 24 hours
- Environment-based configuration for sensitive data

### Widget Architecture
- **Display widget before collection widget** - Display has less cross-domain complexity
- Iframe-based embedding for security isolation
- Vanilla JS for minimal impact on host websites
- CORS handling for cross-domain API requests

### MVP Success Criteria (End of Phase 1)
System must demonstrate:
- Testimonial submission via web form
- Admin approval/rejection via web interface  
- Public display of approved testimonials
- Basic validation and security measures
- Ability to handle expected load

## Key Technical Decisions

- **Backend**: Node.js/Express recommended for development speed
- **Database**: PostgreSQL for data integrity and performance
- **Admin UI**: Start with vanilla HTML/JS, migrate to React in Phase 2
- **Widgets**: Vanilla JS to minimize host site impact
- **Authentication**: Environment variable auth for MVP, JWT for production
- **Spam Prevention**: Honeypot fields initially, CAPTCHA in Phase 2

## File Structure

- `/Docs/` - Project documentation
  - `testimonial_prd.md` - Complete product requirements document
  - `tasks.md` - Detailed development task breakdown
- `/app/` - Application code (to be developed)

## Important Constraints

### In Scope
- Web-based testimonial collection and display
- Embeddable widgets for external websites
- Admin dashboard for moderation
- Basic customization (colors, fonts)

### Out of Scope  
- Mobile applications
- Advanced analytics/reporting
- Skool platform API integration
- Video testimonial collection
- Multi-language support

Refer to `/Docs/testimonial_prd.md` for complete functional requirements and `/Docs/tasks.md` for detailed implementation planning.