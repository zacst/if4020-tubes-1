import { sha3_256 } from 'js-sha3';
import { ec as EC } from 'elliptic';
import CryptoJS from 'crypto-js';

// Initialize Elliptic Curve (secp256k1 as most commonly used)
const ec = new EC('secp256k1');

export const generateKeys = (password: string) => {
  // Simple KDF (In real world use PBKDF2/Scrypt)
  // Here we just hash the password to get a seed
  const seed = sha3_256(password); 
  const key = ec.keyFromPrivate(seed);
  return {
    privateKey: key.getPrivate('hex'),
    publicKey: key.getPublic('hex')
  };
};

// --- Hashing Function ---

export const hashMessage = (text: string): string => {
  // SHA3-256
  return sha3_256(text);
};

// --- Signing Functions (ECDSA) ---

export const signMessage = (hash: string, privateKey: string): object => {
  // Load the private key from hex string
  const key = ec.keyFromPrivate(privateKey);
  
  // Sign the hash with canonical option to ensure Low-S (required by go-ethereum)
  const signature = key.sign(hash, { canonical: true });
  
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
  
  // 3. Return just the encrypted text
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