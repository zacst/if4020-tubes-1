import React, { useState } from 'react';
import type { Contact } from './types';
import { colors } from './theme/colors';
import { contacts, chatMessages } from './data/mock';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ChatArea } from './components/Chat/ChatArea';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';

type AuthView = 'login' | 'register' | 'chat';

const App: React.FC = () => {
  const [authView, setAuthView] = useState<AuthView>('login');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const handleLogin = (name: string, password: string) => {
    console.log('Login:', { name, password });
    setAuthView('chat');
  };

  const handleRegister = (name: string, password: string) => {
    console.log('Register:', { name, password });
    setAuthView('chat');
  };

  if (authView === 'login') {
    return <Login onLogin={handleLogin} onSwitchToRegister={() => setAuthView('register')} />;
  }

  if (authView === 'register') {
    return <Register onRegister={handleRegister} onSwitchToLogin={() => setAuthView('login')} />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: colors.bg.primary }}>
      <Sidebar contacts={contacts} onSelectChat={setSelectedContact} />
      <ChatArea contact={selectedContact} messages={chatMessages} />
    </div>
  );
};

export default App;