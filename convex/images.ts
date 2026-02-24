// convex/images.ts
import { mutation, action, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const storeImage = mutation({
  args: {
    storageId: v.id("_storage"),
    description: v.string(),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    const imageUrl = await ctx.storage.getUrl(args.storageId);

    await ctx.db.insert("images", {
      storageId: args.storageId,
      imageUrl: imageUrl!,
      description: args.description,
      embedding: args.embedding,
    });
  },
});


export const getAllImages = query({
  handler: async (ctx) => {
    return await ctx.db.query("images").collect();
  },
});


// ✅ FIXED VERSION
export const searchSimilarImages = action({
  args: { embedding: v.array(v.float64()) },

  handler: async (
    ctx,
    args
  ): Promise<(Doc<"images"> & { score: number })[]> => {
    
    const results = await ctx.vectorSearch("images", "by_embedding", {
      vector: args.embedding,
      limit: 20,
    });

    const images: (Doc<"images"> | null)[] = await Promise.all(
      results.map((r) =>
        ctx.runQuery(internal.imagehelpers.getById, {
          id: r._id,
        })
      )
    );

    return images
      .filter((img): img is Doc<"images"> => img !== null)
      .map((img, i) => ({
        ...img,
        score: results[i]._score,
      }));
  },
});