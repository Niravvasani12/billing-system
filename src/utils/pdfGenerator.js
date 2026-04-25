import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const generatePdf = async (billNo, options = {}) => {
  const elementId = options.elementId || "bill-pdf";
  const containerSelector = options.containerSelector || ".pdf-only";
  const fileNamePrefix = options.fileNamePrefix || "Invoice";
  const singlePage = options.singlePage === true;

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
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
      compress: true
    });

    const pageHeight = 297;
    const pageWidth = 210;
    const widthRatio = pageWidth / canvas.width;
    const heightRatio = pageHeight / canvas.height;
    const fitRatio = singlePage ? Math.min(widthRatio, heightRatio) : widthRatio;
    const imgWidth = canvas.width * fitRatio;
    const imgHeight = canvas.height * fitRatio;

    if (singlePage) {
      const x = (pageWidth - imgWidth) / 2;
      const y = 0;
      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight, undefined, "FAST");
    } else {
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
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
