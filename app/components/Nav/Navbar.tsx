import { useState, useEffect } from 'react';
import { Group, Title, UnstyledButton } from '@mantine/core';
import Link from 'next/link';
import './navbar.css';
import Linky from '../Linky/linky';
import { useMediaQuery } from '@mantine/hooks';

export function Navbar() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return( 
    <Group justify='space-between'>       
      {window.location.pathname === '/chat' && 
        <Title mb={20} ml={isMobile ? 30 : 60} ta="left" >
          Chat with <span style={{ color: '#01b7FF' }}>Linky</span>.
        </Title>
      }   
      <UnstyledButton href="/" component={Link}>
        <Linky />
      </UnstyledButton>
    </Group>
  );
}
