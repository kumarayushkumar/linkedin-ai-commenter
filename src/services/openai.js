// API service for handling OpenAI requests
import { OPENAI_API_KEY } from '../config.js';
import { AI_SETTINGS } from '../utils/constants.js';

class OpenAIService {
  constructor() {
    this.apiKey = OPENAI_API_KEY;
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
      const { 
        model = AI_SETTINGS.MODEL, 
        temperature = AI_SETTINGS.TEMPERATURE, 
        maxTokens = AI_SETTINGS.MAX_TOKENS, 
        n = 1 
      } = options;
      
      // Try to get API key from storage first
      const apiKey = OPENAI_API_KEY
      
      if (!apiKey || apiKey === "sk-...your-key-here...") {
        throw new Error('API key not configured');
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
      
      console.log('Generated comment:', result);
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
}

// Export as singleton
const openAIService = new OpenAIService();
export default openAIService;
