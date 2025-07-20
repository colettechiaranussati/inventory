import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { InfoIcon, ExternalLink } from "lucide-react"

export default function StorageSetupGuide() {
  return (
    <Card className="w-full max-w-2xl mx-auto mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <InfoIcon className="h-5 w-5" />
          Photo Upload Setup Required
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertDescription>
            <div className="space-y-4">
              <p>To enable photo uploads, you need to create a storage bucket in your Supabase dashboard:</p>

              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to your Supabase project dashboard</li>
                <li>
                  Navigate to <strong>Storage</strong> in the sidebar
                </li>
                <li>
                  Click <strong>"Create bucket"</strong>
                </li>
                <li>
                  Name it <strong>"product-photos"</strong> (with hyphen)
                </li>
                <li>
                  Make it <strong>public</strong>
                </li>
                <li>Run the storage policies SQL script from the project</li>
              </ol>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://supabase.com/docs/guides/storage/quickstart"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    Setup Guide <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/project/default/storage/buckets`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    Open Dashboard <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                Once set up, refresh this page to enable photo uploads.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
