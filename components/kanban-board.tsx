"use client"

import { useState, useTransition } from "react"
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { type KanbanProduct, type UsageStatus, updateProductStatus } from "@/lib/kanban-actions"
import KanbanProductCard from "./kanban-product-card"

interface KanbanBoardProps {
  initialProducts: KanbanProduct[]
}

const COLUMNS: { id: UsageStatus; title: string; color: string; bgColor: string }[] = [
  { id: "new", title: "New", color: "text-blue-600", bgColor: "bg-blue-50" },
  { id: "in progress", title: "In Progress", color: "text-yellow-600", bgColor: "bg-yellow-50" },
  { id: "finished", title: "Finished", color: "text-green-600", bgColor: "bg-green-50" },
  { id: "want to repurchase", title: "Want to Repurchase", color: "text-purple-600", bgColor: "bg-purple-50" },
]

export default function KanbanBoard({ initialProducts }: KanbanBoardProps) {
  const [products, setProducts] = useState<KanbanProduct[]>(initialProducts)
  const [activeProduct, setActiveProduct] = useState<KanbanProduct | null>(null)
  const [isPending, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  // Group products by status
  const productsByStatus = COLUMNS.reduce(
    (acc, column) => {
      acc[column.id] = products.filter((product) => product.usage_status === column.id)
      return acc
    },
    {} as Record<UsageStatus, KanbanProduct[]>,
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const product = products.find((p) => p.id === active.id)
    setActiveProduct(product || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      setActiveProduct(null)
      return
    }

    const productId = active.id as string
    const newStatus = over.id as UsageStatus

    // Find the product being moved
    const product = products.find((p) => p.id === productId)
    if (!product || product.usage_status === newStatus) {
      setActiveProduct(null)
      return
    }

    // Optimistic update
    const optimisticProducts = products.map((p) => (p.id === productId ? { ...p, usage_status: newStatus } : p))

    startTransition(async () => {
      // Update UI immediately
      setProducts(optimisticProducts)
      setActiveProduct(null)

      try {
        // Update database
        const result = await updateProductStatus(productId, newStatus)

        if (!result.success) {
          // Revert on error
          setProducts(products)
          toast.error(`Failed to update product: ${result.error}`)
        } else {
          toast.success(`Product moved to ${newStatus}`)
        }
      } catch (error) {
        // Revert on error
        setProducts(products)
        toast.error("Failed to update product status")
      }
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {COLUMNS.map((column) => (
          <Card key={column.id} className={`${column.bgColor} border-2`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-lg flex items-center justify-between ${column.color}`}>
                {column.title}
                <Badge variant="secondary" className="ml-2">
                  {productsByStatus[column.id]?.length || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div id={column.id} className="min-h-[400px] space-y-2" style={{ minHeight: "400px" }}>
                {productsByStatus[column.id]?.map((product) => (
                  <div key={product.id} id={product.id} className="cursor-grab active:cursor-grabbing">
                    <KanbanProductCard product={product} />
                  </div>
                ))}

                {productsByStatus[column.id]?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No products in this status</p>
                    <p className="text-xs">Drag products here to update their status</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DragOverlay>{activeProduct && <KanbanProductCard product={activeProduct} isDragging />}</DragOverlay>
    </DndContext>
  )
}
