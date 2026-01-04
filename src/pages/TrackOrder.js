import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import './TrackOrder.css'

const DEFAULT_API_BASE = 'https://taras-kart-backend.vercel.app'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = API_BASE_RAW.replace(/\/+$/, '')

const ORDER_STEPS = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED']

function computeStepIndex(status) {
  const s = String(status || '').toLowerCase()
  if (!s) return 0
  if (s.includes('delivered')) return 4
  if (s.includes('out for delivery') || s.includes('out_for_delivery') || s.includes('doorstep'))
    return 3
  if (
    s.includes('in transit') ||
    s.includes('transit') ||
    s.includes('shipped') ||
    s.includes('picked') ||
    s.includes('dispatched')
  )
    return 2
  if (s.includes('confirmed') || s.includes('accepted') || s.includes('processing') || s.includes('packed'))
    return 1
  return 0
}

export default function TrackOrder() {
  const [sp] = useSearchParams()
  const initialOrderId = useMemo(() => sp.get('orderId') || sp.get('id') || '', [sp])
  const [orderId, setOrderId] = useState(initialOrderId)
  const [channelId, setChannelId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tracking, setTracking] = useState(null)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!orderId.trim()) return
    setLoading(true)
    setError('')
    setTracking(null)
    try {
      const path = channelId.trim()
        ? `/api/shiprocket/track/${encodeURIComponent(orderId.trim())}/${encodeURIComponent(
            channelId.trim()
          )}`
        : `/api/shiprocket/track/${encodeURIComponent(orderId.trim())}`
      const res = await fetch(`${API_BASE}${path}`)
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error((data && data.error) || 'Failed to fetch tracking')
      }
      setTracking(data)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const trackingData = tracking && (tracking.tracking_data || tracking) ? tracking.tracking_data || tracking : null
  const headerRow =
    trackingData && Array.isArray(trackingData.shipment_track) && trackingData.shipment_track.length
      ? trackingData.shipment_track[0]
      : null

  const mainStatus = () => {
    if (!trackingData) return ''
    return (
      headerRow?.current_status ||
      headerRow?.activity ||
      trackingData.status_text ||
      trackingData.shipment_status_text ||
      trackingData.current_status ||
      trackingData.status ||
      ''
    )
  }

  const trackUrl = () => {
    if (!trackingData) return ''
    return trackingData.track_url || tracking.track_url || ''
  }

  const courierName = () => {
    if (!trackingData) return ''
    return (
      headerRow?.courier_name ||
      headerRow?.courier_company_name ||
      trackingData.courier_name ||
      trackingData.courier ||
      trackingData.carrier ||
      ''
    )
  }

  const awbNumber = () => {
    if (!trackingData) return ''
    return (
      headerRow?.awb_code ||
      headerRow?.awb ||
      trackingData.awb ||
      trackingData.awb_code ||
      trackingData.awb_no ||
      trackingData.awb_number ||
      trackingData.awb_code_number ||
      ''
    )
  }

  const events = useMemo(() => {
    if (!trackingData) return []
    const raw =
      (Array.isArray(trackingData.shipment_track_activities) && trackingData.shipment_track_activities) ||
      (Array.isArray(trackingData.shipment_track) && trackingData.shipment_track) ||
      (Array.isArray(trackingData.track_data) && trackingData.track_data) ||
      (Array.isArray(trackingData.scans) && trackingData.scans) ||
      (Array.isArray(trackingData.track_activities) && trackingData.track_activities) ||
      []
    const mapped = raw.map((ev, idx) => {
      const time =
        ev.date_time ||
        ev.date ||
        ev.datetime ||
        ev.activity_date ||
        ev.event_date ||
        ev.scan_date ||
        ''
      const location =
        ev.location ||
        ev.location_city ||
        ev.city ||
        ev.scan_location ||
        ev.scanned_location ||
        ''
      const description =
        ev.activity ||
        ev.current_status ||
        ev.message ||
        ev.status ||
        ev.scan ||
        ev.description ||
        ''
      return {
        id: idx,
        time,
        location,
        description
      }
    })
    const sortable = mapped.filter(e => e.time)
    sortable.sort((a, b) => {
      const da = new Date(a.time).getTime()
      const db = new Date(b.time).getTime()
      if (Number.isNaN(da) || Number.isNaN(db)) return 0
      return db - da
    })
    const noTime = mapped.filter(e => !e.time)
    return [...sortable, ...noTime]
  }, [trackingData])

  const lastUpdateText = useMemo(() => {
    if (events.length && events[0].time) {
      const t = new Date(events[0].time)
      if (!Number.isNaN(t.getTime())) return t.toLocaleString('en-IN')
    }
    if (trackingData && trackingData.updated_at) {
      const t = new Date(trackingData.updated_at)
      if (!Number.isNaN(t.getTime())) return t.toLocaleString('en-IN')
    }
    if (tracking && tracking.updated_at) {
      const t = new Date(tracking.updated_at)
      if (!Number.isNaN(t.getTime())) return t.toLocaleString('en-IN')
    }
    return '-'
  }, [events, trackingData, tracking])

  const placedDateText = useMemo(() => {
    if (trackingData && trackingData.order_date) {
      const t = new Date(trackingData.order_date)
      if (!Number.isNaN(t.getTime())) return t.toLocaleString('en-IN')
    }
    if (events.length) {
      const last = events[events.length - 1]
      if (last.time) {
        const t = new Date(last.time)
        if (!Number.isNaN(t.getTime())) return t.toLocaleString('en-IN')
      }
    }
    return '-'
  }, [events, trackingData])

  const expectedDeliveryText = useMemo(() => {
    if (!trackingData) return ''
    const etd =
      trackingData.etd ||
      trackingData.eta ||
      trackingData.estimated_delivery_date ||
      trackingData.expected_delivery_date ||
      headerRow?.edd ||
      ''
    if (!etd) return ''
    const t = new Date(etd)
    if (!Number.isNaN(t.getTime())) return t.toLocaleDateString('en-IN')
    return etd
  }, [trackingData, headerRow])

  const status = mainStatus()
  const stepIndex = computeStepIndex(status)

  return (
    <div className="trackorder-page">
      <Navbar />
      <div className="trackorder-wrap">
        <div className="trackorder-head">
          <div className="trackorder-head-main">
            <h1>Track your order</h1>
            <p>Live courier updates using your Shiprocket order ID</p>
          </div>
          {orderId ? (
            <div className="trackorder-head-side">
              <div className="to-order-chip">Order reference: {orderId}</div>
              {lastUpdateText !== '-' && (
                <div className="to-updated-text">Last updated: {lastUpdateText}</div>
              )}
            </div>
          ) : null}
        </div>

        <form className="trackorder-form" onSubmit={handleSubmit}>
          <div className="to-row">
            <div className="to-field">
              <label htmlFor="orderId">Shiprocket order ID</label>
              <input
                id="orderId"
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                placeholder="Enter Shiprocket order ID"
              />
            </div>
            <div className="to-field">
              <label htmlFor="channelId">Channel ID (optional)</label>
              <input
                id="channelId"
                value={channelId}
                onChange={e => setChannelId(e.target.value)}
                placeholder="Enter channel ID if required"
              />
            </div>
            <div className="to-actions">
              <button type="submit" className="to-btn-primary" disabled={loading}>
                {loading ? 'Checking...' : 'Track'}
              </button>
            </div>
          </div>
          {error ? <div className="to-error">{error}</div> : null}
        </form>

        {loading && (
          <div className="to-loader">
            <div className="to-spinner" />
            <span className="to-loader-text">Fetching live tracking details</span>
          </div>
        )}

        {!loading && !tracking && !error && (
          <div className="to-empty">
            <h2>No tracking loaded yet</h2>
            <p>Enter your Shiprocket order ID above to see live courier updates.</p>
          </div>
        )}

        {!loading && trackingData && (
          <div className="trackorder-result">
            <div className="to-summary-grid">
              <div className="to-summary-card">
                <div className="to-summary-row">
                  <span className="to-summary-label">Shipment status</span>
                  <span className="to-summary-status">
                    {status || 'N/A'}
                  </span>
                </div>
                <div className="to-summary-row">
                  <span className="to-summary-label">Courier</span>
                  <span className="to-summary-value">
                    {courierName() || 'Courier partner'}
                  </span>
                </div>
                <div className="to-summary-row">
                  <span className="to-summary-label">AWB</span>
                  <span className="to-summary-value">
                    {awbNumber() || '-'}
                  </span>
                </div>
                <div className="to-summary-row">
                  <span className="to-summary-label">Placed on</span>
                  <span className="to-summary-value">
                    {placedDateText}
                  </span>
                </div>
              </div>

              <div className="to-summary-card">
                <div className="to-summary-row">
                  <span className="to-summary-label">Expected delivery</span>
                  <span className="to-summary-value">
                    {expectedDeliveryText || 'Will be shared once available'}
                  </span>
                </div>
                {trackUrl() ? (
                  <div className="to-summary-row">
                    <span className="to-summary-label">Courier tracking</span>
                    <a className="to-link" href={trackUrl()} target="_blank" rel="noreferrer">
                      Open live tracking
                    </a>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="to-section">
              <div className="to-section-head">
                <div>
                  <div className="to-section-title">Delivery progress</div>
                  <div className="to-section-subtitle">
                    Follow your parcel from order placement to delivery
                  </div>
                </div>
                <div className="to-section-pill">
                  {stepIndex === ORDER_STEPS.length - 1
                    ? 'Delivered successfully'
                    : 'We will update you as soon as the next step completes'}
                </div>
              </div>

              <div className="to-progress">
                <div className="to-progress-line" />
                <div className="to-steps">
                  {ORDER_STEPS.map((step, index) => {
                    const stepState =
                      index < stepIndex ? 'done' : index === stepIndex ? 'active' : 'upcoming'
                    const label = step.charAt(0) + step.slice(1).toLowerCase()
                    return (
                      <div className="to-step" key={step}>
                        <div className={`to-step-dot to-step-dot-${stepState}`} />
                        <div className="to-step-label">{label}</div>
                        <div className="to-step-caption">
                          {step === 'PLACED' && 'We have received your order'}
                          {step === 'CONFIRMED' && 'Your order has been confirmed'}
                          {step === 'PACKED' && 'Items are packed and ready to ship'}
                          {step === 'SHIPPED' && 'Parcel is with the courier partner'}
                          {step === 'DELIVERED' && 'Parcel has reached your address'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="to-section">
              <div className="to-section-head">
                <div>
                  <div className="to-section-title">Live tracking timeline</div>
                  <div className="to-section-subtitle">
                    Latest scan events from the courier partner
                  </div>
                </div>
              </div>
              {events.length === 0 ? (
                <div className="to-empty-inline">
                  No scan events are available yet. Your parcel may not have been picked up or updated in the courier system.
                </div>
              ) : (
                <div className="to-timeline">
                  {events.map(ev => (
                    <div className="to-timeline-item" key={ev.id}>
                      <div className="to-timeline-dot" />
                      <div className="to-timeline-content">
                        <div className="to-timeline-main">
                          <div className="to-timeline-title">{ev.description || 'Update'}</div>
                          <div className="to-timeline-meta">
                            {ev.time && (
                              <span className="to-timeline-time">
                                {new Date(ev.time).toString() === 'Invalid Date'
                                  ? ev.time
                                  : new Date(ev.time).toLocaleString('en-IN')}
                              </span>
                            )}
                            {ev.location && (
                              <span className="to-timeline-location">{ev.location}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="to-section">
              <details className="to-json">
                <summary className="to-json-title">View raw tracking data</summary>
                <pre className="to-json-pre">
                  {JSON.stringify(tracking, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
