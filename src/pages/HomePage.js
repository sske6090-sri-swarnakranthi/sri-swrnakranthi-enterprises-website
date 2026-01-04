import React, { useState, useEffect, useRef } from 'react';
import Navbar from './Navbar';
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectCoverflow } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/autoplay'

import './HomePage.css';
import Footer from './Footer';
import { Link, useNavigate } from "react-router-dom";

const DEFAULT_API_BASE = 'https://taras-kart-backend.vercel.app';
const API_BASE_RAW =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
    (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
    DEFAULT_API_BASE;
const API_BASE = API_BASE_RAW.replace(/\/+$/, '');




function withWidth(url, w) {
    try {
        const u = new URL(url, window.location.origin);
        if (!u.hostname.includes('res.cloudinary.com')) return url;
        u.pathname = u.pathname.replace('/upload/', `/upload/f_auto,q_auto,w_${w}/`);
        return u.toString();
    } catch {
        return url;
    }
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const FALLBACK_WOMEN = [
    { img: '/images/women/women-anarkali.jpg', title: 'Anarkali' },
    { img: '/images/women/women-chudidar.jpg', title: 'Chudidar' },
    { img: '/images/women/women-gowns.jpg', title: 'Gowns' },
    { img: '/images/women/women-kurta.jpg', title: 'Kurta' },
    { img: '/images/women/women-lehanga.jpeg', title: 'Lehanga' },
    { img: '/images/women/women-palazzo.jpg', title: 'Palazzo' },
    { img: '/images/women/women-salwar.jpg', title: 'Salwar' },
    { img: '/images/women/women-sarees.jpg', title: 'Sarees' }
];

const FALLBACK_MEN = [
    { img: '/images/men/mens-casuals.jpg', title: 'Casuals' },
    { img: '/images/men/mens-ethinic.jpg', title: 'Ethnic' },
    { img: '/images/men/mens-formals.jpg', title: 'Formals' },
    { img: '/images/men/mens-party-wear.jpg', title: 'Party Wear' },
    { img: '/images/men/mens-semi-formals.jpg', title: 'Semi Formals' },
    { img: '/images/men/mens-street-wear.jpg', title: 'Street Wear' },
    { img: '/images/men/mens-suits.jpg', title: 'Suits' },
    { img: '/images/men/mens-wedding-wear.jpg', title: 'Wedding Wear' }
];

const FALLBACK_KIDS = [
    { img: '/images/kids/kids-boys-casual-wear.jpg', title: 'Boys Casual Wear' },
    { img: '/images/kids/kids-boys-kurta-paijama.jpg', title: 'Boys Kurta Paijama' },
    { img: '/images/kids/kids-boys-sherwani.jpg', title: 'Boys Sherwani' },
    { img: '/images/kids/kids-formal.jpg', title: 'Formal' },
    { img: '/images/kids/kids-girls-frock.jpg', title: 'Girls Frock' },
    { img: '/images/kids/kids-girls-gown.jpg', title: 'Girls Gown' },
    { img: '/images/kids/kids-girls-lehenga-choli.jpg', title: 'Girls Lehenga Choli' },
    { img: '/images/kids/kids-girls-salwar.jpg', title: 'Girls Salwar' }
];

export default function HomePage() {
    const FALLBACK_SLIDES = Array.from({ length: 11 }, (_, i) => `/images/slide${i + 1}.jpg`);
    const [slides, setSlides] = useState(FALLBACK_SLIDES);
    const [isLoadingSlides, setIsLoadingSlides] = useState(true);
    const [womenItems, setWomenItems] = useState(FALLBACK_WOMEN);
    const [menItems, setMenItems] = useState(FALLBACK_MEN);
    const [kidsItems, setKidsItems] = useState(FALLBACK_KIDS);
    const section3Images = Array.from({ length: 12 }, (_, i) => `/images/random${i + 1}.jpg`);
    const womenRef = useRef(null);
    const menRef = useRef(null);
    const kidsRef = useRef(null);
    const navigate = useNavigate()

    /* new section 1 */
    const LUX_DEFAULT_WOMEN = Array.from({ length: 20 }, (_, i) => `/images/women/women${i + 1}.jpeg`);
    const rotorWomen = React.useMemo(() => {
        const backendImgs = (womenItems || [])
            .map(x => (typeof x === 'string' ? x : x?.img))
            .filter(u => u && typeof u === 'string' && !/^\/images\//.test(u));
        const pool = backendImgs.length ? backendImgs : LUX_DEFAULT_WOMEN;
        const pick = pool.slice(0, 12);
        return pick.map(src => withWidth(src, 900));
    }, [womenItems]);
    /* end of new section 1 */

    useEffect(() => {
        let mounted = true;
        async function fetchAll() {
            setIsLoadingSlides(true);
            const t = Date.now();
            const url = `${API_BASE}/api/products/section-images?limitHero=30&limitGender=40&_t=${t}`;
            try {
                const res = await fetch(url, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (mounted && data && Array.isArray(data.hero)) {
                        const heroUrls = data.hero.map(x => x.image_url).filter(u => u && typeof u === 'string' && !/^\/images\//.test(u));
                        if (heroUrls.length) setSlides(shuffle(heroUrls).slice(0, 30));
                    }
                    if (mounted && data && Array.isArray(data.women) && data.women.length) {
                        setWomenItems(
                            shuffle(
                                data.women
                                    .filter(x => x.image_url && typeof x.image_url === 'string' && !/^\/images\//.test(x.image_url))
                                    .map(x => ({ img: x.image_url, title: x.product_name || x.brand || 'Women' }))
                            ).slice(0, 20)
                        );
                    }
                    if (mounted && data && Array.isArray(data.men) && data.men.length) {
                        setMenItems(
                            shuffle(
                                data.men
                                    .filter(x => x.image_url && typeof x.image_url === 'string' && !/^\/images\//.test(x.image_url))
                                    .map(x => ({ img: x.image_url, title: x.product_name || x.brand || 'Men' }))
                            ).slice(0, 20)
                        );
                    }
                    if (mounted && data && Array.isArray(data.kids) && data.kids.length) {
                        setKidsItems(
                            shuffle(
                                data.kids
                                    .filter(x => x.image_url && typeof x.image_url === 'string' && !/^\/images\//.test(x.image_url))
                                    .map(x => ({ img: x.image_url, title: x.product_name || x.brand || 'Kids' }))
                            ).slice(0, 20)
                        );
                    }
                }
            } catch { }
            if (mounted) setIsLoadingSlides(false);
        }
        fetchAll();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        const scrollForward = (el) => {
            let scrollAmount = 0;
            return setInterval(() => {
                if (el) {
                    scrollAmount += 1;
                    if (scrollAmount >= el.scrollWidth / 2) scrollAmount = 0;
                    el.scrollLeft = scrollAmount;
                }
            }, 20);
        };
        const scrollBackward = (el) => {
            let scrollAmount = el ? el.scrollWidth / 2 : 0;
            return setInterval(() => {
                if (el) {
                    scrollAmount -= 1;
                    if (scrollAmount <= 0) scrollAmount = el.scrollWidth / 2;
                    el.scrollLeft = scrollAmount;
                }
            }, 20);
        };
        const womenInterval = scrollForward(womenRef.current?.querySelector('.home-section5-slider'));
        const menInterval = scrollBackward(menRef.current?.querySelector('.home-section5-slider'));
        const kidsInterval = scrollForward(kidsRef.current?.querySelector('.home-section5-slider'));
        return () => {
            clearInterval(womenInterval);
            clearInterval(menInterval);
            clearInterval(kidsInterval);
        };
    }, []);

    return (
        <div className="home-section1-wrapper">
            <Navbar />
            <div className="home-section1">
                <div className="home-section1-overlay">
                    <div className="home-section1-content">
                        <div className="home-section1-left">
                            <video className="home-section1-video" autoPlay muted loop>
                                <source src="/images/logo-video.mp4" type="video/mp4" />
                            </video>
                            <div className="home-section1-full-text">
                                <h1>Taras Kart</h1>
                            </div>
                        </div>
                        <div className="home-section1-right">
                            <div
                                className="category-block"
                                onClick={() => navigate('/men')}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate('/men')}
                                style={{ cursor: 'pointer' }}
                            >
                                <img src="/images/banners/mens-slide3.jpg" alt="Men" />
                                <span>Men</span>
                            </div>
                            <div
                                className="category-block"
                                onClick={() => navigate('/women')}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate('/women')}
                                style={{ cursor: 'pointer' }}
                            >
                                <img src="/images/women-bg.png" alt="Women" />
                                <span>Women</span>
                            </div>
                            <div
                                className="category-block"
                                onClick={() => navigate('/kids')}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate('/kids')}
                                style={{ cursor: 'pointer' }}
                            >
                                <img src="/images/kids-bg1.png" alt="Kids" />
                                <span>Kids</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <section className="home-section2">
                <h2 className="home-section2-title">Boost your clothing sales with our fashion varieties!</h2>
                <div className="home-section2-frame">
                    <div className="home-section2-glow" />
                    <Swiper
                        className={`home-section2-slider ${isLoadingSlides ? 'is-loading' : ''}`}
                        modules={[EffectCoverflow, Autoplay]}
                        effect="coverflow"
                        loop={true}
                        centeredSlides={true}
                        slidesPerView="auto"
                        coverflowEffect={{ rotate: 40, depth: 220, stretch: 0, modifier: 1, slideShadows: false }}
                        autoplay={{ delay: 1700, disableOnInteraction: false, pauseOnMouseEnter: false }}
                        speed={1000}
                        allowTouchMove={false}
                    >
                        {slides.map((src, index) => {
                            const w400 = withWidth(src, 400);
                            const w800 = withWidth(src, 800);
                            const w1200 = withWidth(src, 1200);
                            return (
                                <SwiperSlide key={index}>
                                    <img
                                        src={w800}
                                        srcSet={`${w400} 400w, ${w800} 800w, ${w1200} 1200w`}
                                        sizes="(max-width: 600px) 60vw, 40vw"
                                        alt={`Featured ${index + 1}`}
                                        loading="lazy"
                                    />
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>
                    <div className="home-section2-stars" />
                </div>
                <h3 className="home-section2-subtitle">From briefs to stunning images in seconds — save time, cut costs, and drive success!</h3>
            </section>

            <section className="home-section3">
                <div className="home-section3-grid">
                    {section3Images.map((src, i) => (
                        <div className="home-section3-item" key={i}>
                            <img src={src} alt={`Random ${i + 1}`} />
                        </div>
                    ))}
                </div>
                <div className="home-section3-overlay">
                    <div className="home-section3-center-text">
                        <h2 className="home-section3-style">Style</h2>
                        <h2 className="home-section3-count">100+</h2>
                        <h2 className="home-section3-varieties">Varieties</h2>
                    </div>
                </div>
            </section>


            <section className="wcat">
                <div className="wcat-head">
                    <h2 className="wcat-title">Shop by Category</h2>
                    <div className="wcat-underline">
                        <span className="wl w1"></span>
                        <span className="wl w2"></span>
                        <span className="wl w3"></span>
                    </div>
                </div>

                <div className="wcat-grid">
                    <div className="wcat-card">
                        <Link to="/women" className="wcat-media">
                            <img src="/images/banners/women-category-anarkali.png" alt="Anarkali" loading="lazy" decoding="async" />
                        </Link>
                        <div className="wcat-info">
                            <h3 className="wcat-brand">Tara Anarkali</h3>
                            <div className="wcat-price">
                                <span className="wcat-mrp">₹3,499</span>
                                <span className="wcat-off">₹4,499</span>
                            </div>
                            <Link to="/women" className="wcat-buy">Buy Now</Link>
                        </div>
                    </div>

                    <div className="wcat-card">
                        <Link to="/women" className="wcat-media">
                            <img src="/images/banners/women-category-halfsaree.png" alt="Half Saree" loading="lazy" decoding="async" />
                        </Link>
                        <div className="wcat-info">
                            <h3 className="wcat-brand">Tara Half Saree</h3>
                            <div className="wcat-price">
                                <span className="wcat-mrp">₹5,299</span>
                                <span className="wcat-off">₹6,499</span>
                            </div>
                            <Link to="/women" className="wcat-buy">Buy Now</Link>
                        </div>
                    </div>

                    <div className="wcat-card">
                        <Link to="/women" className="wcat-media">
                            <img src="/images/banners/women-category-punjabi.png" alt="Punjabi Suit" loading="lazy" decoding="async" />
                        </Link>
                        <div className="wcat-info">
                            <h3 className="wcat-brand">Tara Punjabi</h3>
                            <div className="wcat-price">
                                <span className="wcat-mrp">₹2,799</span>
                                <span className="wcat-off">₹3,499</span>
                            </div>
                            <Link to="/women" className="wcat-buy">Buy Now</Link>
                        </div>
                    </div>

                    <div className="wcat-card">
                        <Link to="/women" className="wcat-media">
                            <img src="/images/banners/women-category-saree.png" alt="Saree" loading="lazy" decoding="async" />
                        </Link>
                        <div className="wcat-info">
                            <h3 className="wcat-brand">Tara Saree</h3>
                            <div className="wcat-price">
                                <span className="wcat-mrp">₹4,199</span>
                                <span className="wcat-off">₹5,299</span>
                            </div>
                            <Link to="/women" className="wcat-buy">Buy Now</Link>
                        </div>
                    </div>
                </div>

                <div className="wcat-more">
                    <Link to="/women" className="wcat-view">View More</Link>
                </div>
            </section>




            <section className="women-premium galaxy" ref={womenRef}>
                <div className="galaxy-layer stars-1"></div>
                <div className="galaxy-layer stars-2"></div>
                <div className="galaxy-layer dust"></div>

                <div className="women-premium-head">
                    <h2 className="women-premium-title">Women’s Collection</h2>
                    <div className="women-premium-underline">
                        <span className="wl w1"></span>
                        <span className="wl w2"></span>
                        <span className="wl w3"></span>
                    </div>
                </div>

                <div className="women-premium-wrap">
                    <Swiper
                        className="women-premium-swiper"
                        modules={[Autoplay]}
                        loop={true}
                        autoplay={{ delay: 2200, disableOnInteraction: false }}
                        speed={800}
                        spaceBetween={18}
                        slidesPerView={1.25}
                        breakpoints={{
                            480: { slidesPerView: 2 },
                            768: { slidesPerView: 3 },
                            1100: { slidesPerView: 4 }
                        }}
                    >
                        {[...new Set(womenItems.map(it => JSON.stringify(it)))].map((s, idx) => {
                            const item = JSON.parse(s);
                            const src = withWidth(item.img, 800);
                            const title = item.title || "Women";
                            return (
                                <SwiperSlide key={idx}>
                                    <a href="/women" className="women-premium-card">
                                        <div className="women-premium-frame">
                                            <img
                                                src={src}
                                                alt={title}
                                                loading="lazy"
                                                decoding="async"
                                                onError={(e) => { e.currentTarget.src = "/images/women/women20.jpeg"; }}
                                            />
                                            <div className="women-premium-info">
                                                <h3 className="women-premium-name">{title}</h3>
                                                <span className="women-premium-btn">Shop Now</span>
                                            </div>
                                        </div>
                                    </a>
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>
                </div>
            </section>





            {/*<section className="lux-rotor-section">
                <div className="lux-sky">
                    <div className="sky-layer stars-1"></div>
                    <div className="sky-layer stars-2"></div>
                    <div className="sky-layer stars-3"></div>
                    <div className="sky-layer nebula"></div>
                    <div className="sky-layer orbits"></div>
                    <div className="sky-layer glow"></div>
                </div>
                <div className="lux-rotor-shell">
                    <div className="lux-rotor-header">
                        <h2 className="lux-rotor-title">Women’s Spotlight</h2>
                        <div className="lux-rotor-underline">
                            <span className="lux-line large"></span>
                            <span className="lux-line medium"></span>
                            <span className="lux-line small"></span>
                        </div>
                    </div>
                    <div className="lux-rotor-stage">
                        <div className="lux-rotor-inner" style={{ ['--quantity']: rotorWomen.length }}>
                            {rotorWomen.map((src, i) => (
                                <a href="/women" key={i} className="lux-rotor-card" style={{ ['--index']: i }}>
                                    <div className="lux-rotor-frame">
                                        <img
                                            src={src}
                                            alt={`Women's ${i + 1}`}
                                            loading="lazy"
                                            decoding="async"
                                            onError={(e) => { e.currentTarget.src = LUX_DEFAULT_WOMEN[i % LUX_DEFAULT_WOMEN.length]; }}
                                        />
                                    </div>
                                </a>
                            ))}
                        </div>
                        <div className="lux-rotor-floor"></div>
                    </div>
                </div>
            </section> */}


            <section className="banner-slideshow">
                <div className="banner-frame">
                    <Swiper
                        className="banner-slider"
                        modules={[Autoplay]}
                        loop={true}
                        slidesPerView={1}
                        autoplay={{ delay: 4000, disableOnInteraction: false }}
                        speed={1000}
                    >
                        <SwiperSlide>
                            <div className="banner-slide">
                                <img src="/images/banners/womens-slide1.jpg" alt="Women's Banner" loading="lazy" decoding="async" />
                            </div>
                        </SwiperSlide>
                        <SwiperSlide>
                            <div className="banner-slide">
                                <img src="/images/banners/mens-slide3.jpg" alt="Men's Banner" loading="lazy" decoding="async" />
                            </div>
                        </SwiperSlide>
                        <SwiperSlide>
                            <div className="banner-slide">
                                <img src="/images/banners/main-banner2.jpg" alt="Main Banner" loading="lazy" decoding="async" />
                            </div>
                        </SwiperSlide>
                    </Swiper>
                </div>
            </section>








            <section className="men-premium galaxy" ref={menRef}>
                <div className="galaxy-layer stars-1"></div>
                <div className="galaxy-layer stars-2"></div>
                <div className="galaxy-layer dust"></div>

                <div className="men-premium-head">
                    <h2 className="men-premium-title">Men’s Collection</h2>
                    <div className="men-premium-underline">
                        <span className="ml m1"></span>
                        <span className="ml m2"></span>
                        <span className="ml m3"></span>
                    </div>
                </div>

                <div className="men-premium-wrap">
                    <Swiper
                        className="men-premium-swiper"
                        modules={[Autoplay]}
                        loop={true}
                        autoplay={{ delay: 2200, disableOnInteraction: false }}
                        speed={800}
                        spaceBetween={18}
                        slidesPerView={1.25}
                        breakpoints={{
                            480: { slidesPerView: 2 },
                            768: { slidesPerView: 3 },
                            1100: { slidesPerView: 4 }
                        }}
                    >
                        {[...new Set(menItems.map(it => JSON.stringify(it)))].map((s, idx) => {
                            const item = JSON.parse(s);
                            const src = withWidth(item.img, 800);
                            const title = item.title || "Men";
                            return (
                                <SwiperSlide key={idx}>
                                    <a href="/men" className="men-premium-card">
                                        <div className="men-premium-frame">
                                            <img
                                                src={src}
                                                alt={title}
                                                loading="lazy"
                                                decoding="async"
                                                onError={(e) => { e.currentTarget.src = "/images/men/default.jpg"; }}
                                            />
                                            <div className="men-premium-info">
                                                <h3 className="men-premium-name">{title}</h3>
                                                <span className="men-premium-btn">Shop Now</span>
                                            </div>
                                        </div>
                                    </a>
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>
                </div>
            </section>




            <section className="tara-quad-section">
                <div className="tara-quad-glow"></div>
                <div className="tara-quad-shell">
                    <div className="tara-quad-header">
                        <h2 className="tara-quad-title">Tara Saree</h2>
                        <div className="tara-quad-underline">
                            <span className="tara-line large"></span>
                            <span className="tara-line medium"></span>
                            <span className="tara-line small"></span>
                        </div>
                        <p className="tara-quad-sub">Crafted drapes with a golden touch</p>
                    </div>
                    <div className="tara-quad-grid">
                        <a href="/women" className="tara-quad-card">
                            <div className="tara-quad-frame">
                                <div className="tara-quad-media">
                                    <img src="/images/brands/tara-saree1.png" alt="Tara Saree 1" loading="lazy" decoding="async" />
                                </div>
                                <div className="tara-quad-overlay"></div>
                                <div className="tara-quad-tag">New Arrival</div>
                            </div>
                        </a>
                        <a href="/women" className="tara-quad-card">
                            <div className="tara-quad-frame">
                                <div className="tara-quad-media">
                                    <img src="/images/brands/tara-saree2.png" alt="Tara Saree 2" loading="lazy" decoding="async" />
                                </div>
                                <div className="tara-quad-overlay"></div>
                                <div className="tara-quad-tag">Handpicked</div>
                            </div>
                        </a>
                        <a href="/women" className="tara-quad-card">
                            <div className="tara-quad-frame">
                                <div className="tara-quad-media">
                                    <img src="/images/brands/tara-saree3.png" alt="Tara Saree 3" loading="lazy" decoding="async" />
                                </div>
                                <div className="tara-quad-overlay"></div>
                                <div className="tara-quad-tag">Silk Blend</div>
                            </div>
                        </a>
                        <a href="/women" className="tara-quad-card">
                            <div className="tara-quad-frame">
                                <div className="tara-quad-media">
                                    <img src="/images/brands/tara-saree4.png" alt="Tara Saree 4" loading="lazy" decoding="async" />
                                </div>
                                <div className="tara-quad-overlay"></div>
                                <div className="tara-quad-tag">Limited</div>
                            </div>
                        </a>
                    </div>
                    <div className="tara-quad-cta-row">
                        <a href="/women" className="tara-quad-cta">Explore Collection</a>
                    </div>
                </div>
            </section>




            <section className="ai-duo-section">
                <div className="ai-duo-container">
                    <div className="ai-duo-left">
                        <div className="ai-duo-frame">
                            <Swiper
                                className="ai-duo-slider"
                                modules={[Autoplay]}
                                loop={true}
                                slidesPerView={1}
                                autoplay={{ delay: 3500, disableOnInteraction: false }}
                                speed={900}
                            >
                                <SwiperSlide>
                                    <div className="ai-duo-slide">
                                        <img src="/images/brands/ai-sub-slide1.png" alt="AI Slide 1" loading="lazy" decoding="async" />
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide>
                                    <div className="ai-duo-slide">
                                        <img src="/images/brands/ai-sub-slide2.png" alt="AI Slide 2" loading="lazy" decoding="async" />
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide>
                                    <div className="ai-duo-slide">
                                        <img src="/images/brands/ai-sub-slide3.png" alt="AI Slide 3" loading="lazy" decoding="async" />
                                    </div>
                                </SwiperSlide>
                            </Swiper>
                        </div>
                    </div>

                    <div className="ai-duo-right">
                        <div className="ai-duo-right-bg"></div>
                        <div className="ai-duo-right-inner">
                            <div className="ai-duo-head">
                                <h2 className="ai-duo-title">Crafted Styles, Elevated</h2>
                                <div className="ai-duo-underline">
                                    <span className="ai-line large"></span>
                                    <span className="ai-line medium"></span>
                                    <span className="ai-line small"></span>
                                </div>
                            </div>

                            <p className="ai-duo-desc">
                                Discover premium looks designed to shine. From timeless silhouettes to trend-forward picks, explore pieces that feel as good as they look.
                            </p>

                            <div className="ai-duo-pills">
                                <span className="ai-pill">Comfort Fit</span>
                                <span className="ai-pill">Luxe Fabric</span>
                                <span className="ai-pill">Party Ready</span>
                            </div>

                            <div className="ai-btn-row">
                                <a href="/women" className="ai-btn">
                                    Explore Women’s
                                    <span className="ai-btn-shine"></span>
                                </a>
                                <a href="/women" className="ai-btn-outline">View Lookbook</a>
                            </div>

                            <div className="ai-duo-stats">
                                <div className="stat">
                                    <span className="stat-num">100+</span>
                                    <span className="stat-label">New Arrivals</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-num">24/7</span>
                                    <span className="stat-label">Style Support</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-num">Top</span>
                                    <span className="stat-label">Quality</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            <section className="mens-banner-slideshow">
                <div className="mens-banner-frame">
                    <Swiper
                        className="mens-banner-slider"
                        modules={[Autoplay]}
                        loop={true}
                        slidesPerView={1}
                        autoplay={{ delay: 4000, disableOnInteraction: false }}
                        speed={1000}
                    >
                        <SwiperSlide>
                            <div className="mens-banner-slide">
                                <img src="/images/banners/mens-slide2.jpg" alt="Men's Banner 1" loading="lazy" decoding="async" />
                            </div>
                        </SwiperSlide>
                        <SwiperSlide>
                            <div className="mens-banner-slide">
                                <img src="/images/banners/mens-slide3.jpg" alt="Men's Banner 2" loading="lazy" decoding="async" />
                            </div>
                        </SwiperSlide>
                        <SwiperSlide>
                            <div className="mens-banner-slide">
                                <img src="/images/banners/mens-slide4.jpg" alt="Men's Banner 3" loading="lazy" decoding="async" />
                            </div>
                        </SwiperSlide>
                    </Swiper>
                </div>
            </section>








            <section className="mens-section2">
                <div className="mens-section2-bg">
                    <img src="/images/mens-bg1.jpg" alt="Mens Style Background" />
                    <div className="mens-section2-overlay">
                        <div className="mens-section2-text">
                            <h1>Style Up</h1>
                            <h1>Your</h1>
                            <h1>Wardrobe</h1>
                        </div>
                    </div>
                </div>
            </section>



            <section className="wc-section">
                <div className="wc-header">
                    <h2 className="wc-title">Women’s Category</h2>
                    <Link to="/women" className="wc-viewall">VIEW ALL</Link>
                </div>
                <div className="wc-grid">
                    <div className="wc-card">
                        <div className="wc-imgwrap">
                            <img src="/images/banners/women-category-banarasi.png" alt="Banarasi Saree" loading="lazy" decoding="async" />
                        </div>
                        <div className="wc-info">
                            <h3 className="wc-name">Banarasi Saree</h3>
                            <p className="wc-desc">Rich golden zari work with soft silk texture. Perfect for festive occasions.</p>
                            <span className="wc-price">₹5,499</span>
                        </div>
                    </div>

                    <div className="wc-card">
                        <div className="wc-imgwrap">
                            <img src="/images/banners/women-category-kanchipattu.png" alt="Kanchipattu Saree" loading="lazy" decoding="async" />
                        </div>
                        <div className="wc-info">
                            <h3 className="wc-name">Kanchipattu Saree</h3>
                            <p className="wc-desc">Handwoven silk with traditional gold borders. Timeless elegance for every occasion.</p>
                            <span className="wc-price">₹7,299</span>
                        </div>
                    </div>

                    <div className="wc-card">
                        <div className="wc-imgwrap">
                            <img src="/images/banners/women-category-patola.png" alt="Patola Saree" loading="lazy" decoding="async" />
                        </div>
                        <div className="wc-info">
                            <h3 className="wc-name">Patola Saree</h3>
                            <p className="wc-desc">Intricate double-ikat weave with vibrant detailing and golden finish.</p>
                            <span className="wc-price">₹6,899</span>
                        </div>
                    </div>

                    <div className="wc-card">
                        <div className="wc-imgwrap">
                            <img src="/images/banners/women-category-uppada.png" alt="Uppada Saree" loading="lazy" decoding="async" />
                        </div>
                        <div className="wc-info">
                            <h3 className="wc-name">Uppada Saree</h3>
                            <p className="wc-desc">Lightweight silk woven with golden threads. A perfect blend of grace and luxury.</p>
                            <span className="wc-price">₹4,999</span>
                        </div>
                    </div>
                </div>
            </section>



            {/*<section className="ai-elite-section-final">
  <div className="ai-elite-container-final">
    <div className="ai-elite-left-final">
      <div className="ai-elite-head-final">
        <h2 className="ai-elite-title-final">Refined Menswear</h2>
      </div>

      <p className="ai-elite-desc-final">
        Tailored layers, modern cuts, and fabrics that move with you. Build a wardrobe that speaks in quiet confidence.
      </p>

      <ul className="ai-elite-points-final">
        <li className="ai-elite-point-final">Smart Tailoring</li>
        <li className="ai-elite-point-final">Breathable Weaves</li>
        <li className="ai-elite-point-final">Week-to-Weekend</li>
      </ul>

      <div className="ai-elite-actions-final">
        <a href="/men" className="ai-elite-btn-premium-final">
          <span className="ai-elite-btn-glow-final"></span>
          <span className="ai-elite-btn-text-final">Shop Now</span>
          <span className="ai-elite-btn-shine-final" aria-hidden="true"></span>
        </a>
        <a href="/men" className="ai-elite-link-final">Explore Collection</a>
      </div>

      <div className="ai-elite-metrics-final">
        <div className="ai-elite-metric-final">
          <span className="ai-elite-metric-num-final">50+</span>
          <span className="ai-elite-metric-label-final">Fresh Styles</span>
        </div>
        <div className="ai-elite-metric-final">
          <span className="ai-elite-metric-num-final">Premium</span>
          <span className="ai-elite-metric-label-final">Fabrics</span>
        </div>
        <div className="ai-elite-metric-final">
          <span className="ai-elite-metric-num-final">Tailored</span>
          <span className="ai-elite-metric-label-final">Comfort</span>
        </div>
      </div>
    </div>

    <div className="ai-elite-right-final">
      <div className="ai-elite-frame-final">
        <Swiper
          className="ai-elite-slider-final"
          modules={[Autoplay]}
          loop={true}
          slidesPerView={1}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          speed={800}
        >
          <SwiperSlide>
            <div className="ai-elite-slide-final">
              <img
                src="/images/banners/mens-slide2.jpg"
                alt="Menswear look one"
                loading="lazy"
                decoding="async"
                onError={(e) => { e.currentTarget.src = "/images/banners/mens-slide2.jpg"; }}
              />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="ai-elite-slide-final">
              <img
                src="/images/banners/mens-slide3.jpg"
                alt="Menswear look two"
                loading="lazy"
                decoding="async"
                onError={(e) => { e.currentTarget.src = "/images/banners/mens-slide3.jpg"; }}
              />
            </div>
          </SwiperSlide>
        </Swiper>
        <div className="ai-elite-glow-final"></div>
        <div className="ai-elite-border-final"></div>
      </div>
    </div>
  </div>
</section>  */}



            <section className="home-section6">
                <h2 className="home-section6-title">Trending Now....</h2>
                <div className="home-section6-grid">
                    {/* Part 1 */}
                    <div className="home-section6-item">
                        <div className="home-section6-left">
                            <img src="/images/trending-part1-big1.jpeg" alt="Printed Sarees" />
                        </div>
                        <div className="home-section6-right">
                            <h3>Printed Sarees...</h3>
                            <div className="home-section6-small-images">
                                <img src="/images/trending-part1-small1.jpeg" alt="Saree 1" />
                                <img src="/images/trending-part1-small2.jpeg" alt="Saree 2" />
                            </div>
                        </div>
                    </div>

                    {/* Part 2 */}
                    <div className="home-section6-item">
                        <div className="home-section6-left">
                            <img src="/images/trending-part2-big1.jpeg" alt="Lehanga" />
                        </div>
                        <div className="home-section6-right">
                            <h3> Printed Lehanga...</h3>
                            <div className="home-section6-small-images">
                                <img src="/images/trending-part2-small1.jpeg" alt="Lehanga 1" />
                                <img src="/images/trending-part2-small2.jpeg" alt="Lehanga 2" />
                            </div>
                        </div>
                    </div>

                    {/* Part 3 */}
                    <div className="home-section6-item">
                        <div className="home-section6-left">
                            <img src="/images/trending-part3-big1.jpeg" alt="Wedding Sarees" />
                        </div>
                        <div className="home-section6-right">
                            <h3>Wedding Sarees...</h3>
                            <div className="home-section6-small-images">
                                <img src="/images/trending-part3-small1.jpeg" alt="Saree 1" />
                                <img src="/images/trending-part3-small2.jpeg" alt="Saree 2" />
                            </div>
                        </div>
                    </div>

                    {/* Part 4 */}
                    <div className="home-section6-item">
                        <div className="home-section6-left">
                            <img src="/images/trending-part4-big1.jpeg" alt="Printed Sarees" />
                        </div>
                        <div className="home-section6-right">
                            <h3>Printed Chudidars...</h3>
                            <div className="home-section6-small-images">
                                <img src="/images/trending-part4-small1.jpeg" alt="Saree 1" />
                                <img src="/images/trending-part4-small2.jpeg" alt="Saree 2" />
                            </div>
                        </div>
                    </div>

                    {/* Part 5 */}
                    <div className="home-section6-item">
                        <div className="home-section6-left">
                            <img src="/images/trending-part5-big1.jpeg" alt="Lehanga" />
                        </div>
                        <div className="home-section6-right">
                            <h3> Printed Gowns...</h3>
                            <div className="home-section6-small-images">
                                <img src="/images/trending-part5-small1.jpeg" alt="Lehanga 1" />
                                <img src="/images/trending-part5-small2.jpeg" alt="Lehanga 2" />
                            </div>
                        </div>
                    </div>

                    {/* Part 6 */}
                    <div className="home-section6-item">
                        <div className="home-section6-left">
                            <img src="/images/trending-part6-big1.jpeg" alt="Wedding Sarees" />
                        </div>
                        <div className="home-section6-right">
                            <h3>Half Sarees...</h3>
                            <div className="home-section6-small-images">
                                <img src="/images/trending-part6-small1.jpeg" alt="Saree 1" />
                                <img src="/images/trending-part6-small2.jpeg" alt="Saree 2" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            <section className="home-section4">
                <h2 className="home-section4-title">Our Premium Collections</h2>
                <div className="lux4-underline">
                    <span className="lux4-line large"></span>
                    <span className="lux4-line medium"></span>
                    <span className="lux4-line small"></span>
                </div>
                <div className="lux4-container">
                    <a
                        href="/men"
                        aria-label="Shop Men's Fashion"
                        className="lux4-glass"
                        data-text="Men"
                        style={{ ['--r']: '-12', ['--bg']: "url('/images/card1.jpg')" }}
                    ></a>
                    <a
                        href="/women"
                        aria-label="Shop Women's Fashion"
                        className="lux4-glass"
                        data-text="Women"
                        style={{ ['--r']: '6', ['--bg']: "url('/images/card3.jpg')" }}
                    ></a>
                    <a
                        href="/kids"
                        aria-label="Shop Kids Fashion"
                        className="lux4-glass"
                        data-text="Kids"
                        style={{ ['--r']: '18', ['--bg']: "url('/images/card4.jpg')" }}
                    ></a>
                </div>
            </section>



            <section className="kids-cosmo">
                <div className="kids-sky layer-a"></div>
                <div className="kids-sky layer-b"></div>
                <div className="kids-sky layer-glow"></div>
                <div className="kids-sparkles"></div>

                <div className="kids-shell">
                    <h2 className="kids-title">Kids Collection</h2>
                    <div className="kids-underline">
                        <span className="kline big"></span>
                        <span className="kline mid"></span>
                        <span className="kline tiny"></span>
                    </div>

                    <div className="kids-tracks">
                        <div className="kids-track t1">
                            {Array.from({ length: 9 }, (_, i) => (
                                <Link key={`t1-${i}`} className="kids-card tilt-left" to="/kids">
                                    <div className="kids-frame">
                                        <img
                                            src={`/images/wave${(i % 9) + 1}.jpeg`}
                                            alt={`Kids ${i + 1}`}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        <div className="shine"></div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div className="kids-track t2">
                            {Array.from({ length: 9 }, (_, i) => (
                                <Link key={`t2-${i}`} className="kids-card tilt-right" to="/kids">
                                    <div className="kids-frame">
                                        <img
                                            src={`/images/wave${((i + 4) % 9) + 1}.jpeg`}
                                            alt={`Kids ${i + 10}`}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        <div className="shine"></div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="kids-footer-stars">
                        {Array.from({ length: 18 }, (_, i) => (
                            <span key={i} className="mini-star"></span>
                        ))}
                    </div>
                </div>
            </section>



            <section className="ai-cats">
                <div className="ai-cats-head">
                    <h2 className="ai-cats-title">Women’s Categories</h2>
                    <div className="ai-cats-underline">
                        <span className="ac ac1"></span>
                        <span className="ac ac2"></span>
                        <span className="ac ac3"></span>
                    </div>
                </div>
                <div className="ai-cats-shell">
                    <div className="ai-cats-grid">
                        <a href="/women" className="ai-cats-card">
                            <div className="ai-cats-inner">
                                <img src="/images/ai/womens-sarees.png" alt="" loading="lazy" decoding="async" />
                            </div>
                        </a>
                        <a href="/women" className="ai-cats-card">
                            <div className="ai-cats-inner">
                                <img src="/images/ai/womens-lehangas.png" alt="" loading="lazy" decoding="async" />
                            </div>
                        </a>
                        <a href="/women" className="ai-cats-card">
                            <div className="ai-cats-inner">
                                <img src="/images/ai/womens-kurtis&kurtas.png" alt="" loading="lazy" decoding="async" />
                            </div>
                        </a>
                        <a href="/women" className="ai-cats-card">
                            <div className="ai-cats-inner">
                                <img src="/images/ai/womens-gown&indowesterns.png" alt="" loading="lazy" decoding="async" />
                            </div>
                        </a>
                        <a href="/women" className="ai-cats-card">
                            <div className="ai-cats-inner">
                                <img src="/images/ai/womens-bridal-collection.png" alt="" loading="lazy" decoding="async" />
                            </div>
                        </a>
                        <a href="/women" className="ai-cats-card">
                            <div className="ai-cats-inner">
                                <img src="/images/ai/womens-salwar-kameez.png" alt="" loading="lazy" decoding="async" />
                            </div>
                        </a>
                        <a href="/women" className="ai-cats-card">
                            <div className="ai-cats-inner">
                                <img src="/images/ai/womens-festival-wear.png" alt="" loading="lazy" decoding="async" />
                            </div>
                        </a>
                        <a href="/women" className="ai-cats-card">
                            <div className="ai-cats-inner">
                                <img src="/images/ai/dupattas&stoles.png" alt="" loading="lazy" decoding="async" />
                            </div>
                        </a>
                    </div>
                </div>
            </section>



            <section className="ai-hero-card">
                <div className="ai-hero-bg">
                    <img src="/images/ai/main-card1.png" alt="" />
                    <div className="ai-hero-shade"></div>
                </div>
                <div className="ai-hero-floater">
                    <div className="ai-hero-border"></div>
                    <div className="ai-hero-body">
                        <div className="ai-hero-media">
                            <img src="/images/ai/sub-slide1.png" alt="" loading="lazy" decoding="async" />
                        </div>
                        <div className="ai-hero-content">
                            <h3 className="ai-hero-title">Elegant Styles</h3>
                            <p className="ai-hero-desc">Elegant silhouettes with a golden edge. Discover pieces that move with you and shine in every moment.</p>
                            <a href="/women" className="ai-hero-btn">Shop Now<span className="ai-hero-shine"></span></a>
                        </div>
                    </div>
                </div>
            </section>










            <section className="ws-section">
                <div className="ws-top">
                    <h2 className="ws-title">Women’s Picks</h2>
                    <div className="ws-underline">
                        <span className="ws-line l1"></span>
                        <span className="ws-dot"></span>
                        <span className="ws-line l2"></span>
                    </div>
                </div>

                <div className="ws-wrap">
                    <div className="ws-left">
                        <div className="ws-left-inner">
                            <h3 className="ws-heading">Top Deals</h3>
                            <p className="ws-up">UP TO</p>
                            <div className="ws-off"><span>30%</span> OFF</div>
                            <p className="ws-sub">SELECTED STYLES</p>
                            <Link to="/women" className="ws-cta">SHOP NOW</Link>
                        </div>
                    </div>

                    <div className="ws-right">
                        <div className="ws-media">
                            <Swiper
                                className="ws-swiper"
                                modules={[Autoplay]}
                                loop={true}
                                slidesPerView={1}
                                autoplay={{ delay: 3200, disableOnInteraction: false }}
                                speed={900}
                            >
                                <SwiperSlide>
                                    <div className="ws-slide">
                                        <img src="/images/banners/women-banner3.png" alt="Women's Banner 3" loading="lazy" decoding="async" />
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide>
                                    <div className="ws-slide">
                                        <img src="/images/banners/women-banner4.png" alt="Women's Banner 4" loading="lazy" decoding="async" />
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide>
                                    <div className="ws-slide">
                                        <img src="/images/banners/women-banner5.png" alt="Women's Banner 5" loading="lazy" decoding="async" />
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide>
                                    <div className="ws-slide">
                                        <img src="/images/banners/women-banner6.png" alt="Women's Banner 6" loading="lazy" decoding="async" />
                                    </div>
                                </SwiperSlide>
                            </Swiper>
                        </div>
                    </div>
                </div>
            </section>



            <section className="wc-duo">
                <div className="wc-duo-top">
                    <h2 className="wc-duo-title">Women’s Showcase</h2>
                    <div className="wc-duo-underline">
                        <span className="kl k1"></span>
                        <span className="kl k2"></span>
                        <span className="kl k3"></span>
                    </div>
                </div>

                <div className="wc-duo-wrap">
                    <Link to="/women" className="wc-box">
                        <div className="wc-duo-circle">
                            <img src="/images/banners/circle.png" alt="Women Collection Circle" loading="lazy" decoding="async" />
                        </div>
                    </Link>

                    <Link to="/women" className="wc-box">
                        <div className="wc-duo-rect">
                            <img src="/images/banners/square1.png" alt="Women Collection Square" loading="lazy" decoding="async" />
                        </div>
                    </Link>
                </div>

                <div className="wc-duo-cta-row">
                    <Link to="/women" className="wc-duo-cta">View All</Link>
                </div>
            </section>


            <section className="kids-showcase galaxy" ref={kidsRef}>
                <div className="galaxy-layer stars-1"></div>
                <div className="galaxy-layer stars-2"></div>
                <div className="galaxy-layer dust"></div>

                <div className="kids-head">
                    <h2 className="kids-title">Kids’ Collection</h2>
                    <div className="kids-underline">
                        <span className="kl k1"></span>
                        <span className="kl k2"></span>
                        <span className="kl k3"></span>
                    </div>
                </div>

                <div className="kids-wrap">
                    <button
                        type="button"
                        className="kids-nav left"
                        aria-label="Previous"
                        onClick={() => {
                            const rail = document.getElementById('kids-rail');
                            if (rail) rail.scrollBy({ left: -rail.clientWidth * 0.85, behavior: 'smooth' });
                        }}
                    >
                        ‹
                    </button>
                    <div id="kids-rail" className="kids-rail">
                        {[...new Set(kidsItems.map(it => JSON.stringify(it)))].map((s, idx) => {
                            const item = JSON.parse(s);
                            const src = withWidth(item.img, 900);
                            const title = item.title || "Kids";
                            return (
                                <a href="/kids" className="kids-card" key={idx}>
                                    <div className="kids-frame">
                                        <img
                                            src={src}
                                            alt={title}
                                            loading="lazy"
                                            decoding="async"
                                            onError={(e) => { e.currentTarget.src = "/images/kids/default.jpg"; }}
                                        />
                                        <div className="kids-chip">{idx % 3 === 0 ? "New" : idx % 3 === 1 ? "Trending" : "Bestseller"}</div>
                                        <div className="kids-footer">
                                            <h3 className="kids-name">{title}</h3>
                                            <span className="kids-cta">View</span>
                                        </div>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                    <button
                        type="button"
                        className="kids-nav right"
                        aria-label="Next"
                        onClick={() => {
                            const rail = document.getElementById('kids-rail');
                            if (rail) rail.scrollBy({ left: rail.clientWidth * 0.85, behavior: 'smooth' });
                        }}
                    >
                        ›
                    </button>
                </div>
            </section>










            <Footer />
        </div>
    );
}
