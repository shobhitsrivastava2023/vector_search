// convex/images.ts
import { mutation, action} from "./_generated/server";
import { v } from "convex/values";

export const storeImage = mutation({
  args: {
    imageUrl: v.string(),
    description: v.string(),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("images", {
      imageUrl: args.imageUrl,
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