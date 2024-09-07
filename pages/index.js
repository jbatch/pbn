import React, { useEffect, useState, useCallback, useRef } from "react";
import Layout from "../Layout";
import ImageUpload from "../components/ImageUpload";
import ProcessingSettings from "../components/ProcessingSettings";
import Modal from "../components/Modal";
import ProcessedImageModal from "../components/ProcessedImageModal";

const MAX_IMAGE_SIZE = 1200; // Maximum width or height in pixels
const MIN_IMAGE_SIZE = 400; // Minimum width or height in pixels

function resizeImage(file, minSize, maxSize) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate the scaling factor
        let scale = 1;

        // If the image is smaller than the minimum size
        if (width < minSize && height < minSize) {
          scale = Math.max(minSize / width, minSize / height);
        }
        // If the image is larger than the maximum size
        else if (width > maxSize || height > maxSize) {
          scale = Math.min(maxSize / width, maxSize / height);
        }

        // Apply the scaling
        width = Math.round(width * scale);
        height = Math.round(height * scale);

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          resolve(blob);
        }, file.type);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [imageSrc, setImageSrc] = useState("/mountains.jpeg");
  const [processedImageSrc, setProcessedImageSrc] = useState(null);
  const [outlineImageSrc, setOutlineImageSrc] = useState(null);
  const [dominantColors, setDominantColors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [blobCenters, setBlobCenters] = useState([]);
  const [numColors, setNumColors] = useState(5);
  const [minBlobSize, setMinBlobSize] = useState(100);
  const [minBlobThickness, setMinBlobThickness] = useState(3);
  const [blurRadius, setBlurRadius] = useState(2);
  const [blurType, setBlurType] = useState("gaussian");

  const originalImageRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      originalImageRef.current = img;
      if (typeof window.initializeImageProcessor === "function") {
        window.initializeImageProcessor(img);
      }
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const resizedBlob = await resizeImage(
          file,
          MIN_IMAGE_SIZE,
          MAX_IMAGE_SIZE
        );
        const reader = new FileReader();
        reader.onload = (event) => {
          setImageSrc(event.target.result);
          setProcessedImageSrc(null);
          setOutlineImageSrc(null);
        };
        reader.readAsDataURL(resizedBlob);
      } catch (error) {
        console.error("Error resizing image:", error);
      }
    }
  };

  const handleProcessClick = useCallback(() => {
    if (typeof window.processImage === "function" && originalImageRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = originalImageRef.current.width;
      canvas.height = originalImageRef.current.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(originalImageRef.current, 0, 0);

      const result = window.processImage(
        canvas,
        numColors,
        minBlobSize,
        minBlobThickness,
        blurRadius,
        blurType
      );
      setProcessedImageSrc(result.processedImageDataUrl);
      setOutlineImageSrc(result.outlineImageDataUrl);
      setDominantColors(result.colors);
      setBlobCenters(result.blobCenters);
      setIsModalOpen(true);
    } else {
      console.error(
        "processImage function not found or original image not loaded"
      );
    }
  }, [numColors, minBlobSize, minBlobThickness, blurRadius, blurType]);

  const toggleImage = () => {
    setShowOutline(!showOutline);
  };

  const toggleButton = (
    <button onClick={toggleImage} className="toggle-outline-btn">
      {showOutline ? "Show Processed" : "Show Outline"}
    </button>
  );

  return (
    <Layout>
      <div className="content">
        <ProcessingSettings
          numColors={numColors}
          setNumColors={setNumColors}
          minBlobSize={minBlobSize}
          setMinBlobSize={setMinBlobSize}
          minBlobThickness={minBlobThickness}
          setMinBlobThickness={setMinBlobThickness}
          blurRadius={blurRadius}
          setBlurRadius={setBlurRadius}
          blurType={blurType}
          setBlurType={setBlurType}
          handleProcessClick={handleProcessClick}
        />
        <ImageUpload
          imageSrc={imageSrc}
          handleImageUpload={handleImageUpload}
        />
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Processed Image"
        toggleButton={toggleButton}
      >
        <ProcessedImageModal
          dominantColors={dominantColors}
          processedImageSrc={processedImageSrc}
          outlineImageSrc={outlineImageSrc}
          showOutline={showOutline}
          blobCenters={blobCenters}
        />
      </Modal>
    </Layout>
  );
}
