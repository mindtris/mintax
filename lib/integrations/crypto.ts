import crypto from "crypto"
import config from "@/lib/core/config"

const ALGO = "aes-256-gcm"

function getKey(): Buffer {
  const raw = config.plaid.encryptionKey
  if (!raw) {
    throw new Error("PLAID_ENCRYPTION_KEY is not set (required to encrypt Plaid access tokens)")
  }
  const key = Buffer.from(raw, "base64")
  if (key.length !== 32) {
    throw new Error("PLAID_ENCRYPTION_KEY must decode to 32 bytes (base64 of a 256-bit key)")
  }
  return key
}

export function encryptSecret(plaintext: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`
}

export function decryptSecret(payload: string): string {
  const key = getKey()
  const [ivB64, tagB64, encB64] = payload.split(".")
  if (!ivB64 || !tagB64 || !encB64) throw new Error("Malformed encrypted payload")
  const iv = Buffer.from(ivB64, "base64")
  const tag = Buffer.from(tagB64, "base64")
  const enc = Buffer.from(encB64, "base64")
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8")
}
