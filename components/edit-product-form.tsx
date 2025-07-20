"use client"

import type React from "react"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Star, Loader2, Trash2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import { updateProduct, deleteProduct } from "@/lib/product-actions"
import PhotoUpload from "@/components/photo-upload"

const categories = [
  "Skincare",
  "Makeup",
  "Haircare",
  "Fragrance",
  "Body Care",
  "Supplements",
  "Tools & Accessories",
  "Other",
]

const usageStatuses = [
  { value: "new", label: "New" },
  { value: "in progress", label: "In Progress" },
  { value: "finished", label: "Finished" },
  { value: "want to repurchase", label: "Want to Repurchase" },
]

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

interface EditProductFormProps {
  product: Product
}

export default function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [state, formAction] = useActionState(updateProduct, null)
  const [userId, setUserId] = useState<string>("")

  const [formData, setFormData] = useState({
    name: product.name || "",
    brand: product.brand || "",
    price: product.price?.toString() || "",
    category: product.category || "",
    purchaseDate: product.purchase_date ? parseISO(product.purchase_date) : undefined,
    usageStatus: product.usage_status || "",
    rating: product.rating || 0,
    photoUrl: product.photo_url || "",
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleRatingClick = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }))
  }

  const handlePhotoChange = (photoUrl: string | null) => {
    setFormData((prev) => ({ ...prev, photoUrl: photoUrl || "" }))
  }

  useEffect(() => {
    const initializeUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    initializeUser()
  }, [])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formData.name.trim()) {
      toast.error("Product name is required")
      return
    }

    const formDataObj = new FormData()
    formDataObj.append("productId", product.id)
    formDataObj.append("name", formData.name.trim())
    formDataObj.append("brand", formData.brand.trim())
    formDataObj.append("price", formData.price)
    formDataObj.append("category", formData.category)
    formDataObj.append("purchaseDate", formData.purchaseDate ? format(formData.purchaseDate, "yyyy-MM-dd") : "")
    formDataObj.append("usageStatus", formData.usageStatus)
    formDataObj.append("rating", formData.rating.toString())
    formDataObj.append("photoUrl", formData.photoUrl)

    startTransition(() => {
      formAction(formDataObj)
    })
  }

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
          router.push("/products")
        }
      } catch (error) {
        toast.error("Failed to delete product")
      } finally {
        setIsDeleting(false)
      }
    })
  }

  // Show success message
  if (state?.success) {
    toast.success(state.success)
    router.push("/products")
  }

  // Show error message
  if (state?.error) {
    toast.error(state.error)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold">Edit Product</CardTitle>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting || isPending}
          >
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter product name"
              required
            />
          </div>

          {/* Brand */}
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              value={formData.brand}
              onChange={(e) => handleInputChange("brand", e.target.value)}
              placeholder="Enter brand name"
            />
          </div>

          {/* Price and Category Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Purchase Date */}
          <div className="space-y-2">
            <Label>Purchase Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.purchaseDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.purchaseDate ? format(formData.purchaseDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.purchaseDate}
                  onSelect={(date) => handleInputChange("purchaseDate", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Photo Upload */}
          {userId && (
            <PhotoUpload
              userId={userId}
              currentPhotoUrl={formData.photoUrl}
              onPhotoChange={handlePhotoChange}
              disabled={isPending || isDeleting}
            />
          )}

          {/* Usage Status */}
          <div className="space-y-2">
            <Label>Usage Status</Label>
            <Select value={formData.usageStatus} onValueChange={(value) => handleInputChange("usageStatus", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select usage status" />
              </SelectTrigger>
              <SelectContent>
                {usageStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => handleRatingClick(star)} className="focus:outline-none">
                  <Star
                    className={cn(
                      "h-6 w-6 transition-colors",
                      star <= formData.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-400",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isPending || isDeleting} className="w-full">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Product...
              </>
            ) : (
              "Update Product"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
