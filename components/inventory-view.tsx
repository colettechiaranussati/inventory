"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Grid, List, LayoutGrid } from "lucide-react"
import InventoryFilters from "./inventory-filters"
import ProductCard from "./product-card"
import type { Product } from "@/lib/product-actions"
import type { FilterOptions } from "./inventory-filters"
import Link from "next/link"

export type ViewMode = "grid" | "list"

interface InventoryViewProps {
  initialProducts?: Product[]
}

export default function InventoryView({ initialProducts = [] }: InventoryViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [products, setProducts] = useState<Product[]>(initialProducts)

  const handleFiltersChange = (filteredProducts: Product[], filters: FilterOptions) => {
    setProducts(filteredProducts)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-xl font-semibold">Product Inventory</h2>
        <div className="flex items-center gap-2">
          <Link href="/products/kanban">
            <Button variant="outline" size="sm" className="bg-transparent">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Kanban
            </Button>
          </Link>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "" : "bg-transparent"}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "" : "bg-transparent"}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <InventoryFilters onFiltersChange={handleFiltersChange} />

      {products.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">No products found matching your filters</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              viewMode={viewMode}
              onProductUpdate={(updatedProduct) => {
                setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)))
              }}
              onProductDelete={(deletedId) => {
                setProducts((prev) => prev.filter((p) => p.id !== deletedId))
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
