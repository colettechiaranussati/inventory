import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AddProductFormDebug from "@/components/add-product-form-debug"
import PhotoVerificationDashboard from "@/components/photo-verification-dashboard"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function PhotoDebugPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/products">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Photo Association Debug</h1>
          <p className="text-muted-foreground">Debug and verify photo upload and database association process.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Add Product (Debug Mode)</h2>
            <AddProductFormDebug />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Photo Verification</h2>
            <PhotoVerificationDashboard />
          </div>
        </div>
      </div>
    </div>
  )
}
