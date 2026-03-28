/**
 * Marketplace query helpers — typed Supabase queries for common operations.
 * All functions accept a Supabase client to stay flexible (server vs browser).
 * Local SQLite clients lack JOIN support, so joined queries fall back to
 * manual multi-step fetches assembled in memory.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database-types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<Database> | any

/** Returns true when the client is the local SQLite shim (has no `rpc` method). */
function isLocalClient(client: Client): boolean {
  return typeof client?.rpc !== 'function'
}

/** List published products, optionally filtered by category */
export async function listProducts(client: Client, category?: string) {
  let query = client
    .from('products')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  if (category) query = query.eq('category', category)
  const { data, error } = await query
  if (error) throw error
  return data
}

/** Get single product by slug */
export async function getProduct(client: Client, slug: string) {
  const { data, error } = await client
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) throw error
  return data
}

/** Get user profile */
export async function getProfile(client: Client, userId: string) {
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

/** List user's orders with items and product details */
export async function listUserOrders(client: Client, userId: string) {
  // Local SQLite shim: assemble joins manually (no nested select support)
  if (isLocalClient(client)) {
    const { data: orders, error } = await client
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    if (!orders?.length) return orders ?? []

    // Fetch items and products for each order
    const { data: allItems } = await client.from('order_items').select('*')
    const { data: allProducts } = await client.from('products').select('*')
    const productMap = new Map((allProducts ?? []).map((p: any) => [p.id, p]))

    return (orders as any[]).map((ord: any) => {
      const items = (allItems ?? [])
        .filter((i: any) => i.order_id === ord.id)
        .map((i: any) => ({ ...i, products: productMap.get(i.product_id) ?? null }))
      return { ...ord, order_items: items }
    })
  }

  const { data, error } = await client
    .from('orders')
    .select('*, order_items(*, products(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/** List user's active licenses with product details */
export async function listUserLicenses(client: Client, userId: string) {
  // Local SQLite shim: assemble joins manually
  if (isLocalClient(client)) {
    const { data: licenses, error } = await client
      .from('licenses')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    if (error) throw error
    if (!licenses?.length) return licenses ?? []

    const { data: allProducts } = await client.from('products').select('*')
    const productMap = new Map((allProducts ?? []).map((p: any) => [p.id, p]))

    return (licenses as any[]).map((lic: any) => ({
      ...lic,
      products: productMap.get(lic.product_id) ?? null,
    }))
  }

  const { data, error } = await client
    .from('licenses')
    .select('*, products(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/** Generate unique order number: ORD-YYYYMMDD-XXXX */
export function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${date}-${rand}`
}

/** Generate license key: XXXX-XXXX-XXXX-XXXX (no ambiguous chars) */
export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excludes 0/O, 1/I/L
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${segment()}-${segment()}-${segment()}-${segment()}`
}
