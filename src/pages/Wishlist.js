import React, { useEffect, useState } from 'react'
import './Wishlist.css'
import { useNavigate } from 'react-router-dom'
import WishlistPopup from './WishlistPopup'
import Navbar from './Navbar'
import Footer from './Footer'
import { useWishlist } from '../WishlistContext'
import { FaTimes } from 'react-icons/fa'

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

const Wishlist = () => {
  const { wishlistItems, setWishlistItems } = useWishlist()
  const [showPopup, setShowPopup] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userType, setUserType] = useState(() => {
    if (typeof window === 'undefined') return 'B2C'
    return sessionStorage.getItem('userType') || localStorage.getItem('userType') || 'B2C'
  })

  const navigate = useNavigate()
  const userId = getUserId()

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const syncUserType = () => {
      const storedType = sessionStorage.getItem('userType') || localStorage.getItem('userType') || 'B2C'
      if (storedType !== userType) setUserType(storedType)
    }
    window.addEventListener('storage', syncUserType)
    const interval = setInterval(syncUserType, 500)
    return () => {
      window.removeEventListener('storage', syncUserType)
      clearInterval(interval)
    }
  }, [userType])

  const normalizeWishlistItem = (row) => {
    const images = Array.isArray(row?.images) ? row.images : []
    const image_url = row?.image_url || (images.length ? images[0] : '/images/placeholder.jpg')
    return {
      ...row,
      id: row?.product_id || row?.id,
      product_id: row?.product_id || row?.id,
      image_url,
      images
    }
  }

  const loadWishlist = async () => {
    if (!userId) {
      setWishlistItems([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/wishlist/${userId}`)
      const data = await res.json()
      const arr = Array.isArray(data) ? data.map(normalizeWishlistItem) : []
      setWishlistItems(arr)
      writeWishlistLocal(userId, arr)
    } catch {
      const local = readWishlistLocal(userId).map(normalizeWishlistItem)
      setWishlistItems(local)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadWishlist()
  }, [userId])

  useEffect(() => {
    const handler = (e) => {
      if (!userId) return
      const next = Array.isArray(e?.detail) ? e.detail : readWishlistLocal(userId)
      setWishlistItems(next.map(normalizeWishlistItem))
    }
    window.addEventListener('wishlist-local-updated', handler)
    return () => window.removeEventListener('wishlist-local-updated', handler)
  }, [userId, setWishlistItems])

  const handleRemove = (item) => {
    setSelectedItem(item)
    setShowPopup(true)
  }

  const confirmRemove = async () => {
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
      setWishlistItems(updated)
      writeWishlistLocal(userId, updated)

      try {
        window.dispatchEvent(new CustomEvent('wishlist-local-updated', { detail: updated }))
      } catch {}
    } catch {
    } finally {
      setShowPopup(false)
    }
  }

  const fmt = (n) => Number(n || 0).toFixed(2)

  const getItemPricing = (item) => {
    if (userType === 'B2B') {
      const mrp = Number(item.b2b_actual_price ?? item.b2c_actual_price ?? 0)
      const offer = Number(item.b2b_final_price ?? item.b2c_final_price ?? mrp)
      return { mrp, offer }
    }
    const mrp = Number(item.b2c_actual_price ?? item.b2b_actual_price ?? 0)
    const offer = Number(item.b2c_final_price ?? item.b2b_final_price ?? mrp)
    return { mrp, offer }
  }

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
        ) : wishlistItems.length === 0 ? (
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
            {wishlistItems.map((item, index) => {
              const { mrp, offer } = getItemPricing(item)
              const discountPct = mrp > 0 && offer < mrp ? Math.round(((mrp - offer) / mrp) * 100) : 0

              return (
                <div key={`${item.product_id ?? index}`} className="wishlist-card">
                  <div
                    className="wishlist-media"
                    onClick={() => {
                      sessionStorage.setItem('selectedProduct', JSON.stringify(item))
                      navigate('/checkout')
                    }}
                  >
                    <img src={item.image_url} alt={item.product_name} loading="lazy" decoding="async" />

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
                    <p className="wishlist-name" title={item.product_name}>
                      {item.product_name}
                    </p>

                    <div className="wishlist-price">
                      <span className="wishlist-offer">₹{fmt(offer)}</span>
                      <span className="wishlist-mrp">₹{fmt(mrp)}</span>
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
