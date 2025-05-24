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
  async generateComment(content: string): Promise<string | string[]> {
    try {
      if (!this.apiKey) {
        throw new Error("API key not configured");
      }

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: AI_SETTINGS.MODEL,
            messages: [
              {
                role: "system",
                content:
                  "You are a content creator with 5 years of experience. And do not use Markdown",
              },
              { role: "user", content },
            ],
            temperature: AI_SETTINGS.TEMPERATURE,
            n: AI_SETTINGS.N,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "API Error");
      }

      let result = (data.choices || []).map(
        (choice: { message: { content: string } }) =>
          choice.message?.content?.trim() || ""
      );
      return result;
    } catch (error) {
      const enhancedError = new Error(
        error instanceof Error ? error.message : "Unknown error"
      ) as OpenAIError;

      // Format error message based on type
      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          enhancedError.userMessage =
            "API key not configured. Please update your settings.";
        } else if (
          error.message.includes("rate limit") ||
          error.message.includes("quota")
        ) {
          enhancedError.userMessage =
            "API rate limit exceeded. Please try again later.";
        } else if (
          error.message.includes("network") ||
          error.message.includes("connect")
        ) {
          enhancedError.userMessage =
            "Network error. Please check your internet connection.";
        } else {
          enhancedError.userMessage = error.message || "An error occurred";
        }
      } else {
        enhancedError.userMessage = "An unexpected error occurred";
      }

      throw enhancedError;
    }
  }
}

const openAIService = new OpenAIService();
export default openAIService;
