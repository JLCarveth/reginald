import { LayoutData } from "../types.ts";
import Footer from "./Footer.ts";
import Navbar from "./Navbar.ts";

const PLAUSIBLE_DOMAIN = Deno.env.get("PLAUSIBLE_DOMAIN");
const PLAUSIBLE_URL = Deno.env.get("PLAUSIBLE_URL");

const plausibleScript = () => {
  if (PLAUSIBLE_DOMAIN && PLAUSIBLE_URL) {
    return `<script defer data-domain="blog.jlcarveth.dev" src="https://stats.jlcarveth.dev/js/script.js"></script>`;
  } else return "";
};

export function Layout(data: LayoutData) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <title>${data.title ? data.title : "Blog"}</title>
    <meta name="viewport" content="width=devicewidth, initial-scale=1">
    <meta charset="utf8">
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
