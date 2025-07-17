import { Post } from "./types.ts";

interface RSSFeedOptions {
  title: string;
  description: string;
  link: string;
  language?: string;
  copyright?: string;
  managingEditor?: string;
  webMaster?: string;
  lastBuildDate?: Date;
  ttl?: number;
}

interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  guid: string;
  author?: string;
}

export function generateRSSFeed(posts: Post[], options: RSSFeedOptions): string {
  const { title, description, link, language = "en-us", copyright, managingEditor, webMaster, lastBuildDate, ttl } = options;
  
  // Convert posts to RSS items
  const rssItems: RSSItem[] = posts
    .filter(post => post.publish_date) // Only include published posts
    .map(post => ({
      title: post.title || "Untitled",
      description: post.description || post.contentPreview || "",
      link: `${link}/post/${post.name}`,
      pubDate: new Date(post.publish_date!),
      guid: `${link}/post/${post.name}`,
      author: post.author || managingEditor || "",
    }));

  // Sort items by publication date (newest first)
  rssItems.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  // Generate RSS XML
  const rssXML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXML(title)}</title>
    <description>${escapeXML(description)}</description>
    <link>${escapeXML(link)}</link>
    <language>${language}</language>
    <lastBuildDate>${(lastBuildDate || new Date()).toUTCString()}</lastBuildDate>
    <generator>Reginald Blog</generator>
    ${copyright ? `<copyright>${escapeXML(copyright)}</copyright>` : ''}
    ${managingEditor ? `<managingEditor>${escapeXML(managingEditor)}</managingEditor>` : ''}
    ${webMaster ? `<webMaster>${escapeXML(webMaster)}</webMaster>` : ''}
    ${ttl ? `<ttl>${ttl}</ttl>` : ''}
    ${rssItems.map(item => `
    <item>
      <title>${escapeXML(item.title)}</title>
      <description>${escapeXML(item.description)}</description>
      <link>${escapeXML(item.link)}</link>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
      <guid isPermaLink="true">${escapeXML(item.guid)}</guid>
      ${item.author ? `<author>${escapeXML(item.author)}</author>` : ''}
    </item>`).join('')}
  </channel>
</rss>`;

  return rssXML;
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}