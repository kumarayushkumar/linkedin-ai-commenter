// LinkedIn Auto Commenter - Side Panel Script
// Handles side panel UI and interactions

import StorageService, { STORAGE_KEYS } from '../services/storage.js';

/**
 * UI handler for the side panel
 */
class SidePanelUI {
  constructor() {
    // Tab elements
    this.settingsTab = document.getElementById('settingsTab');
    this.responseTab = document.getElementById('responseTab');
    this.settingsContent = document.getElementById('settingsContent');
    this.responseContent = document.getElementById('responseContent');
    
    // Settings elements
    this.promptInput = document.getElementById('customPrompt');
    this.status = document.getElementById('status');
    this.activeToggle = document.getElementById('activeToggle');
    
    // Response elements
    this.gptResponses = document.getElementById('gptResponses');
    this.responseStatus = document.getElementById('responseStatus');
    
    // Initialize UI
    this.initTabSwitching();
    this.initSettingsHandlers();
    this.loadSettings();
    this.initResponseHandlers();
    
    // Load OpenAI service
    this.loadOpenAIService();
  }
  
  // Dynamically load the OpenAI service
  async loadOpenAIService() {
    try {
      const baseURL = chrome.runtime.getURL('src/');
      const openAIModule = await import(baseURL + 'services/openai.js');
      this.openAIService = openAIModule.default;
    } catch (error) {
      console.error('Failed to load OpenAI service:', error);
    }
  }
  
  // Set up tab switching behavior
  initTabSwitching() {
    this.settingsTab.addEventListener('click', () => {
      this.settingsTab.classList.add('active');
      this.responseTab.classList.remove('active');
      this.settingsContent.style.display = '';
      this.responseContent.style.display = 'none';
    });
    
    this.responseTab.addEventListener('click', () => {
      this.responseTab.classList.add('active');
      this.settingsTab.classList.remove('active');
      this.responseContent.style.display = '';
      this.settingsContent.style.display = 'none';
      this.fetchVariants();
    });
  }
  
  // Set up response tab handlers for copying
  initResponseHandlers() {
    this.gptResponses.addEventListener('click', (e) => {
      const variant = e.target.closest('.response-variant');
      if (variant && variant.textContent !== 'Loading...') {
        const text = variant.textContent;
        navigator.clipboard.writeText(text)
          .then(() => {
            this.responseStatus.textContent = 'Comment copied to clipboard!';
            setTimeout(() => this.responseStatus.textContent = '', 3000);
          })
          .catch(err => {
            console.error('Failed to copy text:', err);
            this.responseStatus.textContent = 'Failed to copy comment';
            setTimeout(() => this.responseStatus.textContent = '', 3000);
          });
      }
    });
  }
  
  // Fetch comment variants from OpenAI
  async fetchVariants() {
    // Set all variants to loading state
    const variants = this.gptResponses.querySelectorAll('.response-variant');
    variants.forEach(variant => {
      variant.textContent = 'Loading...';
    });
    
    try {
      // Make sure OpenAI service is loaded
      if (!this.openAIService) {
        await this.loadOpenAIService();
        if (!this.openAIService) {
          throw new Error('OpenAI service not available');
        }
      }
      
      // Get the last post text from storage
      const result = await StorageService.get([STORAGE_KEYS.LAST_POST_TEXT]);
      const postText = result[STORAGE_KEYS.LAST_POST_TEXT];
      
      if (!postText) {
        variants.forEach(variant => {
          variant.textContent = 'No post selected. Click on a LinkedIn post comment button first.';
        });
        return;
      }
      
      // Get custom prompt from storage
      const customPrompt = await StorageService.get(STORAGE_KEYS.CUSTOM_PROMPT);
      
      // Generate 3 comment variants
      const comments = await this.openAIService.generateComment(postText, customPrompt, {
        n: 3
      });
      
      // Parse the response - it might return as a single string with separators
      let commentArray = [];
      if (Array.isArray(comments)) {
        commentArray = comments;
      } else if (typeof comments === 'string') {
        // Split by "---" if the API returned all variants in one string
        commentArray = comments.split(/\s*---\s*/g).filter(c => c.trim());
      }
      
      // Update variants with comments
      variants.forEach((variant, index) => {
        if (commentArray[index]) {
          variant.textContent = commentArray[index];
        } else {
          variant.textContent = 'No comment variant generated';
        }
      });
      
    } catch (error) {
      console.error('Failed to fetch variants:', error);
      this.responseStatus.textContent = error.userMessage || 'Failed to generate comments';
      
      variants.forEach(variant => {
        variant.textContent = 'Error generating comment variants';
      });
    }
  }
  
  // Set up settings tab handlers
  initSettingsHandlers() {
    this.saveBtn = document.getElementById('savePrompt');
    this.resetBtn = document.getElementById('resetPrompt');
    
    this.saveBtn.addEventListener('click', async () => {
      const promptNote = document.querySelector('.prompt-note');
      
      await StorageService.set({ 
        [STORAGE_KEYS.CUSTOM_PROMPT]: this.promptInput.value,
        [STORAGE_KEYS.EXTENSION_ACTIVE]: this.activeToggle.checked
      });
      
      // Update the prompt note to indicate we're using a custom prompt
      promptNote.textContent = "You're using a custom prompt. You can reset to the default using the button below.";
      
      this.status.textContent = 'Settings saved!';
      setTimeout(() => this.status.textContent = '', 3000);
    });
    
    this.resetBtn.addEventListener('click', async () => {
      const promptNote = document.querySelector('.prompt-note');
      
      // Get the default prompt from background script
      chrome.runtime.sendMessage({ action: 'getDefaultPrompt' }, async (response) => {
        if (response && response.defaultPrompt) {
          this.promptInput.value = response.defaultPrompt;
          
          // Clear the custom prompt from storage
          await StorageService.set({ [STORAGE_KEYS.CUSTOM_PROMPT]: '' });
          
          // Update the prompt note to indicate we're using the default prompt
          promptNote.textContent = "This is the default prompt. You can customize it to control how the AI generates comments.";
          
          this.status.textContent = 'Prompt reset to default!';
          setTimeout(() => this.status.textContent = '', 3000);
        }
      });
    });
    
    this.activeToggle.addEventListener('change', async () => {
      await StorageService.set({ [STORAGE_KEYS.EXTENSION_ACTIVE]: this.activeToggle.checked });
    });
  }
  
  // Load settings from storage
  async loadSettings() {
    const result = await StorageService.get([STORAGE_KEYS.CUSTOM_PROMPT, STORAGE_KEYS.EXTENSION_ACTIVE]);
    const promptNote = document.querySelector('.prompt-note');
    
    // If user has a custom prompt saved, use that
    if (result[STORAGE_KEYS.CUSTOM_PROMPT]) {
      this.promptInput.value = result[STORAGE_KEYS.CUSTOM_PROMPT];
      promptNote.textContent = "You're using a custom prompt. You can reset to the default using the button below.";
    } else {
      chrome.runtime.sendMessage({ action: 'getDefaultPrompt' }, (response) => {
        if (response && response.defaultPrompt) {
          this.promptInput.value = response.defaultPrompt;
          promptNote.textContent = "This is the default prompt. You can customize it to control how the AI generates comments.";
        }
      });
    }
    
    this.activeToggle.checked = result[STORAGE_KEYS.EXTENSION_ACTIVE] !== false;
  }
}

// Initialize the side panel UI when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SidePanelUI();
});
