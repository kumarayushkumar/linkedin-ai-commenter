// API service for handling OpenAI requests
import { OPENAI_API_KEY } from "../config";
import { AI_SETTINGS } from "../utils/constants";

class OpenAIService {
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
  async generateComment(postText: string, prompt: string): Promise<string> {
    try {
      if (!this.apiKey || this.apiKey === "sk-...your-key-here...") {
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

      const data = await response.json();
      const result = JSON.stringify(data) + JSON.stringify(postText + prompt);

      console.log("Generated comment:", result);
      return result;
    } catch (error: any) {
      console.error("OpenAI API Error:", error);

      if (error.message.includes("API key")) {
        error.userMessage = "API key not configured. Please update your settings.";
      } else if (
        error.message.includes("rate limit") ||
        error.message.includes("quota")
      ) {
        error.userMessage = "API rate limit exceeded. Please try again later.";
      } else if (
        error.message.includes("network") ||
        error.message.includes("connect")
      ) {
        error.userMessage = "Network error. Please check your internet connection.";
      } else {
        error.userMessage = `Error: ${error.message}`;
      }

      throw error;
    }
  }
}

const openAIService = new OpenAIService();
export default openAIService;
