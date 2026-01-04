import React, { useEffect, useMemo, useState } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import './OrderCheckout.css'

const DEFAULT_API_BASE = 'http://localhost:5000'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = String(API_BASE_RAW || '').replace(/\/+$/, '')

export default function OrderCheckout() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: ''
  })
  const [placing, setPlacing] = useState(false)
  const [toast, setToast] = useState('')
  const [success, setSuccess] = useState(false)

  const payload = useMemo(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem('tk_checkout_payload') || '{}')
      if (!stored || !Array.isArray(stored.items) || stored.items.length === 0) return {}
      const normalizedItems = (stored.items || []).map((it) => {
        const mrp = Number(it.mrp ?? it.price ?? 0) || 0
        let price = Number(it.price ?? 0) || 0
        const qty = Number(it.qty ?? 1) || 1
        if ((!price || price <= 0) && mrp > 0) price = mrp
        return { ...it, mrp, price, qty }
      })
      const rawTotals = stored.totals || {}
      const bagTotal = Number(rawTotals.bagTotal ?? 0)
      const discountTotal = Number(rawTotals.discountTotal ?? 0)
      const couponPct = Number(rawTotals.couponPct ?? 0)
      const couponDiscount = Number(rawTotals.couponDiscount ?? 0)
      const convenience = Number(rawTotals.convenience ?? 0)
      const giftWrap = Number(rawTotals.giftWrap ?? 0)
      let payable = Number(rawTotals.payable ?? 0)
      if (!payable || payable <= 0) payable = bagTotal - discountTotal - couponDiscount + convenience + giftWrap
      return {
        ...stored,
        items: normalizedItems,
        totals: { bagTotal, discountTotal, couponPct, couponDiscount, convenience, giftWrap, payable }
      }
    } catch {
      return {}
    }
  }, [])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('tk_checkout_address') || '{}')
      if (saved && typeof saved === 'object') setForm((f) => ({ ...f, ...saved }))
    } catch {}
  }, [])

  const fmt = (n) => Number(n || 0).toFixed(2)
  const itemsCount = Array.isArray(payload?.items) ? payload.items.reduce((a, i) => a + Number(i.qty || 1), 0) : 0
  const hasItems = Array.isArray(payload?.items) && payload.items.length > 0

  const setF = (k, v) => setForm((s) => ({ ...s, [k]: v }))
  const isValidEmail = (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
  const isValidMobile = (m) => !m || /^[0-9]{10}$/.test(String(m).replace(/\D/g, ''))
  const isValidPincode = (p) => !p || /^[0-9]{6}$/.test(String(p).replace(/\D/g, ''))

  const requiredOk = form.name && form.mobile && form.address_line1 && form.city && form.state && form.pincode
  const formatsOk = isValidEmail(form.email) && isValidMobile(form.mobile) && isValidPincode(form.pincode)
  const canPlace = requiredOk && formatsOk && hasItems && !placing

  const showToast = (msg, ms = 1500) => {
    setToast(msg)
    setTimeout(() => setToast(''), ms)
  }

  const createSale = async () => {
    const shipping_address = {
      line1: form.address_line1,
      line2: form.address_line2,
      city: form.city,
      state: form.state,
      pincode: form.pincode
    }

    const loginEmail = typeof window !== 'undefined' ? sessionStorage.getItem('userEmail') || null : null

    const body = {
      customer_email: form.email || null,
      customer_name: form.name || null,
      customer_mobile: form.mobile || null,
      shipping_address,
      totals: payload.totals,
      items: payload.items,
      branch_id: null,
      payment_status: 'COD',
      login_email: loginEmail,
      payment_method: 'COD'
    }

    const resp = await fetch(`${API_BASE}/api/sales/web/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (!resp.ok) {
      let m = 'Failed'
      try {
        const d = await resp.json()
        m = d?.message || m
      } catch {}
      throw new Error(m)
    }

    const data = await resp.json()
    const saleId = data?.id || null
    if (!saleId) throw new Error('No order id')
    return saleId
  }

  const placeOrder = async () => {
    if (!canPlace) {
      showToast('Please complete the form correctly')
      return
    }
    setPlacing(true)
    try {
      await createSale()
      localStorage.setItem('tk_checkout_address', JSON.stringify(form))
      sessionStorage.removeItem('tk_checkout_payload')
      setSuccess(true)
    } catch (e) {
      showToast(String(e.message || 'Failed to place order'), 2000)
    } finally {
      setPlacing(false)
    }
  }

  const fallbackImg = '/images/placeholder.jpg'

  const renderImg = (it) => {
    const img = it?.image_url || it?.images?.[0] || ''
    return img || fallbackImg
  }

  const priceOf = (it) => Number(it?.price ?? it?.b2c_final_price ?? it?.b2b_final_price ?? 0) || 0
  const mrpOf = (it) => Number(it?.mrp ?? it?.b2c_actual_price ?? it?.b2b_actual_price ?? it?.price ?? 0) || 0

  return (
    <div className="checkout-page dark">
      <Navbar />
      <div className="checkout-container">
        <div className="checkout-head">
          <h1>Checkout</h1>
          <div className="chip">{itemsCount} item(s)</div>
        </div>

        <div className="checkout-grid">
          <div className="checkout-form">
            <div className="card">
              <h3>Contact</h3>
              <div className="row2">
                <input
                  placeholder="Full Name*"
                  value={form.name}
                  onChange={(e) => setF('name', e.target.value)}
                  className={!form.name ? 'err' : ''}
                />
                <input
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setF('email', e.target.value)}
                  className={form.email && !isValidEmail(form.email) ? 'err' : ''}
                />
              </div>
              <input
                placeholder="Mobile* (10 digits)"
                value={form.mobile}
                onChange={(e) => setF('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                className={!isValidMobile(form.mobile) ? 'err' : ''}
              />
            </div>

            <div className="card">
              <h3>Shipping</h3>
              <input
                placeholder="Address Line 1*"
                value={form.address_line1}
                onChange={(e) => setF('address_line1', e.target.value)}
                className={!form.address_line1 ? 'err' : ''}
              />
              <input
                placeholder="Address Line 2"
                value={form.address_line2}
                onChange={(e) => setF('address_line2', e.target.value)}
              />
              <div className="row2">
                <input
                  placeholder="City*"
                  value={form.city}
                  onChange={(e) => setF('city', e.target.value)}
                  className={!form.city ? 'err' : ''}
                />
                <input
                  placeholder="State*"
                  value={form.state}
                  onChange={(e) => setF('state', e.target.value)}
                  className={!form.state ? 'err' : ''}
                />
              </div>
              <input
                placeholder="Pincode* (6 digits)"
                value={form.pincode}
                onChange={(e) => setF('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={!isValidPincode(form.pincode) ? 'err' : ''}
              />
              <div className="inline-actions">
                <a className="link" href="/cart">
                  Back to Cart
                </a>
                <button
                  onClick={() => {
                    localStorage.setItem('tk_checkout_address', JSON.stringify(form))
                    showToast('Address saved', 1200)
                  }}
                  className="ghost"
                  type="button"
                >
                  Save Address
                </button>
              </div>
            </div>
          </div>

          <div className="checkout-summary">
            <div className="card blue">
              <h3>Order Summary</h3>

              <div className="summary-items">
                {!hasItems ? (
                  <div className="empty">Your cart is empty.</div>
                ) : (
                  payload.items.map((it, idx) => (
                    <div className="sum-item" key={`${it?.id || it?.product_id || it?.variant_id || idx}`}>
                      <div className="sum-img">
                        <img
                          src={renderImg(it)}
                          alt={it?.name || it?.product_name || 'Product'}
                          onError={(e) => {
                            if (e.currentTarget.src !== fallbackImg) e.currentTarget.src = fallbackImg
                          }}
                        />
                      </div>
                      <div className="sum-info">
                        <div className="sum-title">{it?.name || it?.product_name || 'Product'}</div>
                        <div className="sum-sub">
                          Qty: {Number(it?.qty ?? 1) || 1}
                          {it?.size ? ` • Size: ${it.size}` : ''}
                          {it?.colour || it?.color ? ` • Color: ${it.colour || it.color}` : ''}
                        </div>
                        <div className="sum-price">
                          <span className="offer">₹{fmt(priceOf(it))}</span>
                          {mrpOf(it) > priceOf(it) ? <span className="mrp">₹{fmt(mrpOf(it))}</span> : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="summary">
                <div>
                  <span>Bag Total</span>
                  <span>₹{fmt(payload?.totals?.bagTotal)}</span>
                </div>
                <div>
                  <span>Discount</span>
                  <span>-₹{fmt(payload?.totals?.discountTotal)}</span>
                </div>
                {!!payload?.totals?.couponPct && (
                  <div>
                    <span>Coupon</span>
                    <span>-₹{fmt(payload?.totals?.couponDiscount)}</span>
                  </div>
                )}
                <div>
                  <span>Convenience</span>
                  <span>₹{fmt(payload?.totals?.convenience)}</span>
                </div>
                {!!payload?.totals?.giftWrap && (
                  <div>
                    <span>Gift Wrap</span>
                    <span>₹{fmt(payload?.totals?.giftWrap)}</span>
                  </div>
                )}
                <div className="sep" />
                <div className="total">
                  <span>Total</span>
                  <span>₹{fmt(payload?.totals?.payable)}</span>
                </div>
              </div>

              <button onClick={placeOrder} disabled={!canPlace} className="cta" type="button">
                {placing ? <span className="spinner" /> : null}
                {placing ? 'Placing…' : 'Place Order'}
              </button>

              <div className="note">Cash on Delivery only</div>
            </div>

            <div className="card mini">
              <h4>Need Help?</h4>
              <p>
                Questions about delivery? Write to <a href="mailto:support@gifts.com">support@gifts.com</a>
              </p>
            </div>
          </div>
        </div>

        {success && (
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-content">
              <div className="success-icon">✓</div>
              <h2>Order Placed Successfully</h2>
              <p>Thank you for shopping with us.</p>
              <div className="modal-actions">
                <a className="btn ghost" href="/">
                  Continue Shopping
                </a>
                <button className="btn solid" onClick={() => setSuccess(false)} type="button">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {!!toast && <div className="toast show">{toast}</div>}
      </div>
      <Footer />
    </div>
  )
}
