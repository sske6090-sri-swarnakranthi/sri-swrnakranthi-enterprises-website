import React, { useEffect, useMemo, useState } from 'react'
import './RefundRequest.css'
import Navbar from './Navbar'
import Footer from './Footer'
import { useParams, useLocation, useNavigate } from 'react-router-dom'

const DEFAULT_API_BASE = 'https://taras-kart-backend.vercel.app'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = API_BASE_RAW.replace(/\/+$/, '')

function formatDate(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleString('en-IN')
}

function parseTotals(totals) {
  if (!totals) return null
  try {
    return typeof totals === 'string' ? JSON.parse(totals) : totals
  } catch {
    return null
  }
}

function formatCurrency(n) {
  if (n == null) n = 0
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(n || 0))
}

function formatPriceFromTotals(totals) {
  const obj = parseTotals(totals)
  if (!obj) return ''
  const payable = Number(obj.payable || 0)
  if (!payable) return ''
  return formatCurrency(payable)
}

function getProgressIndex(status, refundStatus) {
  const s = String(status || '').toUpperCase()
  const r = String(refundStatus || '').toUpperCase()
  if (r === 'REFUNDED') return 3
  if (r === 'PENDING_REFUND') return 2
  if (s === 'APPROVED' || s === 'REJECTED') return 1
  return 0
}

function getItemMrp(item) {
  const candidates = [item.mrp, item.original_price, item.list_price, item.price_mrp, item.base_price]
  for (const c of candidates) {
    if (c != null) return Number(c)
  }
  return null
}

function getItemPrice(item) {
  const candidates = [item.price, item.selling_price, item.final_price, item.discounted_price, item.offer_price]
  for (const c of candidates) {
    if (c != null) return Number(c)
  }
  return null
}

function getItemColor(item) {
  return item.color || item.colour || item.variant_color || item.color_name || item.colour_name || ''
}

function getItemSize(item) {
  return item.size || item.size_label || item.variant_size || item.size_name || ''
}

function getItemQty(item) {
  if (item.qty != null) return Number(item.qty)
  if (item.quantity != null) return Number(item.quantity)
  return 1
}

function getItemBrand(item) {
  return item.brand || item.brand_name || item.brandName || item.vendor || item.vendor_name || item.seller || ''
}

export default function RefundRequest() {
  const { id: saleIdParam } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const kind = params.get('kind') || 'refund'

  const isReturnFlow = kind === 'return'
  const [sale, setSale] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])

  const [bankForm, setBankForm] = useState({
    accountName: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    upiId: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const [activeStep, setActiveStep] = useState(isReturnFlow ? 1 : 2)
  const [formCompleted, setFormCompleted] = useState(false)
  const [createdRequest, setCreatedRequest] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingRequest, setLoadingRequest] = useState(false)

  useEffect(() => {
    const fetchSale = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_BASE}/api/sales/web/${saleIdParam}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Unable to load order details')
        const data = await res.json()
        setSale(data || null)
      } catch (e) {
        setError(e.message || 'Unable to load order details')
        setSale(null)
      } finally {
        setLoading(false)
      }
    }

    if (saleIdParam) fetchSale()
    else {
      setLoading(false)
      setSale(null)
      setError('Missing order id')
    }
  }, [saleIdParam])

  useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f))
    setPreviews(urls)
    return () => {
      urls.forEach(u => URL.revokeObjectURL(u))
    }
  }, [files])

  useEffect(() => {
    const fetchLatestRequestBySale = async () => {
      if (!saleIdParam) return
      setLoadingRequest(true)
      try {
        const res = await fetch(`${API_BASE}/api/returns/by-sale/${saleIdParam}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json().catch(() => ({}))
        const rows = Array.isArray(data?.rows) ? data.rows : []
        if (!rows.length) return
        const latest = rows[0]
        if (latest?.id) await fetchRequestById(latest.id)
      } finally {
        setLoadingRequest(false)
      }
    }
    fetchLatestRequestBySale()
  }, [saleIdParam])

  useEffect(() => {
    if (!createdRequest) return
    const bd = createdRequest.bank_details || createdRequest.bankDetails || null
    if (!bd) return
    setBankForm(prev => ({
      ...prev,
      accountName: bd.accountName || prev.accountName,
      bankName: bd.bankName || prev.bankName,
      accountNumber: bd.accountNumber || prev.accountNumber,
      ifsc: bd.ifsc || prev.ifsc,
      upiId: bd.upiId || prev.upiId
    }))
  }, [createdRequest])

  function handleFileChange(e) {
    const incoming = Array.from(e.target.files || [])
    setFiles(incoming)
  }

  function handleStep1Continue() {
    if (!files.length) {
      setMessage('Please upload at least one product image before continuing.')
      return
    }
    setMessage('')
    setActiveStep(2)
  }

  async function fetchRequestById(requestId) {
    try {
      setRefreshing(true)
      const res = await fetch(`${API_BASE}/api/returns/${requestId}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json().catch(() => ({}))
      if (data && data.ok && data.request) {
        setCreatedRequest(data.request)
        const s = String(data.request.status || '').toUpperCase()
        const r = String(data.request.refund_status || '').toUpperCase()
        if (s === 'APPROVED' || s === 'REJECTED' || r === 'PENDING_REFUND' || r === 'REFUNDED') setFormCompleted(true)
      }
    } finally {
      setRefreshing(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!sale || !saleIdParam) {
      setMessage('Unable to submit, missing order information.')
      return
    }

    if (isReturnFlow && activeStep !== 2) {
      setMessage('Please complete Step 1 first.')
      return
    }

    const hasUPI = !!String(bankForm.upiId || '').trim()
    const hasBankDetails =
      String(bankForm.accountName || '').trim() &&
      String(bankForm.bankName || '').trim() &&
      String(bankForm.accountNumber || '').trim() &&
      String(bankForm.ifsc || '').trim()

    if (!hasUPI && !hasBankDetails) {
      setMessage('Please provide either full bank details or a UPI ID.')
      return
    }

    if (isReturnFlow && !files.length) {
      setMessage('Please upload at least one product image.')
      return
    }

    setSubmitting(true)
    setMessage('')
    let imageUrls = []

    try {
      if (files.length) {
        const formData = new FormData()
        formData.append('sale_id', sale.id || saleIdParam)
        files.forEach(f => formData.append('images', f))

        const uploadRes = await fetch(`${API_BASE}/api/returns/upload-images`, {
          method: 'POST',
          body: formData
        })

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json().catch(() => ({}))
          if (Array.isArray(uploadData.urls)) imageUrls = uploadData.urls
        }
      }
    } catch {
    }

    const bankNote = `Bank / UPI details:
Account name: ${bankForm.accountName || 'not provided'}
Bank: ${bankForm.bankName || 'not provided'}
Account number: ${bankForm.accountNumber || 'not provided'}
IFSC: ${bankForm.ifsc || 'not provided'}
UPI: ${bankForm.upiId || 'not provided'}`

    const imagesNote = imageUrls.length ? `\nImage proofs:\n${imageUrls.map(u => `- ${u}`).join('\n')}` : ''

    const contextNote =
      kind === 'return'
        ? 'Return / replacement request created from refund wizard page.'
        : 'Refund request for cancelled prepaid order created from refund wizard page.'

    const mergedNotes = `${contextNote}\n\n${bankNote}${imagesNote}`

    const type = kind === 'return' ? 'RETURN' : 'REFUND'
    const reason = 'OTHER'

    const payload = {
      sale_id: sale.id || saleIdParam,
      type,
      reason,
      notes: mergedNotes,
      image_urls: imageUrls,
      bankDetails: {
        accountName: bankForm.accountName,
        bankName: bankForm.bankName,
        accountNumber: bankForm.accountNumber,
        ifsc: bankForm.ifsc,
        upiId: bankForm.upiId
      }
    }

    try {
      const res = await fetch(`${API_BASE}/api/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.ok === false) throw new Error(data.reason || data.message || 'Unable to submit request')

      const requestId = data.request && data.request.id
      setMessage('Your request has been submitted. You can track the refund progress below.')
      setFormCompleted(true)

      if (requestId) await fetchRequestById(requestId)
    } catch (err) {
      setMessage(err.message || 'Something went wrong while submitting your request.')
    } finally {
      setSubmitting(false)
    }
  }

  const title = kind === 'return' ? 'Return / replacement request' : 'Refund request for cancelled order'
  const subtitle =
    kind === 'return'
      ? 'Upload clear product images and share your bank or UPI details so we can process your return or replacement.'
      : 'Share your bank or UPI details so we can process your refund for the cancelled order.'

  const items = Array.isArray(sale?.items) ? sale.items : []
  const primaryItem = items[0] || null
  const displayOrderId = (sale && sale.id) || saleIdParam

  const totalsComputed = useMemo(() => {
    let totalMrp = 0
    let totalPrice = 0
    let totalQty = 0

    items.forEach(it => {
      const mrp = getItemMrp(it)
      const price = getItemPrice(it)
      const qty = getItemQty(it)
      if (mrp != null) totalMrp += mrp * qty
      if (price != null) totalPrice += price * qty
      totalQty += qty
    })

    const totalsObj = parseTotals(sale?.totals)
    const payableFromTotals = totalsObj && totalsObj.payable ? Number(totalsObj.payable) : null
    const finalPayable = payableFromTotals != null ? payableFromTotals : totalPrice
    const totalDiscount = totalMrp > 0 && totalPrice > 0 ? totalMrp - totalPrice : 0

    return { totalMrp, totalPrice, totalQty, finalPayable, totalDiscount }
  }, [items, sale?.totals])

  const progressIndex = getProgressIndex(createdRequest && createdRequest.status, createdRequest && createdRequest.refund_status)
  const progressPercent = (progressIndex / 3) * 100

  const secondLabel =
    createdRequest && String(createdRequest.status || '').toUpperCase() === 'REJECTED'
      ? 'Rejected by admin'
      : 'Accepted / rejected by admin'

  const statusUpper = String(createdRequest?.status || '').toUpperCase()
  const refundUpper = String(createdRequest?.refund_status || '').toUpperCase()

  const shouldHideBankForever =
    statusUpper === 'APPROVED' ||
    refundUpper === 'PENDING_REFUND' ||
    refundUpper === 'REFUNDED'

  const primaryBrand = primaryItem ? getItemBrand(primaryItem) : ''
  const primaryName = primaryItem?.product_name || primaryItem?.name || `Order #${displayOrderId}`

  const primaryMrp = primaryItem ? getItemMrp(primaryItem) : null
  const primaryPrice = primaryItem ? getItemPrice(primaryItem) : null
  const primaryQty = primaryItem ? getItemQty(primaryItem) : 1
  const primaryLineMrp = primaryMrp != null ? primaryMrp * primaryQty : null
  const primaryLinePrice = primaryPrice != null ? primaryPrice * primaryQty : null
  const primaryHasDiscount = primaryMrp != null && primaryPrice != null && primaryMrp > primaryPrice
  const primaryDiscountPercent =
    primaryHasDiscount && primaryMrp > 0 ? Math.round(((primaryMrp - primaryPrice) / primaryMrp) * 100) : null

  return (
    <div className="refund-page">
      <Navbar />
      <div className="refund-container">
        {loading ? (
          <div className="refund-card refund-loading">
            <div className="refund-spinner" />
            <p>Loading your order…</p>
          </div>
        ) : error || !sale ? (
          <div className="refund-card refund-error-card">
            <h2 className="refund-title">Something went wrong</h2>
            <p className="refund-text">{error || 'Order not found.'}</p>
            <button type="button" className="refund-btn-primary" onClick={() => navigate('/returns')}>
              Back to returns
            </button>
          </div>
        ) : (
          <>
            <header className="refund-header">
              <button type="button" className="refund-back-link" onClick={() => navigate('/returns')}>
                Back to returns & refunds
              </button>
              <div className="refund-header-main">
                <h1 className="refund-title">{title}</h1>
                <p className="refund-subtitle">{subtitle}</p>
              </div>
            </header>

            <section className="refund-layout">
              <div className="refund-main-column">
                {shouldHideBankForever ? (
                  <section className="refund-card refund-approved-card">
                    <div className="refund-approved-top">
                      <div className="refund-approved-image">
                        {primaryItem?.image_url ? <img src={primaryItem.image_url} alt={primaryName} /> : <div className="refund-order-ph" />}
                      </div>

                      <div className="refund-approved-body">
                        {primaryBrand ? (
                          <div className="refund-approved-brand">{primaryBrand}</div>
                        ) : (
                          <div className="refund-approved-brand refund-approved-brand-muted"> </div>
                        )}

                        <div className="refund-approved-name">{primaryName}</div>

                        <div className="refund-approved-price">
                          {primaryLinePrice != null && <div className="refund-approved-final">{formatCurrency(primaryLinePrice)}</div>}
                          {primaryLineMrp != null && primaryHasDiscount && (
                            <div className="refund-approved-mrp-line">
                              <span className="refund-approved-mrp">{formatCurrency(primaryLineMrp)}</span>
                              {primaryDiscountPercent != null && <span className="refund-approved-off">{primaryDiscountPercent}% off</span>}
                            </div>
                          )}
                          {primaryLineMrp != null && !primaryHasDiscount && primaryLinePrice == null && (
                            <div className="refund-approved-mrp-only">{formatCurrency(primaryLineMrp)}</div>
                          )}
                        </div>

                        <div className="refund-approved-meta">
                          <span className="refund-meta-pill">Order ID: {displayOrderId}</span>
                          {sale.created_at && <span className="refund-meta-pill">Placed on {formatDate(sale.created_at)}</span>}
                          {totalsComputed.totalQty > 0 && <span className="refund-meta-pill">Items: {totalsComputed.totalQty}</span>}
                          {loadingRequest && <span className="refund-meta-pill">Checking status…</span>}
                        </div>
                      </div>
                    </div>

                    <div className="refund-progress refund-progress-compact">
                      <div className="refund-progress-track">
                        <div className="refund-progress-fill" style={{ width: `${progressPercent}%` }} />
                      </div>

                      <div className="refund-progress-nodes">
                        <div className={`refund-progress-node ${progressIndex >= 0 ? 'active' : ''}`} style={{ left: '0%' }}>
                          <span className="refund-progress-number">1</span>
                        </div>
                        <div className={`refund-progress-node ${progressIndex >= 1 ? 'active' : ''}`} style={{ left: '33%' }}>
                          <span className="refund-progress-number">2</span>
                        </div>
                        <div className={`refund-progress-node ${progressIndex >= 2 ? 'active' : ''}`} style={{ left: '66%' }}>
                          <span className="refund-progress-number">3</span>
                        </div>
                        <div className={`refund-progress-node ${progressIndex >= 3 ? 'active' : ''}`} style={{ left: '100%' }}>
                          <span className="refund-progress-number">4</span>
                        </div>
                      </div>

                      <div className="refund-progress-labels">
                        <div className="refund-progress-label">Requested</div>
                        <div className="refund-progress-label">{secondLabel}</div>
                        <div className="refund-progress-label">Refund initiated</div>
                        <div className="refund-progress-label">Refund completed</div>
                      </div>
                    </div>

                    <div className="refund-button-row">
                      {createdRequest && (
                        <button type="button" className="refund-btn-secondary" onClick={() => fetchRequestById(createdRequest.id)} disabled={refreshing}>
                          {refreshing ? 'Refreshing…' : 'Refresh status'}
                        </button>
                      )}
                      <button type="button" className="refund-btn-primary" onClick={() => navigate('/returns')}>
                        Back to returns
                      </button>
                    </div>
                  </section>
                ) : (
                  <>
                    <section className="refund-card refund-order-card">
                      <div className="refund-order-top">
                        <div className="refund-order-image">
                          {primaryItem?.image_url ? <img src={primaryItem.image_url} alt={primaryItem.product_name || 'Product'} /> : <div className="refund-order-ph" />}
                        </div>

                        <div className="refund-order-body">
                          <h3 className="refund-order-name">{primaryItem?.product_name || `Order #${displayOrderId}`}</h3>

                          <div className="refund-order-meta">
                            {sale.created_at && <span>Placed on {formatDate(sale.created_at)}</span>}
                            {totalsComputed.finalPayable ? <span>Paid {formatCurrency(totalsComputed.finalPayable)}</span> : sale.totals ? <span>Paid {formatPriceFromTotals(sale.totals)}</span> : null}
                          </div>

                          <div className="refund-order-id-row">
                            <span className="refund-order-id">Order ID: {displayOrderId}</span>
                            {totalsComputed.totalQty > 0 && (
                              <span className="refund-order-qty">
                                Total items: <span className="refund-highlight">{totalsComputed.totalQty}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="refund-order-summary">
                        <div className="refund-summary-row">
                          <span>MRP total</span>
                          <span className="refund-summary-value">{totalsComputed.totalMrp ? formatCurrency(totalsComputed.totalMrp) : '—'}</span>
                        </div>
                        <div className="refund-summary-row">
                          <span>Discount</span>
                          <span className="refund-summary-value refund-summary-discount">
                            {totalsComputed.totalDiscount > 0 ? `- ${formatCurrency(totalsComputed.totalDiscount)}` : '—'}
                          </span>
                        </div>
                        <div className="refund-summary-row refund-summary-row-strong">
                          <span>Final payable</span>
                          <span className="refund-summary-value">{totalsComputed.finalPayable ? formatCurrency(totalsComputed.finalPayable) : '—'}</span>
                        </div>
                      </div>
                    </section>

                    {!formCompleted ? (
                      <>
                        {isReturnFlow && (
                          <section className="refund-card refund-stepper-card">
                            <div className="refund-stepper-header">
                              <div className={`refund-step-pill ${activeStep === 1 ? 'active' : ''}`}>Step 1: Product images</div>
                              <div className={`refund-step-pill ${activeStep === 2 ? 'active' : ''}`}>Step 2: Bank / UPI details</div>
                            </div>
                          </section>
                        )}

                        <form className={`refund-card refund-form ${!isReturnFlow ? 'refund-form-single' : ''}`} onSubmit={handleSubmit}>
                          {isReturnFlow && activeStep === 1 && (
                            <div className="refund-section">
                              <h2 className="refund-section-title">Step 1: Upload product images</h2>
                              <p className="refund-text">Upload clear photos (front, label, and issue if any).</p>

                              <div className="refund-field">
                                <label className="refund-label">Product images *</label>
                                <input type="file" accept="image/*" multiple onChange={handleFileChange} className="refund-input-file" />
                                {previews.length > 0 && (
                                  <div className="refund-preview-grid">
                                    {previews.map((src, idx) => (
                                      <div key={idx} className="refund-preview-item">
                                        <img src={src} alt={`Upload ${idx + 1}`} />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="refund-button-row">
                                <button type="button" className="refund-btn-primary" onClick={handleStep1Continue}>
                                  Continue to bank / UPI details
                                </button>
                              </div>
                            </div>
                          )}

                          {(!isReturnFlow || activeStep === 2) && (
                            <div className="refund-section">
                              <h2 className="refund-section-title">{isReturnFlow ? 'Step 2: Bank / UPI details' : 'Bank / UPI details'}</h2>
                              <p className="refund-text">Refunds are processed to your bank account or UPI after verification.</p>

                              <div className="refund-grid">
                                <div className="refund-field">
                                  <label className="refund-label">Account holder name</label>
                                  <input type="text" className="refund-input" value={bankForm.accountName} onChange={e => setBankForm({ ...bankForm, accountName: e.target.value })} />
                                </div>

                                <div className="refund-field">
                                  <label className="refund-label">Bank name</label>
                                  <input type="text" className="refund-input" value={bankForm.bankName} onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })} />
                                </div>

                                <div className="refund-field">
                                  <label className="refund-label">Account number</label>
                                  <input type="text" className="refund-input" value={bankForm.accountNumber} onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })} />
                                </div>

                                <div className="refund-field">
                                  <label className="refund-label">IFSC code</label>
                                  <input type="text" className="refund-input" value={bankForm.ifsc} onChange={e => setBankForm({ ...bankForm, ifsc: e.target.value.toUpperCase() })} />
                                </div>

                                <div className="refund-field refund-field-full">
                                  <label className="refund-label">UPI ID (optional)</label>
                                  <input type="text" className="refund-input" value={bankForm.upiId} onChange={e => setBankForm({ ...bankForm, upiId: e.target.value })} placeholder="example@upi" />
                                </div>
                              </div>
                            </div>
                          )}

                          {message && <div className="refund-message">{message}</div>}

                          {(!isReturnFlow || activeStep === 2) && (
                            <>
                              <button type="submit" className="refund-btn-primary" disabled={submitting}>
                                {submitting ? 'Submitting…' : 'Submit request'}
                              </button>
                              <p className="refund-note">
                                After you submit, our team will review your details. If approved, the refund will be processed to the account or UPI you provided.
                              </p>
                            </>
                          )}
                        </form>
                      </>
                    ) : (
                      <section className="refund-card">
                        <h2 className="refund-section-title">Refund progress</h2>
                        <p className="refund-text">Track the status below.</p>

                        <div className="refund-progress">
                          <div className="refund-progress-track">
                            <div className="refund-progress-fill" style={{ width: `${progressPercent}%` }} />
                          </div>

                          <div className="refund-progress-nodes">
                            <div className={`refund-progress-node ${progressIndex >= 0 ? 'active' : ''}`} style={{ left: '0%' }}>
                              <span className="refund-progress-number">1</span>
                            </div>
                            <div className={`refund-progress-node ${progressIndex >= 1 ? 'active' : ''}`} style={{ left: '33%' }}>
                              <span className="refund-progress-number">2</span>
                            </div>
                            <div className={`refund-progress-node ${progressIndex >= 2 ? 'active' : ''}`} style={{ left: '66%' }}>
                              <span className="refund-progress-number">3</span>
                            </div>
                            <div className={`refund-progress-node ${progressIndex >= 3 ? 'active' : ''}`} style={{ left: '100%' }}>
                              <span className="refund-progress-number">4</span>
                            </div>
                          </div>

                          <div className="refund-progress-labels">
                            <div className="refund-progress-label">Requested</div>
                            <div className="refund-progress-label">{secondLabel}</div>
                            <div className="refund-progress-label">Refund initiated</div>
                            <div className="refund-progress-label">Refund completed</div>
                          </div>
                        </div>

                        <div className="refund-button-row">
                          {createdRequest && (
                            <button type="button" className="refund-btn-secondary" onClick={() => fetchRequestById(createdRequest.id)} disabled={refreshing}>
                              {refreshing ? 'Refreshing…' : 'Refresh status'}
                            </button>
                          )}
                          <button type="button" className="refund-btn-primary" onClick={() => navigate('/returns')}>
                            Back to returns
                          </button>
                        </div>
                      </section>
                    )}
                  </>
                )}
              </div>
            </section>
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
