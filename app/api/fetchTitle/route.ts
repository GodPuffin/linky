import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Extract URL before try block so it's accessible in catch block
  const { url } = await req.json();

  try {
    // Use Jina Reader to fetch the content
    const jinaUrl = `https://r.jina.ai/${url}`;
    const response = await fetch(jinaUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch content from Jina Reader: ${response.statusText}`);
    }

    const content = await response.text();

    // Look for "Title:" pattern first
    const titleMatch = content.match(/Title:\s*([^\n]+)/);
    if (titleMatch) {
      return NextResponse.json({ title: titleMatch[1].trim() });
    }

    // If no explicit title found, get the first non-empty line
    const firstLine = content
      .split('\n')
      .find((line) => line.trim().length > 0)
      ?.trim()
      ?.substring(0, 100); // Limit title length

    // If we found a title, use it; otherwise fall back to the URL
    const title = firstLine || url.replace(/^https?:\/\//, '').split('/')[0];

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Error fetching title:', error);
    // Return a cleaned up version of the URL as fallback
    const fallbackTitle = url.replace(/^https?:\/\//, '').split('/')[0];
    return NextResponse.json({ title: fallbackTitle });
  }
}
