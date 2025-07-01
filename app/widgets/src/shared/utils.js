/**
 * Shared utilities for testimonials widgets
 */

// Default configuration
export const DEFAULT_CONFIG = {
  apiBaseUrl: 'http://localhost:3001/api',
  theme: 'light',
  layout: 'grid',
  count: 6,
  showFeaturedOnly: false,
  autoRefresh: false,
  refreshInterval: 30000,
  containerClass: 'testimonials-widget',
  primaryColor: '#3b82f6', // Kept for backward compatibility
  borderRadius: '8px',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  
  // Comprehensive color customization
  colors: {
    // Widget container
    widgetBackground: '#ffffff',
    
    // Card appearance
    cardBackground: '#ffffff',
    cardBorder: '#e5e7eb',
    cardBorderHover: '#d1d5db',
    
    // Typography
    primaryText: '#111827',
    secondaryText: '#374151',
    mutedText: '#9ca3af',
    
    // Star ratings
    starFilled: '#fbbf24',
    starEmpty: '#d1d5db',
    
    // Badges
    badgeSecondaryBg: '#f3f4f6',
    badgeSecondaryText: '#1f2937',
    badgeFeaturedBg: '#fef3c7',
    badgeFeaturedText: '#92400e',
    
    // Interactive (primary color - can override the top-level primaryColor)
    primary: '#3b82f6'
  }
};

// API utilities
export class ApiClient {
  constructor(config) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async fetchTestimonials(params = {}) {
    try {
      const url = new URL(`${this.config.apiBaseUrl}/testimonials`);
      
      // Add query parameters
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.testimonials || [];
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      throw error;
    }
  }

  async submitTestimonial(testimonialData) {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(`${this.config.apiBaseUrl}/testimonials`, {
        method: 'POST',
        headers,
        mode: 'cors',
        body: JSON.stringify(testimonialData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Submission failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      throw error;
    }
  }
}

// CSS utilities
export class StyleManager {
  constructor(config, containerId) {
    this.config = config;
    this.containerId = containerId;
    this.styleId = `testimonials-widget-styles-${containerId}`;
  }

  injectStyles() {
    // Remove existing styles for this widget
    const existingStyle = document.getElementById(this.styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = this.styleId;
    style.textContent = this.generateCSS();
    document.head.appendChild(style);
  }

  generateCSS() {
    const { primaryColor, borderRadius, fontFamily, theme, colors } = this.config;
    const containerId = this.containerId;
    
    const isDark = theme === 'dark';
    
    // Use configurable colors with fallbacks for backward compatibility
    const finalColors = {
      // Merge default colors with user-provided colors
      ...DEFAULT_CONFIG.colors,
      ...colors,
      // Backward compatibility: if primaryColor is set but colors.primary isn't customized,
      // use primaryColor
      primary: (colors?.primary && colors.primary !== DEFAULT_CONFIG.colors.primary) 
        ? colors.primary 
        : primaryColor
    };

    // Theme-aware colors (some colors might change based on theme)
    const bgColor = isDark ? '#1f2937' : finalColors.cardBackground;
    const textColor = isDark ? '#f9fafb' : finalColors.primaryText;
    const borderColor = isDark ? '#374151' : finalColors.cardBorder;
    const mutedColor = isDark ? '#9ca3af' : finalColors.mutedText;

    // CSS Variables using configurable colors
    const cssVariables = `
      --widget-bg: ${finalColors.widgetBackground};
      --widget-card-bg: ${finalColors.cardBackground};
      --widget-card-border: ${finalColors.cardBorder};
      --widget-card-border-hover: ${finalColors.cardBorderHover};
      --widget-text-primary: ${finalColors.primaryText};
      --widget-text-secondary: ${finalColors.secondaryText};
      --widget-text-muted: ${finalColors.mutedText};
      --widget-star-filled: ${finalColors.starFilled};
      --widget-star-empty: ${finalColors.starEmpty};
      --widget-badge-secondary-bg: ${finalColors.badgeSecondaryBg};
      --widget-badge-secondary-text: ${finalColors.badgeSecondaryText};
      --widget-badge-featured-bg: ${finalColors.badgeFeaturedBg};
      --widget-badge-featured-text: ${finalColors.badgeFeaturedText};
      --widget-primary: ${finalColors.primary};
      
      // Legacy variables for backward compatibility
      --gray-100: ${finalColors.badgeSecondaryBg};
      --gray-200: ${finalColors.cardBorder};
      --gray-300: ${finalColors.starEmpty};
      --gray-700: ${finalColors.secondaryText};
      --gray-800: ${finalColors.badgeSecondaryText};
      --gray-900: ${finalColors.primaryText};
      --warning-100: ${finalColors.badgeFeaturedBg};
      --warning-400: ${finalColors.starFilled};
      --warning-500: #f59e0b;
      --warning-800: ${finalColors.badgeFeaturedText};
    `;

    // Helper function to create selectors for both inline and modal contexts
    const createSelector = (selector) => {
      return `#${containerId} ${selector}, #${containerId}-modal-overlay ${selector}`;
    };

    return `
      #${containerId} {
        font-family: ${fontFamily};
        color: ${textColor};
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        ${cssVariables}
      }

      #${containerId} * {
        box-sizing: border-box;
      }

      #${containerId} .widget-container {
        background: var(--widget-bg);
        border: 1px solid ${borderColor};
        border-radius: ${borderRadius};
        padding: 1.5rem;
        width: 100%;
      }

      #${containerId} .testimonials-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-top: 1rem;
      }

      #${containerId} .testimonials-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 1rem;
      }

      #${containerId} .testimonials-list .testimonial-card {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem;
      }

      #${containerId} .testimonials-list .testimonial-content {
        flex: 1;
      }

      #${containerId} .testimonials-list .testimonial-header {
        margin-bottom: 0.5rem;
      }

      #${containerId} .testimonials-carousel {
        position: relative;
        overflow: hidden;
        margin-top: 1rem;
      }

      #${containerId} .testimonials-carousel .carousel-track {
        display: flex;
        transition: transform 0.3s ease;
        gap: 1.5rem;
      }

      #${containerId} .testimonials-carousel .testimonial-card {
        flex: 0 0 300px;
        min-width: 300px;
      }

      #${containerId} .carousel-controls {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        margin-top: 1rem;
      }

      #${containerId} .carousel-button {
        background: ${primaryColor};
        color: white;
        border: none;
        border-radius: 50%;
        width: 2.5rem;
        height: 2.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.2s ease;
      }

      #${containerId} .carousel-button:hover {
        background: ${primaryColor}dd;
      }

      #${containerId} .carousel-button:disabled {
        background: ${borderColor};
        cursor: not-allowed;
      }

      #${containerId} .carousel-dots {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }

      #${containerId} .carousel-dot {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 50%;
        background: ${borderColor};
        cursor: pointer;
        transition: background-color 0.2s ease;
      }

      #${containerId} .carousel-dot.active {
        background: ${primaryColor};
      }

      #${containerId} .testimonials-single {
        margin-top: 1rem;
      }

      #${containerId} .testimonials-single .testimonial-card {
        max-width: 600px;
        margin: 0 auto;
        text-align: center;
      }

      #${containerId} .testimonials-single .testimonial-text {
        font-size: 1.1rem;
        font-style: italic;
        margin-bottom: 1.5rem;
      }

      #${containerId} .testimonials-single .testimonial-author {
        font-size: 1.1rem;
      }

      #${containerId} .testimonial-card {
        background: var(--widget-card-bg) !important;
        border-radius: 0.75rem !important;
        padding: 1.5rem !important;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important;
        border: 1px solid var(--widget-card-border) !important;
        transition: all 0.2s ease !important;
        display: flex !important;
        flex-direction: column !important;
        margin: 0 !important;
        box-sizing: border-box !important;
      }

      #${containerId} .testimonial-card:hover {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        border-color: var(--widget-card-border-hover) !important;
      }

      #${containerId} .testimonial-card.featured {
        border-left: 4px solid var(--widget-primary) !important;
        background: linear-gradient(135deg, var(--widget-badge-featured-bg), var(--widget-card-bg)) !important;
      }

      #${containerId} .testimonial-header {
        margin-bottom: 1rem !important;
        display: block !important;
      }

      #${containerId} .testimonial-meta {
        display: flex !important;
        justify-content: space-between !important;
        align-items: flex-start !important;
        margin-bottom: 0.5rem !important;
      }

      #${containerId} .testimonial-author {
        font-weight: 600 !important;
        color: var(--widget-text-primary) !important;
        margin-bottom: 0.25rem !important;
      }

      #${containerId} .star-display {
        display: flex !important;
        align-items: center !important;
        gap: 0.125rem !important;
        flex-wrap: nowrap !important;
      }

      #${containerId} .star {
        width: 1rem !important;
        height: 1rem !important;
        color: var(--widget-star-filled) !important;
        fill: currentColor !important;
        line-height: 1 !important;
        display: inline-block !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        background: none !important;
        text-decoration: none !important;
        float: none !important;
        position: static !important;
        vertical-align: baseline !important;
        box-sizing: content-box !important;
      }

      #${containerId} .star.empty {
        color: var(--widget-star-empty) !important;
      }

      #${containerId} .testimonial-text {
        font-style: italic !important;
        color: var(--widget-text-secondary) !important;
        line-height: 1.6 !important;
        margin-bottom: 1rem !important;
        flex: 1 !important;
      }

      #${containerId} .testimonial-footer {
        margin-top: auto !important;
        padding-top: 1rem !important;
      }

      #${containerId} .testimonial-footer .badge {
        display: inline !important;
        float: none !important;
        position: static !important;
      }

      #${containerId} .badge {
        display: inline-flex !important;
        align-items: center !important;
        padding: 0.125rem 0.5rem !important;
        border-radius: 9999px !important;
        font-size: 0.625rem !important;
        font-weight: 500 !important;
        line-height: 1 !important;
        margin: 0 !important;
        box-sizing: border-box !important;
      }

      #${containerId} .badge-secondary {
        background-color: var(--widget-badge-secondary-bg) !important;
        color: var(--widget-badge-secondary-text) !important;
      }

      #${containerId} .badge-featured {
        background-color: var(--widget-badge-featured-bg) !important;
        color: var(--widget-badge-featured-text) !important;
      }

      #${containerId} .badge-featured::before {
        content: '⭐' !important;
        margin-right: 0.125rem !important;
        font-size: 0.5rem !important;
      }



      ${createSelector('.widget-header')} {
        text-align: center;
        margin-bottom: 1rem;
      }

      ${createSelector('.widget-title')} {
        font-size: 1.5rem;
        font-weight: 700;
        color: ${textColor};
        margin: 0 0 0.5rem 0;
      }

      ${createSelector('.widget-subtitle')} {
        color: ${mutedColor};
        margin: 0;
      }

      #${containerId} .loading {
        text-align: center;
        padding: 2rem;
        color: ${mutedColor};
      }

      #${containerId} .error {
        text-align: center;
        padding: 2rem;
        color: #dc2626;
        background: #fee2e2;
        border-radius: ${borderRadius};
        margin: 1rem 0;
      }

      #${containerId} .empty {
        text-align: center;
        padding: 2rem;
        color: ${mutedColor};
      }

      #${containerId} .spinner {
        display: inline-block;
        width: 1rem;
        height: 1rem;
        border: 2px solid ${borderColor};
        border-radius: 50%;
        border-top-color: ${primaryColor};
        animation: testimonials-spin 1s linear infinite;
        margin-right: 0.5rem;
      }

      @keyframes testimonials-spin {
        to { transform: rotate(360deg); }
      }

      /* Form Styles for Collection Widget */
      ${createSelector('.form-container')} {
        margin-top: 0;
      }

      ${createSelector('.form-section')} {
        margin-bottom: 1rem;
      }

      ${createSelector('.section-title')} {
        font-size: 1.125rem;
        font-weight: 600;
        color: ${textColor};
        margin-bottom: 0.75rem;
        border-bottom: 2px solid ${borderColor};
        padding-bottom: 0.5rem;
      }

      ${createSelector('.form-field')} {
        margin-bottom: 1rem;
      }

      ${createSelector('.form-label')} {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: ${textColor};
        margin-bottom: 0.5rem;
      }

      ${createSelector('.required')} {
        color: #dc2626;
      }

      ${createSelector('.form-input')},
      ${createSelector('.form-select')},
      ${createSelector('.form-textarea')} {
        width: 100% !important;
        padding: 0.75rem !important;
        border: 1px solid ${borderColor} !important;
        border-radius: ${borderRadius} !important;
        font-size: 0.875rem !important;
        background-color: ${isDark ? '#374151' : '#ffffff'} !important;
        color: ${textColor} !important;
        transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
        box-sizing: border-box !important;
      }

      ${createSelector('.form-input:focus')},
      ${createSelector('.form-select:focus')},
      ${createSelector('.form-textarea:focus')} {
        outline: none !important;
        border-color: ${primaryColor} !important;
        box-shadow: 0 0 0 3px ${primaryColor}20 !important;
      }

      ${createSelector('.form-textarea')} {
        resize: vertical;
        min-height: 100px;
      }

      ${createSelector('.star-rating-input')} {
        display: flex;
        gap: 0.25rem;
        margin: 0.5rem 0;
      }

      ${createSelector('.star-input')} {
        font-size: 1.5rem;
        color: ${borderColor};
        cursor: pointer;
        transition: color 0.2s ease, transform 0.1s ease;
        user-select: none;
      }

      ${createSelector('.star-input:hover')} {
        transform: scale(1.1);
      }

      ${createSelector('.star-input:not(.empty)')} {
        color: #fbbf24;
      }

      ${createSelector('.help-text')} {
        font-size: 0.75rem;
        color: ${mutedColor};
        margin-top: 0.25rem;
      }

      ${createSelector('.char-counter')} {
        font-size: 0.75rem;
        color: ${mutedColor};
        margin-top: 0.25rem;
        text-align: right;
      }

      ${createSelector('.field-error')} {
        font-size: 0.75rem;
        color: #dc2626;
        margin-top: 0.25rem;
      }

      ${createSelector('.field-error.hidden')} {
        display: none;
      }

      ${createSelector('.submit-container')} {
        margin-top: 1rem;
        text-align: center;
      }

      ${createSelector('.submit-button')} {
        background: ${primaryColor} !important;
        color: white !important;
        border: none !important;
        border-radius: ${borderRadius} !important;
        padding: 0.875rem 2rem !important;
        font-size: 1rem !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: background-color 0.2s ease, transform 0.1s ease !important;
        min-width: 200px !important;
      }

      ${createSelector('.submit-button:hover:not(:disabled)')} {
        background: ${primaryColor}dd;
        transform: translateY(-1px);
      }

      ${createSelector('.submit-button:disabled')} {
        background: ${borderColor};
        cursor: not-allowed;
        transform: none;
      }

      ${createSelector('.submit-spinner')} {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      ${createSelector('.submit-spinner.hidden')},
      ${createSelector('.submit-text.hidden')} {
        display: none;
      }

      ${createSelector('.privacy-notice')} {
        margin-top: 1rem;
        padding: 1rem;
        background: ${isDark ? '#374151' : '#f9fafb'};
        border-radius: ${borderRadius};
        border-left: 4px solid ${primaryColor};
      }

      ${createSelector('.privacy-notice small')} {
        color: ${mutedColor};
        line-height: 1.4;
      }

      ${createSelector('.error-message')} {
        background: #fee2e2;
        color: #dc2626;
        padding: 1rem;
        border-radius: ${borderRadius};
        margin-bottom: 1rem;
        border-left: 4px solid #dc2626;
      }

      ${createSelector('.error-message.hidden')} {
        display: none;
      }

      ${createSelector('.success-message')} {
        text-align: center;
        padding: 2rem;
      }

      ${createSelector('.success-icon')} {
        font-size: 3rem;
        color: #10b981;
        margin-bottom: 1rem;
      }

      ${createSelector('.success-message h3')} {
        font-size: 1.5rem;
        font-weight: 700;
        color: ${textColor};
        margin-bottom: 0.5rem;
      }

      ${createSelector('.success-message p')} {
        color: ${mutedColor};
        margin-bottom: 1.5rem;
      }

      ${createSelector('.submit-another-button')} {
        background: transparent;
        color: ${primaryColor};
        border: 2px solid ${primaryColor};
        border-radius: ${borderRadius};
        padding: 0.75rem 1.5rem;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      ${createSelector('.submit-another-button:hover')} {
        background: ${primaryColor};
        color: white;
      }

      /* Modal Components */
      #${containerId}-fab {
        position: fixed !important;
        bottom: 20px !important;
        left: 20px !important;
        width: 80px !important;
        height: 80px !important;
        border-radius: 12px !important;
        background: url('http://localhost:3001/widgets/review-icon.png') no-repeat center center !important;
        background-size: contain !important;
        border: none !important;
        cursor: pointer !important;
        z-index: 9999 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        transition: all 0.2s ease !important;
        text-indent: -9999px !important;
        overflow: hidden !important;
      }

      #${containerId}-fab:hover:not(:disabled) {
        transform: translateY(-2px) scale(1.05) !important;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.15) !important;
        filter: brightness(1.1) !important;
      }

      #${containerId}-fab:active {
        transform: translateY(0) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
      }

      #${containerId}-fab:disabled {
        cursor: not-allowed !important;
        transform: none !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        filter: grayscale(100%) opacity(0.5) !important;
      }

      #${containerId}-modal-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: rgba(0, 0, 0, 0.5) !important;
        z-index: 99999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 1rem !important;
        overflow-y: auto !important;
      }

      #${containerId}-modal-overlay.hidden {
        display: none !important;
      }

      #${containerId}-modal-overlay .modal-content {
        background: ${bgColor} !important;
        border-radius: ${borderRadius} !important;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
        max-width: 600px !important;
        width: 100% !important;
        max-height: 90vh !important;
        overflow-y: auto !important;
        position: relative !important;
        margin: auto !important;
      }

      #${containerId}-modal-overlay .modal-header {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        padding: 1rem 1.5rem 0 1.5rem !important;
      }

      #${containerId}-modal-overlay .modal-close-button {
        background: none !important;
        border: none !important;
        font-size: 1.5rem !important;
        color: ${mutedColor} !important;
        cursor: pointer !important;
        padding: 0.5rem !important;
        line-height: 1 !important;
        border-radius: ${borderRadius} !important;
        transition: background-color 0.2s ease, color 0.2s ease !important;
      }

      #${containerId}-modal-overlay .modal-close-button:hover {
        background: ${borderColor} !important;
        color: ${textColor} !important;
      }

      #${containerId}-modal-overlay .modal-body {
        padding: 1rem 1.5rem 1.5rem 1.5rem !important;
      }

      /* Modal responsive adjustments */
      @media (max-width: 768px) {
        #${containerId}-modal-overlay {
          padding: 0.5rem !important;
        }

        #${containerId}-modal-overlay .modal-content {
          max-height: 95vh !important;
          margin: 0.5rem !important;
        }

        #${containerId}-modal-overlay .modal-header,
        #${containerId}-modal-overlay .modal-body {
          padding: 1rem !important;
        }

        #${containerId}-fab {
          bottom: 16px !important;
          left: 16px !important;
          width: 64px !important;
          height: 64px !important;
        }
      }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        #${containerId} .testimonials-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        #${containerId} .widget-container {
          padding: 1rem;
        }

        #${containerId} .testimonial-card {
          padding: 1rem;
        }
      }
    `;
  }

  removeStyles() {
    const style = document.getElementById(this.styleId);
    if (style) {
      style.remove();
    }
  }
}

// DOM utilities
export function createElement(tag, className = '', textContent = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (textContent) element.textContent = textContent;
  return element;
}

export function createStarRating(rating, maxRating = 5) {
  const container = createElement('div', 'star-display');
  
  for (let i = 1; i <= maxRating; i++) {
    const star = createElement('span', `star ${i <= rating ? '' : 'empty'}`, '★');
    container.appendChild(star);
  }
  
  return container;
}

export function formatDate(dateString) {
  if (!dateString) return 'Unknown date';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid date';
  }
}

// Error handling
export class WidgetError extends Error {
  constructor(message, code = 'WIDGET_ERROR') {
    super(message);
    this.name = 'WidgetError';
    this.code = code;
  }
}

// Configuration validation
export function validateConfig(config) {
  const errors = [];
  
  if (config.count && (config.count < 1 || config.count > 50)) {
    errors.push('count must be between 1 and 50');
  }
  
  if (config.layout && !['grid', 'list', 'carousel', 'single'].includes(config.layout)) {
    errors.push('layout must be one of: grid, list, carousel, single');
  }
  
  if (config.theme && !['light', 'dark'].includes(config.theme)) {
    errors.push('theme must be either light or dark');
  }
  
  if (errors.length > 0) {
    throw new WidgetError(`Configuration errors: ${errors.join(', ')}`, 'CONFIG_ERROR');
  }
  
  return true;
}

// Generate unique ID for widget instances
export function generateWidgetId() {
  return `testimonials-widget-${Math.random().toString(36).substr(2, 9)}`;
}