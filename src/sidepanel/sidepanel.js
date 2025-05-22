// LinkedIn Auto Commenter - Side Panel Script
// Handles side panel UI and interactions

import StorageHandler from '../services/storage.js';

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
    this.saveBtn = document.getElementById('savePrompt');
    this.status = document.getElementById('status');
    this.activeToggle = document.getElementById('activeToggle');
    
    // Response elements
    this.gptResponses = document.getElementById('gptResponses');
    this.responseStatus = document.getElementById('responseStatus');
    
    // Initialize UI
    this.initTabSwitching();
    this.initSettingsHandlers();
    this.loadSettings();
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
  
  // Set up settings tab handlers
  initSettingsHandlers() {
    this.saveBtn.addEventListener('click', async () => {
      await StorageHandler.set({ 
        customPrompt: this.promptInput.value,
        extensionActive: this.activeToggle.checked
      });
      
      this.status.textContent = 'Settings saved!';
      setTimeout(() => this.status.textContent = '', 1500);
    });
    
    this.activeToggle.addEventListener('change', async () => {
      await StorageHandler.set({ extensionActive: this.activeToggle.checked });
    });
  }
  
  // Load settings from storage
  async loadSettings() {
    const result = await StorageHandler.get(['customPrompt', 'extensionActive']);
    
    if (result.customPrompt) {
      this.promptInput.value = result.customPrompt;
    }
    
    this.activeToggle.checked = result.extensionActive !== false;
  }
  
  // Fetch comment variants from OpenAI
  async fetchVariants() {
    // Reset UI state
    this.gptResponses.querySelectorAll('.response-variant').forEach(el => {
      el.textContent = 'Loading...';
      el.onclick = null;
    });
    
    this.responseStatus.textContent = '';
    
    try {
      // Get data from storage
      const result = await StorageHandler.get(['customPrompt', 'lastPostText']);
      const prompt = result.customPrompt || 'Write a relevant comment for this post:';
      const postText = result.lastPostText || 'Sample LinkedIn post.';
      
      // Get API key and generate variants
      const apiKey = typeof OPENAI_API_KEY !== 'undefined' ? OPENAI_API_KEY : '';
      const completions = await this.generateCommentVariants(apiKey, postText, prompt);
      
      // Update UI with results
      this.gptResponses.querySelectorAll('.response-variant').forEach((el, idx) => {
        el.textContent = completions[idx] || '';
        el.onclick = () => this.copyToClipboard(el.textContent);
      });
    } catch (error) {
      console.error('Error fetching variants:', error);
      this.gptResponses.querySelectorAll('.response-variant').forEach(el => {
        el.textContent = 'Error loading response.';
      });
      this.responseStatus.textContent = `Failed: ${error.message || 'Unknown error'}`;
    }
  }
  
  // Copy text to clipboard and show confirmation
  copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    this.responseStatus.textContent = 'Copied to clipboard!';
    setTimeout(() => this.responseStatus.textContent = '', 1200);
  }
  
  // Generate comment variants using OpenAI
  async generateCommentVariants(apiKey, postText, prompt) {
    if (!apiKey || apiKey === "sk-...your-key-here...") {
      return [
        "Please set your OpenAI API key in config.js",
        "You need a valid API key to generate comments",
        "Update the OPENAI_API_KEY constant in your config.js file"
      ];
    }
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: `${postText}\n\n---\n${prompt}` }],
          n: 3,
          max_tokens: 60,
          temperature: 0.7,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('OpenAI API error:', error);
        throw new Error(error.error?.message || 'API Error');
      }
      
      const data = await response.json();
      return (data.choices || []).map(choice => choice.message.content.trim());
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }
}

// Initialize the side panel UI when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SidePanelUI();
});
