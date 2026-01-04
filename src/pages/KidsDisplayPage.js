import React, { useMemo, useState, useEffect } from 'react'
import './KidsDisplayPage.css'
import { FaHeart, FaRegHeart, FaChevronLeft, FaChevronRight } from 'react-icons/fa'

const CLOUD_NAME = 'deymt9uyh'
const DEFAULT_IMG = '/images/kids/kids-girls-frock.jpg'

function cloudinaryUrlByEan(ean) {
  if (!ean) return ''
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto/products/${ean}`
}

function uniq(arr) {
  const seen = new Set()
  const out = []
  for (const x of arr) {
    const k = String(x || '')
    if (!seen.has(k) && k) {
      seen.add(k)
      out.push(k)
    }
  }
  return out
}

export default function KidsDisplayPage({
  products,
  userType,
  loading,
  error,
  likedKeys,
  keyFor,
  onToggleLike,
  onProductClick
}) {
  const [carouselIndex, setCarouselIndex] = useState({})

  useEffect(() => {
    const saved = sessionStorage.getItem('kidsDisplayScrollY')
    if (saved != null) {
      const y = parseInt(saved, 10)
      if (!Number.isNaN(y)) {
        window.scrollTo(0, y)
      }
    }
    return () => {
      const y = window.scrollY || window.pageYOffset || 0
      sessionStorage.setItem('kidsDisplayScrollY', String(y))
    }
  }, [])

  const grouped = useMemo(() => {
    const byKey = new Map()
    for (const p of products || []) {
      if (!p) continue
      const baseKey = [
        p.product_name || '',
        p.brand || '',
        p.color || '',
        p.gender || ''
      ].join('||')
      const key =
        baseKey.trim() ||
        `__fallback__:${p.ean_code || p.product_id || p.id || Math.random()}`
      if (!byKey.has(key)) {
        byKey.set(key, {
          key,
          color: p.color,
          brand: p.brand,
          product_name: p.product_name,
          price_fields: {
            original_price_b2c: p.original_price_b2c,
            final_price_b2c: p.final_price_b2c,
            original_price_b2b: p.original_price_b2b,
            final_price_b2b: p.final_price_b2b
          },
          rep: p,
          variants: []
        })
      }
      const g = byKey.get(key)
      g.variants.push(p)
    }

    const out = []
    for (const g of byKey.values()) {
      const eans = uniq(g.variants.map((v) => v.ean_code))
      const imgs = uniq([
        ...g.variants.map((v) => v.image_url),
        ...eans.map((ean) => cloudinaryUrlByEan(ean))
      ])

      const hasStockInfo = g.variants.some(
        (v) => v.in_stock !== undefined || v.available_qty !== undefined
      )

      const anyVariantInStock = g.variants.some((v) => {
        const qty = Number(v.available_qty ?? 0)
        if (v.in_stock === true) return true
        if (v.in_stock === false) return qty > 0
        return qty > 0
      })

      out.push({
        ...g,
        images: imgs,
        ean_code: eans[0] || '',
        id: g.rep.id,
        product_id: g.rep.product_id,
        brand: g.brand || g.rep.brand,
        product_name: g.product_name || g.rep.product_name,
        is_out_of_stock: hasStockInfo ? !anyVariantInStock : false
      })
    }
    return out
  }, [products])

  useEffect(() => {
    const init = {}
    for (const g of grouped) {
      init[g.key] = 0
    }
    setCarouselIndex(init)
  }, [grouped])

  const priceForUser = (g) => {
    const p = g.price_fields || {}
    return userType === 'B2B' ? p.final_price_b2b || p.final_price_b2c : p.final_price_b2c
  }

  const mrpForUser = (g) => {
    const p = g.price_fields || {}
    return userType === 'B2B' ? p.original_price_b2b || p.original_price_b2c : p.original_price_b2c
  }

  const discountPct = (g) => {
    const mrp = Number(mrpForUser(g) || 0)
    const price = Number(priceForUser(g) || 0)
    if (!mrp || mrp <= 0) return 0
    const pct = ((mrp - price) / mrp) * 100
    return Math.max(0, Math.round(pct))
  }

  const nextImg = (group, e) => {
    e?.stopPropagation?.()
    setCarouselIndex((prev) => {
      const i = prev[group.key] || 0
      const n = group.images?.length || 1
      return { ...prev, [group.key]: (i + 1) % n }
    })
  }

  const prevImg = (group, e) => {
    e?.stopPropagation?.()
    setCarouselIndex((prev) => {
      const i = prev[group.key] || 0
      const n = group.images?.length || 1
      return { ...prev, [group.key]: (i - 1 + n) % n }
    })
  }

  const handleCardClick = (group) => {
    const idx = carouselIndex[group.key] || 0
    const enriched = { ...group, activeIndex: idx }
    onProductClick(enriched)
  }

  const userLabel = userType === 'B2B' ? 'B2B view' : 'Retail view'

  return (
    <section className="kids-section4">
      <div className="section-head">
        <div className="section-head-left">
          <h2>Kids Collection</h2>
          <p className="section-sub">Playful looks for every little moment</p>
        </div>
        <div className="section-head-right">
          <span className="count">{grouped.length} items</span>
          <span className="user-pill">{userLabel}</span>
        </div>
      </div>

      {loading ? (
        <div className="state-card">Loading products…</div>
      ) : error ? (
        <div className="state-card error-state">{error}</div>
      ) : !grouped.length ? (
        <div className="state-card">No products found</div>
      ) : (
        <div className="kids-section4-grid">
          {grouped.map((group, index) => {
            const liked = likedKeys.has(keyFor(group))
            const idx = carouselIndex[group.key] || 0
            const imgSrc =
              group.images?.[idx] ||
              (group.ean_code ? cloudinaryUrlByEan(group.ean_code) : '') ||
              DEFAULT_IMG
            const total = group.images?.length || 1
            const discount = discountPct(group)
            const hasVariants = group.variants && group.variants.length > 1
            const isOutOfStock = group.is_out_of_stock

            return (
              <div
                key={group.key || index}
                className={`kids-section4-card${isOutOfStock ? ' out-of-stock' : ''}`}
                onClick={() => handleCardClick(group)}
              >
                <div className="kids-section4-img">
                  {discount > 0 && (
                    <div className="discount-ribbon">
                      <span>{discount}% OFF</span>
                    </div>
                  )}
                  {hasVariants && (
                    <div className="variant-pill">
                      {group.variants.length} sizes
                    </div>
                  )}
                  <img
                    src={imgSrc}
                    alt={group.product_name}
                    className="fade-image"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = DEFAULT_IMG
                    }}
                  />
                  {isOutOfStock && (
                    <div className="out-of-stock-overlay">
                      <span>Out of Stock</span>
                    </div>
                  )}
                  {total > 1 && (
                    <>
                      <button
                        className="carousel-arrow left"
                        onClick={(e) => prevImg(group, e)}
                        aria-label="Previous"
                      >
                        <FaChevronLeft />
                      </button>
                      <button
                        className="carousel-arrow right"
                        onClick={(e) => nextImg(group, e)}
                        aria-label="Next"
                      >
                        <FaChevronRight />
                      </button>
                      <div className="carousel-dots">
                        {group.images.map((_, i) => (
                          <span
                            key={i}
                            className={i === idx ? 'dot active' : 'dot'}
                            onClick={(e) => {
                              e.stopPropagation()
                              setCarouselIndex((prev) => ({ ...prev, [group.key]: i }))
                            }}
                          />
                        ))}
                      </div>
                      <div className="carousel-count">
                        {idx + 1}/{total}
                      </div>
                    </>
                  )}
                  <div
                    className="love-icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleLike(group)
                    }}
                  >
                    {liked ? (
                      <FaHeart style={{ color: 'gold', fontSize: '20px' }} />
                    ) : (
                      <FaRegHeart style={{ color: 'gold', fontSize: '20px' }} />
                    )}
                  </div>
                </div>

                <div className="kids-section4-body">
                  <div className="brand-row">
                    <h4 className="brand-name">{group.brand}</h4>
                    <span className="brand-chip">New in</span>
                  </div>
                  <h5 className="product-name">{group.product_name}</h5>
                  <div className="card-price-row">
                    <span className="card-offer-price">
                      ₹{Number(priceForUser(group) || 0).toFixed(2)}
                    </span>
                    <span className="card-original-price">
                      ₹{Number(mrpForUser(group) || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="kids-section4-meta">
                    <span className="price-type">
                      {userType === 'B2B' ? 'Best B2B margin' : 'Inclusive of all taxes'}
                    </span>
                    {discount > 0 && (
                      <span className="saving-text">You save {discount}%</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
