import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const WishlistContext = createContext(null)

const getUserId = () => {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem('userId') || localStorage.getItem('userId') || ''
}

const readWishlistLocal = (userId) => {
  if (typeof window === 'undefined') return []
  if (!userId) return []
  try {
    const raw = localStorage.getItem(`wishlist:local:${userId}`)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

const writeWishlistLocal = (userId, list) => {
  if (typeof window === 'undefined') return
  if (!userId) return
  try {
    localStorage.setItem(`wishlist:local:${userId}`, JSON.stringify(list || []))
  } catch {}
}

const normalizeItem = (item) => {
  const images = Array.isArray(item?.images) ? item.images : []
  const image_url = item?.image_url || (images.length ? images[0] : '/images/placeholder.jpg')
  return {
    ...item,
    id: item?.product_id || item?.id,
    product_id: item?.product_id || item?.id,
    images,
    image_url
  }
}

export const WishlistProvider = ({ children }) => {
  const userId = useMemo(() => getUserId(), [])
  const [wishlistItems, setWishlistItemsState] = useState(() => readWishlistLocal(userId).map(normalizeItem))

  const setWishlistItems = (next) => {
    const list = (Array.isArray(next) ? next : []).map(normalizeItem)
    setWishlistItemsState(list)
    writeWishlistLocal(getUserId(), list)
    try {
      window.dispatchEvent(new CustomEvent('wishlist-local-updated', { detail: list }))
    } catch {}
  }

  const addToWishlist = (item) => {
    const uid = getUserId()
    if (!uid) return
    const normalized = normalizeItem(item)
    setWishlistItemsState((prev) => {
      const exists = prev.some((x) => String(x?.id) === String(normalized?.id))
      const next = exists ? prev : [normalized, ...prev]
      writeWishlistLocal(uid, next)
      try {
        window.dispatchEvent(new CustomEvent('wishlist-local-updated', { detail: next }))
      } catch {}
      return next
    })
  }

  const removeFromWishlist = (productId) => {
    const uid = getUserId()
    if (!uid) return
    setWishlistItemsState((prev) => {
      const next = prev.filter((x) => String(x?.id) !== String(productId))
      writeWishlistLocal(uid, next)
      try {
        window.dispatchEvent(new CustomEvent('wishlist-local-updated', { detail: next }))
      } catch {}
      return next
    })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onStorage = () => {
      const uid = getUserId()
      const next = readWishlistLocal(uid).map(normalizeItem)
      setWishlistItemsState(next)
    }

    const onCustom = (e) => {
      const next = Array.isArray(e?.detail) ? e.detail.map(normalizeItem) : []
      setWishlistItemsState(next)
      writeWishlistLocal(getUserId(), next)
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener('wishlist-local-updated', onCustom)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('wishlist-local-updated', onCustom)
    }
  }, [])

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        setWishlistItems,
        addToWishlist,
        removeFromWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => useContext(WishlistContext)
