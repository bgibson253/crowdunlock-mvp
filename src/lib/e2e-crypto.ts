/**
 * E2E Encryption for DMs using ECDH + AES-256-GCM
 *
 * Flow:
 * 1. Each user generates an ECDH key pair (P-256) on first DM usage
 * 2. Private key is stored in IndexedDB (never leaves the browser)
 * 3. Public key is stored in Supabase (user_public_keys table)
 * 4. To send: derive shared secret via ECDH, encrypt with AES-256-GCM
 * 5. To receive: derive same shared secret, decrypt with AES-256-GCM
 */

const DB_NAME = "unmaskr_e2e";
const DB_VERSION = 1;
const STORE_NAME = "keys";
const KEY_ID = "ecdh_private_key";

// ── IndexedDB helpers ──

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function storePrivateKey(key: CryptoKey): Promise<void> {
  const db = await openDB();
  const jwk = await crypto.subtle.exportKey("jwk", key);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(jwk, KEY_ID);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadPrivateKey(): Promise<CryptoKey | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(KEY_ID);
    req.onsuccess = async () => {
      if (!req.result) return resolve(null);
      try {
        const key = await crypto.subtle.importKey(
          "jwk",
          req.result,
          { name: "ECDH", namedCurve: "P-256" },
          false,
          ["deriveBits"]
        );
        resolve(key);
      } catch {
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// ── Key generation ──

export async function generateKeyPair(): Promise<{
  privateKey: CryptoKey;
  publicKeyBase64: string;
}> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true, // extractable (need to export public key)
    ["deriveBits"]
  );

  // Store private key in IndexedDB
  await storePrivateKey(keyPair.privateKey);

  // Export public key as base64
  const pubRaw = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(pubRaw)));

  return { privateKey: keyPair.privateKey, publicKeyBase64 };
}

export async function getOrCreateKeyPair(): Promise<{
  privateKey: CryptoKey;
  publicKeyBase64: string;
}> {
  const existing = await loadPrivateKey();
  if (existing) {
    // Re-derive public key from private (via JWK)
    const db = await openDB();
    const jwk: JsonWebKey = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(KEY_ID);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    // Import as key pair to get public key
    const fullKey = await crypto.subtle.importKey(
      "jwk",
      { ...jwk, key_ops: [] },
      { name: "ECDH", namedCurve: "P-256" },
      true,
      []
    );
    const pubRaw = await crypto.subtle.exportKey("raw", fullKey);
    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(pubRaw)));

    return { privateKey: existing, publicKeyBase64 };
  }

  return generateKeyPair();
}

// ── Shared secret derivation ──

async function deriveSharedKey(
  privateKey: CryptoKey,
  otherPublicKeyBase64: string
): Promise<CryptoKey> {
  // Decode base64 public key
  const pubBytes = Uint8Array.from(atob(otherPublicKeyBase64), (c) => c.charCodeAt(0));
  const otherPublicKey = await crypto.subtle.importKey(
    "raw",
    pubBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Derive 256 bits
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: otherPublicKey },
    privateKey,
    256
  );

  // Import as AES-GCM key
  return crypto.subtle.importKey("raw", sharedBits, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

// ── Encrypt / Decrypt ──

export async function encryptMessage(
  plaintext: string,
  privateKey: CryptoKey,
  recipientPublicKeyBase64: string
): Promise<{ encryptedBody: string; nonce: string }> {
  const sharedKey = await deriveSharedKey(privateKey, recipientPublicKeyBase64);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    encoded
  );

  return {
    encryptedBody: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    nonce: btoa(String.fromCharCode(...iv)),
  };
}

export async function decryptMessage(
  encryptedBody: string,
  nonce: string,
  privateKey: CryptoKey,
  otherPublicKeyBase64: string
): Promise<string> {
  const sharedKey = await deriveSharedKey(privateKey, otherPublicKeyBase64);

  const iv = Uint8Array.from(atob(nonce), (c) => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(encryptedBody), (c) => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// ── Utility ──

export function hasPrivateKey(): Promise<boolean> {
  return loadPrivateKey().then((k) => k !== null);
}
