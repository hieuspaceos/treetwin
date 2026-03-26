/**
 * Product list page — shows all products with name, slug, features count, and actions.
 * Only visible in core admin (not product admin). Mirrors landing-pages-list pattern.
 */
import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { api } from '@/lib/admin/api-client'

interface ProductMeta {
  slug: string
  name: string
  description?: string
  featuresCount: number
  icon?: string
}

export function ProductListPage() {
  const [, navigate] = useLocation()
  const [products, setProducts] = useState<ProductMeta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.products.list().then((res) => {
      setProducts((res.data as any)?.entries || [])
      setLoading(false)
    })
  }, [])

  async function handleDelete(slug: string, name: string) {
    if (!confirm(`Delete product "${name}"? This cannot be undone.`)) return
    const res = await api.products.delete(slug)
    if (res.ok) setProducts((prev) => prev.filter((p) => p.slug !== slug))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Products</h1>
        <button className="admin-btn admin-btn-primary" onClick={() => navigate('/products/new')}>
          + New Product
        </button>
      </div>

      {loading && <p style={{ color: '#94a3b8' }}>Loading...</p>}

      {!loading && products.length === 0 && (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: '14px' }}>
          <p style={{ color: '#64748b', marginBottom: '1rem' }}>No products yet.</p>
          <button className="admin-btn admin-btn-primary" onClick={() => navigate('/products/new')}>
            Create your first product
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {products.map((product) => (
          <div key={product.slug} className="glass-card" style={{ padding: '1.25rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <h3 style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>{product.name}</h3>
              <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '99px' }}>
                {product.featuresCount} features
              </span>
            </div>
            {product.description && (
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>{product.description}</p>
            )}
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1rem', fontFamily: 'monospace' }}>
              /{product.slug}/admin
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="admin-btn admin-btn-primary" style={{ flex: 1, fontSize: '0.8rem' }}
                onClick={() => navigate(`/products/${product.slug}`)}>
                Edit
              </button>
              <a href={`/${product.slug}/admin`} target="_blank" rel="noopener noreferrer"
                className="admin-btn" style={{ fontSize: '0.8rem' }}>
                Open
              </a>
              <button className="admin-btn" style={{ fontSize: '0.8rem', color: '#ef4444' }}
                onClick={() => handleDelete(product.slug, product.name)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
