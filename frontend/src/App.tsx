import React, { useState, useEffect } from 'react';
import type { Contact } from './types';
import { colors } from './theme/colors';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ChatArea } from './components/Chat/ChatArea';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import * as api from './utils/api';
import * as crypto from './utils/crypto';

type AuthView = 'login' | 'register' | 'chat';

const App: React.FC = () => {
  const [authView, setAuthView] = useState<AuthView>('login');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentUser, setCurrentUser] = useState<{username: string, privateKey: string, publicKey: string} | null>(null);

  const handleLogin = async (username: string, password: string) => {
    try {
      const keys = crypto.generateKeys(password);
      const { data: { nonce } } = await api.loginChallenge(username);
      const hash = crypto.hashMessage(nonce);
      const signature = crypto.signMessage(hash, keys.privateKey);
      const { data } = await api.loginVerify(username, signature as any);
      
      localStorage.setItem('token', data.token);
      
      setCurrentUser({ username, privateKey: keys.privateKey, publicKey: keys.publicKey });
      setAuthView('chat');
      fetchContacts();
    } catch (error) {
      console.error("Login failed", error);
      alert("Login failed");
    }
  };

  const handleRegister = async (username: string, password: string) => {
    try {
      const keys = crypto.generateKeys(password);
      await api.register(username, keys.publicKey);
      alert("Registered successfully! Please login.");
      setAuthView('login');
    } catch (error) {
      console.error("Register failed", error);
      alert("Registration failed");
    }
  };

  const fetchContacts = async () => {
    try {
      const { data } = await api.getContacts();
      const mappedContacts = data.map((c: any) => ({
        id: c.id,
        name: c.username,
        publicKey: c.publicKey,
        lastMessage: '',
        time: '',
        avatar: `https://ui-avatars.com/api/?name=${c.username}`
      }));
      setContacts(mappedContacts);
    } catch (error) {
      console.error("Failed to fetch contacts", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setAuthView('login');
  };

  if (authView === 'login') {
    return <Login onLogin={handleLogin} onSwitchToRegister={() => setAuthView('register')} />;
  }

  if (authView === 'register') {
    return <Register onRegister={handleRegister} onSwitchToLogin={() => setAuthView('login')} />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: colors.bg.primary }}>
      <Sidebar 
        contacts={contacts} 
        onSelectChat={setSelectedContact} 
        onAddContact={async (username) => {
          await api.addContact(username);
          fetchContacts();
        }}
        onLogout={handleLogout}
      />
      <ChatArea contact={selectedContact} currentUser={currentUser} />
    </div>
  );
};

export default App;