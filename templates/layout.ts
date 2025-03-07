import { LayoutData } from "../types.ts";
import Footer from "./Footer.ts";
import Navbar from "./Navbar.ts";

export function Layout(data: LayoutData) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <title>${data.title ? data.title : "Blog"}</title>
    <meta name="viewport" content="width=devicewidth, initial-scale=1">
    <meta charset="utf8">
    <script defer data-domain="blog.jlcarveth.dev" src="https://stats.jlcarveth.dev/js/script.js"></script>
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
