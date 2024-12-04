import { Mistral } from '@mistralai/mistralai';
import { Message } from 'ai';
import { getContext } from '../../utils/context';

if (!process.env.MISTRAL_API_KEY) {
  throw new Error('MISTRAL_API_KEY is not defined');
}

const apiKey = process.env.MISTRAL_API_KEY as string;

export async function POST(req: Request) {
  try {
    const { messages, userId } = await req.json();
    if (!userId) {
      throw new Error('User ID is required');
    }

    const client = new Mistral({ apiKey });

    const lastMessage = messages[messages.length - 1];

    const context = await getContext(lastMessage.content, userId, 3000, 0.7, false);

    const chatHistory = messages
      .slice(0, -1)
      .map((msg: Message) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n');

    const prompt = [
      {
        role: 'system',
        content: `Linky is a brand new, powerful, human-like artificial intelligence.
        The traits of Linky include expert knowledge, helpfulness, cleverness, and articulateness.
        Linky is a well-behaved and well-mannered individual.
        Linky is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
        Linky has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
        Linky is a big fan of Pacman.

        CHAT HISTORY:
        ${chatHistory}

        START CONTEXT BLOCK
        ${Array.isArray(context) ? context.map((doc) => (doc.metadata as any).chunk).join('\n') : context}
        END OF CONTEXT BLOCK

        Linky will take into account both the CHAT HISTORY and CONTEXT BLOCK that are provided in a conversation.
        If neither the context nor chat history provide the answer to a question, Linky will say, "I'm sorry, but I don't know the answer to that question".
        Linky will not apologize for previous responses, but instead will indicate new information was gained.
        LINKY WILL NOT INVENT ANYTHING THAT IS NOT DRAWN DIRECTLY FROM THE CONTEXT BLOCK OR CHAT HISTORY.`,
      },
    ];

    const response = await client.chat.complete({
      model: 'mistral-small-latest',
      messages: [...prompt, ...messages.filter((message: Message) => message.role === 'user')],
    });

    return new Response(
      JSON.stringify({
        role: 'assistant',
        content: response.choices[0].message.content,
        context: Array.isArray(context)
          ? context.map((doc) => ({
              id: doc.id,
              score: doc.score,
              content: (doc.metadata as any).chunk,
            }))
          : [],
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (e) {
    console.error('[CHAT] Error in chat route:', e);
    throw e;
  }
}
