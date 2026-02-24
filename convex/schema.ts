import {defineSchema, defineTable} from  'convex/server'

import { v } from 'convex/values'

export default defineSchema({ 
    images: defineTable({ 
    imageUrl: v.string(),  // camelCase to match
    description: v.string(), 
    embedding: v.array(v.float64()), 
}).vectorIndex("by_embedding", { 
        vectorField: "embedding", 
        dimensions: 768,
    })
})