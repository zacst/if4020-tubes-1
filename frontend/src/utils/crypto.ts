// src/utils/crypto.ts
import { sha3_512 } from 'js-sha3';
import { ec as EC } from 'elliptic';
import CryptoJS from 'crypto-js';

// Initialize Elliptic Curve (secp256k1 as most commonly used)
const ec = new EC('secp256k1');

// ============================================
// Key Management Interface and Storage
// ============================================

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

// Store keys with username prefix
export const storeKeyPair = (username: string, keyPair: KeyPair): void => {
  localStorage.setItem(`chatApp_privateKey_${username}`, keyPair.privateKey);
  localStorage.setItem(`chatApp_publicKey_${username}`, keyPair.publicKey);
  sessionStorage.setItem('currentUser', username);
  sessionStorage.setItem('currentPrivateKey', keyPair.privateKey);
};

export const getStoredPrivateKey = (username: string): string | null => {
  // First try sessionStorage (current session)
  const sessionUser = sessionStorage.getItem('currentUser');
  const sessionKey = sessionStorage.getItem('currentPrivateKey');
  
  if (sessionUser === username && sessionKey) {
    return sessionKey;
  }
  
  // Fall back to localStorage
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

// ============================================
// ECDSA Key Generation and Signing
// ============================================

// Generate ECDSA key pair using elliptic library
export const generateKeyPair = (): KeyPair => {
  const key = ec.genKeyPair();
  return {
    privateKey: key.getPrivate().toString('hex'),
    publicKey: key.getPublic().encode('hex', true) // compressed format
  };
};

// Generate deterministic key pair from password (for registration/login)
export const generateKeyPairFromPassword = async (password: string): Promise<KeyPair> => {
  try {
    // Create a deterministic but secure key from password
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    
    // Use Web Crypto API to create a deterministic key seed
    const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Use the hash as private key seed for elliptic
    const privateKey = hashHex;
    const key = ec.keyFromPrivate(privateKey);
    
    return {
      privateKey: privateKey,
      publicKey: key.getPublic().encode('hex', true)
    };
    
  } catch (error) {
    console.error('Key generation failed:', error);
    
    // Fallback using SHA3
    const fallbackHash = sha3_512(password);
    const key = ec.keyFromPrivate(fallbackHash.substring(0, 64));
    
    return {
      privateKey: fallbackHash.substring(0, 64),
      publicKey: key.getPublic().encode('hex', true)
    };
  }
};

// ============================================
// Hashing Function
// ============================================

export const hashMessage = (text: string): string => {
  // SHA3-512
  return sha3_512(text);
};

// ============================================
// Signing Functions (ECDSA)
// ============================================

// Sign a hash using ECDSA (standard elliptic implementation)
export const signMessageECDSA = (hash: string, privateKey: string): { r: string; s: string } => {
  // Load the private key from hex string
  const key = ec.keyFromPrivate(privateKey);
  
  // Sign the hash
  const signature = key.sign(hash);
  
  // Return r and s values (standard ECDSA output)
  return { 
    r: signature.r.toString(16), 
    s: signature.s.toString(16) 
  };
};

// Sign a challenge message (for authentication)
export const signMessage = async (message: string, privateKey: string): Promise<string> => {
  try {
    // Hash the message first
    const messageHash = hashMessage(message);
    
    // Sign the hash using ECDSA
    const signature = signMessageECDSA(messageHash, privateKey);
    
    // Combine r and s into a single signature string
    return `${signature.r}:${signature.s}`;
    
  } catch (error) {
    console.error('Signing failed:', error);
    
    // Fallback: simple hash-based signature
    const fallbackSignature = await sha256(message + privateKey);
    return `0x${fallbackSignature}`;
  }
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

// ============================================
// Encryption Functions (ECIES: ECDH + AES)
// ============================================

export const encryptMessage = (text: string, publicKey: string): string => {
  // 1. Generate a temporary (ephemeral) key pair for this specific message
  const ephemeralKey = ec.genKeyPair();
  
  // 2. Derive the Shared Secret: (Ephemeral Private Key + Recipient Public Key)
  const recipientKey = ec.keyFromPublic(publicKey, 'hex');
  const sharedSecret = ephemeralKey.derive(recipientKey.getPublic()).toString(16);
  
  // 3. Encrypt the text using AES and the Shared Secret
  const encryptedText = CryptoJS.AES.encrypt(text, sharedSecret).toString();
  
  // 4. Return the Ephemeral Public Key + Separator + Encrypted Text
  // (The recipient needs the ephemeral public key to reconstruct the secret)
  return ephemeralKey.getPublic(true, 'hex') + "?iv=" + encryptedText;
};

export const decryptMessage = (encryptedPackage: string, privateKey: string): string => {
  // 1. Split the package to get the Ephemeral Public Key and the Ciphertext
  const [ephemeralPublicKeyHex, encryptedText] = encryptedPackage.split("?iv=");
  
  if (!ephemeralPublicKeyHex || !encryptedText) {
    throw new Error("Invalid encrypted message format");
  }

  // 2. Derive the Shared Secret: (My Private Key + Sender's Ephemeral Public Key)
  const myKey = ec.keyFromPrivate(privateKey);
  const senderKey = ec.keyFromPublic(ephemeralPublicKeyHex, 'hex');
  const sharedSecret = myKey.derive(senderKey.getPublic()).toString(16);
  
  // 3. Decrypt the text using AES and the Shared Secret
  const bytes = CryptoJS.AES.decrypt(encryptedText, sharedSecret);
  const originalText = bytes.toString(CryptoJS.enc.Utf8);
  
  return originalText;
};

// ============================================
// Helper Functions
// ============================================

// Helper: SHA-256 hash (Web Crypto API)
const sha256 = async (message: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// ============================================
// Password and Key Verification
// ============================================

export const verifyPasswordMatchesKeys = async (username: string, password: string): Promise<boolean> => {
  try {
    // Get stored private key for this user
    const storedPrivateKey = getStoredPrivateKey(username);
    if (!storedPrivateKey) {
      console.log('No stored private key for user:', username);
      return false;
    }
    
    // Generate keys from provided password
    const generatedKeys = await generateKeyPairFromPassword(password);
    
    // Compare the generated private key with stored private key
    const matches = generatedKeys.privateKey === storedPrivateKey;
    
    console.log('Password verification:', {
      username,
      storedKeyLength: storedPrivateKey.length,
      generatedKeyLength: generatedKeys.privateKey.length,
      matches
    });
    
    return matches;
    
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
};

// For registration: Store that this password was used
export const markPasswordAsRegistered = (username: string): void => {
  localStorage.setItem(`chatApp_hasRegistered_${username}`, 'true');
};

export const hasUserRegistered = (username: string): boolean => {
  return localStorage.getItem(`chatApp_hasRegistered_${username}`) === 'true';
};

// Generate a random challenge string for authentication
export const generateRandomChallenge = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Get current user from session
export const getCurrentUser = (): string | null => {
  return sessionStorage.getItem('currentUser');
};

// Get current user's key pair
export const getCurrentUserKeyPair = (): KeyPair | null => {
  const username = getCurrentUser();
  if (!username) return null;
  
  const privateKey = getStoredPrivateKey(username);
  const publicKey = getStoredPublicKey(username);
  
  if (!privateKey || !publicKey) return null;
  
  return { privateKey, publicKey };
};

// Validate if a public key is in correct format
export const isValidPublicKey = (publicKey: string): boolean => {
  try {
    ec.keyFromPublic(publicKey, 'hex');
    return true;
  } catch {
    return false;
  }
};

// Validate if a private key is in correct format
export const isValidPrivateKey = (privateKey: string): boolean => {
  try {
    ec.keyFromPrivate(privateKey);
    return true;
  } catch {
    return false;
  }
};