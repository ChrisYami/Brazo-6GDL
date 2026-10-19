// Cloudflare Pages Function: /api/repo?path=carpeta/archivo.pdf
// Variables: GITHUB_TOKEN, GITHUB_REPO (usuario/repo), ADMIN_PASSWORD, GITHUB_BRANCH (opcional)
export async function onRequest({ request, env }) {
  const path = (new URL(request.url).searchParams.get("path") || "").replace(/\.\./g, "").replace(/^\/+/, "");
  const branch = env.GITHUB_BRANCH || "main";
  const h = { Authorization: `Bearer ${env.GITHUB_TOKEN}`, "User-Agent": "brazo-6gdl", Accept: "application/vnd.github+json" };
  const api = `https://api.github.com/repos/${env.GITHUB_REPO}/contents/${encodeURI(path)}`;
  const out = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json" } });

  if (request.method === "GET") {
    const r = await fetch(`${api}?ref=${branch}`, { headers: h });
    return out(await r.json(), r.status);
  }
  if (request.headers.get("x-admin-key") !== env.ADMIN_PASSWORD) return out({ message: "Clave incorrecta" }, 401);
  if (!path) return out({ message: "Falta la ruta" }, 400);

  const cur = await fetch(`${api}?ref=${branch}`, { headers: h });
  const sha = cur.ok ? (await cur.json()).sha : undefined;

  if (request.method === "PUT") {
    const { content } = await request.json();
    const r = await fetch(api, { method: "PUT", headers: h, body: JSON.stringify({ message: `docs: subir ${path}`, content, sha, branch }) });
    return out(await r.json(), r.status);
  }
  if (request.method === "DELETE") {
    if (!sha) return out({ message: "El archivo no existe" }, 404);
    const r = await fetch(api, { method: "DELETE", headers: h, body: JSON.stringify({ message: `docs: eliminar ${path}`, sha, branch }) });
    return out(await r.json(), r.status);
  }
  return out({ message: "Método no permitido" }, 405);
}
