/**
 * Testimonials Display Widget
 * Embeddable widget for displaying testimonials on external websites
 */

import { 
  ApiClient, 
  StyleManager, 
  createElement, 
  createStarRating, 
  validateConfig, 
  generateWidgetId,
  WidgetError,
  DEFAULT_CONFIG 
} from '../shared/utils.js';

class TestimonialsDisplayWidget {
  constructor(containerId, config = {}) {
    this.containerId = containerId;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.container = null;
    this.apiClient = null;
    this.styleManager = null;
    this.testimonials = [];
    this.isLoading = false;
    this.error = null;

    // Debug logging for widget initialization
    console.log(`[TestimonialsDisplay] Initializing widget ${containerId} with config:`, {
      layout: this.config.layout,
      theme: this.config.theme,
      count: this.config.count,
      apiBaseUrl: this.config.apiBaseUrl
    });

    this.init();
  }

  async init() {
    try {
      // Validate configuration
      validateConfig(this.config);

      // Get container element
      this.container = document.getElementById(this.containerId);
      if (!this.container) {
        throw new WidgetError(`Container element with ID '${this.containerId}' not found`, 'CONTAINER_NOT_FOUND');
      }

      // Initialize API client and style manager
      this.apiClient = new ApiClient(this.config);
      this.styleManager = new StyleManager(this.config, this.containerId);

      // Inject styles
      this.styleManager.injectStyles();

      // Load and render testimonials
      await this.loadTestimonials();

    } catch (error) {
      console.error('Widget initialization error:', error);
      this.renderError(error.message);
    }
  }

  async loadTestimonials() {
    this.setLoading(true);
    this.error = null;

    try {
      const params = {
        limit: this.config.count || 6,
        featured: this.config.showFeaturedOnly || undefined
      };

      this.testimonials = await this.apiClient.fetchTestimonials(params);
      
      // IMPORTANT: Set loading to false BEFORE rendering
      this.setLoading(false);
      this.render();

      // Set up auto-refresh if enabled
      if (this.config.autoRefresh && this.config.refreshInterval > 0) {
        setTimeout(() => this.loadTestimonials(), this.config.refreshInterval);
      }

    } catch (error) {
      console.error('Error loading testimonials:', error);
      this.error = error;
      this.setLoading(false);
      this.renderError(error.message);
    }
  }

  render() {
    if (!this.container) return;

    // Clear previous content
    this.container.innerHTML = '';

    // Create main widget container
    const widgetContainer = createElement('div', 'widget-container');

    // Add header if configured
    if (this.config.showHeader !== false) {
      const header = this.createHeader();
      widgetContainer.appendChild(header);
    }

    // Render testimonials based on layout
    const testimonialsContainer = this.createTestimonialsContainer();
    widgetContainer.appendChild(testimonialsContainer);

    // Add footer if configured
    if (this.config.showFooter) {
      const footer = this.createFooter();
      widgetContainer.appendChild(footer);
    }

    this.container.appendChild(widgetContainer);
  }

  createHeader() {
    const header = createElement('div', 'widget-header');
    
    if (this.config.title) {
      const title = createElement('h2', 'widget-title', this.config.title);
      header.appendChild(title);
    }
    
    if (this.config.subtitle) {
      const subtitle = createElement('p', 'widget-subtitle', this.config.subtitle);
      header.appendChild(subtitle);
    }

    return header;
  }

  createTestimonialsContainer() {
    const container = createElement('div');

    if (this.isLoading) {
      container.appendChild(this.createLoadingState());
    } else if (this.error) {
      container.appendChild(this.createErrorState());
    } else if (this.testimonials.length === 0) {
      container.appendChild(this.createEmptyState());
    } else {
      container.appendChild(this.createTestimonialsList());
    }

    return container;
  }

  createTestimonialsList() {
    const layout = this.config.layout || 'grid';
    const layoutClass = `testimonials-${layout}`;
    const container = createElement('div', layoutClass);

    // Debug logging for layout selection
    console.log(`[TestimonialsDisplay] Widget ${this.containerId} - Using layout: "${layout}" (from config.layout: "${this.config.layout}"), testimonials count: ${this.testimonials.length}, container class: "${layoutClass}"`);

    if (layout === 'carousel') {
      console.log(`[TestimonialsDisplay] Widget ${this.containerId} - Creating carousel layout`);
      return this.createCarouselLayout(container);
    } else if (layout === 'single') {
      console.log(`[TestimonialsDisplay] Widget ${this.containerId} - Creating single layout`);
      return this.createSingleLayout(container);
    } else {
      // Grid and list layouts
      console.log(`[TestimonialsDisplay] Widget ${this.containerId} - Creating ${layout} layout with ${this.testimonials.length} testimonials`);
      this.testimonials.forEach((testimonial, index) => {
        const card = this.createTestimonialCard(testimonial, index, layout);
        container.appendChild(card);
      });
      return container;
    }
  }

  createCarouselLayout(container) {
    try {
      console.log(`[TestimonialsDisplay] Widget ${this.containerId} - Creating carousel with ${this.testimonials.length} testimonials`);
      
      // Validate testimonials data
      if (!this.testimonials || this.testimonials.length === 0) {
        console.warn(`[TestimonialsDisplay] Widget ${this.containerId} - Cannot create carousel: no testimonials available`);
        // Fall back to empty state but maintain carousel container class
        const emptyMessage = createElement('div', 'empty');
        emptyMessage.textContent = 'No testimonials available for carousel';
        container.appendChild(emptyMessage);
        return container;
      }

      // Create carousel track
      const track = createElement('div', 'carousel-track');
      console.log(`[TestimonialsDisplay] Widget ${this.containerId} - Created carousel track`);
      
      this.testimonials.forEach((testimonial, index) => {
        const card = this.createTestimonialCard(testimonial, index, 'carousel');
        track.appendChild(card);
      });
      
      container.appendChild(track);
      console.log(`[TestimonialsDisplay] Widget ${this.containerId} - Added ${this.testimonials.length} cards to carousel track`);
      
      // Add navigation controls if more than one testimonial
      if (this.testimonials.length > 1) {
        const controls = this.createCarouselControls();
        container.appendChild(controls);
        console.log(`[TestimonialsDisplay] Widget ${this.containerId} - Added carousel navigation controls`);
      } else {
        console.log(`[TestimonialsDisplay] Widget ${this.containerId} - Skipping navigation controls (only ${this.testimonials.length} testimonial)`);
      }
      
      // Initialize carousel state
      this.carouselIndex = 0;
      this.carouselTrack = track;
      
      console.log(`[TestimonialsDisplay] Widget ${this.containerId} - Carousel layout created successfully`);
      return container;
      
    } catch (error) {
      console.error(`[TestimonialsDisplay] Widget ${this.containerId} - Error creating carousel layout:`, error);
      // Fall back to grid layout if carousel fails
      console.warn(`[TestimonialsDisplay] Widget ${this.containerId} - Falling back to grid layout due to carousel error`);
      
      // Change container class to grid and create grid layout
      container.className = 'testimonials-grid';
      this.testimonials.forEach((testimonial, index) => {
        const card = this.createTestimonialCard(testimonial, index, 'grid');
        container.appendChild(card);
      });
      return container;
    }
  }

  createSingleLayout(container) {
    // Show only the first testimonial for single layout
    if (this.testimonials.length > 0) {
      const card = this.createTestimonialCard(this.testimonials[0], 0, 'single');
      container.appendChild(card);
    }
    return container;
  }

  createCarouselControls() {
    const controls = createElement('div', 'carousel-controls');
    
    // Previous button
    const prevButton = createElement('button', 'carousel-button');
    prevButton.innerHTML = '‹';
    prevButton.addEventListener('click', () => this.previousSlide());
    
    // Next button  
    const nextButton = createElement('button', 'carousel-button');
    nextButton.innerHTML = '›';
    nextButton.addEventListener('click', () => this.nextSlide());
    
    controls.appendChild(prevButton);
    controls.appendChild(nextButton);
    
    // Dots indicator
    if (this.testimonials.length > 1) {
      const dots = createElement('div', 'carousel-dots');
      this.testimonials.forEach((_, index) => {
        const dot = createElement('div', `carousel-dot ${index === 0 ? 'active' : ''}`);
        dot.addEventListener('click', () => this.goToSlide(index));
        dots.appendChild(dot);
      });
      controls.appendChild(dots);
    }
    
    this.carouselControls = controls;
    return controls;
  }

  previousSlide() {
    if (this.carouselIndex > 0) {
      this.carouselIndex--;
    } else {
      this.carouselIndex = this.testimonials.length - 1;
    }
    this.updateCarousel();
  }

  nextSlide() {
    if (this.carouselIndex < this.testimonials.length - 1) {
      this.carouselIndex++;
    } else {
      this.carouselIndex = 0;
    }
    this.updateCarousel();
  }

  goToSlide(index) {
    this.carouselIndex = index;
    this.updateCarousel();
  }

  updateCarousel() {
    if (!this.carouselTrack) return;
    
    // Calculate transform
    const cardWidth = 300; // Match CSS flex-basis
    const gap = 24; // 1.5rem gap
    const offset = this.carouselIndex * (cardWidth + gap);
    
    this.carouselTrack.style.transform = `translateX(-${offset}px)`;
    
    // Update dots
    if (this.carouselControls) {
      const dots = this.carouselControls.querySelectorAll('.carousel-dot');
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === this.carouselIndex);
      });
    }
  }

  createTestimonialCard(testimonial, index, layout = 'grid') {
    const card = createElement('div', `testimonial-card ${testimonial.is_featured ? 'featured' : ''}`);
    
    if (layout === 'list') {
      // List layout: horizontal layout with content wrapper
      const content = createElement('div', 'testimonial-content');
      
      // Header with author and rating
      const header = createElement('div', 'testimonial-header');
      const meta = createElement('div', 'testimonial-meta');
      const authorInfo = createElement('div');
      const author = createElement('div', 'testimonial-author', testimonial.full_name);
      authorInfo.appendChild(author);
      const starRating = createStarRating(testimonial.star_rating);
      meta.appendChild(authorInfo);
      meta.appendChild(starRating);
      header.appendChild(meta);
      content.appendChild(header);

      // Testimonial text
      const text = createElement('div', 'testimonial-text', testimonial.testimonial_text);
      content.appendChild(text);

      // Footer with badges
      const footer = createElement('div', 'testimonial-footer');
      const sourceBadge = createElement('span', 'badge badge-secondary', testimonial.source_type);
      footer.appendChild(sourceBadge);
      if (testimonial.is_featured) {
        const featuredBadge = createElement('span', 'badge badge-featured', 'Featured');
        footer.appendChild(featuredBadge);
      }
      content.appendChild(footer);
      
      card.appendChild(content);
    } else {
      // Standard layout for grid, carousel, and single
      // Header with author and rating
      const header = createElement('div', 'testimonial-header');
      const meta = createElement('div', 'testimonial-meta');
      const authorInfo = createElement('div');
      const author = createElement('div', 'testimonial-author', testimonial.full_name);
      authorInfo.appendChild(author);
      const starRating = createStarRating(testimonial.star_rating);
      meta.appendChild(authorInfo);
      meta.appendChild(starRating);
      header.appendChild(meta);
      card.appendChild(header);

      // Testimonial text
      const text = createElement('div', 'testimonial-text', testimonial.testimonial_text);
      card.appendChild(text);

      // Footer with badges
      const footer = createElement('div', 'testimonial-footer');
      const sourceBadge = createElement('span', 'badge badge-secondary', testimonial.source_type);
      footer.appendChild(sourceBadge);
      if (testimonial.is_featured) {
        const featuredBadge = createElement('span', 'badge badge-featured', 'Featured');
        footer.appendChild(featuredBadge);
      }
      card.appendChild(footer);
    }

    return card;
  }

  createLoadingState() {
    const loading = createElement('div', 'loading');
    const spinner = createElement('div', 'spinner');
    const text = createElement('span', '', 'Loading testimonials...');
    
    loading.appendChild(spinner);
    loading.appendChild(text);
    
    return loading;
  }

  createErrorState() {
    const error = createElement('div', 'error');
    error.innerHTML = `
      <strong>Unable to load testimonials</strong><br>
      ${this.error?.message || 'Please try again later.'}
    `;
    return error;
  }

  createEmptyState() {
    const empty = createElement('div', 'empty');
    empty.innerHTML = `
      <strong>No testimonials available</strong><br>
      Be the first to share your experience!
    `;
    return empty;
  }

  createFooter() {
    const footer = createElement('div', 'widget-footer');
    
    if (this.config.showPoweredBy !== false) {
      const poweredBy = createElement('div', 'powered-by');
      poweredBy.innerHTML = `
        <small style="color: #9ca3af; font-size: 0.75rem;">
          Powered by <a href="#" style="color: inherit; text-decoration: none;">Testimonials</a>
        </small>
      `;
      footer.appendChild(poweredBy);
    }

    return footer;
  }

  setLoading(loading) {
    this.isLoading = loading;
  }

  renderError(message) {
    if (!this.container) return;
    
    this.container.innerHTML = '';
    const widgetContainer = createElement('div', 'widget-container');
    const errorState = createElement('div', 'error');
    errorState.innerHTML = `
      <strong>Widget Error</strong><br>
      ${message}
    `;
    widgetContainer.appendChild(errorState);
    this.container.appendChild(widgetContainer);
  }

  // Public methods for dynamic updates
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    validateConfig(this.config);
    
    // Re-inject styles with new configuration
    this.styleManager = new StyleManager(this.config, this.containerId);
    this.styleManager.injectStyles();
    
    // Re-render with new configuration
    this.loadTestimonials();
  }

  refresh() {
    this.loadTestimonials();
  }

  destroy() {
    // Clean up styles
    if (this.styleManager) {
      this.styleManager.removeStyles();
    }
    
    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Global widget factory function
window.TestimonialsDisplay = {
  create: function(containerId, config = {}) {
    return new TestimonialsDisplayWidget(containerId, config);
  },

  // Convenience method for quick setup
  init: function(selector, config = {}) {
    const elements = document.querySelectorAll(selector);
    const widgets = [];

    elements.forEach((element, index) => {
      // Generate unique ID if element doesn't have one
      if (!element.id) {
        element.id = generateWidgetId();
      }

      // Parse configuration from data attributes (same as auto-init)
      const dataConfig = {};
      
      if (element.dataset.apiUrl) dataConfig.apiBaseUrl = element.dataset.apiUrl;
      if (element.dataset.theme) dataConfig.theme = element.dataset.theme;
      if (element.dataset.layout) dataConfig.layout = element.dataset.layout;
      if (element.dataset.count) dataConfig.count = parseInt(element.dataset.count);
      if (element.dataset.featured) dataConfig.showFeaturedOnly = element.dataset.featured === 'true';
      if (element.dataset.title) dataConfig.title = element.dataset.title;
      if (element.dataset.subtitle) dataConfig.subtitle = element.dataset.subtitle;
      if (element.dataset.primaryColor) dataConfig.primaryColor = element.dataset.primaryColor;
      if (element.dataset.borderRadius) dataConfig.borderRadius = element.dataset.borderRadius;

      // Parse color data attributes
      const colors = {};
      if (element.dataset.widgetBackground) colors.widgetBackground = element.dataset.widgetBackground;
      if (element.dataset.cardBackground) colors.cardBackground = element.dataset.cardBackground;
      if (element.dataset.cardBorder) colors.cardBorder = element.dataset.cardBorder;
      if (element.dataset.cardBorderHover) colors.cardBorderHover = element.dataset.cardBorderHover;
      if (element.dataset.primaryText) colors.primaryText = element.dataset.primaryText;
      if (element.dataset.secondaryText) colors.secondaryText = element.dataset.secondaryText;
      if (element.dataset.mutedText) colors.mutedText = element.dataset.mutedText;
      if (element.dataset.starFilled) colors.starFilled = element.dataset.starFilled;
      if (element.dataset.starEmpty) colors.starEmpty = element.dataset.starEmpty;
      if (element.dataset.badgeSecondaryBg) colors.badgeSecondaryBg = element.dataset.badgeSecondaryBg;
      if (element.dataset.badgeSecondaryText) colors.badgeSecondaryText = element.dataset.badgeSecondaryText;
      if (element.dataset.badgeFeaturedBg) colors.badgeFeaturedBg = element.dataset.badgeFeaturedBg;
      if (element.dataset.badgeFeaturedText) colors.badgeFeaturedText = element.dataset.badgeFeaturedText;
      if (element.dataset.primary) colors.primary = element.dataset.primary;

      if (Object.keys(colors).length > 0) {
        dataConfig.colors = colors;
      }

      // Debug logging for layout configuration
      console.log(`[TestimonialsDisplay] Widget ${element.id} - Parsed layout from data-layout="${element.dataset.layout}" to config.layout="${dataConfig.layout}"`);

      // Merge data attributes with passed config (data attributes take precedence)
      const finalConfig = { ...config, ...dataConfig };

      // Create widget instance
      const widget = new TestimonialsDisplayWidget(element.id, finalConfig);
      widgets.push(widget);
    });

    return widgets.length === 1 ? widgets[0] : widgets;
  }
};

// Auto-initialize widgets on page load
document.addEventListener('DOMContentLoaded', function() {
  // Look for elements with data-testimonials-display attribute
  const autoInitElements = document.querySelectorAll('[data-testimonials-display]');
  
  autoInitElements.forEach(element => {
    if (!element.id) {
      element.id = generateWidgetId();
    }

    // Parse configuration from data attributes
    const config = {};
    
    if (element.dataset.apiUrl) config.apiBaseUrl = element.dataset.apiUrl;
    if (element.dataset.theme) config.theme = element.dataset.theme;
    if (element.dataset.layout) config.layout = element.dataset.layout;
    if (element.dataset.count) config.count = parseInt(element.dataset.count);
    if (element.dataset.featured) config.showFeaturedOnly = element.dataset.featured === 'true';
    if (element.dataset.title) config.title = element.dataset.title;
    if (element.dataset.subtitle) config.subtitle = element.dataset.subtitle;
    if (element.dataset.primaryColor) config.primaryColor = element.dataset.primaryColor;
    if (element.dataset.borderRadius) config.borderRadius = element.dataset.borderRadius;

    // Parse color data attributes
    const colors = {};
    if (element.dataset.widgetBackground) colors.widgetBackground = element.dataset.widgetBackground;
    if (element.dataset.cardBackground) colors.cardBackground = element.dataset.cardBackground;
    if (element.dataset.cardBorder) colors.cardBorder = element.dataset.cardBorder;
    if (element.dataset.cardBorderHover) colors.cardBorderHover = element.dataset.cardBorderHover;
    if (element.dataset.primaryText) colors.primaryText = element.dataset.primaryText;
    if (element.dataset.secondaryText) colors.secondaryText = element.dataset.secondaryText;
    if (element.dataset.mutedText) colors.mutedText = element.dataset.mutedText;
    if (element.dataset.starFilled) colors.starFilled = element.dataset.starFilled;
    if (element.dataset.starEmpty) colors.starEmpty = element.dataset.starEmpty;
    if (element.dataset.badgeSecondaryBg) colors.badgeSecondaryBg = element.dataset.badgeSecondaryBg;
    if (element.dataset.badgeSecondaryText) colors.badgeSecondaryText = element.dataset.badgeSecondaryText;
    if (element.dataset.badgeFeaturedBg) colors.badgeFeaturedBg = element.dataset.badgeFeaturedBg;
    if (element.dataset.badgeFeaturedText) colors.badgeFeaturedText = element.dataset.badgeFeaturedText;
    if (element.dataset.primary) colors.primary = element.dataset.primary;

    if (Object.keys(colors).length > 0) {
      config.colors = colors;
    }

    // Debug logging for layout configuration
    console.log(`[TestimonialsDisplay] Widget ${element.id} - Parsed layout from data-layout="${element.dataset.layout}" to config.layout="${config.layout}"`);

    // Create widget instance
    new TestimonialsDisplayWidget(element.id, config);
  });
});

export default TestimonialsDisplayWidget;