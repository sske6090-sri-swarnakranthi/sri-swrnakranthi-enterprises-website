import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import './MenPage.css'
import Footer from './Footer'
import FilterSidebar from './FilterSidebar'
import { useWishlist } from '../WishlistContext'
import MenDisplayPage from './MenDisplayPage'

const DEFAULT_API_BASE = 'https://taras-kart-backend.vercel.app'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = API_BASE_RAW.replace(/\/+$/, '')
const CLOUD_NAME = 'deymt9uyh'
const DEFAULT_IMG = '/images/men/mens13.jpeg'
const toArray = (x) => (Array.isArray(x) ? x : [])

function cloudinaryUrlByEan(ean) {
  if (!ean) return ''
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto/products/${ean}`
}

const normBool = (v) => {
  if (v === true || v === false) return v
  if (v === 1 || v === 0) return Boolean(v)
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    if (s === 'true' || s === '1' || s === 'yes') return true
    if (s === 'false' || s === '0' || s === 'no') return false
  }
  return undefined
}

const numOrZero = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const computeOutOfStock = (p) => {
  const explicit = normBool(p.is_out_of_stock)
  if (explicit !== undefined) return explicit

  const inStock = normBool(p.in_stock)
  if (inStock !== undefined) return !inStock

  const available = numOrZero(
    p.available_qty !== undefined ? p.available_qty : p.availableQty !== undefined ? p.availableQty : undefined
  )
  if (available > 0) return false
  if (p.available_qty !== undefined || p.availableQty !== undefined) return true

  const onHand = numOrZero(p.on_hand !== undefined ? p.on_hand : p.onHand !== undefined ? p.onHand : undefined)
  const reserved = numOrZero(p.reserved !== undefined ? p.reserved : p.reservedQty !== undefined ? p.reservedQty : 0)
  if (p.on_hand !== undefined || p.onHand !== undefined) return onHand - reserved <= 0

  return false
}

export default function MenPage() {
  const navigate = useNavigate()
  const { addToWishlist, wishlistItems, setWishlistItems } = useWishlist()
  const [allProducts, setAllProducts] = useState([])
  const [products, setProducts] = useState([])
  const [userType, setUserType] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [likedKeys, setLikedKeys] = useState(new Set())
  const userId = sessionStorage.getItem('userId')

  const keyFor = (p) => String(p.ean_code ?? p.product_id ?? p.id ?? `${p.image_url}`)

  useEffect(() => {
    setUserType(sessionStorage.getItem('userType'))
  }, [])

  useEffect(() => {
    setLikedKeys(
      new Set(
        toArray(wishlistItems).map((it) => String(it.ean_code ?? it.product_id ?? it.id ?? `${it.image_url}`))
      )
    )
  }, [wishlistItems])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_BASE}/api/products?gender=MEN&limit=50000&_t=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load products')
        const data = await res.json()
        const isPlaceholder = (url) => {
          if (!url) return true
          return /^\/images\//.test(url)
        }
        const arr = toArray(data).map((p, i) => {
          const ean = p.ean_code ?? p.EANCode ?? p.ean ?? p.barcode ?? p.bar_code ?? ''
          const apiImage = !isPlaceholder(p.image_url) ? p.image_url : ''
          const candidateCloudinary = ean ? cloudinaryUrlByEan(ean) : ''
          const img = apiImage || candidateCloudinary || DEFAULT_IMG
          return {
            id: p.id ?? i + 1,
            product_id: p.product_id ?? p.pid ?? p.id ?? i + 1,
            brand: p.brand ?? p.brand_name ?? '',
            product_name: p.product_name ?? p.name ?? '',
            image_url: img,
            ean_code: ean,
            gender: p.gender ?? 'MEN',
            color: p.color ?? p.colour ?? '',
            size: p.size ?? '',
            original_price_b2c: p.original_price_b2c ?? p.mrp ?? p.list_price ?? 0,
            final_price_b2c: p.final_price_b2c ?? p.sale_price ?? p.price ?? p.mrp ?? 0,
            original_price_b2b: p.original_price_b2b ?? p.mrp ?? 0,
            final_price_b2b: p.final_price_b2b ?? p.sale_price ?? 0,
            on_hand: p.on_hand ?? p.onHand,
            reserved: p.reserved ?? p.reservedQty,
            available_qty: p.available_qty ?? p.availableQty,
            in_stock: p.in_stock ?? p.inStock,
            is_out_of_stock: computeOutOfStock(p)
          }
        })

        const uniqMap = new Map()
        for (const x of arr) {
          const key = x.product_id || x.id
          if (!uniqMap.has(key)) uniqMap.set(key, x)
        }
        const uniq = Array.from(uniqMap.values())

        if (!cancelled) {
          setAllProducts(uniq)
          setProducts(uniq)
        }
      } catch {
        if (!cancelled) {
          setAllProducts([])
          setProducts([])
          setError('Unable to load products')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const loadWishlist = async () => {
      if (!userId) return
      try {
        const r = await fetch(`${API_BASE}/api/wishlist/${userId}`)
        const data = await r.json()
        setWishlistItems(Array.isArray(data) ? data : [])
      } catch {}
    }
    loadWishlist()
  }, [userId, setWishlistItems])

  const toggleLike = async (product) => {
    const k = keyFor(product)
    const already = likedKeys.has(k)
    try {
      if (already) {
        await fetch(`${API_BASE}/api/wishlist`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, product_id: product.product_id ?? product.id })
        })
        setWishlistItems((prev) =>
          prev.filter((w) => String(w.ean_code ?? w.product_id ?? w.id ?? `${w.image_url}`) !== k)
        )
        setLikedKeys((prev) => {
          const n = new Set(prev)
          n.delete(k)
          return n
        })
      } else {
        await fetch(`${API_BASE}/api/wishlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, product_id: product.product_id ?? product.id })
        })
        addToWishlist({ ...product, product_id: product.product_id ?? product.id })
        setLikedKeys((prev) => {
          const n = new Set(prev)
          n.add(k)
          return n
        })
      }
    } catch {}
  }

  const handleProductClick = (product) => {
    sessionStorage.setItem('selectedProduct', JSON.stringify(product))
    navigate('/checkout')
  }

  return (
    <div className="men-page">
      <Navbar />
      <div className="test">
        <FilterSidebar
          source={allProducts}
          onFilterChange={(list) => setProducts(Array.isArray(list) ? list : allProducts)}
        />
        <div className="men-page-main">
          <div className="men-page-content">
            <section className="mens-section1">
              <div className="mens-section1-bg">
                <img src="/images/up1.jpg" alt="Mens Fashion Background" />
                <div className="mens-section1-overlay">
                  <div className="mens-section1-text">
                    <h1>Mens</h1>
                    <h1>Fashion</h1>
                  </div>
                </div>
              </div>
            </section>

            <MenDisplayPage
              products={products}
              userType={userType}
              loading={loading}
              error={error}
              likedKeys={likedKeys}
              keyFor={keyFor}
              onToggleLike={toggleLike}
              onProductClick={handleProductClick}
            />

            <section className="mens-section2">
              <div className="mens-section2-bg">
                <img src="/images/mens-bg1.jpg" alt="Mens Style Background" />
                <div className="mens-section2-overlay">
                  <div className="mens-section2-text">
                    <h1>Style Up</h1>
                    <h1>Your</h1>
                    <h1>Wardrobe</h1>
                  </div>
                </div>
              </div>
            </section>

            <section className="mens-section3">
              <div className="mens-section3-left">
                <img src="/images/mens-part1.jpg" alt="Left Fashion" />
              </div>
              <div className="mens-section3-center">
                <h2>Exclusive offers</h2>
                <div className="mens-section3-discount">
                  <span className="line"></span>
                  <h1>50% OFF</h1>
                  <span className="line"></span>
                </div>
                <h3>Just for you</h3>
              </div>
              <div className="mens-section3-right">
                <img src="/images/mens-part2.jpg" alt="Right Fashion" />
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
