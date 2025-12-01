import React, { useState } from 'react';
import { colors } from '../../theme/colors';
import { InputField } from './InputField';
import { Button } from './Button';
import { MessageCircle, Loader } from 'lucide-react';
import { loginChallenge, loginVerify } from '../../utils/api'; // ✅ Import API functions
import { 
  signMessage, 
  getStoredPrivateKey, 
  verifyPasswordMatchesKeys, 
  hasUserRegistered,
  generateKeyPairFromPassword,
  storeKeyPair
} from '../../utils/crypto';

interface LoginProps {
  onLogin: (username: string, token: string) => void;
  onSwitchToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errors, setErrors] = useState<{ 
    username?: string; 
    password?: string;
    general?: string 
  }>({});

  const validateCredentials = () => {
    const newErrors: { username?: string; password?: string } = {};

    if (!username) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateCredentials()) return;

    setIsLoggingIn(true);
    setErrors({});
    
    try {
      // Optional: Check if user has registered locally
      if (!hasUserRegistered(username)) {
        console.log('User not found in local storage, checking server...');
      }
      
      let privateKey: string;
      let generatedKeyPair = null;

      // Check if we have private key locally
      const storedPrivateKey = getStoredPrivateKey(username);
      
      if (storedPrivateKey) {
        // Verify password matches the stored private key
        const passwordMatches = await verifyPasswordMatchesKeys(username, password);
        if (!passwordMatches) {
          throw new Error('Invalid password. Please check your credentials.');
        }
        privateKey = storedPrivateKey;
      } else {
        // No local key, try to regenerate from password
        console.log('No local key found, regenerating from password...');
        generatedKeyPair = await generateKeyPairFromPassword(password);
        privateKey = generatedKeyPair.privateKey;
      }
      
      // Step 1: Get challenge from server using API utility
      console.log('Requesting challenge from server...');
      const challengeResponse = await loginChallenge(username);
      const challengeData = challengeResponse.data;

      // Backend returns 'nonce', but we handle 'challenge' too just in case
      const challenge = challengeData.nonce || challengeData.challenge;
      
      if (!challenge) {
        throw new Error('No challenge received from server');
      }

      // Step 2: Sign the challenge with our private key
      console.log('Signing challenge with private key...');
      // signMessage returns {r, s} object
      const signature = signMessage(challenge, privateKey);

      // Step 3: Send signature for verification using API utility
      console.log('Sending signature to server...');
      const verifyResponse = await loginVerify(username, signature);
      const verifyData = verifyResponse.data;

      const { token } = verifyData;
      
      if (!token) {
        throw new Error('No authentication token received');
      }

      // Store session data
      sessionStorage.setItem('currentUser', username);
      sessionStorage.setItem('currentPrivateKey', privateKey);
      sessionStorage.setItem('sessionToken', token);
      
      // If we generated a new key pair (recovered account), store it now that login succeeded
      if (generatedKeyPair) {
        storeKeyPair(username, generatedKeyPair);
      }

      // Mark user as registered locally (in case they registered on another device)
      localStorage.setItem(`chatApp_hasRegistered_${username}`, 'true');
      
      console.log('Login successful!');
      onLogin(username, token);
      
    } catch (error: any) {
      console.error('Login error:', error);
      // Handle Axios error structure or standard Error
      const errorMessage = error.response?.data?.error || error.message || 'Login failed. Please try again.';
      setErrors({ 
        general: errorMessage 
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoggingIn) {
      handleLogin();
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
            {isLoggingIn ? (
              <Loader size={40} color={colors.bg.primary} className="spin" />
            ) : (
              <MessageCircle size={40} color={colors.bg.primary} />
            )}
          </div>
          <h1 style={{ color: colors.text.primary, margin: 0, fontSize: '28px', fontWeight: 500 }}>
            {isLoggingIn ? 'Signing In...' : 'Welcome Back'}
          </h1>
          <p style={{ color: colors.text.secondary, margin: '8px 0 0 0', fontSize: '15px', textAlign: 'center' }}>
            {isLoggingIn 
              ? 'Verifying your identity...' 
              : 'Sign in to continue to ChatApp'}
          </p>
        </div>

        {errors.general && (
          <div style={{
            padding: '12px',
            backgroundColor: colors.error + '20',
            border: `1px solid ${colors.error}30`,
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <p style={{ color: colors.error, margin: 0, fontSize: '14px', textAlign: 'center' }}>
              {errors.general}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <InputField
            type="text"
            placeholder="Username"
            value={username}
            onChange={setUsername}
            error={errors.username}
            disabled={isLoggingIn}
            onKeyPress={handleKeyPress}
          />

          <InputField
            type="password"
            placeholder="Password"
            value={password}
            onChange={setPassword}
            error={errors.password}
            disabled={isLoggingIn}
            onKeyPress={handleKeyPress}
          />

          <Button 
            text={isLoggingIn ? "Signing In..." : "Sign In"} 
            onClick={handleLogin} 
            variant="primary" 
            disabled={isLoggingIn}
          />

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

        {isLoggingIn && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: colors.accent.primary + '20',
            borderRadius: '8px',
            border: `1px solid ${colors.accent.primary}30`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Loader size={16} color={colors.accent.primary} className="spin" />
              <span style={{ color: colors.accent.primary, fontSize: '12px', fontWeight: 500 }}>
                Performing cryptographic verification...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};