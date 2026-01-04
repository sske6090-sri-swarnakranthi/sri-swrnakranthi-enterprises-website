import React, { useEffect, useMemo, useState } from 'react'
import './ProductsPage.css'
import Navbar from './Navbar'
import FilterSidebar from './FilterSidebar'
import { FiHeart } from 'react-icons/fi'

const DEFAULT_API_BASE = 'http://localhost:5000'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = API_BASE_RAW.replace(/\/+$/, '')

const getUserId = () => {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem('userId') || localStorage.getItem('userId') || ''
}

const readWishlistLocal = (userId) => {
  if (!userId) return []
  try {
    const raw = localStorage.getItem(`wishlist:local:${userId}`)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

const writeWishlistLocal = (userId, list) => {
  if (!userId) return
  try {
    localStorage.setItem(`wishlist:local:${userId}`, JSON.stringify(list || []))
  } catch {}
}

const isWished = (list, id) => list.some((x) => String(x?.product_id ?? x?.id) === String(id))

const toNum = (v) => {
  const n = parseFloat(v)
  return isNaN(n) ? 0 : n
}

const money = (v) => {
  const n = toNum(v)
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
}

export default function ProductsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const userId = useMemo(() => getUserId(), [])
  const [wishlistLocal, setWishlistLocal] = useState(() => readWishlistLocal(getUserId()))
  const [busyId, setBusyId] = useState('')

  const [filters, setFilters] = useState({
    q: '',
    category: 'all',
    brand: 'all',
    onlyDiscount: false,
    priceCap: Infinity
  })

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_BASE}/api/products?limit=5000`)
        if (!res.ok) throw new Error('Failed to load products')
        const data = await res.json()
        if (!alive) return
        setItems(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!alive) return
        setError(e?.message || 'Failed to load products')
        setItems([])
      } finally {
        if (!alive) return
        setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const onStorage = () => setWishlistLocal(readWishlistLocal(getUserId()))
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const filtered = useMemo(() => items, [items])

  const handleToggleWish = async (p) => {
    if (!userId) {
      try {
        window.dispatchEvent(new CustomEvent('open-login'))
      } catch {}
      return
    }

    const wished = isWished(wishlistLocal, p.id)
    setBusyId(String(p.id))

    try {
      if (!wished) {
        const resp = await fetch(`${API_BASE}/api/wishlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, product_id: p.id })
        })
        const data = await resp.json().catch(() => ({}))
        if (!resp.ok) throw new Error(data?.message || 'Unable to add wishlist')
      } else {
        const resp = await fetch(`${API_BASE}/api/wishlist`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, product_id: p.id })
        })
        const data = await resp.json().catch(() => ({}))
        if (!resp.ok) throw new Error(data?.message || 'Unable to remove wishlist')
      }

      const payload = {
        id: p.id,
        product_id: p.id,
        product_name: p.product_name,
        brand: p.brand,
        category: p.category,
        images: p.images,
        image_url: Array.isArray(p.images) && p.images.length ? p.images[0] : '',
        b2c_actual_price: p.b2c_actual_price,
        b2c_discount: p.b2c_discount,
        b2c_final_price: p.b2c_final_price,
        b2b_actual_price: p.b2b_actual_price,
        b2b_discount: p.b2b_discount,
        b2b_final_price: p.b2b_final_price
      }

      const next = wished
        ? wishlistLocal.filter((x) => String(x?.product_id ?? x?.id) !== String(p.id))
        : [...wishlistLocal, payload]

      writeWishlistLocal(userId, next)
      setWishlistLocal(next)

      try {
        window.dispatchEvent(new CustomEvent('wishlist-local-updated', { detail: next }))
      } catch {}
    } catch {
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="products-page-container">
      <Navbar />
      <div className="filters-wrap">
        <FilterSidebar items={items} onChange={setFilters} initialFilters={filters} />
      </div>
      <div className="products-page">
        {loading && (
          <div className="products-state">
            <div className="spinner" />
            <span>Loading products…</span>
          </div>
        )}

        {!loading && error && (
          <div className="products-state error">
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="products-state">
            <span>No products found</span>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="products-grid">
            {filtered.map((p) => {
              const img = Array.isArray(p.images) && p.images.length ? p.images[0] : ''
              const price = p.b2c_final_price ?? p.b2c_actual_price ?? 0
              const discount = p.b2c_discount ?? 0
              const wished = isWished(wishlistLocal, p.id)
              const busy = String(busyId) === String(p.id)

              return (
                <div key={p.id} className="product-card">
                  <div className="product-image-wrap">
                    {img ? (
                      <img src={img} alt={p.product_name} className="product-image" />
                    ) : (
                      <div className="product-image-placeholder">No Image</div>
                    )}

                    <button
                      type="button"
                      className={`wish-btn ${wished ? 'active' : ''} ${busy ? 'disabled' : ''}`}
                      onClick={() => handleToggleWish(p)}
                      aria-label="wishlist"
                      disabled={busy}
                    >
                      <FiHeart />
                    </button>

                    {toNum(discount) > 0 && <div className="badge">{toNum(discount)}% OFF</div>}
                  </div>

                  <div className="product-body">
                    <div className="product-top">
                      <div className="product-brand">{p.brand}</div>
                      <div className="product-name">{p.product_name}</div>
                    </div>

                    <div className="product-price">
                      <span className="price">₹{money(price)}</span>
                      {toNum(discount) > 0 && <span className="mrp">₹{money(p.b2c_actual_price)}</span>}
                    </div>

                    <button className="view-btn" type="button">
                      View Details
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
