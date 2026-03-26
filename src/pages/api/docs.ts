/**
 * Scalar API reference docs endpoint
 * GET /api/docs — serves interactive API documentation using Scalar UI
 * Loads the OpenAPI spec from /openapi.yaml (served as static file from public/)
 */
import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = () => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Tree Identity API Docs</title>
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <script
    id="api-reference"
    data-url="/openapi.yaml"
    data-configuration='{"theme":"default","layout":"modern","defaultHttpClient":{"targetKey":"javascript","clientKey":"fetch"}}'
  ></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
