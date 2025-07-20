import { supabase } from "@/lib/supabase/client"

export interface StorageDebugInfo {
  authStatus: {
    isAuthenticated: boolean
    userId?: string
    error?: string
  }
  bucketStatus: {
    canListBuckets: boolean
    availableBuckets: string[]
    targetBucketExists: boolean
    error?: string
  }
  permissionStatus: {
    canRead: boolean
    canWrite: boolean
    canDelete: boolean
    errors: string[]
  }
  configStatus: {
    supabaseUrl: string
    hasAnonKey: boolean
    clientInitialized: boolean
  }
}

const BUCKET_NAME = "product-photos"

export async function debugStorageConfiguration(): Promise<StorageDebugInfo> {
  const debugInfo: StorageDebugInfo = {
    authStatus: {
      isAuthenticated: false,
    },
    bucketStatus: {
      canListBuckets: false,
      availableBuckets: [],
      targetBucketExists: false,
    },
    permissionStatus: {
      canRead: false,
      canWrite: false,
      canDelete: false,
      errors: [],
    },
    configStatus: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "Not configured",
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      clientInitialized: !!supabase,
    },
  }

  try {
    // Check authentication
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError) {
      debugInfo.authStatus.error = authError.message
    } else if (authData.user) {
      debugInfo.authStatus.isAuthenticated = true
      debugInfo.authStatus.userId = authData.user.id
    }

    // Check bucket listing capability
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

      if (bucketsError) {
        debugInfo.bucketStatus.error = bucketsError.message
      } else if (buckets) {
        debugInfo.bucketStatus.canListBuckets = true
        debugInfo.bucketStatus.availableBuckets = buckets.map((b) => b.name)
        debugInfo.bucketStatus.targetBucketExists = buckets.some((b) => b.name === BUCKET_NAME)
      }
    } catch (error: any) {
      debugInfo.bucketStatus.error = error.message
    }

    // Test permissions if bucket exists
    if (debugInfo.bucketStatus.targetBucketExists && debugInfo.authStatus.isAuthenticated) {
      // Test read permission
      try {
        const { data, error } = await supabase.storage.from(BUCKET_NAME).list("", { limit: 1 })
        if (!error) {
          debugInfo.permissionStatus.canRead = true
        } else {
          debugInfo.permissionStatus.errors.push(`Read error: ${error.message}`)
        }
      } catch (error: any) {
        debugInfo.permissionStatus.errors.push(`Read exception: ${error.message}`)
      }

      // Test write permission with a small test file
      try {
        const testFileName = `${debugInfo.authStatus.userId}/test-${Date.now()}.txt`
        const testFile = new Blob(["test"], { type: "text/plain" })

        const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(testFileName, testFile)

        if (!uploadError) {
          debugInfo.permissionStatus.canWrite = true

          // Test delete permission by removing the test file
          const { error: deleteError } = await supabase.storage.from(BUCKET_NAME).remove([testFileName])

          if (!deleteError) {
            debugInfo.permissionStatus.canDelete = true
          } else {
            debugInfo.permissionStatus.errors.push(`Delete error: ${deleteError.message}`)
          }
        } else {
          debugInfo.permissionStatus.errors.push(`Write error: ${uploadError.message}`)
        }
      } catch (error: any) {
        debugInfo.permissionStatus.errors.push(`Write exception: ${error.message}`)
      }
    }
  } catch (error: any) {
    console.error("Debug error:", error)
  }

  return debugInfo
}

// Helper function to check if bucket name variations exist
export async function findBucketVariations(): Promise<string[]> {
  const variations = [
    "product-photos",
    "product_photos",
    "productphotos",
    "product-images",
    "product_images",
    "products",
    "photos",
    "images",
  ]

  try {
    const { data: buckets } = await supabase.storage.listBuckets()
    if (!buckets) return []

    const existingBuckets = buckets.map((b) => b.name)
    return variations.filter((variation) => existingBuckets.includes(variation))
  } catch {
    return []
  }
}
