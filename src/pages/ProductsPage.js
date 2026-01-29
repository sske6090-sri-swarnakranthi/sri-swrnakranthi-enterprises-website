import React, { useEffect, useMemo, useState } from 'react'
import './ProductsPage.css'
import Navbar from './Navbar'
import FilterSidebar from './FilterSidebar'
import { FiHeart } from 'react-icons/fi'

const DEFAULT_API_BASE = 'https://sri-swarnakranthi-enterprises-backe.vercel.app'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = String(API_BASE_RAW || DEFAULT_API_BASE).replace(/\/+$/, '')

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

const normalizeImages = (images) => {
  if (!images) return []
  if (Array.isArray(images)) return images.filter(Boolean).map(String)
  if (typeof images === 'string') {
    const s = images.trim()
    if (!s) return []
    try {
      const parsed = JSON.parse(s)
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String)
      return []
    } catch {
      return [s]
    }
  }
  return []
}

const toNum = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

const money = (v) => {
  const n = toNum(v)
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
}

const getProductName = (p) => p?.name ?? p?.product_name ?? ''
const getFinalPrice = (p) => p?.discounted_price ?? p?.price ?? 0
const getMrp = (p) => p?.price ?? 0

const getDiscountPercent = (p) => {
  const mrp = toNum(getMrp(p))
  const final = toNum(getFinalPrice(p))
  if (mrp <= 0) return 0
  const off = ((mrp - final) / mrp) * 100
  return off > 0 ? Math.round(off) : 0
}

const explodeProductsByImages = (list) => {
  const out = []
  ;(list || []).forEach((p) => {
    const imgs = normalizeImages(p?.images)
    if (!imgs.length) {
      out.push({ ...p, images: [], __image: '', __key: `${p?.id || 'x'}:noimg` })
      return
    }
    imgs.forEach((img, idx) => {
      out.push({ ...p, images: imgs, __image: img, __key: `${p?.id || 'x'}:${idx}:${img}` })
    })
  })
  return out
}

const wishKey = (productId, variant) => `${String(productId)}::${String(variant || '')}`

const normalizeWishlistRow = (row) => {
  const rawImages = Array.isArray(row?.images) ? row.images.filter(Boolean).map(String) : []
  const variant = String(row?.variant || row?.image_url || '')
  const image_url = variant || (rawImages.length ? rawImages[0] : '')
  return {
    ...row,
    id: row?.product_id || row?.id,
    product_id: row?.product_id || row?.id,
    variant,
    image_url,
    images: image_url ? [image_url] : rawImages
  }
}

export default function ProductsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const userId = useMemo(() => getUserId(), [])
  const [wishlistLocal, setWishlistLocal] = useState(() => readWishlistLocal(getUserId()).map(normalizeWishlistRow))
  const [busyKey, setBusyKey] = useState('')

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
        const list = Array.isArray(data) ? data : []
        const normalized = list.map((p) => ({ ...p, images: normalizeImages(p?.images) }))
        setItems(normalized)
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
    const onStorage = () => {
      const next = readWishlistLocal(getUserId()).map(normalizeWishlistRow)
      setWishlistLocal(next)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      const next = Array.isArray(e?.detail) ? e.detail : readWishlistLocal(getUserId())
      setWishlistLocal((Array.isArray(next) ? next : []).map(normalizeWishlistRow))
    }
    window.addEventListener('wishlist-local-updated', handler)
    return () => window.removeEventListener('wishlist-local-updated', handler)
  }, [])

  const exploded = useMemo(() => explodeProductsByImages(items), [items])

  const filtered = useMemo(() => {
    const q = String(filters?.q || '').trim().toLowerCase()
    const cat = String(filters?.category || 'all').toLowerCase()
    const brand = String(filters?.brand || 'all').toLowerCase()
    const onlyDiscount = !!filters?.onlyDiscount
    const cap = Number.isFinite(filters?.priceCap) ? filters.priceCap : Infinity

    return (exploded || []).filter((p) => {
      const name = getProductName(p).toLowerCase()
      const b = String(p?.brand || '').toLowerCase()
      const c = String(p?.category_slug || '').toLowerCase()
      const price = toNum(getFinalPrice(p))
      const discount = getDiscountPercent(p)

      if (q && !name.includes(q) && !b.includes(q) && !c.includes(q)) return false
      if (cat !== 'all' && c !== cat) return false
      if (brand !== 'all' && b !== brand) return false
      if (onlyDiscount && discount <= 0) return false
      if (price > cap) return false

      return true
    })
  }, [exploded, filters])

  const isWishedCard = (productId, variant) => {
    const key = wishKey(productId, variant)
    return (wishlistLocal || []).some((x) => {
      const pid = x?.product_id ?? x?.id
      const v = String(x?.variant || x?.image_url || (Array.isArray(x?.images) ? x.images[0] : '') || '')
      return wishKey(pid, v) === key
    })
  }

  const handleToggleWish = async (p) => {
    if (!userId) {
      try {
        window.dispatchEvent(new CustomEvent('open-login'))
      } catch {}
      return
    }

    const pid = p.id
    const variant = String(p.__image || '')
    const key = wishKey(pid, variant)
    const wished = isWishedCard(pid, variant)

    setBusyKey(key)

    try {
      if (!wished) {
        const resp = await fetch(`${API_BASE}/api/wishlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, product_id: pid, variant })
        })
        const data = await resp.json().catch(() => ({}))
        if (!resp.ok) throw new Error(data?.message || 'Unable to add wishlist')

        const payload = normalizeWishlistRow({
          id: pid,
          product_id: pid,
          name: p.name,
          brand: p.brand,
          category_slug: p.category_slug,
          variant,
          image_url: variant,
          images: Array.isArray(p.images) ? p.images : variant ? [variant] : [],
          price: p.price,
          discounted_price: p.discounted_price
        })

        const next = [...(wishlistLocal || []), payload]
        writeWishlistLocal(userId, next)
        setWishlistLocal(next)
        try {
          window.dispatchEvent(new CustomEvent('wishlist-local-updated', { detail: next }))
        } catch {}
      } else {
        const resp = await fetch(`${API_BASE}/api/wishlist`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, product_id: pid, variant })
        })
        const data = await resp.json().catch(() => ({}))
        if (!resp.ok && resp.status !== 404) throw new Error(data?.message || 'Unable to remove wishlist')

        const next = (wishlistLocal || []).filter((x) => {
          const xpid = x?.product_id ?? x?.id
          const xv = String(x?.variant || x?.image_url || (Array.isArray(x?.images) ? x.images[0] : '') || '')
          return wishKey(xpid, xv) !== key
        })

        writeWishlistLocal(userId, next)
        setWishlistLocal(next)
        try {
          window.dispatchEvent(new CustomEvent('wishlist-local-updated', { detail: next }))
        } catch {}
      }
    } catch {} finally {
      setBusyKey('')
    }
  }

  return (
    <div className="pp-page">
      <div className="pp-nav">
        <Navbar />
      </div>

      <div className="pp-filters">
        <FilterSidebar items={items} onChange={setFilters} initialFilters={filters} />
      </div>

      <div className="pp-content">
        {loading && (
          <div className="pp-state">
            <div className="pp-spinner" />
            <span>Loading products…</span>
          </div>
        )}

        {!loading && error && (
          <div className="pp-state pp-error">
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="pp-state">
            <span>No products found</span>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="pp-grid">
            {filtered.map((p) => {
              const img = String(p.__image || '')
              const price = getFinalPrice(p)
              const mrp = getMrp(p)
              const discount = getDiscountPercent(p)
              const wished = isWishedCard(p.id, img)
              const busy = String(busyKey) === wishKey(p.id, img)
              const name = getProductName(p)

              return (
                <div key={p.__key} className="pp-card">
                  <div className="pp-media pp-media-fixed">
                    {img ? <img src={img} alt={name} className="pp-img" /> : <div className="pp-img ph">No Image</div>}

                    <button
                      type="button"
                      className={`pp-wish ${wished ? 'active' : ''} ${busy ? 'disabled' : ''}`}
                      onClick={() => handleToggleWish(p)}
                      aria-label="wishlist"
                      disabled={busy}
                    >
                      <FiHeart />
                    </button>

                    {toNum(discount) > 0 && <div className="pp-badge">{toNum(discount)}% OFF</div>}
                  </div>

                  <div className="pp-body">
                    <div className="pp-brand">{p.brand}</div>
                    <div className="pp-name" title={name}>
                      {name}
                    </div>

                    <div className="pp-priceRow">
                      <span className="pp-price">₹{money(price)}</span>
                      {toNum(discount) > 0 && <span className="pp-mrp">₹{money(mrp)}</span>}
                    </div>

                    {/*<button className="pp-btn" type="button">
                      View Details
                    </button> */}
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
