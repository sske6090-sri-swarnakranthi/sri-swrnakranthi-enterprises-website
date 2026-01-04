// D:\gifts-website\src\pages\CustomerCare.js
import React from 'react'
import './CustomerCare.css'
import { FiPhoneCall, FiMail, FiMessageSquare, FiMapPin, FiArrowRight } from 'react-icons/fi'

const CustomerCare = () => {
  return (
    <div className="care-page">
      <div className="care-bg" />

      <div className="care-container">
        <header className="care-hero">
          <div className="care-badge">Support Center</div>

          <h1 className="care-title">
            Customer Care <span>24/7</span>
          </h1>

          <p className="care-subtitle">
            Need help with orders, payments, account, or delivery updates? Our support team is always ready.
          </p>

          <div className="care-meta">
            <span className="meta-pill primary">Fast replies</span>
            <span className="meta-pill">Avg response within 2 hours</span>
            <span className="meta-pill">Mon–Sat: 10AM – 6PM</span>
          </div>
        </header>

        <section className="care-layout">
          <div className="care-list">
            <div className="care-item">
              <div className="care-item-main">
                <div className="care-icon-wrap">
                  <FiPhoneCall />
                </div>
                <div className="care-text">
                  <h2>Call us</h2>
                  <p className="care-label">Phone</p>
                  <p className="care-value">+91 81791 97108</p>
                </div>
              </div>

              <a className="care-action" href="tel:+918179197108">
                <span>Call now</span>
                <FiArrowRight />
              </a>
            </div>

            <div className="care-item">
              <div className="care-item-main">
                <div className="care-icon-wrap">
                  <FiMail />
                </div>
                <div className="care-text">
                  <h2>Email us</h2>
                  <p className="care-label">Support email</p>
                  <p className="care-value">taraskartonline@gmail.com</p>
                </div>
              </div>

              <a className="care-action" href="mailto:taraskartonline@gmail.com">
                <span>Send email</span>
                <FiArrowRight />
              </a>
            </div>

            <div className="care-item">
              <div className="care-item-main">
                <div className="care-icon-wrap">
                  <FiMessageSquare />
                </div>
                <div className="care-text">
                  <h2>Chat support</h2>
                  <p className="care-label">Instant assistance</p>
                  <p className="care-value">Use the chat bubble at the bottom right corner</p>
                </div>
              </div>

              <a className="care-action secondary" href="#chat">
                <span>Open chat</span>
                <FiArrowRight />
              </a>
            </div>

            <div className="care-item">
              <div className="care-item-main">
                <div className="care-icon-wrap">
                  <FiMapPin />
                </div>
                <div className="care-text">
                  <h2>Office address</h2>
                  <p className="care-label">Head office</p>
                  <p className="care-value">
                    Door No: 16-1-61, MG Road, Manhar Shopping Mall, Vizianagaram, Andhra Pradesh, 535002
                  </p>
                </div>
              </div>

              <a
                className="care-action secondary"
                href="https://www.google.com/maps/search/?api=1&query=Vizianagaram+MG+Road+Manhar+Shopping+Mall"
                target="_blank"
                rel="noreferrer"
              >
                <span>Open Maps</span>
                <FiArrowRight />
              </a>
            </div>
          </div>

          <aside className="care-side">
            <div className="care-side-inner">
              <h3>When should you contact us?</h3>

              <ul className="care-list-points">
                <li>Order delivery updates, tracking, and dispatch details</li>
                <li>Refund, cancellation, or payment related issues</li>
                <li>Account login, profile, or password support</li>
                <li>Custom product orders and bulk gifting queries</li>
              </ul>

              <div className="care-side-note">
                Keep your <strong>Order ID</strong> ready for faster support.
              </div>
            </div>
          </aside>
        </section>

        <section className="care-note">
          <div className="note-overlay" />
          <div className="care-note-content">
            <h4>We value your feedback</h4>
            <p>
              Your experience helps us improve. If you faced an issue or have any suggestions, we’d love to hear from you.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default CustomerCare
