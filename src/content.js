// LinkedIn Auto Commenter - Content Script
(function() {
  // We'll load the services through chrome.runtime.getURL
  let openAIService, storageService, uiService, constants, helpers, STORAGE_KEYS;
  
  // Use this to await loading of dependencies
  async function loadDependencies() {
    // Get the base URL for your extension
    const baseURL = chrome.runtime.getURL('src/');
    
    // Load dependencies using dynamic import (works in Chrome)
    const [openAIModule, storageModule, uiModule, constantsModule, helpersModule] = 
      await Promise.all([
        import(baseURL + 'services/openai.js'),
        import(baseURL + 'services/storage.js'),
        import(baseURL + 'services/ui.js'),
        import(baseURL + 'utils/constants.js'),
        import(baseURL + 'utils/helpers.js')
      ]);
    
    // Assign the imported modules to our variables
    openAIService = openAIModule.default;
    storageService = storageModule.default;
    STORAGE_KEYS = storageModule.STORAGE_KEYS;
    uiService = uiModule.default;
    constants = constantsModule;
    helpers = helpersModule;
    
    // Get the LinkedIn selectors
    const SELECTORS = constants.LINKEDIN_SELECTORS;
    const AI_SETTINGS = constants.AI_SETTINGS;
    
    // Now that dependencies are loaded, initialize the extension
    initLinkedInAutoCommenter(SELECTORS, AI_SETTINGS, helpers);
  }
  
  // Initialize the extension
  function initLinkedInAutoCommenter(SELECTORS, AI_SETTINGS, helpers) {
    const { createObserver, extractPostText } = helpers;
    
    // Track URL changes to reinitialize on navigation
    let lastUrl = location.href;
    createObserver(document, () => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        setupCommentListeners();
      }
    }, { subtree: true, childList: true }, 200);
    
    // Initial setup
    setupCommentListeners();
    
    // Setup listeners for comment buttons
    function setupCommentListeners() {
      // Create observer for dynamically loaded comment buttons
      createObserver(document.body, () => {
        const commentButtons = document.querySelectorAll(SELECTORS.COMMENT_BUTTON);
        attachEventListeners(commentButtons);
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
    
    // Handle comment button click
    async function handleCommentClick(event) {
      try {
        // Check if extension is active
        let isActive = true;
        try {
          const result = await storageService.get(STORAGE_KEYS.EXTENSION_ACTIVE);
          isActive = result[STORAGE_KEYS.EXTENSION_ACTIVE] !== false;
        } catch (storageError) {
          if (storageError.message && 
              (storageError.message.includes('Extension context invalidated') || 
               storageError.message.includes('Storage get error'))) {
            uiService.showNotification('Extension was updated or reloaded. Please refresh the page.', 'warning');
            return;
          }
        }
        
        if (!isActive) return;
        
        // Find post element and extract text
        const postElement = this.closest(SELECTORS.POST_CONTAINER);
        const postText = extractPostText(postElement);
        
        // Save post text for side panel
        try {
          await storageService.set({ [STORAGE_KEYS.LAST_POST_TEXT]: postText });
          
          // Show notification that variants are ready in side panel
          uiService.showNotification('Post saved! Check side panel for comment variants.', 'info');
          
          // Optionally open the side panel automatically
          chrome.runtime.sendMessage({ action: "openSidePanel" });
        } catch (saveError) {
          console.error('Failed to save post text:', saveError);
          uiService.showNotification('Error saving post text. Try again.', 'error');
        }
        
        // No longer generate or insert comment automatically
      } catch (error) {
        console.error('Comment handling error:', error);
        uiService.showNotification('Error handling comment button click', 'error');
      }
    }
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
  
  // After loading dependencies, check if extension context is valid
  async function initialize() {
    addStyles();
    try {
      await loadDependencies();
      
      // Check storage accessibility
      const storageAccessible = await storageService.isAccessible();
      if (!storageAccessible) {
        console.warn('Extension context invalidated. Page refresh required.');
        return; // Stop initialization
      }
      
      // Now that dependencies are loaded and storage is accessible, initialize the extension
      const SELECTORS = constants.LINKEDIN_SELECTORS;
      const AI_SETTINGS = constants.AI_SETTINGS;
      initLinkedInAutoCommenter(SELECTORS, AI_SETTINGS, helpers);
    } catch (error) {
      console.error('Failed to initialize extension:', error);
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
