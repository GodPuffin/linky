import { getEmbeddings } from '../../utils/embeddings';
import {
  Document,
  MarkdownTextSplitter,
  RecursiveCharacterTextSplitter,
} from '@pinecone-database/doc-splitter';
import { Pinecone, PineconeRecord, ServerlessSpecCloudEnum } from '@pinecone-database/pinecone';
import { chunkedUpsert } from '../../utils/chunkedUpsert';
import md5 from 'md5';
import { truncateStringByBytes } from '../../utils/truncateString';
import { getUserNamespace } from '../../utils/namespace';

interface SeedOptions {
  splittingMethod: string;
  chunkSize: number;
  chunkOverlap: number;
}

// Define the Page interface
interface Page {
  url: string;
  content: string;
}

type DocumentSplitter = RecursiveCharacterTextSplitter | MarkdownTextSplitter;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function seed(
  url: string,
  limit: number,
  indexName: string,
  cloudName: ServerlessSpecCloudEnum,
  regionName: string,
  options: SeedOptions,
  userId: string,
  onProgress: (progress: number, documents?: any) => Promise<void>
) {
  try {
    const pinecone = new Pinecone();
    const namespace = getUserNamespace(userId);

    // Initialize Pinecone index
    const indexList = (await pinecone.listIndexes())?.indexes?.map((index) => index.name) || [];
    const indexExists = indexList.includes(indexName);
    if (!indexExists) {
      await pinecone.createIndex({
        name: indexName,
        dimension: 1024,
        waitUntilReady: true,
        spec: { serverless: { cloud: cloudName, region: regionName } },
      });
    }
    const index = pinecone.Index(indexName);

    // Fetch content using Jina Reader

    const jinaUrl = `https://r.jina.ai/${url}`;
    const response = await fetch(jinaUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch content from Jina Reader: ${response.statusText}`);
    }
    const content = await response.text();

    if (!content || content.trim().length === 0) {
      throw new Error('No content retrieved from URL');
    }

    const page = {
      url,
      content: content.trim(),
    };

    // Split the document
    const { splittingMethod, chunkSize, chunkOverlap } = options;
    const splitter =
      splittingMethod === 'recursive'
        ? new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap })
        : new MarkdownTextSplitter({});

    const documents = await prepareDocument(page, splitter);
    const totalChunks = documents.length;

    // Send initial progress with a small delay
    await onProgress(0);
    await delay(100);

    // Process documents

    const vectors = [];
    let processedCount = 0;

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      try {
        const vector = await embedDocument(doc);
        vectors.push(vector);
        processedCount++;

        // Calculate progress as percentage of documents processed
        const progress = Math.round((processedCount / totalChunks) * 100);

        try {
          await onProgress(progress);
          // Add a small delay between progress updates
          await delay(100);
        } catch (progressError) {
          console.error('[SEED] Error sending progress:', progressError);
        }
      } catch (error) {
        console.error(`[SEED] Error embedding document ${i + 1}:`, error);
        continue;
      }
    }

    // Upsert vectors to Pinecone

    await chunkedUpsert(index, vectors, namespace);

    // Send final progress with documents
    try {
      await onProgress(100, documents);
    } catch (finalProgressError) {
      console.error('[SEED] Error sending final progress:', finalProgressError);
    }

    return { documents };
  } catch (error) {
    console.error('[SEED] Error in seed function:', error);
    throw error;
  }
}

async function embedDocument(doc: Document): Promise<PineconeRecord> {
  try {
    // Validate document content
    if (!doc.pageContent || doc.pageContent.trim().length === 0) {
      throw new Error('Empty document content');
    }

    const contentLength = doc.pageContent.trim().length;

    // Generate embeddings for the document content
    const embedding = await getEmbeddings(doc.pageContent);

    // Create a hash of the document content
    const hash = md5(doc.pageContent);

    return {
      id: hash,
      values: embedding,
      metadata: {
        chunk: doc.pageContent,
        text: doc.metadata.text as string,
        url: doc.metadata.url as string,
        hash: doc.metadata.hash as string,
      },
    } as PineconeRecord;
  } catch (error) {
    throw error;
  }
}

async function prepareDocument(page: Page, splitter: DocumentSplitter): Promise<Document[]> {
  // Get the content of the page
  const pageContent = page.content;

  // Split the documents using the provided splitter
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        url: page.url,
        // Truncate the text to a maximum byte length
        text: truncateStringByBytes(pageContent, 36000),
      },
    }),
  ]);

  // Map over the documents and add a hash to their metadata
  return docs.map((doc: Document) => {
    return {
      pageContent: doc.pageContent,
      metadata: {
        ...doc.metadata,
        // Create a hash of the document content
        hash: md5(doc.pageContent),
      },
    };
  });
}

export default seed;
