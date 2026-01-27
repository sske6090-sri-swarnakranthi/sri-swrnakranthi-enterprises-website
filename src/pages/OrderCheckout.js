import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import './OrderCheckout.css'

const DEFAULT_API_BASE = 'https://sri-swarnakranthi-enterprises-backe.vercel.app'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = String(API_BASE_RAW || DEFAULT_API_BASE).replace(/\/+$/, '')

const toNum = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export default function OrderCheckout() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_mobile: '',
    shipping_address_line1: '',
    shipping_address_line2: '',
    shipping_city: '',
    shipping_state: '',
    shipping_pincode: '',
    shipping_country: 'India'
  })
  const [placing, setPlacing] = useState(false)
  const [toast, setToast] = useState('')
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState(null)

  const userId = useMemo(() => {
    const v =
      (typeof window !== 'undefined' ? sessionStorage.getItem('userId') : '') ||
      (typeof window !== 'undefined' ? localStorage.getItem('userId') : '') ||
      ''
    const n = Number(v)
    return Number.isInteger(n) && n > 0 ? n : null
  }, [])

  const payload = useMemo(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem('tk_checkout_payload') || '{}')
      if (!stored || !Array.isArray(stored.items) || stored.items.length === 0) return null

      const items = (stored.items || []).map((it) => {
        const qty = Number(it.qty ?? 1) || 1
        const mrp = toNum(it.mrp ?? it.price ?? 0)
        let price = toNum(it.price ?? 0)
        if ((!price || price <= 0) && mrp > 0) price = mrp
        return {
          product_id: it.product_id ?? it.id ?? null,
          product_name: it.product_name ?? it.name ?? '',
          brand: it.brand ?? '',
          qty,
          price,
          mrp: mrp || price,
          size: it.size ?? '',
          colour: it.colour ?? it.color ?? '',
          image_url: it.image_url || (Array.isArray(it.images) && it.images.length ? it.images[0] : '') || ''
        }
      })

      const totals = stored.totals || {}
      const total_amount = toNum(totals.payable ?? totals.total_amount ?? 0)

      return { items, total_amount }
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('tk_checkout_address') || '{}')
      if (saved && typeof saved === 'object') {
        setForm((f) => ({
          ...f,
          customer_name: saved.customer_name ?? saved.name ?? f.customer_name,
          customer_email: saved.customer_email ?? saved.email ?? f.customer_email,
          customer_mobile: saved.customer_mobile ?? saved.mobile ?? f.customer_mobile,
          shipping_address_line1: saved.shipping_address_line1 ?? saved.address_line1 ?? f.shipping_address_line1,
          shipping_address_line2: saved.shipping_address_line2 ?? saved.address_line2 ?? f.shipping_address_line2,
          shipping_city: saved.shipping_city ?? saved.city ?? f.shipping_city,
          shipping_state: saved.shipping_state ?? saved.state ?? f.shipping_state,
          shipping_pincode: saved.shipping_pincode ?? saved.pincode ?? f.shipping_pincode,
          shipping_country: saved.shipping_country ?? f.shipping_country
        }))
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => {
        navigate('/products', { replace: true })
      }, 900)
      return () => clearTimeout(t)
    }
  }, [success, navigate])

  const setF = (k, v) => setForm((s) => ({ ...s, [k]: v }))

  const isValidEmail = (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim())
  const isValidMobile = (m) => /^[0-9]{10}$/.test(String(m || '').replace(/\D/g, ''))
  const isValidPincode = (p) => /^[0-9]{6}$/.test(String(p || '').replace(/\D/g, ''))

  const requiredOk =
    !!form.customer_name &&
    isValidMobile(form.customer_mobile) &&
    !!form.shipping_address_line1 &&
    !!form.shipping_city &&
    !!form.shipping_state &&
    isValidPincode(form.shipping_pincode)

  const formatsOk = isValidEmail(form.customer_email)
  const hasItems = !!payload && Array.isArray(payload.items) && payload.items.length > 0
  const canPlace = requiredOk && formatsOk && hasItems && !placing

  const showToast = (msg, ms = 1500) => {
    setToast(msg)
    setTimeout(() => setToast(''), ms)
  }

  const itemsCount = hasItems ? payload.items.reduce((a, i) => a + Number(i.qty || 1), 0) : 0
  const fmt = (n) => Number(n || 0).toFixed(2)

  const placeOrder = async () => {
    if (!canPlace) {
      showToast('Please complete the form correctly')
      return
    }

    setPlacing(true)
    try {
      const body = {
        user_id: userId,
        total_amount: payload.total_amount,
        payment_status: 'pending',
        order_status: 'placed',
        customer_name: form.customer_name,
        customer_email: form.customer_email || null,
        customer_mobile: form.customer_mobile,
        shipping_address_line1: form.shipping_address_line1,
        shipping_address_line2: form.shipping_address_line2 || null,
        shipping_city: form.shipping_city,
        shipping_state: form.shipping_state,
        shipping_pincode: form.shipping_pincode,
        shipping_country: form.shipping_country || 'India',
        payment_method: 'COD',
        payment_ref: null,
        items: payload.items
      }

      const resp = await fetch(`${API_BASE}/api/orders/web/place`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!resp.ok) {
        let m = 'Failed to place order'
        try {
          const d = await resp.json()
          m = d?.message || m
        } catch {}
        throw new Error(m)
      }

      const data = await resp.json().catch(() => ({}))
      if (!data?.id) throw new Error('Order created but no id returned')

      setOrderId(data.id)

      localStorage.setItem(
        'tk_checkout_address',
        JSON.stringify({
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          customer_mobile: form.customer_mobile,
          shipping_address_line1: form.shipping_address_line1,
          shipping_address_line2: form.shipping_address_line2,
          shipping_city: form.shipping_city,
          shipping_state: form.shipping_state,
          shipping_pincode: form.shipping_pincode,
          shipping_country: form.shipping_country
        })
      )

      sessionStorage.removeItem('tk_checkout_payload')
      setSuccess(true)
    } catch (e) {
      showToast(String(e?.message || 'Failed to place order'), 2000)
    } finally {
      setPlacing(false)
    }
  }

  const fallbackImg = '/images/placeholder.jpg'
  const renderImg = (it) => it?.image_url || fallbackImg

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
                  value={form.customer_name}
                  onChange={(e) => setF('customer_name', e.target.value)}
                  className={!form.customer_name ? 'err' : ''}
                />
                <input
                  placeholder="Email"
                  value={form.customer_email}
                  onChange={(e) => setF('customer_email', e.target.value)}
                  className={form.customer_email && !isValidEmail(form.customer_email) ? 'err' : ''}
                />
              </div>
              <input
                placeholder="Mobile* (10 digits)"
                value={form.customer_mobile}
                onChange={(e) => setF('customer_mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                className={!isValidMobile(form.customer_mobile) ? 'err' : ''}
              />
            </div>

            <div className="card">
              <h3>Shipping</h3>
              <input
                placeholder="Address Line 1*"
                value={form.shipping_address_line1}
                onChange={(e) => setF('shipping_address_line1', e.target.value)}
                className={!form.shipping_address_line1 ? 'err' : ''}
              />
              <input
                placeholder="Address Line 2"
                value={form.shipping_address_line2}
                onChange={(e) => setF('shipping_address_line2', e.target.value)}
              />
              <div className="row2">
                <input
                  placeholder="City*"
                  value={form.shipping_city}
                  onChange={(e) => setF('shipping_city', e.target.value)}
                  className={!form.shipping_city ? 'err' : ''}
                />
                <input
                  placeholder="State*"
                  value={form.shipping_state}
                  onChange={(e) => setF('shipping_state', e.target.value)}
                  className={!form.shipping_state ? 'err' : ''}
                />
              </div>
              <input
                placeholder="Pincode* (6 digits)"
                value={form.shipping_pincode}
                onChange={(e) => setF('shipping_pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={!isValidPincode(form.shipping_pincode) ? 'err' : ''}
              />
              <input
                placeholder="Country"
                value={form.shipping_country}
                onChange={(e) => setF('shipping_country', e.target.value)}
              />
              <div className="inline-actions">
                <a className="link" href="/cart">
                  Back to Cart
                </a>
                <button
                  onClick={() => {
                    localStorage.setItem(
                      'tk_checkout_address',
                      JSON.stringify({
                        customer_name: form.customer_name,
                        customer_email: form.customer_email,
                        customer_mobile: form.customer_mobile,
                        shipping_address_line1: form.shipping_address_line1,
                        shipping_address_line2: form.shipping_address_line2,
                        shipping_city: form.shipping_city,
                        shipping_state: form.shipping_state,
                        shipping_pincode: form.shipping_pincode,
                        shipping_country: form.shipping_country
                      })
                    )
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
                    <div className="sum-item" key={`${it?.product_id || idx}`}>
                      <div className="sum-img">
                        <img
                          src={renderImg(it)}
                          alt={it?.product_name || 'Product'}
                          onError={(e) => {
                            if (e.currentTarget.src !== fallbackImg) e.currentTarget.src = fallbackImg
                          }}
                        />
                      </div>
                      <div className="sum-info">
                        <div className="sum-title">{it?.product_name || 'Product'}</div>
                        <div className="sum-sub">
                          Qty: {Number(it?.qty ?? 1) || 1}
                          {it?.size ? ` • Size: ${it.size}` : ''}
                          {it?.colour ? ` • Color: ${it.colour}` : ''}
                        </div>
                        <div className="sum-price">
                          <span className="offer">₹{fmt(it.price)}</span>
                          {Number(it.mrp) > Number(it.price) ? <span className="mrp">₹{fmt(it.mrp)}</span> : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="summary">
                <div className="total">
                  <span>Total</span>
                  <span>₹{fmt(payload?.total_amount)}</span>
                </div>
              </div>

              <button onClick={placeOrder} disabled={!canPlace} className="cta" type="button">
                {placing ? <span className="spinner" /> : null}
                {placing ? 'Placing…' : 'Place Order'}
              </button>

              <div className="note">Payment method: Cash on Delivery (COD)</div>
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
              <p>{orderId ? `Order ID: ${orderId}` : 'Thank you for shopping with us.'}</p>
              <div className="modal-actions">
                <button className="btn ghost" onClick={() => navigate('/products', { replace: true })} type="button">
                  Continue Shopping
                </button>
                <button className="btn solid" onClick={() => navigate('/products', { replace: true })} type="button">
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
