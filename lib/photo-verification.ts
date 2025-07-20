"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export interface PhotoVerificationResult {
  totalProducts: number
  productsWithPhotos: number
  productsWithoutPhotos: number
  invalidPhotoUrls: number
  recentProducts: Array<{
    id: string
    name: string
    photo_url: string | null
    inserted_at: string
  }>
  photoUrlPatterns: Record<string, number>
}

export async function verifyPhotoAssociations(): Promise<PhotoVerificationResult> {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    // Get all products for the user
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, photo_url, inserted_at")
      .eq("user_id", user.id)
      .order("inserted_at", { ascending: false })

    if (error) throw error

    const totalProducts = products?.length || 0
    const productsWithPhotos = products?.filter((p) => p.photo_url && p.photo_url.trim() !== "").length || 0
    const productsWithoutPhotos = totalProducts - productsWithPhotos

    // Check for invalid photo URLs
    const invalidPhotoUrls =
      products?.filter(
        (p) =>
          p.photo_url &&
          p.photo_url.trim() !== "" &&
          (!p.photo_url.startsWith("http") || !p.photo_url.includes("supabase")),
      ).length || 0

    // Analyze photo URL patterns
    const photoUrlPatterns: Record<string, number> = {}
    products?.forEach((p) => {
      if (p.photo_url) {
        try {
          const url = new URL(p.photo_url)
          const domain = url.hostname
          photoUrlPatterns[domain] = (photoUrlPatterns[domain] || 0) + 1
        } catch {
          photoUrlPatterns["invalid-url"] = (photoUrlPatterns["invalid-url"] || 0) + 1
        }
      }
    })

    return {
      totalProducts,
      productsWithPhotos,
      productsWithoutPhotos,
      invalidPhotoUrls,
      recentProducts: products?.slice(0, 10) || [],
      photoUrlPatterns,
    }
  } catch (error) {
    console.error("Error verifying photo associations:", error)
    throw error
  }
}

export async function fixMissingPhotoUrls(): Promise<{ fixed: number; errors: string[] }> {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    // This is a placeholder for a more sophisticated fix
    // In a real scenario, you might try to match orphaned files to products

    return {
      fixed: 0,
      errors: ["Automatic fixing not implemented yet"],
    }
  } catch (error) {
    console.error("Error fixing photo URLs:", error)
    return {
      fixed: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    }
  }
}
