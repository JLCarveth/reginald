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
`;
}
