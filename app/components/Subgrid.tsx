import { Container, useMantineTheme } from '@mantine/core';
import { ReactNode } from 'react';
import classes from './Subgrid.module.css';

interface SubgridProps {
  children: ReactNode;
}

export function Subgrid({ children }: SubgridProps) {
  const theme = useMantineTheme();

  return (
    <Container p={0} h="100%">
      <div
        style={{
          maxHeight: 'calc(100vh - 300px)',
          // overflowY: 'auto',
        }}
      >
        <div className={classes.columnContainer}>
          {Array.isArray(children) &&
            children.map((child, index) => (
              <div
                key={index}
                style={{
                  breakInside: 'avoid',
                  marginBottom: theme.spacing.md,
                  pageBreakInside: 'avoid',
                  display: 'inline-block',
                  width: '100%',
                }}
              >
                {child}
              </div>
            ))}
        </div>
      </div>
    </Container>
  );
}
