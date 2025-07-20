"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, StarHalf } from "lucide-react"
import type { KanbanProduct } from "@/lib/kanban-actions"
import Image from "next/image"

interface KanbanProductCardProps {
  product: KanbanProduct
  isDragging?: boolean
}

export default function KanbanProductCard({ product, isDragging = false }: KanbanProductCardProps) {
  // Render star rating
  const renderRating = (rating: number | null) => {
    if (!rating) return <span className="text-xs text-muted-foreground">No rating</span>

    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="h-3 w-3 fill-yellow-400 text-yellow-400" />)
    }

    const remainingStars = 5 - Math.ceil(rating)
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-3 w-3 text-gray-300" />)
    }

    return <div className="flex items-center gap-1">{stars}</div>
  }

  return (
    <Card
      className={`mb-3 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md ${
        isDragging ? "opacity-50 rotate-2 shadow-lg" : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Product Image */}
          <div className="flex-shrink-0">
            {product.photo_url ? (
              <Image
                src={product.photo_url || "/placeholder.svg"}
                alt={product.name}
                width={48}
                height={48}
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <span className="text-xs text-muted-foreground font-medium">
                  {product.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1 truncate">{product.name}</h4>

            {product.brand && <p className="text-xs text-muted-foreground mb-2">{product.brand}</p>}

            <div className="flex items-center justify-between mb-2">
              {renderRating(product.rating)}
              {product.price && <span className="text-xs font-medium text-green-600">${product.price}</span>}
            </div>

            {product.category && (
              <Badge variant="secondary" className="text-xs">
                {product.category}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
