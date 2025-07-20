"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles, Loader2, ExternalLink, AlertTriangle } from "lucide-react"
import { generateProductSuggestions, type ProductSuggestion } from "@/lib/ai-suggestions"
import { toast } from "sonner"
import Link from "next/link"

export default function SuggestionsWidget() {
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([])
  const [needsApiKey, setNeedsApiKey] = useState(false)

  const loadQuickSuggestions = async () => {
    setIsLoading(true)
    setNeedsApiKey(false)

    try {
      const result = await generateProductSuggestions()

      if (result.needsApiKey) {
        setNeedsApiKey(true)
        toast.error("AI features require API key setup")
        return
      }

      if (result.success) {
        setSuggestions(result.suggestions.slice(0, 3)) // Show only top 3
        toast.success("AI suggestions loaded!")
      } else {
        toast.error(result.error || "Failed to load suggestions")
      }
    } catch (error) {
      toast.error("Failed to load suggestions")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {needsApiKey ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              AI suggestions require a Google AI API key. Add{" "}
              <code className="text-xs bg-muted px-1 rounded">GOOGLE_GENERATIVE_AI_API_KEY</code> to your environment
              variables to enable this feature.
              <br />
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-xs mt-1 inline-block"
              >
                Get API key from Google AI Studio →
              </a>
            </AlertDescription>
          </Alert>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Get personalized product recommendations based on your favorites
            </p>
            <Button
              onClick={loadQuickSuggestions}
              disabled={isLoading}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get Suggestions
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="p-3 bg-white rounded-lg border">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm">{suggestion.name}</h4>
                  <Badge variant="outline" className="text-xs">
                    {suggestion.similarity_score}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{suggestion.brand}</p>
                <p className="text-xs text-green-600 font-medium">{suggestion.price_range}</p>
              </div>
            ))}
            <div className="flex gap-2">
              <Button
                onClick={loadQuickSuggestions}
                disabled={isLoading}
                size="sm"
                variant="outline"
                className="flex-1 bg-transparent"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                Refresh
              </Button>
              <Link href="/suggestions" className="flex-1">
                <Button size="sm" className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
                  <ExternalLink className="mr-1 h-3 w-3" />
                  View All
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
