// cache.ts
import { extract } from "@std/front-matter/any";
import { Post } from "./types.ts";

// The cache of all blog posts
let postsCache: Post[] = [];
let lastCacheUpdate = 0;
const CACHE_TTL = 60 * 1000; // 1 minute in milliseconds

/**
 * Load all posts from the posts directory
 */
export async function loadPosts(): Promise<Post[]> {
  const posts: Post[] = [];
  
  try {
    for await (const entry of Deno.readDir("posts/")) {
      if (!entry.isFile || !entry.name.endsWith('.md')) continue;
      
      try {
        const text = await Deno.readTextFile(`posts/${entry.name}`);
        const { attrs, body } = extract(text);
        
        // Create a preview of the content (first 150 characters)
        const contentPreview = body
          .replace(/---[\s\S]*?---/, '') // Remove frontmatter if still present
          .replace(/[#*`\[\]]/g, '')     // Remove markdown syntax
          .trim()
          .slice(0, 150) + (body.length > 150 ? '...' : '');
        
        posts.push({
          name: entry.name,
          contentPreview,
          ...attrs,
        });
      } catch (err) {
        console.error(`Error loading post ${entry.name}:`, err);
      }
    }
    
    // Sort posts by publish date (newest first)
    return posts.sort((a, b) => {
      const dateA = a.publish_date ? new Date(a.publish_date).getTime() : 0;
      const dateB = b.publish_date ? new Date(b.publish_date).getTime() : 0;
      return dateB - dateA;
    });
  } catch (err) {
    console.error("Error loading posts:", err);
    return [];
  }
}

/**
 * Get all cached posts, refreshing the cache if needed
 */
export async function getCachedPosts(forceRefresh = false): Promise<Post[]> {
  const now = Date.now();
  
  // Check if we need to refresh the cache
  if (forceRefresh || postsCache.length === 0 || now - lastCacheUpdate > CACHE_TTL) {
    postsCache = await loadPosts();
    lastCacheUpdate = now;
    console.log(`Posts cache refreshed at ${new Date().toISOString()}`);
  }
  
  return postsCache;
}

/**
 * Get a single post by slug (filename)
 */
export async function getPost(slug: string): Promise<Post | null> {
  try {
    // Read the post file
    const text = await Deno.readTextFile(`posts/${slug}`);
    
    // Extract frontmatter and content
    const { attrs, body } = extract(text);
    
    // Return the post object
    return {
      name: slug,
      body, // Store the raw markdown body
      ...attrs,
    };
  } catch (err) {
    console.error(`Error reading post '${slug}':`, err);
    return null;
  }
}
