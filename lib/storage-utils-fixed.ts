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
  bucketName?: string
  actualBucketName?: string
}

// File validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]

// Possible bucket name variations to check
const BUCKET_VARIATIONS = ["product-photos", "product_photos", "productphotos", "product-images", "product_images"]

let DETECTED_BUCKET_NAME: string | null = null

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

// Function to detect the correct bucket name
async function detectBucketName(): Promise<string | null> {
  if (DETECTED_BUCKET_NAME) {
    return DETECTED_BUCKET_NAME
  }

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error || !buckets) {
      console.error("Cannot list buckets:", error)
      return null
    }

    const existingBuckets = buckets.map((b) => b.name)
    console.log("Available buckets:", existingBuckets)

    // Check for exact match first
    for (const variation of BUCKET_VARIATIONS) {
      if (existingBuckets.includes(variation)) {
        DETECTED_BUCKET_NAME = variation
        console.log("Detected bucket name:", DETECTED_BUCKET_NAME)
        return DETECTED_BUCKET_NAME
      }
    }

    // If no variation found, check if there's any bucket with "product" or "photo" in the name
    const productBucket = existingBuckets.find(
      (name) =>
        name.toLowerCase().includes("product") ||
        name.toLowerCase().includes("photo") ||
        name.toLowerCase().includes("image"),
    )

    if (productBucket) {
      DETECTED_BUCKET_NAME = productBucket
      console.log("Found similar bucket:", DETECTED_BUCKET_NAME)
      return DETECTED_BUCKET_NAME
    }

    return null
  } catch (error) {
    console.error("Error detecting bucket name:", error)
    return null
  }
}

export async function checkStorageStatus(): Promise<StorageStatus> {
  try {
    // First check if we can access storage at all
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error("Error accessing storage:", bucketsError)
      return {
        available: false,
        error: "Unable to access storage service. Check your Supabase configuration.",
      }
    }

    // Try to detect the correct bucket name
    const bucketName = await detectBucketName()

    if (!bucketName) {
      const availableBuckets = buckets?.map((b) => b.name).join(", ") || "none"
      return {
        available: false,
        error: `No suitable storage bucket found. Available buckets: ${availableBuckets}. Please create a bucket named 'product-photos'.`,
      }
    }

    // Test if we can actually use the bucket
    try {
      const { data: testList, error: listError } = await supabase.storage.from(bucketName).list("", { limit: 1 })

      if (listError && listError.message.includes("permission")) {
        return {
          available: false,
          error: `Storage bucket '${bucketName}' found but permissions not configured correctly.`,
          bucketName,
          actualBucketName: bucketName,
        }
      }

      return {
        available: true,
        bucketName,
        actualBucketName: bucketName,
      }
    } catch (policyError) {
      return {
        available: false,
        error: `Storage bucket '${bucketName}' found but policies not configured correctly.`,
        bucketName,
        actualBucketName: bucketName,
      }
    }
  } catch (error) {
    console.error("Storage status check failed:", error)
    return {
      available: false,
      error: "Storage status check failed. Please check your internet connection and Supabase configuration.",
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

    // Detect the correct bucket name
    const bucketName = await detectBucketName()
    if (!bucketName) {
      return { success: false, error: "Storage bucket not found. Please check your Supabase storage configuration." }
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop()?.toLowerCase()
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileName = `${userId}/${timestamp}-${randomId}.${fileExt}`

    console.log(`Uploading to bucket: ${bucketName}, file: ${fileName}`)

    // Upload file
    const { data, error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, file, {
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
      if (uploadError.message.includes("bucket")) {
        return {
          success: false,
          error: `Storage bucket '${bucketName}' not accessible. Please check your Supabase storage configuration.`,
        }
      }

      return { success: false, error: `Upload failed: ${uploadError.message}` }
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName)

    if (!urlData.publicUrl) {
      return { success: false, error: "Failed to generate public URL" }
    }

    console.log("Upload successful:", urlData.publicUrl)

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

    const bucketName = await detectBucketName()
    if (!bucketName) {
      console.warn("Cannot delete photo: bucket not found")
      return { success: true } // Don't fail the operation
    }

    // Extract filename from URL
    const urlParts = photoUrl.split("/")
    const fileName = urlParts[urlParts.length - 1]

    // Ensure the file belongs to the user
    const filePath = `${userId}/${fileName}`

    const { error } = await supabase.storage.from(bucketName).remove([filePath])

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

// Force refresh the detected bucket name (useful after bucket creation)
export function refreshBucketDetection() {
  DETECTED_BUCKET_NAME = null
}
