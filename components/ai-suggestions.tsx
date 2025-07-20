"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Sparkles, Loader2, Star, TrendingUp, Heart, ChevronDown, ShoppingBag, Lightbulb, Target } from "lucide-react"
import {
  generateProductSuggestions,
  getUserProductStats,
  type ProductSuggestion,
  type SuggestionAnalysis,
} from "@/lib/ai-suggestions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface UserStats {
  totalProducts: number
  repurchaseProducts: number
  highRatedProducts: number
  topCategories: string[]
  topBrands: string[]
}

export default function AISuggestions() {
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([])
  const [analysis, setAnalysis] = useState<SuggestionAnalysis | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedSuggestions, setExpandedSuggestions] = useState<Record<number, boolean>>({})

  const loadUserStats = async () => {
    try {
      const stats = await getUserProductStats()
      setUserStats(stats)
    } catch (error) {
      console.error("Failed to load user stats:", error)
    }
  }

  const generateSuggestions = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await generateProductSuggestions()

      if (result.success) {
        setSuggestions(result.suggestions)
        setAnalysis(result.analysis)
        toast.success(`Generated ${result.suggestions.length} AI-powered suggestions!`)
      } else {
        setError(result.error || "Failed to generate suggestions")
        toast.error(result.error || "Failed to generate suggestions")
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to generate suggestions"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSuggestion = (index: number) => {
    setExpandedSuggestions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const getSimilarityColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-gray-600"
  }

  const getSimilarityBadgeVariant = (score: number) => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "outline"
  }

  useEffect(() => {
    loadUserStats()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI Product Suggestions</h2>
            <p className="text-muted-foreground">Personalized recommendations based on your favorites</p>
          </div>
        </div>
        <Button
          onClick={generateSuggestions}
          disabled={isLoading}
          className="bg-gradient-to-r from-purple-500 to-pink-500"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Get AI Suggestions
            </>
          )}
        </Button>
      </div>

      {/* User Stats */}
      {userStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{userStats.totalProducts}</p>
              <p className="text-xs text-muted-foreground">Total Products</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Heart className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold text-red-500">{userStats.repurchaseProducts}</p>
              <p className="text-xs text-muted-foreground">Want to Repurchase</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold text-yellow-500">{userStats.highRatedProducts}</p>
              <p className="text-xs text-muted-foreground">Highly Rated</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-sm font-bold text-blue-500">{userStats.topCategories[0] || "None"}</p>
              <p className="text-xs text-muted-foreground">Top Category</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-sm font-bold text-green-500">{userStats.topBrands[0] || "None"}</p>
              <p className="text-xs text-muted-foreground">Favorite Brand</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Analysis */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Your Beauty Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Your Preferences</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.user_preferences.map((pref, index) => (
                  <Badge key={index} variant="outline">
                    {pref}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Categories You Love</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.trending_categories.map((category, index) => (
                  <Badge key={index} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Brand Affinity</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.brand_affinity.map((brand, index) => (
                  <Badge key={index} className="bg-purple-100 text-purple-800">
                    {brand}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Recommended for You</h3>
          <div className="grid gap-4">
            {suggestions.map((suggestion, index) => (
              <Card key={index} className="overflow-hidden">
                <Collapsible open={expandedSuggestions[index]} onOpenChange={() => toggleSuggestion(index)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-lg">{suggestion.name}</CardTitle>
                            <Badge variant={getSimilarityBadgeVariant(suggestion.similarity_score)}>
                              <span className={getSimilarityColor(suggestion.similarity_score)}>
                                {suggestion.similarity_score}% match
                              </span>
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="font-medium">{suggestion.brand}</span>
                            <Badge variant="outline">{suggestion.category}</Badge>
                            <span className="font-medium text-green-600">{suggestion.price_range}</span>
                          </div>
                        </div>
                        <ChevronDown
                          className={cn("h-5 w-5 transition-transform", expandedSuggestions[index] && "rotate-180")}
                        />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium mb-2">Why we recommend this:</h5>
                          <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">Key Benefits:</h5>
                          <div className="flex flex-wrap gap-2">
                            {suggestion.key_benefits.map((benefit, benefitIndex) => (
                              <Badge key={benefitIndex} variant="outline" className="text-xs">
                                {benefit}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Similarity Score:</span>
                          <Progress value={suggestion.similarity_score} className="flex-1 max-w-32" />
                          <span className={cn("text-sm font-medium", getSimilarityColor(suggestion.similarity_score))}>
                            {suggestion.similarity_score}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && suggestions.length === 0 && !error && (
        <Card className="text-center py-12">
          <CardContent>
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Ready for AI Suggestions?</h3>
            <p className="text-muted-foreground mb-4">
              Mark some products as "want to repurchase" or rate them highly to get personalized recommendations.
            </p>
            <Button onClick={generateSuggestions} disabled={isLoading}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Suggestions
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
