// app/api/process-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const { storageId } = await req.json(); 


  const imageUrl = await convex.query(api.images.getImageUrl, { storageId });
  if (!imageUrl) return NextResponse.json({ error: "Image not found" }, { status: 404 });

  const imageRes = await fetch(imageUrl);
  const buffer = await imageRes.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const mimeType = imageRes.headers.get("content-type") || "image/jpeg";

  // 3. Send to Gemini for description
  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { inlineData: { data: base64, mimeType } },
      { text: "Describe this image in detail, focusing on visual features, colors, shapes, objects, and style. keep it short" },
    ],
  });
  const description = result.text ?? "";

  
  const embeddingResult = await genAI.models.embedContent({
    model: "gemini-embedding-001",
    contents: description,
  });
  const embedding = embeddingResult.embeddings![0].values ?? [];

  await convex.mutation(api.images.storeImage, {
    storageId,
    description,
    embedding,
  });

  return NextResponse.json({ success: true });
}