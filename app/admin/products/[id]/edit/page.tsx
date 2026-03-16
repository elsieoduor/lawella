import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Pencil } from "lucide-react"
import { ProductForm, ProductFormValues } from "@/components/product-form"
import { createAdminSupabase } from "@/lib/supabase/server"

interface Props { 
  params: Promise<{ id: string }> 
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params; // Unwrapping the promise 
  return { title: `Edit Product #${id} | Lawella Admin` }
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params; // Unwrapping the promise 
  
  const supabase = createAdminSupabase()
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !product) notFound()

  const initialValues: Partial<ProductFormValues> = {
    name:        product.name,
    category:    product.category,
    price:       String(product.price),
    description: product.description,
    emoji:       product.emoji,
    badge:       product.badge ?? "",
    sizes:       Array.isArray(product.sizes) ? product.sizes.join(",") : product.sizes,
    stock:       String(product.stock ?? 0),
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/admin" className="hover:text-brand-red transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href="/admin/products" className="hover:text-brand-red transition-colors">Products</Link>
        <span>/</span>
        <span className="text-brand-black font-medium">Edit #{id}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/products"
          className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:border-brand-red hover:text-brand-red transition-all"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-black flex items-center justify-center">
              <Pencil size={14} className="text-white" />
            </div>
            <h1 className="font-display font-black text-2xl text-brand-black">
              Edit: {product.name}
            </h1>
          </div>
          <p className="text-gray-500 text-sm mt-1 ml-10">
            Changes are saved immediately to your store.
          </p>
        </div>
      </div>

      {/* Current state badge */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-white rounded-2xl border-2 border-gray-100 px-5 py-3 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: product.colors?.[0] ?? "#C41E3A" }}
          >
            {product.emoji}
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{product.category}</div>
            <div className="font-semibold text-sm">{product.name}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border-2 border-gray-100 px-5 py-3 text-center">
          <div className="text-xs text-gray-400">Current Price</div>
          <div className="font-display font-black text-brand-red">KES {product.price.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-2xl border-2 border-gray-100 px-5 py-3 text-center">
          <div className="text-xs text-gray-400">Stock</div>
          <div className={`font-display font-black ${
            product.stock <= 5 ? "text-red-500" : product.stock <= 10 ? "text-yellow-600" : "text-green-600"
          }`}>{product.stock}</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm">
        <ProductForm
          mode="edit"
          initialValues={initialValues}
          productId={id}
        />
      </div>
    </div>
  )
}
