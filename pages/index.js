import { useEffect, useState } from "react";
import Head from "next/head";

export default function Home() {
  const [imageSrc, setImageSrc] = useState("/mountains.jpeg");

  useEffect(() => {
    // Initialize the image processor with the placeholder image
    const img = new Image();
    img.onload = () => {
      if (typeof window.initializeImageProcessor === "function") {
        window.initializeImageProcessor(img);
      }
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessClick = () => {
    const numColors = parseInt(document.getElementById("numColors").value);
    const minBlobSize = parseInt(document.getElementById("minBlobSize").value);
    const minBlobThickness = parseFloat(
      document.getElementById("minBlobThickness").value
    );
    const blurRadius = parseInt(document.getElementById("blurRadius").value);
    const blurType = document.getElementById("blurType").value;
    if (typeof window.processImage === "function") {
      window.processImage(
        numColors,
        minBlobSize,
        minBlobThickness,
        blurRadius,
        blurType
      );
    } else {
      console.error("processImage function not found");
    }
  };

  return (
    <div>
      <Head>
        <title>Image Color Processor</title>
        <meta
          name="description"
          content="Process images to find dominant colors"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Image Color Processor</h1>
        <input
          type="file"
          id="imageUpload"
          accept="image/*"
          onChange={handleImageUpload}
        />
        <br />
        <br />
        <label htmlFor="numColors">Number of dominant colors:</label>
        <input type="number" id="numColors" defaultValue="5" min="1" max="16" />
        <br />
        <br />
        <label htmlFor="minBlobSize">Minimum blob size (in pixels):</label>
        <input type="number" id="minBlobSize" defaultValue="100" min="1" />
        <br />
        <br />
        <label htmlFor="minBlobThickness">Minimum blob thickness:</label>
        <input
          type="number"
          id="minBlobThickness"
          defaultValue="3"
          min="1"
          step="0.1"
        />
        <br />
        <br />
        <label htmlFor="blurRadius">Blur radius:</label>
        <input
          type="number"
          id="blurRadius"
          defaultValue="2"
          min="0"
          max="10"
          step="1"
        />
        <br />
        <br />
        <label htmlFor="blurType">Blur type:</label>
        <select id="blurType">
          <option value="gaussian">Gaussian Blur</option>
          <option value="bilateral">Bilateral Filter (Edge-Preserving)</option>
        </select>
        <br />
        <br />
        <button onClick={handleProcessClick}>Process Image</button>
        <br />
        <br />
        <canvas id="outputCanvas" style={{ display: "none" }}></canvas>
        <img
          id="outputImage"
          src={imageSrc}
          alt="Processed Image"
          style={{ maxWidth: "100%", height: "auto" }}
        />
      </main>
    </div>
  );
}
