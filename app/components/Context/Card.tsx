import React, { FC } from 'react';
import { Paper, Text, Box, Anchor, Group, Stack } from '@mantine/core';

export interface ICard {
  pageContent: string;
  metadata: {
    hash: string;
    url?: string;
    title?: string;
  };
}

interface ICardProps {
  card: ICard;
  selected: string[] | null;
}

export const Card: FC<ICardProps> = ({ card, selected }) => {
  const isSelected = selected && selected.includes(card.metadata.hash);

  // Function to clean and format the content
  const formatContent = (content: string): string => {
    // Skip empty or very short content
    if (!content || content.length < 10) return '';

    return (
      content
        // Convert markdown links to readable text
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
        // Remove reference-style links
        .replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1')
        // Remove reference definitions
        .replace(/^\[[^\]]+\]:.+$/gm, '')
        // Remove citation references
        .replace(/\[\^[^\]]*\]/g, '')
        // Clean up multiple spaces
        .replace(/\s+/g, ' ')
        // Clean up multiple newlines but keep paragraph breaks
        .replace(/\n{3,}/g, '\n\n')
        // Remove table formatting
        .replace(/\|/g, ' ')
        .replace(/^[-\s|]+$/gm, '')
        // Remove markdown headers
        .replace(/^#+\s/gm, '')
        // Clean up HTML entities
        .replace(/&[a-z]+;/g, ' ')
        // Remove URLs
        .replace(/https?:\/\/[^\s]+/g, '')
        // Clean up any remaining markdown artifacts
        .replace(/[_*~`]/g, '')
        // Remove empty brackets
        .replace(/\[\]/g, '')
        // Clean up multiple dashes
        .replace(/--+/g, '-')
        // Remove lines that are just whitespace or punctuation
        .split('\n')
        .filter((line) => {
          const trimmed = line.trim();
          return trimmed.length > 0 && !/^[-_.,;:!?()[\]{}]+$/.test(trimmed);
        })
        .join('\n')
        // Final trim and remove extra spaces
        .trim()
        .replace(/\s+/g, ' ')
    );
  };

  const formattedContent = formatContent(card.pageContent);

  if (!formattedContent || formattedContent.length < 10) {
    return null;
  }

  return (
    <Paper
      id={card.metadata.hash}
      shadow="md"
      radius="lg"
      p="md"
      style={{
        backgroundColor: isSelected ? '#616264' : '#434446',
        borderColor: isSelected ? '#0076a5' : 'transparent',
        borderWidth: isSelected ? 2 : 1,
        borderStyle: 'solid',
        opacity: isSelected ? 0.8 : 0.4,
        transition: 'all 300ms ease-in-out',
        color: 'white',
        width: '100%',
        height: 'fit-content',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
      onMouseOver={(e) => {
        if (!isSelected) e.currentTarget.style.opacity = '0.8';
      }}
      onMouseOut={(e) => {
        if (!isSelected) e.currentTarget.style.opacity = '0.6';
      }}
    >
      <Text size="sm" style={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
        {formattedContent}
      </Text>
      <Stack gap="xs" mt="xs">
        {/* {card.metadata.url && (
          <Group gap="xs">
            <Text size="xs" fw={700} color="dimmed">
              Source:
            </Text>
            <Anchor 
              size="xs" 
              href={card.metadata.url} 
              target="_blank" 
              rel="noopener noreferrer"
              color="blue.4"
            >
              {card.metadata.title || new URL(card.metadata.url).hostname}
            </Anchor>
          </Group>
        )} */}
        <Text size="xs" c="dimmed">
          {card.metadata.hash}
        </Text>
      </Stack>
    </Paper>
  );
};
