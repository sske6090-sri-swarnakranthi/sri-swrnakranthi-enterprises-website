import React, { useState, useEffect } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import { useCart } from '../CartContext'
import { useWishlist } from '../WishlistContext'
import './Cart.css'
import { FaTimes, FaCheck, FaTag } from 'react-icons/fa'
import Popup from './Popup'
import { useNavigate } from 'react-router-dom'

const DEFAULT_API_BASE = 'http://localhost:5000'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = API_BASE_RAW.replace(/\/+$/, '')

const isIntId = (v) => {
  const n = Number(v)
  return Number.isInteger(n) && n > 0
}

const pickImage = (images) => {
  try {
    if (!images) return ''
    if (typeof images === 'string') {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed) && parsed.length) return parsed[0]
      return ''
    }
    if (Array.isArray(images) && images.length) return images[0]
    return ''
  } catch {
    return ''
  }
}

const Cart = () => {
  const navigate = useNavigate()
  const { addToWishlist } = useWishlist()
  const { removeFromCart } = useCart()

  const [cartItems, setCartItems] = useState([])
  const [showPopup, setShowPopup] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [quantities, setQuantities] = useState({})
  const [showCoupon, setShowCoupon] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [couponDiscountPct, setCouponDiscountPct] = useState(0)
  const [giftWrap, setGiftWrap] = useState(false)
  const [toast, setToast] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const userId =
    (typeof window !== 'undefined' ? sessionStorage.getItem('userId') : '') ||
    (typeof window !== 'undefined' ? localStorage.getItem('userId') : '') ||
    ''

  const [userType, setUserType] = useState(() => {
    if (typeof window === 'undefined') return 'B2C'
    return sessionStorage.getItem('userType') || localStorage.getItem('userType') || 'B2C'
  })

  useEffect(() => {
    const syncUserType = () => {
      if (typeof window === 'undefined') return
      const storedType = sessionStorage.getItem('userType') || localStorage.getItem('userType') || 'B2C'
      if (storedType !== userType) setUserType(storedType)
    }
    window.addEventListener('storage', syncUserType)
    const interval = setInterval(syncUserType, 500)
    return () => {
      window.removeEventListener('storage', syncUserType)
      clearInterval(interval)
    }
  }, [userType])

  const fmt = (n) => Number(n || 0).toFixed(2)

  const getItemPricing = (item) => {
    if (userType === 'B2B') {
      const mrp = Number(item.b2b_actual_price ?? item.b2c_actual_price ?? item.b2b_final_price ?? item.b2c_final_price ?? 0)
      const offer = Number(item.b2b_final_price ?? item.b2c_final_price ?? mrp)
      return { mrp, offer }
    }
    const mrp = Number(item.b2c_actual_price ?? item.b2b_actual_price ?? item.b2c_final_price ?? item.b2b_final_price ?? 0)
    const offer = Number(item.b2c_final_price ?? item.b2b_final_price ?? mrp)
    return { mrp, offer }
  }

  const normalizeCartRow = (row) => {
    const image = pickImage(row.images)
    return {
      id: row.cart_id,
      cart_id: row.cart_id,
      user_id: row.user_id,
      product_id: row.product_id,
      selected_size: row.selected_size,
      selected_color: row.selected_color,
      quantity: Number(row.quantity || 1),
      category: row.category,
      brand: row.brand,
      product_name: row.product_name,
      b2b_actual_price: row.b2b_actual_price,
      b2b_discount: row.b2b_discount,
      b2b_final_price: row.b2b_final_price,
      b2c_actual_price: row.b2c_actual_price,
      b2c_discount: row.b2c_discount,
      b2c_final_price: row.b2c_final_price,
      count: row.count,
      images: row.images,
      image_url: image,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }

  const fetchCartItems = async () => {
    if (!userId || !isIntId(userId)) {
      setCartItems([])
      setQuantities({})
      return
    }
    try {
      const res = await fetch(`${API_BASE}/api/cart/${userId}`, { cache: 'no-store' })
      if (!res.ok) {
        setCartItems([])
        setQuantities({})
        return
      }
      const data = await res.json()
      const arr = Array.isArray(data) ? data : []
      const normalized = arr.map(normalizeCartRow)
      setCartItems(normalized)
      const initialQuantities = normalized.reduce((acc, item) => {
        const key = item.cart_id
        if (key != null) acc[key] = Number(item.quantity || 1)
        return acc
      }, {})
      setQuantities(initialQuantities)
    } catch {
      setCartItems([])
      setQuantities({})
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
    fetchCartItems()
  }, [userId])

  const handleRemoveClick = (item) => {
    setSelectedItem(item)
    setShowPopup(true)
  }

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase()
    if (code === 'BLUE10') {
      setCouponDiscountPct(10)
      setToast('BLUE10 applied')
    } else if (code === 'FREESHIP') {
      setCouponDiscountPct(0)
      setToast('FREESHIP applied')
    } else {
      setCouponDiscountPct(0)
      setToast('Invalid coupon')
    }
    setShowCoupon(false)
    setTimeout(() => setToast(''), 1500)
  }

  const handleConfirmRemove = async () => {
    if (selectedItem && userId) {
      await fetch(`${API_BASE}/api/cart`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: String(userId),
          product_id: Number(selectedItem.product_id),
          selected_size: selectedItem.selected_size,
          selected_color: selectedItem.selected_color
        })
      })
      setCartItems((prev) => prev.filter((it) => it.cart_id !== selectedItem.cart_id))
      removeFromCart(selectedItem.cart_id)
      setToast('Item removed')
      setTimeout(() => setToast(''), 1600)
    }
    setShowPopup(false)
  }

  const handleQuantityChange = async (cartId, value) => {
    const quantity = parseInt(value, 10)
    setQuantities((prev) => ({ ...prev, [cartId]: quantity }))
    if (!userId) return
    const row = cartItems.find((x) => x.cart_id === cartId)
    if (!row) return
    await fetch(`${API_BASE}/api/cart`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: String(userId),
        product_id: Number(row.product_id),
        selected_size: row.selected_size,
        selected_color: row.selected_color,
        quantity
      })
    })
    setToast('Quantity updated')
    setTimeout(() => setToast(''), 1200)
  }

  const bagTotal = cartItems.reduce((total, item) => {
    const key = item.cart_id
    const qty = quantities[key] || 1
    const { mrp } = getItemPricing(item)
    return total + mrp * qty
  }, 0)

  const discountTotal = cartItems.reduce((total, item) => {
    const key = item.cart_id
    const qty = quantities[key] || 1
    const { mrp, offer } = getItemPricing(item)
    if (!mrp || offer >= mrp) return total
    return total + (mrp - offer) * qty
  }, 0)

  const subTotalBeforeCoupon = bagTotal - discountTotal
  const rawCouponDiscount = (subTotalBeforeCoupon * couponDiscountPct) / 100
  const couponDiscount = rawCouponDiscount
  const subTotal = subTotalBeforeCoupon - couponDiscount
  const youPay = subTotal + (giftWrap ? 39 : 0)
  const totalSaving = discountTotal + couponDiscount

  const proceedToCheckout = () => {
    if (!cartItems.length) return
    const payload = {
      totals: {
        bagTotal,
        discountTotal,
        couponPct: couponDiscountPct,
        couponDiscount,
        convenience: 0,
        giftWrap: giftWrap ? 39 : 0,
        payable: youPay
      },
      items: cartItems.map((item) => {
        const key = item.cart_id
        const qty = quantities[key] || 1
        const { mrp, offer } = getItemPricing(item)
        return {
          cart_id: item.cart_id,
          product_id: item.product_id ?? null,
          qty,
          price: Number(offer),
          mrp: Number(mrp),
          size: item.selected_size || '',
          colour: item.selected_color || '',
          image_url: item.image_url || null,
          product_name: item.product_name,
          brand: item.brand
        }
      })
    }
    sessionStorage.setItem('tk_checkout_payload', JSON.stringify(payload))
    navigate('/order/checkout')
  }

  return (
    <div className="cart-wrap">
      <Navbar />
      <div className="cart-container">
        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <img src="/images/emptyWishlist.avif" alt="Empty Cart" />
            <h2>Your Bag is empty</h2>
            <p>Add items to your bag to view them here.</p>
            <a className="btn-shop" href="/">
              Start Shopping
            </a>
          </div>
        ) : (
          <>
            <div className="progress-free">You unlocked Free Shipping</div>

            <div className="cart-grid">
              <div className="cart-left">
                <div className="cart-head">
                  <h2>My Bag</h2>
                  <span>{cartItems.length} item(s)</span>
                </div>

                {cartItems.map((item) => {
                  const key = item.cart_id
                  const qty = quantities[key] || 1
                  const { mrp, offer } = getItemPricing(item)
                  const discountPct = mrp > 0 && offer < mrp ? Math.round(((mrp - offer) / mrp) * 100) : 0

                  return (
                    <div className="cart-card" key={key}>
                      <button className="card-remove" onClick={() => handleRemoveClick(item)}>
                        <FaTimes />
                      </button>

                      <div className="card-media">
                        <img src={item.image_url} alt={item.product_name} />
                      </div>

                      <div className="card-body">
                        <div className="card-top">
                          <h4 className="brand">{item.brand}</h4>
                          <p className="name">{item.product_name}</p>
                        </div>

                        <div className="card-opts">
                          <div className="opt">
                            <span className="opt-label">Color</span>
                            <span className="color-dot" style={{ backgroundColor: (item.selected_color || '').toLowerCase() }} />
                          </div>
                          <div className="opt">
                            <span className="opt-label">Size</span>
                            <select value={item.selected_size || ''} className="select" disabled>
                              <option value={item.selected_size || ''}>{item.selected_size || '-'}</option>
                            </select>
                          </div>
                          <div className="opt">
                            <span className="opt-label">Qty</span>
                            <select value={qty} className="select" onChange={(e) => handleQuantityChange(key, e.target.value)}>
                              {[...Array(10)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {i + 1}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="card-price">
                          <div className="now">₹{fmt(offer * qty)}</div>
                          <div className="was">
                            <span className="mrp">₹{fmt(mrp * qty)}</span>
                            {discountPct > 0 && <span className="off">{discountPct}% OFF</span>}
                          </div>
                        </div>

                        <div className="card-actions">
                          <button className="mini blue" onClick={() => setShowCoupon(true)}>
                            <FaTag /> Apply Coupon
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="cart-right">
                <div className="summary">
                  <h3>Price Summary</h3>
                  <div className="sum-row">
                    <span>Bag Total</span>
                    <span>₹{fmt(bagTotal)}</span>
                  </div>
                  <div className="sum-row">
                    <span>Discount on MRP</span>
                    <span className="green">-₹{fmt(discountTotal)}</span>
                  </div>
                  <div className="sum-row">
                    <span>Sub Total</span>
                    <span>₹{fmt(subTotalBeforeCoupon)}</span>
                  </div>
                  {couponDiscountPct > 0 && (
                    <div className="sum-row">
                      <span>Coupon ({couponDiscountPct}%)</span>
                      <span className="green">-₹{fmt(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="sum-row opt-row">
                    <label className="chk">
                      <input type="checkbox" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} />
                      <span>Gift Wrap</span>
                    </label>
                    <span>{giftWrap ? '₹39.00' : '₹0.00'}</span>
                  </div>
                  <div className="sum-row">
                    <span>Convenience Charges</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="sum-row total">
                    <span>You Pay</span>
                    <span>₹{fmt(youPay)}</span>
                  </div>
                  <div className="save-note">
                    <FaCheck />
                    <span>You are saving ₹{fmt(totalSaving)} on this order</span>
                  </div>
                  <button className="btn-buy" onClick={proceedToCheckout}>
                    Proceed to Buy
                  </button>
                </div>
              </div>
            </div>

            <div className="sticky-bar">
              <div className="sb-left">
                <strong>₹{fmt(youPay)}</strong>
                <span>Payable</span>
              </div>
              <button className="sb-btn" onClick={proceedToCheckout}>
                Checkout
              </button>
            </div>
          </>
        )}

        {showPopup && selectedItem && (
          <Popup
            image={selectedItem.image_url}
            message="Are you sure?"
            subMessage="It took you so long to find this item, wishlist instead."
            onConfirm={handleConfirmRemove}
            onCancel={() => setShowPopup(false)}
            onWishlist={() => {
              addToWishlist(selectedItem)
              setCartItems((prev) => prev.filter((i) => i.cart_id !== selectedItem.cart_id))
              setShowPopup(false)
              setToast('Moved to wishlist')
              setTimeout(() => setToast(''), 1500)
            }}
          />
        )}

        {showCoupon && (
          <div className="modal-wrap" onClick={() => setShowCoupon(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h4>Apply Coupon</h4>
              <div className="preset">
                <button onClick={() => setCouponInput('BLUE10')}>BLUE10</button>
                <button onClick={() => setCouponInput('FREESHIP')}>FREESHIP</button>
              </div>
              <input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Enter code" />
              <div className="modal-actions">
                <button className="btn ghost" onClick={() => setShowCoupon(false)}>
                  Close
                </button>
                <button className="btn solid" onClick={applyCoupon}>
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {showSuccess && (
          <div className="modal-wrap" onClick={() => setShowSuccess(false)}>
            <div className="modal success" onClick={(e) => e.stopPropagation()}>
              <div className="success-head">Order Placed Successfully</div>
              <p className="success-sub">Thank you for shopping with us.</p>
              <div className="modal-actions">
                <button className="btn solid" onClick={() => setShowSuccess(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {!!toast && <div className="toast">{toast}</div>}
      </div>
      <Footer />
    </div>
  )
}

export default Cart
