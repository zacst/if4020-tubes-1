import { sha3_512 } from 'js-sha3';
import { ec as EC } from 'elliptic';
import CryptoJS from 'crypto-js';

// Initialize Elliptic Curve (secp256k1 as most commonly used)
const ec = new EC('secp256k1');

// --- Hashing Function ---

export const hashMessage = (text: string): string => {
  // SHA3-512
  return sha3_512(text);
};

// --- Signing Functions (ECDSA) ---

export const signMessage = (hash: string, privateKey: string): object => {
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