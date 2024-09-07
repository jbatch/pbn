import React, { useEffect, useRef } from "react";

const ProcessedImageModal = ({
  dominantColors,
  processedImageSrc,
  outlineImageSrc,
  showOutline,
  blobCenters,
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (showOutline && canvasRef.current && outlineImageSrc && blobCenters) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Draw numbers
        ctx.font = "12px Arial";
        ctx.fillStyle = "red";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        blobCenters.forEach(({ x, y, index }) => {
          ctx.fillText(index.toString(), x, y);
        });
      };
      img.src = outlineImageSrc;
    }
  }, [showOutline, outlineImageSrc, blobCenters]);

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
              <span>
                {index}: {color}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="modal-image-container">
        {showOutline ? (
          <canvas ref={canvasRef} className="modal-image" />
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
