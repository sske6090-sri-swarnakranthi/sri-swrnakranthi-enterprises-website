import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import './OrderTracking.css'

const DEFAULT_API_BASE = 'https://taras-kart-backend.vercel.app'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = API_BASE_RAW.replace(/\/+$/, '')

const ORDER_STEPS = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED']
const CANCELLED_STEPS = ['PLACED', 'CANCELLED']

const up = (s) => String(s || '').toUpperCase().trim()

const isCancelledStatus = (s) => {
  const v = String(s || '').toLowerCase()
  return v.includes('cancel')
}

function computeStepFromLocal(orderStatus) {
  const s = up(orderStatus || 'PLACED')
  const idx = ORDER_STEPS.indexOf(s)
  return idx === -1 ? 0 : idx
}

function computeStepFromShiprocketStatus(srStatus) {
  const s = up(srStatus)
  if (!s) return 0
  if (s.includes('DELIVERED')) return 4
  if (s.includes('OUT FOR DELIVERY') || s.includes('OUT_FOR_DELIVERY')) return 3
  if (s.includes('IN TRANSIT') || s.includes('DISPATCH') || s.includes('SHIPPED') || s.includes('PICKED')) return 3
  if (s.includes('AWB') || s.includes('PACKED') || s.includes('MANIFEST')) return 2
  if (s.includes('CONFIRMED') || s.includes('PROCESSING') || s.includes('ACCEPTED') || s.includes('CREATED')) return 1
  return 0
}

function computeStepFromShipment(sh, srCore) {
  if (!sh && !srCore) return 0
  const s = up(sh?.status || '')
  const sr = up(srCore?.current_status || '')
  const combined = `${s} ${sr}`.trim()
  if (!combined) {
    if (sh && sh.awb) return 2
    return 1
  }
  if (combined.includes('DELIVERED')) return 4
  if (combined.includes('OUT FOR DELIVERY') || combined.includes('OUT_FOR_DELIVERY')) return 3
  if (combined.includes('IN TRANSIT') || combined.includes('DISPATCH') || combined.includes('SHIPPED') || combined.includes('PICKED')) return 3
  if (combined.includes('PACKED') || combined.includes('MANIFEST')) return 2
  if (combined.includes('CONFIRMED') || combined.includes('PROCESSING') || combined.includes('ACCEPTED') || combined.includes('CREATED')) return 1
  return 0
}

function extractTrackingCore(raw) {
  if (!raw) return null
  let core = raw
  if (Array.isArray(core) && core.length) {
    const first = core[0]
    if (first && typeof first === 'object') {
      const key = Object.keys(first)[0]
      if (key && first[key] && first[key].tracking_data) core = first[key].tracking_data
    }
  } else if (core.tracking_data) {
    core = core.tracking_data
  }
  if (!core || typeof core !== 'object') return null
  return core
}

function buildTrackingSnapshot(raw) {
  const core = extractTrackingCore(raw)
  if (!core) {
    return { status: '', eddText: null, lastEventText: null, core: null }
  }
  const tracks = Array.isArray(core.shipment_track) ? core.shipment_track : []
  const lastTrack = tracks.length ? tracks[tracks.length - 1] : null
  const status = (lastTrack && lastTrack.current_status) || core.current_status || core.status || ''
  const eddRaw = (lastTrack && lastTrack.edd) || core.edd || null
  const lastEventRaw =
    (lastTrack && (lastTrack.date || lastTrack.pickup_date || lastTrack.updated_time_stamp)) ||
    core.updated_time_stamp ||
    core.last_status_time ||
    null
  const edd = eddRaw ? new Date(eddRaw) : null
  const lastEvent = lastEventRaw ? new Date(lastEventRaw) : null
  return {
    status,
    eddText:
      edd && !Number.isNaN(edd.getTime())
        ? edd.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: '2-digit' })
        : null,
    lastEventText: lastEvent && !Number.isNaN(lastEvent.getTime()) ? lastEvent.toLocaleString('en-IN') : null,
    core
  }
}

export default function OrderTracking() {
  const params = useParams()
  const [sp] = useSearchParams()
  const navigate = useNavigate()

  const orderId = useMemo(() => params.id || sp.get('id') || '', [params.id, sp])

  const [sale, setSale] = useState(null)
  const [shipments, setShipments] = useState([])
  const [eligibility, setEligibility] = useState(null)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [trackingRaw, setTrackingRaw] = useState(null)
  const [refreshedAt, setRefreshedAt] = useState('')

  const fetchShiprocketTracking = async (shArray) => {
    const arr = Array.isArray(shArray) ? shArray : []
    const latest = arr.length ? arr[arr.length - 1] : null
    const trackOrderId = latest?.shiprocket_order_id || latest?.awb || ''
    if (!trackOrderId) {
      setTrackingRaw(null)
      return
    }
    try {
      const res = await fetch(`${API_BASE}/api/shiprocket/track/${encodeURIComponent(trackOrderId)}`)
      const data = await res.json().catch(() => null)
      if (res.ok && data) setTrackingRaw(data)
      else setTrackingRaw(null)
    } catch {
      setTrackingRaw(null)
    }
  }

  const fetchAll = async () => {
    if (!orderId) return
    setLoading(true)
    try {
      const [sRes, shRes, elRes, rrRes] = await Promise.all([
        fetch(`${API_BASE}/api/sales/web/${encodeURIComponent(orderId)}`),
        fetch(`${API_BASE}/api/shipments/by-sale/${encodeURIComponent(orderId)}`),
        fetch(`${API_BASE}/api/returns/eligibility/${encodeURIComponent(orderId)}`),
        fetch(`${API_BASE}/api/returns/by-sale/${encodeURIComponent(orderId)}`)
      ])
      const sJson = await sRes.json().catch(() => null)
      const shJson = await shRes.json().catch(() => [])
      const elJson = await elRes.json().catch(() => null)
      const rrJson = await rrRes.json().catch(() => ({ rows: [] }))

      const nextSale = sJson && sJson.sale ? { ...sJson.sale, items: sJson.items || [] } : sJson
      const nextShipments = Array.isArray(shJson) ? shJson : []

      setSale(nextSale)
      setShipments(nextShipments)
      setEligibility(elJson)
      setRequests(Array.isArray(rrJson?.rows) ? rrJson.rows : [])
      fetchShiprocketTracking(nextShipments)
      setRefreshedAt(new Date().toLocaleString('en-IN'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    const t = setInterval(fetchAll, 25000)
    return () => clearInterval(t)
  }, [orderId])

  const money = (n) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(n || 0))

  const localStatus = up(sale?.status || 'PLACED')
  const isCancelled = isCancelledStatus(localStatus)
  const trackingSnapshot = useMemo(() => buildTrackingSnapshot(trackingRaw), [trackingRaw])
  const shiprocketStatus = up(trackingSnapshot.status)

  const latestShipment = shipments && shipments.length ? shipments[shipments.length - 1] : null
  const shipmentStepIndex = computeStepFromShipment(latestShipment, trackingSnapshot.core)
  const baseLocalStep = computeStepFromLocal(localStatus)
  const baseShiprocketStep = computeStepFromShiprocketStatus(shiprocketStatus)
  const effectiveStepIndex = Math.max(baseLocalStep, baseShiprocketStep, shipmentStepIndex)

  const placedDate = sale?.created_at ? new Date(sale.created_at) : null
  const placedDateText = placedDate && !Number.isNaN(placedDate.getTime()) ? placedDate.toLocaleString('en-IN') : '-'

  const destinationCity = sale?.shipping_address?.city || ''
  const destinationState = sale?.shipping_address?.state || ''
  const destinationPincode = sale?.shipping_address?.pincode || ''
  const destinationText =
    destinationCity || destinationState || destinationPincode
      ? [destinationCity, destinationState, destinationPincode].filter(Boolean).join(', ')
      : '-'

  const primaryAwb = latestShipment?.awb || '-'
  const trackingUrl = latestShipment?.tracking_url || null

  const computedEddDate = useMemo(() => {
    if (trackingSnapshot.eddText) return null
    const base = latestShipment?.created_at || sale?.created_at || null
    if (!base) return null
    const d = new Date(base)
    if (Number.isNaN(d.getTime())) return null
    d.setDate(d.getDate() + 5)
    return d
  }, [trackingSnapshot.eddText, latestShipment, sale])

  const expectedDeliveryText = useMemo(() => {
    if (isCancelled) return '-'
    if (trackingSnapshot.eddText) return trackingSnapshot.eddText
    if (!computedEddDate) return 'To be updated soon'
    return computedEddDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: '2-digit'
    })
  }, [isCancelled, trackingSnapshot.eddText, computedEddDate])

  const lastUpdateTime = useMemo(() => {
    if (trackingSnapshot.lastEventText) return trackingSnapshot.lastEventText
    const fallbackTime = latestShipment?.updated_at || latestShipment?.created_at || sale?.updated_at || sale?.created_at
    if (!fallbackTime) return '-'
    const t = new Date(fallbackTime)
    if (Number.isNaN(t.getTime())) return '-'
    return t.toLocaleString('en-IN')
  }, [trackingSnapshot, latestShipment, sale])

  const statusDisplay = useMemo(() => {
    if (isCancelled) return 'CANCELLED'
    if (shiprocketStatus) return shiprocketStatus
    return localStatus || 'PLACED'
  }, [isCancelled, shiprocketStatus, localStatus])

  const deliveryStatusText = useMemo(() => {
    if (isCancelled) return 'Order is cancelled'
    if (effectiveStepIndex === ORDER_STEPS.length - 1) return 'Delivered'
    if (shiprocketStatus) return shiprocketStatus
    return 'On the way'
  }, [isCancelled, effectiveStepIndex, shiprocketStatus])

  const stepLabels = isCancelled ? CANCELLED_STEPS : ORDER_STEPS
  const stepIndex = isCancelled ? 1 : effectiveStepIndex

  const trackingEvents = useMemo(() => {
    const core = trackingSnapshot.core
    if (!core) return []
    const raw = Array.isArray(core.shipment_track) ? core.shipment_track : []
    return raw
      .map((ev) => {
        const rawDate = ev.updated_time_stamp || ev.pickup_date || ev.delivered_date || ev.date || ''
        const d = rawDate ? new Date(rawDate) : null
        const dateText = d && !Number.isNaN(d.getTime()) ? d.toLocaleString('en-IN') : ''
        const loc =
          ev.destination ||
          ev.destination_city ||
          ev.city ||
          ev.origin ||
          ev.scan_location ||
          ev.scanned_location ||
          ''
        return { status: up(ev.current_status || ''), location: loc, dateText }
      })
      .filter((e) => e.status || e.dateText || e.location)
  }, [trackingSnapshot.core])

  const totalsPayable = sale?.totals?.payable ?? sale?.total ?? 0
  const paymentStatus = up(sale?.payment_status || 'COD')
  const paymentMethod = up(sale?.payment_method || '')
  const isOnlinePaid = paymentStatus === 'PAID' && paymentMethod !== 'COD'

  const showReturns = !isCancelled && eligibility?.ok

  return (
    <div className="ot-page">
      <Navbar />
      <div className="ot-wrap">
        <div className="ot-topbar">
          <button className="ot-btn ot-btn-ghost ot-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div className="ot-topbar-mid">
            <div className="ot-heading-row">
              <h1 className="ot-title">Order #{orderId || 'NA'}</h1>
              <span className={`ot-pill ${isCancelled ? 'ot-pill-cancelled' : ''}`}>{statusDisplay}</span>
            </div>
            <div className="ot-subrow">
              <span>Placed {placedDateText}</span>
              <span className="ot-sep">•</span>
              <span>AWB {primaryAwb}</span>
              <span className="ot-sep">•</span>
              <span>Updated {lastUpdateTime}</span>
            </div>
          </div>
          <button className="ot-btn ot-btn-ghost ot-refresh" onClick={fetchAll}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="ot-loader">
            <div className="ot-spinner" />
            <span className="ot-loader-text">Loading</span>
          </div>
        ) : !sale ? (
          <div className="ot-empty">
            <h2 className="ot-empty-title">Order not found</h2>
            <p className="ot-empty-text">Please check your order ID and try again.</p>
          </div>
        ) : (
          <>
            <div className={`ot-hero ${isCancelled ? 'ot-hero-cancelled' : ''}`}>
              <div className="ot-hero-main">
                <div className="ot-hero-status">{deliveryStatusText}</div>
                <div className="ot-hero-sub">
                  {isCancelled ? 'This order will not be shipped.' : `Expected delivery: ${expectedDeliveryText}`}
                </div>
              </div>
              <div className="ot-hero-actions">
                {trackingUrl && !isCancelled ? (
                  <a className="ot-btn ot-btn-solid" href={trackingUrl} target="_blank" rel="noreferrer">
                    Track
                  </a>
                ) : null}
              </div>
            </div>

            <div className="ot-grid">
              <div className="ot-card">
                <div className="ot-card-title">Order Summary</div>
                <div className="ot-kv">
                  <span>Destination</span>
                  <strong>{destinationText}</strong>
                </div>
                <div className="ot-kv">
                  <span>Payment</span>
                  <strong>{paymentStatus}</strong>
                </div>
                <div className="ot-kv">
                  <span>{isOnlinePaid ? 'Paid Amount' : 'Payable'}</span>
                  <strong className="ot-gold">{money(totalsPayable)}</strong>
                </div>
              </div>

              <div className="ot-card">
                <div className="ot-card-title">Customer</div>
                <div className="ot-kv">
                  <span>Name</span>
                  <strong>{sale?.customer_name || 'Customer'}</strong>
                </div>
                <div className="ot-kv">
                  <span>Mobile</span>
                  <strong>{sale?.customer_mobile || '-'}</strong>
                </div>
                <div className="ot-kv">
                  <span>Email</span>
                  <strong className="ot-wraptext">{sale?.customer_email || '-'}</strong>
                </div>
              </div>
            </div>

            <div className={`ot-progress-card ${isCancelled ? 'ot-progress-cancelled' : ''}`}>
              <div className="ot-progress-head">
                <div>
                  <div className="ot-card-title">Progress</div>
                  <div className="ot-progress-sub">{isCancelled ? 'Cancelled' : 'Tracking updates from courier'}</div>
                </div>
                {!isCancelled && (
                  <div className="ot-mini">
                    <span className="ot-mini-label">Expected</span>
                    <span className="ot-mini-value">{expectedDeliveryText}</span>
                  </div>
                )}
              </div>

              <div className={`ot-steps ${isCancelled ? 'ot-steps-2' : ''}`}>
                {stepLabels.map((label, i) => {
                  const active = i <= stepIndex
                  const isFinalCancel = isCancelled && label === 'CANCELLED'
                  return (
                    <div className={`ot-step ${active ? 'active' : ''} ${isFinalCancel ? 'cancel' : ''}`} key={label}>
                      <div className="ot-dot" />
                      <div className="ot-step-label">{label}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {trackingEvents.length > 0 && !isCancelled ? (
              <div className="ot-card">
                <div className="ot-card-title">Latest Updates</div>
                <div className="ot-timeline">
                  {trackingEvents.slice(-8).reverse().map((ev, idx) => (
                    <div className="ot-time-row" key={`${ev.dateText}-${idx}`}>
                      <div className="ot-time-dot" />
                      <div className="ot-time-body">
                        <div className="ot-time-status">{ev.status || 'UPDATE'}</div>
                        {ev.location ? <div className="ot-time-meta">{ev.location}</div> : null}
                        {ev.dateText ? <div className="ot-time-meta">{ev.dateText}</div> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="ot-card">
              <div className="ot-card-title">Shipments</div>
              <div className="ot-shipments">
                {shipments.length === 0 ? (
                  <div className="ot-empty-inline">No shipments yet</div>
                ) : (
                  shipments.map((sh) => (
                    <div className="ot-ship-card" key={sh.id}>
                      <div className="ot-ship-row">
                        <div className="ot-ship-kv">
                          <span>Shipment</span>
                          <strong>#{sh.id}</strong>
                        </div>
                        <div className="ot-ship-kv">
                          <span>AWB</span>
                          <strong>{sh.awb || '-'}</strong>
                        </div>
                      </div>
                      <div className="ot-ship-row">
                        <div className="ot-ship-kv">
                          <span>Branch</span>
                          <strong>#{sh.branch_id || '-'}</strong>
                        </div>
                        <div className="ot-ship-kv">
                          <span>Status</span>
                          <strong className="ot-gold">{up(sh.status || 'CREATED')}</strong>
                        </div>
                      </div>
                      {sh.label_url ? (
                        <div className="ot-ship-actions">
                          <a className="ot-btn ot-btn-solid" href={sh.label_url} target="_blank" rel="noreferrer">
                            Label
                          </a>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="ot-card">
              <div className="ot-card-title">Items</div>
              <div className="ot-items">
                {Array.isArray(sale?.items) && sale.items.length ? (
                  sale.items.map((it, idx) => (
                    <div className="ot-item" key={`${it.variant_id || it.product_id || idx}-${idx}`}>
                      <div className="ot-item-thumb">
                        {it.image_url ? <img src={it.image_url} alt="" /> : <div className="ot-item-ph" />}
                      </div>
                      <div className="ot-item-main">
                        <div className="ot-item-name">{it.name || it.product_name || `Variant #${it.variant_id || '-'}`}</div>
                        <div className="ot-item-meta">
                          <span>Qty ×{Number(it.qty || 1)}</span>
                          <span>Size {it.size || '-'}</span>
                          <span>Color {it.colour || it.color || '-'}</span>
                        </div>
                      </div>
                      <div className="ot-item-price">{money(it.price)}</div>
                    </div>
                  ))
                ) : (
                  <div className="ot-empty-inline">No items found</div>
                )}
              </div>
              <div className="ot-total">
                <div className="ot-kv">
                  <span>Total</span>
                  <strong className="ot-gold">{money(totalsPayable)}</strong>
                </div>
              </div>
            </div>

            <div className="ot-card">
              <div className="ot-card-title">Returns</div>
              {showReturns ? (
                <div className="ot-actions">
                  <a className="ot-btn ot-btn-solid" href={`/returns?saleId=${encodeURIComponent(orderId)}&type=RETURN`}>
                    Request Return
                  </a>
                  <a className="ot-btn ot-btn-ghost" href={`/returns?saleId=${encodeURIComponent(orderId)}&type=REPLACE`}>
                    Request Replacement
                  </a>
                </div>
              ) : (
                <div className="ot-empty-inline">
                  {isCancelled
                    ? 'Returns are not available for cancelled orders.'
                    : eligibility?.reason
                    ? `Not eligible right now: ${eligibility.reason}`
                    : 'Return eligibility is not available.'}
                </div>
              )}

              {Array.isArray(requests) && requests.length ? (
                <div className="ot-rr">
                  {requests.slice(0, 6).map((r) => (
                    <div className="ot-rr-row" key={r.id}>
                      <div className="ot-rr-kv">
                        <span>Type</span>
                        <strong>{up(r.type)}</strong>
                      </div>
                      <div className="ot-rr-kv">
                        <span>Status</span>
                        <strong className="ot-gold">{up(r.status || '')}</strong>
                      </div>
                      <div className="ot-rr-kv">
                        <span>Reason</span>
                        <strong className="ot-wraptext">{r.reason || '-'}</strong>
                      </div>
                      <div className="ot-rr-kv">
                        <span>Created</span>
                        <strong>{r.created_at ? new Date(r.created_at).toLocaleString('en-IN') : '-'}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="ot-footnote">
              <span>Last refreshed: {refreshedAt || '-'}</span>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
