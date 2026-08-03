import { jsPDF } from 'jspdf';
import type { OrderItem } from '@/types';
import { BRAND } from '@/lib/constants';

export interface InvoiceData {
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: {
    full_name?: string;
    phone?: string;
    address_line: string;
    city: string;
    country: string;
    postal_code: string;
  };
  billingAddress: {
    address_line: string;
    city: string;
    country: string;
    postal_code: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  paymentMethod: string;
  notes?: string | null;
  createdAt: string;
}

const GOLD: [number, number, number] = [184, 155, 94];
const GOLD_LIGHT: [number, number, number] = [217, 192, 138];
const GOLD_DEEP: [number, number, number] = [154, 126, 66];
const BLACK: [number, number, number] = [28, 26, 23];
const CHARCOAL: [number, number, number] = [43, 40, 35];
const INK: [number, number, number] = [58, 54, 49];
const GRAY: [number, number, number] = [107, 100, 91];
const GRAY_LIGHT: [number, number, number] = [148, 139, 126];
const LINE: [number, number, number] = [221, 211, 194];
const LINE_SOFT: [number, number, number] = [233, 225, 210];
const CREAM: [number, number, number] = [250, 246, 239];
const CREAM_2: [number, number, number] = [243, 236, 224];
const WHITE: [number, number, number] = [255, 255, 255];
const EMERALD: [number, number, number] = [74, 122, 86];
const AMBER: [number, number, number] = [154, 126, 66];

function fmtMoney(amount: number): string {
  return 'Rs. ' + new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function isManualPayment(method: string): boolean {
  return method !== 'cod';
}

function loadImageDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 80;
      canvas.height = 80;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('no canvas ctx'));
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 80, 80);
      const ratio = Math.min(80 / img.width, 80 / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      ctx.drawImage(img, (80 - w) / 2, (80 - h) / 2, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('img load failed'));
    img.src = url;
  });
}

const LOGO_URL = `${window.location.origin}/image.svg`;

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(LOGO_URL);
    const svgText = await res.text();
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const w = img.width || 1536;
        const h = img.height || 1024;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas ctx'));
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(svgUrl);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        reject(new Error('logo load failed'));
      };
      img.src = svgUrl;
    });
    return dataUrl;
  } catch {
    return null;
  }
}

export async function generateInvoicePdf(data: InvoiceData): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;

  const [thumbnails, logoDataUrl] = await Promise.all([
    Promise.all(
      data.items.map(async (item) => {
        const url = (item as OrderItem & { image_url?: string | null }).image_url;
        if (!url) return null;
        try {
          return await loadImageDataUrl(url);
        } catch {
          return null;
        }
      }),
    ),
    loadLogoDataUrl(),
  ]);

  // ===================== TOP BORDER ACCENT =====================
  doc.setFillColor(...GOLD);
  doc.rect(0, 0, pageW, 5, 'F');

  // ===================== HEADER =====================
  const headerTop = 20;
  const headerH = 80;

  // Left: logo
  if (logoDataUrl) {
    const logoW = 140;
    const logoH = logoW * (1024 / 1536);
    const logoX = margin;
    const logoY = headerTop + (headerH - logoH) / 2;
    try {
      doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoW, logoH);
    } catch {
      doc.setFont('times', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(...GOLD_DEEP);
      doc.text(BRAND.name, margin, headerTop + headerH / 2);
    }
  } else {
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...GOLD_DEEP);
    doc.text(BRAND.name, margin, headerTop + headerH / 2);
  }

  // Right: invoice meta — well-spaced, no overlap
  const metaRightX = pageW - margin;
  const metaLeftX = metaRightX - 130;

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...GOLD_DEEP);
  doc.text('I N V O I C E', metaRightX, headerTop + 14, { align: 'right' });

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(metaLeftX, headerTop + 20, metaRightX, headerTop + 20);

  const metaY = headerTop + 34;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text('Invoice No.', metaLeftX, metaY);
  doc.text('Order No.', metaLeftX, metaY + 12);
  doc.text('Date', metaLeftX, metaY + 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text(`INV-${data.orderNumber}`, metaRightX, metaY, { align: 'right' });
  doc.text(data.orderNumber, metaRightX, metaY + 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GOLD_DEEP);
  doc.text(
    new Date(data.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }),
    metaRightX, metaY + 24, { align: 'right' },
  );

  let y = headerTop + headerH + 14;

  // ===================== CUSTOMER + SHIPPING =====================
  const colGap = 16;
  const colW = (contentW - colGap) / 2;
  const infoBoxH = 108;

  // Customer box (left)
  doc.setFillColor(...CREAM);
  doc.roundedRect(margin, y, colW, infoBoxH, 4, 4, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(margin, y, 3, infoBoxH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...GOLD_DEEP);
  doc.text('BILL TO', margin + 14, y + 18);

  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BLACK);
  doc.text(data.customerName, margin + 14, y + 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  let cy = y + 52;
  if (data.email) { doc.text(data.email, margin + 14, cy); cy += 13; }
  if (data.phone) { doc.text(data.phone, margin + 14, cy); cy += 13; }
  if (data.billingAddress.address_line) {
    doc.text(data.billingAddress.address_line, margin + 14, cy); cy += 13;
    doc.text(`${data.billingAddress.city}, ${data.billingAddress.postal_code}`, margin + 14, cy); cy += 13;
    doc.text(data.billingAddress.country, margin + 14, cy);
  }

  // Shipping box (right)
  const shipX = margin + colW + colGap;
  doc.setFillColor(...CREAM);
  doc.roundedRect(shipX, y, colW, infoBoxH, 4, 4, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(shipX, y, 3, infoBoxH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...GOLD_DEEP);
  doc.text('SHIP TO', shipX + 14, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text(data.shippingAddress.full_name || data.customerName, shipX + 14, y + 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  let sy = y + 52;
  doc.text(data.shippingAddress.address_line, shipX + 14, sy); sy += 13;
  doc.text(`${data.shippingAddress.city}, ${data.shippingAddress.postal_code}`, shipX + 14, sy); sy += 13;
  doc.text(data.shippingAddress.country, shipX + 14, sy); sy += 13;
  if (data.shippingAddress.phone) {
    doc.text(`Tel: ${data.shippingAddress.phone}`, shipX + 14, sy);
  }

  y += infoBoxH + 20;

  // ===================== ITEMS TABLE =====================
  const tableX = margin;
  const tableW = contentW;
  const colThumbW = 40;
  const colItemW = tableW * 0.40;
  const colQtyW = tableW * 0.12;
  const colPriceW = tableW * 0.21;
  const colLineTotalW = tableW * 0.21;

  // Table header
  doc.setFillColor(...BLACK);
  doc.roundedRect(tableX, y, tableW, 28, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...GOLD_LIGHT);
  doc.text('PRODUCT', tableX + colThumbW + 10, y + 18);
  doc.text('QTY', tableX + colItemW + colQtyW / 2, y + 18, { align: 'center' });
  doc.text('UNIT PRICE', tableX + colItemW + colQtyW + colPriceW / 2, y + 18, { align: 'center' });
  doc.text('TOTAL', tableX + tableW - 12, y + 18, { align: 'right' });

  y += 28;

  // Item rows
  const rowH = 42;
  data.items.forEach((item, i) => {
    const rowY = y + i * rowH;

    if (i % 2 === 0) {
      doc.setFillColor(...CREAM_2);
      doc.rect(tableX, rowY, tableW, rowH, 'F');
    }

    const thumbSize = 28;
    const thumbX = tableX + 8;
    const thumbY = rowY + (rowH - thumbSize) / 2;
    if (thumbnails[i]) {
      try {
        doc.addImage(thumbnails[i]!, 'JPEG', thumbX, thumbY, thumbSize, thumbSize);
      } catch {
        doc.setFillColor(...LINE_SOFT);
        doc.roundedRect(thumbX, thumbY, thumbSize, thumbSize, 2, 2, 'F');
      }
    } else {
      doc.setFillColor(...LINE_SOFT);
      doc.roundedRect(thumbX, thumbY, thumbSize, thumbSize, 2, 2, 'F');
    }

    const textX = thumbX + thumbSize + 10;
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BLACK);
    const name = item.name.length > 36 ? item.name.slice(0, 34) + '…' : item.name;
    doc.text(name, textX, rowY + 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(`${item.variant_label || `${item.volume_ml}ml`} · Eau de Parfum`, textX, rowY + 30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(String(item.quantity), tableX + colItemW + colQtyW / 2, rowY + rowH / 2 + 3, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(fmtMoney(item.price), tableX + colItemW + colQtyW + colPriceW / 2, rowY + rowH / 2 + 3, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BLACK);
    doc.text(fmtMoney(item.price * item.quantity), tableX + tableW - 12, rowY + rowH / 2 + 3, { align: 'right' });

    if (i < data.items.length - 1) {
      doc.setDrawColor(...LINE_SOFT);
      doc.setLineWidth(0.5);
      doc.line(tableX + 8, rowY + rowH, tableX + tableW - 8, rowY + rowH);
    }
  });

  y += data.items.length * rowH;

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1);
  doc.line(tableX, y, tableX + tableW, y);

  y += 20;

  // ===================== PAYMENT + TOTALS =====================
  const manual = isManualPayment(data.paymentMethod);
  const payW = tableW * 0.48;
  const totalsW = tableW * 0.48;
  const payX = tableX;
  const totalsX = tableX + tableW - totalsW;
  const gapBetween = tableW - payW - totalsW;

  // Payment info (left)
  const payH = 100;
  doc.setFillColor(...WHITE);
  doc.roundedRect(payX, y, payW, payH, 4, 4, 'F');
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.8);
  doc.roundedRect(payX, y, payW, payH, 4, 4, 'S');
  doc.setFillColor(...(manual ? EMERALD : AMBER));
  doc.rect(payX, y, 3, payH, 'F');

  let py = y + 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...GOLD_DEEP);
  doc.text('PAYMENT INFORMATION', payX + 14, py);

  py += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text(manual ? 'Manual Payment' : 'Cash on Delivery', payX + 14, py);

  py += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('Status:', payX + 14, py);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(manual ? EMERALD : AMBER));
  doc.text(manual ? 'Pending Verification' : 'Unpaid', payX + 70, py);

  py += 16;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('Amount Due:', payX + 14, py);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLACK);
  doc.text(fmtMoney(manual ? 0 : data.total), payX + 70, py);

  // Totals (right)
  let totalsContentH = 20 + 4 * 18 + 10 + 32;
  doc.setFillColor(...CREAM);
  doc.roundedRect(totalsX, y, totalsW, totalsContentH, 4, 4, 'F');

  let ty = y + 20;
  const addTotalLine = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 10 : 9);
    doc.setTextColor(...(bold ? BLACK : GRAY));
    doc.text(label, totalsX + 16, ty);
    doc.setTextColor(...(bold ? BLACK : INK));
    doc.text(value, totalsX + totalsW - 16, ty, { align: 'right' });
    ty += 18;
  };

  addTotalLine('Subtotal', fmtMoney(data.subtotal));
  if (data.discount > 0) addTotalLine('Discount', `- ${fmtMoney(data.discount)}`);
  addTotalLine('Shipping', data.shippingCost === 0 ? 'Free' : fmtMoney(data.shippingCost));
  if (data.tax > 0) addTotalLine('Tax', fmtMoney(data.tax));

  ty += 6;
  doc.setFillColor(...GOLD);
  doc.roundedRect(totalsX + 8, ty - 6, totalsW - 16, 30, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BLACK);
  doc.text('GRAND TOTAL', totalsX + 16, ty + 13);
  doc.text(fmtMoney(data.total), totalsX + totalsW - 16, ty + 13, { align: 'right' });

  y += Math.max(payH, totalsContentH) + 20;

  // ===================== NOTES =====================
  if (data.notes) {
    const splitNotes = doc.splitTextToSize(data.notes, contentW - 28);
    const notesH = Math.max(36, 20 + splitNotes.length * 12);
    doc.setFillColor(...CREAM_2);
    doc.roundedRect(margin, y, contentW, notesH, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...GOLD_DEEP);
    doc.text('ORDER NOTES', margin + 14, y + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text(splitNotes, margin + 14, y + 30);
    y += notesH + 16;
  }

  // ===================== THANK YOU BAR =====================
  const thankH = 52;
  doc.setFillColor(...BLACK);
  doc.roundedRect(margin, y, contentW, thankH, 4, 4, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(margin, y, contentW, 3, 'F');

  doc.setFont('times', 'italic');
  doc.setFontSize(15);
  doc.setTextColor(...GOLD_LIGHT);
  doc.text('Thank You', pageW / 2, y + 24, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 190);
  doc.text('Thank you for choosing Kalmat Fragrance — composed with intention.', pageW / 2, y + 40, { align: 'center' });

  // ===================== FOOTER =====================
  const footerY = pageH - 56;
  doc.setFillColor(...BLACK);
  doc.rect(0, footerY, pageW, 56, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, footerY, pageW, 2, 'F');

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...GOLD_LIGHT);
  doc.text(BRAND.name, pageW / 2, footerY + 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 150);
  doc.text(
    `${BRAND.email}   ·   ${BRAND.phone}   ·   ${BRAND.address}`,
    pageW / 2, footerY + 32, { align: 'center' },
  );
  doc.text(
    `© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.`,
    pageW / 2, footerY + 44, { align: 'center' },
  );

  return doc;
}

/** Synchronous fallback that skips thumbnail/logo loading. */
export function generateInvoicePdfSync(data: InvoiceData): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;

  doc.setFillColor(...GOLD);
  doc.rect(0, 0, pageW, 5, 'F');

  const headerTop = 20;
  const headerH = 80;

  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...GOLD_DEEP);
  doc.text(BRAND.name, margin, headerTop + headerH / 2);

  const metaRightX = pageW - margin;
  const metaLeftX = metaRightX - 130;

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...GOLD_DEEP);
  doc.text('I N V O I C E', metaRightX, headerTop + 14, { align: 'right' });

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(metaLeftX, headerTop + 20, metaRightX, headerTop + 20);

  const metaY = headerTop + 34;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text('Invoice No.', metaLeftX, metaY);
  doc.text('Order No.', metaLeftX, metaY + 12);
  doc.text('Date', metaLeftX, metaY + 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text(`INV-${data.orderNumber}`, metaRightX, metaY, { align: 'right' });
  doc.text(data.orderNumber, metaRightX, metaY + 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GOLD_DEEP);
  doc.text(
    new Date(data.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }),
    metaRightX, metaY + 24, { align: 'right' },
  );

  let y = headerTop + headerH + 14;
  const colGap = 16;
  const colW = (contentW - colGap) / 2;
  const infoBoxH = 108;

  doc.setFillColor(...CREAM);
  doc.roundedRect(margin, y, colW, infoBoxH, 4, 4, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(margin, y, 3, infoBoxH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...GOLD_DEEP);
  doc.text('BILL TO', margin + 14, y + 18);
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BLACK);
  doc.text(data.customerName, margin + 14, y + 36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  let cy = y + 52;
  if (data.email) { doc.text(data.email, margin + 14, cy); cy += 13; }
  if (data.phone) { doc.text(data.phone, margin + 14, cy); cy += 13; }
  if (data.billingAddress.address_line) {
    doc.text(data.billingAddress.address_line, margin + 14, cy); cy += 13;
    doc.text(`${data.billingAddress.city}, ${data.billingAddress.postal_code}`, margin + 14, cy); cy += 13;
    doc.text(data.billingAddress.country, margin + 14, cy);
  }

  const shipX = margin + colW + colGap;
  doc.setFillColor(...CREAM);
  doc.roundedRect(shipX, y, colW, infoBoxH, 4, 4, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(shipX, y, 3, infoBoxH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...GOLD_DEEP);
  doc.text('SHIP TO', shipX + 14, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text(data.shippingAddress.full_name || data.customerName, shipX + 14, y + 36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  let sy = y + 52;
  doc.text(data.shippingAddress.address_line, shipX + 14, sy); sy += 13;
  doc.text(`${data.shippingAddress.city}, ${data.shippingAddress.postal_code}`, shipX + 14, sy); sy += 13;
  doc.text(data.shippingAddress.country, shipX + 14, sy); sy += 13;
  if (data.shippingAddress.phone) { doc.text(`Tel: ${data.shippingAddress.phone}`, shipX + 14, sy); }

  y += infoBoxH + 20;

  const tableX = margin;
  const tableW = contentW;
  const colItemW = tableW * 0.52;
  const colQtyW = tableW * 0.12;
  const colPriceW = tableW * 0.18;
  const colLineTotalW = tableW * 0.18;

  doc.setFillColor(...BLACK);
  doc.roundedRect(tableX, y, tableW, 28, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...GOLD_LIGHT);
  doc.text('PRODUCT', tableX + 12, y + 18);
  doc.text('QTY', tableX + colItemW + colQtyW / 2, y + 18, { align: 'center' });
  doc.text('UNIT PRICE', tableX + colItemW + colQtyW + colPriceW / 2, y + 18, { align: 'center' });
  doc.text('TOTAL', tableX + tableW - 12, y + 18, { align: 'right' });
  y += 28;

  const rowH = 36;
  data.items.forEach((item, i) => {
    const rowY = y + i * rowH;
    if (i % 2 === 0) {
      doc.setFillColor(...CREAM_2);
      doc.rect(tableX, rowY, tableW, rowH, 'F');
    }
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BLACK);
    const name = item.name.length > 38 ? item.name.slice(0, 36) + '…' : item.name;
    doc.text(name, tableX + 12, rowY + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(`${item.variant_label || `${item.volume_ml}ml`} · Eau de Parfum`, tableX + 12, rowY + 28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(String(item.quantity), tableX + colItemW + colQtyW / 2, rowY + rowH / 2 + 3, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(fmtMoney(item.price), tableX + colItemW + colQtyW + colPriceW / 2, rowY + rowH / 2 + 3, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BLACK);
    doc.text(fmtMoney(item.price * item.quantity), tableX + tableW - 12, rowY + rowH / 2 + 3, { align: 'right' });
  });

  y += data.items.length * rowH + 8;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1);
  doc.line(tableX, y, tableX + tableW, y);
  y += 20;

  const manual = isManualPayment(data.paymentMethod);
  const payW = tableW * 0.48;
  const totalsW = tableW * 0.48;
  const payX = tableX;
  const totalsX = tableX + tableW - totalsW;

  const payH = 100;
  doc.setFillColor(...WHITE);
  doc.roundedRect(payX, y, payW, payH, 4, 4, 'F');
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.8);
  doc.roundedRect(payX, y, payW, payH, 4, 4, 'S');
  doc.setFillColor(...(manual ? EMERALD : AMBER));
  doc.rect(payX, y, 3, payH, 'F');
  let py = y + 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...GOLD_DEEP);
  doc.text('PAYMENT INFORMATION', payX + 14, py);
  py += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text(manual ? 'Manual Payment' : 'Cash on Delivery', payX + 14, py);
  py += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('Status:', payX + 14, py);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(manual ? EMERALD : AMBER));
  doc.text(manual ? 'Pending Verification' : 'Unpaid', payX + 70, py);
  py += 16;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('Amount Due:', payX + 14, py);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLACK);
  doc.text(fmtMoney(manual ? 0 : data.total), payX + 70, py);

  const totalsContentH = 20 + 4 * 18 + 10 + 32;
  doc.setFillColor(...CREAM);
  doc.roundedRect(totalsX, y, totalsW, totalsContentH, 4, 4, 'F');
  let ty = y + 20;
  const addTotalLine = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 10 : 9);
    doc.setTextColor(...(bold ? BLACK : GRAY));
    doc.text(label, totalsX + 16, ty);
    doc.setTextColor(...(bold ? BLACK : INK));
    doc.text(value, totalsX + totalsW - 16, ty, { align: 'right' });
    ty += 18;
  };
  addTotalLine('Subtotal', fmtMoney(data.subtotal));
  if (data.discount > 0) addTotalLine('Discount', `- ${fmtMoney(data.discount)}`);
  addTotalLine('Shipping', data.shippingCost === 0 ? 'Free' : fmtMoney(data.shippingCost));
  if (data.tax > 0) addTotalLine('Tax', fmtMoney(data.tax));
  ty += 6;
  doc.setFillColor(...GOLD);
  doc.roundedRect(totalsX + 8, ty - 6, totalsW - 16, 30, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BLACK);
  doc.text('GRAND TOTAL', totalsX + 16, ty + 13);
  doc.text(fmtMoney(data.total), totalsX + totalsW - 16, ty + 13, { align: 'right' });

  y += Math.max(payH, totalsContentH) + 20;

  if (data.notes) {
    const splitNotes = doc.splitTextToSize(data.notes, contentW - 28);
    const notesH = Math.max(36, 20 + splitNotes.length * 12);
    doc.setFillColor(...CREAM_2);
    doc.roundedRect(margin, y, contentW, notesH, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...GOLD_DEEP);
    doc.text('ORDER NOTES', margin + 14, y + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text(splitNotes, margin + 14, y + 30);
    y += notesH + 16;
  }

  const thankH = 52;
  doc.setFillColor(...BLACK);
  doc.roundedRect(margin, y, contentW, thankH, 4, 4, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(margin, y, contentW, 3, 'F');
  doc.setFont('times', 'italic');
  doc.setFontSize(15);
  doc.setTextColor(...GOLD_LIGHT);
  doc.text('Thank You', pageW / 2, y + 24, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 190);
  doc.text('Thank you for choosing Kalmat Fragrance — composed with intention.', pageW / 2, y + 40, { align: 'center' });

  const footerY = pageH - 56;
  doc.setFillColor(...BLACK);
  doc.rect(0, footerY, pageW, 56, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, footerY, pageW, 2, 'F');
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...GOLD_LIGHT);
  doc.text(BRAND.name, pageW / 2, footerY + 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 150);
  doc.text(`${BRAND.email}   ·   ${BRAND.phone}   ·   ${BRAND.address}`, pageW / 2, footerY + 32, { align: 'center' });
  doc.text(`© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.`, pageW / 2, footerY + 44, { align: 'center' });

  return doc;
}
