import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import StorageDiagnosticsAdvanced from "@/components/storage-diagnostics-advanced"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function StorageSetupPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/products">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Storage Setup & Diagnostics</h1>
          <p className="text-muted-foreground">
            Diagnose and fix photo upload issues with comprehensive storage testing.
          </p>
        </div>

        <StorageDiagnosticsAdvanced />
      </div>
    </div>
  )
}
