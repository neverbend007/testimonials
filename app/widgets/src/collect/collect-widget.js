/**
 * Testimonials Collection Widget
 * Embeddable widget for collecting testimonials via cross-domain form submission
 */

import { 
  ApiClient, 
  StyleManager, 
  createElement, 
  validateConfig, 
  generateWidgetId,
  WidgetError,
  DEFAULT_CONFIG 
} from '../shared/utils.js';

class TestimonialsCollectWidget {
  constructor(containerId, config = {}) {
    this.containerId = containerId;
    this.config = { 
      ...DEFAULT_CONFIG, 
      ...config,
      // Collection widget specific defaults
      showHeader: true,
      showFooter: true,
      submitButtonText: 'Submit Testimonial',
      successMessage: 'Thank you! Your testimonial has been submitted and will be reviewed before publication.',
      errorMessage: 'There was an error submitting your testimonial. Please try again.',
      requiredFields: ['full_name', 'email', 'testimonial_text', 'star_rating', 'source_type'],
      // Modal specific defaults
      widgetMode: 'inline', // 'inline' | 'modal'
      triggerText: 'Share Your Experience',
      modalCloseOnBackdrop: true,
      modalCloseOnEscape: true
    };
    this.container = null;
    this.apiClient = null;
    this.styleManager = null;
    this.formData = {};
    this.isSubmitting = false;
    this.submitted = false;
    // Modal specific state
    this.isModal = false;
    this.modalOverlay = null;
    this.modalContent = null;

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

      // Detect widget mode from data attribute or config
      const dataWidgetMode = this.container.dataset.widgetMode;
      if (dataWidgetMode === 'modal' || this.config.widgetMode === 'modal') {
        this.isModal = true;
        this.config.widgetMode = 'modal';
      }

      // Initialize API client and style manager
      this.apiClient = new ApiClient(this.config);
      this.styleManager = new StyleManager(this.config, this.containerId);

      // Inject styles
      this.styleManager.injectStyles();

      // Store widget instance on container for external access
      this.container._testimonialsWidget = this;

      // Render form
      this.render();

    } catch (error) {
      console.error('Collection widget initialization error:', error);
      this.renderError(error.message);
    }
  }

  render() {
    if (!this.container) return;

    // Clear previous content
    this.container.innerHTML = '';

    if (this.isModal) {
      // Render modal trigger button
      this.renderModalTrigger();
    } else {
      // Render inline form (existing behavior)
      this.renderInlineForm();
    }
  }

  renderInlineForm() {
    // Create main widget container
    const widgetContainer = createElement('div', 'widget-container');

    // Add header if configured
    if (this.config.showHeader !== false) {
      const header = this.createHeader();
      widgetContainer.appendChild(header);
    }

    // Show success message or form
    if (this.submitted) {
      const successContainer = this.createSuccessMessage();
      widgetContainer.appendChild(successContainer);
    } else {
      const formContainer = this.createFormContainer();
      widgetContainer.appendChild(formContainer);
    }

    // Add footer if configured
    if (this.config.showFooter !== false) {
      const footer = this.createFooter();
      widgetContainer.appendChild(footer);
    }

    this.container.appendChild(widgetContainer);
  }

  renderModalTrigger() {
    // Hide the container since we'll attach FAB to body
    this.container.style.display = 'none';
    
    // Get trigger text from data attribute or config
    const triggerText = this.container.dataset.triggerText || this.config.triggerText;
    
    // Create floating action button
    this.fabButton = createElement('button', 'modal-trigger-fab', triggerText);
    this.fabButton.id = `${this.containerId}-fab`;
    this.fabButton.addEventListener('click', () => this.openModal());
    
    // Attach FAB directly to document body
    document.body.appendChild(this.fabButton);
    
    // Create modal structure but keep it hidden
    this.createModalStructure();
  }

  createModalStructure() {
    // Create modal overlay (attached to document body for proper positioning)
    this.modalOverlay = createElement('div', '', '');
    this.modalOverlay.id = `${this.containerId}-modal-overlay`;
    this.modalOverlay.classList.add('hidden');

    // Create modal content
    this.modalContent = createElement('div', 'modal-content');

    // Create modal header
    const modalHeader = createElement('div', 'modal-header');
    
    // Add close button
    const closeButton = createElement('button', 'modal-close-button', '×');
    closeButton.addEventListener('click', () => this.closeModal());
    modalHeader.appendChild(closeButton);

    // Create modal body
    const modalBody = createElement('div', 'modal-body');

    // Assemble modal
    this.modalContent.appendChild(modalHeader);
    this.modalContent.appendChild(modalBody);
    this.modalOverlay.appendChild(this.modalContent);

    // Add to document body
    document.body.appendChild(this.modalOverlay);

    // Add event listeners
    this.setupModalEventListeners();
  }

  setupModalEventListeners() {
    // Close on backdrop click
    if (this.config.modalCloseOnBackdrop) {
      this.modalOverlay.addEventListener('click', (e) => {
        if (e.target === this.modalOverlay) {
          this.closeModal();
        }
      });
    }

    // Close on escape key
    if (this.config.modalCloseOnEscape) {
      this.escapeKeyHandler = (e) => {
        if (e.key === 'Escape' && !this.modalOverlay.classList.contains('hidden')) {
          this.closeModal();
        }
      };
      document.addEventListener('keydown', this.escapeKeyHandler);
    }
  }

  openModal() {
    if (!this.modalOverlay) return;

    // Render form content in modal body
    const modalBody = this.modalOverlay.querySelector('.modal-body');
    modalBody.innerHTML = '';

    // Create form content
    if (this.submitted) {
      const successContainer = this.createSuccessMessage();
      modalBody.appendChild(successContainer);
    } else {
      // Add modal header content
      if (this.config.title || this.config.subtitle) {
        const modalHeaderContent = this.createHeader();
        const modalHeader = this.modalOverlay.querySelector('.modal-header');
        modalHeader.insertBefore(modalHeaderContent, modalHeader.firstChild);
      }

      const formContainer = this.createFormContainer();
      modalBody.appendChild(formContainer);
    }

    // Show modal
    this.modalOverlay.classList.remove('hidden');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Focus first input
    setTimeout(() => {
      const firstInput = this.modalOverlay.querySelector('input, textarea, select');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  closeModal() {
    if (!this.modalOverlay) return;

    // Hide modal
    this.modalOverlay.classList.add('hidden');
    
    // Restore body scroll
    document.body.style.overflow = '';

    // Clear modal header content (except close button)
    const modalHeader = this.modalOverlay.querySelector('.modal-header');
    const closeButton = modalHeader.querySelector('.modal-close-button');
    modalHeader.innerHTML = '';
    modalHeader.appendChild(closeButton);
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

  createFormContainer() {
    const container = createElement('div', 'form-container');
    
    // Error message container
    const errorContainer = createElement('div', 'error-message hidden');
    container.appendChild(errorContainer);
    
    // Create form
    const form = this.createForm();
    container.appendChild(form);
    
    return container;
  }

  createForm() {
    const form = createElement('form', 'testimonial-form');
    form.setAttribute('novalidate', 'true');
    
    // Personal Information Section
    const personalSection = this.createFormSection('Personal Information', [
      this.createFormField('text', 'full_name', 'Full Name', { required: true, placeholder: 'Your full name' }),
      this.createFormField('email', 'email', 'Email Address', { required: true, placeholder: 'your.email@example.com' }),
      this.createFormField('select', 'source_type', 'How do you know us?', { 
        required: true, 
        options: [
          { value: '', text: 'Please select...' },
          { value: 'Agency Client', text: "I'm an Agency Client" },
          { value: 'Skool Community Member', text: "I'm a Skool Community Member" }
        ]
      })
    ]);
    form.appendChild(personalSection);

    // Experience Section
    const experienceSection = this.createFormSection('Your Experience', [
      this.createStarRatingField(),
      this.createFormField('textarea', 'testimonial_text', 'Your Testimonial', { 
        required: true, 
        placeholder: 'Please share your experience with our AI and automation services. What specific results did you achieve?',
        minlength: 50,
        maxlength: 500
      })
    ]);
    form.appendChild(experienceSection);

    // Anti-spam fields (hidden)
    const honeyPot1 = createElement('input');
    honeyPot1.type = 'text';
    honeyPot1.name = 'website';
    honeyPot1.style.display = 'none';
    honeyPot1.tabIndex = -1;
    honeyPot1.setAttribute('autocomplete', 'off');
    form.appendChild(honeyPot1);

    const honeyPot2 = createElement('input');
    honeyPot2.type = 'text';
    honeyPot2.name = 'url';
    honeyPot2.style.display = 'none';
    honeyPot2.tabIndex = -1;
    honeyPot2.setAttribute('autocomplete', 'off');
    form.appendChild(honeyPot2);

    // Submit button
    const submitContainer = createElement('div', 'submit-container');
    const submitButton = createElement('button', 'submit-button');
    submitButton.type = 'submit';
    submitButton.innerHTML = `
      <span class="submit-text">${this.config.submitButtonText}</span>
      <span class="submit-spinner hidden">Submitting...</span>
    `;
    submitContainer.appendChild(submitButton);

    // Privacy notice
    const privacyNotice = createElement('div', 'privacy-notice');
    privacyNotice.innerHTML = `
      <small>By submitting this testimonial, you agree to allow us to publish your review publicly. Your email address will not be shared.</small>
    `;
    submitContainer.appendChild(privacyNotice);

    form.appendChild(submitContainer);

    // Add form event listeners
    form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Add real-time validation
    form.addEventListener('input', (e) => this.handleInput(e));
    form.addEventListener('change', (e) => this.handleChange(e));

    return form;
  }

  createFormSection(title, fields) {
    const section = createElement('div', 'form-section');
    
    const sectionTitle = createElement('h3', 'section-title', title);
    section.appendChild(sectionTitle);
    
    fields.forEach(field => {
      section.appendChild(field);
    });
    
    return section;
  }

  createFormField(type, name, label, options = {}) {
    const fieldContainer = createElement('div', 'form-field');
    
    // Label
    const labelEl = createElement('label', 'form-label');
    labelEl.setAttribute('for', name);
    labelEl.innerHTML = `${label}${options.required ? ' <span class="required">*</span>' : ''}`;
    fieldContainer.appendChild(labelEl);
    
    // Input element
    let input;
    if (type === 'textarea') {
      input = createElement('textarea', 'form-textarea');
      input.rows = 4;
    } else if (type === 'select') {
      input = createElement('select', 'form-select');
      options.options?.forEach(opt => {
        const option = createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        input.appendChild(option);
      });
    } else {
      input = createElement('input', 'form-input');
      input.type = type;
    }
    
    input.id = name;
    input.name = name;
    
    if (options.required) input.required = true;
    if (options.placeholder) input.placeholder = options.placeholder;
    if (options.minlength) input.setAttribute('minlength', options.minlength);
    if (options.maxlength) input.setAttribute('maxlength', options.maxlength);
    
    fieldContainer.appendChild(input);
    
    // Error message container
    const errorContainer = createElement('div', 'field-error hidden');
    fieldContainer.appendChild(errorContainer);
    
    // Character counter for textarea
    if (type === 'textarea' && options.maxlength) {
      const charCounter = createElement('div', 'char-counter');
      charCounter.textContent = `0/${options.maxlength} characters (minimum ${options.minlength || 0})`;
      fieldContainer.appendChild(charCounter);
    }
    
    return fieldContainer;
  }

  createStarRatingField() {
    const fieldContainer = createElement('div', 'form-field');
    
    // Label
    const labelEl = createElement('label', 'form-label');
    labelEl.innerHTML = 'Overall Rating <span class="required">*</span>';
    fieldContainer.appendChild(labelEl);
    
    // Star rating container
    const starContainer = createElement('div', 'star-rating-input');
    
    for (let i = 1; i <= 5; i++) {
      const star = createElement('span', 'star-input empty');
      star.setAttribute('data-rating', i);
      star.innerHTML = '★';
      star.addEventListener('click', () => this.setRating(i));
      star.addEventListener('mouseenter', () => this.hoverRating(i));
      starContainer.appendChild(star);
    }
    
    starContainer.addEventListener('mouseleave', () => this.resetRatingHover());
    
    fieldContainer.appendChild(starContainer);
    
    // Hidden input for form submission
    const hiddenInput = createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'star_rating';
    hiddenInput.id = 'star_rating';
    hiddenInput.required = true;
    fieldContainer.appendChild(hiddenInput);
    
    // Error container
    const errorContainer = createElement('div', 'field-error hidden');
    fieldContainer.appendChild(errorContainer);
    
    // Help text
    const helpText = createElement('div', 'help-text');
    helpText.textContent = 'Click the stars to rate your experience';
    fieldContainer.appendChild(helpText);
    
    return fieldContainer;
  }

  setRating(rating) {
    this.formData.star_rating = rating;
    // For modal widgets, search in modal overlay; for inline widgets, search in container
    const context = this.isModal && this.modalOverlay ? this.modalOverlay : this.container;
    const hiddenInput = context.querySelector('#star_rating');
    if (hiddenInput) hiddenInput.value = rating;
    this.updateStarDisplay(rating);
    this.clearFieldError('star_rating');
  }

  hoverRating(rating) {
    this.updateStarDisplay(rating);
  }

  resetRatingHover() {
    this.updateStarDisplay(this.formData.star_rating || 0);
  }

  updateStarDisplay(rating) {
    // For modal widgets, search in modal overlay; for inline widgets, search in container
    const context = this.isModal && this.modalOverlay ? this.modalOverlay : this.container;
    const stars = context.querySelectorAll('.star-input');
    stars.forEach((star, index) => {
      star.classList.toggle('empty', index >= rating);
    });
  }

  handleInput(e) {
    const { name, value } = e.target;
    this.formData[name] = value;
    
    // Real-time validation
    this.validateField(name, value);
    
    // Update character counter for textarea
    if (e.target.tagName === 'TEXTAREA') {
      this.updateCharacterCounter(e.target);
    }
  }

  handleChange(e) {
    const { name, value } = e.target;
    this.formData[name] = value;
    this.validateField(name, value);
  }

  updateCharacterCounter(textarea) {
    const counter = textarea.parentNode.querySelector('.char-counter');
    if (counter) {
      const length = textarea.value.length;
      const maxLength = textarea.getAttribute('maxlength');
      const minLength = textarea.getAttribute('minlength') || 0;
      
      counter.textContent = `${length}/${maxLength} characters (minimum ${minLength})`;
      
      if (length < minLength) {
        counter.style.color = 'var(--danger-600)';
      } else if (length > maxLength * 0.9) {
        counter.style.color = 'var(--warning-600)';
      } else {
        counter.style.color = 'var(--success-600)';
      }
    }
  }

  validateField(name, value) {
    let error = '';
    
    switch (name) {
      case 'full_name':
        if (!value.trim()) {
          error = 'Full name is required';
        } else if (value.trim().length < 2) {
          error = 'Full name must be at least 2 characters';
        }
        break;
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
          error = 'Email address is required';
        } else if (!emailRegex.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;
        
      case 'source_type':
        if (!value) {
          error = 'Please select how you know us';
        }
        break;
        
      case 'testimonial_text':
        if (!value.trim()) {
          error = 'Testimonial text is required';
        } else if (value.trim().length < 50) {
          error = 'Testimonial must be at least 50 characters';
        } else if (value.trim().length > 500) {
          error = 'Testimonial must be less than 500 characters';
        }
        break;
    }
    
    if (error) {
      this.showFieldError(name, error);
    } else {
      this.clearFieldError(name);
    }
    
    return !error;
  }

  showFieldError(fieldName, message) {
    // For modal widgets, search in modal overlay; for inline widgets, search in container
    const context = this.isModal && this.modalOverlay ? this.modalOverlay : this.container;
    const field = context.querySelector(`[name="${fieldName}"]`);
    if (field) {
      const errorContainer = field.parentNode.querySelector('.field-error');
      if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.classList.remove('hidden');
      }
      field.style.borderColor = 'var(--danger-500)';
    }
  }

  clearFieldError(fieldName) {
    // For modal widgets, search in modal overlay; for inline widgets, search in container
    const context = this.isModal && this.modalOverlay ? this.modalOverlay : this.container;
    const field = context.querySelector(`[name="${fieldName}"]`);
    if (field) {
      const errorContainer = field.parentNode.querySelector('.field-error');
      if (errorContainer) {
        errorContainer.classList.add('hidden');
      }
      field.style.borderColor = 'var(--gray-300)';
    }
  }

  validateForm() {
    let isValid = true;
    
    // Validate all required fields
    this.config.requiredFields.forEach(fieldName => {
      const value = fieldName === 'star_rating' ? this.formData.star_rating : this.formData[fieldName];
      if (!this.validateField(fieldName, value || '')) {
        isValid = false;
      }
    });
    
    // Validate star rating specifically
    if (!this.formData.star_rating || this.formData.star_rating < 1) {
      this.showFieldError('star_rating', 'Please select a rating');
      isValid = false;
    }
    
    return isValid;
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    if (this.isSubmitting) return;
    
    // Hide previous error messages
    this.hideErrorMessage();
    
    // Validate form
    if (!this.validateForm()) {
      this.showErrorMessage('Please correct the errors above and try again.');
      return;
    }
    
    this.setSubmitting(true);
    
    try {
      // Prepare form data
      const submitData = {
        full_name: this.formData.full_name?.trim(),
        email: this.formData.email?.trim(),
        source_type: this.formData.source_type,
        star_rating: parseInt(this.formData.star_rating),
        testimonial_text: this.formData.testimonial_text?.trim(),
        // Anti-spam fields (should be empty)
        website: (this.isModal && this.modalOverlay ? this.modalOverlay : this.container).querySelector('[name="website"]')?.value || '',
        url: (this.isModal && this.modalOverlay ? this.modalOverlay : this.container).querySelector('[name="url"]')?.value || ''
      };
      
      // Submit to API
      const response = await this.apiClient.submitTestimonial(submitData);
      
      // Show success
      this.submitted = true;
      
      if (this.isModal) {
        // For modal: show success message in modal, then close after delay
        this.openModal(); // This will show success message
        setTimeout(() => {
          this.closeModal();
          // Reset for potential re-use
          this.submitted = false;
          this.formData = {};
        }, 3000); // Close modal after 3 seconds
      } else {
        // For inline: regular render behavior
        this.render();
      }
      
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      
      let errorMessage = this.config.errorMessage;
      if (error.message.includes('Too many submissions')) {
        errorMessage = 'You have reached the submission limit. Please try again later.';
      } else if (error.message.includes('Spam detected')) {
        errorMessage = 'Your submission was flagged as spam. Please contact support if this is an error.';
      }
      
      this.showErrorMessage(errorMessage);
    } finally {
      this.setSubmitting(false);
    }
  }

  setSubmitting(submitting) {
    this.isSubmitting = submitting;
    // For modal widgets, search in modal overlay; for inline widgets, search in container
    const context = this.isModal && this.modalOverlay ? this.modalOverlay : this.container;
    const submitButton = context.querySelector('.submit-button');
    const submitText = context.querySelector('.submit-text');
    const submitSpinner = context.querySelector('.submit-spinner');
    
    if (submitButton) {
      submitButton.disabled = submitting;
      if (submitting) {
        submitText?.classList.add('hidden');
        submitSpinner?.classList.remove('hidden');
      } else {
        submitText?.classList.remove('hidden');
        submitSpinner?.classList.add('hidden');
      }
    }
  }

  showErrorMessage(message) {
    // For modal widgets, search in modal overlay; for inline widgets, search in container
    const context = this.isModal && this.modalOverlay ? this.modalOverlay : this.container;
    const errorContainer = context.querySelector('.error-message');
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.classList.remove('hidden');
      // Scroll to error message
      errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  hideErrorMessage() {
    // For modal widgets, search in modal overlay; for inline widgets, search in container
    const context = this.isModal && this.modalOverlay ? this.modalOverlay : this.container;
    const errorContainer = context.querySelector('.error-message');
    if (errorContainer) {
      errorContainer.classList.add('hidden');
    }
  }

  createSuccessMessage() {
    const container = createElement('div', 'success-message');
    container.innerHTML = `
      <div class="success-icon">✓</div>
      <h3>Thank You!</h3>
      <p>${this.config.successMessage}</p>
      <button class="submit-another-button">Submit Another Testimonial</button>
    `;
    
    const submitAnotherBtn = container.querySelector('.submit-another-button');
    submitAnotherBtn.addEventListener('click', () => {
      this.submitted = false;
      this.formData = {};
      this.render();
    });
    
    return container;
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

  // Public methods
  reset() {
    this.submitted = false;
    this.formData = {};
    this.render();
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    validateConfig(this.config);
    
    // Re-inject styles with new configuration
    this.styleManager = new StyleManager(this.config, this.containerId);
    this.styleManager.injectStyles();
    
    // Re-render with new configuration
    this.render();
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

  // Public modal methods
  openModalPublic() {
    if (this.isModal) {
      this.openModal();
    }
  }

  closeModalPublic() {
    if (this.isModal) {
      this.closeModal();
    }
  }

  // Destroy method for cleanup
  destroy() {
    // Remove escape key listener
    if (this.escapeKeyHandler) {
      document.removeEventListener('keydown', this.escapeKeyHandler);
    }

    // Remove modal from DOM
    if (this.modalOverlay && this.modalOverlay.parentNode) {
      this.modalOverlay.parentNode.removeChild(this.modalOverlay);
    }

    // Remove FAB from DOM if it exists
    if (this.fabButton && this.fabButton.parentNode) {
      this.fabButton.parentNode.removeChild(this.fabButton);
    }

    // Remove styles
    if (this.styleManager) {
      this.styleManager.removeStyles();
    }

    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
      this.container.style.display = ''; // Restore display property
    }

    // Restore body scroll
    document.body.style.overflow = '';

    // Clear references
    this.modalOverlay = null;
    this.modalContent = null;
    this.fabButton = null;
    this.container = null;
    this.apiClient = null;
    this.styleManager = null;
  }
}

// Global widget factory function
window.TestimonialsCollect = {
  create: function(containerId, config = {}) {
    return new TestimonialsCollectWidget(containerId, config);
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

      // Create widget instance
      const widget = new TestimonialsCollectWidget(element.id, config);
      widgets.push(widget);
    });

    return widgets.length === 1 ? widgets[0] : widgets;
  },

  // Modal control methods
  openModal: function(widgetId) {
    const element = document.getElementById(widgetId);
    if (element && element._testimonialsWidget) {
      element._testimonialsWidget.openModalPublic();
    }
  },

  closeModal: function(widgetId) {
    const element = document.getElementById(widgetId);
    if (element && element._testimonialsWidget) {
      element._testimonialsWidget.closeModalPublic();
    }
  }
};

// Auto-initialize widgets on page load
document.addEventListener('DOMContentLoaded', function() {
  // Look for elements with data-testimonials-collect attribute
  const autoInitElements = document.querySelectorAll('[data-testimonials-collect]');
  
  autoInitElements.forEach(element => {
    if (!element.id) {
      element.id = generateWidgetId();
    }

    // Parse configuration from data attributes
    const config = {};
    
    if (element.dataset.apiUrl) config.apiBaseUrl = element.dataset.apiUrl;
    if (element.dataset.theme) config.theme = element.dataset.theme;
    if (element.dataset.title) config.title = element.dataset.title;
    if (element.dataset.subtitle) config.subtitle = element.dataset.subtitle;
    if (element.dataset.primaryColor) config.primaryColor = element.dataset.primaryColor;
    if (element.dataset.borderRadius) config.borderRadius = element.dataset.borderRadius;
    if (element.dataset.submitButtonText) config.submitButtonText = element.dataset.submitButtonText;
    // Modal specific attributes
    if (element.dataset.widgetMode) config.widgetMode = element.dataset.widgetMode;
    if (element.dataset.triggerText) config.triggerText = element.dataset.triggerText;
    if (element.dataset.modalCloseOnBackdrop !== undefined) config.modalCloseOnBackdrop = element.dataset.modalCloseOnBackdrop === 'true';
    if (element.dataset.modalCloseOnEscape !== undefined) config.modalCloseOnEscape = element.dataset.modalCloseOnEscape === 'true';

    // Create widget instance
    new TestimonialsCollectWidget(element.id, config);
  });
});

export default TestimonialsCollectWidget;