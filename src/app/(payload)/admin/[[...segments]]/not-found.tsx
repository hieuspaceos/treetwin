// Next.js not-found.tsx does not receive route params, so we render a minimal 404.
// Payload's admin router handles its own 404s internally.
export default function NotFound() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>404 — Page Not Found</h1>
      <p>The admin page you requested does not exist.</p>
    </div>
  )
}
