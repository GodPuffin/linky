import seed from './seed';
import { NextResponse } from 'next/server';
import { ServerlessSpecCloudEnum } from '@pinecone-database/pinecone';

export const runtime = 'edge';

export async function POST(req: Request) {
  // Create a ReadableStream with a controller
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await req.json();

        const { url, options, userId } = body;
        if (!url || !userId) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'URL and User ID are required' })}\n\n`)
          );
          controller.close();
          return;
        }

        const sendProgress = async (progress: number, documents?: any) => {
          const data = documents ? { progress, documents } : { progress };
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch (error) {
            console.error('[SERVER] Error sending progress:', error);
          }
        };

        const result = await seed(
          url,
          1,
          process.env.PINECONE_INDEX!,
          (process.env.PINECONE_CLOUD as ServerlessSpecCloudEnum) || 'aws',
          process.env.PINECONE_REGION || 'us-west-2',
          options,
          userId,
          sendProgress
        );

        controller.close();
      } catch (error) {
        console.error('[SERVER] Error:', error);
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: String(error) })}\n\n`)
          );
        } catch (writeError) {
          console.error('[SERVER] Error writing error to stream:', writeError);
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

const encoder = new TextEncoder();
