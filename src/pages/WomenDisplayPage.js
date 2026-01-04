import React, { useMemo, useState, useEffect } from 'react'
import './WomenDisplayPage.css'
import { FaHeart, FaRegHeart, FaChevronLeft, FaChevronRight } from 'react-icons/fa'

const CLOUD_NAME = 'deymt9uyh'

const DEFAULT_IMG_BY_GENDER = {
  WOMEN: '/images/women/women20.jpeg',
  MEN: '/images/men/mens13.jpeg',
  KIDS: '/images/kids/kids-girls-frock.jpg',
  _: '/images/women/women20.jpeg'
}

function cloudinaryUrlByEan(ean) {
  if (!ean) return ''
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto/products/${ean}`
}

function uniqByKey(arr, keyFn) {
  const seen = new Set()
  const out = []
  for (const x of arr || []) {
    const k = keyFn(x)
    if (!k) continue
    if (seen.has(k)) continue
    seen.add(k)
    out.push(x)
  }
  return out
}

function isRealRemoteImage(src) {
  if (!src) return false
  const s = String(src)
  return s.startsWith('http://') || s.startsWith('https://')
}

function uniqNonEmptyStrings(list) {
  const seen = new Set()
  const out = []
  for (const v of list || []) {
    const s = String(v || '').trim()
    if (!s) continue
    if (seen.has(s)) continue
    seen.add(s)
    out.push(s)
  }
  return out
}

function groupProductsByColor(products) {
  const byKey = new Map()
  for (const p of products || []) {
    if (!p) continue
    const baseKey = [p.product_name || '', p.brand || '', p.color || '', p.gender || ''].join('||')
    const key = baseKey.trim() || `__fallback__:${p.ean_code || p.product_id || p.id || Math.random()}`
    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        color: p.color,
        brand: p.brand,
        product_name: p.product_name,
        gender: p.gender,
        price_fields: {
          original_price_b2c: p.original_price_b2c,
          final_price_b2c: p.final_price_b2c,
          original_price_b2b: p.original_price_b2b,
          final_price_b2b: p.final_price_b2b,
          mrp: p.mrp,
          sale_price: p.sale_price
        },
        rep: p,
        variants: []
      })
    }
    byKey.get(key).variants.push(p)
  }

  const out = []
  for (const g of byKey.values()) {
    const hasStockInfo = g.variants.some(
      (v) => v.in_stock !== undefined || v.available_qty !== undefined || v.on_hand !== undefined
    )

    const allVariantsOutOfStock = g.variants.every((v) => {
      const qty = Number(v.available_qty !== undefined ? v.available_qty : v.on_hand !== undefined ? v.on_hand : 0)
      if (v.is_out_of_stock === true) return true
      if (v.is_out_of_stock === false) return false
      if (v.in_stock === true) return false
      if (v.in_stock === false) return qty <= 0
      return qty <= 0
    })

    const isOutOfStock = hasStockInfo ? allVariantsOutOfStock : false

    const imgsRaw = g.variants.map((v) => {
      const ean = String(v.ean_code || '').trim()
      const src = (v.image_url || (ean ? cloudinaryUrlByEan(ean) : '') || '').trim()
      return {
        src,
        ean_code: ean,
        product_id: v.product_id ?? v.id,
        color: v.color ?? v.colour ?? g.color ?? '',
        variant: v
      }
    })

    const imgs = uniqByKey(
      imgsRaw.filter((x) => isRealRemoteImage(x.src) && x.ean_code),
      (x) => `${x.ean_code}::${x.src}`
    )

    const missingEanLabel = uniqNonEmptyStrings(g.variants.map((v) => v?.ean_code)).join(', ')

    out.push({
      ...g,
      images: imgs,
      ean_code: imgs[0]?.ean_code || g.variants[0]?.ean_code || '',
      id: g.rep.id,
      product_id: g.rep.product_id,
      brand: g.brand || g.rep.brand,
      product_name: g.product_name || g.rep.product_name,
      is_out_of_stock: isOutOfStock,
      has_matching_images: imgs.length > 0,
      missing_ean_label: missingEanLabel
    })
  }
  return out
}

export default function WomenDisplayPage({
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

  const groupedRaw = useMemo(() => groupProductsByColor(products || []), [products])

  const grouped = useMemo(() => {
    const list = [...(groupedRaw || [])]
    list.sort((a, b) => {
      const aHas = a?.has_matching_images ? 1 : 0
      const bHas = b?.has_matching_images ? 1 : 0
      if (aHas !== bHas) return bHas - aHas
      return String(a?.product_name || '').localeCompare(String(b?.product_name || ''))
    })
    return list
  }, [groupedRaw])

  useEffect(() => {
    const init = {}
    for (const g of grouped) init[g.key] = 0
    setCarouselIndex(init)
  }, [grouped])

  const getPriceFields = (g) => {
    const p = g.price_fields || g || {}
    const num = (v) => {
      const n = Number(v)
      return Number.isFinite(n) && n > 0 ? n : 0
    }
    if (userType === 'B2B') {
      const offerCandidates = [p.final_price_b2b, p.sale_price, p.mrp, p.original_price_b2b, p.original_price_b2c]
      const mrpCandidates = [p.mrp, p.original_price_b2b, p.original_price_b2c, p.final_price_b2b, p.sale_price]
      const offer = offerCandidates.map(num).find((v) => v > 0) || 0
      const mrp = mrpCandidates.map(num).find((v) => v > 0) || offer
      return { offer, mrp }
    }
    const offerCandidates = [p.final_price_b2c, p.sale_price, p.mrp, p.original_price_b2c]
    const mrpCandidates = [p.mrp, p.original_price_b2c, p.final_price_b2c, p.sale_price]
    const offer = offerCandidates.map(num).find((v) => v > 0) || 0
    const mrp = mrpCandidates.map(num).find((v) => v > 0) || offer
    return { offer, mrp }
  }

  const priceForUser = (g) => getPriceFields(g).offer
  const mrpForUser = (g) => getPriceFields(g).mrp

  const discountPct = (g) => {
    const { offer, mrp } = getPriceFields(g)
    if (!mrp || mrp <= 0) return 0
    if (!offer || offer <= 0 || offer >= mrp) return 0
    const pct = ((mrp - offer) / mrp) * 100
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
    const active = group.images?.[idx] || group.images?.[0] || null
    const rep = active?.variant || group.variants?.[0] || group.rep || group
    const payload = {
      ...rep,
      ean_code: active?.ean_code || rep.ean_code || group.ean_code,
      image_url: active?.src || rep.image_url,
      variants: group.variants,
      images: (group.images || []).map((x) => x.src)
    }
    onProductClick(payload)
  }

  const userLabel = userType === 'B2B' ? 'B2B view' : 'Retail view'

  const getImgForGroup = (group, idx) => {
    const img = group.images?.[idx]?.src
    if (img) return img
    const gender = group.gender || group.rep?.gender || 'WOMEN'
    return DEFAULT_IMG_BY_GENDER[gender] || DEFAULT_IMG_BY_GENDER._
  }

  const canLike = (active) => {
    return !!(active?.ean_code && isRealRemoteImage(active?.src))
  }

  return (
    <section className="womens-section4">
      <div className="section-head">
        <div className="section-head-left">
          <h2>Women’s Collection</h2>
          <p className="section-sub">Soft fabrics, sharp fits, all-day comfort</p>
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
        <div className="womens-section4-grid">
          {grouped.map((group, index) => {
            const idx = carouselIndex[group.key] || 0
            const active = group.images?.[idx] || group.images?.[0] || null
            const liked = likedKeys.has(
              keyFor({ product_id: group.product_id || group.id, ean_code: active?.ean_code || '' })
            )
            const imgSrc = getImgForGroup(group, idx)
            const total = group.images?.length || 1
            const discount = discountPct(group)
            const hasVariants = group.variants && group.variants.length > 1
            const isOutOfStock = group.is_out_of_stock
            const likeEnabled = canLike(active)
            const showMissingEan = !group.has_matching_images && !!String(group.missing_ean_label || '').trim()

            return (
              <div
                key={group.key || index}
                className={`womens-section4-card${isOutOfStock ? ' out-of-stock' : ''}`}
                onClick={() => handleCardClick(group)}
              >
                <div className="womens-section4-img">
                  {showMissingEan && (
                    <div className="missing-ean-pill">
                      <span>Missing image for EAN: {group.missing_ean_label}</span>
                    </div>
                  )}

                  {discount > 0 && (
                    <div className="discount-ribbon">
                      <span>{discount}% OFF</span>
                    </div>
                  )}

                  {hasVariants && <div className="variant-pill">{group.variants.length} sizes</div>}

                  <img
                    src={imgSrc}
                    alt={group.product_name}
                    className="fade-image"
                    onError={(e) => {
                      const gender = group.gender || group.rep?.gender || 'WOMEN'
                      const fallback = DEFAULT_IMG_BY_GENDER[gender] || DEFAULT_IMG_BY_GENDER._
                      if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback
                    }}
                  />

                  {isOutOfStock && (
                    <div className="out-of-stock-overlay">
                      <span>Out of Stock</span>
                    </div>
                  )}

                  {total > 1 && (
                    <>
                      <button className="carousel-arrow left" onClick={(e) => prevImg(group, e)} aria-label="Previous">
                        <FaChevronLeft />
                      </button>
                      <button className="carousel-arrow right" onClick={(e) => nextImg(group, e)} aria-label="Next">
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
                    className={`love-icon${likeEnabled ? '' : ' disabled'}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!likeEnabled) return
                      onToggleLike(group, {
                        ean_code: active.ean_code,
                        image_url: active.src,
                        color: active.color || group.color || ''
                      })
                    }}
                  >
                    {liked ? (
                      <FaHeart style={{ color: 'gold', fontSize: '20px' }} />
                    ) : (
                      <FaRegHeart style={{ color: 'gold', fontSize: '20px' }} />
                    )}
                  </div>
                </div>

                <div className="womens-section4-body">
                  <div className="brand-row">
                    <h4 className="brand-name">{group.brand}</h4>
                    <span className="brand-chip">New in</span>
                  </div>
                  <h5 className="product-name">{group.product_name}</h5>
                  <div className="card-price-row">
                    <span className="card-offer-price">₹{Number(priceForUser(group) || 0).toFixed(2)}</span>
                    <span className="card-original-price">₹{Number(mrpForUser(group) || 0).toFixed(2)}</span>
                  </div>
                  <div className="womens-section4-meta">
                    <span className="price-type">{userType === 'B2B' ? 'Best B2B margin' : 'Inclusive of all taxes'}</span>
                    {discount > 0 && <span className="saving-text">You save {discount}%</span>}
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
