import {
  GenerateContentParameters,
  GoogleGenAI,
  GenerateContentResponse,
} from "@google/genai";

class RateLimiter {
  private requestLog: Map<string, number[]> = new Map();
  private lastRequestTime: Map<string, number> = new Map();
  private maxRequestsPerMinute: number = 5;
  private readonly ONE_MINUTE_MS = 60 * 1000;
  private readonly MIN_DELAY_MS = 10 * 1000; // 10 seconds between requests

  async throttle(model: string): Promise<void> {
    const now = Date.now();
    let timestamps = this.requestLog.get(model) || [];
    const lastReq = this.lastRequestTime.get(model) || 0;

    // 1. Enforce minimum delay between requests (pacing)
    const timeSinceLastReq = now - lastReq;
    if (timeSinceLastReq < this.MIN_DELAY_MS) {
      const pacingWaitTime = this.MIN_DELAY_MS - timeSinceLastReq;
      console.log(
        `\n⏱️ Pacing API calls. Waiting ${Math.ceil(pacingWaitTime / 1000)} seconds before next call to ${model}...`,
      );
      await new Promise((resolve) => setTimeout(resolve, pacingWaitTime));
      return this.throttle(model); // Re-evaluate after waiting
    }

    // 2. Enforce total RPM limit
    timestamps = timestamps.filter((time) => now - time < this.ONE_MINUTE_MS);

    if (timestamps.length >= this.maxRequestsPerMinute) {
      // We've hit the limit. Need to wait until the oldest request in the window expires.
      const oldestTimestamp = timestamps[0];
      const waitTime = this.ONE_MINUTE_MS - (now - oldestTimestamp);

      console.log(
        `\n⏳ Rate limit reached for model ${model}. Waiting for ${Math.ceil(waitTime / 1000)} seconds...`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime + 100)); // Add 100ms buffer

      // Update timestamps array recursively (as more might have expired while waiting)
      return this.throttle(model);
    }

    // Register this request
    timestamps.push(Date.now());
    this.requestLog.set(model, timestamps);
    this.lastRequestTime.set(model, Date.now());
  }
}

// Singleton instance
const globalRateLimiter = new RateLimiter();

/**
 * A wrapper around genAI.models.generateContent that automatically respects
 * rate limits (e.g. 10 requests per minute) per model.
 *
 * @param genAI The GoogleGenAI instance
 * @param params The standard generateContent parameters
 * @returns The GenerateContentResponse
 */
export async function generateContentWithRateLimit(
  genAI: GoogleGenAI,
  params: GenerateContentParameters,
): Promise<GenerateContentResponse> {
  const modelName = params.model;

  if (!modelName) {
    throw new Error("Model name is required for rate limiting.");
  }

  await globalRateLimiter.throttle(modelName);
  return await genAI.models.generateContent(params);
}
