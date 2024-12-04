import { IUrlEntry } from './UrlButton';
import { ICard } from './Card';

export async function crawlDocument(
  url: string,
  setEntries: React.Dispatch<React.SetStateAction<IUrlEntry[]>>,
  setCards: React.Dispatch<React.SetStateAction<ICard[]>>,
  splittingMethod: string,
  chunkSize: number,
  overlap: number,
  userId: string
): Promise<void> {
  setEntries((prevEntries: IUrlEntry[]) =>
    prevEntries.map((entry: IUrlEntry) =>
      entry.url === url ? { ...entry, loading: true, error: false, progress: 0 } : entry
    )
  );

  try {
    const response = await fetch('/api/crawl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        options: {
          splittingMethod,
          chunkSize,
          overlap,
        },
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        setEntries((prevEntries: IUrlEntry[]) =>
          prevEntries.map((entry: IUrlEntry) =>
            entry.url === url ? { ...entry, seeded: true, loading: false } : entry
          )
        );
        break;
      }

      const chunk = decoder.decode(value);

      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.trim() && line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.error) {
              throw new Error(data.error);
            }

            if (data.progress !== undefined) {
              setEntries((prevEntries: IUrlEntry[]) =>
                prevEntries.map((entry: IUrlEntry) =>
                  entry.url === url
                    ? {
                        ...entry,
                        progress: data.progress,
                        seeded: data.progress === 100,
                        loading: data.progress !== 100,
                      }
                    : entry
                )
              );
            }

            if (data.documents) {
              const newCards = data.documents.map((doc: any) => ({
                pageContent: doc.pageContent,
                metadata: {
                  hash: doc.metadata.hash,
                  url: doc.metadata.url,
                },
              }));
              setCards((prevCards) => [...prevCards, ...newCards]);
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch or parse response:', error);
    setEntries((prevEntries: IUrlEntry[]) =>
      prevEntries.map((entry: IUrlEntry) =>
        entry.url === url ? { ...entry, error: true, loading: false, progress: 0 } : entry
      )
    );
  }
}

export async function fetchDocumentTitle(
  url: string,
  setTitle: (title: string) => void
): Promise<void> {
  try {
    const response = await fetch('/api/fetchTitle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      // Handle non-200 responses
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    setTitle(data.title);
  } catch (error) {
    console.error('Failed to fetch or parse response:', error);
  }
}

export async function clearIndex(
  setEntries: React.Dispatch<React.SetStateAction<IUrlEntry[]>>,
  setCards: React.Dispatch<React.SetStateAction<ICard[]>>,
  userId: string
) {
  const response = await fetch('/api/clearIndex', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });

  if (response.ok) {
    setEntries((prevEntries: IUrlEntry[]) =>
      prevEntries.map((entry: IUrlEntry) => ({
        ...entry,
        seeded: false,
        loading: false,
      }))
    );
    setCards([]);
  }
}
