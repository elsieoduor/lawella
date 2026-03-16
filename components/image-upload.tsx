"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Upload, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface ImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  className?: string
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    // 1. Validation
    if (!file.type.startsWith("image/")) { 
      setError("Only image files are allowed."); 
      return 
    }
    if (file.size > 5 * 1024 * 1024) { 
      setError("Image must be under 5 MB."); 
      return 
    }
    
    setError("")
    setUploading(true)

    try {
      const supabase = createClient()
      const ext = file.name.split(".").pop() ?? "jpg"
      // Use a clean path: folder/timestamp-random.ext
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const filePath = `products/${filename}`

      // 2. Upload - Ensure the bucket name 'product-images' exists in Supabase
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, { 
          upsert: false, 
          contentType: file.type,
          cacheControl: '3600' 
        })

      if (uploadError) throw uploadError

      // 3. Get Public URL
      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath)

      onChange(data.publicUrl)
    } catch (err: any) {
      console.error("Upload error:", err)
      setError(err.message || "Upload failed. Check RLS policies.")
    } finally {
      setUploading(false)
      // Reset input value so the same file can be re-uploaded if deleted
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const handleRemove = async () => {
    if (!value) return
    try {
      // Logic to extract the path correctly from the URL
      const urlParts = value.split("/product-images/")
      const path = urlParts[1]
      
      if (path) {
        const supabase = createClient()
        await supabase.storage.from("product-images").remove([path])
      }
    } catch (err) {
      console.error("Delete error:", err)
    }
    onChange(null)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {value ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-brand-red/20 group bg-brand-cream aspect-square max-w-50">
          <Image 
            src={value} 
            alt="Product" 
            fill 
            className="object-cover" 
            unoptimized // Useful if Supabase is serving large images directly
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
            className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600 z-10"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-brand-red/30 rounded-2xl p-8 text-center cursor-pointer hover:border-brand-red/60 hover:bg-brand-red-light/10 transition-all group"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={28} className="text-brand-red animate-spin" />
              <p className="text-sm text-gray-500 font-medium">Processing...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-cream border-2 border-brand-red/20 flex items-center justify-center group-hover:bg-brand-red-light transition-colors">
                <Upload size={20} className="text-brand-red" />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-black">Upload Product Photo</p>
                <p className="text-xs text-gray-400 mt-0.5">Recommended: Square (1:1)</p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500 font-medium">⚠️ {error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />
    </div>
  )
}