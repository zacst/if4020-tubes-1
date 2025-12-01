import { sha3_512 } from 'js-sha3';
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
  // SHA3-512
  return sha3_512(text);
};

// --- Signing Functions (ECDSA) ---

export const signMessage = (message: string, privateKey: string): string => {
  const messageHash = hashMessage(message);
  
  // Load the private key from hex string
  const key = ec.keyFromPrivate(privateKey);
  
  // Sign the hash
  const signature = key.sign(messageHash);
  
  // Return r and s values (standard ECDSA output)
  return `${signature.r.toString(16)}:${signature.s.toString(16)}`;
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

// --- Encryption Functions (ECIES: ECDH + AES) ---

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