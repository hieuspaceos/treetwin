import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/** Health check endpoint. DELETE after confirming site works. */
export async function GET() {
  try {
    const payload = await getPayload({ config })
    const users = await payload.find({ collection: 'users', limit: 1 })
    return NextResponse.json({ success: true, usersCount: users.totalDocs })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
