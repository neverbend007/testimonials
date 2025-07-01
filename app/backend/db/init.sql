-- Testimonials Database Schema
-- Essential fields only for Phase 1 MVP

CREATE TABLE IF NOT EXISTS testimonials (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    testimonial_text TEXT NOT NULL CHECK (LENGTH(testimonial_text) >= 50 AND LENGTH(testimonial_text) <= 500),
    star_rating INTEGER NOT NULL CHECK (star_rating >= 1 AND star_rating <= 5),
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('Agency Client', 'Skool Community Member')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(status);
CREATE INDEX IF NOT EXISTS idx_testimonials_submitted_at ON testimonials(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_approved_at ON testimonials(approved_at DESC);

-- Users table for admin authentication
CREATE TABLE IF NOT EXISTS users (
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

-- Insert default admin user (password: admin123)
INSERT INTO users (name, email, password_hash) 
VALUES 
    ('Admin User', 'admin@testimonials.com', '$2a$10$Xq8xGsz9K3l4n8p1Y2uG2.LmN7vO5pQ3rT6wF8zB4xC1aE2dH9iJ0k')
ON CONFLICT (email) DO NOTHING;

-- Add is_featured column to testimonials table
ALTER TABLE testimonials 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Index for featured testimonials
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_featured, approved_at DESC);

-- Insert some sample data for testing
INSERT INTO testimonials (full_name, email, testimonial_text, star_rating, source_type, status, approved_at, is_featured) 
VALUES 
    ('John Smith', 'john@example.com', 'Amazing service! The AI automation saved us countless hours and significantly improved our workflow efficiency.', 5, 'Agency Client', 'approved', NOW(), true),
    ('Sarah Johnson', 'sarah@example.com', 'The Skool community is incredibly supportive. I learned so much about automation and business growth strategies here.', 5, 'Skool Community Member', 'approved', NOW(), false),
    ('Mike Wilson', 'mike@example.com', 'Outstanding results! The team delivered exactly what they promised and exceeded our expectations in every way.', 4, 'Agency Client', 'approved', NOW(), false);

-- Insert pending testimonial for testing approval workflow
INSERT INTO testimonials (full_name, email, testimonial_text, star_rating, source_type, status) 
VALUES 
    ('Jane Doe', 'jane@example.com', 'Currently testing the approval process. This testimonial should appear in the pending queue for admin review.', 4, 'Skool Community Member', 'pending');

-- API Keys table for widget authentication
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    key_id VARCHAR(32) UNIQUE NOT NULL,
    key_secret VARCHAR(64) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    domain_restrictions TEXT[], -- Array of allowed domains
    rate_limit_per_hour INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP,
    usage_count INTEGER DEFAULT 0
);

-- Indexes for API keys
CREATE INDEX IF NOT EXISTS idx_api_keys_key_id ON api_keys(key_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON api_keys(created_by);

-- Insert default API key for testing
INSERT INTO api_keys (key_id, key_secret, name, description, created_by) 
VALUES 
    ('demo_key_12345', 'demo_secret_67890abcdef', 'Demo API Key', 'Default API key for testing widgets', 1)
ON CONFLICT (key_id) DO NOTHING;