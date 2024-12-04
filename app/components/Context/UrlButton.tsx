// UrlButton.tsx
import React, { FC } from 'react';
import { Button, RingProgress, Text, Skeleton } from '@mantine/core';
import { IconShare2, IconCheck, IconAlertCircle } from '@tabler/icons-react';

export interface IUrlEntry {
  url: string;
  title: string;
  seeded: boolean;
  loading: boolean;
  error?: boolean;
  progress?: number;
}

interface IURLButtonProps {
  entry: IUrlEntry;
  onClick: () => Promise<void>;
  loading: boolean;
}

const UrlButton: FC<IURLButtonProps> = ({ entry, onClick, loading }) => {
  const getButtonColor = () => {
    if (entry.error) return 'red';
    if (entry.seeded) return 'green';
    return 'gray';
  };

  const getButtonIcon = () => {
    if (entry.loading) {
      return (
        <RingProgress
          size={24}
          thickness={2}
          roundCaps
          sections={[{ value: entry.progress || 0, color: '#01b7ff' }]}
          label={
            <Text size="xs" ta="center">
              {Math.round(entry.progress || 0)}%
            </Text>
          }
        />
      );
    }
    if (entry.seeded) return <IconCheck />;
    if (entry.error) return <IconAlertCircle />;
    return <IconShare2 />;
  };

  if (loading && !entry.loading) {
    return <Skeleton height={36} radius="lg" width={120} />;
  }

  return (
    <div style={{ position: 'relative' }}>
      <Button
        variant="light"
        color={getButtonColor()}
        onClick={onClick}
        style={{ position: 'relative' }}
        disabled={loading}
        leftSection={getButtonIcon()}
      >
        {entry.title}
      </Button>
    </div>
  );
};

export default UrlButton;
