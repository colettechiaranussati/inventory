import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getKanbanProducts } from "@/lib/kanban-actions"
import KanbanBoard from "@/components/kanban-board"
import { Button } from "@/components/ui/button"
import { ArrowLeft, LayoutGrid } from "lucide-react"
import Link from "next/link"

export default async function KanbanPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch products for the Kanban board
  const { products, error } = await getKanbanProducts()

  if (error) {
    console.error("Error loading products:", error)
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/products">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Product Kanban Board</h1>
              <p className="text-muted-foreground">Drag and drop products to update their usage status</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Total: {products.length} products</span>
            </div>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <LayoutGrid className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products yet</h3>
            <p className="text-muted-foreground mb-4">Add some products to see them on the Kanban board</p>
            <Link href="/products/add">
              <Button>Add Your First Product</Button>
            </Link>
          </div>
        ) : (
          <KanbanBoard initialProducts={products} />
        )}
      </div>
    </div>
  )
}
