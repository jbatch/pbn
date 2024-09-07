import React, { useEffect, useState, useCallback } from "react";
import Layout from "../Layout";
import ImageUpload from "../components/ImageUpload";
import ProcessingSettings from "../components/ProcessingSettings";
import Modal from "../components/Modal";
import ProcessedImageModal from "../components/ProcessedImageModal";

const MAX_IMAGE_SIZE = 1200; // Maximum width or height in pixels

function resizeImage(file, maxSize) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

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
  const [numColors, setNumColors] = useState(5);
  const [minBlobSize, setMinBlobSize] = useState(100);
  const [minBlobThickness, setMinBlobThickness] = useState(3);
  const [blurRadius, setBlurRadius] = useState(2);
  const [blurType, setBlurType] = useState("gaussian");

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      if (typeof window.initializeImageProcessor === "function") {
        window.initializeImageProcessor(img);
      }
      // Create canvas and set its dimensions
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, img.width, img.height);
      document.body.appendChild(canvas);
      canvas.style.display = "none";
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const resizedBlob = await resizeImage(file, MAX_IMAGE_SIZE);
        const reader = new FileReader();
        reader.onload = (event) => {
          setImageSrc(event.target.result);
          setProcessedImageSrc(null);
        };
        reader.readAsDataURL(resizedBlob);
      } catch (error) {
        console.error("Error resizing image:", error);
      }
    }
  };

  const handleProcessClick = useCallback(() => {
    if (typeof window.processImage === "function") {
      const canvas = document.querySelector("canvas");
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
      setIsModalOpen(true);
    } else {
      console.error("processImage function not found");
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
          toggleImage={toggleImage}
        />
      </Modal>
    </Layout>
  );
}
