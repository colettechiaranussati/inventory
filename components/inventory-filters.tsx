"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Search, Filter, X, ChevronDown, Star, SortAsc, SortDesc } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FilterState {
  search: string
  category: string
  brand: string
  rating: number
  usageStatus: string
  sortBy: "date_added" | "rating" | "name" | "price"
  sortOrder: "asc" | "desc"
}

interface InventoryFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  filterOptions: {
    categories: string[]
    brands: string[]
    usageStatuses: string[]
  }
  isLoading?: boolean
  resultCount?: number
}

const sortOptions = [
  { value: "date_added", label: "Date Added" },
  { value: "rating", label: "Rating" },
  { value: "name", label: "Name" },
  { value: "price", label: "Price" },
]

const usageStatusLabels: Record<string, string> = {
  new: "New",
  "in progress": "In Progress",
  finished: "Finished",
  "want to repurchase": "Want to Repurchase",
}

export default function InventoryFilters({
  filters,
  onFiltersChange,
  filterOptions,
  isLoading = false,
  resultCount = 0,
}: InventoryFiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [searchValue, setSearchValue] = useState(filters.search)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ ...filters, search: searchValue })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchValue, filters, onFiltersChange])

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      search: "",
      category: "all",
      brand: "all",
      rating: 0,
      usageStatus: "all",
      sortBy: "date_added",
      sortOrder: "desc",
    }
    setSearchValue("")
    onFiltersChange(clearedFilters)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.category !== "all") count++
    if (filters.brand !== "all") count++
    if (filters.rating > 0) count++
    if (filters.usageStatus !== "all") count++
    return count
  }

  const activeFilterCount = getActiveFilterCount()

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search products by name or brand..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-10 pr-4"
        />
      </div>

      {/* Quick Sort and Filter Toggle */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={filters.sortBy} onValueChange={(value: any) => handleFilterChange("sortBy", value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFilterChange("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc")}
          >
            {filters.sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{isLoading ? "Loading..." : `${resultCount} products`}</span>

          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
                <ChevronDown className={cn("h-4 w-4 ml-2 transition-transform", isFiltersOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </div>

      {/* Advanced Filters */}
      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <CollapsibleContent>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Advanced Filters</CardTitle>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {filterOptions.categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Brand Filter */}
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Select value={filters.brand} onValueChange={(value) => handleFilterChange("brand", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {filterOptions.brands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Usage Status Filter */}
                <div className="space-y-2">
                  <Label>Usage Status</Label>
                  <Select
                    value={filters.usageStatus}
                    onValueChange={(value) => handleFilterChange("usageStatus", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {filterOptions.usageStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {usageStatusLabels[status] || status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rating Filter */}
                <div className="space-y-2">
                  <Label>Minimum Rating</Label>
                  <div className="flex items-center space-x-1">
                    {[0, 1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => handleFilterChange("rating", rating)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={cn(
                            "h-6 w-6 transition-colors",
                            rating <= filters.rating && rating > 0
                              ? "fill-yellow-400 text-yellow-400"
                              : rating === 0 && filters.rating === 0
                                ? "fill-gray-400 text-gray-400"
                                : "text-gray-300 hover:text-yellow-400",
                          )}
                        />
                      </button>
                    ))}
                    <span className="text-sm text-muted-foreground ml-2">
                      {filters.rating === 0 ? "Any" : `${filters.rating}+ stars`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Filters Display */}
              {activeFilterCount > 0 && (
                <div className="pt-4 border-t">
                  <Label className="text-sm font-medium mb-2 block">Active Filters:</Label>
                  <div className="flex flex-wrap gap-2">
                    {filters.search && (
                      <Badge variant="secondary" className="gap-1">
                        Search: "{filters.search}"
                        <button
                          onClick={() => {
                            setSearchValue("")
                            handleFilterChange("search", "")
                          }}
                          className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filters.category !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        Category: {filters.category}
                        <button
                          onClick={() => handleFilterChange("category", "all")}
                          className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filters.brand !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        Brand: {filters.brand}
                        <button
                          onClick={() => handleFilterChange("brand", "all")}
                          className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filters.usageStatus !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        Status: {usageStatusLabels[filters.usageStatus] || filters.usageStatus}
                        <button
                          onClick={() => handleFilterChange("usageStatus", "all")}
                          className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filters.rating > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        Rating: {filters.rating}+ stars
                        <button
                          onClick={() => handleFilterChange("rating", 0)}
                          className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
