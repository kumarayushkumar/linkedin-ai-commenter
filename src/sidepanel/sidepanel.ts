// LinkedIn Auto Commenter - Side Panel Script
// Handles side panel UI and interactions

import openAIService from '../services/openai';
import StorageService, { STORAGE_KEYS } from '../services/storage';

/**
 * UI handler for the side panel
 */
class SidePanelUI {
  private settingsTab: HTMLElement;
  private responseTab: HTMLElement;
  private settingsContent: HTMLElement;
  private responseContent: HTMLElement;
  private promptInput: HTMLInputElement;
  private status: HTMLElement;
  private activeToggle: HTMLInputElement;
  private gptResponses: HTMLElement;
  private responseStatus: HTMLElement;

  constructor() {
    this.settingsTab = document.getElementById('settingsTab')!;
    this.responseTab = document.getElementById('responseTab')!;
    this.settingsContent = document.getElementById('settingsContent')!;
    this.responseContent = document.getElementById('responseContent')!;
    this.promptInput = document.getElementById('customPrompt') as HTMLInputElement;
    this.status = document.getElementById('status')!;
    this.activeToggle = document.getElementById('activeToggle') as HTMLInputElement;
    this.gptResponses = document.getElementById('gptResponses')!;
    this.responseStatus = document.getElementById('responseStatus')!;

    this.initTabSwitching();
    this.initSettingsHandlers();
    this.loadSettings();
    this.initResponseHandlers();
  }

  private initTabSwitching(): void {
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

  private initResponseHandlers(): void {
    this.gptResponses.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('copy-button')) {
        const text = target.previousElementSibling?.textContent || '';
        navigator.clipboard.writeText(text);
      }
    });
  }

  private async fetchVariants(): Promise<void> {
    const variants = this.gptResponses.querySelectorAll('.response-variant');
    variants.forEach(variant => {
      variant.textContent = 'Loading...';
    });

    try {
      const lastPostText = (await StorageService.get(STORAGE_KEYS.LAST_POST_TEXT))[STORAGE_KEYS.LAST_POST_TEXT];
      const customPrompt = (await StorageService.get(STORAGE_KEYS.CUSTOM_PROMPT))[STORAGE_KEYS.CUSTOM_PROMPT];
      const comments = await openAIService.generateComment(lastPostText, customPrompt);

      variants.forEach((variant, index) => {
        variant.textContent = comments[index] || 'No response';
      });
    } catch (error) {
      console.error('Error fetching variants:', error);
    }
  }

  private initSettingsHandlers(): void {
    const saveBtn = document.getElementById('savePrompt')!;
    const resetBtn = document.getElementById('resetPrompt')!;

    saveBtn.addEventListener('click', async () => {
      const customPrompt = this.promptInput.value;
      await StorageService.set({ [STORAGE_KEYS.CUSTOM_PROMPT]: customPrompt });
      this.status.textContent = 'Prompt saved!';
    });

    resetBtn.addEventListener('click', async () => {
      await StorageService.set({ [STORAGE_KEYS.CUSTOM_PROMPT]: '' });
      this.promptInput.value = '';
      this.status.textContent = 'Prompt reset!';
    });

    this.activeToggle.addEventListener('change', async () => {
      const isActive = this.activeToggle.checked;
      await StorageService.set({ [STORAGE_KEYS.EXTENSION_ACTIVE]: isActive });
      this.status.textContent = isActive ? 'Extension activated!' : 'Extension deactivated!';
    });
  }

  private async loadSettings(): Promise<void> {
    const result = await StorageService.get([STORAGE_KEYS.CUSTOM_PROMPT, STORAGE_KEYS.EXTENSION_ACTIVE]);
    this.promptInput.value = result[STORAGE_KEYS.CUSTOM_PROMPT] || '';
    this.activeToggle.checked = result[STORAGE_KEYS.EXTENSION_ACTIVE] !== false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SidePanelUI();
});
