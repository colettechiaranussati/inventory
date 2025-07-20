import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Package, Plus, Sparkles } from "lucide-react"
import { signOut } from "@/lib/actions"
import Link from "next/link"

export default async function Home() {
  // If Supabase is not configured, show setup message directly
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#161616]">
        <h1 className="text-2xl font-bold mb-4 text-white">Connect Supabase to get started</h1>
      </div>
    )
  }

  // Get the user from the server
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user, redirect to login
  if (!user) {
    redirect("/auth/login")
  }

  // Get product count
  const { count } = await supabase.from("products").select("*", { count: "exact", head: true })

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Beauty Tracker</h1>
            <p className="text-muted-foreground">Welcome back, {user.email}</p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">My Products</h3>
                <p className="text-3xl font-bold text-primary">{count || 0}</p>
                <p className="text-sm text-muted-foreground">Total products tracked</p>
                <div className="mt-3">
                  <Link href="/products">
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      Manage Products
                    </Button>
                  </Link>
                </div>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <Link href="/products/add">
                    <Button className="w-full justify-start">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Product
                    </Button>
                  </Link>
                  <Link href="/products">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Package className="h-4 w-4 mr-2" />
                      View All Products
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">AI Suggestions</h3>
                <p className="text-sm text-muted-foreground mb-3">Get personalized product recommendations</p>
                <div className="mt-3">
                  <Link href="/suggestions">
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Get AI Suggestions
                    </Button>
                  </Link>
                </div>
              </div>
              <Sparkles className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
