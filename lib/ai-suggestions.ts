"use server"

import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { z } from "zod"

// Schema for AI response validation
const ProductSuggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      name: z.string().describe("Product name"),
      brand: z.string().describe("Brand name"),
      category: z.string().describe("Product category"),
      reason: z.string().describe("Why this product is recommended"),
      price_range: z.string().describe("Estimated price range (e.g., '$15-25')"),
      key_benefits: z.array(z.string()).describe("Key benefits or features"),
      similarity_score: z.number().min(0).max(100).describe("Similarity score to user's preferences (0-100)"),
    }),
  ),
  analysis: z.object({
    user_preferences: z.array(z.string()).describe("Identified user preferences"),
    trending_categories: z.array(z.string()).describe("Categories the user seems interested in"),
    brand_affinity: z.array(z.string()).describe("Brands the user prefers"),
  }),
})

export type ProductSuggestion = z.infer<typeof ProductSuggestionSchema>["suggestions"][0]
export type SuggestionAnalysis = z.infer<typeof ProductSuggestionSchema>["analysis"]

export interface SuggestionResult {
  suggestions: ProductSuggestion[]
  analysis: SuggestionAnalysis
  success: boolean
  error?: string
  needsApiKey?: boolean
}

// Check if AI features are available
function isAIAvailable(): boolean {
  return !!(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY)
}

export async function generateProductSuggestions(): Promise<SuggestionResult> {
  try {
    // Check if AI is configured
    if (!isAIAvailable()) {
      return {
        suggestions: [],
        analysis: {
          user_preferences: [],
          trending_categories: [],
          brand_affinity: [],
        },
        success: false,
        needsApiKey: true,
        error:
          "AI suggestions require a Google AI API key. Please add GOOGLE_GENERATIVE_AI_API_KEY to your environment variables to enable this feature.",
      }
    }

    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Fetch products marked as "want to repurchase"
    const { data: repurchaseProducts, error: repurchaseError } = await supabase
      .from("products")
      .select("name, brand, category, rating, price")
      .eq("user_id", user.id)
      .eq("usage_status", "want to repurchase")
      .order("rating", { ascending: false, nullsFirst: false })

    if (repurchaseError) throw repurchaseError

    // Also get highly rated products (4+ stars) for additional context
    const { data: highRatedProducts, error: ratedError } = await supabase
      .from("products")
      .select("name, brand, category, rating, price")
      .eq("user_id", user.id)
      .gte("rating", 4)
      .order("rating", { ascending: false })
      .limit(10)

    if (ratedError) throw ratedError

    // Combine and deduplicate products
    const allProducts = [...(repurchaseProducts || []), ...(highRatedProducts || [])]
    const uniqueProducts = allProducts.filter(
      (product, index, self) => index === self.findIndex((p) => p.name === product.name && p.brand === product.brand),
    )

    if (uniqueProducts.length === 0) {
      return {
        suggestions: [],
        analysis: {
          user_preferences: [],
          trending_categories: [],
          brand_affinity: [],
        },
        success: true,
        error:
          "No products found to base suggestions on. Add some products and mark them as 'want to repurchase' or rate them highly!",
      }
    }

    // Prepare data for AI prompt
    const productList = uniqueProducts
      .map((p) => `${p.name} by ${p.brand || "Unknown"} (${p.category || "Uncategorized"})`)
      .join(", ")

    const brands = [...new Set(uniqueProducts.map((p) => p.brand).filter(Boolean))]
    const categories = [...new Set(uniqueProducts.map((p) => p.category).filter(Boolean))]

    // Create AI prompt
    const prompt = `
You are a beauty and health product expert. Based on the user's favorite products, suggest 5 similar items they might love.

USER'S FAVORITE PRODUCTS:
${productList}

PREFERRED BRANDS: ${brands.join(", ")}
PREFERRED CATEGORIES: ${categories.join(", ")}

Please suggest 5 beauty or health products that are:
1. Similar to their favorites but not identical
2. From reputable brands (can include their preferred brands or new ones)
3. In related categories they might enjoy
4. Suitable for someone who likes the products listed above

For each suggestion, provide:
- Product name (realistic, existing product)
- Brand name
- Category
- Detailed reason for recommendation
- Estimated price range
- Key benefits/features
- Similarity score (0-100) based on user preferences

Also provide an analysis of the user's preferences, trending categories they like, and brand affinity.

Focus on products that actually exist and are currently available in the market.
    `

    // Generate suggestions using AI
    const { object } = await generateObject({
      model: google("gemini-2.0-flash-exp"),
      schema: ProductSuggestionSchema,
      prompt,
      temperature: 0.7,
    })

    return {
      suggestions: object.suggestions,
      analysis: object.analysis,
      success: true,
    }
  } catch (error: any) {
    console.error("Error generating product suggestions:", error)

    // Check if it's an API key error
    if (error.message && error.message.includes("API key")) {
      return {
        suggestions: [],
        analysis: {
          user_preferences: [],
          trending_categories: [],
          brand_affinity: [],
        },
        success: false,
        needsApiKey: true,
        error:
          "AI suggestions require a Google AI API key. Please add GOOGLE_GENERATIVE_AI_API_KEY to your environment variables to enable this feature.",
      }
    }

    return {
      suggestions: [],
      analysis: {
        user_preferences: [],
        trending_categories: [],
        brand_affinity: [],
      },
      success: false,
      error: error.message || "Failed to generate suggestions",
    }
  }
}

export async function getUserProductStats() {
  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    // Get product statistics
    const { data: stats } = await supabase
      .from("products")
      .select("usage_status, category, brand, rating")
      .eq("user_id", user.id)

    if (!stats) return null

    const totalProducts = stats.length
    const repurchaseProducts = stats.filter((p) => p.usage_status === "want to repurchase").length
    const highRatedProducts = stats.filter((p) => p.rating && p.rating >= 4).length
    const topCategories = Object.entries(
      stats.reduce((acc: Record<string, number>, p) => {
        if (p.category) {
          acc[p.category] = (acc[p.category] || 0) + 1
        }
        return acc
      }, {}),
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category)

    const topBrands = Object.entries(
      stats.reduce((acc: Record<string, number>, p) => {
        if (p.brand) {
          acc[p.brand] = (acc[p.brand] || 0) + 1
        }
        return acc
      }, {}),
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([brand]) => brand)

    return {
      totalProducts,
      repurchaseProducts,
      highRatedProducts,
      topCategories,
      topBrands,
    }
  } catch (error) {
    console.error("Error getting user product stats:", error)
    return null
  }
}

// Helper function to check if AI features should be shown
export function shouldShowAIFeatures(): boolean {
  return isAIAvailable()
}
