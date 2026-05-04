import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const generatePdf = async (billNo, options = {}) => {
  const elementId = options.elementId || "bill-pdf";
  const containerSelector = options.containerSelector || ".pdf-only";
  const fileNamePrefix = options.fileNamePrefix || "Invoice";
  const singlePage = options.singlePage === true;
  const renderScale = options.renderScale || 2.6;
  const targetMinBytes = options.targetMinBytes || 2 * 1024 * 1024;
  const targetMaxBytes = options.targetMaxBytes || 3 * 1024 * 1024;

  const element = document.getElementById(elementId);
  const pdfContainer = document.querySelector(containerSelector);
  if (!element || !pdfContainer) return;

  const previousStyle = {
    display: pdfContainer.style.display,
    position: pdfContainer.style.position,
    left: pdfContainer.style.left,
    top: pdfContainer.style.top,
    opacity: pdfContainer.style.opacity,
    pointerEvents: pdfContainer.style.pointerEvents
  };

  try {
    pdfContainer.style.display = "block";
    pdfContainer.style.position = "fixed";
    pdfContainer.style.left = "-100000px";
    pdfContainer.style.top = "0";
    pdfContainer.style.opacity = "1";
    pdfContainer.style.pointerEvents = "none";

    await new Promise((resolve) => setTimeout(resolve, 180));

    const canvas = await html2canvas(element, {
      scale: renderScale,
      useCORS: true,
      imageTimeout: 0,
      removeContainer: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      backgroundColor: "#ffffff",
      logging: false
    });

    const estimateSizeInBytes = (dataUrl) =>
      Math.ceil((dataUrl.length - (dataUrl.indexOf(",") + 1)) * 0.75);

    const buildJpeg = (sourceCanvas, quality) => sourceCanvas.toDataURL("image/jpeg", quality);
    const downscaleCanvas = (sourceCanvas, factor) => {
      const resized = document.createElement("canvas");
      resized.width = Math.max(1, Math.floor(sourceCanvas.width * factor));
      resized.height = Math.max(1, Math.floor(sourceCanvas.height * factor));
      const ctx = resized.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(sourceCanvas, 0, 0, resized.width, resized.height);
      return resized;
    };

    let sourceCanvas = canvas;
    let quality = 0.92;
    let imgData = buildJpeg(sourceCanvas, quality);
    let imgBytes = estimateSizeInBytes(imgData);

    while (imgBytes > targetMaxBytes && quality > 0.68) {
      quality -= 0.04;
      imgData = buildJpeg(sourceCanvas, quality);
      imgBytes = estimateSizeInBytes(imgData);
    }

    if (imgBytes > targetMaxBytes) {
      sourceCanvas = downscaleCanvas(sourceCanvas, 0.9);
      quality = 0.88;
      imgData = buildJpeg(sourceCanvas, quality);
      imgBytes = estimateSizeInBytes(imgData);
      while (imgBytes > targetMaxBytes && quality > 0.66) {
        quality -= 0.04;
        imgData = buildJpeg(sourceCanvas, quality);
        imgBytes = estimateSizeInBytes(imgData);
      }
    }

    // If file is smaller than 2MB, increase quality for best clarity while staying under 3MB.
    while (imgBytes < targetMinBytes && quality < 0.98) {
      const candidateQuality = Math.min(0.98, quality + 0.02);
      const candidate = buildJpeg(sourceCanvas, candidateQuality);
      const candidateBytes = estimateSizeInBytes(candidate);
      if (candidateBytes > targetMaxBytes) break;
      quality = candidateQuality;
      imgData = candidate;
      imgBytes = candidateBytes;
    }

    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
      compress: true,
      precision: 16
    });

    const pageHeight = 297;
    const pageWidth = 210;
    const widthRatio = pageWidth / sourceCanvas.width;
    const heightRatio = pageHeight / sourceCanvas.height;
    const fitRatio = singlePage ? Math.min(widthRatio, heightRatio) : widthRatio;
    const imgWidth = sourceCanvas.width * fitRatio;
    const imgHeight = sourceCanvas.height * fitRatio;

    if (singlePage) {
      const x = (pageWidth - imgWidth) / 2;
      const y = 0;
      pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight, undefined, "FAST");
    } else {
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }
    }

    pdf.save(`${fileNamePrefix}_${billNo || "Bill"}.pdf`);
  } finally {
    pdfContainer.style.display = previousStyle.display;
    pdfContainer.style.position = previousStyle.position;
    pdfContainer.style.left = previousStyle.left;
    pdfContainer.style.top = previousStyle.top;
    pdfContainer.style.opacity = previousStyle.opacity;
    pdfContainer.style.pointerEvents = previousStyle.pointerEvents;
  }
};
