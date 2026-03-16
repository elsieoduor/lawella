import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = createAdminSupabase();
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 1. Clean the filename
    const fileExt = file.name.split(".").pop();
    // Unique name to prevent collisions
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    // Use a 'public' or 'products' folder inside your bucket
    const filePath = `products/${fileName}`;

    // 2. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("product-images") 
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // 3. Get the Public URL
    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error("Failed to generate public URL");
    }

    return NextResponse.json({ url: data.publicUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}