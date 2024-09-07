// components/ImageUpload.js
import React from "react";

const ImageUpload = ({ imageSrc, handleImageUpload }) => {
  return (
    <div className="card image-upload-card">
      <h2>Image Upload</h2>
      <input
        type="file"
        id="imageUpload"
        accept="image/*"
        onChange={handleImageUpload}
        className="file-input"
      />
      <div className="imageContainer">
        <div className="image-section">
          <h3>Original Image</h3>
          <img src={imageSrc} alt="Original Image" className="image" />
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
