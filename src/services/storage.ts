/**
 * Storage handler for Chrome storage
 */

export interface StorageKeys {
  EXTENSION_ACTIVE: string;
  PROMP_TEMPLATE: string;
  LAST_POST_TEXT: string;
  CUSTOM_PROMPT: string;
}

// Define storage keys upfront for consistency and maintainability
export const STORAGE_KEYS: StorageKeys = {
  EXTENSION_ACTIVE: "extensionActive",
  PROMP_TEMPLATE: "defaultPrompt",
  LAST_POST_TEXT: "lastPostText",
  CUSTOM_PROMPT: "customPrompt",
};

class StorageService {
  /**
   * Get data from Chrome storage
   * @param keys - Keys to retrieve
   * @returns Storage data
   */
  static async get(keys: string | string[]): Promise<{ [key: string]: any }> {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.sync.get(keys, (result) => {
          const error = chrome.runtime.lastError;
          if (error) {
            reject(new Error(`Storage error: ${error.message}`));
          } else {
            resolve(result);
          }
        });
      } catch (error) {
        reject(new Error(`Storage get error: ${(error as Error).message}`));
      }
    });
  }

  /**
   * Save data to Chrome storage
   * @param data - Data to save
   */
  static async set(data: { [key: string]: any }): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.sync.set(data, () => {
          const error = chrome.runtime.lastError;
          if (error) {
            reject(new Error(`Storage error: ${error.message}`));
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(new Error(`Storage set error: ${(error as Error).message}`));
      }
    });
  }

  /**
   * Check if storage is accessible
   * @returns Whether storage is accessible
   */
  static async isAccessible(): Promise<boolean> {
    try {
      await this.get('test');
      return true;
    } catch (error) {
      if ((error as Error).message && (error as Error).message.includes('Extension context invalidated')) {
        return false;
      }
      // Other errors might be temporary, so we'll assume storage is still accessible
      return true;
    }
  }
}

export default StorageService;
