"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { deleteProductPhoto } from "@/lib/storage-utils"

export async function updateProduct(prevState: any, formData: FormData) {
  const productId = formData.get("productId")
  const name = formData.get("name")
  const brand = formData.get("brand")
  const price = formData.get("price")
  const category = formData.get("category")
  const purchaseDate = formData.get("purchaseDate")
  const usageStatus = formData.get("usageStatus")
  const rating = formData.get("rating")
  const photoUrl = formData.get("photoUrl")

  if (!productId || !name) {
    return { error: "Product ID and name are required" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    const updateData = {
      name: name.toString().trim(),
      brand: brand?.toString().trim() || null,
      price: price ? Number.parseFloat(price.toString()) : null,
      category: category?.toString() || null,
      purchase_date: purchaseDate?.toString() || null,
      usage_status: usageStatus?.toString() || null,
      rating: rating ? Number.parseInt(rating.toString()) : null,
      photo_url: photoUrl?.toString() || null,
    }

    const { error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", productId.toString())
      .eq("user_id", user.id)

    if (error) throw error

    revalidatePath("/products")
    return { success: "Product updated successfully!" }
  } catch (error: any) {
    console.error("Error updating product:", error)
    return { error: error.message || "Failed to update product" }
  }
}

export async function deleteProduct(productId: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    // Get the product to check if it has a photo to delete
    const { data: product } = await supabase
      .from("products")
      .select("photo_url")
      .eq("id", productId)
      .eq("user_id", user.id)
      .single()

    // Delete the product
    const { error } = await supabase.from("products").delete().eq("id", productId).eq("user_id", user.id)

    if (error) throw error

    // Delete the photo from storage if it exists
    if (product?.photo_url) {
      await deleteProductPhoto(product.photo_url, user.id)
    }

    revalidatePath("/products")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting product:", error)
    return { error: error.message || "Failed to delete product" }
  }
}
