import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Plus, LayoutGrid } from "lucide-react"
import { signOut } from "@/lib/actions"
import Link from "next/link"
import InventoryView from "@/components/inventory-view"
import SuggestionsWidget from "@/components/suggestions-widget"

export default async function ProductsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Products</h1>
            <p className="text-muted-foreground">Manage your beauty and health products</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/products/kanban">
              <Button variant="outline" className="bg-transparent">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Kanban View
              </Button>
            </Link>
            <Link href="/products/add">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </Link>
            <form action={signOut}>
              <Button type="submit" variant="outline" className="bg-transparent">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <InventoryView />
          </div>
          <div className="lg:col-span-1">
            <SuggestionsWidget />
          </div>
        </div>
      </div>
    </div>
  )
}
