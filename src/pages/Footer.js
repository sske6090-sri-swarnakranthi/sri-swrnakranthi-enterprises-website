import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'
import { FaFacebookF, FaInstagram, FaTwitter, FaEnvelope, FaPhoneAlt, FaCcVisa, FaCcMastercard, FaCreditCard, FaMoneyBillAlt } from 'react-icons/fa'
import { SiRazorpay } from 'react-icons/si'

const POLICY_LINKS = {
  shipping: 'https://merchant.razorpay.com/policy/RYmfT0IFIA9UC6/shipping',
  terms: 'https://merchant.razorpay.com/policy/RYmfT0IFIA9UC6/terms',
  refund: 'https://merchant.razorpay.com/policy/RYmfT0IFIA9UC6/refund'
}

const PRODUCT_CATEGORIES = [
  'T-Shirts & Caps',
  'Key Chains',
  'Pens & Pen Stand',
  'Mobile Stand',
  'Travel Bags',
  'Wall Clocks',
  'Table Clocks',
  'Ladies Purse',
  'Gents Purse',
  'Ladies Bags',
  'Shopping Bags',
  'ATM Pouchs',
  'Cheque Book Folder',
  'Calendars',
  'Diarys & Notebooks',
  'Grocery Covers',
  'Shopping Covers',
  'Jewellery Boxs & Purses',
  'Mug Printing',
  'Sublimation Printing',
  'Visiting Cards',
  'Pamphlets',
  'Wedding Cards',
  'ID Cards',
  'School Diarys',
  'Progress Reports',
  'Ties & Belts',
  'Memontos & Medals'
]

const chunk = (arr, size) => {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

const Footer = () => {
  const [openIndex, setOpenIndex] = useState(null)
  const toggleSection = (index) => setOpenIndex(openIndex === index ? null : index)

  const buildCategoryPath = (item) => {
    const slug = encodeURIComponent(item)
    return `/products?category=${slug}`
  }

  const DesktopList = ({ items }) => (
    <ul>
      {items.map((item, i) => (
        <li key={i}>
          <Link className="link-btn" to={buildCategoryPath(item)}>
            {item}
          </Link>
        </li>
      ))}
    </ul>
  )

  const ExternalList = ({ items }) => (
    <ul>
      {items.map((it, i) => (
        <li key={i}>
          <a className="link-btn" href={it.href} target="_blank" rel="noreferrer">
            {it.label}
          </a>
        </li>
      ))}
    </ul>
  )

  const mobileSections = [
    {
      title: 'Shop Categories',
      items: PRODUCT_CATEGORIES
    },
    {
      title: 'Customer Service',
      items: ['Help Center', 'Shipping Info', 'Track Order', 'FAQs']
    },
    {
      title: 'Policies',
      external: true,
      items: [
        { href: POLICY_LINKS.shipping, label: 'Shipping Policy' },
        { href: POLICY_LINKS.terms, label: 'Terms & Conditions' },
        { href: POLICY_LINKS.refund, label: 'Cancellation & Refunds' }
      ]
    },
    {
      title: 'Contact',
      social: true,
      items: [
        <>
          <a className="link-btn" href="mailto:sske6090@gmail.com">
            <FaEnvelope /> sske6090@gmail.com
          </a>
        </>,
        <>
          <a className="link-btn" href="tel:+919908435065">
            <FaPhoneAlt /> +91-99084 35065
          </a>
        </>,
        <>
          <a className="link-btn" href="https://facebook.com" target="_blank" rel="noreferrer">
            <FaFacebookF /> Facebook
          </a>
        </>,
        <>
          <a className="link-btn" href="https://instagram.com" target="_blank" rel="noreferrer">
            <FaInstagram /> Instagram
          </a>
        </>,
        <>
          <a className="link-btn" href="https://twitter.com" target="_blank" rel="noreferrer">
            <FaTwitter /> Twitter
          </a>
        </>
      ]
    }
  ]

  const desktopChunks = chunk(PRODUCT_CATEGORIES, 7)

  return (
    <footer className="footer">
      <div className="footer-desktop">
        <div className="footer-column brand-sec">
          <h2 className="footer-title">Sri Swarnakranthi</h2>
          <p className="footer-tagline">
            Premium gift items, printing services, and custom products.
          </p>

          <div className="footer-contact">
            <a className="link-btn" href="mailto:sske6090@gmail.com">
              <FaEnvelope /> sske6090@gmail.com
            </a>
            <a className="link-btn" href="tel:+919908435065">
              <FaPhoneAlt /> +91-99084 35065
            </a>
          </div>

          <div className="footer-social">
            <a className="social-btn" href="https://facebook.com" target="_blank" rel="noreferrer">
              <FaFacebookF />
            </a>
            <a className="social-btn" href="https://instagram.com" target="_blank" rel="noreferrer">
              <FaInstagram />
            </a>
            <a className="social-btn" href="https://twitter.com" target="_blank" rel="noreferrer">
              <FaTwitter />
            </a>
          </div>
        </div>

        {desktopChunks.map((group, idx) => (
          <div className="footer-column" key={idx}>
            <h3>{idx === 0 ? 'Shop Categories' : 'More Products'}</h3>
            <DesktopList items={group} />
          </div>
        ))}

        <div className="footer-column">
          <h3>Policies</h3>
          <ExternalList
            items={[
              { href: POLICY_LINKS.shipping, label: 'Shipping Policy' },
              { href: POLICY_LINKS.terms, label: 'Terms & Conditions' },
              { href: POLICY_LINKS.refund, label: 'Cancellation & Refunds' }
            ]}
          />

          <div className="footer-payments">
            <h4>Secure Payments</h4>
            <div className="payments-row">
              <FaCcVisa className="payment-icon" />
              <FaCcMastercard className="payment-icon" />
              <FaCreditCard className="payment-icon" />
              <FaMoneyBillAlt className="payment-icon" />
              <SiRazorpay className="payment-icon" />
            </div>
          </div>
        </div>
      </div>

      <div className="footer-mobile">
        <h2 className="footer-title">Sri Swarnakranthi</h2>

        {mobileSections.map((section, index) => (
          <div className="footer-mobile-section" key={index}>
            <div className="footer-mobile-header" onClick={() => toggleSection(index)}>
              <h3>{section.title}</h3>
              <span>{openIndex === index ? '-' : '+'}</span>
            </div>

            <div className={`footer-mobile-list ${openIndex === index ? 'show' : ''}`}>
              <ul>
                {section.external
                  ? section.items.map((it, i) => (
                      <li key={i}>
                        <a className="link-btn" href={it.href} target="_blank" rel="noreferrer">
                          {it.label}
                        </a>
                      </li>
                    ))
                  : section.items.map((item, i) =>
                      section.social ? (
                        <li key={i}>{item}</li>
                      ) : (
                        <li key={i}>
                          <Link className="link-btn" to={buildCategoryPath(item)}>
                            {item}
                          </Link>
                        </li>
                      )
                    )}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-left">
          <a href={POLICY_LINKS.shipping} target="_blank" rel="noreferrer">Shipping</a>
          <span>•</span>
          <a href={POLICY_LINKS.refund} target="_blank" rel="noreferrer">Cancellation & Refunds</a>
          <span>•</span>
          <a href={POLICY_LINKS.terms} target="_blank" rel="noreferrer">Terms & Conditions</a>
        </div>
        <div className="footer-bottom-right">© {new Date().getFullYear()} Sri Swarnakranthi</div>
      </div>
    </footer>
  )
}

export default Footer
