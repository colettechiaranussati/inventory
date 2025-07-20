"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react"
import { debugStorageConfiguration, findBucketVariations, type StorageDebugInfo } from "@/lib/storage-debug"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function StorageDiagnosticsAdvanced() {
  const [isDebugging, setIsDebugging] = useState(false)
  const [debugInfo, setDebugInfo] = useState<StorageDebugInfo | null>(null)
  const [bucketVariations, setBucketVariations] = useState<string[]>([])
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    auth: false,
    buckets: false,
    permissions: false,
    config: false,
  })

  const runDiagnostics = async () => {
    setIsDebugging(true)
    try {
      const [debug, variations] = await Promise.all([debugStorageConfiguration(), findBucketVariations()])

      setDebugInfo(debug)
      setBucketVariations(variations)

      if (debug.bucketStatus.targetBucketExists && debug.permissionStatus.canWrite) {
        toast.success("Storage is properly configured!")
      } else {
        toast.error("Storage configuration issues found")
      }
    } catch (error) {
      toast.error("Failed to run diagnostics")
    } finally {
      setIsDebugging(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getStatusIcon = (status: boolean | undefined) => {
    if (status === undefined) return <Loader2 className="h-4 w-4 animate-spin" />
    return status ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusBadge = (status: boolean | undefined, trueText = "OK", falseText = "Error") => {
    if (status === undefined) return <Badge variant="secondary">Checking...</Badge>
    return status ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        {trueText}
      </Badge>
    ) : (
      <Badge variant="destructive">{falseText}</Badge>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Advanced Storage Diagnostics
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}>
              {showSensitiveInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showSensitiveInfo ? "Hide" : "Show"} Details
            </Button>
            <Button variant="outline" size="sm" onClick={runDiagnostics} disabled={isDebugging}>
              {isDebugging ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {isDebugging ? "Checking..." : "Refresh"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            {getStatusIcon(debugInfo?.bucketStatus.targetBucketExists && debugInfo?.permissionStatus.canWrite)}
            <span className="font-medium">Photo Upload System</span>
          </div>
          {getStatusBadge(
            debugInfo?.bucketStatus.targetBucketExists && debugInfo?.permissionStatus.canWrite,
            "Ready",
            "Not Ready",
          )}
        </div>

        {debugInfo && (
          <div className="space-y-3">
            {/* Authentication Status */}
            <Collapsible open={expandedSections.auth} onOpenChange={() => toggleSection("auth")}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(debugInfo.authStatus.isAuthenticated)}
                    <span className="font-medium">Authentication</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(debugInfo.authStatus.isAuthenticated, "Authenticated", "Not Authenticated")}
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform", expandedSections.auth && "rotate-180")}
                    />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pb-3">
                <div className="space-y-2 text-sm">
                  {debugInfo.authStatus.isAuthenticated ? (
                    <div className="space-y-1">
                      <p className="text-green-600">✓ User is authenticated</p>
                      {showSensitiveInfo && debugInfo.authStatus.userId && (
                        <div className="flex items-center gap-2">
                          <span>User ID: {debugInfo.authStatus.userId.substring(0, 8)}...</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(debugInfo.authStatus.userId!)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-red-600">✗ User is not authenticated</p>
                      {debugInfo.authStatus.error && (
                        <p className="text-red-600 text-xs">Error: {debugInfo.authStatus.error}</p>
                      )}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Bucket Status */}
            <Collapsible open={expandedSections.buckets} onOpenChange={() => toggleSection("buckets")}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(debugInfo.bucketStatus.targetBucketExists)}
                    <span className="font-medium">Storage Buckets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(debugInfo.bucketStatus.targetBucketExists, "Found", "Not Found")}
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform", expandedSections.buckets && "rotate-180")}
                    />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pb-3">
                <div className="space-y-3 text-sm">
                  {debugInfo.bucketStatus.canListBuckets ? (
                    <div className="space-y-2">
                      <p className="text-green-600">✓ Can access storage service</p>
                      <div>
                        <p className="font-medium mb-1">
                          Available buckets ({debugInfo.bucketStatus.availableBuckets.length}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {debugInfo.bucketStatus.availableBuckets.map((bucket) => (
                            <Badge
                              key={bucket}
                              variant={bucket === "product-photos" ? "default" : "outline"}
                              className={bucket === "product-photos" ? "bg-green-100 text-green-800" : ""}
                            >
                              {bucket}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {bucketVariations.length > 0 && (
                        <div>
                          <p className="font-medium mb-1">Found similar bucket names:</p>
                          <div className="flex flex-wrap gap-1">
                            {bucketVariations.map((bucket) => (
                              <Badge key={bucket} variant="secondary">
                                {bucket}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {!debugInfo.bucketStatus.targetBucketExists && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            The 'product-photos' bucket was not found. Check the bucket name in your Supabase dashboard.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-red-600">✗ Cannot access storage service</p>
                      {debugInfo.bucketStatus.error && (
                        <p className="text-red-600 text-xs">Error: {debugInfo.bucketStatus.error}</p>
                      )}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Permissions Status */}
            <Collapsible open={expandedSections.permissions} onOpenChange={() => toggleSection("permissions")}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(debugInfo.permissionStatus.canRead && debugInfo.permissionStatus.canWrite)}
                    <span className="font-medium">Permissions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(
                      debugInfo.permissionStatus.canRead && debugInfo.permissionStatus.canWrite,
                      "All OK",
                      "Issues",
                    )}
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform", expandedSections.permissions && "rotate-180")}
                    />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pb-3">
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(debugInfo.permissionStatus.canRead)}
                      <span>Read</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(debugInfo.permissionStatus.canWrite)}
                      <span>Write</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(debugInfo.permissionStatus.canDelete)}
                      <span>Delete</span>
                    </div>
                  </div>

                  {debugInfo.permissionStatus.errors.length > 0 && (
                    <div className="space-y-1">
                      <p className="font-medium text-red-600">Permission Errors:</p>
                      {debugInfo.permissionStatus.errors.map((error, index) => (
                        <p key={index} className="text-red-600 text-xs">
                          • {error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Configuration Status */}
            {showSensitiveInfo && (
              <Collapsible open={expandedSections.config} onOpenChange={() => toggleSection("config")}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(debugInfo.configStatus.clientInitialized && debugInfo.configStatus.hasAnonKey)}
                      <span className="font-medium">Configuration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(
                        debugInfo.configStatus.clientInitialized && debugInfo.configStatus.hasAnonKey,
                        "Configured",
                        "Issues",
                      )}
                      <ChevronDown
                        className={cn("h-4 w-4 transition-transform", expandedSections.config && "rotate-180")}
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-3">
                  <div className="space-y-2 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span>Supabase URL:</span>
                        <code className="text-xs bg-muted px-1 rounded">{debugInfo.configStatus.supabaseUrl}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(debugInfo.configStatus.hasAnonKey)}
                        <span>Anonymous Key: {debugInfo.configStatus.hasAnonKey ? "Configured" : "Missing"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(debugInfo.configStatus.clientInitialized)}
                        <span>
                          Client: {debugInfo.configStatus.clientInitialized ? "Initialized" : "Not Initialized"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`${debugInfo.configStatus.supabaseUrl}/project/default/storage/buckets`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  Open Storage Dashboard <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://supabase.com/docs/guides/storage/quickstart"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  Storage Documentation <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
