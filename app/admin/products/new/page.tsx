import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"
import { ProductForm } from "@/components/product-form"

export const metadata = { title: "Add Product | Lawella Admin" }

export default function NewProductPage() {
  return (
    <div className="p-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/admin" className="hover:text-brand-red transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href="/admin/products" className="hover:text-brand-red transition-colors">Products</Link>
        <span>/</span>
        <span className="text-brand-black font-medium">New Product</span>
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
            <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center">
              <Plus size={16} className="text-white" />
            </div>
            <h1 className="font-display font-black text-2xl text-brand-black">Add New Product</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1 ml-10">
            Fill in the details below to add a product to your store.
          </p>
        </div>
      </div>

      {/* Tip banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 mb-8 flex gap-3">
        <span className="text-blue-500 text-lg shrink-0">💡</span>
        <div className="text-sm text-blue-700">
          <strong>Tip:</strong> Use a descriptive name and a clear description — customers see
          exactly what you write here on the product page. Stock alerts turn yellow at 10 and
          red at 5 so you always know when to restock.
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm">
        <ProductForm mode="create" />
      </div>
    </div>
  )
}
