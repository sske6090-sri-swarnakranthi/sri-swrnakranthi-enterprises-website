import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FaHeart, FaRegHeart } from 'react-icons/fa'
import Navbar from './Navbar'
import Footer from './Footer'
import FilterSidebar from './FilterSidebar'
import './SearchResults.css'
import './WomenDisplayPage.css'
import { useWishlist } from '../WishlistContext'

const DEFAULT_API_BASE = 'http://localhost:5000'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = String(API_BASE_RAW || '').replace(/\/+$/, '')

const categories = [
  'T-SHIRTS & CAPS',
  'KEY CHAINS',
  'PENS & PEN STAND',
  'MOBILE STAND',
  'TRAVEL BAGS',
  'WALL CLOCKS',
  'TABLE CLOCKS',
  'LADIES PURSE',
  'GENTS PURSE',
  'LADIES BAGS',
  'SHOPPING BAGS',
  'ATM POUCHS',
  'CHEQUE BOOK FOLDER',
  'CALENDARS',
  'DIARYS & NOTEBOOKS',
  'GROCERY COVERS',
  'SHOPPING COVERS',
  'JEWELLERY BOXS & PURSES',
  'MUG PRINTING',
  'SUBLIMATION PRINTING',
  'VISITING CARDS',
  'PAMPHLETS',
  'WEDDING CARDS',
  'ID CARDS',
  'SCHOOL DIARYS',
  'PROGRESS REPORTS',
  'TIES & BELTS',
  'MEMONTOS & MEDALS'
]

const DEFAULT_IMG = '/images/placeholder.jpg'

const normalizeText = (str) =>
  String(str || '')
    .toLowerCase()
    .replace(/₹/g, ' ')
    .replace(/rs\.?/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const buildTokens = (text) => {
  const norm = normalizeText(text)
  if (!norm) return []
  return norm.split(' ').filter(Boolean)
}

const textMatchesProduct = (tokens, product) => {
  if (!tokens.length) return true
  const fields = [
    normalizeText(product.product_name),
    normalizeText(product.brand),
    normalizeText(product.category)
  ]
  return tokens.every((t) => fields.some((f) => f && f.includes(t)))
}

const SearchResults = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { wishlistItems, addToWishlist } = useWishlist()
  const [baseResults, setBaseResults] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState([])

  const query = new URLSearchParams(location.search).get('q') || ''

  const userType = (localStorage.getItem('userType') || sessionStorage.getItem('userType') || 'B2C').toUpperCase()
  const userId =
    (typeof window !== 'undefined' && (sessionStorage.getItem('userId') || localStorage.getItem('userId'))) || null

  const offerPrice = (p) =>
    Number(userType === 'B2B' ? p.b2b_final_price ?? 0 : p.b2c_final_price ?? 0) || 0

  const originalPrice = (p) =>
    Number(userType === 'B2B' ? p.b2b_actual_price ?? 0 : p.b2c_actual_price ?? 0) || 0

  const discountPctValue = (p) => {
    const o = originalPrice(p)
    const f = offerPrice(p)
    if (!o || o <= 0) return 0
    if (!f || f <= 0 || f >= o) return 0
    return Math.max(0, Math.round(((o - f) / o) * 100))
  }

  const getImg = (p) => {
    const img = Array.isArray(p.images) && p.images.length ? p.images[0] : ''
    return img || DEFAULT_IMG
  }

  useEffect(() => {
    setSearchInput(query)
  }, [query])

  const applyLocalSearch = (all, q) => {
    const tokens = buildTokens(q)
    const filtered = (all || []).filter((p) => textMatchesProduct(tokens, p))
    return filtered
  }

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const url = `${API_BASE}/api/products?limit=5000`
        const res = await fetch(url)
        const data = await res.json()
        const arr = Array.isArray(data) ? data : []
        if (!cancelled) {
          setBaseResults(arr)
          const filtered = applyLocalSearch(arr, query)
          setResults(filtered)
        }
      } catch {
        if (!cancelled) {
          setBaseResults([])
          setResults([])
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
    const filtered = applyLocalSearch(baseResults, query)
    setResults(filtered)
  }, [query, baseResults])

  const suggestAbortRef = useRef(null)
  const suggestTimerRef = useRef(null)

  useEffect(() => {
    if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current)
    if (suggestAbortRef.current) suggestAbortRef.current.abort()

    const v = searchInput.trim()
    if (v.length < 1) {
      setSuggestions(categories.slice(0, 12))
      return
    }

    const localMatches = categories
      .filter((c) => normalizeText(c).includes(normalizeText(v)))
      .slice(0, 12)

    suggestTimerRef.current = setTimeout(async () => {
      const controller = new AbortController()
      suggestAbortRef.current = controller

      try {
        const params = new URLSearchParams()
        params.set('q', v)
        const resp = await fetch(`${API_BASE}/api/products/suggest?${params.toString()}`, { signal: controller.signal })
        const data = await resp.json().catch(() => [])
        const apiSuggestions = Array.isArray(data) ? data : []
        const merged = [...localMatches, ...apiSuggestions]
        const uniq = Array.from(new Set(merged.map((x) => String(x || '').trim()).filter(Boolean))).slice(0, 12)
        setSuggestions(uniq.length ? uniq : localMatches.length ? localMatches : categories.slice(0, 12))
      } catch {
        setSuggestions(localMatches.length ? localMatches : categories.slice(0, 12))
      }
    }, 160)

    return () => {
      if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current)
      if (suggestAbortRef.current) suggestAbortRef.current.abort()
    }
  }, [searchInput])

  const productIdFor = (p) => (p?.id ? Number(p.id) : null)

  const handleProductClick = (p) => {
    if (p) {
      sessionStorage.setItem('selectedProduct', JSON.stringify(p))
      navigate('/checkout')
    }
  }

  const handleWishlist = async (e, p) => {
    e.preventDefault()
    e.stopPropagation()
    const pid = productIdFor(p)
    if (!userId || !pid) return

    try {
      const resp = await fetch(`${API_BASE}/api/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, product_id: pid })
      })
      if (resp.ok) addToWishlist({ ...p, product_id: pid, id: pid })
    } catch {}
  }

  const isInWishlist = (p) => {
    const pid = productIdFor(p)
    if (!pid) return false
    return wishlistItems.some((w) => String(w.product_id ?? w.id) === String(pid))
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const value = searchInput.trim()
    const params = new URLSearchParams(location.search)
    if (value) params.set('q', value)
    else params.delete('q')
    navigate(`${location.pathname}?${params.toString()}`)
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (value) => {
    setSearchInput(value)
    const params = new URLSearchParams(location.search)
    params.set('q', value)
    navigate(`${location.pathname}?${params.toString()}`)
    setShowSuggestions(false)
  }

  return (
    <div className="sr-page">
      <Navbar />

      <div className="sr-topbar">
        <div className="sr-topbar-inner">
          <FilterSidebar
            source={baseResults}
            onFilterChange={(filtered) => {
              setResults(Array.isArray(filtered) ? filtered : [])
            }}
          />
        </div>
      </div>

      <main className="sr-main">
        <div className="sr-search-wrap">
          <form className="sr-search-bar" onSubmit={handleSearchSubmit}>
            <div className="sr-search-row">
              <input
                type="text"
                className="sr-search-input"
                placeholder="Search for products"
                value={searchInput}
                onChange={(e) => {
                  const val = e.target.value
                  setSearchInput(val)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
              />

              <button type="submit" className="sr-search-btn">
                Search
              </button>

              {showSuggestions && suggestions.length > 0 && (
                <div className="sr-suggestions">
                  {suggestions.map((s) => (
                    <div
                      key={s}
                      className="sr-suggestion-item"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleSuggestionClick(s)
                      }}
                    >
                      <span className="sr-suggestion-dot" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="sr-search-note">Try searching categories, brand, or product name.</p>
          </form>
        </div>

        {loading ? (
          <div className="sr-status-wrap">
            <p className="sr-status">Loading...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="sr-status-wrap">
            <p className="sr-status">No products found.</p>
          </div>
        ) : (
          <section className="sr-grid-wrap">
            <div className="sr-header">
              <div>
                <h2 className="sr-title">
                  Results for <span className="sr-highlight">{query || 'All Products'}</span>
                </h2>
              </div>
              <span className="sr-count">{results.length} items</span>
            </div>

            <div className="womens-section4-grid">
              {results.map((p) => {
                const discount = discountPctValue(p)
                const img = getImg(p)

                return (
                  <article key={p.id} className="womens-section4-card" onClick={() => handleProductClick(p)}>
                    <div className="womens-section4-img">
                      {discount > 0 && (
                        <div className="discount-ribbon">
                          <span>{discount}% OFF</span>
                        </div>
                      )}

                      <img
                        src={img}
                        alt={p.product_name}
                        className="fade-image"
                        onError={(e) => {
                          if (e.currentTarget.src !== DEFAULT_IMG) e.currentTarget.src = DEFAULT_IMG
                        }}
                      />

                      <div className="love-icon" onClick={(e) => handleWishlist(e, p)} role="button" tabIndex={0}>
                        {isInWishlist(p) ? (
                          <FaHeart style={{ color: '#4aa3ff', fontSize: '20px' }} />
                        ) : (
                          <FaRegHeart style={{ color: '#4aa3ff', fontSize: '20px' }} />
                        )}
                      </div>
                    </div>

                    <div className="womens-section4-body">
                      <div className="brand-row">
                        <h4 className="brand-name">{p.brand}</h4>
                        <span className="brand-chip">New in</span>
                      </div>

                      <h5 className="product-name">{p.product_name}</h5>

                      <div className="card-price-row">
                        <span className="card-offer-price">₹{offerPrice(p).toFixed(2)}</span>
                        <span className="card-original-price">₹{originalPrice(p).toFixed(2)}</span>
                      </div>

                      <div className="womens-section4-meta">
                        <span className="price-type">{userType === 'B2B' ? 'B2B Price' : 'B2C Price'}</span>
                        {discount > 0 && <span className="saving-text">You save {discount}%</span>}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default SearchResults
