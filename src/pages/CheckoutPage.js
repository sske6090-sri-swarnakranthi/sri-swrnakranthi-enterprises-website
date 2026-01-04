import React, { useState, useEffect } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import './CheckoutPage.css'
import { useCart } from '../CartContext'
import { useWishlist } from '../WishlistContext'
import { FaHeart, FaShoppingBag } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const DEFAULT_API_BASE = 'http://localhost:5000'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = API_BASE_RAW.replace(/\/+$/, '')

const env =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : typeof process !== 'undefined' && process.env
      ? process.env
      : {}

const fallbackFirebase = {
  apiKey: 'AIzaSyCXytrftmbkF6IHsgpByDcpB4oUSwdJV0M',
  authDomain: 'taraskart-6e601.firebaseapp.com',
  projectId: 'taraskart-6e601',
  storageBucket: 'taraskart-6e601.appspot.com',
  messagingSenderId: '549582561307',
  appId: '1:549582561307:web:40827cc8fc2b1696b718be'
}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || env.REACT_APP_FIREBASE_API_KEY || fallbackFirebase.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.REACT_APP_FIREBASE_AUTH_DOMAIN || fallbackFirebase.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || env.REACT_APP_FIREBASE_PROJECT_ID || fallbackFirebase.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.REACT_APP_FIREBASE_STORAGE_BUCKET || fallbackFirebase.storageBucket,
  messagingSenderId:
    env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ||
    fallbackFirebase.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || env.REACT_APP_FIREBASE_APP_ID || fallbackFirebase.appId
}

if (!getApps().length) initializeApp(firebaseConfig)
const auth = getAuth()

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

const CheckoutPage = () => {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { addToWishlist } = useWishlist()

  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [colorImages, setColorImages] = useState({})
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)

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
    } catch { }
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

  useEffect(() => {
    const loadVariants = async () => {
      if (!product) return
      setIsLoading(true)
      try {
        const res = await fetch(`${API_BASE}/api/products?limit=5000`)
        const data = await res.json()

        const same = (Array.isArray(data) ? data : []).filter(
          (r) =>
            String(r.brand || '')
              .trim()
              .toUpperCase() === String(product.brand || '')
                .trim()
                .toUpperCase() &&
            String(r.product_name || '')
              .trim()
              .toUpperCase() === String(product.product_name || '')
                .trim()
                .toUpperCase()
        )

        const mapped = same.map((r) => ({
          id: r.id,
          product_id: r.id,
          color: r.color || r.colour || '',
          size: r.size || '',
          image_url: Array.isArray(r.images) && r.images.length ? r.images[0] : '',
          ean_code: r.ean_code || '',
          original_price_b2c: r.b2c_actual_price,
          final_price_b2c: r.b2c_final_price,
          original_price_b2b: r.b2b_actual_price,
          final_price_b2b: r.b2b_final_price
        }))

        setVariants(mapped)

        const byColor = {}
        mapped.forEach((v) => {
          const key = v.color || 'DEFAULT'
          if (!byColor[key]) byColor[key] = []
          if (v.image_url) byColor[key].push(v.image_url)
        })
        Object.keys(byColor).forEach((k) => {
          byColor[k] = Array.from(new Set(byColor[k]))
        })
        setColorImages(byColor)

        const colors = Object.keys(byColor).filter((c) => c !== 'DEFAULT' && c.trim())
        const initialColor = colors.length ? product.color || product.colour || colors[0] : null
        setSelectedColor(initialColor)

        const initialSizes = Array.from(
          new Set(
            mapped
              .filter((v) => (initialColor ? v.color === initialColor : true))
              .map((v) => v.size)
              .filter(Boolean)
          )
        )

        const preferredSize = initialSizes.includes(product.size) ? product.size : initialSizes[0] || null
        setSelectedSize(preferredSize)
      } catch {
      } finally {
        setIsLoading(false)
      }
    }
    loadVariants()
  }, [product])

  const sizesForColor = () => {
    if (!selectedColor) return Array.from(new Set(variants.map((v) => v.size).filter(Boolean)))
    return Array.from(new Set(variants.filter((v) => v.color === selectedColor).map((v) => v.size).filter(Boolean)))
  }

  const availableColors = () => {
    return Object.keys(colorImages).filter((c) => c !== 'DEFAULT' && c.trim())
  }

  const mainImage = () => {
    if (!product) return ''
    if (selectedColor) {
      const foundImage = colorImages[selectedColor]?.[0]
      if (foundImage) return foundImage
    }
    if (product.image_url) return product.image_url
    if (Array.isArray(product.images) && product.images.length) return product.images[0]
    return ''
  }

  const handleColorClick = (color) => {
    setSelectedColor(color)
    const sizes = Array.from(new Set(variants.filter((v) => v.color === color).map((v) => v.size).filter(Boolean)))
    const newSize = sizes.includes(selectedSize) ? selectedSize : sizes[0] || null
    setSelectedSize(newSize)
  }

  const handleSizeClick = (size) => {
    setSelectedSize(size)
  }

  const getActivePricing = () => {
    const variant = variants.find((v) => v.color === selectedColor && v.size === selectedSize) || null
    const base = variant || product || {}
    if (userType === 'B2B') {
      const mrp = toNum(base.original_price_b2b || base.b2b_actual_price || 0)
      const offer = toNum(base.final_price_b2b || base.b2b_final_price || 0) || mrp
      return { mrp, offer }
    }
    const mrp = toNum(base.original_price_b2c || base.b2c_actual_price || 0)
    const offer = toNum(base.final_price_b2c || base.b2c_final_price || 0) || mrp
    return { mrp, offer }
  }

  const getDiscount = () => {
    const { mrp, offer } = getActivePricing()
    if (!mrp || !offer || mrp <= offer) return 0
    return Math.round(((mrp - offer) / mrp) * 100)
  }

  const handleAdd = async (type) => {
    const effectiveUserId =
      (typeof window !== 'undefined' ? sessionStorage.getItem('userId') : '') ||
      (typeof window !== 'undefined' ? localStorage.getItem('userId') : '') ||
      userId

    if (!isIntId(effectiveUserId)) {
      setPopupMessage('Please sign in to continue')
      setTimeout(() => setPopupMessage(''), 2000)
      try {
        window.dispatchEvent(new CustomEvent('open-login'))
      } catch { }
      return
    }

    if (!product?.id) {
      setPopupMessage('Product not found')
      setTimeout(() => setPopupMessage(''), 2000)
      return
    }

    const colors = availableColors()
    const needsColor = colors.length > 0
    const sizes = sizesForColor()
    const needsSize = sizes.length > 0

    if (needsColor && !selectedColor) {
      setPopupMessage('Please select a color')
      setTimeout(() => setPopupMessage(''), 2000)
      return
    }

    if (needsSize && !selectedSize) {
      setPopupMessage('Please select a size')
      setTimeout(() => setPopupMessage(''), 2000)
      return
    }

    const chosenVariant =
      variants.find((v) => (needsColor ? v.color === selectedColor : true) && (needsSize ? v.size === selectedSize : true)) || null

    const pid = product.id

    const item = {
      ...product,
      ...(chosenVariant || {}),
      product_id: pid,
      variant_id: chosenVariant?.id || null,
      image_url: mainImage(),
      selectedColor: selectedColor || '',
      selectedSize: selectedSize || '',
      quantity: 1
    }

    if (type === 'bag') {
      try {
        const resp = await fetch(`${API_BASE}/api/cart`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: String(effectiveUserId),
            product_id: Number(pid),
            selected_size: selectedSize ? selectedSize : null,
            selected_color: selectedColor ? selectedColor : null,
            quantity: 1
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
          user_id: String(effectiveUserId),
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

  const pricing = getActivePricing()
  const discount = getDiscount()
  const colors = availableColors()
  const sizes = sizesForColor()

  return (
    <div className="co-wrap">
      <Navbar />
      <div className="margin-container">
        <div className="co-page">
          <div className="co-container">
            <div className="co-left">
              <div className="co-media">
                <div className="co-image-frame">{product && <img src={mainImage()} alt={product.product_name} className="co-image" />}</div>

                {colors.length > 0 && selectedColor && colorImages[selectedColor]?.length > 1 && (
                  <div className="co-thumbs">
                    {colorImages[selectedColor].map((src, i) => (
                      <button
                        key={i}
                        className={`co-thumb ${i === 0 ? 'active' : ''}`}
                        onClick={() => {
                          const c = selectedColor
                          if (!c) return
                          setColorImages((prev) => {
                            const copy = { ...prev }
                            const arr = copy[c] || []
                            if (arr[0] !== src) {
                              const idx = arr.indexOf(src)
                              if (idx > -1) {
                                arr.splice(idx, 1)
                                arr.unshift(src)
                                copy[c] = [...arr]
                              }
                            }
                            return copy
                          })
                        }}
                      >
                        <img src={src} alt={`thumb-${i}`} />
                      </button>
                    ))}
                  </div>
                )}
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
                    <h1 className="co-brand">{product?.brand || 'Brand'}</h1>
                    <h2 className="co-name">{product?.product_name || 'Product name'}</h2>
                  </div>

                  <div className="co-price-card">
                    <div className="co-price-row">
                      <span className="co-price">₹{money(pricing.offer || pricing.mrp || 0)}</span>
                      {discount > 0 && <span className="co-disc">{discount}% off</span>}
                    </div>

                    <div className="co-mrp">
                      <span className="co-mrp-strike">₹{money(pricing.mrp || 0)}</span>
                      <span className="co-tax">Inclusive of all taxes</span>
                    </div>
                  </div>

                  {colors.length > 0 && (
                    <div className="co-section">
                      <div className="co-section-head">
                        <h3>Color</h3>
                        {selectedColor && <span className="co-chip">{selectedColor}</span>}
                      </div>

                      <div className="co-colors">
                        {colors.map((c) => (
                          <button
                            key={c}
                            className={`co-swatch ${selectedColor === c ? 'active' : ''}`}
                            onClick={() => handleColorClick(c)}
                            title={c}
                          >
                            <span className="co-swatch-text">{c}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {sizes.length > 0 && (
                    <div className="co-section">
                      <div className="co-section-head">
                        <h3>Size</h3>
                        {selectedSize && <span className="co-chip">{selectedSize}</span>}
                      </div>

                      <div className="co-sizes">
                        {sizes.map((s) => (
                          <button key={s} className={`co-size ${selectedSize === s ? 'selected' : ''}`} onClick={() => handleSizeClick(s)}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

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
