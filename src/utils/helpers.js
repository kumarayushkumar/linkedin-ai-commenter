// Utility functions

/**
 * Extract post text from LinkedIn post
 * @param {HTMLElement} postElement - The post container element
 * @returns {string} Extracted post text
 */
export function extractPostText(postElement) {
  if (!postElement) return '';
  
  const postContent = postElement.querySelector(
    '.feed-shared-update-v2__description, ' + 
    '.update-components-text, ' + 
    '[data-test-feed-shared-text]'
  );
  
  let postText = postContent ? postContent.innerText.trim() : '';
  
  // Remove "...more" or "See more" if present
  postText = postText.replace(/(\u2026more|\.{3}more|See more)/gi, '').replace(/^\s+|\s+$/g, '');
  
  return postText;
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - The function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

/**
 * Throttle function to limit execution frequency
 * @param {Function} func - The function to throttle
 * @param {number} limit - Minimum milliseconds between executions
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 300) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
}

/**
 * Check if Chrome API is available
 * @param {string} apiPath - Dot-notation path to the API
 * @returns {boolean} Whether the API is available
 */
export function isApiAvailable(apiPath) {
  return apiPath.split('.').reduce((obj, path) => {
    return (obj && obj[path]) ? obj[path] : undefined;
  }, chrome) !== undefined;
}

/**
 * Get unique element from selector with retry
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element to search within
 * @param {number} retryCount - Number of retries
 * @param {number} retryDelay - Milliseconds between retries
 * @returns {Promise<HTMLElement>} Found element
 */
export async function getUniqueElement(selector, parent = document, retryCount = 3, retryDelay = 500) {
  for (let i = 0; i < retryCount; i++) {
    const element = parent.querySelector(selector);
    if (element) return element;
    
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }
  
  throw new Error(`Element ${selector} not found after ${retryCount} retries`);
}

/**
 * Format error message for user display
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
export function formatErrorMessage(error) {
  if (error.message.includes('API key')) {
    return 'API key not configured. Please update in extension settings.';
  }
  
  if (error.message.includes('quota') || error.message.includes('rate limit')) {
    return 'API rate limit exceeded. Please try again later.';
  }
  
  if (error.message.includes('network') || error.message.includes('connection')) {
    return 'Network error. Please check your internet connection.';
  }
  
  return `Error: ${error.message}`;
}

/**
 * Create a mutation observer with debounced callback
 * @param {Element} target - Element to observe
 * @param {Function} callback - Callback function
 * @param {Object} options - Observer options
 * @param {number} debounceTime - Debounce time in ms
 * @returns {MutationObserver} - The created observer
 */
export function createObserver(target, callback, options = { subtree: true, childList: true }, debounceTime = 100) {
  const observer = new MutationObserver(debounce(callback, debounceTime));
  observer.observe(target, options);
  return observer;
}
