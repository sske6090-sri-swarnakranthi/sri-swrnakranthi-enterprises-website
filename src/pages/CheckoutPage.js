import React, { useState, useEffect, useMemo } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import './CheckoutPage.css'
import { useCart } from '../CartContext'
import { useWishlist } from '../WishlistContext'
import { FaHeart, FaShoppingBag } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'

const DEFAULT_API_BASE = 'https://sri-swarnakranthi-enterprises-backe.vercel.app'
const API_BASE_RAW = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || DEFAULT_API_BASE
const API_BASE = String(API_BASE_RAW || DEFAULT_API_BASE).replace(/\/+$/, '')

const isIntId = (v) => {
  const n = Number(v)
  return Number.isInteger(n) && n > 0
}

const toNum = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const money = (v) => {
  const n = toNum(v)
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
}

const getName = (p) => p?.name ?? p?.product_name ?? ''
const getBrand = (p) => p?.brand ?? ''
const getImages = (p) => (Array.isArray(p?.images) ? p.images : [])
const getMainImage = (p) => p?.image_url || (getImages(p).length ? getImages(p)[0] : '')

const CheckoutPage = () => {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { addToWishlist } = useWishlist()

  const [product, setProduct] = useState(null)
  const [popupMessage, setPopupMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const [userId, setUserId] = useState(() => {
    if (typeof window === 'undefined') return ''
    const stored = sessionStorage.getItem('userId') || localStorage.getItem('userId') || ''
    return isIntId(stored) ? String(stored) : ''
  })

  const [userType, setUserType] = useState(() => {
    if (typeof window === 'undefined') return 'B2C'
    return sessionStorage.getItem('userType') || localStorage.getItem('userType') || 'B2C'
  })

  useEffect(() => {
    const storedProduct = sessionStorage.getItem('selectedProduct')
    if (storedProduct) {
      try {
        setProduct(JSON.parse(storedProduct))
      } catch {
        setProduct(null)
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    return () => {
      sessionStorage.removeItem('selectedProduct')
    }
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const hydrateBackendUser = async (email) => {
    if (!email) return
    try {
      const res = await fetch(`${API_BASE}/api/user/by-email/${encodeURIComponent(email)}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      if (!data || !isIntId(data.id)) return

      const idStr = String(data.id)
      const typeStr = String(data.type || data.user_type || 'B2C')

      setUserId(idStr)
      setUserType(typeStr)

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('userId', idStr)
        localStorage.setItem('userId', idStr)
        sessionStorage.setItem('userType', typeStr)
        localStorage.setItem('userType', typeStr)
        sessionStorage.setItem('userEmail', String(data.email || email))
      }
    } catch {}
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) return
      const email = u.email || (typeof window !== 'undefined' ? sessionStorage.getItem('userEmail') : '') || ''
      if (email) {
        if (typeof window !== 'undefined') sessionStorage.setItem('userEmail', email)
        hydrateBackendUser(email)
      }
      if (typeof window !== 'undefined') {
        const name = u.displayName || (email ? email.split('@')[0] : 'User')
        if (!sessionStorage.getItem('userName')) sessionStorage.setItem('userName', name)
      }
    })
    return () => unsubscribe()
  }, [])

  const pricing = useMemo(() => {
    const p = product || {}
    const mrp = toNum(p.price || 0)
    const offer = toNum(p.discounted_price ?? p.price ?? 0) || mrp
    return { mrp, offer }
  }, [product])

  const discount = useMemo(() => {
    const { mrp, offer } = pricing
    if (!mrp || mrp <= 0 || offer >= mrp) return 0
    return Math.round(((mrp - offer) / mrp) * 100)
  }, [pricing])

  const ensureLoggedIn = () => {
    const effectiveUserId =
      (typeof window !== 'undefined' ? sessionStorage.getItem('userId') : '') ||
      (typeof window !== 'undefined' ? localStorage.getItem('userId') : '') ||
      userId

    if (!isIntId(effectiveUserId)) {
      setPopupMessage('Please sign in to continue')
      setTimeout(() => setPopupMessage(''), 2000)
      try {
        window.dispatchEvent(new CustomEvent('open-login'))
      } catch {}
      return null
    }
    return String(effectiveUserId)
  }

  const handleAdd = async (type) => {
    const uid = ensureLoggedIn()
    if (!uid) return

    const pid = product?.product_id ?? product?.id
    if (!isIntId(pid)) {
      setPopupMessage('Product not found')
      setTimeout(() => setPopupMessage(''), 2000)
      return
    }

    const item = {
      ...product,
      id: Number(pid),
      product_id: Number(pid),
      name: getName(product),
      brand: getBrand(product),
      images: getImages(product),
      image_url: getMainImage(product),
      quantity: 1,
      userType: userType || 'B2C'
    }

    if (type === 'bag') {
      try {
        const resp = await fetch(`${API_BASE}/api/cart`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: Number(uid),
            product_id: Number(pid),
            quantity: 1,
            variant: null
          })
        })

        if (resp.ok) {
          addToCart(item)
          setPopupMessage('Added to bag')
          setTimeout(() => {
            setPopupMessage('')
            navigate('/cart')
          }, 900)
        } else {
          const data = await resp.json().catch(() => null)
          setPopupMessage(data?.message || 'Failed to add to bag')
          setTimeout(() => setPopupMessage(''), 2000)
        }
      } catch {
        setPopupMessage('Failed to add to bag')
        setTimeout(() => setPopupMessage(''), 2000)
      }
      return
    }

    try {
      const resp = await fetch(`${API_BASE}/api/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: Number(uid),
          product_id: Number(pid)
        })
      })

      if (resp.ok) {
        addToWishlist(item)
        setPopupMessage('Added to wishlist')
      } else {
        const data = await resp.json().catch(() => null)
        setPopupMessage(data?.message || 'Failed to add to wishlist')
      }
    } catch {
      setPopupMessage('Failed to add to wishlist')
    } finally {
      setTimeout(() => setPopupMessage(''), 2000)
    }
  }

  const name = getName(product)
  const brand = getBrand(product)
  const img = product ? getMainImage(product) : ''

  return (
    <div className="co-wrap">
      <Navbar />
      <div className="margin-container">
        <div className="co-page">
          <div className="co-container">
            <div className="co-left">
              <div className="co-media">
                <div className="co-image-frame">
                  {img ? <img src={img} alt={name} className="co-image" /> : <div className="co-image" />}
                </div>
              </div>
            </div>

            <div className="co-right">
              {isLoading ? (
                <div className="co-loader">
                  <div className="spin"></div>
                  <span>Loading product…</span>
                </div>
              ) : (
                <>
                  <div className="co-title">
                    <h1 className="co-brand">{brand || 'Brand'}</h1>
                    <h2 className="co-name">{name || 'Product name'}</h2>
                  </div>

                  <div className="co-price-card">
                    <div className="co-price-row">
                      <span className="co-price">₹{money(pricing.offer || pricing.mrp || 0)}</span>
                      {discount > 0 && <span className="co-disc">{discount}% off</span>}
                    </div>

                    <div className="co-mrp">
                      {discount > 0 && <span className="co-mrp-strike">₹{money(pricing.mrp || 0)}</span>}
                      <span className="co-tax">Inclusive of all taxes</span>
                    </div>
                  </div>

                  <div className="co-actions">
                    <button className="btn blue ghost" onClick={() => handleAdd('wishlist')}>
                      <FaHeart style={{ marginRight: 8 }} /> Add to Wishlist
                    </button>
                    <button className="btn blue solid" onClick={() => handleAdd('bag')}>
                      <FaShoppingBag style={{ marginRight: 8 }} /> Add to Bag
                    </button>
                  </div>

                  <div className="co-note">
                    <div className="co-note-card">
                      <p className="co-note-title">Safe Checkout</p>
                      <p className="co-note-sub">Your payment and personal details are protected with secure processing.</p>
                    </div>
                    <div className="co-note-card">
                      <p className="co-note-title">Fast Support</p>
                      <p className="co-note-sub">Need help? Reach out anytime and we will assist you quickly.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {popupMessage && <div className="co-popup">{popupMessage}</div>}
      <Footer />
    </div>
  )
}

export default CheckoutPage
