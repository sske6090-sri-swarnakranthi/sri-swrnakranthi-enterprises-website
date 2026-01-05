import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "./AboutPage.css";

const AboutPage = () => {
  const bg = "/images/banners/main-banner11.jpg";

  return (
    <>
      <Navbar />
      <main className="ap">
        <section className="ap-hero" style={{ backgroundImage: `url(${bg})` }}>
          <div className="ap-overlay" />
          <div className="ap-container">
            <div className="ap-left">
              <p className="ap-kicker">ABOUT US</p>
              <h1 className="ap-title">Sri Swarnakranthi Enterprises</h1>
              <p className="ap-subtitle">
                We create customized gifts and handle all types of printing works with clean finishing, strong quality,
                and fast support. From bulk orders to personal gifting, we help you make every product look premium.
              </p>

              <div className="ap-points">
                <div className="ap-point">
                  <span className="ap-dot" />
                  <span className="ap-pointText">Customized gifting for events, offices, and families</span>
                </div>
                <div className="ap-point">
                  <span className="ap-dot" />
                  <span className="ap-pointText">Printing works like visiting cards, ID cards, wedding cards, and more</span>
                </div>
                <div className="ap-point">
                  <span className="ap-dot" />
                  <span className="ap-pointText">Bulk orders with value pricing and fast timelines</span>
                </div>
              </div>

              <div className="ap-actions">
                <a className="ap-btn ap-primary" href="/contact">
                  Contact Us
                </a>
                <a className="ap-btn ap-outline" href="tel:9908435065">
                  Call Now
                </a>
              </div>

              <div className="ap-strip">
                <div className="ap-stripItem">
                  <p className="ap-stripTop">Location</p>
                  <p className="ap-stripBottom">Srikakulam</p>
                </div>
                <div className="ap-stripItem">
                  <p className="ap-stripTop">Focus</p>
                  <p className="ap-stripBottom">Gifts + Print</p>
                </div>
                <div className="ap-stripItem">
                  <p className="ap-stripTop">Support</p>
                  <p className="ap-stripBottom">Fast response</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="ap-cats">
  <div className="ap-container">
    <div className="ap-catsHead">
      <h2 className="ap-catsTitle">Our Categories</h2>
      <p className="ap-catsSub">
        Explore the wide range of customized gifting and printing works we handle every day.
      </p>
    </div>

    <div className="ap-catsGrid">
      <div className="ap-catCard">
        <p className="ap-catTop">Customized Gifting</p>
        <p className="ap-catList">
          T-Shirts & Caps, Key Chains, Pens, Mobile Stands, Mugs, Travel Bags, Jewellery Boxes.
        </p>
      </div>

      <div className="ap-catCard">
        <p className="ap-catTop">Office & Corporate</p>
        <p className="ap-catList">
          Diaries, Notebooks, Calendars, Cheque Book Folders, ATM Pouches, Mementos, Medals.
        </p>
      </div>

      <div className="ap-catCard">
        <p className="ap-catTop">Printing Works</p>
        <p className="ap-catList">
          Visiting Cards, Pamphlets, Wedding Cards, ID Cards, All Types of Custom Printing.
        </p>
      </div>

      <div className="ap-catCard">
        <p className="ap-catTop">School & Stationery</p>
        <p className="ap-catList">
          School Diaries, Progress Reports, Stationery Items, Covers, Folders, ID Cards.
        </p>
      </div>

      <div className="ap-catCard">
        <p className="ap-catTop">Bags & Covers</p>
        <p className="ap-catList">
          Ladies Bags, Shopping Bags, Grocery Covers, Shopping Covers, Pouches and Folders.
        </p>
      </div>

      <div className="ap-catCard">
        <p className="ap-catTop">Clocks & Accessories</p>
        <p className="ap-catList">
          Wall Clocks, Table Clocks, Ties & Belts, Key Chains, Pens Stand, Gift Accessories.
        </p>
      </div>
    </div>
  </div>
</section>



<section className="ap-showcase">
  <div className="ap-container">
    <div className="ap-showHead">
      <h2 className="ap-showTitle">A Peek Into Our Work</h2>
      <p className="ap-showSub">
        From printing to gifting, we make every product look premium with clean finishing and sharp details.
      </p>
    </div>

    <div className="ap-showGrid">
      <div className="ap-showCard">
        <div className="ap-showImgWrap">
          <img
            src="/images/banners/printing/printing6.jpg"
            alt="Printing Works"
            className="ap-showImg"
            loading="lazy"
          />
        </div>
        <div className="ap-showText">
          <p className="ap-showTop">Printing Works</p>
          <p className="ap-showDesc">
            Visiting cards, wedding cards, pamphlets and ID cards with crisp print quality and neat finish.
          </p>
        </div>
      </div>

      <div className="ap-showCard">
        <div className="ap-showImgWrap">
          <img
            src="/images/banners/mug-printing.webp"
            alt="Mug Printing"
            className="ap-showImg"
            loading="lazy"
          />
        </div>
        <div className="ap-showText">
          <p className="ap-showTop">Mug Printing</p>
          <p className="ap-showDesc">
            Photo mugs, logo mugs and gifting mugs made using high quality sublimation printing.
          </p>
        </div>
      </div>

      <div className="ap-showCard">
        <div className="ap-showImgWrap">
          <img
            src="/images/banners/stationary/stationary6.jpg"
            alt="Stationery"
            className="ap-showImg"
            loading="lazy"
          />
        </div>
        <div className="ap-showText">
          <p className="ap-showTop">Stationery</p>
          <p className="ap-showDesc">
            Diaries, notebooks and office supplies with customized branding for schools and companies.
          </p>
        </div>
      </div>

      <div className="ap-showCard">
        <div className="ap-showImgWrap">
          <img
            src="/images/banners/clocks/clock2.jpg"
            alt="Clocks"
            className="ap-showImg"
            loading="lazy"
          />
        </div>
        <div className="ap-showText">
          <p className="ap-showTop">Clocks</p>
          <p className="ap-showDesc">
            Wall clocks and table clocks for gifting and branding, perfect for offices and events.
          </p>
        </div>
      </div>

      <div className="ap-showCard">
        <div className="ap-showImgWrap">
          <img
            src="/images/banners/school/school7.jpg"
            alt="School Items"
            className="ap-showImg"
            loading="lazy"
          />
        </div>
        <div className="ap-showText">
          <p className="ap-showTop">School Items</p>
          <p className="ap-showDesc">
            School diaries, progress reports, covers and ID cards designed for daily school use.
          </p>
        </div>
      </div>

      <div className="ap-showCard">
        <div className="ap-showImgWrap">
          <img
            src="/images/banners/travel-bags.webp"
            alt="Travel Bags"
            className="ap-showImg"
            loading="lazy"
          />
        </div>
        <div className="ap-showText">
          <p className="ap-showTop">Bags & Pouches</p>
          <p className="ap-showDesc">
            Travel bags, shopping bags and pouches customized for gifting and bulk orders.
          </p>
        </div>
      </div>
    </div>
  </div>
</section>



<section className="ap-feature">
  <div className="ap-container">
    <div className="ap-featureHead">
      <h2 className="ap-featureTitle">Why People Choose Us</h2>
      <p className="ap-featureSub">
        We focus on clean finishing, sharp printing, and fast delivery. Whether it is a single gift or a bulk order,
        we treat it with the same care.
      </p>
    </div>

    <div className="ap-featureSplit">
      <div className="ap-featureLeft">
        <img
          src="/images/banners/stationary.jpg"
          alt="Customized gifting and printing"
          className="ap-featureImg"
          loading="lazy"
        />
      </div>

      <div className="ap-featureRight">
        <p className="ap-featureKicker">CUSTOMIZED GIFTING</p>
        <h3 className="ap-featureBig">
          Premium look, clean finish, and perfect for every occasion
        </h3>

        <div className="ap-featureList">
          <div className="ap-featureItem">
            <span className="ap-featureDot" />
            <span className="ap-featureText">
              Bulk orders for schools, offices, and events with value pricing
            </span>
          </div>

          <div className="ap-featureItem">
            <span className="ap-featureDot" />
            <span className="ap-featureText">
              High-quality printing for visiting cards, wedding cards, ID cards, and more
            </span>
          </div>

          <div className="ap-featureItem">
            <span className="ap-featureDot" />
            <span className="ap-featureText">
              Many categories in one place, gifting, printing, stationery, bags, clocks, and accessories
            </span>
          </div>

          <div className="ap-featureItem">
            <span className="ap-featureDot" />
            <span className="ap-featureText">
              Fast support on call and WhatsApp for designs, pricing, and timelines
            </span>
          </div>
        </div>

        <div className="ap-featureBtns">
          <a className="ap-featureBtn ap-featureBtnPrimary" href="/contact">
            Contact Us
          </a>
          <a className="ap-featureBtn ap-featureBtnOutline" href="tel:9908435065">
            Call Now
          </a>
        </div>
      </div>
    </div>
  </div>
</section>


<section className="ap-galleryWhite">
  <div className="ap-container">
    <div className="ap-galleryHead">
      <h2 className="ap-galleryTitle">Gallery</h2>
      <p className="ap-gallerySub">
        A quick look at our customized gifting and printing works. Clean finishing, sharp printing, and premium feel.
      </p>
    </div>

    <div className="ap-galleryGrid">
      <div className="ap-galleryCard">
        <img
          src="/images/banners/printing/printing2.jpg"
          alt="Printing"
          className="ap-galleryImg"
          loading="lazy"
        />
        <div className="ap-galleryText">
          <p className="ap-galleryTop">Printing Works</p>
          <p className="ap-galleryDesc">Visiting cards, wedding cards, pamphlets, and more.</p>
        </div>
      </div>

      <div className="ap-galleryCard">
        <img
          src="/images/banners/mug-printing.webp"
          alt="Mug printing"
          className="ap-galleryImg"
          loading="lazy"
        />
        <div className="ap-galleryText">
          <p className="ap-galleryTop">Mug Printing</p>
          <p className="ap-galleryDesc">Photo mugs, logo mugs, and gifting mugs.</p>
        </div>
      </div>

      <div className="ap-galleryCard">
        <img
          src="/images/banners/Calenders and diaries.webp"
          alt="Calendars and diaries"
          className="ap-galleryImg"
          loading="lazy"
        />
        <div className="ap-galleryText">
          <p className="ap-galleryTop">Calendars & Diaries</p>
          <p className="ap-galleryDesc">Office and school diaries with custom branding.</p>
        </div>
      </div>

      <div className="ap-galleryCard">
        <img
          src="/images/banners/clocks/clock3.jpg"
          alt="Clocks"
          className="ap-galleryImg"
          loading="lazy"
        />
        <div className="ap-galleryText">
          <p className="ap-galleryTop">Clocks</p>
          <p className="ap-galleryDesc">Wall clocks and table clocks for gifting and branding.</p>
        </div>
      </div>

      <div className="ap-galleryCard">
        <img
          src="/images/banners/stationary/stationary5.jpg"
          alt="Stationery"
          className="ap-galleryImg"
          loading="lazy"
        />
        <div className="ap-galleryText">
          <p className="ap-galleryTop">Stationery</p>
          <p className="ap-galleryDesc">Pens, stands, notebooks, and office gifting items.</p>
        </div>
      </div>

      <div className="ap-galleryCard">
        <img
          src="/images/banners/school/school6.jpg"
          alt="School items"
          className="ap-galleryImg"
          loading="lazy"
        />
        <div className="ap-galleryText">
          <p className="ap-galleryTop">School Items</p>
          <p className="ap-galleryDesc">School diaries, progress reports, covers and ID cards.</p>
        </div>
      </div>

      <div className="ap-galleryCard">
        <img
          src="/images/banners/center-clock.jpg"
          alt="Wall clock"
          className="ap-galleryImg"
          loading="lazy"
        />
        <div className="ap-galleryText">
          <p className="ap-galleryTop">Wall & Table Clocks</p>
          <p className="ap-galleryDesc">Perfect for celebrations, offices and gifting needs.</p>
        </div>
      </div>

      <div className="ap-galleryCard">
        <img
          src="/images/banners/travel-bags.webp"
          alt="Travel bags"
          className="ap-galleryImg"
          loading="lazy"
        />
        <div className="ap-galleryText">
          <p className="ap-galleryTop">Bags & Pouches</p>
          <p className="ap-galleryDesc">Travel bags, shopping bags, folders and pouches.</p>
        </div>
      </div>
    </div>
  </div>
</section>



<section className="ap-blackCta">
  <div className="ap-container">
    <div className="ap-blackHead">
      <h2 className="ap-blackTitle">Let’s Build Something Special</h2>
      <p className="ap-blackSub">
        From bulk gifting to premium printing, we help you choose the right products, designs, and finishing.
        Tell us what you need, we will take care of the rest.
      </p>
    </div>

    <div className="ap-blackSplit">
      <div className="ap-blackLeft">
        <div className="ap-blackStat">
          <p className="ap-blackStatTop">Best for</p>
          <p className="ap-blackStatBig">Schools & Offices</p>
          <p className="ap-blackStatDesc">
            Diaries, ID cards, calendars, visiting cards, mementos, medals, and more.
          </p>
        </div>

        <div className="ap-blackStat">
          <p className="ap-blackStatTop">Popular</p>
          <p className="ap-blackStatBig">Customized Gifts</p>
          <p className="ap-blackStatDesc">
            Key chains, mugs, caps, T-shirts, bags, jewellery boxes, and premium gift items.
          </p>
        </div>

        <div className="ap-blackStat">
          <p className="ap-blackStatTop">Quality</p>
          <p className="ap-blackStatBig">Clean Finishing</p>
          <p className="ap-blackStatDesc">
            Sharp printing, neat edges, good material choices, and a premium final look.
          </p>
        </div>
      </div>

      <div className="ap-blackRight">
        <div className="ap-blackCard">
          <p className="ap-blackCardTitle">Quick Contact</p>
          <p className="ap-blackCardText">
            Call us or WhatsApp your requirements. Share quantity, design, and timeline, we will reply fast.
          </p>

          <div className="ap-blackBtns">
            <a className="ap-blackBtn ap-blackBtnPrimary" href="/contact">
              Contact Page
            </a>
            <a className="ap-blackBtn ap-blackBtnOutline" href="tel:9908435065">
              Call Now
            </a>
            <a
              className="ap-blackBtn ap-blackBtnOutline"
              href="https://wa.me/919908435065?text=Hi%20Sri%20Swarnakranthi%20Enterprises%2C%20I%20need%20customized%20gifting%20or%20printing."
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          </div>

          <div className="ap-blackMini">
            <div className="ap-blackMiniItem">
              <p className="ap-blackMiniTop">Working Hours</p>
              <p className="ap-blackMiniBottom">Mon to Sat: 9:30 AM to 8:30 PM</p>
            </div>
            <div className="ap-blackMiniItem">
              <p className="ap-blackMiniTop">Location</p>
              <p className="ap-blackMiniBottom">Srikakulam - 532 001</p>
            </div>
          </div>
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

export default AboutPage;
