import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './Wishlist.css'
import { useNavigate } from 'react-router-dom'
import WishlistPopup from './WishlistPopup'
import Navbar from './Navbar'
import Footer from './Footer'
import { useWishlist } from '../WishlistContext'
import { FaTimes } from 'react-icons/fa'

const DEFAULT_API_BASE = 'https://sri-swarnakranthi-enterprises-backe.vercel.app'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = String(API_BASE_RAW || DEFAULT_API_BASE).replace(/\/+$/, '')

const getStored = (key, fallback = '') => {
  if (typeof window === 'undefined') return fallback
  return sessionStorage.getItem(key) || localStorage.getItem(key) || fallback
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

const toNum = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

const buildSig = (arr) => {
  if (!Array.isArray(arr)) return ''
  return arr
    .map((x) => String(x?.product_id ?? x?.id ?? ''))
    .filter(Boolean)
    .sort()
    .join('|')
}

const Wishlist = () => {
  const { wishlistItems, setWishlistItems } = useWishlist()
  const [showPopup, setShowPopup] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userType, setUserType] = useState(() => getStored('userType', 'B2C'))
  const [userId, setUserId] = useState(() => getStored('userId', ''))

  const navigate = useNavigate()
  const lastSigRef = useRef(buildSig(wishlistItems))

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const syncFromStorage = () => {
      const nextUserType = getStored('userType', 'B2C')
      const nextUserId = getStored('userId', '')
      setUserType((prev) => (prev === nextUserType ? prev : nextUserType))
      setUserId((prev) => (prev === nextUserId ? prev : nextUserId))
    }
    window.addEventListener('storage', syncFromStorage)
    window.addEventListener('focus', syncFromStorage)
    return () => {
      window.removeEventListener('storage', syncFromStorage)
      window.removeEventListener('focus', syncFromStorage)
    }
  }, [])

  const normalizeWishlistItem = useCallback((row) => {
    const images = Array.isArray(row?.images) ? row.images : []
    const image_url = row?.image_url || (images.length ? images[0] : '/images/placeholder.jpg')
    const name = row?.name ?? row?.product_name ?? ''
    return {
      ...row,
      id: row?.product_id || row?.id,
      product_id: row?.product_id || row?.id,
      name,
      product_name: name,
      image_url,
      images
    }
  }, [])

  const safeSetWishlist = useCallback(
    (nextArr) => {
      const nextSig = buildSig(nextArr)
      if (nextSig && nextSig === lastSigRef.current) return
      lastSigRef.current = nextSig
      setWishlistItems(nextArr)
    },
    [setWishlistItems]
  )

  const loadWishlist = useCallback(async () => {
    if (!userId) {
      safeSetWishlist([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/wishlist/${userId}`)
      const data = await res.json().catch(() => null)
      const arr = Array.isArray(data) ? data.map(normalizeWishlistItem) : []
      safeSetWishlist(arr)
      writeWishlistLocal(userId, arr)
    } catch {
      const local = readWishlistLocal(userId).map(normalizeWishlistItem)
      safeSetWishlist(local)
    } finally {
      setIsLoading(false)
    }
  }, [userId, normalizeWishlistItem, safeSetWishlist])

  useEffect(() => {
    loadWishlist()
  }, [loadWishlist])

  useEffect(() => {
    const handler = (e) => {
      if (!userId) return
      const next = Array.isArray(e?.detail) ? e.detail : readWishlistLocal(userId)
      const normalized = next.map(normalizeWishlistItem)
      safeSetWishlist(normalized)
    }
    window.addEventListener('wishlist-local-updated', handler)
    return () => window.removeEventListener('wishlist-local-updated', handler)
  }, [userId, normalizeWishlistItem, safeSetWishlist])

  const handleRemove = (item) => {
    setSelectedItem(item)
    setShowPopup(true)
  }

  const confirmRemove = useCallback(async () => {
    if (!userId || !selectedItem) {
      setShowPopup(false)
      return
    }

    const pid = selectedItem.product_id || selectedItem.id

    try {
      await fetch(`${API_BASE}/api/wishlist`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, product_id: pid })
      })

      const updated = wishlistItems.filter((it) => String(it.product_id || it.id) !== String(pid))
      safeSetWishlist(updated)
      writeWishlistLocal(userId, updated)

      try {
        window.dispatchEvent(new CustomEvent('wishlist-local-updated', { detail: updated }))
      } catch {}
    } finally {
      setShowPopup(false)
    }
  }, [userId, selectedItem, wishlistItems, safeSetWishlist])

  const fmt = (n) => Number(n || 0).toFixed(2)

  const getItemPricing = useCallback((item) => {
    const mrp = toNum(item?.price)
    const offer = toNum(item?.discounted_price ?? item?.price)
    return { mrp, offer }
  }, [])

  const renderedItems = useMemo(() => wishlistItems || [], [wishlistItems])

  return (
    <div className="wishlist-page-wrap">
      <Navbar />

      <div className="wishlist-page">
        <div className="wishlist-header">
          <div className="wishlist-header-left">
            <h1 className="wishlist-title">Wishlist</h1>
            <p className="wishlist-subtitle">Your saved items in one place</p>
          </div>

          <div className="wishlist-header-right">
            <span className="wishlist-mode">{userType === 'B2B' ? 'Business pricing' : 'Retail pricing'}</span>
            <button className="wishlist-cart-btn" onClick={() => navigate('/cart')}>
              Go to Cart
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="wishlist-loading">
            <div className="wishlist-loader" />
            <p>Loading your wishlist...</p>
          </div>
        ) : renderedItems.length === 0 ? (
          <div className="wishlist-empty">
            <img src="/images/emptyWishlist.avif" alt="Empty Wishlist" />
            <h2>No saved items yet</h2>
            <p>Tap the heart on any product to save it here.</p>
            <button className="wishlist-primary-btn" onClick={() => navigate('/')}>
              Browse Products
            </button>
          </div>
        ) : (
          <div className="wishlist-grid">
            {renderedItems.map((item, index) => {
              const { mrp, offer } = getItemPricing(item)
              const discountPct = mrp > 0 && offer < mrp ? Math.round(((mrp - offer) / mrp) * 100) : 0
              const displayName = item?.name ?? item?.product_name ?? ''
              const key = String(item.product_id ?? item.id ?? index)

              return (
                <div key={key} className="wishlist-card">
                  <div
                    className="wishlist-media"
                    onClick={() => {
                      sessionStorage.setItem('selectedProduct', JSON.stringify(item))
                      navigate('/checkout')
                    }}
                  >
                    <img src={item.image_url} alt={displayName} loading="lazy" decoding="async" />

                    <button
                      type="button"
                      className="wishlist-remove"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(item)
                      }}
                      aria-label="Remove"
                    >
                      <FaTimes />
                    </button>

                    {discountPct > 0 && <span className="wishlist-discount">{discountPct}% OFF</span>}
                  </div>

                  <div className="wishlist-body">
                    <p className="wishlist-brand">{item.brand || 'Brand'}</p>
                    <p className="wishlist-name" title={displayName}>
                      {displayName}
                    </p>

                    <div className="wishlist-price">
                      <span className="wishlist-offer">₹{fmt(offer)}</span>
                      {discountPct > 0 && <span className="wishlist-mrp">₹{fmt(mrp)}</span>}
                    </div>

                    <button
                      className="wishlist-move-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        sessionStorage.setItem('selectedProduct', JSON.stringify(item))
                        navigate('/checkout')
                      }}
                    >
                      Move to Bag
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {showPopup && <WishlistPopup onConfirm={confirmRemove} onCancel={() => setShowPopup(false)} />}
      </div>

      <Footer />
    </div>
  )
}

export default Wishlist
