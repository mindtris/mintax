import { File, User } from "@/lib/prisma/client"
import path from "path"
import config from "@/lib/core/config"
import { getStorage } from "@/lib/storage"

// ── Module folder names ───────────────────────────────────────────────────
//
// All files are stored under {orgId}/{module}/... for true tenant isolation.
// Modules with high volume (transactions, invoices, bills, candidates, leads, social)
// are bucketed by {YYYY}/{MM} so individual folders never grow unbounded.

export const MODULE_TRANSACTIONS = "transactions"
export const MODULE_INVOICES = "invoices"
export const MODULE_BILLS = "bills"
export const MODULE_CANDIDATES = "candidates"
export const MODULE_LEADS = "leads"
export const MODULE_SOCIAL = "social"
export const MODULE_UNSORTED = "unsorted"
export const MODULE_PREVIEWS = "previews"
export const MODULE_STATIC = "static"
export const MODULE_CSV = "csv"

// ── Org-scoped roots ──────────────────────────────────────────────────────

/** Returns the org's storage root: {orgId} */
export function getOrgRoot(orgId: string) {
  return orgId
}

/** Returns the org's previews directory: {orgId}/previews */
export function getOrgPreviewsDirectory(orgId: string) {
  return safePathJoin(orgId, MODULE_PREVIEWS)
}

/** Returns the org's static directory: {orgId}/static */
export function getOrgStaticDirectory(orgId: string) {
  return safePathJoin(orgId, MODULE_STATIC)
}

// ── Per-module file path builders ─────────────────────────────────────────
//
// All builders return the FULL org-scoped path. This is what gets stored in
// File.path and what gets passed to the storage provider — no joining at
// access time, no separate user/org lookups, just store and read.

/** Transactions: {orgId}/transactions/{YYYY}/{MM}/{uuid}{ext} */
export function getTransactionFilePath(orgId: string, fileUuid: string, filename: string, date?: Date) {
  return buildModulePath(orgId, MODULE_TRANSACTIONS, fileUuid, filename, date)
}

/** Invoices: {orgId}/invoices/{YYYY}/{MM}/{uuid}{ext} */
export function getInvoiceFilePath(orgId: string, fileUuid: string, filename: string, date?: Date) {
  return buildModulePath(orgId, MODULE_INVOICES, fileUuid, filename, date)
}

/** Bills: {orgId}/bills/{YYYY}/{MM}/{uuid}{ext} */
export function getBillFilePath(orgId: string, fileUuid: string, filename: string, date?: Date) {
  return buildModulePath(orgId, MODULE_BILLS, fileUuid, filename, date)
}

/** Candidates (hire): {orgId}/candidates/{YYYY}/{MM}/{uuid}{ext} */
export function getCandidateFilePath(orgId: string, fileUuid: string, filename: string, date?: Date) {
  return buildModulePath(orgId, MODULE_CANDIDATES, fileUuid, filename, date)
}

/** Leads (sales): {orgId}/leads/{YYYY}/{MM}/{uuid}{ext} */
export function getLeadFilePath(orgId: string, fileUuid: string, filename: string, date?: Date) {
  return buildModulePath(orgId, MODULE_LEADS, fileUuid, filename, date)
}

/** Social posts (engage): {orgId}/social/{YYYY}/{MM}/{uuid}{ext} */
export function getSocialFilePath(orgId: string, fileUuid: string, filename: string, date?: Date) {
  return buildModulePath(orgId, MODULE_SOCIAL, fileUuid, filename, date)
}

/** Unsorted uploads: {orgId}/unsorted/{uuid}{ext} (flat — short-lived) */
export function getUnsortedFilePath(orgId: string, fileUuid: string, filename: string) {
  const ext = path.extname(filename)
  return safePathJoin(orgId, MODULE_UNSORTED, `${fileUuid}${ext}`)
}

/** CSV imports: {orgId}/csv/{uuid}{ext} (flat — short-lived staging) */
export function getCsvImportFilePath(orgId: string, fileUuid: string, filename: string) {
  const ext = path.extname(filename)
  return safePathJoin(orgId, MODULE_CSV, `${fileUuid}${ext}`)
}

/** Preview pages: {orgId}/previews/{uuid}.{page}.webp */
export function getPreviewFilePath(orgId: string, fileUuid: string, page: number) {
  return safePathJoin(orgId, MODULE_PREVIEWS, `${fileUuid}.${page}.webp`)
}

// ── Resolution ────────────────────────────────────────────────────────────

/**
 * Returns the full storage path for a file. Since File.path now stores the
 * full org-scoped path, this is a no-op getter — kept for call-site clarity.
 */
export function fullPathForFile(file: File) {
  return file.path
}

// ── Helpers ───────────────────────────────────────────────────────────────

function buildModulePath(orgId: string, module: string, fileUuid: string, filename: string, date?: Date) {
  const ext = path.extname(filename)
  const d = date || new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  return safePathJoin(orgId, module, String(year), month, `${fileUuid}${ext}`)
}

export function safePathJoin(basePath: string, ...paths: string[]) {
  const joinedPath = path.join(basePath, path.normalize(path.join(...paths)))
  if (!joinedPath.startsWith(basePath)) {
    throw new Error("Path traversal detected")
  }
  return joinedPath
}

export async function fileExists(storagePath: string) {
  return getStorage().exists(storagePath)
}

export async function getDirectorySize(storagePath: string) {
  return getStorage().getDirectorySize(storagePath)
}

/** Storage limit check — keyed by user (TODO: move to org). */
export function isEnoughStorageToUploadFile(user: User, fileSize: number) {
  if (config.selfHosted.isEnabled || user.storageLimit < 0) return true
  return user.storageUsed + fileSize <= user.storageLimit
}
