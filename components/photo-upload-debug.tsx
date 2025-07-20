"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Upload, X, ImageIcon, AlertCircle, CheckCircle, Loader2, Bug, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { uploadProductPhoto, validateFile, type UploadResult } from "@/lib/storage-utils-fixed"
import { photoDebugger, validatePhotoUrl } from "@/lib/photo-debug"
import { toast } from "sonner"

interface PhotoUploadDebugProps {
  userId: string
  currentPhotoUrl?: string
  onPhotoChange: (photoUrl: string | null) => void
  onUploadStart?: () => void
  onUploadComplete?: (result: UploadResult) => void
  disabled?: boolean
  className?: string
  showDebugInfo?: boolean
}

export default function PhotoUploadDebug({
  userId,
  currentPhotoUrl,
  onPhotoChange,
  onUploadStart,
  onUploadComplete,
  disabled = false,
  className,
  showDebugInfo = process.env.NODE_ENV === "development",
}: PhotoUploadDebugProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [debugExpanded, setDebugExpanded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Debug the initial state
  useEffect(() => {
    photoDebugger.log("PhotoUpload Initialized", {
      userId,
      currentPhotoUrl,
      hasOnPhotoChange: !!onPhotoChange,
      disabled,
    })

    if (currentPhotoUrl) {
      const validation = validatePhotoUrl(currentPhotoUrl)
      photoDebugger.log(
        "Initial Photo URL Validation",
        {
          url: currentPhotoUrl,
          validation,
        },
        validation.valid,
        validation.error,
      )
    }
  }, [userId, currentPhotoUrl, onPhotoChange, disabled])

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (disabled) return

      photoDebugger.log("File Selected", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userId,
      })

      setUploadError(null)

      // Validate file
      const validation = validateFile(file)
      photoDebugger.log(
        "File Validation",
        {
          file: { name: file.name, size: file.size, type: file.type },
          validation,
        },
        validation.valid,
        validation.error,
      )

      if (!validation.valid) {
        setUploadError(validation.error || "Invalid file")
        toast.error(validation.error || "Invalid file")
        return
      }

      // Create preview
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)
      photoDebugger.log("Preview URL Created", { objectUrl })

      setIsUploading(true)
      setUploadProgress(0)
      onUploadStart?.()

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      try {
        photoDebugger.log("Starting Upload", {
          fileName: file.name,
          userId,
          fileSize: file.size,
        })

        const result = await uploadProductPhoto(file, userId)

        photoDebugger.log(
          "Upload Result",
          {
            result,
            success: result.success,
            url: result.url,
            fileName: result.fileName,
          },
          result.success,
          result.error,
        )

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (result.success && result.url) {
          // Validate the returned URL
          const urlValidation = validatePhotoUrl(result.url)
          photoDebugger.log(
            "Upload URL Validation",
            {
              url: result.url,
              validation: urlValidation,
            },
            urlValidation.valid,
            urlValidation.error,
          )

          // Call the callback to update parent component
          photoDebugger.log("Calling onPhotoChange", {
            url: result.url,
            hasCallback: !!onPhotoChange,
          })

          onPhotoChange(result.url)
          setPreviewUrl(result.url)
          toast.success("Photo uploaded successfully!")

          photoDebugger.log("Photo Change Completed", {
            newUrl: result.url,
            previewUrl: result.url,
          })
        } else {
          photoDebugger.log(
            "Upload Failed",
            {
              result,
              error: result.error,
            },
            false,
            result.error,
          )

          setUploadError(result.error || "Upload failed")
          toast.error(result.error || "Upload failed")
          setPreviewUrl(currentPhotoUrl || null)
        }

        onUploadComplete?.(result)
      } catch (error: any) {
        clearInterval(progressInterval)
        const errorMessage = error.message || "Upload failed"

        photoDebugger.log(
          "Upload Exception",
          {
            error: errorMessage,
            stack: error.stack,
          },
          false,
          errorMessage,
        )

        setUploadError(errorMessage)
        toast.error(errorMessage)
        setPreviewUrl(currentPhotoUrl || null)
        onUploadComplete?.({ success: false, error: errorMessage })
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
        URL.revokeObjectURL(objectUrl)

        photoDebugger.log("Upload Process Completed", {
          isUploading: false,
          uploadProgress: 0,
        })
      }
    },
    [userId, disabled, currentPhotoUrl, onPhotoChange, onUploadStart, onUploadComplete],
  )

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    // Reset input value to allow selecting the same file again
    event.target.value = ""
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragActive(false)

    const file = event.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setDragActive(false)
  }

  const removePhoto = () => {
    photoDebugger.log("Removing Photo", {
      currentUrl: previewUrl,
      hasCallback: !!onPhotoChange,
    })

    setPreviewUrl(null)
    setUploadError(null)
    onPhotoChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    photoDebugger.log("Photo Removed", {
      newUrl: null,
    })
  }

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const debugLogs = photoDebugger.getLogs()

  return (
    <div className={cn("space-y-3", className)}>
      <Label>Product Photo</Label>

      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          dragActive && "border-primary bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed",
          uploadError && "border-destructive",
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <CardContent className="p-6">
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl || "/placeholder.svg"}
                alt="Product preview"
                className="w-full h-48 object-cover rounded-md"
              />
              {!isUploading && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    removePhoto()
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                  <div className="text-white text-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="text-sm">Uploading...</p>
                    <Progress value={uploadProgress} className="w-32" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 5MB</p>
              </div>
              {isUploading && <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Button */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={openFileDialog}
          disabled={disabled || isUploading}
          className="flex-1 bg-transparent"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {previewUrl ? "Change Photo" : "Upload Photo"}
            </>
          )}
        </Button>

        {previewUrl && !isUploading && (
          <Button type="button" variant="outline" onClick={removePhoto} disabled={disabled}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Error Display */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {/* Success Display */}
      {previewUrl && !isUploading && !uploadError && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Photo uploaded successfully! URL: {previewUrl.substring(0, 50)}...</AlertDescription>
        </Alert>
      )}

      {/* Debug Information */}
      {showDebugInfo && debugLogs.length > 0 && (
        <Collapsible open={debugExpanded} onOpenChange={setDebugExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full bg-transparent">
              <Bug className="mr-2 h-4 w-4" />
              Debug Info ({debugLogs.length} logs)
              <ChevronDown className={cn("ml-2 h-4 w-4 transition-transform", debugExpanded && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-2">
              <CardContent className="p-4">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {debugLogs.slice(-10).map((log, index) => (
                    <div key={index} className="text-xs border-l-2 border-gray-200 pl-2">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-medium", log.success ? "text-green-600" : "text-red-600")}>
                          {log.step}
                        </span>
                        <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      {log.error && <div className="text-red-600 mt-1">{log.error}</div>}
                      <pre className="text-gray-600 mt-1 whitespace-pre-wrap">{JSON.stringify(log.data, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />
    </div>
  )
}
