import md5 from 'md5';

export function getUserNamespace(userId: string): string {
  return md5(userId).substring(0, 16); // Pinecone namespace has character limits
}
