"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Star, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import PhotoUpload from "@/components/photo-upload"
import StorageDiagnostics from "@/components/storage-diagnostics"
import { checkStorageStatus } from "@/lib/storage-utils-fixed"

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

export default function AddProductForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [storageAvailable, setStorageAvailable] = useState<boolean | null>(null)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [userId, setUserId] = useState<string>("")

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    price: "",
    category: "",
    purchaseDate: undefined as Date | undefined,
    usageStatus: "",
    rating: 0,
    photoUrl: "",
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

    const checkStorage = async () => {
      const result = await checkStorageStatus()
      setStorageAvailable(result.available)
      if (!result.available) {
        setShowDiagnostics(true)
      }
    }

    initializeUser()
    checkStorage()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error("Product name is required")
      return
    }

    setIsSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const productData = {
        user_id: user.id,
        name: formData.name.trim(),
        brand: formData.brand.trim() || null,
        price: formData.price ? Number.parseFloat(formData.price) : null,
        category: formData.category || null,
        purchase_date: formData.purchaseDate ? format(formData.purchaseDate, "yyyy-MM-dd") : null,
        photo_url: formData.photoUrl || null,
        usage_status: formData.usageStatus || null,
        rating: formData.rating || null,
      }

      const { error } = await supabase.from("products").insert([productData])

      if (error) throw error

      toast.success("Product added successfully!")
      router.push("/products")
    } catch (error) {
      console.error("Error adding product:", error)
      toast.error("Failed to add product")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Storage Diagnostics */}
      {showDiagnostics && (
        <div className="space-y-4">
          <StorageDiagnostics />
          <div className="text-center">
            <Button variant="outline" onClick={() => setShowDiagnostics(false)} disabled={storageAvailable === null}>
              {storageAvailable ? "Continue with Photo Upload" : "Continue without Photos"}
            </Button>
          </div>
        </div>
      )}

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Add New Product</CardTitle>
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
                disabled={isSubmitting}
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
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    className="focus:outline-none"
                  >
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
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Product...
                </>
              ) : (
                "Add Product"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
