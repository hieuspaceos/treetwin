/** Clone section log stats — view missing patterns + clone stats */
import type { APIRoute } from 'astro'
import { getTopMissingSections, getCloneStats } from '@/lib/admin/clone-section-logger'

export const GET: APIRoute = async () => {
  const stats = getCloneStats()
  const topMissing = getTopMissingSections(15)
  return new Response(JSON.stringify({ stats, topMissing }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
