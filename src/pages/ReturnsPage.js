import React, { useEffect, useMemo, useState } from 'react'
import './ReturnsPage.css'
import Navbar from './Navbar'
import Footer from './Footer'
import { useLocation, useNavigate } from 'react-router-dom'

const DEFAULT_API_BASE = 'https://taras-kart-backend.vercel.app'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = API_BASE_RAW.replace(/\/+$/, '')

const STATUS_MAP = {
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  'order placed': 'Order Placed',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  'out for delivery': 'Out For Delivery',
  rto: 'RTO'
}

function normalizeStatus(raw) {
  if (!raw) return 'Order Placed'
  const t = String(raw).toLowerCase()
  for (const key of Object.keys(STATUS_MAP)) {
    if (t.includes(key)) return STATUS_MAP[key]
  }
  return 'Order Placed'
}

function isPrepaidOrder(order) {
  const pay = String(order.payment_status || order.cancellation_payment_type || '').toUpperCase()
  if (!pay) return false
  if (pay.startsWith('PAID')) return true
  if (pay.startsWith('PENDING')) return true
  if (pay === 'PREPAID') return true
  return false
}

function firstImg(items) {
  if (!Array.isArray(items) || !items.length) return ''
  const img = items.find((it) => it?.image_url)?.image_url || ''
  return typeof img === 'string' ? img : ''
}

function firstName(items) {
  if (!Array.isArray(items) || !items.length) return ''
  return items[0]?.product_name || items[0]?.name || ''
}

function useQuery() {
  const location = useLocation()
  return useMemo(() => new URLSearchParams(location.search), [location.search])
}

function isApprovedRefundRow(r) {
  const s = String(r?.status || '').toLowerCase()
  return s.includes('approved') || s.includes('accept') || s.includes('processed') || s.includes('success')
}

export default function ReturnsPage({ embedded = false, user }) {
  const query = useQuery()
  const navigate = useNavigate()

  const [orders, setOrders] = useState([])
  const [eligibility, setEligibility] = useState({})
  const [returnRequests, setReturnRequests] = useState({})
  const [loading, setLoading] = useState(true)
  const [eligLoading, setEligLoading] = useState(false)
  const [error, setError] = useState('')

  const [loginEmail, setLoginEmail] = useState(sessionStorage.getItem('userEmail') || '')
  const [loginMobile, setLoginMobile] = useState(sessionStorage.getItem('userMobile') || '')

  const [selectedReturnOrderId, setSelectedReturnOrderId] = useState('')

  const email = (user?.email || loginEmail || '').trim()
  const mobile = (user?.phone || user?.mobile || loginMobile || '').trim()

  const saleIdFromCancel = query.get('saleId') || ''
  const [selectedCancelOrderId, setSelectedCancelOrderId] = useState(saleIdFromCancel || '')

  useEffect(() => {
    const refreshFromStorage = () => {
      setLoginEmail(sessionStorage.getItem('userEmail') || '')
      setLoginMobile(sessionStorage.getItem('userMobile') || '')
    }
    refreshFromStorage()
    window.addEventListener('focus', refreshFromStorage)
    return () => window.removeEventListener('focus', refreshFromStorage)
  }, [])

  useEffect(() => {
    if (saleIdFromCancel) setSelectedCancelOrderId(saleIdFromCancel)
  }, [saleIdFromCancel])

  useEffect(() => {
    const fetchOrders = async () => {
      if (!email && !mobile) {
        setLoading(false)
        setOrders([])
        return
      }
      setLoading(true)
      setError('')
      try {
        const q = new URLSearchParams()
        if (email) q.set('email', email)
        if (mobile) q.set('mobile', mobile)

        const res = await fetch(`${API_BASE}/api/sales/web/by-user?${q.toString()}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Unable to load orders')

        const data = await res.json()
        const list = Array.isArray(data) ? data : []

        const mapped = list.map((s) => {
          const img = firstImg(s.items)
          const pname = firstName(s.items)
          const itemCount = Array.isArray(s.items) ? s.items.length : 0
          return {
            id: s.id,
            status: s.status || 'PLACED',
            payment_status: s.payment_status || '',
            cancellation_payment_type: s.cancellation_payment_type || '',
            cancellation_reason: s.cancellation_reason || '',
            cancellation_source: s.cancellation_source || '',
            cancellation_created_at: s.cancellation_created_at || '',
            created_at: s.created_at || '',
            name: pname && itemCount > 1 ? `${pname} +${itemCount - 1}` : pname || `Order #${s.id}`,
            image: img,
            items: Array.isArray(s.items) ? s.items : [],
            totals: s.totals || null
          }
        })
        setOrders(mapped)
      } catch (e) {
        setError(e.message || 'Could not load your orders')
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [email, mobile])

  useEffect(() => {
    const checkEligibility = async () => {
      if (!orders.length) {
        setEligibility({})
        return
      }
      setEligLoading(true)
      const map = {}
      try {
        for (const o of orders) {
          try {
            const res = await fetch(`${API_BASE}/api/returns/eligibility/${o.id}`, { cache: 'no-store' })
            if (!res.ok) {
              const data = await res.json().catch(() => ({}))
              map[o.id] = data || { ok: false }
              continue
            }
            const data = await res.json()
            map[o.id] = data
          } catch {
            map[o.id] = { ok: false, reason: 'Unable to check eligibility right now' }
          }
        }
        setEligibility(map)
      } finally {
        setEligLoading(false)
      }
    }
    checkEligibility()
  }, [orders])

  async function loadReturnRequestsForSale(saleId) {
    try {
      const res = await fetch(`${API_BASE}/api/returns/by-sale/${saleId}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      const rows = Array.isArray(data.rows) ? data.rows : []
      setReturnRequests((prev) => ({ ...prev, [saleId]: rows }))
    } catch {}
  }

  function formatDate(dt) {
    if (!dt) return ''
    const d = new Date(dt)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleString('en-IN')
  }

  const cancelledPrepaidOrders = useMemo(() => {
    return orders.filter((o) => normalizeStatus(o.status) === 'Cancelled' && isPrepaidOrder(o))
  }, [orders])

  const returnEligibleOrders = useMemo(() => {
    return orders.filter((o) => {
      const info = eligibility[o.id]
      return info && info.ok
    })
  }, [orders, eligibility])

  useEffect(() => {
    const seed = async () => {
      for (const o of cancelledPrepaidOrders) {
        await loadReturnRequestsForSale(o.id)
      }
    }
    if (cancelledPrepaidOrders.length) seed()
  }, [cancelledPrepaidOrders])

  const refundApprovedBySale = useMemo(() => {
    const map = {}
    for (const saleId of Object.keys(returnRequests)) {
      const rows = returnRequests[saleId] || []
      map[saleId] = rows.some((r) => isApprovedRefundRow(r))
    }
    return map
  }, [returnRequests])

  const inner = (
    <div className="returns-container">
      {!email && !mobile ? (
        <div className="returns-empty-card">
          <h2 className="returns-empty-title">Sign in to manage returns & refunds</h2>
          <p className="returns-empty-subtitle">Use the same email or mobile number that you used at checkout.</p>
          <button className="btn-outline" onClick={() => navigate('/profile')}>
            Sign In
          </button>
        </div>
      ) : loading ? (
        <div className="returns-loading">
          <div className="returns-spinner" />
          <p>Loading your eligible orders…</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="returns-empty-card">
          <h2 className="returns-empty-title">No orders found</h2>
          <p className="returns-empty-subtitle">Once you place an order, you can manage returns and refunds from here.</p>
          <button className="btn-outline" onClick={() => navigate('/')}>
            Start Shopping
          </button>
          {error ? <p className="returns-error">{error}</p> : null}
        </div>
      ) : (
        <>
          <header className="returns-header">
            <div className="returns-header-main">
              <h2>Returns & Refunds</h2>
              <p>View orders that are eligible for return or refund. Delivered orders are typically returnable within 7 days of delivery.</p>
            </div>
            <div className="returns-header-badges">{eligLoading && <span className="returns-pill">Checking eligibility…</span>}</div>
          </header>

          <section className="returns-section">
            <div className="returns-section-title-row">
              <h3>Refunds for cancelled orders</h3>
              <span className="returns-count-badge">{cancelledPrepaidOrders.length}</span>
            </div>
            <p className="returns-section-subtitle">
              These are prepaid orders that were cancelled. If your refund is approved, you can check its status here.
            </p>

            {cancelledPrepaidOrders.length === 0 ? (
              <div className="returns-list-empty">
                <p>No cancelled prepaid orders found.</p>
              </div>
            ) : (
              <div className="returns-grid">
                {cancelledPrepaidOrders.map((order) => {
                  const st = normalizeStatus(order.status)
                  const approved = !!refundApprovedBySale[String(order.id)]
                  const btnText = approved ? 'Check status' : 'Get refund'
                  return (
                    <div key={order.id} className="returns-card">
                      <div className="returns-card-imagewide">
                        {order.image ? <img src={order.image} alt={order.name} loading="lazy" /> : <div className="returns-ph" />}
                        <div className="returns-card-badges">
                          <span className="returns-status-pill cancelled">{st}</span>
                          {/*<span className="returns-order-pill">#{order.id}</span> */}
                        </div>
                      </div>

                      <div className="returns-card-body">
                        <div className="returns-card-title">{order.name}</div>

                        <div className="returns-card-meta">
                          {order.created_at ? <span>Placed {formatDate(order.created_at)}</span> : null}
                          {order.cancellation_created_at ? <span>Cancelled {formatDate(order.cancellation_created_at)}</span> : null}
                        </div>

                        {order.cancellation_reason ? <div className="returns-card-note">Reason: {order.cancellation_reason}</div> : null}

                        <div className="returns-card-actions returns-card-actions-two">
                          <button
                            type="button"
                            className="returns-primary-btn"
                            onClick={() => navigate(`/returns/${order.id}/refund?kind=refund`)}
                          >
                            {btnText}
                          </button>
                          <button type="button" className="returns-secondary-btn" onClick={() => navigate(`/order/${order.id}`)}>
                            View order
                          </button>
                        </div>

                        {returnRequests[order.id] ? (
                          <div className="returns-mini-status">
                            {returnRequests[order.id].length ? (
                              <>
                                <span className="returns-mini-label">Latest:</span>
                                <span className="returns-mini-value">{String(returnRequests[order.id][0]?.status || 'REQUESTED')}</span>
                                <span className="returns-mini-dot">•</span>
                                <span className="returns-mini-date">{formatDate(returnRequests[order.id][0]?.created_at)}</span>
                              </>
                            ) : (
                              <span className="returns-mini-muted">No refund requests found yet.</span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="returns-section">
            <div className="returns-section-title-row">
              <h3>Return / Replace delivered orders</h3>
              <span className="returns-count-badge">{returnEligibleOrders.length}</span>
            </div>
            <p className="returns-section-subtitle">
              You can raise a return or replacement request for delivered orders that are within the eligible return window.
            </p>

            {returnEligibleOrders.length === 0 ? (
              <div className="returns-list-empty">
                <p>No delivered orders are currently eligible for return.</p>
              </div>
            ) : (
              <div className="returns-grid">
                {returnEligibleOrders.map((order) => {
                  const st = normalizeStatus(order.status)
                  const info = eligibility[order.id]
                  const reqs = returnRequests[order.id] || []
                  const latestRequest = reqs[0] || null
                  return (
                    <div key={order.id} className="returns-card">
                      <div className="returns-card-imagewide">
                        {order.image ? <img src={order.image} alt={order.name} loading="lazy" /> : <div className="returns-ph" />}
                        <div className="returns-card-badges">
                          <span className="returns-status-pill delivered">{st}</span>
                          <span className="returns-order-pill">#{order.id}</span>
                        </div>
                      </div>

                      <div className="returns-card-body">
                        <div className="returns-card-title">{order.name}</div>

                        <div className="returns-card-meta">
                          {order.created_at ? <span>Placed {formatDate(order.created_at)}</span> : null}
                          {info && !info.ok && info.reason ? <span className="returns-meta-warning">{info.reason}</span> : null}
                        </div>

                        {latestRequest ? (
                          <div className="returns-card-note">
                            Latest request: <span className="returns-highlight">{latestRequest.status || 'REQUESTED'}</span> on{' '}
                            {formatDate(latestRequest.created_at)}
                          </div>
                        ) : null}

                        <div className="returns-card-actions">
                          <button
                            type="button"
                            className="returns-primary-btn ghost"
                            onClick={() => navigate(`/returns/${order.id}/refund?kind=return`)}
                          >
                            Return / Replace
                          </button>
                          <button
                            type="button"
                            className="returns-secondary-btn"
                            onClick={() => {
                              loadReturnRequestsForSale(order.id)
                              setSelectedReturnOrderId(order.id)
                            }}
                          >
                            View status
                          </button>
                          <button type="button" className="returns-link-btn" onClick={() => navigate(`/order/${order.id}`)}>
                            View order
                          </button>
                        </div>

                        {selectedReturnOrderId === order.id && returnRequests[order.id] && (
                          <div className="returns-status-timeline">
                            {returnRequests[order.id].length === 0 ? (
                              <p>No return requests found for this order yet.</p>
                            ) : (
                              <>
                                <div className="returns-status-title">Return history</div>
                                <ul className="returns-status-list">
                                  {returnRequests[order.id].map((r) => (
                                    <li key={r.id} className={`status-${(r.status || '').toLowerCase()}`}>
                                      <div className="status-main">
                                        <span className="status-pill">{r.status}</span>
                                        <span className="status-date">{formatDate(r.created_at)}</span>
                                      </div>
                                      {r.reason ? <div className="status-reason">Reason: {r.reason}</div> : null}
                                      {r.notes ? <div className="status-notes">{r.notes}</div> : null}
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )

  if (embedded) return <div className="returns-embedded">{inner}</div>

  return (
    <div className="returns-page">
      <Navbar />
      {inner}
      <Footer />
    </div>
  )
}
