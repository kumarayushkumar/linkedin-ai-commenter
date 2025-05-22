// LinkedIn Auto Commenter - Content Script
// Handles detecting comment buttons and generating comments

// Use configuration from config.js if available
const SELECTORS = CONFIG?.SELECTORS || {
  COMMENT_BUTTON: 'button[aria-label="Comment"].artdeco-button--tertiary',
  COMMENT_BOX: '.comments-comment-box-comment__text-editor',
  COMMENT_INPUT: '[data-test-ql-editor-contenteditable="true"]',
  POST_CONTAINER: '.feed-shared-update-v2, .scaffold-finite-scroll__content',
  POST_CONTENT: '.feed-shared-update-v2__description, .update-components-text, [data-test-feed-shared-text]'
};

// Create service objects - simulating imports in a module-less environment
// In a production environment, you would use webpack or another bundler
// to properly import these services

/**
 * UI Service for DOM manipulation
 */
const uiService = {
  waitForElement(selector, parent = document, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      const element = parent.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const timeout = setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found after ${timeoutMs}ms`));
      }, timeoutMs);

      const observer = new MutationObserver(() => {
        const element = parent.querySelector(selector);
        if (element) {
          clearTimeout(timeout);
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(parent === document ? document.body : parent, {
        childList: true,
        subtree: true
      });
    });
  },

  createButton(text, styles, clickHandler, options = {}) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = styles;
    
    // Add classes if provided
    if (options.classes) {
      if (Array.isArray(options.classes)) {
        options.classes.forEach(cls => button.classList.add(cls));
      } else {
        button.classList.add(options.classes);
      }
    }
    
    // Add attributes if provided
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        button.setAttribute(key, value);
      });
    }
    
    // Add ARIA attributes for accessibility
    if (options.ariaLabel) {
      button.setAttribute('aria-label', options.ariaLabel);
    }
    
    if (clickHandler) {
      button.addEventListener('click', clickHandler);
    }
    
    return button;
  },

  showNotification(message, type = 'info', duration = 3000) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('lai-notification');
    
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'lai-notification';
      notification.setAttribute('role', 'alert'); // ARIA role for accessibility
      notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 20px;
        border-radius: 4px;
        z-index: 9999;
        font-family: Arial, sans-serif;
        transition: opacity 0.3s ease-in-out;
        display: flex;
        align-items: center;
        min-width: 200px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      `;
      document.body.appendChild(notification);
    }
    
    // Set notification styles based on type
    const colors = {
      info: { bg: '#0a66c2', color: 'white', icon: 'ℹ️' },
      success: { bg: '#0a8544', color: 'white', icon: '✅' },
      error: { bg: '#d93025', color: 'white', icon: '❌' },
      warning: { bg: '#f29900', color: 'black', icon: '⚠️' }
    };
    
    const style = colors[type] || colors.info;
    notification.style.backgroundColor = style.bg;
    notification.style.color = style.color;
    
    // Set message and show notification
    notification.innerHTML = `<span style="margin-right: 8px;">${style.icon}</span> ${message}`;
    notification.style.opacity = '1';
    
    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
      margin-left: auto;
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
    `;
    closeBtn.onclick = () => { notification.style.opacity = '0'; };
    notification.appendChild(closeBtn);
    
    // Auto-hide after duration
    const timer = setTimeout(() => {
      notification.style.opacity = '0';
    }, duration);
    
    // Clear timer if user closes manually
    closeBtn.addEventListener('click', () => clearTimeout(timer));
    
    return notification;
  },

  insertTextIntoElement(element, text) {
    element.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    document.execCommand('insertText', false, text);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
};

/**
 * OpenAI Service for generating comments
 */
const openAIService = {
  responseCache: new Map(),
  
  async getApiKey() {
    // First try to get from storage
    if (chrome && chrome.storage) {
      try {
        const result = await new Promise(resolve => {
          chrome.storage.local.get(['openaiApiKey'], result => resolve(result));
        });
        
        if (result.openaiApiKey) {
          return result.openaiApiKey;
        }
      } catch (e) {
        console.warn('Failed to get API key from storage:', e);
      }
    }
    
    // Fall back to config.js key
    return typeof OPENAI_API_KEY !== 'undefined' ? OPENAI_API_KEY : '';
  },
  
  async generateComment(postText, prompt, options = {}) {
    try {
      const { model = 'gpt-4o', temperature = 0.7, maxTokens = 60, n = 1 } = options;
      
      // Try to get API key from storage first
      const apiKey = await this.getApiKey();
      
      if (!apiKey || apiKey === "sk-...your-key-here...") {
        throw new Error('API key not configured');
      }
      
      // Create a cache key based on post text, prompt and options
      const cacheKey = `${postText}-${prompt}-${model}-${temperature}-${maxTokens}-${n}`;
      
      // Check if we have a cached response
      if (this.responseCache.has(cacheKey)) {
        console.log('Using cached response for:', cacheKey.substring(0, 30) + '...');
        return this.responseCache.get(cacheKey);
      }
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: `${postText}\n\n---\n${prompt}` }],
          max_tokens: maxTokens,
          temperature,
          n,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API Error');
      }
      
      const data = await response.json();
      let result;
      
      if (n === 1) {
        result = data.choices[0]?.message?.content?.trim() || '';
      } else {
        result = data.choices.map(choice => choice.message?.content?.trim() || '');
      }
      
      // Cache the result
      this.responseCache.set(cacheKey, result);
      
      // Limit cache size to prevent memory issues
      if (this.responseCache.size > 50) {
        const firstKey = this.responseCache.keys().next().value;
        this.responseCache.delete(firstKey);
      }
      
      return result;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      // Format error message based on type
      if (error.message.includes('API key')) {
        error.userMessage = 'API key not configured. Please update your settings.';
      } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
        error.userMessage = 'API rate limit exceeded. Please try again later.';
      } else if (error.message.includes('network') || error.message.includes('connect')) {
        error.userMessage = 'Network error. Please check your internet connection.';
      } else {
        error.userMessage = `Error: ${error.message}`;
      }
      
      throw error;
    }
  }
};

/**
 * Storage Service for Chrome storage
 */
const storageService = {
  get(keys) {
    return new Promise(resolve => {
      chrome.storage.sync.get(keys, result => resolve(result));
    });
  },
  
  set(data) {
    return new Promise(resolve => {
      chrome.storage.sync.set(data, resolve);
    });
  }
};

// Utility functions
function debounce(func, wait = 300) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

function throttle(func, limit = 300) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
}

// Initialize the extension
function initLinkedInAutoCommenter() {
  // Track URL changes to reinitialize on navigation
  let lastUrl = location.href;
  new MutationObserver(debounce(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      setupCommentListeners();
    }
  }, 200)).observe(document, {subtree: true, childList: true});
  
  // Initial setup
  setupCommentListeners();
}

// Setup listeners for comment buttons
function setupCommentListeners() {
  // Create observer for dynamically loaded comment buttons
  const observer = new MutationObserver(debounce(() => {
    const commentButtons = document.querySelectorAll(SELECTORS.COMMENT_BUTTON);
    attachEventListeners(commentButtons);
  }, 100));
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Initial scan for comment buttons
  const initialButtons = document.querySelectorAll(SELECTORS.COMMENT_BUTTON);
  attachEventListeners(initialButtons);
}

// Attach event listeners to comment buttons
function attachEventListeners(buttons) {
  buttons.forEach(button => {
    // Prevent duplicate listeners
    if (button.dataset.autoCommentAttached) return;
    button.dataset.autoCommentAttached = 'true';
    
    button.addEventListener('click', handleCommentClick);
  });
}

// Extract post text from LinkedIn post
function extractPostText(postElement) {
  if (!postElement) return '';
  
  const postContent = postElement.querySelector(SELECTORS.POST_CONTENT);
  
  let postText = postContent ? postContent.innerText.trim() : '';
  
  // Remove "...more" or "See more" if present
  postText = postText.replace(/(\u2026more|\.{3}more|See more)/gi, '').replace(/^\s+|\s+$/g, '');
  
  return postText;
}

// Handle comment button click
async function handleCommentClick(event) {
  try {
    // Check if extension is active
    const isActive = await getExtensionState();
    if (!isActive) return;
    
    // Find post element and extract text
    const postElement = this.closest(SELECTORS.POST_CONTAINER);
    const postText = extractPostText(postElement);
    
    // Save post text for side panel
    await savePostText(postText);
    
    // Wait for comment box to appear
    const commentBox = await uiService.waitForElement(SELECTORS.COMMENT_BOX);
    const editorContainer = commentBox?.querySelector('.editor-container') || commentBox;
    const commentInput = await uiService.waitForElement(SELECTORS.COMMENT_INPUT, editorContainer);
    
    // Add AI Options button
    addAIOptionsButton(commentBox);
    
    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.classList.add('lai-loading');
    loadingIndicator.innerHTML = '<span style="margin-right: 5px;">Generating comment</span>';
    loadingIndicator.appendChild(document.createElement('div')).classList.add('lai-spinner');
    loadingIndicator.style.cssText = 'display: flex; align-items: center; margin: 5px 0; font-style: italic; color: #666;';
    commentBox.appendChild(loadingIndicator);
    
    // Get custom prompt from storage
    const customPrompt = await getCustomPrompt();
    
    try {
      // Generate comment with OpenAI
      const gptComment = await openAIService.generateComment(postText, customPrompt, {
        model: CONFIG.AI_MODEL,
        temperature: CONFIG.TEMPERATURE,
        maxTokens: CONFIG.MAX_TOKENS
      });
      
      // Remove loading indicator
      loadingIndicator.remove();
      
      // Insert comment into input field
      uiService.insertTextIntoElement(commentInput, gptComment);
      uiService.showNotification('Comment generated successfully!', 'success');
    } catch (error) {
      // Remove loading indicator
      loadingIndicator.remove();
      
      console.error('Failed to generate comment:', error);
      uiService.showNotification(error.userMessage || 'Failed to generate comment. Check API key.', 'error');
    }
  } catch (error) {
    console.error('Comment handling error:', error);
    uiService.showNotification('Error handling comment button click', 'error');
  }
}

// Check if extension is active
function getExtensionState() {
  return new Promise(resolve => {
    chrome.storage.sync.get(['extensionActive'], result => {
      resolve(result.extensionActive !== false); // Default to true if not set
    });
  });
}

// Get custom prompt from storage
function getCustomPrompt() {
  return new Promise(resolve => {
    chrome.storage.sync.get(['preferences'], result => {
      // Check if we have user preferences
      if (result.preferences && result.preferences.default_prompt) {
        resolve(result.preferences.default_prompt);
      } else {
        // Fall back to config
        resolve(CONFIG?.DEFAULT_PROMPT || 'Write a relevant comment for this post:');
      }
    });
  });
}

// Save post text to chrome.storage
function savePostText(text) {
  return new Promise(resolve => {
    chrome.storage.sync.set({ lastPostText: text }, resolve);
  });
}

// Add AI Options button to comment box
function addAIOptionsButton(commentBox) {
  // Only add button if it doesn't exist
  if (commentBox.querySelector('.lai-ai-options-btn')) return;
  
  const buttonStyles = 
    'position: absolute; right: 10px; top: -30px; ' +
    'background: #0a66c2; color: white; border: none; ' +
    'border-radius: 4px; padding: 5px 10px; cursor: pointer; ' +
    'font-weight: bold; z-index: 10;';
  
  const sidebarButton = uiService.createButton('🤖 AI Options', buttonStyles, e => {
    e.preventDefault();
    e.stopPropagation();
    
    // Try to open side panel
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({action: "openSidePanel"});
    } else {
      uiService.showNotification('Use keyboard shortcut Ctrl+Shift+Y to see AI comment options', 'info');
    }
  }, {
    classes: 'lai-ai-options-btn',
    ariaLabel: 'Open AI options'
  });
  
  // Position the button properly
  commentBox.style.position = 'relative';
  commentBox.appendChild(sidebarButton);
}

// Add CSS styles for the extension
function addStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .lai-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-top-color: #0a66c2;
      border-radius: 50%;
      animation: lai-spin 1s linear infinite;
    }
    
    @keyframes lai-spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

// Initialize when the page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    addStyles();
    initLinkedInAutoCommenter();
  });
} else {
  addStyles();
  initLinkedInAutoCommenter();
}
