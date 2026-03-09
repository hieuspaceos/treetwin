import { ImageResponse } from '@vercel/og'
import { siteConfig } from '@/config/site-config'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title')?.slice(0, 100) || siteConfig.name
  const desc = searchParams.get('desc')?.slice(0, 200) || siteConfig.description

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          padding: '48px',
          background: siteConfig.theme.primaryColor,
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <h1 style={{ fontSize: 60, margin: 0, lineHeight: 1.1 }}>{title}</h1>
        <p style={{ fontSize: 28, opacity: 0.8, marginTop: 16 }}>{desc}</p>
        <p style={{ fontSize: 20, opacity: 0.5, marginTop: 'auto' }}>{siteConfig.name}</p>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
