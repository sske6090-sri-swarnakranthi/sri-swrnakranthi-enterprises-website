import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import './OrderDetails.css'
import { FaArrowLeft, FaCheckCircle, FaSyncAlt, FaBoxOpen, FaUserCircle, FaMapMarkerAlt, FaCreditCard } from 'react-icons/fa'

const DEFAULT_API_BASE = 'http://localhost:5000'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = String(API_BASE_RAW || '').replace(/\/+$/, '')

function toUpper(s) {
  return String(s || '').toUpperCase()
}

function isCancelledStatus(status) {
  const s = String(status || '').toLowerCase()
  return s.includes('cancel')
}

function normalizeStatus(s) {
  if (!s) return 'Order Placed'
  const t = String(s).toLowerCase()
  if (t.includes('cancel')) return 'Cancelled'
  if (t.includes('rto')) return 'RTO'
  if (t.includes('deliver')) return 'Delivered'
  if (t.includes('out for')) return 'Out For Delivery'
  if (t.includes('ship') || t.includes('dispatch') || t.includes('in transit')) return 'Shipped'
  if (t.includes('confirm') || t.includes('process') || t.includes('accept')) return 'Confirmed'
  return 'Order Placed'
}

export default function OrderDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const orderId = useMemo(() => String(id || '').trim(), [id])

  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshedAt, setRefreshedAt] = useState('')

  const fetchProductViaEAN = async (ean) => {
    try {
      const r = await fetch(`${API_BASE}/api/products/by-ean/${encodeURIComponent(ean)}`)
      if (!r.ok) return null
      return await r.json()
    } catch {
      return null
    }
  }

  const fetchProductViaId = async (pid) => {
    try {
      const r = await fetch(`${API_BASE}/api/products/${encodeURIComponent(pid)}`)
      if (!r.ok) return null
      return await r.json()
    } catch {
      return null
    }
  }

  const enrichItems = async (rawItems) => {
    const list = Array.isArray(rawItems) ? rawItems : []
    const enriched = await Promise.all(
      list.map(async (it) => {
        const ean =
          it?.ean_code ||
          it?.ean ||
          it?.barcode ||
          it?.barcode_value ||
          it?.product_ean ||
          it?.productEAN

        const pid = it?.product_id || it?.id || it?.variant_id

        let d = null
        if (ean) d = await fetchProductViaEAN(ean)
        if (!d && pid) d = await fetchProductViaId(pid)

        const name =
          it?.product_name ||
          it?.name ||
          it?.title ||
          d?.product_name ||
          d?.name ||
          d?.title ||
          'Product'

        const brand =
          it?.brand ||
          it?.brand_name ||
          it?.brandName ||
          d?.brand ||
          d?.brand_name ||
          d?.brandName ||
          ''

        const size = it?.size || it?.selected_size || it?.variant_size || d?.size || d?.selected_size || ''
        const colour =
          it?.colour ||
          it?.color ||
          it?.selected_color ||
          it?.selected_colour ||
          it?.variant_color ||
          d?.colour ||
          d?.color ||
          ''

        const gender = it?.gender || d?.gender || ''

        const imageFromProduct =
          d?.image_url ||
          d?.image ||
          (Array.isArray(d?.images) ? d.images[0]?.url || d.images[0] : '') ||
          ''

        const image_url = it?.image_url || imageFromProduct || ''

        const unitPrice =
          Number(it?.price ?? d?.b2c_final_price ?? d?.final_price_b2c ?? d?.sale_price ?? d?.price ?? 0) || 0
        const mrp = Number(it?.mrp ?? d?.b2c_actual_price ?? d?.mrp ?? unitPrice) || unitPrice
        const qty = Number(it?.qty ?? 1) || 1

        return {
          ...it,
          product_name: name,
          brand_name: brand,
          size,
          colour,
          gender,
          image_url,
          unitPrice,
          mrp,
          qty,
          product_id: Number(pid || 0) || pid
        }
      })
    )
    return enriched
  }

  const fetchAll = async () => {
    if (!orderId) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/orders/web/${encodeURIComponent(orderId)}`, { cache: 'no-store' })
      const json = await res.json().catch(() => null)

      if (!res.ok || !json) {
        setOrder(null)
        setItems([])
        setCustomer(null)
        setRefreshedAt(new Date().toLocaleString('en-IN'))
        return
      }

      const o = json.order || json.sale || json || null
      const its = Array.isArray(json.items) ? json.items : Array.isArray(o?.items) ? o.items : []

      setOrder(o)
      const enriched = await enrichItems(its)
      setItems(enriched)

      const email = String(o?.customer_email || '').trim()
      if (email) {
        const u = await fetch(`${API_BASE}/api/users/by-email/${encodeURIComponent(email)}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
        if (u && !u.message) setCustomer(u)
      } else {
        setCustomer(null)
      }

      setRefreshedAt(new Date().toLocaleString('en-IN'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [orderId])

  const money = (n) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(n || 0))

  const isCancelled = isCancelledStatus(order?.status)
  const statusText = normalizeStatus(order?.status)

  const createdAt = order?.created_at ? new Date(order.created_at).toLocaleString('en-IN') : '-'
  const totals = order?.totals || {}
  const payable = Number(totals?.payable ?? 0) || Number(order?.total ?? 0) || 0

  const addr = order?.shipping_address || {}
  const addressText = [addr?.name, addr?.line1, addr?.line2, addr?.city, addr?.state, addr?.pincode]
    .filter(Boolean)
    .join(', ')

  const paymentMethod = toUpper(order?.payment_method || 'COD')
  const paymentStatus = toUpper(order?.payment_status || 'COD')
  const isOnlinePaid = paymentStatus === 'PAID' && paymentMethod !== 'COD'

  const totalQty = Array.isArray(items) ? items.reduce((a, it) => a + Number(it?.qty || 1), 0) : 0

  const progressAccepted = !isCancelled && statusText !== 'Order Placed'

  return (
    <div className="order-details-page od-blue">
      <Navbar />
      <div className="order-details-wrap">
        <div className="od-hero">
          <div className="od-hero-top">
            <button className="od-btn od-btn-ghost" onClick={() => navigate(-1)}>
              <FaArrowLeft />
              Back
            </button>

            <div className="od-hero-actions">
              <button className="od-btn od-btn-soft" onClick={fetchAll}>
                <FaSyncAlt />
                Refresh
              </button>
            </div>
          </div>

          <div className="od-hero-main">
            <div className="od-title">
              <div className="od-title-left">
                <h1>Order #{orderId}</h1>
                <div className={`od-status-pill ${isCancelled ? 'danger' : progressAccepted ? 'success' : 'info'}`}>
                  {isCancelled ? 'Cancelled' : progressAccepted ? 'Accepted' : 'Order Placed'}
                </div>
              </div>

              <div className="od-title-right">
                <div className="od-stat">
                  <span>Placed</span>
                  <strong>{createdAt}</strong>
                </div>
                <div className="od-stat">
                  <span>{isOnlinePaid ? 'Paid' : 'Payable'}</span>
                  <strong>{money(payable)}</strong>
                </div>
                <div className="od-stat">
                  <span>Items</span>
                  <strong>{totalQty}</strong>
                </div>
              </div>
            </div>

            <div className="od-progress">
              <div className={`od-progress-track ${isCancelled ? 'cancel' : progressAccepted ? 'accepted' : 'placed'}`}>
                <div className="od-progress-fill" />
              </div>

              <div className="od-progress-steps">
                <div className={`od-step ${!isCancelled ? 'active' : ''}`}>
                  <div className="od-step-dot" />
                  <div className="od-step-label">Order Placed</div>
                </div>

                <div className={`od-step ${progressAccepted && !isCancelled ? 'active' : ''}`}>
                  <div className="od-step-dot" />
                  <div className="od-step-label">Accepted</div>
                </div>
              </div>

              {isCancelled ? (
                <div className="od-alert od-alert-danger">
                  <div className="od-alert-title">This order is cancelled</div>
                  <div className="od-alert-sub">If you paid online, the refund will be processed as per our policy.</div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="od-loading">
            <div className="od-spinner" />
            <div className="od-loading-text">Loading your order</div>
          </div>
        ) : !order ? (
          <div className="od-empty-state">
            <div className="od-empty-icon">
              <FaBoxOpen />
            </div>
            <h2>Order not found</h2>
            <p>Please check your order id and try again.</p>
            <button className="od-btn od-btn-primary" onClick={() => navigate('/orders')}>
              Go to Orders
            </button>
          </div>
        ) : (
          <>
            <div className="od-layout">
              <div className="od-left">
                <div className="od-card od-card-glass">
                  <div className="od-card-head">
                    <div className="od-card-title">
                      <FaBoxOpen />
                      Items
                    </div>
                    <div className="od-chip">{items?.length || 0} products</div>
                  </div>

                  <div className="od-items">
                    {Array.isArray(items) && items.length ? (
                      items.map((it, idx) => {
                        const name = it.product_name || 'Product'
                        const brand = it.brand_name || it.brand || '-'
                        const size = it.size || '-'
                        const color = it.colour || it.color || '-'
                        const gender = it.gender || '-'
                        const qty = Number(it.qty || 1)
                        const unitPrice = Number(it.unitPrice ?? it.price ?? 0)
                        const mrp = Number(it.mrp ?? unitPrice)
                        const lineTotal = unitPrice * qty

                        return (
                          <div className="od-item-card" key={`${it.product_id || idx}-${idx}`}>
                            <div className="od-thumb">
                              {it.image_url ? <img src={it.image_url} alt={name} /> : <div className="od-thumb-ph" />}
                              {qty > 1 ? <div className="od-qty-badge">×{qty}</div> : null}
                            </div>

                            <div className="od-item-body">
                              <div className="od-item-top">
                                <div className="od-item-title">
                                  <div className="od-pname">{name}</div>
                                  <div className="od-brand">{brand}</div>
                                </div>
                                <div className="od-item-total">{money(lineTotal)}</div>
                              </div>

                              <div className="od-tags">
                                <span className="od-tag">
                                  <span className="dot" />
                                  Size: <strong>{size}</strong>
                                </span>
                                <span className="od-tag subtle">
                                  <span className="dot gray" />
                                  Color: <strong>{color}</strong>
                                </span>
                                <span className="od-tag subtle">
                                  <span className="dot gray" />
                                  Gender: <strong>{gender}</strong>
                                </span>
                              </div>

                              <div className="od-price-split">
                                <div className="od-mini">
                                  <span>MRP</span>
                                  <strong>{money(mrp)}</strong>
                                </div>
                                <div className="od-mini">
                                  <span>Unit</span>
                                  <strong>{money(unitPrice)}</strong>
                                </div>
                                <div className="od-mini">
                                  <span>Qty</span>
                                  <strong>{qty}</strong>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="od-empty-inline">No items</div>
                    )}
                  </div>
                </div>

                <div className="od-row">
                  <div className="od-card od-card-glass">
                    <div className="od-card-head">
                      <div className="od-card-title">
                        <FaCreditCard />
                        Payment
                      </div>
                      <div className={`od-pill ${isOnlinePaid ? 'good' : 'neutral'}`}>{paymentStatus || 'COD'}</div>
                    </div>

                    <div className="od-kv-grid">
                      <div className="od-kv">
                        <span>Method</span>
                        <strong>{paymentMethod || 'COD'}</strong>
                      </div>
                      <div className="od-kv">
                        <span>Status</span>
                        <strong>{paymentStatus || 'COD'}</strong>
                      </div>
                      <div className="od-kv od-kv-total">
                        <span>{isOnlinePaid ? 'Paid' : 'Payable'}</span>
                        <strong>{money(payable)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="od-card od-card-glass">
                    <div className="od-card-head">
                      <div className="od-card-title">
                        <FaCheckCircle />
                        Price Summary
                      </div>
                      <div className="od-chip">INR</div>
                    </div>

                    <div className="od-kv-grid">
                      <div className="od-kv">
                        <span>Bag Total</span>
                        <strong>{money(totals?.bagTotal ?? 0)}</strong>
                      </div>
                      <div className="od-kv">
                        <span>Discount</span>
                        <strong>-{money(totals?.discountTotal ?? 0)}</strong>
                      </div>
                      <div className="od-kv">
                        <span>Coupon</span>
                        <strong>-{money(totals?.couponDiscount ?? 0)}</strong>
                      </div>
                      <div className="od-kv">
                        <span>Convenience</span>
                        <strong>{money(totals?.convenience ?? 0)}</strong>
                      </div>
                      <div className="od-kv">
                        <span>Gift Wrap</span>
                        <strong>{money(totals?.giftWrap ?? 0)}</strong>
                      </div>
                      <div className="od-kv od-kv-total">
                        <span>{isOnlinePaid ? 'Paid Amount' : 'Payable'}</span>
                        <strong>{money(payable)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="od-right">
                <div className="od-card od-card-glass">
                  <div className="od-card-head">
                    <div className="od-card-title">
                      <FaUserCircle />
                      Customer
                    </div>
                    <div className="od-chip">{customer?.type || 'Customer'}</div>
                  </div>

                  <div className="od-kv-stack">
                    <div className="od-kv">
                      <span>Name</span>
                      <strong>{order?.customer_name || customer?.name || 'Customer'}</strong>
                    </div>
                    <div className="od-kv">
                      <span>Email</span>
                      <strong className="wrap">{order?.customer_email || customer?.email || '-'}</strong>
                    </div>
                    <div className="od-kv">
                      <span>Mobile</span>
                      <strong>{order?.customer_mobile || customer?.mobile || '-'}</strong>
                    </div>
                    <div className="od-kv">
                      <span>Joined</span>
                      <strong>{customer?.created_at ? new Date(customer.created_at).toLocaleDateString('en-IN') : '-'}</strong>
                    </div>
                  </div>
                </div>

                <div className="od-card od-card-glass">
                  <div className="od-card-head">
                    <div className="od-card-title">
                      <FaMapMarkerAlt />
                      Shipping
                    </div>
                    <div className="od-chip">Address</div>
                  </div>

                  <div className="od-kv-stack">
                    <div className="od-kv">
                      <span>Name</span>
                      <strong>{addr?.name || order?.customer_name || '—'}</strong>
                    </div>
                    <div className="od-kv">
                      <span>Address</span>
                      <strong className="wrap">{addressText || '—'}</strong>
                    </div>
                  </div>
                </div>

                <div className="od-card od-card-glass od-mini-card">
                  <div className="od-mini-row">
                    <div className="od-mini-left">
                      <div className="od-mini-title">Order Info</div>
                      <div className="od-mini-sub">Last refreshed: {refreshedAt || '-'}</div>
                    </div>
                    <div className="od-mini-right">
                      <div className="od-mini-pill">{statusText}</div>
                    </div>
                  </div>

                  <div className="od-kv-stack">
                    <div className="od-kv">
                      <span>Order ID</span>
                      <strong>#{orderId}</strong>
                    </div>
                    <div className="od-kv">
                      <span>Placed On</span>
                      <strong>{createdAt}</strong>
                    </div>
                    <div className="od-kv">
                      <span>Payment</span>
                      <strong>{paymentStatus || 'COD'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
