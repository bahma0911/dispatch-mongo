interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  API_ORIGIN?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      const origin = (env.API_ORIGIN || 'https://dispatch-mongo.onrender.com').replace(/\/$/, '');
      const target = new URL(`${origin}${url.pathname}`);
      target.search = url.search;
      return fetch(new Request(target, request));
    }

    return env.ASSETS.fetch(request);
  }
};