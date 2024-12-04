import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { getUserNamespace } from '../../utils/namespace';

export async function POST(req: Request) {
  try {
    // Check if request has a body
    const text = await req.text();
    if (!text) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request body is empty',
        },
        { status: 400 }
      );
    }

    // Try to parse the JSON
    let body;
    try {
      body = JSON.parse(text);
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      );
    }

    const { userId } = body;

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
    const indexes = await pinecone.listIndexes();
    const indexExists = indexes?.indexes?.some((index) => index.name === indexName);

    if (!indexExists) {
      return NextResponse.json({
        success: true,
        message: 'No index to clear',
      });
    }

    const index = pinecone.Index(indexName);
    const namespace = getUserNamespace(userId);

    try {
      // Check if default namespace has records
      const stats = await index.describeIndexStats();
      const defaultNamespaceCount = stats.namespaces?.['']?.recordCount ?? 0;

      if (defaultNamespaceCount > 0) {
        await index.namespace('').deleteAll();
      }

      // Also try to delete from the user's namespace
      try {
        await index.namespace(namespace).deleteAll();
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          return NextResponse.json({
            success: true,
            message: 'No data to clear',
          });
        }
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: 'Index cleared successfully',
      });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
