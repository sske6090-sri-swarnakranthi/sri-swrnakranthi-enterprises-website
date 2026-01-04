import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import './WomenPage.css'
import Footer from './Footer'
import FilterSidebar from './FilterSidebar'
import { useWishlist } from '../WishlistContext'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectCoverflow } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/autoplay'

import WomenDisplayPage from './WomenDisplayPage'

const DEFAULT_API_BASE = 'https://taras-kart-backend.vercel.app'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = API_BASE_RAW.replace(/\/+$/, '')
const CLOUD_NAME = 'deymt9uyh'
const DEFAULT_IMG = '/images/women/women20.jpeg'
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

const clampScrollY = (y) => {
  const max = Math.max(0, (document.documentElement?.scrollHeight || 0) - (window.innerHeight || 0))
  return Math.min(Math.max(0, y), max)
}

const readVariantMap = (userId) => {
  if (typeof window === 'undefined') return {}
  if (!userId) return {}
  try {
    const raw = localStorage.getItem(`wishlist:variant-map:${userId}`)
    const obj = raw ? JSON.parse(raw) : {}
    return obj && typeof obj === 'object' ? obj : {}
  } catch {
    return {}
  }
}

const writeVariantMap = (userId, map) => {
  if (typeof window === 'undefined') return
  if (!userId) return
  try {
    localStorage.setItem(`wishlist:variant-map:${userId}`, JSON.stringify(map || {}))
  } catch {}
}

export default function WomenPage() {
  const [allProducts, setAllProducts] = useState([])
  const [products, setProducts] = useState([])
  const [userType, setUserType] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [likedKeys, setLikedKeys] = useState(new Set())
  const navigate = useNavigate()
  const { addToWishlist, wishlistItems, setWishlistItems } = useWishlist()

  const restoreDoneRef = useRef(false)
  const rafSaveRef = useRef(0)

  const getUserId = () => {
    if (typeof window === 'undefined') return null
    const id = sessionStorage.getItem('userId') || localStorage.getItem('userId')
    if (!id) return null
    const n = Number(id)
    if (!Number.isInteger(n)) return null
    return String(n)
  }

  const userId = getUserId()

  useEffect(() => {
    const t = sessionStorage.getItem('userType') || localStorage.getItem('userType')
    setUserType(t)
  }, [])

  const keyFor = (p) => {
    const pid = p?.product_id ?? p?.id ?? ''
    const ean = p?.ean_code ?? ''
    return `${String(pid)}::${String(ean)}`
  }

  useEffect(() => {
    setLikedKeys(new Set(toArray(wishlistItems).map((it) => keyFor(it))))
  }, [wishlistItems])

  useEffect(() => {
    const onScroll = () => {
      if (rafSaveRef.current) return
      rafSaveRef.current = requestAnimationFrame(() => {
        rafSaveRef.current = 0
        const y = window.scrollY || window.pageYOffset || 0
        sessionStorage.setItem('scroll:women-page', String(y))
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafSaveRef.current) cancelAnimationFrame(rafSaveRef.current)
      rafSaveRef.current = 0
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_BASE}/api/products?gender=WOMEN&limit=50000&_t=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load products')
        const data = await res.json()
        const arr = toArray(data).map((p, i) => {
          const ean = p.ean_code ?? p.EANCode ?? p.ean ?? p.barcode ?? p.bar_code ?? ''
          const img = p.image_url || (ean ? cloudinaryUrlByEan(ean) : '') || DEFAULT_IMG
          return {
            id: p.id ?? p.product_id ?? i + 1,
            product_id: p.product_id ?? p.id ?? i + 1,
            brand: p.brand ?? p.brand_name ?? '',
            product_name: p.product_name ?? p.name ?? '',
            image_url: img,
            ean_code: ean,
            gender: p.gender ?? 'WOMEN',
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
        if (!cancelled) {
          setAllProducts(arr)
          setProducts(arr)
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

  useLayoutEffect(() => {
    if (restoreDoneRef.current) return
    if (loading) return
    restoreDoneRef.current = true
    const saved = sessionStorage.getItem('scroll:women-page')
    const yRaw = saved != null ? parseInt(saved, 10) : 0
    const y = Number.isFinite(yRaw) ? yRaw : 0
    requestAnimationFrame(() => {
      window.scrollTo(0, clampScrollY(y))
      requestAnimationFrame(() => window.scrollTo(0, clampScrollY(y)))
    })
  }, [loading, products.length, error])

  const toggleLike = async (group, picked) => {
    if (!userId) return
    const pid = group.product_id || group.id
    const ean_code = String(picked?.ean_code || '')
    const image_url = String(picked?.image_url || '')
    const color = String(picked?.color || '')

    if (!ean_code || !image_url) return

    const k = keyFor({ product_id: pid, ean_code })
    const inList = likedKeys.has(k)

    try {
      if (inList) {
        await fetch(`${API_BASE}/api/wishlist`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, product_id: pid, ean_code })
        })

        setWishlistItems((prev) => prev.filter((it) => keyFor(it) !== k))
        setLikedKeys((prev) => {
          const n = new Set(prev)
          n.delete(k)
          return n
        })

        const map = readVariantMap(userId)
        delete map[k]
        writeVariantMap(userId, map)
      } else {
        await fetch(`${API_BASE}/api/wishlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, product_id: pid, ean_code, image_url, color })
        })

        const rep =
          group.variants?.find((v) => String(v.ean_code || '') === ean_code) ||
          group.variants?.[0] ||
          group.rep ||
          group

        const payload = {
          ...rep,
          product_id: pid,
          ean_code,
          image_url,
          color: color || rep.color || rep.colour || ''
        }

        addToWishlist(payload)

        setLikedKeys((prev) => {
          const n = new Set(prev)
          n.add(k)
          return n
        })

        const map = readVariantMap(userId)
        map[k] = { image_url, ean_code, color: payload.color }
        writeVariantMap(userId, map)
      }
    } catch {}
  }

  const handleProductClick = (payload) => {
    sessionStorage.setItem('selectedProduct', JSON.stringify(payload))
    navigate('/checkout')
  }

  return (
    <div className="women-page">
      <Navbar />
      <div className="filter-bar-class">
        <FilterSidebar source={allProducts} onFilterChange={(list) => setProducts(Array.isArray(list) ? list : allProducts)} />
        <div className="women-page-main">
          <div className="women-page-content">
            <section className="home1-hero-new-home-2">
              <div className="home1-hero-frame-new-home-2">
                <Swiper className="home1-hero-swiper-new-home-2" modules={[Autoplay]} loop slidesPerView={1} autoplay={{ delay: 3500, disableOnInteraction: false }} speed={900}>
                  <SwiperSlide>
                    <div className="home1-hero-slide-new-home-2">
                      <img src="/images/banners/banner1.jpg" alt="Women Banner" loading="eager" />
                    </div>
                  </SwiperSlide>
                  <SwiperSlide>
                    <div className="home1-hero-slide-new-home-2">
                      <img src="/images/banners/banner2.jpg" alt="Women Banner" loading="lazy" decoding="async" />
                    </div>
                  </SwiperSlide>
                  <SwiperSlide>
                    <div className="home1-hero-slide-new-home-2">
                      <img src="/images/banners/banner3.jpg" alt="Women Banner" loading="lazy" decoding="async" />
                    </div>
                  </SwiperSlide>
                </Swiper>
              </div>
            </section>

            <WomenDisplayPage
              products={products}
              userType={userType}
              loading={loading}
              error={error}
              likedKeys={likedKeys}
              keyFor={keyFor}
              onToggleLike={toggleLike}
              onProductClick={handleProductClick}
            />

            <section className="home-section6">
              <h2 className="home-section6-title">Trending Now....</h2>
              <div className="home-section6-grid">
                <div className="home-section6-item">
                  <div className="home-section6-left">
                    <img src="/images/trending-part1-big1.jpeg" alt="Printed Sarees" />
                  </div>
                  <div className="home-section6-right">
                    <h3>Printed Sarees...</h3>
                    <div className="home-section6-small-images">
                      <img src="/images/trending-part1-small1.jpeg" alt="Saree 1" />
                      <img src="/images/trending-part1-small2.jpeg" alt="Saree 2" />
                    </div>
                  </div>
                </div>
                <div className="home-section6-item">
                  <div className="home-section6-left">
                    <img src="/images/trending-part2-big1.jpeg" alt="Lehanga" />
                  </div>
                  <div className="home-section6-right">
                    <h3> Printed Lehanga...</h3>
                    <div className="home-section6-small-images">
                      <img src="/images/trending-part2-small1.jpeg" alt="Lehanga 1" />
                      <img src="/images/trending-part2-small2.jpeg" alt="Lehanga 2" />
                    </div>
                  </div>
                </div>
                <div className="home-section6-item">
                  <div className="home-section6-left">
                    <img src="/images/trending-part3-big1.jpeg" alt="Wedding Sarees" />
                  </div>
                  <div className="home-section6-right">
                    <h3>Wedding Sarees...</h3>
                    <div className="home-section6-small-images">
                      <img src="/images/trending-part3-small1.jpeg" alt="Saree 1" />
                      <img src="/images/trending-part3-small2.jpeg" alt="Saree 2" />
                    </div>
                  </div>
                </div>
                <div className="home-section6-item">
                  <div className="home-section6-left">
                    <img src="/images/trending-part4-big1.jpeg" alt="Printed Sarees" />
                  </div>
                  <div className="home-section6-right">
                    <h3>Printed Chudidars...</h3>
                    <div className="home-section6-small-images">
                      <img src="/images/trending-part4-small1.jpeg" alt="Saree 1" />
                      <img src="/images/trending-part4-small2.jpeg" alt="Saree 2" />
                    </div>
                  </div>
                </div>
                <div className="home-section6-item">
                  <div className="home-section6-left">
                    <img src="/images/trending-part5-big1.jpeg" alt="Lehanga" />
                  </div>
                  <div className="home-section6-right">
                    <h3> Printed Gowns...</h3>
                    <div className="home-section6-small-images">
                      <img src="/images/trending-part5-small1.jpeg" alt="Lehanga 1" />
                      <img src="/images/trending-part5-small2.jpeg" alt="Lehanga 2" />
                    </div>
                  </div>
                </div>
                <div className="home-section6-item">
                  <div className="home-section6-left">
                    <img src="/images/trending-part6-big1.jpeg" alt="Wedding Sarees" />
                  </div>
                  <div className="home-section6-right">
                    <h3>Half Sarees...</h3>
                    <div className="home-section6-small-images">
                      <img src="/images/trending-part6-small1.jpeg" alt="Saree 1" />
                      <img src="/images/trending-part6-small2.jpeg" alt="Saree 2" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
