(function (window) {
  let originalImageData = null;

  function initializeImageProcessor(image) {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(image, 0, 0);
    originalImageData = tempCtx.getImageData(0, 0, image.width, image.height);
    console.log("Image processor initialized with image:", image.src);
  }

  function processImage(
    canvas,
    numColors,
    minBlobSize,
    minBlobThickness,
    blurRadius,
    blurType
  ) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let processedImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    if (blurType === "gaussian") {
      processedImageData = applyGaussianBlur(processedImageData, blurRadius);
    } else if (blurType === "bilateral") {
      processedImageData = applyBilateralFilter(
        processedImageData,
        blurRadius,
        30,
        30
      );
    }

    const dominantColors = findDominantColors(processedImageData, numColors);

    for (let i = 0; i < processedImageData.data.length; i += 4) {
      const pixel = [
        processedImageData.data[i],
        processedImageData.data[i + 1],
        processedImageData.data[i + 2],
      ];
      const closestColor = findClosestColor(pixel, dominantColors);

      processedImageData.data[i] = closestColor[0];
      processedImageData.data[i + 1] = closestColor[1];
      processedImageData.data[i + 2] = closestColor[2];
    }

    mergeProblematicBlobs(processedImageData, minBlobSize, minBlobThickness);

    ctx.putImageData(processedImageData, 0, 0);

    // Convert dominantColors to hex format
    const hexColors = dominantColors.map((color) => {
      return `#${color[0].toString(16).padStart(2, "0")}${color[1]
        .toString(16)
        .padStart(2, "0")}${color[2].toString(16).padStart(2, "0")}`;
    });

    // Generate the outline image
    const outlineImageData = generateOutlineImage(processedImageData);

    // Convert processedImageData back to canvas
    ctx.putImageData(processedImageData, 0, 0);
    const processedDataUrl = canvas.toDataURL();

    // Convert outlineImageData to canvas
    ctx.putImageData(outlineImageData, 0, 0);
    const outlineDataUrl = canvas.toDataURL();

    return {
      processedImageDataUrl: processedDataUrl,
      outlineImageDataUrl: outlineDataUrl,
      colors: hexColors,
    };
  }

  function generateOutlineImage(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const outlineData = new ImageData(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const currentColor = getColorAt(imageData, x, y);
        let isEdge = false;

        // Check neighboring pixels
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const neighborColor = getColorAt(imageData, nx, ny);
              if (!colorEquals(currentColor, neighborColor)) {
                isEdge = true;
                break;
              }
            }
          }
          if (isEdge) break;
        }

        const idx = (y * width + x) * 4;
        if (isEdge) {
          outlineData.data[idx] = 0;
          outlineData.data[idx + 1] = 0;
          outlineData.data[idx + 2] = 0;
          outlineData.data[idx + 3] = 255;
        } else {
          outlineData.data[idx] = 255;
          outlineData.data[idx + 1] = 255;
          outlineData.data[idx + 2] = 255;
          outlineData.data[idx + 3] = 255;
        }
      }
    }

    return outlineData;
  }

  function findDominantColors(imageData, numColors) {
    const pixels = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
      pixels.push([
        imageData.data[i],
        imageData.data[i + 1],
        imageData.data[i + 2],
      ]);
    }

    // Use deterministic initialization
    let centroids = [];
    for (let i = 0; i < numColors; i++) {
      centroids.push(pixels[Math.floor(pixels.length / numColors) * i]);
    }

    const maxIterations = 20;
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const clusters = new Array(numColors).fill().map(() => []);

      for (const pixel of pixels) {
        let minDistance = Infinity;
        let closestCentroidIndex = 0;

        for (let i = 0; i < centroids.length; i++) {
          const distance = colorDistance(pixel, centroids[i]);
          if (distance < minDistance) {
            minDistance = distance;
            closestCentroidIndex = i;
          }
        }

        clusters[closestCentroidIndex].push(pixel);
      }

      const newCentroids = clusters.map((cluster) => {
        if (cluster.length === 0) return [0, 0, 0];
        const sum = cluster.reduce(
          (acc, pixel) => [
            acc[0] + pixel[0],
            acc[1] + pixel[1],
            acc[2] + pixel[2],
          ],
          [0, 0, 0]
        );
        return sum.map((v) => Math.round(v / cluster.length));
      });

      if (centroidsEqual(centroids, newCentroids)) break;
      centroids = newCentroids;
    }

    return centroids;
  }

  function centroidsEqual(c1, c2) {
    return c1.every((cent, i) => cent.every((val, j) => val === c2[i][j]));
  }

  function mergeProblematicBlobs(imageData, minBlobSize, minBlobThickness) {
    const width = imageData.width;
    const height = imageData.height;
    const visited = new Array(width * height).fill(false);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!visited[y * width + x]) {
          const blob = floodFill(imageData, x, y, visited);
          const shapeAnalysis = analyzeBlobShape(blob, width, height);

          if (
            shapeAnalysis.area < minBlobSize ||
            shapeAnalysis.thickness < minBlobThickness
          ) {
            const surroundingColors = getSurroundingColors(
              imageData,
              blob,
              width,
              height
            );
            const dominantColor =
              findDominantSurroundingColor(surroundingColors);

            for (const [bx, by] of blob) {
              setColorAt(imageData, bx, by, dominantColor);
            }
          }
        }
      }
    }
  }

  function floodFill(imageData, startX, startY, visited) {
    const width = imageData.width;
    const height = imageData.height;
    const startColor = getColorAt(imageData, startX, startY);
    const blob = [];
    const stack = [[startX, startY]];

    while (stack.length > 0) {
      const [x, y] = stack.pop();
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (visited[y * width + x]) continue;
      if (!colorEquals(getColorAt(imageData, x, y), startColor)) continue;

      visited[y * width + x] = true;
      blob.push([x, y]);

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    return blob;
  }

  function analyzeBlobShape(blob, width, height) {
    let minX = width,
      maxX = 0,
      minY = height,
      maxY = 0;
    for (const [x, y] of blob) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }

    const blobWidth = maxX - minX + 1;
    const blobHeight = maxY - minY + 1;
    const aspectRatio =
      Math.max(blobWidth, blobHeight) / Math.min(blobWidth, blobHeight);
    const thickness = blob.length / Math.max(blobWidth, blobHeight);

    return {
      area: blob.length,
      aspectRatio: aspectRatio,
      thickness: thickness,
    };
  }

  function getSurroundingColors(imageData, blob, width, height) {
    const surroundingColors = new Map();
    const dx = [-1, 1, 0, 0];
    const dy = [0, 0, -1, 1];

    for (const [x, y] of blob) {
      for (let i = 0; i < 4; i++) {
        const nx = x + dx[i];
        const ny = y + dy[i];
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const neighborColor = getColorAt(imageData, nx, ny);
          if (!blob.some(([bx, by]) => bx === nx && by === ny)) {
            const key = neighborColor.join(",");
            surroundingColors.set(key, (surroundingColors.get(key) || 0) + 1);
          }
        }
      }
    }

    return surroundingColors;
  }

  function findDominantSurroundingColor(surroundingColors) {
    let dominantColor = null;
    let maxCount = 0;

    for (const [colorKey, count] of surroundingColors.entries()) {
      if (count > maxCount) {
        maxCount = count;
        dominantColor = colorKey.split(",").map(Number);
      }
    }

    return dominantColor;
  }

  function applyGaussianBlur(imageData, radius) {
    const width = imageData.width;
    const height = imageData.height;
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src);

    const kernel = generateGaussianKernel(radius);

    // Horizontal pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0;
        let weightSum = 0;

        for (let i = -radius; i <= radius; i++) {
          const px = Math.min(width - 1, Math.max(0, x + i));
          const weight = kernel[i + radius];
          const idx = (y * width + px) * 4;
          r += src[idx] * weight;
          g += src[idx + 1] * weight;
          b += src[idx + 2] * weight;
          weightSum += weight;
        }

        const outIdx = (y * width + x) * 4;
        dst[outIdx] = r / weightSum;
        dst[outIdx + 1] = g / weightSum;
        dst[outIdx + 2] = b / weightSum;
        dst[outIdx + 3] = src[outIdx + 3];
      }
    }

    // Vertical pass
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let r = 0,
          g = 0,
          b = 0;
        let weightSum = 0;

        for (let i = -radius; i <= radius; i++) {
          const py = Math.min(height - 1, Math.max(0, y + i));
          const weight = kernel[i + radius];
          const idx = (py * width + x) * 4;
          r += dst[idx] * weight;
          g += dst[idx + 1] * weight;
          b += dst[idx + 2] * weight;
          weightSum += weight;
        }

        const outIdx = (y * width + x) * 4;
        src[outIdx] = r / weightSum;
        src[outIdx + 1] = g / weightSum;
        src[outIdx + 2] = b / weightSum;
      }
    }

    return imageData;
  }

  function generateGaussianKernel(radius) {
    const kernel = new Array(2 * radius + 1);
    const sigma = radius / 3;
    let sum = 0;

    for (let i = -radius; i <= radius; i++) {
      kernel[i + radius] = Math.exp(-(i * i) / (2 * sigma * sigma));
      sum += kernel[i + radius];
    }

    // Normalize the kernel
    for (let i = 0; i < kernel.length; i++) {
      kernel[i] /= sum;
    }

    return kernel;
  }

  function applyBilateralFilter(imageData, radius, sigmaSpace, sigmaColor) {
    const width = imageData.width;
    const height = imageData.height;
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0;
        let weightSum = 0;

        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const nx = Math.min(width - 1, Math.max(0, x + kx));
            const ny = Math.min(height - 1, Math.max(0, y + ky));

            const idx = (y * width + x) * 4;
            const nidx = (ny * width + nx) * 4;

            const spatialDist = Math.sqrt(kx * kx + ky * ky);
            const colorDist = Math.sqrt(
              Math.pow(src[idx] - src[nidx], 2) +
                Math.pow(src[idx + 1] - src[nidx + 1], 2) +
                Math.pow(src[idx + 2] - src[nidx + 2], 2)
            );

            const weight =
              Math.exp(-spatialDist / (2 * sigmaSpace * sigmaSpace)) *
              Math.exp(-colorDist / (2 * sigmaColor * sigmaColor));

            r += src[nidx] * weight;
            g += src[nidx + 1] * weight;
            b += src[nidx + 2] * weight;
            weightSum += weight;
          }
        }

        const outIdx = (y * width + x) * 4;
        dst[outIdx] = r / weightSum;
        dst[outIdx + 1] = g / weightSum;
        dst[outIdx + 2] = b / weightSum;
        dst[outIdx + 3] = src[outIdx + 3];
      }
    }

    imageData.data.set(dst);
    return imageData;
  }

  function colorDistance(color1, color2) {
    return Math.sqrt(
      Math.pow(color1[0] - color2[0], 2) +
        Math.pow(color1[1] - color2[1], 2) +
        Math.pow(color1[2] - color2[2], 2)
    );
  }

  function findClosestColor(pixel, colors) {
    return colors.reduce((closest, color) =>
      colorDistance(pixel, color) < colorDistance(pixel, closest)
        ? color
        : closest
    );
  }

  function getColorAt(imageData, x, y) {
    const idx = (y * imageData.width + x) * 4;
    return [
      imageData.data[idx],
      imageData.data[idx + 1],
      imageData.data[idx + 2],
    ];
  }

  function setColorAt(imageData, x, y, color) {
    const idx = (y * imageData.width + x) * 4;
    imageData.data[idx] = color[0];
    imageData.data[idx + 1] = color[1];
    imageData.data[idx + 2] = color[2];
  }

  function colorEquals(c1, c2) {
    return c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2];
  }

  // Expose functions globally
  window.initializeImageProcessor = initializeImageProcessor;
  window.processImage = processImage;
})(window);
