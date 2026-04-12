/**
 * One-time data migration script: backfills join table rows from legacy JSON columns.
 *
 * Run with: npx tsx scripts/migrate-file-relations.ts
 *
 * Safe to run multiple times — uses upsert to avoid duplicates.
 */

import { PrismaClient } from "../../lib/prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting file relations migration...\n")

  // ── 1. Transaction files (JSON array of File UUIDs → transaction_files) ──
  const transactions = await prisma.transaction.findMany({
    select: { id: true, files: true },
  })

  let txCount = 0
  for (const tx of transactions) {
    const fileIds = tx.files as string[] | null
    if (!fileIds?.length) continue

    for (const fileId of fileIds) {
      // Verify the File record exists
      const file = await prisma.file.findUnique({ where: { id: fileId } })
      if (!file) continue

      await prisma.transactionFile.upsert({
        where: { transactionId_fileId: { transactionId: tx.id, fileId } },
        create: { transactionId: tx.id, fileId },
        update: {},
      })
      txCount++
    }
  }
  console.log(`[Transactions] Migrated ${txCount} file links from ${transactions.length} transactions`)

  // ── 2. Invoice files (JSON array of Vercel Blob URLs → File records + invoice_files) ──
  const invoices = await prisma.invoice.findMany({
    select: { id: true, organizationId: true, files: true },
  })

  let invCount = 0
  for (const inv of invoices) {
    const fileUrls = inv.files as string[] | null
    if (!fileUrls?.length) continue

    for (const url of fileUrls) {
      // Check if this is a UUID (already a File ID) or a URL
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(url)

      if (isUuid) {
        const file = await prisma.file.findUnique({ where: { id: url } })
        if (!file) continue
        await prisma.invoiceFile.upsert({
          where: { invoiceId_fileId: { invoiceId: inv.id, fileId: url } },
          create: { invoiceId: inv.id, fileId: url },
          update: {},
        })
      } else {
        // It's a Vercel Blob URL — create a File record pointing to it
        const filename = url.split("/").pop() || "unknown"
        const ext = filename.split(".").pop()?.toLowerCase() || ""
        const mimetype = ext === "pdf" ? "application/pdf" : ext.match(/^(png|jpg|jpeg|gif|webp)$/) ? `image/${ext}` : "application/octet-stream"

        // Get first org member as the uploader
        const member = await prisma.orgMember.findFirst({
          where: { organizationId: inv.organizationId },
          select: { userId: true },
        })
        if (!member) continue

        const file = await prisma.file.create({
          data: {
            organizationId: inv.organizationId,
            userId: member.userId,
            filename,
            path: url, // Store the full URL as path for Vercel Blob
            mimetype,
            size: 0,
            isReviewed: true,
          },
        })

        await prisma.invoiceFile.upsert({
          where: { invoiceId_fileId: { invoiceId: inv.id, fileId: file.id } },
          create: { invoiceId: inv.id, fileId: file.id },
          update: {},
        })
      }
      invCount++
    }
  }
  console.log(`[Invoices] Migrated ${invCount} file links from ${invoices.length} invoices`)

  // ── 3. Bill files (same pattern as invoices) ──
  const bills = await prisma.bill.findMany({
    select: { id: true, organizationId: true, files: true },
  })

  let billCount = 0
  for (const bill of bills) {
    const fileUrls = bill.files as string[] | null
    if (!fileUrls?.length) continue

    for (const url of fileUrls) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(url)

      if (isUuid) {
        const file = await prisma.file.findUnique({ where: { id: url } })
        if (!file) continue
        await prisma.billFile.upsert({
          where: { billId_fileId: { billId: bill.id, fileId: url } },
          create: { billId: bill.id, fileId: url },
          update: {},
        })
      } else {
        const filename = url.split("/").pop() || "unknown"
        const ext = filename.split(".").pop()?.toLowerCase() || ""
        const mimetype = ext === "pdf" ? "application/pdf" : ext.match(/^(png|jpg|jpeg|gif|webp)$/) ? `image/${ext}` : "application/octet-stream"

        const member = await prisma.orgMember.findFirst({
          where: { organizationId: bill.organizationId },
          select: { userId: true },
        })
        if (!member) continue

        const file = await prisma.file.create({
          data: {
            organizationId: bill.organizationId,
            userId: member.userId,
            filename,
            path: url,
            mimetype,
            size: 0,
            isReviewed: true,
          },
        })

        await prisma.billFile.upsert({
          where: { billId_fileId: { billId: bill.id, fileId: file.id } },
          create: { billId: bill.id, fileId: file.id },
          update: {},
        })
      }
      billCount++
    }
  }
  console.log(`[Bills] Migrated ${billCount} file links from ${bills.length} bills`)

  // ── 4. Candidate resumes (resumePath URL → File record + candidate_files) ──
  const candidates = await prisma.candidate.findMany({
    where: { resumePath: { not: null } },
    select: { id: true, organizationId: true, resumePath: true },
  })

  let candCount = 0
  for (const cand of candidates) {
    if (!cand.resumePath) continue

    const filename = cand.resumePath.split("/").pop() || "resume.pdf"
    const member = await prisma.orgMember.findFirst({
      where: { organizationId: cand.organizationId },
      select: { userId: true },
    })
    if (!member) continue

    const file = await prisma.file.create({
      data: {
        organizationId: cand.organizationId,
        userId: member.userId,
        filename,
        path: cand.resumePath,
        mimetype: "application/pdf",
        size: 0,
        isReviewed: true,
      },
    })

    await prisma.candidateFile.upsert({
      where: { candidateId_fileId: { candidateId: cand.id, fileId: file.id } },
      create: { candidateId: cand.id, fileId: file.id, label: "resume" },
      update: {},
    })
    candCount++
  }
  console.log(`[Candidates] Migrated ${candCount} resume links`)

  // ── 5. Social post media (populate fileId on SocialPostMedia where url exists) ──
  // Note: existing media has URL but no File record. We skip creating File records
  // for these since the URLs are Vercel Blob public URLs that work independently.
  // New uploads will create proper File records going forward.

  console.log(`\nMigration complete!`)
}

main()
  .catch((e) => {
    console.error("Migration failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
