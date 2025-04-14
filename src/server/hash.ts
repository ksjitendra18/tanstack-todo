export async function hashPassword({
  password,
  salt,
  iterationCount = 100000,
  keyLength = 64,
}: {
  password: string;
  salt: string;
  iterationCount?: number;
  keyLength?: number;
}) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const importedKey = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedKeyBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: iterationCount,
      hash: { name: "SHA-512" },
    },
    importedKey,
    keyLength * 8
  );

  const derivedKeyArray = new Uint8Array(derivedKeyBuffer);
  return Array.prototype.map
    .call(derivedKeyArray, (x) => ("00" + x.toString(16)).slice(-2))
    .join("");
}

export async function verifyPassword({
  password,
  hashedPassword,
  salt,
}: {
  password: string;
  hashedPassword: string;
  salt: string;
}) {
  return (await hashPassword({ password, salt })) === hashedPassword;
}

export function generateSalt() {
  const salt = crypto.getRandomValues(new Uint8Array(32));

  const hexSalt = Array.prototype.map
    .call(salt, (x) => ("00" + x.toString(16)).slice(-2))
    .join("");

  return hexSalt;
}
