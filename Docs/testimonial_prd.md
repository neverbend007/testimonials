# Testimonial Collection System - Product Requirements Document

## 1. Executive Summary

### Product Overview
A lean testimonial collection and display system designed to gather social proof from AI/Automation Agency clients and Skool community members. The system enables embedding collection forms and testimonial displays across company websites.

### Business Objectives
- **Primary**: Generate social proof content for marketing and lead generation
- **Secondary**: Streamline testimonial collection process from clients and community members
- **Success Metrics**: Number of testimonials collected, conversion rate improvement on pages with testimonials

## 2. Product Scope

### In Scope
- Web-based testimonial collection forms
- Embeddable widgets for websites
- Admin dashboard for review moderation
- Public API for testimonial display
- Basic customization (colors, fonts)
- CAPTCHA spam protection

### Out of Scope
- Mobile application
- Advanced analytics/reporting
- Integration with Skool platform API
- Automated sentiment analysis
- Video testimonial collection
- Multi-language support

## 3. User Stories & Requirements

### 3.1 End Users (Reviewers)

**As a satisfied client/community member, I want to:**
- Submit a written testimonial with star rating
- Include my name, title, and social links
- Complete the process quickly (< 2 minutes)
- Know my testimonial will be reviewed before publication

### 3.2 Website Visitors

**As a potential customer, I want to:**
- Read authentic testimonials from real users
- See star ratings and reviewer credentials
- Filter/browse testimonials easily
- Trust that testimonials are genuine

### 3.3 Admin Users

**As an admin, I want to:**
- Review submitted testimonials before approval
- Approve, reject, or request edits to submissions
- Moderate content for appropriateness
- Set display priority for featured testimonials
- Customize widget appearance to match brand

## 4. Functional Requirements

### 4.1 Testimonial Collection

#### Collection Form Fields
- **Required Fields:**
  - Full Name
  - Star Rating (1-5 stars)
  - Testimonial Text (min 50 chars, max 500 chars)
  - Source Type (dropdown: "Agency Client" | "Skool Community Member")

- **Optional Fields:**
  - Job Title/Role
  - Company Name
  - LinkedIn URL
  - Twitter/X Handle

#### Form Validation
- All required fields must be completed
- Email format validation
- Text length validation
- CAPTCHA verification required
- Rate limiting: 1 submission per IP per 24 hours

#### Submission Process
1. User completes form
2. CAPTCHA verification
3. Form validation
4. Submission stored with "Pending" status
5. Confirmation message displayed
6. Admin notification sent

### 4.2 Testimonial Display

#### Display Components
- Star rating visualization
- Testimonial text
- Reviewer name and title
- Company name (if provided)
- Social links (if provided)
- Submission date
- Source badge ("Agency Client" or "Community Member")

#### Display Options
- Grid layout (2-3 columns)
- Carousel/slider format
- Single featured testimonial
- List view with pagination

### 4.3 Widget System

#### Collection Widget
```html
<!-- Embeddable collection form -->
<script src="https://your-domain.com/widgets/collect.js"></script>
<div id="testimonial-form" data-api-key="xxx" data-theme="light"></div>
```

#### Display Widget
```html
<!-- Embeddable testimonial display -->
<script src="https://your-domain.com/widgets/display.js"></script>
<div id="testimonials" data-api-key="xxx" data-layout="grid" data-count="6"></div>
```

#### Widget Customization
- Primary color selection
- Font family selection
- Light/dark theme toggle
- Border radius adjustment
- Layout selection (grid/carousel/list)

### 4.4 Admin Dashboard

#### Dashboard Features
- **Pending Reviews Queue**
  - List of submissions awaiting approval
  - Preview testimonial with all submitted data
  - Approve/Reject/Request Edit actions
  - Batch operations for multiple reviews

- **Approved Reviews Management**
  - Search and filter approved testimonials
  - Edit display priority (featured/normal)
  - Disable/re-enable published testimonials
  - Export testimonials (CSV format)

- **Widget Management**
  - Generate embed codes
  - Preview widget appearance
  - Customize widget styling
  - API key management

#### Admin Actions
- **Approve**: Publish testimonial publicly
- **Reject**: Decline with optional reason
- **Request Edit**: Send feedback for revision
- **Feature**: Set high display priority
- **Archive**: Remove from public display

## 5. Technical Requirements

### 5.1 System Architecture

#### Backend Components
- **API Server**: RESTful API for all operations
- **Database**: Store testimonials, admin users, settings
- **File Storage**: Static assets for widgets
- **Email Service**: Admin notifications
- **CAPTCHA Service**: Google reCAPTCHA integration

#### Frontend Components
- **Admin Dashboard**: React-based SPA
- **Collection Widget**: Vanilla JS embeddable form
- **Display Widget**: Vanilla JS embeddable display
- **Widget Builder**: Admin tool for customization

### 5.2 API Specifications

#### Public Endpoints
```
GET /api/testimonials
- Query params: limit, offset, source, featured
- Returns: Array of approved testimonials

POST /api/testimonials
- Body: Testimonial submission data
- Returns: Submission confirmation
```

#### Admin Endpoints
```
GET /api/admin/testimonials/pending
POST /api/admin/testimonials/{id}/approve
POST /api/admin/testimonials/{id}/reject
PUT /api/admin/testimonials/{id}
DELETE /api/admin/testimonials/{id}
```

### 5.3 Data Schema

#### Testimonials Table
```sql
CREATE TABLE testimonials (
    id UUID PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    job_title VARCHAR(100),
    company_name VARCHAR(100),
    testimonial_text TEXT NOT NULL,
    star_rating INTEGER NOT NULL CHECK (star_rating >= 1 AND star_rating <= 5),
    source_type VARCHAR(50) NOT NULL,
    linkedin_url VARCHAR(255),
    twitter_handle VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    is_featured BOOLEAN DEFAULT false,
    submitted_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    approved_by UUID,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5.4 Security Requirements

#### Data Protection
- HTTPS required for all connections
- Input sanitization and validation
- SQL injection prevention
- XSS protection in widgets
- CSRF protection for admin actions

#### Access Control
- Admin authentication required
- API key validation for widgets
- Rate limiting on public endpoints
- IP-based submission throttling

#### Privacy Compliance
- Clear data usage disclosure
- Option to request data deletion
- Secure data storage practices
- No unnecessary data collection

## 6. Non-Functional Requirements

### 6.1 Performance
- Page load impact: < 100ms additional load time
- API response time: < 500ms for testimonial fetching
- Widget rendering: < 200ms after DOM ready
- Database queries: < 100ms average response time

### 6.2 Scalability
- Support for 10,000+ testimonials
- Handle 1,000+ concurrent widget loads
- Horizontal scaling capability
- CDN integration for widget assets

### 6.3 Reliability
- 99.9% uptime target
- Graceful degradation if service unavailable
- Automatic failover for critical components
- Regular automated backups

### 6.4 Usability
- Mobile-responsive widgets
- Accessible design (WCAG 2.1 AA)
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Intuitive admin interface

## 7. Implementation Phases

### Phase 1: Core System (Weeks 1-3)
- Basic API development
- Database schema implementation
- Simple collection form
- Basic admin dashboard
- CAPTCHA integration

### Phase 2: Widget System (Weeks 4-5)
- Embeddable collection widget
- Embeddable display widget
- Widget customization options
- Cross-domain security implementation

### Phase 3: Enhancement (Weeks 6-7)
- Advanced admin features
- Widget styling improvements
- Performance optimizations
- Testing and bug fixes

### Phase 4: Launch Preparation (Week 8)
- Security audit
- Load testing
- Documentation completion
- Deployment and monitoring setup

## 8. Success Criteria

### Launch Metrics
- System deployed and operational
- First 10 testimonials collected and approved
- Widgets successfully embedded on company website
- Admin users trained and comfortable with system

### Post-Launch KPIs (3 months)
- 100+ testimonials collected
- 95%+ widget uptime
- < 2 hour average approval time
- Measurable improvement in website conversion rates

## 9. Risks & Mitigation

### Technical Risks
- **Widget compatibility issues**: Extensive cross-browser testing
- **Performance impact on host sites**: Lightweight implementation and CDN usage
- **Security vulnerabilities**: Regular security audits and penetration testing

### Business Risks
- **Low adoption**: Clear communication of benefits and easy implementation
- **Spam submissions**: Robust CAPTCHA and moderation workflows
- **Negative testimonials**: Clear submission guidelines and approval process

## 10. Appendices

### A. Competitor Analysis
- Trustpilot: Full-featured but complex
- Google Reviews: Limited customization
- Testimonial.to: Good reference for simplicity

### B. Technical Stack Recommendations
- **Backend**: Node.js/Express or Python/FastAPI
- **Database**: PostgreSQL
- **Frontend**: React for admin, Vanilla JS for widgets
- **Hosting**: Vercel/Netlify for frontend, Railway/Heroku for backend
- **CDN**: Cloudflare for widget delivery

### C. Wireframes
[Link to design mockups - to be created]