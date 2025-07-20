import { supabase } from "@/lib/supabase/client"

export interface UploadResult {
  success: boolean
  url?: string
  fileName?: string
  error?: string
}

export interface StorageStatus {
  available: boolean
  error?: string
  bucketExists?: boolean
  policiesExist?: boolean
}

// File validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
const BUCKET_NAME = "product-photos"

export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB. Current size: ${Math.round(file.size / 1024 / 1024)}MB`,
    }
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `File type not supported. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
    }
  }

  return { valid: true }
}

export async function checkStorageStatus(): Promise<StorageStatus> {
  try {
    // Check if we can access storage at all
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error("Error accessing storage:", bucketsError)
      return {
        available: false,
        error: "Unable to access storage service",
        bucketExists: false,
        policiesExist: false,
      }
    }

    // Check if our specific bucket exists
    const bucketExists = buckets?.some((bucket) => bucket.name === BUCKET_NAME) || false

    if (!bucketExists) {
      return {
        available: false,
        error: `Storage bucket '${BUCKET_NAME}' not found`,
        bucketExists: false,
        policiesExist: false,
      }
    }

    // Test if we can actually use the bucket (this tests policies)
    try {
      const { data: testList, error: listError } = await supabase.storage.from(BUCKET_NAME).list("", { limit: 1 })

      if (listError && listError.message.includes("permission")) {
        return {
          available: false,
          error: "Storage policies not configured correctly",
          bucketExists: true,
          policiesExist: false,
        }
      }

      return {
        available: true,
        bucketExists: true,
        policiesExist: true,
      }
    } catch (policyError) {
      return {
        available: false,
        error: "Storage policies not configured correctly",
        bucketExists: true,
        policiesExist: false,
      }
    }
  } catch (error) {
    console.error("Storage status check failed:", error)
    return {
      available: false,
      error: "Storage status check failed",
      bucketExists: false,
      policiesExist: false,
    }
  }
}

export async function uploadProductPhoto(file: File, userId: string): Promise<UploadResult> {
  try {
    // Validate file first
    const validation = validateFile(file)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Check storage status
    const storageStatus = await checkStorageStatus()
    if (!storageStatus.available) {
      return { success: false, error: storageStatus.error }
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop()?.toLowerCase()
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileName = `${userId}/${timestamp}-${randomId}.${fileExt}`

    // Upload file
    const { data, error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
      metadata: {
        user_id: userId,
        original_name: file.name,
        upload_timestamp: new Date().toISOString(),
      },
    })

    if (uploadError) {
      console.error("Upload error:", uploadError)

      // Handle specific error types
      if (uploadError.message.includes("duplicate")) {
        return { success: false, error: "File already exists. Please try again." }
      }
      if (uploadError.message.includes("size")) {
        return { success: false, error: "File size exceeds limit" }
      }
      if (uploadError.message.includes("type")) {
        return { success: false, error: "File type not allowed" }
      }

      return { success: false, error: `Upload failed: ${uploadError.message}` }
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName)

    if (!urlData.publicUrl) {
      return { success: false, error: "Failed to generate public URL" }
    }

    return {
      success: true,
      url: urlData.publicUrl,
      fileName: fileName,
    }
  } catch (error: any) {
    console.error("Error uploading photo:", error)
    return { success: false, error: error.message || "Upload failed" }
  }
}

export async function deleteProductPhoto(
  photoUrl: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!photoUrl) return { success: true }

    // Extract filename from URL
    const urlParts = photoUrl.split("/")
    const fileName = urlParts[urlParts.length - 1]

    // Ensure the file belongs to the user
    const filePath = `${userId}/${fileName}`

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath])

    if (error) {
      console.warn("Failed to delete photo from storage:", error)
      // Don't throw error - photo deletion is not critical for product operations
      return { success: true } // Return success to not block other operations
    }

    return { success: true }
  } catch (error: any) {
    console.warn("Photo deletion failed:", error)
    return { success: true } // Don't fail the operation
  }
}

export async function getPhotoMetadata(fileName: string) {
  try {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list("", {
      search: fileName,
    })

    if (error || !data || data.length === 0) {
      return null
    }

    return data[0]
  } catch (error) {
    console.error("Error getting photo metadata:", error)
    return null
  }
}

// Helper function to create storage bucket programmatically (if possible)
export async function createStorageBucket(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_TYPES,
    })

    if (error) {
      if (error.message.includes("already exists")) {
        return { success: true } // Bucket already exists, that's fine
      }
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
