import { IUrlEntry } from "./UrlButton";
import { ICard } from "./Card";

export async function crawlDocument(
  url: string,
  setEntries: React.Dispatch<React.SetStateAction<IUrlEntry[]>>,
  setCards: React.Dispatch<React.SetStateAction<ICard[]>>,
  splittingMethod: string,
  chunkSize: number,
  overlap: number
): Promise<void> {
  setEntries((seeded: IUrlEntry[]) =>
    seeded.map((seed: IUrlEntry) =>
      seed.url === url ? { ...seed, loading: true } : seed
    )
  );

  try {
    const response = await fetch("/api/crawl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        options: {
          splittingMethod,
          chunkSize,
          overlap,
        },
      }),
    });

    if (!response.ok) {
      // Handle non-200 responses
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    setCards(data.documents);

    setEntries((prevEntries: IUrlEntry[]) =>
      prevEntries.map((entry: IUrlEntry) =>
        entry.url === url ? { ...entry, seeded: true, loading: false } : entry
      )
    );
  } catch (error) {
    console.error("Failed to fetch or parse response:", error);
  }
}

export async function fetchDocumentTitle(
  url: string,
  setTitle: (title: string) => void
): Promise<void> {
  try {
    const response = await fetch("/api/fetchTitle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      // Handle non-200 responses
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    setTitle(data.title);
  } catch (error) {
    console.error("Failed to fetch or parse response:", error);
  }
}

export async function clearIndex(
  setEntries: React.Dispatch<React.SetStateAction<IUrlEntry[]>>,
  setCards: React.Dispatch<React.SetStateAction<ICard[]>>
) {
  const response = await fetch("/api/clearIndex", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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