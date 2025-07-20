"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw, ExternalLink } from "lucide-react"
import { checkStorageStatus, createStorageBucket, type StorageStatus } from "@/lib/storage-utils"
import { toast } from "sonner"

export default function StorageDiagnostics() {
  const [isChecking, setIsChecking] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null)

  const runDiagnostics = async () => {
    setIsChecking(true)
    try {
      const status = await checkStorageStatus()
      setStorageStatus(status)

      if (status.available) {
        toast.success("Storage is properly configured!")
      } else {
        toast.error(status.error || "Storage configuration issues found")
      }
    } catch (error) {
      toast.error("Failed to check storage status")
    } finally {
      setIsChecking(false)
    }
  }

  const attemptBucketCreation = async () => {
    setIsCreating(true)
    try {
      const result = await createStorageBucket()
      if (result.success) {
        toast.success("Storage bucket created successfully!")
        // Re-run diagnostics
        await runDiagnostics()
      } else {
        toast.error(result.error || "Failed to create storage bucket")
      }
    } catch (error) {
      toast.error("Failed to create storage bucket")
    } finally {
      setIsCreating(false)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getStatusIcon = (available: boolean | undefined) => {
    if (available === undefined) return <Loader2 className="h-4 w-4 animate-spin" />
    return available ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusBadge = (available: boolean | undefined) => {
    if (available === undefined) return <Badge variant="secondary">Checking...</Badge>
    return available ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Available
      </Badge>
    ) : (
      <Badge variant="destructive">Unavailable</Badge>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Storage Diagnostics
          </CardTitle>
          <Button variant="outline" size="sm" onClick={runDiagnostics} disabled={isChecking}>
            {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {isChecking ? "Checking..." : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            {getStatusIcon(storageStatus?.available)}
            <span className="font-medium">Photo Upload System</span>
          </div>
          {getStatusBadge(storageStatus?.available)}
        </div>

        {/* Detailed Status */}
        {storageStatus && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">Storage Access</span>
                {getStatusIcon(storageStatus.bucketExists !== false)}
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">Bucket Exists</span>
                {getStatusIcon(storageStatus.bucketExists)}
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">Policies Configured</span>
                {getStatusIcon(storageStatus.policiesExist)}
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">Upload Ready</span>
                {getStatusIcon(storageStatus.available)}
              </div>
            </div>

            {/* Error Details */}
            {storageStatus.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{storageStatus.error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            {!storageStatus.available && (
              <div className="space-y-3">
                {!storageStatus.bucketExists && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      The storage bucket doesn't exist. You can try to create it automatically or set it up manually.
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={attemptBucketCreation} disabled={isCreating} size="sm">
                        {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Create Bucket Automatically
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/project/default/storage/buckets`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          Manual Setup <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}

                {storageStatus.bucketExists && !storageStatus.policiesExist && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      The bucket exists but storage policies need to be configured. Run the SQL script to set up
                      policies.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href="https://supabase.com/docs/guides/storage/security/access-control"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        Policy Setup Guide <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Success Message */}
            {storageStatus.available && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Storage is properly configured! Photo uploads are ready to use.</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
