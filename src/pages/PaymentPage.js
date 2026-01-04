import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import './PaymentPage.css';

const DEFAULT_API_BASE = 'https://taras-kart-backend.vercel.app';
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE;
const API_BASE = API_BASE_RAW.replace(/\/+$/, '');

async function postWithFallback(paths, payload) {
  let lastErr = null;
  for (const url of paths) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (r.ok) return await r.json();
      lastErr = new Error((await r.json().catch(() => ({})))?.message || `HTTP ${r.status}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Request failed');
}

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const saleIdFromState = location.state?.saleId || null;
  const saleIdFromQuery = searchParams.get('sale_id') || null;
  const saleId = saleIdFromState || saleIdFromQuery;

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successType, setSuccessType] = useState('');
  const [orderInfo, setOrderInfo] = useState(null);
  const [activeMethod, setActiveMethod] = useState('ONLINE_UPI');

  const createOrderPaths = useMemo(
    () => [
      `${API_BASE}/api/razorpay/payments/create-order`,
      `${API_BASE}/razorpay/payments/create-order`,
      `${API_BASE}/api/payments/create-order`
    ],
    []
  );

  const verifyPaths = useMemo(
    () => [
      `${API_BASE}/api/razorpay/payments/verify`,
      `${API_BASE}/razorpay/payments/verify`,
      `${API_BASE}/api/payments/verify`
    ],
    []
  );

  const codPaths = useMemo(
    () => [
      `${API_BASE}/api/sales/web/set-payment-status`,
      `${API_BASE}/sales/web/set-payment-status`
    ],
    []
  );

  const loadRazorpay = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
      document.body.appendChild(script);
    });

  const paymentLabel = useMemo(() => {
    if (activeMethod === 'ONLINE_UPI') return 'UPI';
    if (activeMethod === 'ONLINE_CARD') return 'Card';
    if (activeMethod === 'ONLINE_NETBANKING') return 'Netbanking';
    if (activeMethod === 'COD') return 'Cash on Delivery';
    return 'Payment';
  }, [activeMethod]);

  useEffect(() => {
    if (!saleId) {
      setError('Invalid or missing sale reference');
      setInitializing(false);
      return;
    }
    setInitializing(false);
  }, [saleId]);

  const startOnlinePayment = async () => {
    setError('');
    setLoading(true);
    try {
      const info = await postWithFallback(createOrderPaths, { sale_id: saleId });
      setOrderInfo(info);
      await loadRazorpay();
      const methodConfig =
        activeMethod === 'ONLINE_UPI'
          ? { method: { upi: 1, card: 0, netbanking: 0, wallet: 0 } }
          : activeMethod === 'ONLINE_CARD'
          ? { method: { upi: 0, card: 1, netbanking: 0, wallet: 0 } }
          : { method: { upi: 0, card: 0, netbanking: 1, wallet: 0 } };
      const rz = new window.Razorpay({
        key: info.key_id,
        amount: info.amount,
        currency: info.currency,
        order_id: info.order_id,
        name: 'Taras Kart',
        description: 'Secure Payment',
        prefill: { name: '', email: '', contact: '' },
        theme: { color: '#ffd700' },
        ...methodConfig,
        handler: async function (response) {
          try {
            const res = await postWithFallback(verifyPaths, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            if (res.ok) {
              try {
                if (saleId) {
                  await postWithFallback(codPaths, {
                    sale_id: saleId,
                    status: 'PAID'
                  });
                }
              } catch (err2) {
                console.error('Failed to set sale as PAID', err2);
              }
              setSuccessType('ONLINE');
              setSuccess(true);
            } else {
              setError('Payment verification failed');
            }
          } catch (e) {
            setError(e.message || 'Verification error');
          }
        },
        modal: {
          ondismiss: function () {
            setError('Payment was cancelled before completion');
          }
        }
      });
      rz.open();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmCOD = async () => {
    setError('');
    setLoading(true);
    try {
      if (!saleId) throw new Error('Missing sale reference');
      await postWithFallback(codPaths, { sale_id: saleId, status: 'COD' });
      setSuccessType('COD');
      setSuccess(true);
    } catch (e) {
      setError(e.message || 'Unable to set COD');
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="payment-page dark">
        <Navbar />
        <div className="payment-container">
          <div className="loader">Preparing secure checkout…</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="payment-page dark">
      <Navbar />
      <div className="payment-container">
        {!success && !error && (
          <>
            <h1 className="title">Choose Payment Method</h1>
            <div className="method-grid">
              <button
                className={`method-card ${activeMethod === 'ONLINE_UPI' ? 'active' : ''}`}
                onClick={() => setActiveMethod('ONLINE_UPI')}
              >
                <div className="method-title">UPI</div>
                <div className="method-sub">Pay via UPI apps</div>
              </button>
              <button
                className={`method-card ${activeMethod === 'ONLINE_CARD' ? 'active' : ''}`}
                onClick={() => setActiveMethod('ONLINE_CARD')}
              >
                <div className="method-title">Card</div>
                <div className="method-sub">Debit / Credit Cards</div>
              </button>
              <button
                className={`method-card ${activeMethod === 'ONLINE_NETBANKING' ? 'active' : ''}`}
                onClick={() => setActiveMethod('ONLINE_NETBANKING')}
              >
                <div className="method-title">Netbanking</div>
                <div className="method-sub">Pay via your bank</div>
              </button>
              <button
                className={`method-card ${activeMethod === 'COD' ? 'active' : ''}`}
                onClick={() => setActiveMethod('COD')}
              >
                <div className="method-title">Cash on Delivery</div>
                <div className="method-sub">Pay when you receive</div>
              </button>
            </div>

            <div className="pay-panel">
              <div className="panel-head">
                <div className="panel-title">{paymentLabel}</div>
                <div className="panel-sub">Sale Reference: {saleId?.slice(0, 8)}…</div>
              </div>

              {activeMethod !== 'COD' ? (
                <div className="panel-body">
                  <p className="panel-text">
                    You will complete your payment securely with Razorpay. Your details are encrypted and never stored by us.
                  </p>
                  <div className="panel-actions">
                    <button disabled={loading} className="btn solid" onClick={startOnlinePayment}>
                      {loading ? 'Opening Secure Gateway…' : 'Pay Securely'}
                    </button>
                    <button className="btn ghost" onClick={() => navigate('/cart')}>Back to Cart</button>
                  </div>
                  <div className="trust-note">PCI DSS compliant • 256-bit encryption • Instant confirmation</div>
                </div>
              ) : (
                <div className="panel-body">
                  <p className="panel-text">
                    Choose Cash on Delivery to pay in cash to our delivery partner. Keep the exact amount ready and ensure your phone is reachable.
                  </p>
                  <div className="panel-actions">
                    <button disabled={loading} className="btn solid" onClick={confirmCOD}>{loading ? 'Confirming…' : 'Confirm COD'}</button>
                    <button className="btn ghost" onClick={() => navigate('/cart')}>Back to Cart</button>
                  </div>
                  <div className="trust-note">No advance required • Pay only at delivery</div>
                </div>
              )}
            </div>
          </>
        )}

        {error && (
          <div className="error">
            <h2>We couldn’t complete your request</h2>
            <p>{error}</p>
            <div className="actions">
              <button className="btn solid" onClick={() => setError('')}>Try Again</button>
              <button className="btn ghost" onClick={() => navigate('/checkout')}>Back to Checkout</button>
            </div>
          </div>
        )}

        {success && successType === 'ONLINE' && (
          <div className="success">
            <h2>Payment Successful</h2>
            <p>Thank you. Your payment has been received and your order is confirmed.</p>
            {orderInfo?.order_id && <div className="order-id">Razorpay Order ID: {orderInfo.order_id}</div>}
            <div className="actions">
              <button className="btn solid" onClick={() => navigate('/')}>Continue Shopping</button>
              <button className="btn ghost" onClick={() => navigate('/orders')}>View Orders</button>
            </div>
          </div>
        )}

        {success && successType === 'COD' && (
          <div className="success">
            <h2>Cash on Delivery Selected</h2>
            <p>Your order has been placed with Cash on Delivery. You will receive delivery updates by SMS or email.</p>
            <div className="actions">
              <button className="btn solid" onClick={() => navigate('/')}>Continue Shopping</button>
              <button className="btn ghost" onClick={() => navigate('/orders')}>View Orders</button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
