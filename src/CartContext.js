import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const DEFAULT_API_BASE = 'http://localhost:5000'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = API_BASE_RAW.replace(/\/+$/, '')

const CartContext = createContext(null)

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

const normalizeCartRow = (row) => {
  const image = pickImage(row.images)
  return {
    id: row.cart_id,
    cart_id: row.cart_id,
    user_id: row.user_id,
    product_id: row.product_id,
    selected_size: row.selected_size ?? null,
    selected_color: row.selected_color ?? null,
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

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(false)

  const userId =
    (typeof window !== 'undefined' ? sessionStorage.getItem('userId') : '') ||
    (typeof window !== 'undefined' ? localStorage.getItem('userId') : '') ||
    ''

  const fetchCartItems = async () => {
    if (!isIntId(userId)) {
      setCartItems([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/cart/${userId}`, { cache: 'no-store' })
      if (!res.ok) {
        setCartItems([])
        return
      }
      const data = await res.json()
      const arr = Array.isArray(data) ? data : []
      setCartItems(arr.map(normalizeCartRow))
    } catch {
      setCartItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCartItems()
  }, [userId])

  const addToCart = async (item) => {
    const uid =
      (typeof window !== 'undefined' ? sessionStorage.getItem('userId') : '') ||
      (typeof window !== 'undefined' ? localStorage.getItem('userId') : '') ||
      userId

    if (!isIntId(uid)) return false

    const productId = Number(item.product_id || item.productId || item.id || item.product?.id || 0)
    const selectedSize = (item.selectedSize || item.selected_size || item.size || '').trim()
    const selectedColor = (item.selectedColor || item.selected_color || item.color || item.colour || '').trim()
    const quantity = Number(item.quantity || 1)

    if (!productId) return false

    try {
      const res = await fetch(`${API_BASE}/api/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: String(uid),
          product_id: productId,
          selected_size: selectedSize ? selectedSize : null,
          selected_color: selectedColor ? selectedColor : null,
          quantity
        })
      })

      if (!res.ok) return false
      await fetchCartItems()
      return true
    } catch {
      return false
    }
  }

  const removeFromCart = async (cartIdOrItem) => {
    const uid =
      (typeof window !== 'undefined' ? sessionStorage.getItem('userId') : '') ||
      (typeof window !== 'undefined' ? localStorage.getItem('userId') : '') ||
      userId

    if (!isIntId(uid)) return false

    let row = null

    if (typeof cartIdOrItem === 'object' && cartIdOrItem) {
      row = cartIdOrItem
    } else {
      const cid = Number(cartIdOrItem)
      row = cartItems.find((x) => Number(x.cart_id) === cid) || null
    }

    if (!row) return false

    try {
      const res = await fetch(`${API_BASE}/api/cart`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: String(uid),
          product_id: Number(row.product_id),
          selected_size: row.selected_size ?? null,
          selected_color: row.selected_color ?? null
        })
      })

      if (!res.ok) return false
      await fetchCartItems()
      return true
    } catch {
      return false
    }
  }

  const updateQuantity = async (cartId, quantity) => {
    const uid =
      (typeof window !== 'undefined' ? sessionStorage.getItem('userId') : '') ||
      (typeof window !== 'undefined' ? localStorage.getItem('userId') : '') ||
      userId

    if (!isIntId(uid)) return false

    const qty = Number(quantity)
    if (!Number.isInteger(qty) || qty < 1) return false

    const row = cartItems.find((x) => Number(x.cart_id) === Number(cartId)) || null
    if (!row) return false

    try {
      const res = await fetch(`${API_BASE}/api/cart`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: String(uid),
          product_id: Number(row.product_id),
          selected_size: row.selected_size ?? null,
          selected_color: row.selected_color ?? null,
          quantity: qty
        })
      })

      if (!res.ok) return false
      await fetchCartItems()
      return true
    } catch {
      return false
    }
  }

  const value = useMemo(
    () => ({
      cartItems,
      loading,
      fetchCartItems,
      addToCart,
      removeFromCart,
      updateQuantity
    }),
    [cartItems, loading]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
