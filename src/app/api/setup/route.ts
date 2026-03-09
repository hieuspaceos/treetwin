import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * One-time setup endpoint that explicitly calls drizzle-kit push
 * to create all DB tables. DELETE THIS FILE after setup succeeds.
 */
export const maxDuration = 60

export async function GET() {
  const logs: string[] = []

  try {
    logs.push('1. Initializing Payload...')
    const payload = await getPayload({ config })

    // Access adapter internals to call push explicitly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = payload.db as any

    logs.push('2. Loading drizzle-kit via requireDrizzleKit...')
    const drizzleKit = await db.requireDrizzleKit()

    logs.push(`3. drizzle-kit loaded. Available: ${Object.keys(drizzleKit).join(', ')}`)

    if (drizzleKit.pushSchema) {
      logs.push('4. Calling pushSchema...')
      await drizzleKit.pushSchema(db.schema, db.drizzle)
      logs.push('5. pushSchema completed')
    } else if (drizzleKit.push) {
      logs.push('4. Calling push...')
      await drizzleKit.push(db.schema, db.drizzle)
      logs.push('5. push completed')
    } else {
      logs.push('4. No push/pushSchema found, trying migrate...')
      await payload.db.migrate()
      logs.push('5. migrate completed')
    }

    // Verify
    logs.push('6. Verifying tables...')
    const users = await payload.find({ collection: 'users', limit: 1 })
    logs.push('7. Success!')

    return NextResponse.json({
      success: true,
      usersCount: users.totalDocs,
      logs,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        logs,
      },
      { status: 500 },
    )
  }
}
