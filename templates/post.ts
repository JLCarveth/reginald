import { Post } from "../types.ts";

export type PostTemplateProps = {
  post: Post;
}

export function PostTemplate({ post }: PostTemplateProps) {
  const date = post.publish_date ? new Date(post.publish_date).toISOString().split("T")[0] : null;
  
  return `
<article class="blog-post">
  <header>
    <h1>${post.title}</h1>
    ${date ? `<time datetime="${post.publish_date}">${date}</time>` : ''}
    ${post.author ? `<div class="author">By ${post.author}</div>` : ''}
  </header>
  <div class="post-content markdown-body">
    ${post.content}
  </div>
</article>

<section class="comments">
  <script src="https://giscus.app/client.js"
          data-repo="jlcarveth/reginald"
          data-repo-id="R_kgDOOGMXjg"
          data-category="General"
          data-category-id="DIC_kwDOOGMXjs4Cs-5W"
          data-mapping="og:title"
          data-strict="0"
          data-reactions-enabled="1"
          data-emit-metadata="0"
          data-input-position="top"
          data-theme="preferred_color_scheme"
          data-lang="en"
          data-loading="lazy"
          crossorigin="anonymous"
          async>
  </script>
</section>
`;
}
