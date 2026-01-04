import React, { useEffect, useMemo, useRef, useState } from 'react'
import './FilterSidebar.css'
import { FaFilter, FaChevronDown, FaChevronUp } from 'react-icons/fa'

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

const priceBuckets = [
  { label: 'Under ₹500', test: (n) => n < 500 },
  { label: '₹500 - ₹1000', test: (n) => n >= 500 && n <= 1000 },
  { label: '₹1000 - ₹2000', test: (n) => n > 1000 && n <= 2000 },
  { label: 'Above ₹2000', test: (n) => n > 2000 }
]

const discountThresholds = [
  { label: '10% or more', min: 10 },
  { label: '30% or more', min: 30 },
  { label: '50% or more', min: 50 }
]

const ratingThresholds = [
  { label: '4★ & above', min: 4 },
  { label: '3★ & above', min: 3 }
]

const sortOptions = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'priceLowHigh', label: 'Price: Low to High' },
  { key: 'priceHighLow', label: 'Price: High to Low' },
  { key: 'discountHighLow', label: 'Discount: High to Low' },
  { key: 'ratingHighLow', label: 'Rating: High to Low' }
]

const norm = (v) => String(v || '').trim()
const dedupeSort = (arr) =>
  Array.from(new Set(arr.filter(Boolean).map((x) => norm(x)))).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  )

const FilterSidebar = ({ source = [], onFilterChange }) => {
  const [openSection, setOpenSection] = useState(null)
  const [selected, setSelected] = useState({})
  const [pending, setPending] = useState({})
  const [showBar, setShowBar] = useState(true)
  const [facetPool, setFacetPool] = useState([])
  const [sortOpen, setSortOpen] = useState(false)
  const [sortOption, setSortOption] = useState('relevance')
  const wrapRef = useRef(null)
  const lastY = useRef(0)
  const ticking = useRef(false)
  const userType = (localStorage.getItem('userType') || 'B2C').toUpperCase()

  const offerPrice = (p) =>
    Number(userType === 'B2B' ? p.b2b_final_price ?? p.final_price_b2b : p.b2c_final_price ?? p.final_price_b2c) || 0

  const originalPrice = (p) =>
    Number(
      userType === 'B2B'
        ? p.b2b_actual_price ?? p.original_price_b2b ?? 0
        : p.b2c_actual_price ?? p.original_price_b2c ?? 0
    ) || 0

  const discountPct = (p) => {
    const o = originalPrice(p)
    const f = offerPrice(p)
    if (!o) return 0
    const pct = ((o - f) / o) * 100
    return Math.max(0, Math.round(pct))
  }

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products?limit=1000`, { cache: 'no-store' })
        const data = await res.json()
        if (!cancelled) setFacetPool(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setFacetPool([])
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    lastY.current = window.scrollY || window.pageYOffset || 0
    const threshold = 6
    const handleScroll = () => {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        const y = window.scrollY || window.pageYOffset || 0
        const delta = y - lastY.current
        if (y <= 0) {
          setShowBar(true)
        } else if (Math.abs(delta) > threshold) {
          setShowBar(delta < 0)
          lastY.current = y
        }
        ticking.current = false
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpenSection(null)
        setSortOpen(false)
      }
    }
    document.addEventListener('click', onClick, { passive: true })
    return () => document.removeEventListener('click', onClick)
  }, [])

  const unionPool = useMemo(() => {
    if (!Array.isArray(source) || !source.length) return facetPool
    const ids = new Set()
    const merged = []
    ;[...source, ...facetPool].forEach((p) => {
      const k = `${p.id || ''}-${p.product_id || ''}-${p.size || ''}-${p.color || ''}`
      if (ids.has(k)) return
      ids.add(k)
      merged.push(p)
    })
    return merged
  }, [source, facetPool])

  const facets = useMemo(() => {
    const brands = dedupeSort(unionPool.map((p) => p.brand))
    const hasRating = unionPool.some((p) => Number(p.rating ?? p.avgRating ?? 0) > 0)
    const hasStockFacet = unionPool.some((p) => p.in_stock !== undefined || p.available_qty !== undefined)

    const map = {}
    map['categories'] = categories
    if (brands.length) map['brands'] = brands
    map['price'] = priceBuckets.map((b) => b.label)
    map['discount'] = discountThresholds.map((d) => d.label)
    if (hasRating) map['rating'] = ratingThresholds.map((r) => r.label)
    if (hasStockFacet) map['availability'] = ['In stock only']
    return map
  }, [unionPool])

  const applyFilters = (data, filters) => {
    let out = [...data]

    const selCats = filters.categories || []
    if (selCats.length) {
      const set = new Set(selCats.map((c) => c.toLowerCase()))
      out = out.filter((p) => set.has(String(p.category || '').toLowerCase()))
    }

    const selBrands = filters.brands || []
    if (selBrands.length) {
      const set = new Set(selBrands.map((b) => b.toLowerCase()))
      out = out.filter((p) => set.has(String(p.brand || '').toLowerCase()))
    }

    const selPriceLabels = filters.price || []
    if (selPriceLabels.length) {
      out = out.filter((p) => {
        const price = offerPrice(p)
        return selPriceLabels.some((label) => {
          const b = priceBuckets.find((x) => x.label === label)
          return b ? b.test(price) : true
        })
      })
    }

    const selDiscLabels = filters.discount || []
    if (selDiscLabels.length) {
      const mins = selDiscLabels
        .map((lab) => discountThresholds.find((x) => x.label === lab)?.min || 0)
        .filter((n) => n > 0)
      const need = mins.length ? Math.max(...mins) : 0
      if (need > 0) out = out.filter((p) => discountPct(p) >= need)
    }

    const selRatingLabels = filters.rating || []
    if (selRatingLabels.length) {
      const mins = selRatingLabels
        .map((lab) => ratingThresholds.find((x) => x.label === lab)?.min || 0)
        .filter((n) => n > 0)
      const need = mins.length ? Math.max(...mins) : 0
      if (need > 0) {
        out = out.filter((p) => {
          const r = Number(p.rating ?? p.avgRating ?? 0)
          return r >= need
        })
      }
    }

    const selAvailability = filters.availability || []
    if (selAvailability.includes('In stock only')) {
      out = out.filter((p) => {
        const qty = Number(p.available_qty ?? 0)
        if (p.in_stock === true) return true
        if (p.in_stock === false) return qty > 0
        if (!Number.isNaN(qty) && qty > 0) return true
        return p.in_stock === undefined && p.available_qty === undefined
      })
    }

    return out
  }

  const applySort = (data, key) => {
    if (!key || key === 'relevance') return data
    const out = [...data]
    if (key === 'priceLowHigh') {
      out.sort((a, b) => offerPrice(a) - offerPrice(b))
      return out
    }
    if (key === 'priceHighLow') {
      out.sort((a, b) => offerPrice(b) - offerPrice(a))
      return out
    }
    if (key === 'discountHighLow') {
      out.sort((a, b) => discountPct(b) - discountPct(a))
      return out
    }
    if (key === 'ratingHighLow') {
      out.sort((a, b) => {
        const ra = Number(a.rating ?? a.avgRating ?? 0)
        const rb = Number(b.rating ?? b.avgRating ?? 0)
        return rb - ra
      })
      return out
    }
    return out
  }

  const runFiltersAndSort = (filters, sortKey) => {
    const filtered = applyFilters(source, filters || {})
    const sorted = applySort(filtered, sortKey)
    onFilterChange(sorted)
  }

  const sectionCount = (k) => (selected[k]?.length ? selected[k].length : 0)

  const openAndLoadPending = (key) => {
    const next = openSection === key ? null : key
    if (next) {
      const deep = JSON.parse(JSON.stringify(selected || {}))
      setPending(deep)
      setSortOpen(false)
    }
    setOpenSection(next)
  }

  const togglePending = (category, value) => {
    const current = pending[category] || []
    const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    setPending({ ...pending, [category]: updated })
  }

  const applyPending = () => {
    const applied = JSON.parse(JSON.stringify(pending || {}))
    setSelected(applied)
    runFiltersAndSort(applied, sortOption)
    setOpenSection(null)
  }

  const clearSection = () => {
    if (!openSection) return
    const cleared = { ...pending, [openSection]: [] }
    setPending(cleared)
  }

  const resetAll = () => {
    setSelected({})
    setPending({})
    setSortOption('relevance')
    onFilterChange(source)
    setOpenSection(null)
    setSortOpen(false)
  }

  const toggleFiltersMobile = () => {
    if (openSection) {
      setOpenSection(null)
    } else {
      const keys = Object.keys(facets)
      if (!keys.length) return
      const deep = JSON.parse(JSON.stringify(selected || {}))
      setPending(deep)
      setOpenSection(keys[0])
    }
    setSortOpen(false)
  }

  const toggleSortMobile = () => {
    setSortOpen((v) => !v)
    setOpenSection(null)
  }

  const handleSortSelect = (key) => {
    setSortOption(key)
    runFiltersAndSort(selected, key)
    setSortOpen(false)
  }

  return (
    <>
      <div className={`filterbar-wrap ${showBar ? '' : 'hidden'}`} ref={wrapRef}>
        <div className="filter-bar">
          <div className="filter-left">
            <div className="filter-title-wrap">
              <FaFilter className="filter-icon" />
              <h4 className="filter-title">Filters</h4>
              <div className="title-glow"></div>
            </div>
          </div>

          <div className="chips" role="tablist">
            {Object.keys(facets).map((key) => {
              const active = openSection === key
              const count = sectionCount(key)
              return (
                <button
                  key={key}
                  className={`filter-chip ${active ? 'active' : ''}`}
                  aria-expanded={active}
                  onClick={() => openAndLoadPending(key)}
                >
                  <span className="chip-label">{key}</span>
                  {count > 0 && <span className="count-badge">{count}</span>}
                  <span className="chip-chevron">{active ? <FaChevronUp /> : <FaChevronDown />}</span>
                </button>
              )
            })}
          </div>

          <div className="filter-actions">
            <button className="reset-btn" onClick={resetAll}>
              Reset
            </button>
          </div>

          <div className="filter-mobile-controls">
            <button type="button" className="mobile-control-btn" onClick={toggleFiltersMobile}>
              <span className="mobile-control-label">Filters</span>
            </button>
            <button type="button" className="mobile-control-btn" onClick={toggleSortMobile}>
              <span className="mobile-control-label">Sort by</span>
            </button>
          </div>
        </div>

        <div className={`filter-dropdown ${openSection ? 'open' : ''}`}>
          {openSection && (
            <>
              <ul className="filter-options horizontal">
                {facets[openSection].map((item) => {
                  const checked = (pending[openSection] || []).includes(item)
                  return (
                    <li key={item}>
                      <label className="chk">
                        <input type="checkbox" checked={checked} onChange={() => togglePending(openSection, item)} />
                        <span className="box" />
                        <span className="txt">{item}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
              <div className="apply-row">
                <button className="clear-btn" onClick={clearSection}>
                  Clear
                </button>
                <div className="spacer" />
                <button className="apply-btn" onClick={applyPending}>
                  Apply
                </button>
              </div>
            </>
          )}
        </div>

        <div className={`sort-sheet ${sortOpen ? 'open' : ''}`}>
          {sortOpen && (
            <>
              <div className="sort-header">
                <span className="sort-title">Sort by</span>
              </div>
              <ul className="sort-options">
                {sortOptions.map((opt) => (
                  <li key={opt.key}>
                    <button
                      type="button"
                      className={`sort-option ${sortOption === opt.key ? 'active' : ''}`}
                      onClick={() => handleSortSelect(opt.key)}
                    >
                      <span className="sort-option-label">{opt.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div
        className={`filter-overlay ${openSection || sortOpen ? 'show' : ''}`}
        onClick={() => {
          setOpenSection(null)
          setSortOpen(false)
        }}
      />
    </>
  )
}

export default FilterSidebar
