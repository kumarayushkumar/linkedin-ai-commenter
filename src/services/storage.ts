/**
 * Storage handler for Chrome storage
 */

export const STORAGE_KEYS = {
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
  static async get(keys: string | string[]): Promise<Record<string, any>> {
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
      } catch (error: any) {
        reject(new Error(`Storage get error: ${error.message}`));
      }
    });
  }

  /**
   * Save data to Chrome storage
   * @param data - Data to save
   */
  static async set(data: Record<string, any>): Promise<void> {
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
      } catch (error: any) {
        reject(new Error(`Storage set error: ${error.message}`));
      }
    });
  }

  /**
   * Check if storage is accessible
   * @returns Whether storage is accessible
   */
  static async isAccessible(): Promise<boolean> {
    try {
      await this.get("test");
      return true;
    } catch (error: any) {
      if (error.message && error.message.includes("Extension context invalidated")) {
        return false;
      }
      return true;
    }
  }
}

export default StorageService;
