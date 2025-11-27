import React, { useState } from 'react';
import { colors } from '../../theme/colors';
import { InputField } from './InputField';
import { Button } from './Button';
import { MessageCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
  onSwitchToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { username?: string; password?: string } = {};

    if (!username) {
      newErrors.username = 'Username is required';
    } else if (username.length < 5) {
      newErrors.username = 'Username must be at least 5 characters';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onLogin(username, password);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      backgroundColor: colors.bg.primary,
      padding: '20px'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '440px', 
        backgroundColor: colors.bg.secondary, 
        borderRadius: '12px', 
        padding: '48px 40px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            backgroundColor: colors.accent.primary, 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <MessageCircle size={40} color={colors.bg.primary} />
          </div>
          <h1 style={{ color: colors.text.primary, margin: 0, fontSize: '28px', fontWeight: 500 }}>
            Welcome Back
          </h1>
          <p style={{ color: colors.text.secondary, margin: '8px 0 0 0', fontSize: '15px' }}>
            Sign in to continue to ChatApp
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <InputField
            type="username"
            placeholder="Username"
            value={username}
            onChange={setUsername}
            error={errors.username}
          />

          <InputField
            type="password"
            placeholder="Password"
            value={password}
            onChange={setPassword}
            error={errors.password}
          />

          <div style={{ textAlign: 'right', marginTop: '-4px' }}>
            <a href="#" style={{ color: colors.accent.primary, fontSize: '14px', textDecoration: 'none' }}>
              Forgot password?
            </a>
          </div>

          <Button text="Sign In" onClick={handleSubmit} variant="primary" />

          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <span style={{ color: colors.text.secondary, fontSize: '14px' }}>
              Don't have an account?{' '}
            </span>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onSwitchToRegister(); }}
              style={{ color: colors.accent.primary, fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}
            >
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};