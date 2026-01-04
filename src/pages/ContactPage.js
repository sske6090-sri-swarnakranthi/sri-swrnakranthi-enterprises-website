import React, { useMemo, useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "./ContactPage.css";

const ContactPage = () => {
  const heroImg =
    "/images/banners/close-up-portrait-man-women-exchanging-different-presents-isolated-white-presents-sharing-people.jpg";

  const gallery = useMemo(
    () => [
      { src: "/images/banners/printing/printing1.jpg", label: "Printing" },
      { src: "/images/banners/printing/printing5.jpg", label: "Branding" },
      { src: "/images/banners/clocks/clock3.jpg", label: "Clocks" },
      { src: "/images/banners/stationary/stationary5.jpg", label: "Stationery" },
      { src: "/images/banners/school/school6.jpg", label: "School Items" },
      { src: "/images/banners/center-clock.jpg", label: "Wall & Table Clocks" },
      { src: "/images/banners/id cards-printing.png", label: "ID Cards" },
      { src: "/images/banners/mug-printing.webp", label: "Mug Printing" },
    ],
    []
  );

  const services = useMemo(
    () => [
      { title: "T-Shirts & Caps", desc: "Custom prints, names, logos, bulk orders." },
      { title: "Key Chains", desc: "Above 300 models, perfect for events and gifts." },
      { title: "Printing Works", desc: "Visiting cards, pamphlets, wedding cards, ID cards." },
      { title: "Calendars & Diaries", desc: "School diaries, notebooks, progress reports." },
      { title: "Bags & Pouches", desc: "Travel bags, shopping bags, ATM pouches, folders." },
      { title: "Sublimation", desc: "Mugs, photo gifts, premium quality finishing." },
      { title: "Mementos & Medals", desc: "Awards, corporate gifting, school functions." },
      { title: "Accessories", desc: "Pens, stands, mobile stands, ties & belts." },
    ],
    []
  );

  const contact = useMemo(
    () => ({
      brand: "Sri Swarnakranthi Enterprises",
      tagline: "Customized Gifting & All Types of Printing Works",
      phonePrimary: "99 08 43 50 65",
      phoneAlt: "45 757",
      address:
        "Near 7Road Jn., Pandumpulla Jn., Kalinga Road, Danvanthari Building, Opp. Chandramouli Brothers, Srikakulam - 532 001.",
      email: "support@sriswarnakranthi.com",
    }),
    []
  );

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    need: "",
    budget: "Not sure",
    timeline: "This week",
  });

  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = useMemo(
    () => [
      {
        q: "Do you take bulk orders for events and offices?",
        a: "Yes. We handle bulk gifting and printing for corporate, schools, and events. Share quantity and design, we will guide you.",
      },
      {
        q: "What can you customize?",
        a: "T-shirts, caps, mugs, key chains, bags, diaries, calendars, ID cards, visiting cards, wedding cards, and more.",
      },
      {
        q: "How fast can you deliver?",
        a: "Depends on quantity and design. Many items can be ready within a few days. Tell us your deadline and we will plan it.",
      },
      {
        q: "Can I bring my own design or logo?",
        a: "Yes. You can share your logo or artwork on WhatsApp or email. We can also help with basic layout improvements.",
      },
      {
        q: "Do you have a minimum order?",
        a: "Some categories have minimums for best pricing (especially key chains and bulk printing). Message us and we will confirm.",
      },
      {
        q: "Do you offer samples?",
        a: "For select items and bulk orders, we can show material options and a sample preview before final production.",
      },
    ],
    []
  );

  const steps = useMemo(
    () => [
      { t: "Tell us what you want", d: "Share product type, quantity, and design idea." },
      { t: "Get a quick quote", d: "We confirm price and time based on your requirements." },
      { t: "Approve and relax", d: "We produce with clean finishing and update you quickly." },
    ],
    []
  );

  const highlights = useMemo(
    () => [
      { t: "Clean finishing", d: "Sharp print, neat edges, and premium quality." },
      { t: "Bulk friendly", d: "Best value pricing for schools, offices, and events." },
      { t: "Fast support", d: "Call or WhatsApp, you get quick updates." },
      { t: "Many categories", d: "Gifts, printing, school items, and accessories." },
    ],
    []
  );

  const mapSrc =
    "https://www.google.com/maps?q=Near%207Road%20Jn.%2C%20Pandumpulla%20Jn.%2C%20Kalinga%20Road%2C%20Srikakulam%20532001&output=embed";

  const onChange = (e) => {
    const { name, value } = e.target;
    setSent(false);
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  const waLink = `https://wa.me/91${contact.phonePrimary.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Hi ${contact.brand}, I need customized gifting/printing. My requirement: ${form.need || "(details)"}`
  )}`;

  return (
    <>
      <Navbar />
      <main className="cp">
        <section className="cp-hero" style={{ backgroundImage: `url(${heroImg})` }}>
          <div className="cp-heroOverlay" />
          <div className="cp-heroGlow" />
          <div className="cp-container cp-heroInner">
            <div className="cp-heroText">
              <div className="cp-kickerRow">
                <p className="cp-kicker">CONTACT US</p>
                <span className="cp-pill">Srikakulam</span>
              </div>

              <h1 className="cp-title">{contact.brand}</h1>
              <p className="cp-subtitle">{contact.tagline}</p>

              <div className="cp-heroBadges">
                <span className="cp-badge">Customized Gifting</span>
                <span className="cp-badge">Sublimation</span>
                <span className="cp-badge">Printing Works</span>
                <span className="cp-badge">Bulk Orders</span>
              </div>

              <div className="cp-heroActions">
                <a className="cp-btn cp-btnPrimary" href={`tel:${contact.phonePrimary.replace(/\s/g, "")}`}>
                  Call Now
                </a>
                <a className="cp-btn cp-btnGhost" href={waLink} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
                <a className="cp-btn cp-btnGlass" href="#cp-map">
                  Directions
                </a>
              </div>

              <div className="cp-miniRow">
                <div className="cp-miniItem">
                  <span className="cp-miniLabel">Primary</span>
                  <span className="cp-miniValue">{contact.phonePrimary}</span>
                </div>
                <div className="cp-miniItem">
                  <span className="cp-miniLabel">Alternate</span>
                  <span className="cp-miniValue">{contact.phoneAlt}</span>
                </div>
                <div className="cp-miniItem">
                  <span className="cp-miniLabel">Support</span>
                  <span className="cp-miniValue">{contact.email}</span>
                </div>
              </div>

              <div className="cp-socialRow">
                <a className="cp-social" href={waLink} target="_blank" rel="noreferrer">
                  <span className="cp-socialIcon">💬</span>
                  <span className="cp-socialText">WhatsApp</span>
                </a>
                <a className="cp-social" href={`tel:${contact.phonePrimary.replace(/\s/g, "")}`}>
                  <span className="cp-socialIcon">📞</span>
                  <span className="cp-socialText">Call</span>
                </a>
                <a
                  className="cp-social"
                  href="https://www.google.com/maps/search/?api=1&query=Near%207Road%20Jn%2C%20Pandumpulla%20Jn%2C%20Kalinga%20Road%2C%20Srikakulam%20532001"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="cp-socialIcon">📍</span>
                  <span className="cp-socialText">Maps</span>
                </a>
              </div>
            </div>

            <div className="cp-heroCard">
              <div className="cp-heroCardTop">
                <div className="cp-dot" />
                <p className="cp-heroCardTitle">Quick Request</p>
                <span className="cp-miniTag">Fast reply</span>
              </div>

              <form className="cp-form" onSubmit={onSubmit}>
                <div className="cp-fieldRow">
                  <div className="cp-field">
                    <label className="cp-label" htmlFor="name">
                      Your Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={onChange}
                      className="cp-input"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                  <div className="cp-field">
                    <label className="cp-label" htmlFor="phone">
                      Phone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={onChange}
                      className="cp-input"
                      placeholder="Mobile number"
                      inputMode="numeric"
                      required
                    />
                  </div>
                </div>

                <div className="cp-fieldRow">
                  <div className="cp-field">
                    <label className="cp-label" htmlFor="email">
                      Email (optional)
                    </label>
                    <input
                      id="email"
                      name="email"
                      value={form.email}
                      onChange={onChange}
                      className="cp-input"
                      placeholder="you@example.com"
                      type="email"
                    />
                  </div>
                  <div className="cp-field">
                    <label className="cp-label" htmlFor="timeline">
                      Timeline
                    </label>
                    <select
                      id="timeline"
                      name="timeline"
                      value={form.timeline}
                      onChange={onChange}
                      className="cp-select"
                    >
                      <option>This week</option>
                      <option>Next week</option>
                      <option>This month</option>
                      <option>Specific date</option>
                    </select>
                  </div>
                </div>

                <div className="cp-field">
                  <label className="cp-label" htmlFor="need">
                    What do you need?
                  </label>
                  <textarea
                    id="need"
                    name="need"
                    value={form.need}
                    onChange={onChange}
                    className="cp-textarea"
                    placeholder="Example: 200 key chains with logo, 300 visiting cards, mug printing, calendars..."
                    rows={4}
                    required
                  />
                </div>

                <div className="cp-fieldRow">
                  <div className="cp-field">
                    <label className="cp-label" htmlFor="budget">
                      Budget
                    </label>
                    <select id="budget" name="budget" value={form.budget} onChange={onChange} className="cp-select">
                      <option>Not sure</option>
                      <option>Under ₹1,000</option>
                      <option>₹1,000 to ₹5,000</option>
                      <option>₹5,000 to ₹15,000</option>
                      <option>₹15,000+</option>
                    </select>
                  </div>
                  <div className="cp-field">
                    <label className="cp-label" htmlFor="category">
                      Category
                    </label>
                    <select id="category" name="category" onChange={() => {}} className="cp-select">
                      <option>Choose one</option>
                      <option>Gifts</option>
                      <option>Printing</option>
                      <option>School Items</option>
                      <option>Accessories</option>
                    </select>
                  </div>
                </div>

                <button className="cp-btn cp-btnPrimary cp-btnFull" type="submit">
                  Send Request
                </button>

                <div className="cp-orRow">
                  <span className="cp-orLine" />
                  <span className="cp-orText">or</span>
                  <span className="cp-orLine" />
                </div>

                <a className="cp-btn cp-btnGhost cp-btnFull" href={waLink} target="_blank" rel="noreferrer">
                  Send on WhatsApp
                </a>

                {sent && (
                  <div className="cp-toast" role="status" aria-live="polite">
                    Thanks{form.name ? `, ${form.name}` : ""}! We will contact you soon.
                  </div>
                )}
              </form>
            </div>
          </div>

          <div className="cp-container cp-heroStats">
            {highlights.map((h) => (
              <div key={h.t} className="cp-stat">
                <p className="cp-statT">{h.t}</p>
                <p className="cp-statD">{h.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="cp-section">
          <div className="cp-container">
            <div className="cp-sectionHead">
              <h2 className="cp-h2">Reach us fast</h2>
              <p className="cp-p">
                Call, WhatsApp, or visit our store. We can help with design suggestions, material options, and bulk pricing.
              </p>
            </div>

            <div className="cp-cards">
              <a className="cp-card" href={`tel:${contact.phonePrimary.replace(/\s/g, "")}`}>
                <div className="cp-cardIcon">
                  <span className="cp-icon">📞</span>
                </div>
                <div className="cp-cardBody">
                  <p className="cp-cardTitle">Phone</p>
                  <p className="cp-cardText">{contact.phonePrimary}</p>
                  <p className="cp-cardHint">Tap to call</p>
                </div>
              </a>

              <a className="cp-card" href={waLink} target="_blank" rel="noreferrer">
                <div className="cp-cardIcon">
                  <span className="cp-icon">💬</span>
                </div>
                <div className="cp-cardBody">
                  <p className="cp-cardTitle">WhatsApp</p>
                  <p className="cp-cardText">Chat with us</p>
                  <p className="cp-cardHint">Share designs and quantity</p>
                </div>
              </a>

              <div className="cp-card">
                <div className="cp-cardIcon">
                  <span className="cp-icon">📍</span>
                </div>
                <div className="cp-cardBody">
                  <p className="cp-cardTitle">Address</p>
                  <p className="cp-cardText">{contact.address}</p>
                  <p className="cp-cardHint">Srikakulam - 532 001</p>
                </div>
              </div>

              <div className="cp-card">
                <div className="cp-cardIcon">
                  <span className="cp-icon">🕒</span>
                </div>
                <div className="cp-cardBody">
                  <p className="cp-cardTitle">Working Hours</p>
                  <p className="cp-cardText">Mon to Sat: 9:30 AM to 8:30 PM</p>
                  <p className="cp-cardHint">Sunday: Call to confirm</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="cp-section cp-split">
          <div className="cp-container cp-splitGrid">
            <div className="cp-splitLeft">
              <div className="cp-sectionHead">
                <h2 className="cp-h2">What we do</h2>
                <p className="cp-p">
                  From gifting to printing, we handle end-to-end customization. Choose a category, share your idea, and we
                  will suggest the best fit.
                </p>
              </div>

              <div className="cp-serviceGrid">
                {services.map((s) => (
                  <div key={s.title} className="cp-service">
                    <p className="cp-serviceTitle">{s.title}</p>
                    <p className="cp-serviceDesc">{s.desc}</p>
                  </div>
                ))}
              </div>

              <div className="cp-steps">
                <p className="cp-stepsTitle">How it works</p>
                <div className="cp-stepsGrid">
                  {steps.map((st, idx) => (
                    <div key={st.t} className="cp-step">
                      <div className="cp-stepNo">{String(idx + 1).padStart(2, "0")}</div>
                      <div className="cp-stepBody">
                        <p className="cp-stepT">{st.t}</p>
                        <p className="cp-stepD">{st.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="cp-splitRight">
              <div className="cp-photoStack">
                <div className="cp-photoCard">
                  <img
                    className="cp-photo"
                    src="/images/banners/printing/printing2.jpg"
                    alt="Printing work"
                    loading="lazy"
                  />
                  <div className="cp-photoCap">
                    <p className="cp-photoTitle">Premium printing finish</p>
                    <p className="cp-photoText">Visiting cards, pamphlets, wedding cards, and more.</p>
                  </div>
                </div>

                <div className="cp-photoCard">
                  <img
                    className="cp-photo"
                    src="/images/banners/Calenders and diaries.webp"
                    alt="Calendars and diaries"
                    loading="lazy"
                  />
                  <div className="cp-photoCap">
                    <p className="cp-photoTitle">Diaries and calendars</p>
                    <p className="cp-photoText">Great for schools and offices, with custom branding.</p>
                  </div>
                </div>
              </div>

              <div className="cp-note">
                <p className="cp-noteTitle">Also available</p>
                <p className="cp-noteText">
                  Ties & belts, cheque book folders, jewellery boxes, purses, pens stands, mobile stands, travel bags,
                  wall clocks, table clocks, mementos & medals.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="cp-section cp-dark">
          <div className="cp-container">
            <div className="cp-sectionHead cp-sectionHeadDark">
              <h2 className="cp-h2">Gallery</h2>
              <p className="cp-p cp-pDark">A quick look at the kind of work we do, across gifting and printing.</p>
            </div>

            <div className="cp-gallery">
              {gallery.map((g) => (
                <div key={g.src} className="cp-galleryItem">
                  <img className="cp-galleryImg" src={g.src} alt={g.label} loading="lazy" />
                  <div className="cp-galleryTag">{g.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cp-section" id="cp-map">
          <div className="cp-container">
            <div className="cp-sectionHead">
              <h2 className="cp-h2">Find our shop</h2>
              <p className="cp-p">
                Near 7Road Junction, Pandumpulla Junction, Kalinga Road, Danvanthari Building, Opp. Chandramouli Brothers,
                Srikakulam.
              </p>
            </div>

            <div className="cp-mapWrap">
              <iframe
                title="Sri Swarnakranthi Enterprises location"
                className="cp-map"
                src={mapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />

              <div className="cp-mapAside">
                <div className="cp-mapCard">
                  <p className="cp-mapTitle">Need directions?</p>
                  <p className="cp-mapText">
                    Tap below to open maps, or send a WhatsApp message and we will guide you from your nearest landmark.
                  </p>
                  <div className="cp-mapBtns">
                    <a
                      className="cp-btn cp-btnPrimary"
                      href="https://www.google.com/maps/search/?api=1&query=Near%207Road%20Jn%2C%20Pandumpulla%20Jn%2C%20Kalinga%20Road%2C%20Srikakulam%20532001"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Maps
                    </a>
                    <a className="cp-btn cp-btnGhost" href={waLink} target="_blank" rel="noreferrer">
                      WhatsApp Us
                    </a>
                  </div>
                </div>

                <div className="cp-miniBanner">
                  <div className="cp-miniBannerLeft">
                    <p className="cp-miniBannerTitle">Walk-in support</p>
                    <p className="cp-miniBannerText">Material options, size choices, and quick suggestions.</p>
                  </div>
                  <img
                    className="cp-miniBannerImg"
                    src="/images/banners/left-banner.png"
                    alt="Banner"
                    loading="lazy"
                  />
                </div>

                <div className="cp-trust">
                  <p className="cp-trustTitle">Why customers come back</p>
                  <div className="cp-trustGrid">
                    <div className="cp-trustItem">
                      <p className="cp-trustT">Neat finishing</p>
                      <p className="cp-trustD">Clean prints and good material options.</p>
                    </div>
                    <div className="cp-trustItem">
                      <p className="cp-trustT">Quick support</p>
                      <p className="cp-trustD">Fast replies on call and WhatsApp.</p>
                    </div>
                    <div className="cp-trustItem">
                      <p className="cp-trustT">Bulk ready</p>
                      <p className="cp-trustD">Ideal for schools and corporate orders.</p>
                    </div>
                    <div className="cp-trustItem">
                      <p className="cp-trustT">Many categories</p>
                      <p className="cp-trustD">Gifting and printing in one place.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="cp-section cp-soft">
          <div className="cp-container">
            <div className="cp-sectionHead">
              <h2 className="cp-h2">Frequently asked questions</h2>
              <p className="cp-p">If you have a special request, message us and we will make it happen.</p>
            </div>

            <div className="cp-faq">
              {faqs.map((f, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <button
                    key={f.q}
                    type="button"
                    className={`cp-faqItem ${isOpen ? "isOpen" : ""}`}
                    onClick={() => setOpenFaq((p) => (p === idx ? -1 : idx))}
                    aria-expanded={isOpen}
                  >
                    <div className="cp-faqTop">
                      <span className="cp-faqQ">{f.q}</span>
                      <span className="cp-faqPlus">{isOpen ? "−" : "+"}</span>
                    </div>
                    <div className="cp-faqA" style={{ maxHeight: isOpen ? 190 : 0 }}>
                      <div className="cp-faqInner">{f.a}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="cp-section">
          <div className="cp-container">
            <div className="cp-cta">
              <div className="cp-ctaLeft">
                <p className="cp-ctaTitle">Ready to customize?</p>
                <p className="cp-ctaText">
                  Share your requirement, quantity, and deadline. We will suggest the right products and the best pricing.
                </p>
                <div className="cp-ctaBtns">
                  <a className="cp-btn cp-btnPrimary" href={`tel:${contact.phonePrimary.replace(/\s/g, "")}`}>
                    Call {contact.phonePrimary}
                  </a>
                  <a className="cp-btn cp-btnGhost" href={waLink} target="_blank" rel="noreferrer">
                    WhatsApp Now
                  </a>
                </div>
              </div>

              <div className="cp-ctaRight">
                <div className="cp-ctaTile">
                  <p className="cp-ctaTileTop">Our promise</p>
                  <p className="cp-ctaTileBig">Clean finishing</p>
                  <p className="cp-ctaTileSmall">Good print quality, sharp text, and neat edges.</p>
                </div>
                <div className="cp-ctaTile">
                  <p className="cp-ctaTileTop">For bulk orders</p>
                  <p className="cp-ctaTileBig">Best value</p>
                  <p className="cp-ctaTileSmall">Smart material choices and cost-friendly options.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default ContactPage;
