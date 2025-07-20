"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, ImageIcon, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { uploadProductPhoto, validateFile, type UploadResult } from "@/lib/storage-utils-fixed"
import { toast } from "sonner"

interface PhotoUploadProps {
  userId: string
  currentPhotoUrl?: string
  onPhotoChange: (photoUrl: string | null) => void
  onUploadStart?: () => void
  onUploadComplete?: (result: UploadResult) => void
  disabled?: boolean
  className?: string
}

export default function PhotoUpload({
  userId,
  currentPhotoUrl,
  onPhotoChange,
  onUploadStart,
  onUploadComplete,
  disabled = false,
  className,
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (disabled) return

      setUploadError(null)

      // Validate file
      const validation = validateFile(file)
      if (!validation.valid) {
        setUploadError(validation.error || "Invalid file")
        toast.error(validation.error || "Invalid file")
        return
      }

      // Create preview
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)

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
        const result = await uploadProductPhoto(file, userId)

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (result.success && result.url) {
          onPhotoChange(result.url)
          setPreviewUrl(result.url)
          toast.success("Photo uploaded successfully!")
        } else {
          setUploadError(result.error || "Upload failed")
          toast.error(result.error || "Upload failed")
          setPreviewUrl(currentPhotoUrl || null)
        }

        onUploadComplete?.(result)
      } catch (error: any) {
        clearInterval(progressInterval)
        const errorMessage = error.message || "Upload failed"
        setUploadError(errorMessage)
        toast.error(errorMessage)
        setPreviewUrl(currentPhotoUrl || null)
        onUploadComplete?.({ success: false, error: errorMessage })
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
        URL.revokeObjectURL(objectUrl)
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
    setPreviewUrl(null)
    setUploadError(null)
    onPhotoChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

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
          <AlertDescription>Photo uploaded successfully!</AlertDescription>
        </Alert>
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
