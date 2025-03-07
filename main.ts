import { extract } from "@std/front-matter/any";

import { get, listen, serveStatic } from "./server.ts";
import { Layout } from "./templates/layout.ts";
import { LayoutData, Post } from "./types.ts";
import { PostTemplate } from "./templates/post.ts";
import { render } from "@deno/gfm";

const PORT = parseInt(Deno.env.get("PORT") ?? "7182");
const BLOG_TITLE = Deno.env.get("BLOG_TITLE");
const BLOG_COPYRIGHT = Deno.env.get("BLOG_COPYRIGHT") ??
  "©️ 2025 John L. Carveth";

/* Define root route that lists blog posts */
async function serveIndex() {
  const posts: Post[] = [];
  for await (const entry of Deno.readDir("posts/")) {
    console.log(JSON.stringify(entry));
    posts.push({
      name: entry.name,
    });
  }

  let content = '<div class="post-list">';
  
  /* Fetch frontmatter and content preview for each post */
  for (const post of posts) {
    const text = await Deno.readTextFile(`posts/${post.name}`);
    const { attrs, body } = extract(text);
    Object.assign(post, attrs);
    
    // Create a preview of the content (first 150 characters)
    const contentPreview = body
      .replace(/---[\s\S]*?---/, '') // Remove frontmatter if still present
      .replace(/[#*`\[\]]/g, '')     // Remove markdown syntax
      .trim()
      .slice(0, 150) + (body.length > 150 ? '...' : '');
    
    // Format date if available
    const formattedDate = post.publish_date 
      ? new Date(post.publish_date).toISOString().split('T')[0]
      : '';
    
    content += `
      <div class="post-preview">
        <h2 class="post-title"><a href="/${post.name}">${post.title || 'Untitled'}</a></h2>
        <div class="post-meta">
          ${post.author ? `<span class="post-author">By ${post.author}</span>` : ''}
          ${formattedDate ? `<span class="post-date">${formattedDate}</span>` : ''}
        </div>
        <p class="post-excerpt">${contentPreview}</p>
        <a href="/${post.name}" class="read-more">Read more</a>
      </div>
    `;
  }
  
  content += '</div>';

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
get("/:slug", async (_req, _path, params) => {
  const slug = params?.slug;
  try {
    // Attempt to read the post file
    const text = await Deno.readTextFile(`posts/${slug}`);

    // Extract frontmatter and content
    const { attrs, body } = extract(text);

    // Render markdown to HTML using @deno/gfm
    const htmlContent = render(body);

    // Create a post object with all the needed properties
    const post: Post = {
      name: slug,
      content: htmlContent, // The rendered HTML content
      ...attrs, // Spread all frontmatter attributes (title, date, author, etc.)
    };

    // Use the PostTemplate to render the post
    const content = PostTemplate({ post });

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
    };

    return new Response(Layout(data), {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error(`Error serving post '${slug}':`, error);

    // Return a 404 response
    const data: LayoutData = {
      title: "Post Not Found | " + BLOG_TITLE,
      content:
        `<div class="error"><h1>Post Not Found</h1><p>The post "${slug}" could not be found.</p><p><a href="/">Return to home</a></p></div>`,
      copyright: BLOG_COPYRIGHT,
      version: "0.1.0",
      scripts: [],
    };

    return new Response(Layout(data), {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
  }
});

/* Serve static files */
serveStatic("/css", "static/css");
serveStatic("/js", "static/js");

listen(PORT);
