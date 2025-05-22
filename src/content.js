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
        const result = await storageService.get(STORAGE_KEYS.EXTENSION_ACTIVE);
        const isActive = result[STORAGE_KEYS.EXTENSION_ACTIVE] !== false;
        if (!isActive) return;
        
        // Find post element and extract text
        const postElement = this.closest(SELECTORS.POST_CONTAINER);
        const postText = extractPostText(postElement);
        
        // Save post text for side panel
        await storageService.set({ [STORAGE_KEYS.LAST_POST_TEXT]: postText });
        
        // Wait for comment box to appear
        const commentBox = await uiService.waitForElement(SELECTORS.COMMENT_BOX);
        const editorContainer = commentBox?.querySelector('.editor-container') || commentBox;
        const commentInput = await uiService.waitForElement(SELECTORS.COMMENT_INPUT, editorContainer);
        
        // Show loading indicator
        const loadingIndicator = uiService.createLoadingIndicator('Generating comment');
        commentBox.appendChild(loadingIndicator);
        
        // Get custom prompt from storage
        const customPrompt = await storageService.get(STORAGE_KEYS.CUSTOM_PROMPT);
        
        try {
          // Generate comment with OpenAI
          const gptComment = await openAIService.generateComment(postText, customPrompt, {
            model: AI_SETTINGS.MODEL,
            temperature: AI_SETTINGS.TEMPERATURE,
            maxTokens: AI_SETTINGS.MAX_TOKENS
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
  function initialize() {
    addStyles();
    loadDependencies().catch(error => {
      console.error('Failed to load dependencies:', error);
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
