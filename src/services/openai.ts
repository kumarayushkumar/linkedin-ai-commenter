// API service for handling OpenAI requests
import { OPENAI_API_KEY } from "../config";
import { AI_SETTINGS } from "../utils/constants";

interface OpenAIError extends Error {
  userMessage?: string;
}

interface OpenAIResponse {
  choices: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export class OpenAIService {
  private apiKey: string;

  constructor() {
    this.apiKey = OPENAI_API_KEY;
  }

  /**
   * Generate a comment for a LinkedIn post
   * @param postText - The text content of the post
   * @param prompt - Custom prompt instructions
   * @returns Generated comment(s)
   */
  async generateComment(
    postText: string,
    prompt: string
  ): Promise<string | string[]> {
    try {
      const apiKey = OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error("API key not configured");
      }

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: AI_SETTINGS.MODEL,
            messages: [
              {
                role: "developer",
                content:
                  "You are a content creator with 5 years of experience. And do not use Markdown",
              },
              { role: "user", content: `${postText}\n\n---\n${prompt}` },
            ],
            temperature: AI_SETTINGS.TEMPERATURE,
            n: 3,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "API Error");
      }

      const data = (await response.json()) as OpenAIResponse;
      let result;

      result = data.choices.map(
        (choice) => choice.message?.content?.trim() || ""
      );

      console.log("Generated comment:", result);
      return result;
    } catch (error) {
      console.error("OpenAI API Error:", error);

      const enhancedError = error as OpenAIError;

      // Format error message based on type
      if (enhancedError.message.includes("API key")) {
        enhancedError.userMessage =
          "API key not configured. Please update your settings.";
      } else if (
        enhancedError.message.includes("rate limit") ||
        enhancedError.message.includes("quota")
      ) {
        enhancedError.userMessage =
          "API rate limit exceeded. Please try again later.";
      } else if (
        enhancedError.message.includes("network") ||
        enhancedError.message.includes("connect")
      ) {
        enhancedError.userMessage =
          "Network error. Please check your internet connection.";
      } else {
        enhancedError.userMessage = `Error: ${enhancedError.message}`;
      }

      throw enhancedError;
    }
  }
}

// Export as singleton
const openAIService = new OpenAIService();
export default openAIService;
