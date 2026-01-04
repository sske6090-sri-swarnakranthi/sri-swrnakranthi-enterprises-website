import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import './OrderCancel.css'

const DEFAULT_API_BASE = 'https://taras-kart-backend.vercel.app'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = API_BASE_RAW.replace(/\/+$/, '')

export default function OrderCancel() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [sale, setSale] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reason, setReason] = useState('')
  const [otherReason, setOtherReason] = useState('')
  const [confirmChecked, setConfirmChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    async function loadOrder() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_BASE}/api/sales/web/${id}`, { cache: 'no-store' })
        if (!res.ok) {
          throw new Error('Unable to fetch order details')
        }
        const data = await res.json()
        setSale(data.sale || null)
        setItems(Array.isArray(data.items) ? data.items : [])
      } catch (e) {
        setError(e.message || 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadOrder()
    }
  }, [id])

  const rawPaymentStatus = String(sale?.payment_status || '').trim()
  const paymentStatusUpper = rawPaymentStatus.toUpperCase()
  const isCOD = paymentStatusUpper.startsWith('COD')
  const isPrepaid =
    paymentStatusUpper.startsWith('PAID') || paymentStatusUpper.startsWith('PENDING')

  const rawStatus = String(sale?.status || '').trim()
  const statusUpper = rawStatus.toUpperCase()
  const isAlreadyCancelled =
    statusUpper === 'CANCELLED' || statusUpper.startsWith('CANCELLED')

  const cancellationSourceRaw = String(sale?.cancellation_source || '').trim()
  const cancellationSourceLower = cancellationSourceRaw.toLowerCase()
  const cancelledByAdmin = cancellationSourceLower.includes('admin')
  const cancelledByUser =
    cancellationSourceLower.includes('user') ||
    cancellationSourceLower.includes('customer') ||
    cancellationSourceLower.includes('web')
  const cancellationReason = String(sale?.cancellation_reason || '').trim()
  const cancellationTimeIso =
    sale?.cancellation_created_at || sale?.updated_at || sale?.created_at
  const cancellationTimeDisplay = cancellationTimeIso
    ? new Date(cancellationTimeIso).toLocaleString()
    : ''

  const effectiveReason = reason === 'OTHER' ? otherReason.trim() : reason

  const isCancelDisabled =
    submitting ||
    !sale ||
    !effectiveReason ||
    !confirmChecked ||
    isAlreadyCancelled

  async function handleSubmit(e) {
    e.preventDefault()
    if (isCancelDisabled) return
    setSubmitting(true)
    setError('')
    setSuccessMessage('')
    try {
      const res = await fetch(`${API_BASE}/api/orders/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sale_id: id,
          payment_type: isCOD ? 'COD' : 'PREPAID',
          reason: effectiveReason,
          cancellation_source: 'WEB_USER'
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.ok === false) {
        throw new Error(data.message || 'Unable to submit cancellation request')
      }
      setSuccessMessage('Your cancellation request has been submitted.')
      if (isPrepaid) {
        navigate(`/returns?saleId=${encodeURIComponent(id)}`)
      }
    } catch (e) {
      setError(e.message || 'Something went wrong while cancelling')
    } finally {
      setSubmitting(false)
    }
  }

  function goToOrderDetails() {
    navigate(`/order/${id}`)
  }

  function goToTrack() {
    navigate(`/order/${id}/tracking`)
  }

  function goToReturns() {
    navigate('/returns')
  }

  const renderCancelledBanner = () => {
    if (!isAlreadyCancelled) return null
    if (cancelledByAdmin) {
      return (
        <div className="order-cancel-banner order-cancel-banner-soft">
          <div className="order-cancel-banner-title">Your order has been cancelled by our team.</div>
          <div className="order-cancel-banner-text">
            We are really sorry, but this order could not be processed and was cancelled from our side.
            {cancellationTimeDisplay ? ` This was done on ${cancellationTimeDisplay}.` : ''}
          </div>
          <div className="order-cancel-banner-text">
            {cancellationReason
              ? `Reason: ${cancellationReason}`
              : 'If any amount was charged, it will be handled as per our refund policy.'}
          </div>
          <div className="order-cancel-banner-text">
            For any questions or urgent help, you can contact our support team with your order ID.
          </div>
        </div>
      )
    }
    if (cancelledByUser) {
      return (
        <div className="order-cancel-banner order-cancel-banner-soft">
          <div className="order-cancel-banner-title">This order is already cancelled.</div>
          <div className="order-cancel-banner-text">
            You have already cancelled this order
            {cancellationTimeDisplay ? ` on ${cancellationTimeDisplay}` : ''}.
          </div>
          <div className="order-cancel-banner-text">
            {cancellationReason ? `Reason you selected: ${cancellationReason}` : 'No reason was captured.'}
          </div>
          <div className="order-cancel-banner-text">
            If you were charged for this order, any refund will follow our standard refund timelines.
          </div>
        </div>
      )
    }
    return (
      <div className="order-cancel-banner order-cancel-banner-soft">
        <div className="order-cancel-banner-title">This order is already cancelled.</div>
        <div className="order-cancel-banner-text">
          It is no longer possible to cancel this order because it is already marked as cancelled.
          {cancellationTimeDisplay ? ` This was updated on ${cancellationTimeDisplay}.` : ''}
        </div>
        {cancellationReason && (
          <div className="order-cancel-banner-text">Reason: {cancellationReason}</div>
        )}
        <div className="order-cancel-banner-text">
          If you have been charged, you can raise a return or refund request from the Returns section or by
          contacting support.
        </div>
      </div>
    )
  }

  return (
    <div className="order-cancel-page">
      <Navbar />
      <div className="order-cancel-content">
        <div className="order-cancel-container">
          {loading && (
            <div className="order-cancel-state">
              <div className="order-cancel-loader-circle" />
              <div className="order-cancel-loader-text">Loading your order</div>
            </div>
          )}

          {!loading && error && !sale && (
            <div className="order-cancel-state">
              <div className="order-cancel-state-title">We could not load this order</div>
              <div className="order-cancel-state-text">{error}</div>
              <button
                type="button"
                className="order-cancel-secondary-btn"
                onClick={() => navigate('/track-order')}
              >
                Try another order
              </button>
            </div>
          )}

          {!loading && !error && !sale && (
            <div className="order-cancel-state">
              <div className="order-cancel-state-title">Order not found</div>
              <div className="order-cancel-state-text">
                Check your order link or visit Track Order to search using your mobile number or email.
              </div>
              <button
                type="button"
                className="order-cancel-secondary-btn"
                onClick={() => navigate('/track-order')}
              >
                Go to Track Order
              </button>
            </div>
          )}

          {!loading && sale && (
            <>
              <div className="order-cancel-header">
                <div>
                  <div className="order-cancel-title">Cancel order</div>
                  <div className="order-cancel-subtitle">
                    Order ID: <span className="order-cancel-subtitle-strong">{sale.id}</span>
                  </div>
                </div>
                <div className="order-cancel-header-meta">
                  <div className="order-cancel-pill">
                    <span className="order-cancel-pill-label">Payment</span>
                    <span className="order-cancel-pill-value">
                      {isCOD
                        ? 'Cash on delivery'
                        : isPrepaid
                        ? 'Prepaid'
                        : rawPaymentStatus || 'Unknown'}
                    </span>
                  </div>
                  <div className="order-cancel-pill order-cancel-pill-soft">
                    <span className="order-cancel-pill-label">Status</span>
                    <span className="order-cancel-pill-value">
                      {rawStatus || 'PLACED'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="order-cancel-layout">
                <div className="order-cancel-card">
                  <div className="order-cancel-card-title">Order summary</div>
                  <div className="order-cancel-order-meta">
                    {sale.customer_name && (
                      <div className="order-cancel-meta-row">
                        <span>Customer</span>
                        <span>{sale.customer_name}</span>
                      </div>
                    )}
                    {sale.customer_mobile && (
                      <div className="order-cancel-meta-row">
                        <span>Mobile</span>
                        <span>{sale.customer_mobile}</span>
                      </div>
                    )}
                    {sale.customer_email && (
                      <div className="order-cancel-meta-row">
                        <span>Email</span>
                        <span>{sale.customer_email}</span>
                      </div>
                    )}
                  </div>

                  <div className="order-cancel-items">
                    {items.map((item, idx) => (
                      <div key={idx} className="order-cancel-item-row">
                        <div className="order-cancel-item-left">
                          <div className="order-cancel-item-thumb-wrapper">
                            {item.image_url ? (
                              <div
                                className="order-cancel-item-thumb"
                                style={{ backgroundImage: `url(${item.image_url})` }}
                              />
                            ) : (
                              <div className="order-cancel-item-thumb order-cancel-item-thumb-placeholder">
                                <span>✨</span>
                              </div>
                            )}
                          </div>
                          <div className="order-cancel-item-text">
                            <div className="order-cancel-item-title">
                              {item.product_name || 'Product'}
                            </div>
                            <div className="order-cancel-item-subtext">
                              {item.brand_name && <span>{item.brand_name}</span>}
                              {(item.size || item.colour) && (
                                <span>
                                  {item.size && ` • Size ${item.size}`}
                                  {item.colour && ` • ${item.colour}`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="order-cancel-item-right">
                          <div className="order-cancel-item-price">
                            ₹{Number(item.price || item.mrp || 0).toFixed(0)}
                          </div>
                          <div className="order-cancel-item-qty">Qty {item.qty || 1}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="order-cancel-totals">
                    <div className="order-cancel-meta-row">
                      <span>Items total</span>
                      <span>
                        ₹
                        {Number(
                          items.reduce(
                            (sum, it) =>
                              sum +
                              Number(it.price || it.mrp || 0) * Number(it.qty || 1),
                            0
                          )
                        ).toFixed(0)}
                      </span>
                    </div>
                    {sale.totals && typeof sale.totals === 'object' && sale.totals !== null && (
                      <>
                        {sale.totals.convenience && (
                          <div className="order-cancel-meta-row order-cancel-meta-row-faded">
                            <span>Convenience</span>
                            <span>₹{Number(sale.totals.convenience).toFixed(0)}</span>
                          </div>
                        )}
                        {sale.totals.giftWrap && (
                          <div className="order-cancel-meta-row order-cancel-meta-row-faded">
                            <span>Gift wrap</span>
                            <span>₹{Number(sale.totals.giftWrap).toFixed(0)}</span>
                          </div>
                        )}
                        {sale.totals.payable && (
                          <div className="order-cancel-meta-row order-cancel-meta-row-strong">
                            <span>Amount payable</span>
                            <span>₹{Number(sale.totals.payable).toFixed(0)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="order-cancel-footer-links">
                    <button
                      type="button"
                      className="order-cancel-link-btn"
                      onClick={goToOrderDetails}
                    >
                      View order details
                    </button>
                    <button
                      type="button"
                      className="order-cancel-link-btn"
                      onClick={goToTrack}
                    >
                      Track shipment
                    </button>
                  </div>
                </div>

                <div className="order-cancel-card order-cancel-card-accent">
                  <div className="order-cancel-card-title">Cancellation options</div>

                  {isAlreadyCancelled && renderCancelledBanner()}

                  {!isAlreadyCancelled && (
                    <>
                      <div className="order-cancel-banner">
                        {isCOD && (
                          <>
                            This is a cash on delivery order. If we cancel it successfully, you
                            will not be charged. If the package is already on its way, you can
                            refuse delivery at your doorstep.
                          </>
                        )}
                        {isPrepaid && (
                          <>
                            This is a prepaid order. If cancellation is approved, the amount will
                            be refunded to your original payment method after we process it.
                            Delivered orders can be handled from the Returns section.
                          </>
                        )}
                        {!isCOD && !isPrepaid && (
                          <>
                            We will try to cancel this order. If the courier has already picked it
                            up, you may need to place a return request after delivery.
                          </>
                        )}
                      </div>

                      <form className="order-cancel-form" onSubmit={handleSubmit}>
                        <div className="order-cancel-form-section">
                          <div className="order-cancel-form-label">Reason for cancellation</div>
                          <div className="order-cancel-radio-group">
                            <label className="order-cancel-radio">
                              <input
                                type="radio"
                                name="cancel-reason"
                                value="CHANGE_OF_MIND"
                                checked={reason === 'CHANGE_OF_MIND'}
                                onChange={e => setReason(e.target.value)}
                              />
                              <span>Changed my mind</span>
                            </label>
                            <label className="order-cancel-radio">
                              <input
                                type="radio"
                                name="cancel-reason"
                                value="FOUND_BETTER_PRICE"
                                checked={reason === 'FOUND_BETTER_PRICE'}
                                onChange={e => setReason(e.target.value)}
                              />
                              <span>Found a better price elsewhere</span>
                            </label>
                            <label className="order-cancel-radio">
                              <input
                                type="radio"
                                name="cancel-reason"
                                value="DELIVERY_DELAY"
                                checked={reason === 'DELIVERY_DELAY'}
                                onChange={e => setReason(e.target.value)}
                              />
                              <span>Delivery is taking too long</span>
                            </label>
                            <label className="order-cancel-radio">
                              <input
                                type="radio"
                                name="cancel-reason"
                                value="OTHER"
                                checked={reason === 'OTHER'}
                                onChange={e => setReason(e.target.value)}
                              />
                              <span>Something else</span>
                            </label>
                          </div>
                          {reason === 'OTHER' && (
                            <textarea
                              className="order-cancel-textarea"
                              placeholder="Tell us a little more (optional but helpful)"
                              value={otherReason}
                              onChange={e => setOtherReason(e.target.value)}
                              rows={3}
                            />
                          )}
                        </div>

                        <div className="order-cancel-form-section">
                          <label className="order-cancel-checkbox">
                            <input
                              type="checkbox"
                              checked={confirmChecked}
                              onChange={e => setConfirmChecked(e.target.checked)}
                            />
                            <span>
                              I understand that cancellation may not be possible if the order has
                              already been packed or shipped.
                            </span>
                          </label>
                        </div>

                        {successMessage && (
                          <div className="order-cancel-message order-cancel-message-success">
                            {successMessage}
                          </div>
                        )}
                        {error && sale && (
                          <div className="order-cancel-message order-cancel-message-error">
                            {error}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isCancelDisabled}
                          className={
                            isCancelDisabled
                              ? 'order-cancel-primary-btn order-cancel-primary-btn-disabled'
                              : 'order-cancel-primary-btn'
                          }
                        >
                          {submitting ? 'Submitting request' : 'Confirm cancellation'}
                        </button>

                        <div className="order-cancel-secondary-actions">
                          <span>Changed your mind</span>
                          <button
                            type="button"
                            className="order-cancel-link-btn"
                            onClick={goToOrderDetails}
                          >
                            Keep this order
                          </button>
                        </div>

                        <div className="order-cancel-small-note">
                          For delivered orders or quality concerns, please raise a return or
                          replacement request from the Returns page after delivery.
                        </div>
                        <button
                          type="button"
                          className="order-cancel-secondary-btn order-cancel-secondary-btn-full"
                          onClick={goToReturns}
                        >
                          Go to Returns
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
