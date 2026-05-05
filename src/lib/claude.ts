import Anthropic from "@anthropic-ai/sdk";

// Singleton reused across requests in the same process
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default anthropic;
