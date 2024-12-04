import { Mistral } from '@mistralai/mistralai';

// Utility function to wait
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getEmbeddings(input: string, retries = 3, backoff = 1000) {
  if (!process.env.MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY is not defined');
  }

  // Validate input
  if (!input || input.trim().length === 0) {
    throw new Error('Empty input provided for embedding');
  }

  const cleanedInput = input.replace(/\n/g, ' ').trim();
  if (cleanedInput.length === 0) {
    throw new Error('Input contains only whitespace');
  }

  for (let i = 0; i < retries; i++) {
    try {
      const client = new Mistral({
        apiKey: process.env.MISTRAL_API_KEY,
      });

      const response = await client.embeddings.create({
        model: 'mistral-embed',
        inputs: cleanedInput,
      });

      if (!response.data?.[0]?.embedding) {
        throw new Error('No embedding returned from API');
      }

      return response.data[0].embedding;
    } catch (e: any) {
      // If we hit the rate limit
      if (e.statusCode === 429) {
        await sleep(backoff * Math.pow(2, i)); // Exponential backoff
        continue;
      }

      // For other errors, throw immediately

      throw new Error(`Error calling Mistral embedding API: ${e}`);
    }
  }

  throw new Error('Max retries reached for embedding generation');
}
