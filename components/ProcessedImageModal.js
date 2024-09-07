import React from "react";

const ProcessedImageModal = ({
  dominantColors,
  processedImageSrc,
  outlineImageSrc,
  showOutline,
  toggleImage,
}) => {
  return (
    <div className="modal-content-wrapper">
      <div className="modal-colors-container">
        <h3>Colors</h3>
        <ul className="color-list">
          {dominantColors.map((color, index) => (
            <li key={index} className="color-item">
              <div
                className="color-circle"
                style={{ backgroundColor: color }}
              ></div>
              <span>{color}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="modal-image-container">
        {showOutline ? (
          <img
            src={outlineImageSrc}
            alt="Outlined Image"
            className="modal-image"
          />
        ) : (
          <img
            src={processedImageSrc}
            alt="Processed Image"
            className="modal-image"
          />
        )}
      </div>
    </div>
  );
};

export default ProcessedImageModal;
