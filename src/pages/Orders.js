import React, { useEffect, useMemo, useState } from 'react'
import './Orders.css'
import { useNavigate } from 'react-router-dom'
import { FaChevronRight } from 'react-icons/fa'

const DEFAULT_API_BASE = 'https://sri-swarnakranthi-enterprises-backe.vercel.app'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = String(API_BASE_RAW || DEFAULT_API_BASE).replace(/\/+$/, '')

const STATUS_ORDER = ['Order Placed', 'Confirmed', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered', 'RTO', 'Cancelled']

function normalizeStatus(s) {
  if (!s) return 'Order Placed'
  const t = String(s).toLowerCase()
  if (t.includes('cancel')) return 'Cancelled'
  if (t.includes('rto')) return 'RTO'
  if (t.includes('deliver')) return 'Delivered'
  if (t.includes('out for')) return 'Out For Delivery'
  if (t.includes('ship') || t.includes('dispatch') || t.includes('in transit')) return 'Shipped'
  if (t.includes('pack')) return 'Packed'
  if (t.includes('confirm') || t.includes('process') || t.includes('accept')) return 'Confirmed'
  if (t.includes('place')) return 'Order Placed'
  return 'Order Placed'
}

function byNewest(a, b) {
  const ta = a.created_at ? new Date(a.created_at).getTime() : 0
  const tb = b.created_at ? new Date(b.created_at).getTime() : 0
  if (tb !== ta) return tb - ta
  return Number(b.id || 0) - Number(a.id || 0)
}

function firstItem(items) {
  if (!Array.isArray(items) || !items.length) return null
  return items[0] || null
}

function firstImg(items) {
  if (!Array.isArray(items) || !items.length) return ''
  const img = items.find((it) => it?.image_url)?.image_url || items[0]?.image_url || ''
  return typeof img === 'string' ? img : ''
}

function firstName(items) {
  const it = firstItem(items)
  if (!it) return ''
  return it?.product_name || it?.name || it?.title || ''
}

function firstBrand(items) {
  const it = firstItem(items)
  if (!it) return ''
  return it?.brand || it?.brand_name || it?.brandName || ''
}

function firstColor(items) {
  const it = firstItem(items)
  if (!it) return ''
  return it?.color || it?.colour || it?.variant_color || it?.variantColor || ''
}

const normMobile = (v) => String(v || '').replace(/\D/g, '').slice(0, 10)

const Orders = ({ user }) => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [error, setError] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginMobile, setLoginMobile] = useState('')

  useEffect(() => {
    const refreshFromStorage = () => {
      const e = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail') || ''
      const m = sessionStorage.getItem('userMobile') || localStorage.getItem('userMobile') || ''
      setLoginEmail(String(e || '').trim())
      setLoginMobile(normMobile(m))
    }
    refreshFromStorage()
    window.addEventListener('focus', refreshFromStorage)
    window.addEventListener('storage', refreshFromStorage)
    return () => {
      window.removeEventListener('focus', refreshFromStorage)
      window.removeEventListener('storage', refreshFromStorage)
    }
  }, [])

  const email = String(user?.email || loginEmail || '').trim()
  const mobile = normMobile(user?.phone || user?.mobile || loginMobile || '')

  const money = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0))

  const mapOrders = (rawList) => {
    const list = Array.isArray(rawList) ? rawList : []
    return list
      .map((s) => {
        const items = Array.isArray(s.items) ? s.items : Array.isArray(s.order_items) ? s.order_items : []
        const img = firstImg(items)
        const pname = firstName(items)
        const brand = firstBrand(items)
        const color = firstColor(items)
        const itemCount = items.reduce((a, it) => a + Number(it?.qty ?? it?.quantity ?? 1), 0)
        const st = normalizeStatus(s.order_status || s.status || 'placed')
        const payable =
          Number(s?.total_amount ?? 0) ||
          Number(s?.totals?.payable ?? 0) ||
          Number(s?.totals?.total ?? 0) ||
          Number(s?.total ?? 0) ||
          0

        return {
          id: s.id ?? s.order_id ?? null,
          created_at: s.created_at ?? s.createdAt ?? null,
          status: st,
          rawStatus: s.order_status || s.status || '',
          name: pname && itemCount > 1 ? `${pname} +${itemCount - 1}` : pname || 'Order',
          brand,
          color,
          image: img,
          offerPrice: payable,
          itemsCount: itemCount
        }
      })
      .filter((x) => x.id)
      .sort(byNewest)
  }

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      setError('')
      try {
        if (!email && !mobile) {
          setOrders([])
          setLoading(false)
          return
        }

        const q = new URLSearchParams()
        if (email) q.set('email', email)
        if (mobile) q.set('mobile', mobile)

        const endpoints = [
          `${API_BASE}/api/orders/web/by-user?${q.toString()}`,
          `${API_BASE}/api/orders/by-user?${q.toString()}`,
          `${API_BASE}/api/orders/web/user?${q.toString()}`
        ]

        let data = null
        for (const url of endpoints) {
          try {
            const res = await fetch(url, { cache: 'no-store' })
            const json = await res.json().catch(() => null)
            if (res.ok && json != null) {
              data = json
              break
            }
          } catch {}
        }

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.orders)
              ? data.orders
              : []

        setOrders(mapOrders(list))
      } catch {
        setOrders([])
        setError('Could not load your orders right now.')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [email, mobile])

  const statusList = useMemo(() => ['All', ...STATUS_ORDER], [])

  const filtered = useMemo(() => {
    if (filter === 'All') return orders
    return orders.filter((o) => o.status === filter)
  }, [orders, filter])

  if (!email && !mobile) {
    return (
      <div className="orders-page">
        <div className="orders-container">
          <div className="orders-hero">
            <div className="orders-hero-left">
              <div className="orders-kicker">Orders</div>
              <h2 className="orders-hero-title">Sign in to see your purchases</h2>
              <p className="orders-hero-subtitle">Use the same email or mobile number you used at checkout.</p>
              <button className="btn-primary" onClick={() => navigate('/profile')}>
                Sign In
              </button>
            </div>
            <div className="orders-hero-right">
              <div className="orders-orb" />
              <img src="/images/no-order.svg" alt="Sign In" className="orders-hero-img" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="orders-page">
        <div className="orders-container">
          <div className="orders-topbar skeleton-top">
            <div className="sk-h shimmer" />
            <div className="sk-s shimmer" />
          </div>
          <div className="skeleton-list">
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="skeleton-card" key={i}>
                <div className="sk-img shimmer" />
                <div className="sk-body">
                  <div className="sk-line shimmer" />
                  <div className="sk-line short shimmer" />
                  <div className="sk-line tiny shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        {filtered.length === 0 ? (
          <div className="orders-empty-card">
            <div className="orders-empty-top">
              <div className="orders-empty-icon">
                <span />
              </div>
              <div>
                <h2 className="orders-empty-title">No orders yet</h2>
                <p className="orders-empty-subtitle">Place an order and it will appear here.</p>
              </div>
            </div>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Start Shopping
            </button>
            {error ? <p className="orders-error">{error}</p> : null}
          </div>
        ) : (
          <>
            <div className="orders-topbar">
              <div className="orders-header">
                <div className="orders-title-wrap">
                  <h3>Your Orders</h3>
                  <p className="orders-sub">Track your purchases in one place</p>
                </div>
                <span className="orders-count">{filtered.length}</span>
              </div>

              <div className="orders-actions">
                <div className="orders-filter">
                  <label>Status</label>
                  <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                    {statusList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="orders-list">
              {filtered.map((order) => {
                const st = order.status
                const statusClass = st.replace(/\s+/g, '-').toLowerCase()
                const isCancelled = st === 'Cancelled'
                return (
                  <div
                    key={order.id}
                    className={`orders-card ${isCancelled ? 'is-cancelled' : ''}`}
                    onClick={() => navigate(`/order/${order.id}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="orders-media">
                      {order.image ? <img src={order.image} alt={order.name || 'Item'} loading="lazy" /> : <div className="orders-ph" />}
                      <div className={`orders-badge orders-badge--${statusClass}`}>{st}</div>
                      <div className="orders-glow" />
                    </div>

                    <div className="orders-body">
                      <div className="orders-main">
                        <div className="orders-row-top">
                          <div className="orders-text">
                            {order.brand ? <div className="orders-brand">{order.brand}</div> : null}
                            <div className="orders-name">{order.name}</div>
                          </div>
                          <div className="orders-arrow">
                            <FaChevronRight />
                          </div>
                        </div>

                        {order.color ? (
                          <div className="orders-meta">
                            <span className="orders-meta-chip">
                              <span className="dot" />
                              {order.color}
                            </span>
                            <span className="orders-meta-chip subtle">
                              {order.itemsCount} {order.itemsCount > 1 ? 'items' : 'item'}
                            </span>
                          </div>
                        ) : (
                          <div className="orders-meta">
                            <span className="orders-meta-chip subtle">
                              {order.itemsCount} {order.itemsCount > 1 ? 'items' : 'item'}
                            </span>
                          </div>
                        )}

                        <div className="orders-price-row">
                          <div className="orders-price">{money(order.offerPrice)}</div>
                          <div className="orders-id">#{String(order.id).slice(-8)}</div>
                        </div>
                      </div>

                      <div className="orders-actions-row" onClick={(e) => e.stopPropagation()}>
                        <button className="btn-outline small" onClick={() => navigate(`/order/${order.id}`)}>
                          View Order
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {error ? (
              <div className="orders-inline-note">
                <span>{error}</span>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

export default Orders
