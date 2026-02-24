// app/api/process-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";




const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI({apiKey : GEMINI_API_KEY});
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const { imageUrl } = await req.json();

  // 1. Fetch image as base64
  const imageRes = await fetch(imageUrl);
  const buffer = await imageRes.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const mimeType = imageRes.headers.get("content-type") || "image/jpeg";
  const content = [ 
        {
        inlineData: { data: base64, mimeType }
    },
       {text:  "Describe this image in detail, focusing on visual features, colors, shapes, objects, and style."}


  ]

  // 2. Send to Gemini to extract features/description
  
  const result = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: content
});
const description = result.text

const embeddingResult = await genAI.models.embedContent({
  model: 'text-embedding-004',
  contents: description!,
});
const embedding = embeddingResult.embeddings![0].values; 

  // 4. Store in Convex
  await convex.mutation(api.images.storeImage, {
    imageUrl,
    description: description ?? '',
    embedding: embedding ?? [],
  });

  return NextResponse.json({ success: true });
}