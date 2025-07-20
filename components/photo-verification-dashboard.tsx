"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, ImageIcon, Database, Loader2 } from "lucide-react"
import { verifyPhotoAssociations, type PhotoVerificationResult } from "@/lib/photo-verification"
import { toast } from "sonner"

export default function PhotoVerificationDashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const [verificationResult, setVerificationResult] = useState<PhotoVerificationResult | null>(null)

  const runVerification = async () => {
    setIsLoading(true)
    try {
      const result = await verifyPhotoAssociations()
      setVerificationResult(result)

      if (result.productsWithoutPhotos > 0) {
        toast.warning(`Found ${result.productsWithoutPhotos} products without photos`)
      } else {
        toast.success("All products have photos!")
      }
    } catch (error) {
      toast.error("Failed to verify photo associations")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    runVerification()
  }, [])

  const getPhotoSuccessRate = () => {
    if (!verificationResult || verificationResult.totalProducts === 0) return 0
    return Math.round((verificationResult.productsWithPhotos / verificationResult.totalProducts) * 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Photo Association Verification</h2>
        <Button onClick={runVerification} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {isLoading ? "Checking..." : "Refresh"}
        </Button>
      </div>

      {verificationResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Products */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{verificationResult.totalProducts}</p>
                </div>
                <Database className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Products with Photos */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">With Photos</p>
                  <p className="text-2xl font-bold text-green-600">{verificationResult.productsWithPhotos}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* Products without Photos */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Without Photos</p>
                  <p className="text-2xl font-bold text-red-600">{verificationResult.productsWithoutPhotos}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          {/* Success Rate */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{getPhotoSuccessRate()}%</p>
                </div>
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <Progress value={getPhotoSuccessRate()} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Issues Alert */}
      {verificationResult &&
        (verificationResult.productsWithoutPhotos > 0 || verificationResult.invalidPhotoUrls > 0) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {verificationResult.productsWithoutPhotos > 0 && (
                  <p>• {verificationResult.productsWithoutPhotos} products are missing photo URLs</p>
                )}
                {verificationResult.invalidPhotoUrls > 0 && (
                  <p>• {verificationResult.invalidPhotoUrls} products have invalid photo URLs</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

      {/* Photo URL Patterns */}
      {verificationResult && Object.keys(verificationResult.photoUrlPatterns).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Photo URL Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(verificationResult.photoUrlPatterns).map(([domain, count]) => (
                <div key={domain} className="flex items-center justify-between">
                  <span className="text-sm">{domain}</span>
                  <Badge variant="outline">{count} photos</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Products */}
      {verificationResult && verificationResult.recentProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {verificationResult.recentProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(product.inserted_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {product.photo_url ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Has Photo
                      </Badge>
                    ) : (
                      <Badge variant="destructive">No Photo</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
