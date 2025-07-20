"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export interface FilterParams {
  search?: string
  category?: string
  brand?: string
  rating?: number
  usageStatus?: string
  sortBy?: "date_added" | "rating" | "name" | "price"
  sortOrder?: "asc" | "desc"
  limit?: number
  offset?: number
}

export async function getFilteredProducts(filters: FilterParams = {}) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    let query = supabase.from("products").select("*", { count: "exact" }).eq("user_id", user.id)

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.trim()
      query = query.or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`)
    }

    // Apply category filter
    if (filters.category && filters.category !== "all") {
      query = query.eq("category", filters.category)
    }

    // Apply brand filter
    if (filters.brand && filters.brand !== "all") {
      query = query.eq("brand", filters.brand)
    }

    // Apply rating filter
    if (filters.rating && filters.rating > 0) {
      query = query.gte("rating", filters.rating)
    }

    // Apply usage status filter
    if (filters.usageStatus && filters.usageStatus !== "all") {
      query = query.eq("usage_status", filters.usageStatus)
    }

    // Apply sorting
    const sortBy = filters.sortBy || "date_added"
    const sortOrder = filters.sortOrder || "desc"

    switch (sortBy) {
      case "date_added":
        query = query.order("inserted_at", { ascending: sortOrder === "asc" })
        break
      case "rating":
        query = query.order("rating", { ascending: sortOrder === "asc", nullsFirst: false })
        break
      case "name":
        query = query.order("name", { ascending: sortOrder === "asc" })
        break
      case "price":
        query = query.order("price", { ascending: sortOrder === "asc", nullsFirst: false })
        break
      default:
        query = query.order("inserted_at", { ascending: false })
    }

    // Apply pagination
    if (filters.limit) {
      query = query.range(filters.offset || 0, (filters.offset || 0) + filters.limit - 1)
    }

    const { data: products, error, count } = await query

    if (error) throw error

    return {
      products: products || [],
      count: count || 0,
      success: true,
    }
  } catch (error: any) {
    console.error("Error fetching filtered products:", error)
    return {
      products: [],
      count: 0,
      error: error.message || "Failed to fetch products",
    }
  }
}

export async function getFilterOptions() {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    // Get unique categories
    const { data: categories } = await supabase
      .from("products")
      .select("category")
      .eq("user_id", user.id)
      .not("category", "is", null)

    // Get unique brands
    const { data: brands } = await supabase
      .from("products")
      .select("brand")
      .eq("user_id", user.id)
      .not("brand", "is", null)

    // Get unique usage statuses
    const { data: statuses } = await supabase
      .from("products")
      .select("usage_status")
      .eq("user_id", user.id)
      .not("usage_status", "is", null)

    return {
      categories: [...new Set(categories?.map((p) => p.category).filter(Boolean))] || [],
      brands: [...new Set(brands?.map((p) => p.brand).filter(Boolean))] || [],
      usageStatuses: [...new Set(statuses?.map((p) => p.usage_status).filter(Boolean))] || [],
      success: true,
    }
  } catch (error: any) {
    console.error("Error fetching filter options:", error)
    return {
      categories: [],
      brands: [],
      usageStatuses: [],
      error: error.message || "Failed to fetch filter options",
    }
  }
}
