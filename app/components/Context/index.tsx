import React, { useState, useEffect } from 'react';
import { urls } from './urls';
import UrlButton from './UrlButton';
import { Card, ICard } from './Card';
import { clearIndex, crawlDocument, fetchDocumentTitle } from './utils';
import {
  Button,
  ScrollArea,
  Group,
  Center,
  TextInput,
  Paper,
  Title,
  Skeleton,
  Box,
  LoadingOverlay,
  Loader,
} from '@mantine/core';
import { IconClipboard } from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import { Subgrid } from '../Subgrid';
import { getContext } from '../../utils/context';
import { getUserNamespace } from '../../utils/namespace';

interface ContextProps {
  className: string;
  selected: string[] | null;
  height: string | number;
  userId: string;
}

const Context: React.FC<ContextProps> = ({ className, selected, height, userId }) => {
  const [entries, setEntries] = useState([...urls]);
  const [cards, setCards] = useState<ICard[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputLoading, setInputLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // Load existing context on mount
  useEffect(() => {
    const loadExistingContext = async () => {
      try {
        setIsLoadingInitial(true);
        // Get all context without filtering by message
        const response = await fetch('/api/getAllDocuments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ namespace: getUserNamespace(userId), userId }),
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${await response.text()}`);
        }

        const { success, documents, error } = await response.json();

        if (!success) {
          throw new Error(error || 'Failed to load documents');
        }

        if (Array.isArray(documents)) {
          // Get unique URLs from the context
          const uniqueUrls = new Set(documents.map((doc) => (doc.metadata as any).url));

          // Update entries with existing URLs
          const updatedEntries = Array.from(uniqueUrls).map((url) => ({
            url,
            title: url.replace(/^https?:\/\//, '').split('/')[0], // Temporary title
            seeded: true,
            loading: false,
          }));

          // Fetch titles for each URL
          await Promise.all(
            updatedEntries.map(async (entry) => {
              await fetchDocumentTitle(entry.url, (title) => {
                entry.title = title;
              });
            })
          );

          setEntries((prevEntries) => {
            // Combine existing entries with new ones, avoiding duplicates
            const existingUrls = new Set(prevEntries.map((e) => e.url));
            const newEntries = updatedEntries.filter((e) => !existingUrls.has(e.url));
            return [...prevEntries, ...newEntries];
          });

          // Convert context to cards format
          const contextCards = documents.map((doc) => ({
            pageContent: (doc.metadata as any).chunk,
            metadata: {
              hash: (doc.metadata as any).hash,
            },
          }));

          setCards(contextCards);
        }
      } catch (error) {
        console.error('Error loading existing context:', error);
        showNotification({
          title: 'Error',
          message: error instanceof Error ? error.message : 'Failed to load existing context',
          color: 'red',
        });
      } finally {
        setIsLoadingInitial(false);
        setLoading(false);
      }
    };

    loadExistingContext();
  }, [userId]);

  const handleAddUrl = async (url: string) => {
    setInputLoading(true);
    try {
      const urlExists = entries.some((entry) => entry.url === url);
      if (urlExists) {
        showNotification({
          title: 'Error',
          message: 'URL already exists',
          color: 'orange',
        });
        setInputLoading(false);
        return;
      }

      // Fetch the document title
      let fetchedTitle = '';
      await fetchDocumentTitle(url, (title) => {
        fetchedTitle = title;
      }).catch((error) => {
        console.error('Failed to fetch document title:', error);
        showNotification({
          title: 'Error',
          message: error instanceof Error ? error.message : String(error),
          color: 'red',
        });
      });

      if (!fetchedTitle) {
        fetchedTitle = `URL ${entries.length + 1}`;
      }

      // Add the URL with the fetched or fallback title
      setEntries([
        ...entries,
        {
          url: url,
          title: fetchedTitle,
          seeded: false,
          loading: false,
        },
      ]);
      setUrl('');
    } catch (error) {
      console.error('Failed to add URL:', error);
      showNotification({
        title: 'Error',
        message: error instanceof Error ? error.message : String(error),
        color: 'red',
      });
    } finally {
      setInputLoading(false);
    }
  };

  const splittingMethod = 'markdown';

  // Scroll to selected card
  useEffect(() => {
    const element = selected && document.getElementById(selected[0]);
    element?.scrollIntoView({ behavior: 'smooth' });
  }, [selected]);

  const buttons = entries.map((entry) => (
    <UrlButton
      key={entry.url}
      entry={entry}
      onClick={async () => {
        await crawlDocument(entry.url, setEntries, setCards, splittingMethod, 256, 1, userId);

        // Refresh just the cards after document is crawled
        try {
          const existingContext = await getContext('', userId, 3000, 0, false);
          if (Array.isArray(existingContext)) {
            // Get existing card hashes for deduplication
            const existingHashes = new Set(cards.map((card) => card.metadata.hash));

            // Filter and map new cards
            const newCards = existingContext
              .filter((doc) => !existingHashes.has((doc.metadata as any).hash))
              .map((doc) => ({
                pageContent: (doc.metadata as any).chunk,
                metadata: {
                  hash: (doc.metadata as any).hash,
                  url: (doc.metadata as any).url,
                },
              }));

            // Append new cards to existing ones
            setCards((prevCards) => [...prevCards, ...newCards]);
          }
        } catch (error) {
          console.error('Error refreshing cards:', error);
          showNotification({
            title: 'Error',
            message: 'Failed to refresh context cards',
            color: 'red',
          });
        }
      }}
      loading={loading}
    />
  ));

  const handleClearIndex = async () => {
    await clearIndex(setEntries, setCards, userId);
  };

  // Add loading skeletons for buttons
  const buttonSkeletons = Array(3)
    .fill(0)
    .map((_, index) => (
      <Skeleton key={`button-skeleton-${index}`} height={36} radius="lg" width={120} />
    ));

  // Add loading skeletons for cards
  const cardSkeletons = Array(4)
    .fill(0)
    .map((_, index) => (
      <Skeleton key={`card-skeleton-${index}`} height={200} radius="lg" mb="md" />
    ));

  return (
    <Box p="lg" h={height} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Title order={1} mb="md" ml="xl">
        Sources
      </Title>
      <Paper p="xl" shadow="xs" radius="lg" withBorder mb="lg" mt="lg">
        <Center>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddUrl(url);
            }}
          >
            <TextInput
              size="lg"
              radius="lg"
              placeholder="Paste your URL here"
              value={url}
              rightSection={inputLoading ? <Loader size={16} /> : <IconClipboard />}
              onChange={(e) => setUrl(e.target.value)}
              disabled={inputLoading}
            />
          </form>
        </Center>
        <Group gap="xs" m="md">
          {isLoadingInitial ? buttonSkeletons : buttons}
        </Group>
        <Center>
          <Button
            variant="filled"
            color="#01b7ff"
            onClick={handleClearIndex}
            disabled={loading || isLoadingInitial}
          >
            Clear Index
          </Button>
        </Center>
      </Paper>
      <ScrollArea style={{ flex: 1 }} offsetScrollbars>
        {(Array.isArray(cards) && cards.length > 0) || isLoadingInitial ? (
          <Paper p="xl" radius="lg" mt={12}>
            <Subgrid>
              {isLoadingInitial
                ? cardSkeletons
                : cards.map((card, index) => (
                    <Card key={`${card.metadata.hash}-${index}`} card={card} selected={selected} />
                  ))}
            </Subgrid>
          </Paper>
        ) : null}
      </ScrollArea>
    </Box>
  );
};

export default Context;
