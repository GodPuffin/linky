import { ScoredPineconeRecord } from '@pinecone-database/pinecone';
import { getMatchesFromEmbeddings } from './pinecone';
import { getEmbeddings } from './embeddings';
import { getUserNamespace } from './namespace';

export type Metadata = {
  url: string;
  text: string;
  chunk: string;
  hash: string;
};

export const getContext = async (
  message: string,
  userId: string,
  maxTokens = 3000,
  minScore = 0.7,
  getOnlyText = true
): Promise<string | ScoredPineconeRecord[]> => {
  const namespace = getUserNamespace(userId);

  try {
    // If message is empty, get all documents in the namespace
    if (!message) {
      const response = await fetch('/api/getAllDocuments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ namespace, userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const { documents } = await response.json();
      return documents;
    }

    // Original context fetching logic
    const embedding = await getEmbeddings(message);
    const matches = await getMatchesFromEmbeddings(embedding, 3, namespace);
    const qualifyingDocs = matches.filter((m) => m.score && m.score > minScore);

    if (!getOnlyText) {
      return qualifyingDocs;
    }

    let docs = matches ? qualifyingDocs.map((match) => (match.metadata as Metadata).chunk) : [];
    return docs.join('\n').substring(0, maxTokens);
  } catch (error) {
    console.error('Error in getContext:', error);
    throw error;
  }
};
