import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import { useCart } from '../CartContext'
import { useWishlist } from '../WishlistContext'
import './Cart.css'
import { FaTimes, FaCheck, FaTag } from 'react-icons/fa'
import Popup from './Popup'
import { useNavigate } from 'react-router-dom'

const DEFAULT_API_BASE = 'https://sri-swarnakranthi-enterprises-backe.vercel.app'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = String(API_BASE_RAW || DEFAULT_API_BASE).replace(/\/+$/, '')

const getStored = (key, fallback = '') => {
  if (typeof window === 'undefined') return fallback
  return sessionStorage.getItem(key) || localStorage.getItem(key) || fallback
}

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

const getProductName = (row) => row?.name ?? row?.product_name ?? ''
const getBrand = (row) => row?.brand ?? ''
const getMrp = (row) => Number(row?.price ?? row?.mrp ?? 0)
const getOffer = (row) => Number(row?.discounted_price ?? row?.offer ?? row?.price ?? 0)

const Cart = () => {
  const navigate = useNavigate()
  const { addToWishlist } = useWishlist()
  const { removeFromCart, fetchCartItems: fetchCartItemsFromCtx } = useCart()

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
  const [loading, setLoading] = useState(true)

  const [userId, setUserId] = useState(() => getStored('userId', ''))

  const toastTimerRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const syncFromStorage = () => {
      const nextUserId = getStored('userId', '')
      setUserId((prev) => (prev === nextUserId ? prev : nextUserId))
    }
    window.addEventListener('storage', syncFromStorage)
    window.addEventListener('focus', syncFromStorage)
    return () => {
      window.removeEventListener('storage', syncFromStorage)
      window.removeEventListener('focus', syncFromStorage)
    }
  }, [])

  const setToastSafe = useCallback((msg, ms = 1500) => {
    setToast(msg)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(''), ms)
  }, [])

  const fmt = (n) => Number(n || 0).toFixed(2)

  const getItemPricing = useCallback((item) => {
    const mrp = getMrp(item)
    const offer = getOffer(item) || mrp
    return { mrp, offer }
  }, [])

  const normalizeCartRow = useCallback((row) => {
    const image = row?.image_url || pickImage(row?.images)
    return {
      id: row?.cart_id ?? row?.id,
      cart_id: row?.cart_id ?? row?.id,
      user_id: row?.user_id,
      product_id: row?.product_id,
      quantity: Number(row?.quantity || 1),
      variant: row?.variant ?? null,
      name: row?.name ?? null,
      product_name: row?.product_name ?? null,
      brand: row?.brand ?? null,
      category_slug: row?.category_slug ?? null,
      price: row?.price ?? null,
      discounted_price: row?.discounted_price ?? null,
      description: row?.description ?? null,
      images: row?.images ?? [],
      image_url: image,
      created_at: row?.created_at
    }
  }, [])

  const fetchCartItems = useCallback(async () => {
    if (!userId || !isIntId(userId)) {
      setCartItems([])
      setQuantities({})
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/cart/${userId}`, { cache: 'no-store' })
      if (!res.ok) {
        setCartItems([])
        setQuantities({})
        setLoading(false)
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
    } finally {
      setLoading(false)
    }
  }, [normalizeCartRow, userId])

  useEffect(() => {
    fetchCartItems()
  }, [fetchCartItems])

  const handleRemoveClick = (item) => {
    setSelectedItem(item)
    setShowPopup(true)
  }

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase()
    if (code === 'BLUE10') {
      setCouponDiscountPct(10)
      setToastSafe('BLUE10 applied', 1500)
    } else if (code === 'FREESHIP') {
      setCouponDiscountPct(0)
      setToastSafe('FREESHIP applied', 1500)
    } else {
      setCouponDiscountPct(0)
      setToastSafe('Invalid coupon', 1500)
    }
    setShowCoupon(false)
  }

  const handleConfirmRemove = async () => {
    if (selectedItem && userId && isIntId(userId)) {
      await fetch(`${API_BASE}/api/cart`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart_id: Number(selectedItem.cart_id),
          user_id: Number(userId),
          product_id: Number(selectedItem.product_id),
          variant: selectedItem.variant ?? null
        })
      })

      setCartItems((prev) => prev.filter((it) => String(it.cart_id) !== String(selectedItem.cart_id)))

      try {
        await removeFromCart(selectedItem.cart_id)
      } catch {}

      try {
        if (typeof fetchCartItemsFromCtx === 'function') await fetchCartItemsFromCtx()
      } catch {}

      setToastSafe('Item removed', 1600)
    }
    setShowPopup(false)
  }

  const handleQuantityChange = async (cartId, value) => {
    const quantity = Math.max(1, parseInt(value, 10) || 1)
    setQuantities((prev) => ({ ...prev, [cartId]: quantity }))

    if (!userId || !isIntId(userId)) return
    const row = cartItems.find((x) => String(x.cart_id) === String(cartId))
    if (!row) return

    await fetch(`${API_BASE}/api/cart`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cart_id: Number(row.cart_id),
        user_id: Number(userId),
        product_id: Number(row.product_id),
        variant: row.variant ?? null,
        quantity
      })
    })

    setToastSafe('Quantity updated', 1200)
  }

  const bagTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const key = item.cart_id
      const qty = quantities[key] || 1
      const { mrp } = getItemPricing(item)
      return total + mrp * qty
    }, 0)
  }, [cartItems, quantities, getItemPricing])

  const discountTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const key = item.cart_id
      const qty = quantities[key] || 1
      const { mrp, offer } = getItemPricing(item)
      if (!mrp || offer >= mrp) return total
      return total + (mrp - offer) * qty
    }, 0)
  }, [cartItems, quantities, getItemPricing])

  const subTotalBeforeCoupon = bagTotal - discountTotal
  const couponDiscount = (subTotalBeforeCoupon * couponDiscountPct) / 100
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
          variant: item.variant ?? '',
          image_url: item.image_url || null,
          product_name: getProductName(item),
          brand: getBrand(item)
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
        {loading ? (
          <div className="cart-empty">
            <h2>Loading your bag...</h2>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="cart-empty">
            <img src="/images/emptyWishlist.avif" alt="Empty cart" />
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
                  const name = getProductName(item)

                  return (
                    <div className="cart-card" key={key}>
                      <button className="card-remove" onClick={() => handleRemoveClick(item)}>
                        <FaTimes />
                      </button>

                      <div className="card-media">
                        <img src={item.image_url} alt={name || 'Product'} />
                      </div>

                      <div className="card-body">
                        <div className="card-top">
                          <h4 className="brand">{getBrand(item) || 'Brand'}</h4>
                          <p className="name">{name || 'Product'}</p>
                        </div>

                        <div className="card-opts">
                          <div className="opt">
                            <span className="opt-label">Variant</span>
                            <span className="select">{item.variant ? item.variant : '-'}</span>
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
                    <span className="blue">-₹{fmt(discountTotal)}</span>
                  </div>
                  <div className="sum-row">
                    <span>Sub Total</span>
                    <span>₹{fmt(subTotalBeforeCoupon)}</span>
                  </div>
                  {couponDiscountPct > 0 && (
                    <div className="sum-row">
                      <span>Coupon ({couponDiscountPct}%)</span>
                      <span className="blue">-₹{fmt(couponDiscount)}</span>
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
            onWishlist={async () => {
              try {
                if (userId && isIntId(userId) && selectedItem?.product_id) {
                  await fetch(`${API_BASE}/api/wishlist`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: Number(userId), product_id: Number(selectedItem.product_id) })
                  })
                }
              } catch {}

              addToWishlist(selectedItem)

              try {
                if (userId && isIntId(userId) && selectedItem?.cart_id) {
                  await fetch(`${API_BASE}/api/cart`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      cart_id: Number(selectedItem.cart_id),
                      user_id: Number(userId),
                      product_id: Number(selectedItem.product_id),
                      variant: selectedItem.variant ?? null
                    })
                  })
                }
              } catch {}

              setCartItems((prev) => prev.filter((i) => String(i.cart_id) !== String(selectedItem.cart_id)))
              setShowPopup(false)
              setToastSafe('Moved to wishlist', 1500)
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
