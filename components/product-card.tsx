"use client"

import { useState, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Star } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { deleteProduct } from "@/lib/product-actions"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  brand: string | null
  price: number | null
  category: string | null
  purchase_date: string | null
  photo_url: string | null
  usage_status: string | null
  rating: number | null
}

interface ProductCardProps {
  product: Product
  viewMode?: "grid" | "list"
}

export default function ProductCard({ product, viewMode = "grid" }: ProductCardProps) {
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    startTransition(async () => {
      try {
        const result = await deleteProduct(product.id)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success("Product deleted successfully!")
        }
      } catch (error) {
        toast.error("Failed to delete product")
      } finally {
        setIsDeleting(false)
      }
    })
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800"
      case "in progress":
        return "bg-yellow-100 text-yellow-800"
      case "finished":
        return "bg-green-100 text-green-800"
      case "want to repurchase":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className={cn("group hover:shadow-md transition-shadow", viewMode === "list" && "flex flex-row")}>
      <CardContent
        className={cn("p-4 space-y-3", viewMode === "list" && "flex flex-row items-center space-y-0 space-x-4 w-full")}
      >
        {/* Product Image */}
        <div className={cn(viewMode === "grid" ? "w-full" : "flex-shrink-0")}>
          {product.photo_url ? (
            <img
              src={product.photo_url || "/placeholder.svg"}
              alt={product.name}
              className={cn("object-cover rounded-md", viewMode === "grid" ? "w-full h-48" : "w-20 h-20")}
            />
          ) : (
            <div
              className={cn(
                "bg-muted rounded-md flex items-center justify-center",
                viewMode === "grid" ? "w-full h-48" : "w-20 h-20",
              )}
            >
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className={cn("space-y-2", viewMode === "list" && "flex-1 min-w-0")}>
          <div className="flex justify-between items-start">
            <h3 className={cn("font-semibold line-clamp-2", viewMode === "grid" ? "text-lg" : "text-base")}>
              {product.name}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/products/${product.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {product.brand && <p className="text-muted-foreground font-medium">{product.brand}</p>}

          <div className={cn("flex flex-wrap gap-2", viewMode === "list" && "flex-row")}>
            {product.category && <Badge variant="outline">{product.category}</Badge>}
            {product.usage_status && (
              <Badge className={getStatusColor(product.usage_status)}>{product.usage_status}</Badge>
            )}
          </div>

          <div className={cn(viewMode === "list" && "flex items-center justify-between")}>
            {product.price && <p className="text-lg font-semibold">${product.price.toFixed(2)}</p>}

            {product.rating && (
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < product.rating! ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  />
                ))}
                <span className="text-sm text-muted-foreground ml-1">({product.rating}/5)</span>
              </div>
            )}
          </div>

          {product.purchase_date && (
            <p className="text-sm text-muted-foreground">
              Purchased: {new Date(product.purchase_date).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
