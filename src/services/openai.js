// API service for handling OpenAI requests
class OpenAIService {
  constructor() {
    this.apiKey = typeof OPENAI_API_KEY !== 'undefined' ? OPENAI_API_KEY : '';
    this.responseCache = new Map(); // Cache for API responses
  }

  /**
   * Get API key from storage if available
   * @returns {Promise<string>} API key
   */
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
    return this.apiKey;
  }

  /**
   * Generate a comment for a LinkedIn post
   * @param {string} postText - The text content of the post
   * @param {string} prompt - Custom prompt instructions
   * @param {object} options - Configuration options
   * @returns {Promise<string|string[]>} Generated comment(s)
   */
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
  
  /**
   * Clear the response cache
   */
  clearCache() {
    this.responseCache.clear();
    console.log('OpenAI response cache cleared');
  }
}

// Export as singleton
const openAIService = new OpenAIService();
export default openAIService;
