import { LayoutData } from "../types.ts";
import Footer from "./Footer.ts";
import Navbar from "./Navbar.ts";

const PLAUSIBLE_DOMAIN = Deno.env.get("PLAUSIBLE_DOMAIN");
const PLAUSIBLE_URL = Deno.env.get("PLAUSIBLE_URL");

const plausibleScript = () => {
  if (PLAUSIBLE_DOMAIN && PLAUSIBLE_URL) {
    return `<script defer data-domain="${PLAUSIBLE_DOMAIN}" src="${PLAUSIBLE_URL}"></script>`;
  } else return "";
};

export function Layout(data: LayoutData) {
  const ogTitle = data.ogTitle || data.title || "Blog";
  const ogDescription = data.ogDescription || "A blog by John L. Carveth";
  const ogUrl = data.ogUrl || "";
  const ogImage = data.ogImage || "";

  return `
<!DOCTYPE html>
<html>
  <head>
    <title>${data.title ? data.title : "Blog"}</title>
    <meta name="viewport" content="width=devicewidth, initial-scale=1">
    <meta charset="utf8">
    
    <!-- Open Graph meta tags -->
    <meta property="og:title" content="${ogTitle}">
    <meta property="og:description" content="${ogDescription}">
    <meta property="og:type" content="website">
    ${ogUrl ? `<meta property="og:url" content="${ogUrl}">` : ''}
    ${ogImage ? `<meta property="og:image" content="${ogImage}">` : ''}
    
    <!-- Twitter Card meta tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${ogTitle}">
    <meta name="twitter:description" content="${ogDescription}">
    ${ogImage ? `<meta name="twitter:image" content="${ogImage}">` : ''}
    
    ${plausibleScript()}
    ${data.stylesheets?.join("\n") ?? ""}
  </head>
  <body>
    <main style="flex-grow:1">
      ${Navbar()}
      ${data.content}
    </main>
    ${Footer({ copyright: data.copyright })}
    ${data.scripts?.join("\n") ?? ""}
  </body>
</html>
  `;
}
