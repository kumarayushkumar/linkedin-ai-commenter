/**
 * Storage handler for Chrome storage
 */

// Define storage keys upfront for consistency and maintainability
export const STORAGE_KEYS = {
  EXTENSION_ACTIVE: "extensionActive",
  DEFAULT_PROMPT: "defaultPrompt",
  LAST_POST_TEXT: "lastPostText",
  CUSTOM_PROMPT: "customPrompt",
};

class StorageHandler {
  /**
   * Get data from Chrome storage
   * @param {string|Array<string>} keys - Keys to retrieve
   * @returns {Promise<object>} - Storage data
   */
  static async get(keys) {
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
        reject(new Error(`Storage get error: ${error.message}`));
      }
    });
  }

  /**
   * Save data to Chrome storage
   * @param {object} data - Data to save
   * @returns {Promise<void>}
   */
  static async set(data) {
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
        reject(new Error(`Storage set error: ${error.message}`));
      }
    });
  }
}

export default StorageHandler;
