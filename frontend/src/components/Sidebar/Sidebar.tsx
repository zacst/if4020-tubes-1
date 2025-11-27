import React from 'react';
import type { Contact } from '../../types';
import { colors } from '../../theme/colors';
import { SidebarHeader } from './SidebarHeader';
import { SearchBar } from './SearchBar';
import { ContactList } from './ContactList';

interface SidebarProps {
  contacts: Contact[];
  onSelectChat: (contact: Contact) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ contacts, onSelectChat }) => {
  return (
    <div style={{ width: '30%', backgroundColor: colors.bg.primary, display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <SidebarHeader />
      <SearchBar />
      <ContactList contacts={contacts} onSelectContact={onSelectChat} />
    </div>
  );
};