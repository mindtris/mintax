"use server"

import { ActionState } from "@/lib/actions"
import { getActiveOrg, getCurrentUser, isSubscriptionExpired } from "@/lib/core/auth"
import {
  getDirectorySize,
  getOrgRoot,
  getUnsortedFilePath,
  isEnoughStorageToUploadFile,
} from "@/lib/files"
import { createFile } from "@/lib/services/files"
import { updateUser } from "@/lib/services/users"
import { getStorage } from "@/lib/storage"
import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"

export async function uploadFilesAction(formData: FormData): Promise<ActionState<null>> {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const files = formData.getAll("files") as File[]
  const storage = getStorage()

  // Check limits
  const totalFileSize = files.reduce((acc, file) => acc + file.size, 0)
  if (!isEnoughStorageToUploadFile(user, totalFileSize)) {
    return { success: false, error: `Insufficient storage to upload these files` }
  }

  if (isSubscriptionExpired(user)) {
    return {
      success: false,
      error: "Your subscription has expired, please upgrade your account or buy new subscription plan",
    }
  }

  // Process each file
  const uploadedFiles = await Promise.all(
    files.map(async (file) => {
      if (!(file instanceof File)) {
        return { success: false, error: "Invalid file" }
      }

      // Save file to storage
      const fileUuid = randomUUID()
      const storagePath = getUnsortedFilePath(org.id, fileUuid, file.name)
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      await storage.put(storagePath, buffer)

      // Create file record in database
      const fileRecord = await createFile(org.id, user.id, {
        id: fileUuid,
        filename: file.name,
        path: storagePath,
        mimetype: file.type,
        metadata: {
          size: file.size,
          lastModified: file.lastModified,
        },
      })

      return fileRecord
    })
  )

  const storageUsed = await getDirectorySize(getOrgRoot(org.id))
  await updateUser(user.id, { storageUsed })

  console.log("uploadedFiles", uploadedFiles)

  revalidatePath("/unsorted")

  return { success: true, error: null }
}
