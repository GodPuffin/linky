import React from 'react';
import { Stack, TextInput, ActionIcon } from '@mantine/core';
import { IconMessageForward, IconSend, IconMenu2 } from '@tabler/icons-react';
import Messages from './Messages';
import { Message } from 'ai';

interface ChatProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMessageSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  showDrawerButton?: boolean;
  onDrawerOpen?: () => void;
}

const Chat: React.FC<ChatProps> = ({
  messages,
  input,
  handleInputChange,
  handleMessageSubmit,
  isLoading,
  showDrawerButton,
  onDrawerOpen,
}) => {
  return (
    <Stack style={{ height: '100%', justifyContent: 'space-between' }}>
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative' }}>
        <Messages messages={messages} isLoading={isLoading} />
      </div>
      <form onSubmit={handleMessageSubmit}>
        <TextInput
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          disabled={isLoading}
          rightSection={<IconMessageForward />}
          size="lg"
          radius="lg"
          leftSection={
            showDrawerButton && (
              <ActionIcon onClick={onDrawerOpen} variant="subtle">
                <IconMenu2 />
              </ActionIcon>
            )
          }
        />
      </form>
    </Stack>
  );
};

export default Chat;
