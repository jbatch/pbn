// components/ProcessingSettings.js
import React from "react";

const ProcessingSettings = ({
  numColors,
  setNumColors,
  minBlobSize,
  setMinBlobSize,
  minBlobThickness,
  setMinBlobThickness,
  blurRadius,
  setBlurRadius,
  blurType,
  setBlurType,
  handleProcessClick,
}) => {
  return (
    <div className="card">
      <h2>Image Processing Settings</h2>
      <div className="form-group">
        <label htmlFor="numColors">Number of dominant colors:</label>
        <input
          type="number"
          id="numColors"
          value={numColors}
          onChange={(e) => setNumColors(parseInt(e.target.value))}
          min="1"
          max="16"
        />
      </div>
      <div className="form-group">
        <label htmlFor="minBlobSize">Minimum blob size (in pixels):</label>
        <input
          type="number"
          id="minBlobSize"
          value={minBlobSize}
          onChange={(e) => setMinBlobSize(parseInt(e.target.value))}
          min="1"
        />
      </div>
      <div className="form-group">
        <label htmlFor="minBlobThickness">Minimum blob thickness:</label>
        <input
          type="number"
          id="minBlobThickness"
          value={minBlobThickness}
          onChange={(e) => setMinBlobThickness(parseFloat(e.target.value))}
          min="1"
          step="0.1"
        />
      </div>
      <div className="form-group">
        <label htmlFor="blurRadius">Blur radius:</label>
        <input
          type="number"
          id="blurRadius"
          value={blurRadius}
          onChange={(e) => setBlurRadius(parseInt(e.target.value))}
          min="0"
          max="10"
          step="1"
        />
      </div>
      <div className="form-group">
        <label htmlFor="blurType">Blur type:</label>
        <select
          id="blurType"
          value={blurType}
          onChange={(e) => setBlurType(e.target.value)}
        >
          <option value="gaussian">Gaussian Blur</option>
          <option value="bilateral">Bilateral Filter (Edge-Preserving)</option>
        </select>
      </div>
      <button onClick={handleProcessClick} className="button">
        Process Image
      </button>
    </div>
  );
};

export default ProcessingSettings;
