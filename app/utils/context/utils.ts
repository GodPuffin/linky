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
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    // If we got a title, use it; otherwise, use a fallback
    setTitle(data.title || 'Untitled Document');
  } catch (error) {
    console.error('Failed to fetch title:', error);
    // Set a fallback title that includes part of the URL
    setTitle(url.replace(/^https?:\/\//, '').split('/')[0]);
  }
}
