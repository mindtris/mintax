import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12
const TAG_LENGTH = 16
const ENCRYPTED_PREFIX = "enc:"

function getEncryptionKey(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET || ""
  // Derive a 32-byte key from the auth secret using SHA-256
  return crypto.createHash("sha256").update(secret).digest()
}

export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext

  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, "utf8", "hex")
  encrypted += cipher.final("hex")
  const tag = cipher.getAuthTag()

  // Format: enc:<iv>:<tag>:<ciphertext>
  return `${ENCRYPTED_PREFIX}${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`
}

export function decrypt(value: string): string {
  if (!value || !value.startsWith(ENCRYPTED_PREFIX)) return value

  try {
    const parts = value.slice(ENCRYPTED_PREFIX.length).split(":")
    if (parts.length !== 3) return value

    const [ivHex, tagHex, ciphertext] = parts
    const key = getEncryptionKey()
    const iv = Buffer.from(ivHex, "hex")
    const tag = Buffer.from(tagHex, "hex")

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(ciphertext, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return decrypted
  } catch {
    // If decryption fails (wrong key, corrupted data), return empty
    console.error("[ENCRYPTION] Failed to decrypt value")
    return ""
  }
}

export function isEncrypted(value: string): boolean {
  return value?.startsWith(ENCRYPTED_PREFIX) || false
}

// Settings codes that should be encrypted
export const SENSITIVE_SETTINGS = [
  "openai_api_key",
  "google_api_key",
  "mistral_api_key",
  "openai_compatible_api_key",
]
