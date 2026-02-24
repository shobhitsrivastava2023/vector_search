// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  const embeddingResult = await genAI.models.embedContent({
    model: "gemini-embedding-001",
    contents: query,
  });

  const embedding = embeddingResult.embeddings![0].values ?? [];
  return NextResponse.json({ embedding });
}