import React, { useState, useEffect } from 'react';
import type { Contact, Message } from '../../types';
import { colors } from '../../theme/colors';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { EmptyChat } from './EmptyChat';
import * as api from '../../utils/api';
import * as crypto from '../../utils/crypto';

interface ChatAreaProps {
  contact: Contact | null;
  currentUser: { username: string, privateKey: string } | null;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ contact, currentUser }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (contact) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 2000);
      return () => clearInterval(interval);
    }
  }, [contact]);

  const fetchMessages = async () => {
    if (!contact || !currentUser) return;
    try {
      const { data } = await api.getMessages(contact.name);
      const processedMessages = data.map((msg: any) => {
        try {
          // Decrypt using Static ECDH: My Private Key + Contact's Public Key
          // This works for both sent and received messages because:
          // SharedSecret = MyPriv * ContactPub == ContactPriv * MyPub
          const decrypted = crypto.decryptMessage(
            msg.encrypted_message, 
            currentUser.privateKey, 
            (contact as any).publicKey
          );
          
          return {
            id: msg.id,
            text: decrypted,
            time: new Date(msg.timestamp).toLocaleTimeString(),
            sent: msg.sender_username === currentUser.username
          };
        } catch (e) {
          return {
            id: msg.id,
            text: "Failed to decrypt message",
            time: new Date(msg.timestamp).toLocaleTimeString(),
            sent: msg.sender_username === currentUser.username
          };
        }
      });
      setMessages(processedMessages);
    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !contact || !currentUser) return;

    try {
      const timestamp = new Date().toISOString();
      
      // Encrypt using Static ECDH: My Private Key + Contact's Public Key
      const encrypted = crypto.encryptMessage(
        message, 
        (contact as any).publicKey, 
        currentUser.privateKey
      );
      
      const hash = crypto.hashMessage(encrypted);
      const signature = crypto.signMessage(hash, currentUser.privateKey);

      await api.sendMessage({
        sender_username: currentUser.username,
        receiver_username: contact.name,
        encrypted_message: encrypted,
        message_hash: hash,
        signature_r: (signature as any).r,
        signature_s: (signature as any).s,
        timestamp: timestamp
      });

      setMessage('');
      fetchMessages();
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  if (!contact) {
    return <EmptyChat />;
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: colors.bg.chat }}>
      <ChatHeader contact={contact} />
      <MessageList messages={messages} />
      <ChatInput 
        message={message} 
        onMessageChange={setMessage} 
        onSend={handleSendMessage}
      />
    </div>
  );
};