/**
 * Zippy - Minimal Web Server
 *
 *  This was made for fun, should probably not be used for serious production workloads.
 *  - John L. Carveth
 */
import { Route, RouteHandler } from "./types.ts";
import { resolve, extname, SEPARATOR } from "@std/path";

const routes: Route[] = [];
const DEBUG = Deno.env.get("DEBUG") === "true";

// Map file extensions to MIME types
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
  ".pdf": "application/pdf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};

/**
 * Call this function to start the server.
 * @param port The port the server will listen to
 */
export async function listen(port: number) {
  if (DEBUG) console.log(`Now listening on localhost:${port}/`);
  
  await Deno.serve({ port }, handleRequest).finished;
}

/**
 * Handles incoming HTTP requests
 */
function handleRequest(request: Request): Response {
  const method = request.method;
  const url = request.url;
  
  if (DEBUG) {
    console.log(`${method}-${url}`);
  }
  
  /* Iterate through registered routes for a match */
  for (const route of routes) {
    if (route.action === method && route.path.test(url)) {
      const match = route.path.exec(url);
      const params = match?.pathname.groups;
      
      /* Pass off the request info, params to the registered handler */
      return route.handler(request, route.path, params);
    }
  }
  
  // Return 404 if no routes match
  return new Response("Not Found", { status: 404 });
}

/**
 * Assigns a new GET route to the web server.
 */
export function get(path: string, handler: RouteHandler) {
  const urlPattern = new URLPattern({ pathname: path });
  routes.push({ path: urlPattern, action: "GET", handler });
}

/**
 *  Assigns a new POST route to the web server.
 */
export function post(path: string, handler: RouteHandler) {
  const urlPattern = new URLPattern({ pathname: path });
  routes.push({ path: urlPattern, action: "POST", handler });
}

/** 
 * Assign a new route to the web server.
 */
export function addRoute(path: string, action: string, handler: RouteHandler) {
  const urlPattern = new URLPattern({ pathname: path });
  routes.push({ path: urlPattern, action, handler });
}

/**
 * Configures static file serving for a specific directory
 * @param urlPath The URL path to serve files from (e.g., "/static")
 * @param fsPath The filesystem path to serve files from (e.g., "./static")
 * @param options Configuration options
 */
export function serveStatic(
  urlPath: string, 
  fsPath: string,
  options: {
    index?: string;                  // Default index file (e.g., "index.html")
    allowedExtensions?: string[];    // List of allowed extensions (if empty, all are allowed)
    cache?: boolean;                 // Whether to add cache headers
    cacheDuration?: number;          // Cache duration in seconds
  } = {}
) {
  // Set default options
  const opts = {
    index: "index.html",
    allowedExtensions: [],
    cache: true,
    cacheDuration: 86400, // 1 day by default
    ...options
  };

  get(`${urlPath}/*`, async (_req, _path, params) => {
    if (!params) return new Response("Bad Request", { status: 400 });
    
    // Handle root path requests with index file
    let filePath = params[0] === "" ? opts.index : params[0];
    const fullPath = `${fsPath}/${filePath}`;
    const resolvedPath = resolve(Deno.cwd(), fullPath);
    
    // Security check: ensure path is within the specified directory
    if (!resolvedPath.startsWith(`${Deno.cwd()}${SEPARATOR}${fsPath}`)) {
      return new Response("Forbidden", { status: 403 });
    }
    
    // Extension check if allowedExtensions is specified
    const ext = extname(resolvedPath);
    if (opts.allowedExtensions.length > 0 && !opts.allowedExtensions.includes(ext)) {
      return new Response("Forbidden", { status: 403 });
    }
    
    // Check if file exists
    try {
      const stat = await Deno.lstat(resolvedPath);
      
      // If it's a directory and index option is set, try to serve the index file
      if (stat.isDirectory && opts.index) {
        const indexPath = `${resolvedPath}${SEP}${opts.index}`;
        try {
          await Deno.lstat(indexPath);
          // Update our paths to serve the index file
          filePath = `${filePath}/${opts.index}`;
        } catch {
          return new Response("Not Found", { status: 404 });
        }
      }
    } catch {
      return new Response("Not Found", { status: 404 });
    }
    
    // Determine content type
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    
    // Set response headers
    const headers = new Headers({
      "Content-Type": contentType,
    });
    
    // Add cache headers if enabled
    if (opts.cache) {
      headers.set("Cache-Control", `max-age=${opts.cacheDuration}`);
    }
    
    try {
      // Serve the file
      let fileContent;
      // Use text for certain file types, binary for others
      if (/^(text\/|application\/json|application\/javascript)/.test(contentType)) {
        fileContent = await Deno.readTextFile(resolvedPath);
      } else {
        fileContent = await Deno.readFile(resolvedPath);
      }
      
      return new Response(fileContent, { headers });
    } catch (err) {
      if (DEBUG) console.error(`Error serving static file: ${err}`);
      return new Response("Server Error", { status: 500 });
    }
  });
}
