// convex/images.ts
import { mutation, action, query} from "./_generated/server";
import { v } from "convex/values";


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
    // ❌ no imageUrl here
  },
  handler: async (ctx, args) => {
    const imageUrl = await ctx.storage.getUrl(args.storageId); // ✅ resolve it here
    await ctx.db.insert("images", {
      storageId: args.storageId,
      imageUrl: imageUrl!,
      description: args.description,
      embedding: args.embedding,
    });
  },
});

export const searchSimilarImages = action({
  args: { embedding: v.array(v.float64()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const results = await ctx.vectorSearch("images", "by_embedding", {
      vector: args.embedding,
      limit: args.limit ?? 5,
    });
    return results;
  },
});