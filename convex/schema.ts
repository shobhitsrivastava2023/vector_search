import {defineSchema, defineTable} from  'convex/server'

import { v } from 'convex/values'

// convex/schema.ts

export default defineSchema({ 
images: defineTable({
  storageId: v.id("_storage"),
  imageUrl: v.string(),
  description: v.optional(v.string()),       
  embedding: v.optional(v.array(v.float64())), 
}).vectorIndex("by_embedding", {
  vectorField: "embedding",
  dimensions: 3072,
})
})

