import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return new Response('URL parameter is required', { status: 400 });
  }

  // Set up SSE headers
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  };

  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      let interval: NodeJS.Timeout;

      try {
        // Send initial progress
        controller.enqueue(`data: ${JSON.stringify({ progress: 0 })}\n\n`);

        // Update progress every 500ms
        interval = setInterval(() => {
          if (closed) {
            clearInterval(interval);
            try {
              controller.close();
            } catch (e) {
              console.error('Error closing controller:', e);
            }
            return;
          }

          try {
            controller.enqueue(`data: ${JSON.stringify({ progress: 0 })}\n\n`);
          } catch (e) {
            console.error('Error enqueueing progress:', e);
            clearInterval(interval);
            closed = true;
          }
        }, 500);
      } catch (e) {
        console.error('Error in stream start:', e);
        closed = true;
      }

      // Clean up on close
      return () => {
        closed = true;
        clearInterval(interval);
      };
    },

    cancel() {
      closed = true;
    },
  });

  return new Response(stream, { headers });
}
