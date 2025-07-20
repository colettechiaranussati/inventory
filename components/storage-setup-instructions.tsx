import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

export default function StorageSetupInstructions() {
  return (
    <Card className="w-full max-w-2xl mx-auto mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <InfoIcon className="h-5 w-5" />
          Storage Setup Required
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertDescription>
            To enable photo uploads, you need to create a storage bucket in your Supabase dashboard:
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Go to your Supabase dashboard</li>
              <li>Navigate to Storage</li>
              <li>Click "Create bucket"</li>
              <li>Name it "product-photos" (with hyphen)</li>
              <li>Make it public</li>
              <li>Run the storage policies SQL script</li>
            </ol>
            <p className="mt-2 text-sm">Once set up, you can switch back to the full form with photo uploads.</p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
