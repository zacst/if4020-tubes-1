import React, { useState } from 'react';
import type { Contact, Message } from '../../types';
import { colors } from '../../theme/colors';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { EmptyChat } from './EmptyChat';

interface ChatAreaProps {
  contact: Contact | null;
  messages: Message[];
}

export const ChatArea: React.FC<ChatAreaProps> = ({ contact, messages }) => {
  const [message, setMessage] = useState('');

  if (!contact) {
    return <EmptyChat />;
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: colors.bg.chat }}>
      <ChatHeader contact={contact} />
      <MessageList messages={messages} />
      <ChatInput message={message} onMessageChange={setMessage} />
    </div>
  );
};