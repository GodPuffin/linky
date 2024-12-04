import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

export async function POST(req: Request) {
  try {
    const { namespace, userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    const pinecone = new Pinecone();
    const indexName = process.env.PINECONE_INDEX!;
    const index = pinecone.Index(indexName);

    // Fetch all vectors in the namespace
    const queryResponse = await index.namespace(namespace).query({
      vector: new Array(1024).fill(0), // Dummy vector to match all documents
      topK: 10000, // Adjust based on your needs
      includeMetadata: true,
    });

    return NextResponse.json({
      success: true,
      documents: queryResponse.matches,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
