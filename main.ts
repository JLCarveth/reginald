import { render } from "@deno/gfm";

import { get, listen, serveStatic } from "./server.ts";
import { Layout } from "./templates/layout.ts";
import { LayoutData } from "./types.ts";
import { PostTemplate } from "./templates/post.ts";
import { getCachedPosts, getPost } from "./cache.ts";
import { generateRSSFeed } from "./rss.ts";

const PORT = parseInt(Deno.env.get("PORT") || "7182");
const BLOG_TITLE = Deno.env.get("BLOG_TITLE") || "Reginald Blog";
const BLOG_COPYRIGHT = Deno.env.get("BLOG_COPYRIGHT") ||
  "© 2025 John L. Carveth";
const BASE_URL = Deno.env.get("BASE_URL") || "https://blog.jlcarveth.dev";
const BLOG_DESCRIPTION = Deno.env.get("BLOG_DESCRIPTION") || "A personal blog about technology, programming, and software development";

/* Define root route that lists blog posts */
async function serveIndex() {
  const posts = await getCachedPosts();

  let content = '<div class="post-list">';

  /* Generate HTML for each post */
  for (const post of posts) {
    // Format date if available
    const formattedDate = post.publish_date
      ? new Date(post.publish_date).toISOString().split("T")[0]
      : "";

    content += `
      <div class="post-preview">
        <h2 class="post-title"><a href="post/${post.name}">${
      post.title || "Untitled"
    }</a></h2>
        <div class="post-meta">
          ${
      post.author ? `<span class="post-author">By ${post.author}</span>` : ""
    }
          ${
      formattedDate ? `<span class="post-date">${formattedDate}</span>` : ""
    }
        </div>
        <p class="post-excerpt">${post.contentPreview || ""}</p>
        <a href="post/${post.name}" class="read-more">Read more</a>
      </div>
    `;
  }

  content += "</div>";

  const data: LayoutData = {
    title: BLOG_TITLE,
    content,
    copyright: BLOG_COPYRIGHT,
    version: "0.1.0",
    scripts: [],
    stylesheets: [
      `<link rel="stylesheet" href="/css/styles.css"/>`,
    ],
  };

  return new Response(Layout(data), {
    headers: { "Content-Type": "text/html" },
  });
}

get("/", serveIndex);

get("/post/:slug", async (_req, _path, params) => {
  const slug = params?.slug;
  if (!slug) return new Response("Not Found", { status: 404 });

  const post = await getPost(slug);

  if (!post) {
    // Return a 404 response
    const data: LayoutData = {
      title: "Post Not Found | " + BLOG_TITLE,
      content:
        `<div class="error"><h1>Post Not Found</h1><p>The post "${slug}" could not be found.</p><p><a href="/">Return to home</a></p></div>`,
      copyright: BLOG_COPYRIGHT,
      version: "0.1.0",
      scripts: [],
      stylesheets: [
        `<link rel="stylesheet" href="/css/styles.css"/>`,
      ],
    };

    return new Response(Layout(data), {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Render markdown to HTML using @deno/gfm
  const htmlContent = render(post.body);

  // Use the PostTemplate to render the post
  const content = PostTemplate({
    post: {
      ...post,
      content: htmlContent, // The rendered HTML content
    },
  });

  // Create layout data
  const data: LayoutData = {
    title: post.title ? `${post.title} | ${BLOG_TITLE}` : BLOG_TITLE,
    content,
    copyright: BLOG_COPYRIGHT,
    version: "0.1.0",
    scripts: [],
    stylesheets: [
      `<link rel="stylesheet" href="/css/styles.css"/>`,
    ],
    ogTitle: post.title,
    ogDescription: post.description || post.contentPreview,
    ogImage: post.image ? (post.image.startsWith('http') ? post.image : `${Deno.env.get("BASE_URL") || ""}${post.image}`) : undefined,
    ogUrl: `${Deno.env.get("BASE_URL") || ""}post/${post.name}`,
  };

  return new Response(Layout(data), {
    headers: { "Content-Type": "text/html" },
  });
});

/* RSS Feed Route */
get("/rss.xml", async () => {
  const posts = await getCachedPosts();
  
  const rssXML = generateRSSFeed(posts, {
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    link: BASE_URL,
    language: "en-us",
    copyright: BLOG_COPYRIGHT,
    managingEditor: "john@jlcarveth.dev (John L. Carveth)",
    webMaster: "john@jlcarveth.dev (John L. Carveth)",
    lastBuildDate: new Date(),
    ttl: 60, // 60 minutes
  });

  return new Response(rssXML, {
    headers: { 
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "max-age=3600", // Cache for 1 hour
    },
  });
});

/* Add a route to manually refresh the cache */
get("/admin/refresh-cache", async () => {
  await getCachedPosts(true); // Force cache refresh
  return new Response("Cache refreshed successfully", {
    headers: { "Content-Type": "text/plain" },
  });
});

/* Serve static files */
serveStatic("/css", "static/css");
serveStatic("/js", "static/js");
serveStatic("/img", "static/img");

// Initialize the cache when the server starts
console.log("Initializing posts cache...");
await getCachedPosts();

listen(PORT);
