interface PagesFunctionContext {
  request: Request;
  env: { API_ORIGIN?: string };
  params: { path?: string[] };
}

export async function onRequest({ request, env, params }: PagesFunctionContext): Promise<Response> {
  const origin = (env.API_ORIGIN || 'https://dispatch-mongo.onrender.com').replace(/\/$/, '');

  const path = Array.isArray(params.path) ? params.path.join('/') : '';
  const target = new URL(`${origin}/api/${path}`);
  target.search = new URL(request.url).search;

  return fetch(new Request(target, request));
}