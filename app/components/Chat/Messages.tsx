import React, { useRef, useEffect, useState } from 'react';
import { Paper, Text, Avatar, Stack, ScrollArea, Loader } from '@mantine/core';
import { Message } from 'ai';
import { CodeHighlight, InlineCodeHighlight } from '@mantine/code-highlight';
import { useScrollIntoView } from '@mantine/hooks';

interface MessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export default function Messages({ messages, isLoading }: MessagesProps) {
  const { scrollIntoView, targetRef, scrollableRef } = useScrollIntoView<HTMLDivElement>({
    duration: 200,
    offset: 60,
    cancelable: true,
  });

  useEffect(() => {
    scrollIntoView({ alignment: 'end' });
  }, [messages, scrollIntoView]);

  const processMessageContent = (message: string): React.ReactNode[] => {
    try {
      if (message.startsWith('{') && message.endsWith('}')) {
        try {
          const parsed = JSON.parse(message);
          message = parsed.content || message;
        } catch (e) {
          console.error('Failed to parse JSON message:', e);
        }
      }

      const codeBlockRegex = /```(\w+)\s*([\s\S]+?)```/g;
      const inlineCodeRegex = /`([^`]+)`/g;
      const parts: React.ReactNode[] = [];

      const splitMessage = message.split(/(```\w+\s*[\s\S]+?```)/g);

      splitMessage.forEach((part, index) => {
        if (codeBlockRegex.test(part)) {
          codeBlockRegex.lastIndex = 0;
          const match = codeBlockRegex.exec(part);
          if (match) {
            const [, language, code] = match;
            parts.push(
              <ScrollArea key={`block-${index}`} ml="sm" mt="sm" mb="sm" maw="100%">
                <CodeHighlight code={code.trim()} language={language} withCopyButton={false} />
              </ScrollArea>
            );
          }
        } else {
          let intermediateLastIndex = 0;
          part.replace(inlineCodeRegex, (match, code, matchIndex) => {
            if (matchIndex > intermediateLastIndex) {
              parts.push(
                <Text component="span" key={`text-${index}-${matchIndex}`}>
                  {part.slice(intermediateLastIndex, matchIndex)}
                </Text>
              );
            }
            parts.push(
              <InlineCodeHighlight key={`inline-${index}-${matchIndex}`} code={code.trim()} />
            );
            intermediateLastIndex = matchIndex + match.length;
            return match;
          });

          if (intermediateLastIndex < part.length) {
            parts.push(
              <Text component="span" key={`text-${index}-final`}>
                {part.slice(intermediateLastIndex)}
              </Text>
            );
          }
        }
      });

      return parts;
    } catch (error) {
      console.error('Error processing message:', error);
      return [<Text key="fallback">{message}</Text>];
    }
  };

  return (
    <Stack
      p="xs"
      style={{
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
      ref={scrollableRef}
    >
      <div style={{ flex: '1 0 auto' }}>
        {messages.map((msg, index) => (
          <div
            key={`${msg.id}-${index}`}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'assistant' ? 'flex-start' : 'flex-end',
              width: '100%',
              marginBottom: 'var(--mantine-spacing-md)',
            }}
          >
            <Paper
              shadow="md"
              p="md"
              radius="lg"
              style={{
                maxWidth: '85%',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
              withBorder
            >
              {msg.role === 'assistant' ? (
                <Avatar radius="xl" src="/linky.png" alt="Linky" />
              ) : (
                <Avatar radius="xl">🧑‍💻</Avatar>
              )}
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {processMessageContent(msg.content)}
              </div>
            </Paper>
          </div>
        ))}
        {isLoading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              width: '100%',
              marginBottom: 'var(--mantine-spacing-md)',
            }}
          >
            <Paper
              shadow="md"
              p="md"
              radius="lg"
              style={{
                maxWidth: '85%',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
              withBorder
            >
              <Avatar radius="xl" src="/linky.png" alt="Linky" />
              <Loader size="sm" type="bars" m="sm" />
            </Paper>
          </div>
        )}
      </div>
      <div ref={targetRef} />
    </Stack>
  );
}
