import { sha3_256 } from 'js-sha3';
import { ec as EC } from 'elliptic';
import CryptoJS from 'crypto-js';

// Initialize Elliptic Curve (secp256k1 as most commonly used)
const ec = new EC('secp256k1');

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

// --- Hashing Function ---

export const hashMessage = (text: string): string => {
  // SHA3-256
  return sha3_256(text);
};

// --- Signing Functions (ECDSA) ---

export const signMessage = (message: string, privateKey: string): {r: string, s: string} => {
  const messageHash = hashMessage(message);
  
  // Load the private key from hex string
  const key = ec.keyFromPrivate(privateKey);
  
  // Sign the hash with canonical option to ensure Low-S (required by go-ethereum)
  const signature = key.sign(messageHash, { canonical: true });
  
  // Return r and s values (standard ECDSA output)
  // Pad with leading zeros to ensure 32 bytes (64 hex chars)
  return { 
    r: signature.r.toString(16).padStart(64, '0'), 
    s: signature.s.toString(16).padStart(64, '0') 
  };
};

export const verifySignature = (hash: string, signature: any, publicKey: string): boolean => {
  try {
    // Load the public key
    const key = ec.keyFromPublic(publicKey, 'hex');
    
    // Verify the signature
    return key.verify(hash, signature);
  } catch (error) {
    console.error("Verification failed:", error);
    return false;
  }
};

// --- Encryption Functions (Static ECDH + AES) ---

export const encryptMessage = (text: string, recipientPublicKey: string, senderPrivateKey: string): string => {
  // 1. Derive the Shared Secret: (My Private Key + Recipient Public Key)
  const myKey = ec.keyFromPrivate(senderPrivateKey);
  const recipientKey = ec.keyFromPublic(recipientPublicKey, 'hex');
  const sharedSecret = myKey.derive(recipientKey.getPublic()).toString(16);
  
  // 2. Encrypt the text using AES and the Shared Secret
  const encryptedText = CryptoJS.AES.encrypt(text, sharedSecret).toString();
  
  return encryptedText;
};

export const decryptMessage = (encryptedText: string, myPrivateKey: string, otherPartyPublicKey: string): string => {
  // 1. Derive the Shared Secret: (My Private Key + Other Party Public Key)
  const myKey = ec.keyFromPrivate(myPrivateKey);
  const otherKey = ec.keyFromPublic(otherPartyPublicKey, 'hex');
  const sharedSecret = myKey.derive(otherKey.getPublic()).toString(16);
  
  // 2. Decrypt the text using AES and the Shared Secret
  const bytes = CryptoJS.AES.decrypt(encryptedText, sharedSecret);
  const originalText = bytes.toString(CryptoJS.enc.Utf8);
  
  return originalText;
};

// --- Key Management ---

export const storeKeyPair = (username: string, keyPair: KeyPair): void => {
  localStorage.setItem(`chatApp_privateKey_${username}`, keyPair.privateKey);
  localStorage.setItem(`chatApp_publicKey_${username}`, keyPair.publicKey);
  sessionStorage.setItem('currentUser', username);
  sessionStorage.setItem('currentPrivateKey', keyPair.privateKey);
};

export const getStoredPrivateKey = (username: string): string | null => {
  const sessionUser = sessionStorage.getItem('currentUser');
  const sessionKey = sessionStorage.getItem('currentPrivateKey');
  
  if (sessionUser === username && sessionKey) {
    return sessionKey;
  }
  
  return localStorage.getItem(`chatApp_privateKey_${username}`);
};

export const getStoredPublicKey = (username: string): string | null => {
  return localStorage.getItem(`chatApp_publicKey_${username}`);
};

export const clearUserSession = (): void => {
  sessionStorage.removeItem('currentUser');
  sessionStorage.removeItem('currentPrivateKey');
  sessionStorage.removeItem('sessionToken');
};

export const generateKeyPair = (): KeyPair => {
  const key = ec.genKeyPair();
  return {
    privateKey: key.getPrivate().toString('hex'),
    publicKey: key.getPublic().encode('hex', true)
  };
};

export const generateKeyPairFromPassword = async (password: string): Promise<KeyPair> => {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const key = ec.keyFromPrivate(hashHex);
  
  return {
    privateKey: hashHex,
    publicKey: key.getPublic().encode('hex', true)
  };
};

export const verifyPasswordMatchesKeys = async (username: string, password: string): Promise<boolean> => {
  const storedPrivateKey = getStoredPrivateKey(username);
  if (!storedPrivateKey) {
    return false;
  }
  
  const generatedKeys = await generateKeyPairFromPassword(password);
  return generatedKeys.privateKey === storedPrivateKey;
};

export const markPasswordAsRegistered = (username: string): void => {
  localStorage.setItem(`chatApp_hasRegistered_${username}`, 'true');
};

export const hasUserRegistered = (username: string): boolean => {
  return localStorage.getItem(`chatApp_hasRegistered_${username}`) === 'true';
};

export const generateRandomChallenge = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const getCurrentUser = (): string | null => {
  return sessionStorage.getItem('currentUser');
};

export const getCurrentUserKeyPair = (): KeyPair | null => {
  const username = getCurrentUser();
  if (!username) return null;
  
  const privateKey = getStoredPrivateKey(username);
  const publicKey = getStoredPublicKey(username);
  
  if (!privateKey || !publicKey) return null;
  
  return { privateKey, publicKey };
};

export const isValidPublicKey = (publicKey: string): boolean => {
  try {
    ec.keyFromPublic(publicKey, 'hex');
    return true;
  } catch {
    return false;
  }
};

export const isValidPrivateKey = (privateKey: string): boolean => {
  try {
    ec.keyFromPrivate(privateKey);
    return true;
  } catch {
    return false;
  }
};