import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabase } from "@/lib/supabase/server"

const SETTINGS_ID = 1

export async function GET() {
  const supabase = createAdminSupabase()
  
  // Next.js 15: Always fetch fresh data for admin settings
  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("id", SETTINGS_ID)
    .single()

  if (error || !data) {
    return NextResponse.json({
      store_name: "Lawella",
      store_email: "",
      whatsapp_number: "254700000000",
      bank_name: "",
      bank_account_name: "Lawella",
      bank_account_number: "",
      bank_branch: "",
      bank_swift: "",
      delivery_fee: 300,
      free_delivery_threshold: 5000,
      delivery_note: "Delivery within Nairobi 1-2 days, rest of Kenya 3-5 days.",
      instagram_url: "",
      facebook_url: "",
    })
  }

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = createAdminSupabase()
  try {
    const body = await req.json()
    
    // Remove ID from body if it exists to prevent manual overwrites, 
    // then force it to SETTINGS_ID
    const { id, ...settingsData } = body

    const { data, error } = await supabase
      .from("store_settings")
      .upsert({ id: SETTINGS_ID, ...settingsData })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}