'use client';

import Chat from '../components/Chat';
import Context from '../components/Context';
import { SimpleGrid, Paper, Drawer, ActionIcon } from '@mantine/core';
import { useMediaQuery, useViewportSize } from '@mantine/hooks';
import { useChat } from 'ai/react';
import { useEffect, useRef, useState, FormEvent } from 'react';
import { Message } from 'ai';
import Navbar from '../components/Nav/Navbar';
import '../page.css';
import { IconMenu2 } from '@tabler/icons-react';

const ChatPage: React.FC = () => {
  const { height } = useViewportSize();
  const userId = 'default-user';
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<string[] | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [drawerOpened, setDrawerOpened] = useState(false);

  const mobileHeight = height - 80;
  const desktopHeight = height - 100;

  const { messages, input, handleInputChange, setMessages, setInput } = useChat({
    api: '/api/chat',
    body: { userId },
    onError: (error) => {
      console.error('[CHAT PAGE] Error:', error);
      setIsLoading(false);
    },
  });

  const handleMessageSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput(''); // Clear input immediately

    // Add user message immediately
    const userMessageObj: Message = {
      content: userMessage,
      role: 'user',
      id: String(Date.now()),
    };
    const newMessages = [...messages, userMessageObj];
    setMessages(newMessages);

    setIsLoading(true);
    setContext(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Add assistant's response
      const assistantMessage: Message = {
        content: data.content,
        role: 'assistant',
        id: String(Date.now() + 1),
      };
      setMessages([...newMessages, assistantMessage]);

      // Update context if provided
      if (data.context) {
        setContext(data.context.map((c: any) => c.id));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Navbar text="Chat with Linky." />
      {isMobile ? (
        <>
          <Paper
            p="xl"
            shadow="xs"
            radius="lg"
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              overflow: 'hidden',
              margin: 'var(--mantine-spacing-md)',
            }}
          >
            <Chat
              input={input}
              handleInputChange={handleInputChange}
              handleMessageSubmit={handleMessageSubmit}
              messages={messages}
              isLoading={isLoading}
              showDrawerButton={true}
              onDrawerOpen={() => setDrawerOpened(true)}
            />
          </Paper>
          <Drawer
            opened={drawerOpened}
            onClose={() => setDrawerOpened(false)}
            size="100%"
            position="bottom"
          >
            <Context className="" selected={context} height={mobileHeight} userId={userId} />
          </Drawer>
        </>
      ) : (
        <SimpleGrid
          cols={{ base: 1, sm: 2 }}
          spacing={{ base: 10, sm: 'xl' }}
          verticalSpacing={{ base: 'md', sm: 'xl' }}
          style={{
            flex: 1,
            overflow: 'hidden',
            padding: 'var(--mantine-spacing-md)',
          }}
        >
          <Paper
            p="xl"
            shadow="xs"
            radius="lg"
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              overflow: 'hidden',
            }}
          >
            <Chat
              input={input}
              handleInputChange={handleInputChange}
              handleMessageSubmit={handleMessageSubmit}
              messages={messages}
              isLoading={isLoading}
              showDrawerButton={false}
            />
          </Paper>
          <Context className="" selected={context} height="100%" userId={userId} />
        </SimpleGrid>
      )}
    </div>
  );
};

export default ChatPage;
