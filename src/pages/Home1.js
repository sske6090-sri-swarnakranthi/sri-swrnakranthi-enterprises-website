// src/pages/Home1.js
import { useEffect, useRef, useState } from 'react'
import './Home1.css'
import Navbar from './Navbar'
import Footer from './Footer'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectCoverflow } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/autoplay'

import { Link } from 'react-router-dom'

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://taras-kart-backend.vercel.app'

export default function Home1() {
  const railRef = useRef(null)
  const [imageMap, setImageMap] = useState({})

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/homepage-images`)
        if (!res.ok) return
        const data = await res.json()
        const map = {}
        data.forEach(item => {
          if (item.id && item.imageUrl) {
            map[item.id] = item.imageUrl
          }
        })
        setImageMap(map)
      } catch (e) { }
    }
    run()
  }, [])

  const getImage = path => {
    return imageMap[path] || path
  }

  const scrollLeft = () => {
    if (railRef.current) {
      railRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (railRef.current) {
      railRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  return (
    <div className="home1-page-new-home">
      <Navbar />
      <div className="spacer-new-home">
        <section className="home1-hero-new-home-2">
          <div className="home1-hero-frame-new-home-2">
            <Swiper
              className="home1-hero-swiper-new-home-2"
              modules={[Autoplay]}
              loop
              slidesPerView={1}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              speed={900}
            >
              <SwiperSlide>
                <div className="home1-hero-slide-new-home-2">
                  <img src={getImage('/images/banners/main-banner9.jpg')} alt="Main Banner" loading="eager" />
                </div>
              </SwiperSlide>

              <SwiperSlide>
                <div className="home1-hero-slide-new-home-2">
                  <img src={getImage('/images/banners/main-banner10.jpg')} alt="Banner 2" loading="lazy" decoding="async" />
                </div>
              </SwiperSlide>

              <SwiperSlide>
                <div className="home1-hero-slide-new-home-2">
                  <img src={getImage('/images/banners/main-banner11.jpg')} alt="Banner 3" loading="lazy" decoding="async" />
                </div>
              </SwiperSlide>

              <SwiperSlide>
                <div className="home1-hero-slide-new-home-2">
                  <img src={getImage('/images/banners/main-banner12.jpg')} alt="Banner 4" loading="lazy" decoding="async" />
                </div>
              </SwiperSlide>
            </Swiper>
          </div>
        </section>



        <section className="cat-section-new-home">
          <div className="cat-inner-new-home">
            <div className="cat-head-new-home">
              <h2 className="cat-title-new-home">Category</h2>
            </div>

            <div className="cat-row-new-home">
              <Link to="/products" className="cat-card-new-home">
                <div className="cat-media-new-home">
                  <img src={getImage('/images/banners/Calenders and diaries.webp')} alt="Calenders and diaries" />
                </div>
                <p className="cat-label-new-home">Calenders and Diaries</p>
              </Link>

              <Link to="/products" className="cat-card-new-home">
                <div className="cat-media-new-home">
                  <img src={getImage('/images/banners/id cards-printing.png')} alt="ID Cards Printing" />
                </div>
                <p className="cat-label-new-home">ID Cards Printing</p>
              </Link>

              <Link to="/products" className="cat-card-new-home">
                <div className="cat-media-new-home">
                  <img src={getImage('/images/banners/mug-printing.webp')} alt="Mug Printing" />
                </div>
                <p className="cat-label-new-home">Mug Printing</p>
              </Link>

              <Link to="/products" className="cat-card-new-home">
                <div className="cat-media-new-home">
                  <img src={getImage('/images/banners/packaging-printing.webp')} alt="Packaging Printing" />
                </div>
                <p className="cat-label-new-home">Packaging Printing</p>
              </Link>

              <Link to="/products" className="cat-card-new-home">
                <div className="cat-media-new-home">
                  <img src={getImage('/images/banners/pamplete-printing.png')} alt="Pamphlet Printing" />
                </div>
                <p className="cat-label-new-home">Pamphlet Printing</p>
              </Link>

              <Link to="/products" className="cat-card-new-home">
                <div className="cat-media-new-home">
                  <img src={getImage('/images/banners/photo-printing.webp')} alt="Photo Printing" />
                </div>
                <p className="cat-label-new-home">Photo Printing</p>
              </Link>

              <Link to="/products" className="cat-card-new-home">
                <div className="cat-media-new-home">
                  <img src={getImage('/images/banners/travel-bags.webp')} alt="Travel Bags" />
                </div>
                <p className="cat-label-new-home">Travel Bags</p>
              </Link>

              <Link to="/products" className="cat-card-new-home">
                <div className="cat-media-new-home">
                  <img src={getImage('/images/banners/visiting-cards.webp')} alt="Visiting Cards" />
                </div>
                <p className="cat-label-new-home">Visiting Cards</p>
              </Link>

              <Link to="/products" className="cat-card-new-home">
                <div className="cat-media-new-home">
                  <img src={getImage('/images/banners/weddingcards-printing.webp')} alt="Wedding Cards Printing" />
                </div>
                <p className="cat-label-new-home">Wedding Cards Printing</p>
              </Link>
            </div>
          </div>
        </section>


        <section className="home-part-grid">
          <div className="home-part-inner">
            <div className="home-part-card">
              <img src={getImage('/images/banners/part-ladies-bag.jpg')} alt="Calenders" className="home-part-img" />
            </div>

            <div className="home-part-text">
              <h3 className="home-part-title">Ladies Bags</h3>
              <Link to="/products" className="home-part-btn">View Details →</Link>
            </div>

            <div className="home-part-card">
              <img src={getImage('/images/banners/part-wedding-card.jpg')} alt="Mug Printing" className="home-part-img" />
            </div>

            <div className="home-part-text">
              <h3 className="home-part-title">Wedding Card</h3>
              <Link to="/products" className="home-part-btn">View Details →</Link>
            </div>

            <div className="home-part-text">
              <h3 className="home-part-title">Mug Printing</h3>
              <Link to="/products" className="home-part-btn">View Details →</Link>
            </div>

            <div className="home-part-card">
              <img src={getImage('/images/banners/part-mug-printing.jpg')} alt="Wedding Cards" className="home-part-img" />
            </div>

            <div className="home-part-text">
              <h3 className="home-part-title">Calenders</h3>
              <Link to="/products" className="home-part-btn">View Details →</Link>
            </div>

            <div className="home-part-card">
              <img src={getImage('/images/banners/part-calenders.jpg')} alt="Calenders" className="home-part-img" />
            </div>
          </div>
        </section>






        <section className="split-banner-section">
          <div className="split-banner-inner">
            <div className="split-left">
              <img src={getImage('/images/banners/left-banner.png')} alt="Left Banner" />
            </div>

            <div className="split-right">
              <Link to="/products" className="split-right-card">
                <div className="split-right-media">
                  <img src={getImage('/images/banners/Calenders and diaries.webp')} alt="Calenders and diaries" />
                </div>
                <p className="split-right-text">Calenders and Diaries</p>
              </Link>

              <Link to="/products" className="split-right-card">
                <div className="split-right-media">
                  <img src={getImage('/images/banners/id cards-printing.png')} alt="ID Cards Printing" />
                </div>
                <p className="split-right-text">ID Cards Printing</p>
              </Link>

              <Link to="/products" className="split-right-card">
                <div className="split-right-media">
                  <img src={getImage('/images/banners/mug-printing.webp')} alt="Mug Printing" />
                </div>
                <p className="split-right-text">Mug Printing</p>
              </Link>

              <Link to="/products" className="split-right-card">
                <div className="split-right-media">
                  <img src={getImage('/images/banners/packaging-printing.webp')} alt="Packaging Printing" />
                </div>
                <p className="split-right-text">Packaging Printing</p>
              </Link>

              <Link to="/products" className="split-right-card">
                <div className="split-right-media">
                  <img src={getImage('/images/banners/pamplete-printing.png')} alt="Pamphlet Printing" />
                </div>
                <p className="split-right-text">Pamphlet Printing</p>
              </Link>

              <Link to="/products" className="split-right-card">
                <div className="split-right-media">
                  <img src={getImage('/images/banners/photo-printing.webp')} alt="Photo Printing" />
                </div>
                <p className="split-right-text">Photo Printing</p>
              </Link>
            </div>
          </div>
        </section>



        <section className="three-clock-section">
          <div className="three-clock-grid">
            <div className="three-clock-card">
              <img src={getImage('/images/banners/wall-clock.jpg')} alt="Wall Clock" className="three-clock-img" />
              <div className="three-clock-overlay" />
              <div className="three-clock-content">
                <h3 className="three-clock-title">Wall Clocks</h3>
                <p className="three-clock-desc">Elegant wall clocks that elevate your space with style and perfect timing.</p>
                <Link to="/products" className="three-clock-btn">View More →</Link>
              </div>
            </div>

            <div className="three-clock-card three-clock-center">
              <img src={getImage('/images/banners/center-clock.jpg')} alt="Center Clock" className="three-clock-img" />
              <div className="three-clock-overlay" />
            </div>

            <div className="three-clock-card">
              <img src={getImage('/images/banners/table-clock.jpg')} alt="Table Clock" className="three-clock-img" />
              <div className="three-clock-overlay" />
              <div className="three-clock-content">
                <h3 className="three-clock-title">Table Clocks</h3>
                <p className="three-clock-desc">Premium table clocks that bring a modern touch to your desk and home.</p>
                <Link to="/products" className="three-clock-btn">View More →</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="clock-sell-section">
          <div className="clock-sell-inner">
            <div className="clock-sell-head">
              <h2 className="clock-sell-title">Trending Clocks</h2>
              <p className="clock-sell-subtitle">Best Deals</p>
            </div>

            <div className="clock-sell-grid">
              <div className="clock-sell-card">
                <div className="clock-sell-media">
                  <img src={getImage('/images/banners/clocks/clock1.jpg')} alt="Clock 1" />
                </div>
                <div className="clock-sell-body">
                  <p className="clock-sell-brand">Nike</p>
                  <p className="clock-sell-name">Premium Wall Clock</p>
                  <div className="clock-sell-price-row">
                    <span className="clock-sell-mrp">₹1299</span>
                    <span className="clock-sell-offer">₹899</span>
                  </div>
                  <Link to="/products" className="clock-sell-btn">Buy Now</Link>
                </div>
              </div>

              <div className="clock-sell-card">
                <div className="clock-sell-media">
                  <img src={getImage('/images/banners/clocks/clock2.jpg')} alt="Clock 2" />
                </div>
                <div className="clock-sell-body">
                  <p className="clock-sell-brand">Nike</p>
                  <p className="clock-sell-name">Modern Table Clock</p>
                  <div className="clock-sell-price-row">
                    <span className="clock-sell-mrp">₹999</span>
                    <span className="clock-sell-offer">₹699</span>
                  </div>
                  <Link to="/products" className="clock-sell-btn">Buy Now</Link>
                </div>
              </div>

              <div className="clock-sell-card">
                <div className="clock-sell-media">
                  <img src={getImage('/images/banners/clocks/clock3.jpg')} alt="Clock 3" />
                </div>
                <div className="clock-sell-body">
                  <p className="clock-sell-brand">Nike</p>
                  <p className="clock-sell-name">Classic Designer Clock</p>
                  <div className="clock-sell-price-row">
                    <span className="clock-sell-mrp">₹1599</span>
                    <span className="clock-sell-offer">₹1099</span>
                  </div>
                  <Link to="/products" className="clock-sell-btn">Buy Now</Link>
                </div>
              </div>

              <div className="clock-sell-card">
                <div className="clock-sell-media">
                  <img src={getImage('/images/banners/clocks/clock4.jpg')} alt="Clock 4" />
                </div>
                <div className="clock-sell-body">
                  <p className="clock-sell-brand">Nike</p>
                  <p className="clock-sell-name">Luxury Wall Clock</p>
                  <div className="clock-sell-price-row">
                    <span className="clock-sell-mrp">₹1899</span>
                    <span className="clock-sell-offer">₹1299</span>
                  </div>
                  <Link to="/products" className="clock-sell-btn">Buy Now</Link>
                </div>
              </div>
            </div>
          </div>
        </section>




        <section className="print-showcase-section">
          <div className="print-showcase-inner">
            <h2 className="print-showcase-title">What We Are Printing</h2>
            <p className="print-showcase-subtitle">Premium Prints</p>

            <div className="print-showcase-grid">
              <Link to="/products" className="print-showcase-card">
                <div className="print-showcase-media">
                  <img src={getImage('/images/banners/printing-card1.webp')} alt="Mug Printing" />
                </div>
                <p className="print-showcase-label">Mug Printing</p>
              </Link>

              <Link to="/products" className="print-showcase-card">
                <div className="print-showcase-media">
                  <img src={getImage('/images/banners/printing-card5.jpg')} alt="Visiting Cards Printing" />
                </div>
                <p className="print-showcase-label">Visiting Cards Printing</p>
              </Link>

              <Link to="/products" className="print-showcase-card">
                <div className="print-showcase-media">
                  <img src={getImage('/images/banners/printing-card2.jpg')} alt="T-shirt Printing" />
                </div>
                <p className="print-showcase-label">T-shirt Printing</p>
              </Link>

              <Link to="/products" className="print-showcase-card">
                <div className="print-showcase-media">
                  <img src={getImage('/images/banners/printing-card3.jpg')} alt="Photo Frame Printing" />
                </div>
                <p className="print-showcase-label">Photo Frame Printing</p>
              </Link>

              <Link to="/products" className="print-showcase-card">
                <div className="print-showcase-media">
                  <img src={getImage('/images/banners/Printing-card4.jpg')} alt="Wedding Card Printing" />
                </div>
                <p className="print-showcase-label">Wedding Card Printing</p>
              </Link>
            </div>
          </div>
        </section>

        <section className="print-sell-section">
          <div className="print-sell-inner">
            <div className="print-sell-head">
              <h2 className="print-sell-title">Printing Products</h2>
              <p className="print-sell-subtitle">Top Picks</p>
            </div>

            <div className="print-sell-grid">
              <div className="print-sell-card">
                <div className="print-sell-media">
                  <img src={getImage('/images/banners/printing/printing1.jpg')} alt="Printing 1" />
                </div>
                <div className="print-sell-body">
                  <p className="print-sell-brand">Adidas</p>
                  <p className="print-sell-name">Premium Printing Product</p>
                  <div className="print-sell-price-row">
                    <span className="print-sell-mrp">₹1299</span>
                    <span className="print-sell-offer">₹899</span>
                  </div>
                  <Link to="/products" className="print-sell-btn">Buy Now</Link>
                </div>
              </div>

              <div className="print-sell-card">
                <div className="print-sell-media">
                  <img src={getImage('/images/banners/printing/printing2.jpg')} alt="Printing 2" />
                </div>
                <div className="print-sell-body">
                  <p className="print-sell-brand">Adidas</p>
                  <p className="print-sell-name">High Quality Prints</p>
                  <div className="print-sell-price-row">
                    <span className="print-sell-mrp">₹999</span>
                    <span className="print-sell-offer">₹699</span>
                  </div>
                  <Link to="/products" className="print-sell-btn">Buy Now</Link>
                </div>
              </div>

              <div className="print-sell-card">
                <div className="print-sell-media">
                  <img src={getImage('/images/banners/printing/printing3.jpg')} alt="Printing 3" />
                </div>
                <div className="print-sell-body">
                  <p className="print-sell-brand">Adidas</p>
                  <p className="print-sell-name">Custom Print Item</p>
                  <div className="print-sell-price-row">
                    <span className="print-sell-mrp">₹1499</span>
                    <span className="print-sell-offer">₹999</span>
                  </div>
                  <Link to="/products" className="print-sell-btn">Buy Now</Link>
                </div>
              </div>

              <div className="print-sell-card">
                <div className="print-sell-media">
                  <img src={getImage('/images/banners/printing/printing4.jpg')} alt="Printing 4" />
                </div>
                <div className="print-sell-body">
                  <p className="print-sell-brand">Adidas</p>
                  <p className="print-sell-name">Professional Print</p>
                  <div className="print-sell-price-row">
                    <span className="print-sell-mrp">₹1899</span>
                    <span className="print-sell-offer">₹1299</span>
                  </div>
                  <Link to="/products" className="print-sell-btn">Buy Now</Link>
                </div>
              </div>

              <div className="print-sell-card">
                <div className="print-sell-media">
                  <img src={getImage('/images/banners/printing/printing5.jpg')} alt="Printing 5" />
                </div>
                <div className="print-sell-body">
                  <p className="print-sell-brand">Adidas</p>
                  <p className="print-sell-name">Creative Printing</p>
                  <div className="print-sell-price-row">
                    <span className="print-sell-mrp">₹1399</span>
                    <span className="print-sell-offer">₹949</span>
                  </div>
                  <Link to="/products" className="print-sell-btn">Buy Now</Link>
                </div>
              </div>

              <div className="print-sell-card">
                <div className="print-sell-media">
                  <img src={getImage('/images/banners/printing/printing6.jpg')} alt="Printing 6" />
                </div>
                <div className="print-sell-body">
                  <p className="print-sell-brand">Adidas</p>
                  <p className="print-sell-name">Modern Print Design</p>
                  <div className="print-sell-price-row">
                    <span className="print-sell-mrp">₹1099</span>
                    <span className="print-sell-offer">₹799</span>
                  </div>
                  <Link to="/products" className="print-sell-btn">Buy Now</Link>
                </div>
              </div>

              <div className="print-sell-card">
                <div className="print-sell-media">
                  <img src={getImage('/images/banners/printing/printing7.jpg')} alt="Printing 7" />
                </div>
                <div className="print-sell-body">
                  <p className="print-sell-brand">Adidas</p>
                  <p className="print-sell-name">Custom Prints</p>
                  <div className="print-sell-price-row">
                    <span className="print-sell-mrp">₹1699</span>
                    <span className="print-sell-offer">₹1199</span>
                  </div>
                  <Link to="/products" className="print-sell-btn">Buy Now</Link>
                </div>
              </div>

              <div className="print-sell-card">
                <div className="print-sell-media">
                  <img src={getImage('/images/banners/printing/printing8.jpg')} alt="Printing 8" />
                </div>
                <div className="print-sell-body">
                  <p className="print-sell-brand">Adidas</p>
                  <p className="print-sell-name">Premium Custom Print</p>
                  <div className="print-sell-price-row">
                    <span className="print-sell-mrp">₹1999</span>
                    <span className="print-sell-offer">₹1399</span>
                  </div>
                  <Link to="/products" className="print-sell-btn">Buy Now</Link>
                </div>
              </div>
            </div>
          </div>
        </section>




        <section className="stationary-sale-section">
          <div className="stationary-sale-inner">
            <div className="stationary-sale-head">
              <h2 className="stationary-sale-title">Stationary</h2>
              <p className="stationary-sale-subtitle">Best Sellers</p>
            </div>

            <div className="stationary-sale-body">
              <div className="stationary-sale-grid">
                <Link to="/products" className="stationary-sale-card">
                  <div className="stationary-sale-media">
                    <img src={getImage('/images/banners/stationary1.jpg')} alt="Key Chains" />
                  </div>
                  <p className="stationary-sale-text">Key Chains</p>
                </Link>

                <Link to="/products" className="stationary-sale-card">
                  <div className="stationary-sale-media">
                    <img src={getImage('/images/banners/stationary2.jpg')} alt="Pens" />
                  </div>
                  <p className="stationary-sale-text">Pens</p>
                </Link>

                <Link to="/products" className="stationary-sale-card">
                  <div className="stationary-sale-media">
                    <img src={getImage('/images/banners/stationary3.jpg')} alt="Books" />
                  </div>
                  <p className="stationary-sale-text">Books</p>
                </Link>

                <Link to="/products" className="stationary-sale-card">
                  <div className="stationary-sale-media">
                    <img src={getImage('/images/banners/stationary4.jpg')} alt="Diaries" />
                  </div>
                  <p className="stationary-sale-text">Diaries</p>
                </Link>

                <Link to="/products" className="stationary-sale-card">
                  <div className="stationary-sale-media">
                    <img src={getImage('/images/banners/stationary5.jpg')} alt="Pouches" />
                  </div>
                  <p className="stationary-sale-text">Pouches</p>
                </Link>

                <Link to="/products" className="stationary-sale-card">
                  <div className="stationary-sale-media">
                    <img src={getImage('/images/banners/stationary6.jpg')} alt="Shopping Covers" />
                  </div>
                  <p className="stationary-sale-text">Shopping Covers</p>
                </Link>
              </div>

              <div className="stationary-sale-banner">
                <img src={getImage('/images/banners/stationary.jpg')} alt="Stationary Banner" />
              </div>
            </div>
          </div>
        </section>


        <section className="stationary-sell-section">
  <div className="stationary-sell-inner">
    <div className="stationary-sell-head">
      <h2 className="stationary-sell-title">Stationary Collection</h2>
      <p className="stationary-sell-subtitle">Best Picks</p>
    </div>

    <div className="stationary-sell-grid">
      <div className="stationary-sell-card">
        <div className="stationary-sell-media">
          <img src={getImage('/images/banners/stationary/stationary1.jpg')} alt="Stationary 1" />
        </div>
        <div className="stationary-sell-body">
          <p className="stationary-sell-brand">Reebook</p>
          <p className="stationary-sell-name">Premium Stationary Item</p>
          <div className="stationary-sell-price-row">
            <span className="stationary-sell-mrp">₹799</span>
            <span className="stationary-sell-offer">₹499</span>
          </div>
          <Link to="/products" className="stationary-sell-btn">Buy Now</Link>
        </div>
      </div>

      <div className="stationary-sell-card">
        <div className="stationary-sell-media">
          <img src={getImage('/images/banners/stationary/stationary2.jpg')} alt="Stationary 2" />
        </div>
        <div className="stationary-sell-body">
          <p className="stationary-sell-brand">Reebook</p>
          <p className="stationary-sell-name">Office Essentials</p>
          <div className="stationary-sell-price-row">
            <span className="stationary-sell-mrp">₹999</span>
            <span className="stationary-sell-offer">₹699</span>
          </div>
          <Link to="/products" className="stationary-sell-btn">Buy Now</Link>
        </div>
      </div>

      <div className="stationary-sell-card">
        <div className="stationary-sell-media">
          <img src={getImage('/images/banners/stationary/stationary3.jpg')} alt="Stationary 3" />
        </div>
        <div className="stationary-sell-body">
          <p className="stationary-sell-brand">Reebook</p>
          <p className="stationary-sell-name">School Supplies</p>
          <div className="stationary-sell-price-row">
            <span className="stationary-sell-mrp">₹599</span>
            <span className="stationary-sell-offer">₹399</span>
          </div>
          <Link to="/products" className="stationary-sell-btn">Buy Now</Link>
        </div>
      </div>

      <div className="stationary-sell-card">
        <div className="stationary-sell-media">
          <img src={getImage('/images/banners/stationary/stationary4.jpg')} alt="Stationary 4" />
        </div>
        <div className="stationary-sell-body">
          <p className="stationary-sell-brand">Reebook</p>
          <p className="stationary-sell-name">Premium Diaries</p>
          <div className="stationary-sell-price-row">
            <span className="stationary-sell-mrp">₹899</span>
            <span className="stationary-sell-offer">₹599</span>
          </div>
          <Link to="/products" className="stationary-sell-btn">Buy Now</Link>
        </div>
      </div>

      <div className="stationary-sell-card">
        <div className="stationary-sell-media">
          <img src={getImage('/images/banners/stationary/stationary5.jpg')} alt="Stationary 5" />
        </div>
        <div className="stationary-sell-body">
          <p className="stationary-sell-brand">Reebook</p>
          <p className="stationary-sell-name">Trendy Pouches</p>
          <div className="stationary-sell-price-row">
            <span className="stationary-sell-mrp">₹699</span>
            <span className="stationary-sell-offer">₹449</span>
          </div>
          <Link to="/products" className="stationary-sell-btn">Buy Now</Link>
        </div>
      </div>

      <div className="stationary-sell-card">
        <div className="stationary-sell-media">
          <img src={getImage('/images/banners/stationary/stationary6.jpg')} alt="Stationary 6" />
        </div>
        <div className="stationary-sell-body">
          <p className="stationary-sell-brand">Reebook</p>
          <p className="stationary-sell-name">Daily Use Covers</p>
          <div className="stationary-sell-price-row">
            <span className="stationary-sell-mrp">₹499</span>
            <span className="stationary-sell-offer">₹299</span>
          </div>
          <Link to="/products" className="stationary-sell-btn">Buy Now</Link>
        </div>
      </div>

      <div className="stationary-sell-card">
        <div className="stationary-sell-media">
          <img src={getImage('/images/banners/stationary/stationary7.jpg')} alt="Stationary 7" />
        </div>
        <div className="stationary-sell-body">
          <p className="stationary-sell-brand">Reebook</p>
          <p className="stationary-sell-name">Office Organizers</p>
          <div className="stationary-sell-price-row">
            <span className="stationary-sell-mrp">₹1099</span>
            <span className="stationary-sell-offer">₹799</span>
          </div>
          <Link to="/products" className="stationary-sell-btn">Buy Now</Link>
        </div>
      </div>

      <div className="stationary-sell-card">
        <div className="stationary-sell-media">
          <img src={getImage('/images/banners/stationary/stationary8.jpg')} alt="Stationary 8" />
        </div>
        <div className="stationary-sell-body">
          <p className="stationary-sell-brand">Reebook</p>
          <p className="stationary-sell-name">Premium Gift Sets</p>
          <div className="stationary-sell-price-row">
            <span className="stationary-sell-mrp">₹1299</span>
            <span className="stationary-sell-offer">₹899</span>
          </div>
          <Link to="/products" className="stationary-sell-btn">Buy Now</Link>
        </div>
      </div>
    </div>
  </div>
</section>




        <section className="school-items-section">
          <div className="school-items-inner">
            <h2 className="school-items-title">School Items</h2>
            <p className="school-items-subtitle">For Students</p>

            <div className="school-items-grid">
              <Link to="/products" className="school-items-card">
                <div className="school-items-media">
                  <img src={getImage('/images/banners/school1.jpg')} alt="Id Cards" />
                </div>
                <p className="school-items-label">Id Cards</p>
              </Link>

              <Link to="/products" className="school-items-card">
                <div className="school-items-media">
                  <img src={getImage('/images/banners/school2.jpg')} alt="Diaries" />
                </div>
                <p className="school-items-label">Diaries</p>
              </Link>

              <Link to="/products" className="school-items-card">
                <div className="school-items-media">
                  <img src={getImage('/images/banners/school3.jpg')} alt="Progress Cards" />
                </div>
                <p className="school-items-label">Progress Cards</p>
              </Link>

              <Link to="/products" className="school-items-card">
                <div className="school-items-media">
                  <img src={getImage('/images/banners/school4.jpg')} alt="Ties & Belts" />
                </div>
                <p className="school-items-label">Ties &amp; Belts</p>
              </Link>

              <Link to="/products" className="school-items-card">
                <div className="school-items-media">
                  <img src={getImage('/images/banners/school5.jpg')} alt="Prizes and Medals" />
                </div>
                <p className="school-items-label">Prizes and Medals</p>
              </Link>
            </div>
          </div>
        </section>



        <section className="school-sell-section">
  <div className="school-sell-inner">
    <div className="school-sell-head">
      <h2 className="school-sell-title">School Essentials</h2>
      <p className="school-sell-subtitle">Top Picks</p>
    </div>

    <div className="school-sell-grid">
      <div className="school-sell-card">
        <div className="school-sell-media">
          <img src={getImage('/images/banners/school/school1.jpg')} alt="School Item 1" />
        </div>
        <div className="school-sell-body">
          <p className="school-sell-brand">Red Tape</p>
          <p className="school-sell-name">School Product</p>
          <div className="school-sell-price-row">
            <span className="school-sell-mrp">₹799</span>
            <span className="school-sell-offer">₹499</span>
          </div>
          <Link to="/products" className="school-sell-btn">Buy Now</Link>
        </div>
      </div>

      <div className="school-sell-card">
        <div className="school-sell-media">
          <img src={getImage('/images/banners/school/school2.jpg')} alt="School Item 2" />
        </div>
        <div className="school-sell-body">
          <p className="school-sell-brand">Red Tape</p>
          <p className="school-sell-name">School Product</p>
          <div className="school-sell-price-row">
            <span className="school-sell-mrp">₹999</span>
            <span className="school-sell-offer">₹699</span>
          </div>
          <Link to="/products" className="school-sell-btn">Buy Now</Link>
        </div>
      </div>

      <div className="school-sell-card">
        <div className="school-sell-media">
          <img src={getImage('/images/banners/school/school3.jpg')} alt="School Item 3" />
        </div>
        <div className="school-sell-body">
          <p className="school-sell-brand">Red Tape</p>
          <p className="school-sell-name">School Product</p>
          <div className="school-sell-price-row">
            <span className="school-sell-mrp">₹599</span>
            <span className="school-sell-offer">₹399</span>
          </div>
          <Link to="/products" className="school-sell-btn">Buy Now</Link>
        </div>
      </div>

      <div className="school-sell-card">
        <div className="school-sell-media">
          <img src={getImage('/images/banners/school/school4.jpg')} alt="School Item 4" />
        </div>
        <div className="school-sell-body">
          <p className="school-sell-brand">Red Tape</p>
          <p className="school-sell-name">School Product</p>
          <div className="school-sell-price-row">
            <span className="school-sell-mrp">₹899</span>
            <span className="school-sell-offer">₹599</span>
          </div>
          <Link to="/products" className="school-sell-btn">Buy Now</Link>
        </div>
      </div>

      <div className="school-sell-card">
        <div className="school-sell-media">
          <img src={getImage('/images/banners/school/school5.jpg')} alt="School Item 5" />
        </div>
        <div className="school-sell-body">
          <p className="school-sell-brand">Red Tape</p>
          <p className="school-sell-name">School Product</p>
          <div className="school-sell-price-row">
            <span className="school-sell-mrp">₹699</span>
            <span className="school-sell-offer">₹449</span>
          </div>
          <Link to="/products" className="school-sell-btn">Buy Now</Link>
        </div>
      </div>

      <div className="school-sell-card">
        <div className="school-sell-media">
          <img src={getImage('/images/banners/school/school6.jpg')} alt="School Item 6" />
        </div>
        <div className="school-sell-body">
          <p className="school-sell-brand">Red Tape</p>
          <p className="school-sell-name">School Product</p>
          <div className="school-sell-price-row">
            <span className="school-sell-mrp">₹499</span>
            <span className="school-sell-offer">₹299</span>
          </div>
          <Link to="/products" className="school-sell-btn">Buy Now</Link>
        </div>
      </div>

      <div className="school-sell-card">
        <div className="school-sell-media">
          <img src={getImage('/images/banners/school/school7.jpg')} alt="School Item 7" />
        </div>
        <div className="school-sell-body">
          <p className="school-sell-brand">Red Tape</p>
          <p className="school-sell-name">School Product</p>
          <div className="school-sell-price-row">
            <span className="school-sell-mrp">₹1099</span>
            <span className="school-sell-offer">₹799</span>
          </div>
          <Link to="/products" className="school-sell-btn">Buy Now</Link>
        </div>
      </div>

      <div className="school-sell-card">
        <div className="school-sell-media">
          <img src={getImage('/images/banners/school/school8.jpg')} alt="School Item 8" />
        </div>
        <div className="school-sell-body">
          <p className="school-sell-brand">Red Tape</p>
          <p className="school-sell-name">School Product</p>
          <div className="school-sell-price-row">
            <span className="school-sell-mrp">₹1299</span>
            <span className="school-sell-offer">₹899</span>
          </div>
          <Link to="/products" className="school-sell-btn">Buy Now</Link>
        </div>
      </div>
    </div>
  </div>
</section>









      </div>
      <Footer />
    </div>
  )
}
