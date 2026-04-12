import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { uploadAndCreateFile, deleteFile, getFileById } from "@/lib/services/files"
import { getSocialFilePath } from "@/lib/files"
import { randomUUID } from "crypto"

export async function uploadMedia(file: File) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  const relativePath = getSocialFilePath(randomUUID(), file.name)
  const fileRecord = await uploadAndCreateFile(org.id, user.id, user.email, file, relativePath)

  return {
    id: fileRecord.id,
    url: `/files/download/${fileRecord.id}`,
    filename: fileRecord.filename,
    mimetype: fileRecord.mimetype,
    size: fileRecord.size,
  }
}

export async function deleteMedia(fileId: string) {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)

  return await deleteFile(fileId, org.id)
}
