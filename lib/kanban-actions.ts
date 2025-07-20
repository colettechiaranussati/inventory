"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export type UsageStatus = "new" | "in progress" | "finished" | "want to repurchase"

export interface KanbanProduct {
  id: string
  name: string
  brand: string | null
  category: string | null
  rating: number | null
  price: number | null
  photo_url: string | null
  usage_status: UsageStatus
  created_at: string
}

export async function getKanbanProducts() {
  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    // Fetch all products for the kanban board
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, brand, category, rating, price, photo_url, usage_status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return { products: products as KanbanProduct[], error: null }
  } catch (error: any) {
    console.error("Error fetching kanban products:", error)
    return { products: [], error: error.message }
  }
}

export async function updateProductStatus(productId: string, newStatus: UsageStatus) {
  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    // Update product status
    const { error } = await supabase
      .from("products")
      .update({ usage_status: newStatus })
      .eq("id", productId)
      .eq("user_id", user.id) // Ensure user can only update their own products

    if (error) {
      throw error
    }

    // Revalidate the kanban page to show updated data
    revalidatePath("/products/kanban")

    return { success: true, error: null }
  } catch (error: any) {
    console.error("Error updating product status:", error)
    return { success: false, error: error.message }
  }
}
