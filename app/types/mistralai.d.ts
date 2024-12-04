declare module '@mistralai/mistralai' {
  export class Mistral {
    constructor(config: { apiKey: string });

    chat: {
      stream(params: {
        model: string;
        messages: Array<{
          role: string;
          content: string;
        }>;
      }): AsyncIterableIterator<{
        id: string;
        object: string;
        created: number;
        model: string;
        choices: Array<{
          index: number;
          delta: {
            content?: string;
          };
          finish_reason: string | null;
        }>;
      }>;

      complete(params: {
        model: string;
        messages: Array<{
          role: string;
          content: string;
        }>;
      }): Promise<{
        id: string;
        object: string;
        created: number;
        model: string;
        choices: Array<{
          index: number;
          message: {
            role: string;
            content: string;
          };
          finish_reason: string;
        }>;
      }>;
    };

    embeddings: {
      create(params: { model: string; inputs: string | string[] }): Promise<{
        data: Array<{
          embedding: number[];
        }>;
      }>;
    };
  }
}
