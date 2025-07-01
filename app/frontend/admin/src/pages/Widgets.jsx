import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Alert } from '../components/ui/Alert';
import { Link } from 'react-router-dom';
import { Key } from 'lucide-react';

export function Widgets() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Widget builder state only
  
  // Widget builder state
  const [widgetType, setWidgetType] = useState('display'); // 'display' | 'collection'
  const [widgetConfig, setWidgetConfig] = useState({
    // Shared configuration
    theme: 'light',
    title: 'Customer Reviews',
    subtitle: 'What our customers say about us',
    primaryColor: '#3b82f6',
    borderRadius: '8px',
    
    // Display widget specific
    layout: 'grid',
    count: 6,
    showFeaturedOnly: false,
    
    // Collection widget specific
    submitButtonText: 'Submit Testimonial',
    successMessage: 'Thank you! Your testimonial has been submitted and will be reviewed before publication.',
    errorMessage: 'There was an error submitting your testimonial. Please try again.',
    
    // Modal specific options
    widgetMode: 'inline', // 'inline' | 'modal'
    triggerText: 'Share Your Experience',
    modalCloseOnBackdrop: true,
    modalCloseOnEscape: true,
    
    // Comprehensive color configuration
    colors: {
      widgetBackground: '#ffffff',
      cardBackground: '#ffffff',
      cardBorder: '#e5e7eb',
      cardBorderHover: '#d1d5db',
      primaryText: '#111827',
      secondaryText: '#374151',
      mutedText: '#9ca3af',
      starFilled: '#fbbf24',
      starEmpty: '#d1d5db',
      badgeSecondaryBg: '#f3f4f6',
      badgeSecondaryText: '#1f2937',
      badgeFeaturedBg: '#fef3c7',
      badgeFeaturedText: '#92400e',
      primary: '#3b82f6'
    }
  });

  const [embedCode, setEmbedCode] = useState('');



  const generateEmbedCode = () => {
    // Clear previous errors
    setError('');
    
    // Validate form
    if (!validateWidgetConfig()) {
      return;
    }
    
    if (widgetType === 'display') {
      generateDisplayEmbedCode();
    } else {
      generateCollectionEmbedCode();
    }
  };

  const validateWidgetConfig = () => {
    const errors = [];
    
    // Title validation
    if (!widgetConfig.title.trim()) {
      errors.push('Widget title is required');
    }
    
    // Count validation for display widgets
    if (widgetType === 'display' && (widgetConfig.count < 1 || widgetConfig.count > 20)) {
      errors.push('Count must be between 1 and 20');
    }
    
    // Submit button text validation for collection widgets
    if (widgetType === 'collection' && !widgetConfig.submitButtonText.trim()) {
      errors.push('Submit button text is required');
    }
    
    if (errors.length > 0) {
      setError(errors.join('. ') + '.');
      return false;
    }
    
    return true;
  };

  const generateDisplayEmbedCode = () => {
    const config = { ...widgetConfig };
    delete config.submitButtonText; // Remove collection-specific fields
    delete config.successMessage;
    delete config.errorMessage;

    // Standard attributes
    const standardAttributes = Object.entries(config)
      .filter(([key, value]) => value !== '' && value !== false && value !== null)
      .filter(([key]) => ['theme', 'layout', 'count', 'showFeaturedOnly', 'title', 'subtitle', 'primaryColor', 'borderRadius'].includes(key))
      .map(([key, value]) => {
        const attrName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `     data-${attrName}="${value}"`;
      });

    // Color attributes
    const colorAttributes = config.colors ? Object.entries(config.colors)
      .filter(([key, value]) => value !== '' && value !== null)
      .map(([key, value]) => {
        const attrName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `     data-${attrName}="${value}"`;
      }) : [];

    const dataAttributes = [...standardAttributes, ...colorAttributes].join('\n');

    const htmlCode = `<!-- Testimonials Display Widget -->
<script src="https://your-domain.com/widgets/testimonials-display.min.js"></script>
<div id="testimonials-display-widget"
     data-testimonials-display
${dataAttributes}>
</div>`;

    const jsCode = `// Programmatic Display Widget Initialization
const widget = TestimonialsDisplay.create('testimonials-display-widget', {
  theme: '${config.theme}',
  layout: '${config.layout}',
  count: ${config.count},
  showFeaturedOnly: ${config.showFeaturedOnly},
  title: '${config.title}',
  subtitle: '${config.subtitle}',
  primaryColor: '${config.primaryColor}',
  borderRadius: '${config.borderRadius}',
  colors: ${JSON.stringify(config.colors, null, 4)},
  apiBaseUrl: 'https://your-domain.com/api'
});`;

    setEmbedCode({ html: htmlCode, js: jsCode });
  };

  const generateCollectionEmbedCode = () => {
    const config = { ...widgetConfig };
    delete config.layout; // Remove display-specific fields
    delete config.count;
    delete config.showFeaturedOnly;

    // Include modal-specific attributes when in modal mode
    const allowedAttributes = ['theme', 'title', 'subtitle', 'primaryColor', 'borderRadius', 'submitButtonText'];
    if (config.widgetMode === 'modal') {
      allowedAttributes.push('widgetMode', 'triggerText', 'modalCloseOnBackdrop', 'modalCloseOnEscape');
    }

    // Standard attributes
    const standardAttributes = Object.entries(config)
      .filter(([key, value]) => value !== '' && value !== false && value !== null)
      .filter(([key]) => allowedAttributes.includes(key))
      .map(([key, value]) => {
        const attrName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `     data-${attrName}="${value}"`;
      });

    // Color attributes
    const colorAttributes = config.colors ? Object.entries(config.colors)
      .filter(([key, value]) => value !== '' && value !== null)
      .map(([key, value]) => {
        const attrName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `     data-${attrName}="${value}"`;
      }) : [];

    const dataAttributes = [...standardAttributes, ...colorAttributes].join('\n');

    const htmlCode = `<!-- Testimonials Collection Widget -->
<script src="https://your-domain.com/widgets/testimonials-collect.min.js"></script>
<div id="testimonials-collection-widget"
     data-testimonials-collect
${dataAttributes}>
</div>`;

    // Build JS configuration object
    const jsConfigLines = [
      `  theme: '${config.theme}',`,
      `  title: '${config.title}',`,
      `  subtitle: '${config.subtitle}',`,
      `  primaryColor: '${config.primaryColor}',`,
      `  borderRadius: '${config.borderRadius}',`,
      `  submitButtonText: '${config.submitButtonText}',`,
      `  successMessage: '${config.successMessage}',`,
      `  errorMessage: '${config.errorMessage}',`,
      `  colors: ${JSON.stringify(config.colors, null, 4).split('\n').join('\n  ')},`,
      `  apiBaseUrl: 'https://your-domain.com/api'`
    ];

    // Add modal-specific configuration if in modal mode
    if (config.widgetMode === 'modal') {
      jsConfigLines.splice(-1, 0, // Insert before apiBaseUrl
        `  widgetMode: '${config.widgetMode}',`,
        `  triggerText: '${config.triggerText}',`,
        `  modalCloseOnBackdrop: ${config.modalCloseOnBackdrop},`,
        `  modalCloseOnEscape: ${config.modalCloseOnEscape},`
      );
    }

    const jsCode = `// Programmatic Collection Widget Initialization
const widget = TestimonialsCollect.create('testimonials-collection-widget', {
${jsConfigLines.join('\n')}
});`;

    setEmbedCode({ html: htmlCode, js: jsCode });
  };


  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Widget Management</h1>
          <p className="text-gray-600">Configure and generate embed codes for testimonial widgets</p>
        </div>
        <Link to="/api-keys">
          <Button variant="secondary" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Manage API Keys
          </Button>
        </Link>
      </div>

      {/* Alerts */}
      {error && (
        <Alert type="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert type="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Widget Builder */}
      <Card>
          <CardHeader>
            <CardTitle>Widget Builder</CardTitle>
            <p className="text-sm text-gray-600">Configure your widget and generate embed code</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configuration Form */}
              <div className="space-y-4">
                {/* Widget Type Selection */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Widget Type</h3>
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="widgetType"
                        value="display"
                        checked={widgetType === 'display'}
                        onChange={(e) => {
                          setWidgetType(e.target.value);
                          setEmbedCode(''); // Clear embed code when changing widget type
                          setError('');
                          setSuccess('');
                        }}
                        className="form-radio"
                      />
                      <span>Display Widget</span>
                      <span className="text-sm text-gray-500">(Show testimonials)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="widgetType"
                        value="collection"
                        checked={widgetType === 'collection'}
                        onChange={(e) => {
                          setWidgetType(e.target.value);
                          setEmbedCode(''); // Clear embed code when changing widget type
                          setError('');
                          setSuccess('');
                        }}
                        className="form-radio"
                      />
                      <span>Collection Widget</span>
                      <span className="text-sm text-gray-500">(Collect testimonials)</span>
                    </label>
                  </div>
                </div>

                <h3 className="font-semibold">Widget Configuration</h3>
                
                {/* Shared Configuration */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Appearance</h4>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="theme">Theme</Label>
                      <select
                        id="theme"
                        className="form-select"
                        value={widgetConfig.theme}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, theme: e.target.value }))}
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <Input
                        id="primaryColor"
                        type="color"
                        value={widgetConfig.primaryColor}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="borderRadius">Border Radius</Label>
                      <Input
                        id="borderRadius"
                        value={widgetConfig.borderRadius}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, borderRadius: e.target.value }))}
                        placeholder="8px"
                      />
                    </div>
                  </div>
                </div>

                {/* Color Customization */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Color Customization</h4>
                  
                  {/* Widget Container Colors */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-gray-600">Widget Container</h5>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label htmlFor="widgetBackground">Background</Label>
                        <Input
                          id="widgetBackground"
                          type="color"
                          value={widgetConfig.colors.widgetBackground}
                          onChange={(e) => setWidgetConfig(prev => ({ 
                            ...prev, 
                            colors: { ...prev.colors, widgetBackground: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Colors */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-gray-600">Card Colors</h5>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="cardBackground">Background</Label>
                        <Input
                          id="cardBackground"
                          type="color"
                          value={widgetConfig.colors.cardBackground}
                          onChange={(e) => setWidgetConfig(prev => ({ 
                            ...prev, 
                            colors: { ...prev.colors, cardBackground: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardBorder">Border</Label>
                        <Input
                          id="cardBorder"
                          type="color"
                          value={widgetConfig.colors.cardBorder}
                          onChange={(e) => setWidgetConfig(prev => ({ 
                            ...prev, 
                            colors: { ...prev.colors, cardBorder: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardBorderHover">Border Hover</Label>
                        <Input
                          id="cardBorderHover"
                          type="color"
                          value={widgetConfig.colors.cardBorderHover}
                          onChange={(e) => setWidgetConfig(prev => ({ 
                            ...prev, 
                            colors: { ...prev.colors, cardBorderHover: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Text Colors */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-gray-600">Text Colors</h5>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="primaryText">Primary Text</Label>
                        <Input
                          id="primaryText"
                          type="color"
                          value={widgetConfig.colors.primaryText}
                          onChange={(e) => setWidgetConfig(prev => ({ 
                            ...prev, 
                            colors: { ...prev.colors, primaryText: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="secondaryText">Secondary Text</Label>
                        <Input
                          id="secondaryText"
                          type="color"
                          value={widgetConfig.colors.secondaryText}
                          onChange={(e) => setWidgetConfig(prev => ({ 
                            ...prev, 
                            colors: { ...prev.colors, secondaryText: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="mutedText">Muted Text</Label>
                        <Input
                          id="mutedText"
                          type="color"
                          value={widgetConfig.colors.mutedText}
                          onChange={(e) => setWidgetConfig(prev => ({ 
                            ...prev, 
                            colors: { ...prev.colors, mutedText: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Star Colors */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-gray-600">Star Rating Colors</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="starFilled">Filled Stars</Label>
                        <Input
                          id="starFilled"
                          type="color"
                          value={widgetConfig.colors.starFilled}
                          onChange={(e) => setWidgetConfig(prev => ({ 
                            ...prev, 
                            colors: { ...prev.colors, starFilled: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="starEmpty">Empty Stars</Label>
                        <Input
                          id="starEmpty"
                          type="color"
                          value={widgetConfig.colors.starEmpty}
                          onChange={(e) => setWidgetConfig(prev => ({ 
                            ...prev, 
                            colors: { ...prev.colors, starEmpty: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Badge Colors */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-gray-600">Badge Colors</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <h6 className="text-xs font-medium text-gray-500">Secondary Badge</h6>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="badgeSecondaryBg" className="text-xs">Background</Label>
                            <Input
                              id="badgeSecondaryBg"
                              type="color"
                              value={widgetConfig.colors.badgeSecondaryBg}
                              onChange={(e) => setWidgetConfig(prev => ({ 
                                ...prev, 
                                colors: { ...prev.colors, badgeSecondaryBg: e.target.value }
                              }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="badgeSecondaryText" className="text-xs">Text</Label>
                            <Input
                              id="badgeSecondaryText"
                              type="color"
                              value={widgetConfig.colors.badgeSecondaryText}
                              onChange={(e) => setWidgetConfig(prev => ({ 
                                ...prev, 
                                colors: { ...prev.colors, badgeSecondaryText: e.target.value }
                              }))}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h6 className="text-xs font-medium text-gray-500">Featured Badge</h6>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="badgeFeaturedBg" className="text-xs">Background</Label>
                            <Input
                              id="badgeFeaturedBg"
                              type="color"
                              value={widgetConfig.colors.badgeFeaturedBg}
                              onChange={(e) => setWidgetConfig(prev => ({ 
                                ...prev, 
                                colors: { ...prev.colors, badgeFeaturedBg: e.target.value }
                              }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="badgeFeaturedText" className="text-xs">Text</Label>
                            <Input
                              id="badgeFeaturedText"
                              type="color"
                              value={widgetConfig.colors.badgeFeaturedText}
                              onChange={(e) => setWidgetConfig(prev => ({ 
                                ...prev, 
                                colors: { ...prev.colors, badgeFeaturedText: e.target.value }
                              }))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reset Colors Button */}
                  <div className="pt-2">
                    <Button
                      onClick={() => setWidgetConfig(prev => ({
                        ...prev,
                        colors: {
                          widgetBackground: '#ffffff',
                          cardBackground: '#ffffff',
                          cardBorder: '#e5e7eb',
                          cardBorderHover: '#d1d5db',
                          primaryText: '#111827',
                          secondaryText: '#374151',
                          mutedText: '#9ca3af',
                          starFilled: '#fbbf24',
                          starEmpty: '#d1d5db',
                          badgeSecondaryBg: '#f3f4f6',
                          badgeSecondaryText: '#1f2937',
                          badgeFeaturedBg: '#fef3c7',
                          badgeFeaturedText: '#92400e',
                          primary: '#3b82f6'
                        }
                      }))}
                      variant="secondary"
                      size="sm"
                    >
                      Reset to Defaults
                    </Button>
                  </div>
                </div>

                {/* Display Widget Specific Configuration */}
                {widgetType === 'display' && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">Display Settings</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="layout">Layout</Label>
                        <select
                          id="layout"
                          className="form-select"
                          value={widgetConfig.layout}
                          onChange={(e) => setWidgetConfig(prev => ({ ...prev, layout: e.target.value }))}
                        >
                          <option value="grid">Grid</option>
                          <option value="list">List</option>
                          <option value="carousel">Carousel</option>
                          <option value="single">Single</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="count">Count</Label>
                        <Input
                          id="count"
                          type="number"
                          value={widgetConfig.count}
                          onChange={(e) => setWidgetConfig(prev => ({ ...prev, count: parseInt(e.target.value) }))}
                          min="1"
                          max="20"
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="featuredOnly"
                        checked={widgetConfig.showFeaturedOnly}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, showFeaturedOnly: e.target.checked }))}
                        className="mr-2"
                      />
                      <Label htmlFor="featuredOnly">Show featured testimonials only</Label>
                    </div>
                  </div>
                )}

                {/* Collection Widget Specific Configuration */}
                {widgetType === 'collection' && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">Form Settings</h4>
                    
                    <div>
                      <Label htmlFor="submitButtonText">Submit Button Text</Label>
                      <Input
                        id="submitButtonText"
                        value={widgetConfig.submitButtonText}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, submitButtonText: e.target.value }))}
                        placeholder="Submit Testimonial"
                      />
                    </div>

                    <div>
                      <Label htmlFor="successMessage">Success Message</Label>
                      <textarea
                        id="successMessage"
                        className="form-textarea"
                        rows="2"
                        value={widgetConfig.successMessage}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, successMessage: e.target.value }))}
                        placeholder="Thank you! Your testimonial has been submitted..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="errorMessage">Error Message</Label>
                      <textarea
                        id="errorMessage"
                        className="form-textarea"
                        rows="2"
                        value={widgetConfig.errorMessage}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, errorMessage: e.target.value }))}
                        placeholder="There was an error submitting your testimonial..."
                      />
                    </div>

                    {/* Modal Configuration */}
                    <div className="space-y-3 pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-700">Display Mode</h4>
                      
                      <div className="flex gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="widgetMode"
                            value="inline"
                            checked={widgetConfig.widgetMode === 'inline'}
                            onChange={(e) => setWidgetConfig(prev => ({ ...prev, widgetMode: e.target.value }))}
                            className="form-radio"
                          />
                          <span>Inline Form</span>
                          <span className="text-sm text-gray-500">(Embedded directly on page)</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="widgetMode"
                            value="modal"
                            checked={widgetConfig.widgetMode === 'modal'}
                            onChange={(e) => setWidgetConfig(prev => ({ ...prev, widgetMode: e.target.value }))}
                            className="form-radio"
                          />
                          <span>Modal Popup</span>
                          <span className="text-sm text-gray-500">(Opens in overlay)</span>
                        </label>
                      </div>

                      {widgetConfig.widgetMode === 'modal' && (
                        <div className="space-y-3 ml-4 p-3 bg-gray-50 rounded-md">
                          <div>
                            <Label htmlFor="triggerText">Trigger Button Text</Label>
                            <Input
                              id="triggerText"
                              value={widgetConfig.triggerText}
                              onChange={(e) => setWidgetConfig(prev => ({ ...prev, triggerText: e.target.value }))}
                              placeholder="Share Your Experience"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={widgetConfig.modalCloseOnBackdrop}
                                onChange={(e) => setWidgetConfig(prev => ({ ...prev, modalCloseOnBackdrop: e.target.checked }))}
                                className="form-checkbox"
                              />
                              <span className="text-sm">Close modal when clicking outside</span>
                            </label>
                            
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={widgetConfig.modalCloseOnEscape}
                                onChange={(e) => setWidgetConfig(prev => ({ ...prev, modalCloseOnEscape: e.target.checked }))}
                                className="form-checkbox"
                              />
                              <span className="text-sm">Close modal with Escape key</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Content Configuration */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Content</h4>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={widgetConfig.title}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Widget title"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="subtitle">Subtitle</Label>
                      <Input
                        id="subtitle"
                        value={widgetConfig.subtitle}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                        placeholder="Widget subtitle"
                      />
                    </div>
                  </div>
                </div>

                {/* Domain Authorization Note */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Domain Authorization</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Security Notice:</strong> Widgets are authenticated by domain origin. 
                      To use these widgets, ensure your domain is added to an API key's allowed domains in the {' '}
                      <Link to="/api-keys" className="underline font-medium">API Keys page</Link>.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button onClick={generateEmbedCode} variant="primary" className="w-full">
                    Generate Embed Code
                  </Button>
                  <Button 
                    onClick={() => window.open('http://localhost:3001/widgets/admin-preview.html', '_blank')}
                    variant="secondary" 
                    className="w-full"
                  >
                    Test Widgets in Preview Page
                  </Button>
                </div>
              </div>
              
              {/* Embed Code */}
              <div className="space-y-4">
                {embedCode ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="font-semibold">HTML Embed Code</Label>
                        <Button
                          onClick={() => navigator.clipboard.writeText(embedCode.html)}
                          variant="secondary"
                          size="sm"
                          className="text-xs"
                        >
                          Copy
                        </Button>
                      </div>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm font-mono whitespace-pre-wrap">{embedCode.html}</pre>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="font-semibold">JavaScript Initialization</Label>
                        <Button
                          onClick={() => navigator.clipboard.writeText(embedCode.js)}
                          variant="secondary"
                          size="sm"
                          className="text-xs"
                        >
                          Copy
                        </Button>
                      </div>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm font-mono whitespace-pre-wrap">{embedCode.js}</pre>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Implementation Instructions</h4>
                      <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Copy the HTML code and paste it where you want the {widgetType} widget to appear</li>
                        <li>The widget will auto-initialize using data attributes</li>
                        <li>Alternatively, use the JavaScript code for programmatic control</li>
                        <li><strong>Important:</strong> Ensure your domain is added to an API key's allowed domains in the API Keys page</li>
                        <li>Widgets are authenticated by domain origin for security</li>
                        <li>No API key needs to be included in the embed code - authentication is handled server-side</li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="space-y-2">
                      <div className="text-lg font-medium">Embed Code Preview</div>
                      <div className="text-sm">Configure your {widgetType} widget and click "Generate Embed Code" to see the implementation code</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

    </div>
  );
}