export type RouteHandler = (
  req: Request,
  path: URLPattern,
  params?: Record<string, string | undefined>,
) => Promise<Response> | Response;

export interface Route {
  path: URLPattern;
  action: string;
  handler: RouteHandler;
}

export type LayoutData = {
  title?: string;
  content?: string;
  version?: string;
  scripts?: string[];
  stylesheets?: string[];
  copyright: string;
};

export type Post = {
  name: string;
  title?: string;
  publish_date?: string;
  author?: string;
  content?: string;
  contentPreview?: string;
  body?: string; // Raw markdown content
}
