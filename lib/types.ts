export interface Product {
  id: number
  name: string
  category: string
  price: number
  badge?: string
  emoji: string
  desc: string           // storefront alias of `description` from DB
  description?: string   // DB column name
  colors: string[]
  sizes: string[]
  stock?: number
  image_url?: string | null
  is_active?: boolean
  created_at?: string
}

export interface CartItem extends Product {
  qty: number
  selectedSize: string
}

export interface Category {
  key: string
  label: string
  emoji: string
}

export interface Order {
  id: string
  order_number?: string
  customer_name: string
  customer_email?: string | null
  customer_phone: string
  delivery_address: string
  delivery_city?: string | null
  notes?: string | null
  subtotal?: number
  delivery_fee?: number
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  payment_method: "mpesa" | "cash" | "bank"
  payment_status?: "unpaid" | "paid" | "failed" | "refunded"
  created_at?: string
  updated_at?: string
  order_date: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: number
  order_id: string
  product_id?: number | null
  product_name: string
  product_emoji: string
  size?: string | null
  qty: number
  unit_price: number
  line_total: number
}

export interface Customer {
  phone: string
  name: string
  email?: string | null
  order_count: number
  total_spent: number
  last_order_at: string
  first_order_at: string
}

export interface StoreSettings {
  store_name: string
  store_email: string
  whatsapp_number: string
  bank_name: string
  bank_account_name: string
  bank_account_number: string
  bank_branch: string
  bank_swift: string
  delivery_fee: number
  free_delivery_threshold: number
  delivery_note: string
  instagram_url: string
  facebook_url: string
}
