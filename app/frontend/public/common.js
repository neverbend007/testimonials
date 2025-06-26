// Common JavaScript functions for error handling and utilities

// Safe element getter with null checking
function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with id '${id}' not found`);
    }
    return element;
}

// Safe element operation
function safeElementOperation(elementId, operation) {
    const element = safeGetElement(elementId);
    if (element && typeof operation === 'function') {
        try {
            return operation(element);
        } catch (error) {
            console.error(`Error performing operation on element '${elementId}':`, error);
        }
    }
    return null;
}

// Enhanced error handling for async functions
function handleAsyncError(error, context = 'Operation') {
    console.error(`${context} failed:`, error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
        return { 
            message: 'Network connection failed. Please check your internet connection.',
            type: 'network'
        };
    }
    
    // Check if it's a response parsing error
    if (error instanceof SyntaxError) {
        return {
            message: 'Server response format error. Please try again.',
            type: 'parsing'
        };
    }
    
    return {
        message: error.message || 'An unexpected error occurred. Please try again.',
        type: 'generic'
    };
}

// Safe dataset access
function safeGetDataset(element, key) {
    if (!element || !element.dataset) {
        console.warn('Element or dataset not available');
        return null;
    }
    return element.dataset[key] || null;
}

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault(); // Prevent the default console error
});

// Global error handler for uncaught exceptions
window.addEventListener('error', function(event) {
    // Filter out common browser extension errors
    const ignoredErrors = [
        'settingsResetToggle',
        'Cannot read properties of undefined',
        'ResizeObserver loop limit exceeded'
    ];
    
    const errorMessage = event.message || '';
    const shouldIgnore = ignoredErrors.some(ignored => errorMessage.includes(ignored));
    
    if (!shouldIgnore) {
        console.error('Global error:', event.error);
    }
    
    // Always prevent the error from bubbling up to avoid console noise
    event.preventDefault();
});

// Prevent dataset access errors
function safeDatasetAccess(element, key, fallback = null) {
    try {
        if (!element || !element.dataset) {
            return fallback;
        }
        return element.dataset[key] || fallback;
    } catch (error) {
        console.warn('Safe dataset access failed:', error);
        return fallback;
    }
}

// Debounce function for API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}