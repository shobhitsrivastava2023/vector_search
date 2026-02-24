import { internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

export const getById = internalQuery({
  args: { id: v.id("images") },

  handler: async (ctx, args): Promise<Doc<"images"> | null> => {
    return await ctx.db.get(args.id);
  },
});