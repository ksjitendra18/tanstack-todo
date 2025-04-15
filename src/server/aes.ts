const algorithm = "AES-GCM";
const ivLength = 12;

async function getKey(): Promise<CryptoKey> {
  const SECRET_KEY = process.env.SECRET_KEY;

  if (!SECRET_KEY) {
    throw new Error("Secret key not found");
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(SECRET_KEY);
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function aesEncrypt(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(ivLength));
  const encoder = new TextEncoder();
  const encodedPlaintext = encoder.encode(plaintext);

  const encrypted = await crypto.subtle.encrypt(
    { name: algorithm, iv: iv },
    key,
    encodedPlaintext
  );

  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode.apply(null, result as unknown as number[]));
}

export async function aesDecrypt(ciphertext: string): Promise<string> {
  const key = await getKey();
  const binaryString = atob(ciphertext);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const iv = bytes.slice(0, ivLength);
  const encrypted = bytes.slice(ivLength);

  const decrypted = await crypto.subtle.decrypt(
    { name: algorithm, iv: iv },
    key,
    encrypted
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

export async function urlFriendlyAesEncrypt(
  plaintext: string
): Promise<string> {
  const base64Result = await aesEncrypt(plaintext);

  return base64Result.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function urlFriendlyAesDecrypt(
  urlFriendlyCiphertext: string
): Promise<string> {
  let base64 = urlFriendlyCiphertext.replace(/-/g, "+").replace(/_/g, "/");

  while (base64.length % 4) {
    base64 += "=";
  }
  return await aesDecrypt(base64);
}
