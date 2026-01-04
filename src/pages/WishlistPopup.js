import React from 'react';
import './WishlistPopup.css';

const WishlistPopup = ({ onConfirm, onCancel }) => {
  return (
    <div className="popup-overlay">
      <div className="wishlist-popup-box">
        <h2 className="wishlist-popup-title">Are you sure to remove from the wishlist?</h2>
        <div className="wishlist-popup-buttons">
          <button className="wishlist-popup-confirm" onClick={onConfirm}>Yes</button>
          <button className="wishlist-popup-cancel" onClick={onCancel}>No</button>
        </div>
      </div>
    </div>
  );
};

export default WishlistPopup;
