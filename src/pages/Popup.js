import React from 'react';
import './Popup.css';
import { FaTimes } from 'react-icons/fa';

const Popup = ({ image, message, subMessage, onConfirm, onCancel, onWishlist }) => {
  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <div className="popup-header">
          <img src={image} alt="popup-item" className="popup-image" />
          <FaTimes className="popup-close-icon" onClick={onCancel} />
        </div>
        <h2 className="popup-title">{message}</h2>
        <p className="popup-subtext">{subMessage}</p>
        <div className="popup-buttons">
          <button className="popup-wishlist" onClick={onWishlist}>Move to Wishlist</button>
          <button className="popup-confirm" onClick={onConfirm}>Remove from Bag</button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
