// D:\shopping\src\pages\Brands.js
import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import './Brands.css';

const Brands = () => {
  const brands = Array.from({ length: 20 }, (_, i) => `/images/brands/brand${i + 1}.jpeg`);

  return (
    <div className="brands-page">
      <Navbar />
      <section className="brands-section">
  <h2 className="brands-title">Men's Top Brands</h2>
  <div className="brands-container">
    <div className="brands-box">
      {brands.map((src, index) => (
        <div key={index} className={`brand-item`}>
          <div className="brand-image-wrapper">
            <img src={src} alt={`Brand ${index + 1}`} />
          </div>
        </div>
      ))}
    </div>
  </div>
</section>



      {/* Women's Top Brands Section */}
      <section className="womens-brands-section">
  <h2 className="womens-brands-title">Women's Top Brands..</h2>
  <div className="womens-brands-container">
    <div className="womens-brands-box">
      {brands.map((src, index) => (
        <div key={index} className={`womens-brand-item womens-item-${index + 1}`}>
          <img src={src} alt={`Brand ${index + 1}`} />
        </div>
      ))}
    </div>
  </div>
</section>




      <Footer />
    </div>
  );
};

export default Brands;
