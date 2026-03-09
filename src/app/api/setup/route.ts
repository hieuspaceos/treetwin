import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * One-time setup endpoint that triggers Payload initialization
 * which runs db.push() to create all tables in the database.
 * DELETE THIS FILE after tables are created successfully.
 */
export async function GET() {
  try {
    const payload = await getPayload({ config })

    // Verify tables exist by querying users count
    const users = await payload.find({ collection: 'users', limit: 1 })

    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully',
      usersCount: users.totalDocs,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to initialize database',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
