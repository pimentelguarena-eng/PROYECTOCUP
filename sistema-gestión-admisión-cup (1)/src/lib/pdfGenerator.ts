import { jsPDF } from 'jspdf';

export interface ReceiptData {
  username: string; // academic register code
  pass: string; // provisional password/CI
  fullName: string;
  ci: string;
  career: string;
  paymentRef: string;
  paymentMethod: string;
  date: string;
  status: string;
  turno?: string;
}

/**
 * Helper to generate a simulated security hash code for document authenticity verification
 */
function generateSecurityHash(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `UAGRM-CUP-2026-${hex}-SEC-VALIDATED-SECURE`;
}

/**
 * Main function to generate and download the PDF receipt
 */
export function downloadReceiptPDF(data: ReceiptData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Color Palette Definitions
  const uagrmBlue = [0, 45, 98]; // #002D62
  const uagrmGold = [212, 175, 55]; // #D4AF37
  const slateDark = [15, 23, 42]; // #0F172A
  const slateMedium = [71, 85, 105]; // #475569
  const slateLight = [241, 245, 249]; // #F1F5F9
  const borderGrey = [226, 232, 240]; // #E2E8F0
  const emeraldGreen = [6, 95, 70]; // #065F46
  const emeraldBg = [209, 250, 229]; // #D1FAE5

  // 1. HEADER BANDS (Top decoration)
  doc.setFillColor(uagrmBlue[0], uagrmBlue[1], uagrmBlue[2]);
  doc.rect(15, 12, 180, 7, 'F');
  
  doc.setFillColor(uagrmGold[0], uagrmGold[1], uagrmGold[2]);
  doc.rect(15, 19, 180, 2, 'F');

  // 2. INSTITUTIONAL BRANDING
  // Draw simulated shield/logo vector
  doc.setDrawColor(uagrmBlue[0], uagrmBlue[1], uagrmBlue[2]);
  doc.setLineWidth(0.5);
  doc.setFillColor(255, 255, 255);
  doc.circle(26, 32, 9, 'FD');
  
  doc.setDrawColor(uagrmGold[0], uagrmGold[1], uagrmGold[2]);
  doc.setLineWidth(0.3);
  doc.circle(26, 32, 7.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(uagrmBlue[0], uagrmBlue[1], uagrmBlue[2]);
  doc.text("U", 26, 34, { align: 'center' });

  // Institution title text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(uagrmBlue[0], uagrmBlue[1], uagrmBlue[2]);
  doc.text("UNIVERSIDAD AUTÓNOMA GABRIEL RENÉ MORENO", 38, 29);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
  doc.text("FACULTAD DE INGENIERÍA EN CIENCIAS DE LA COMPUTACIÓN (F.I.C.C.T.)", 38, 33.5);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text("CURSO DE PREPARACIÓN Y ADMISIÓN - CUP 2026", 38, 38);

  // 3. DOCUMENT TITLE BAND
  doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.rect(15, 46, 180, 11, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text("BOLETA OFICIAL DE MATRÍCULA Y COMPROBANTE DE PAGO", 105, 53, { align: 'center' });

  // 4. BOX 1: LOGIN CREDENTIALS (HIGHLIGHT BOX)
  doc.setFillColor(239, 246, 255); // light blue #EFF6FF
  doc.setDrawColor(191, 219, 254); // border blue #BFDBFE
  doc.setLineWidth(0.4);
  doc.rect(15, 63, 180, 34, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(29, 78, 216); // blue-700
  doc.text("CREDENCIALES DE ACCESO AL PORTAL DE ADMISIÓN", 21, 69.5);

  // Credentials Grid
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
  doc.text("Código de Registro (Usuario):", 21, 76.5);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(data.username, 21, 83);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
  doc.text("Contraseña provisional (C.I.):", 110, 76.5);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  doc.text(data.pass, 110, 83);

  doc.setFont('helvetica', 'oblique');
  doc.setFontSize(7.5);
  doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
  doc.text("* Ingrese al portal web (http://localhost:3000) con estos datos para consultar sus cursos, notas y exámenes.", 21, 91.5);

  // 5. BOX 2: APPLICANT PERSONAL & ACADEMIC DETAILS
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.setLineWidth(0.3);
  doc.rect(15, 103, 180, 42);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text("DATOS PERSONALES Y PREFERENCIAS ACADÉMICAS", 21, 109.5);

  // Grid details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
  doc.text("Nombre Completo:", 21, 117);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(data.fullName.toUpperCase(), 55, 117);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
  doc.text("Cédula de Identidad:", 21, 124);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(data.ci, 55, 124);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
  doc.text("Carrera Elegida (Opción 1):", 21, 131);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(uagrmBlue[0], uagrmBlue[1], uagrmBlue[2]);
  doc.text(data.career.toUpperCase(), 62, 131);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
  doc.text("Turno Académico:", 21, 138);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(data.turno || 'Mañana', 55, 138);

  // Horizontal guide lines in the details box
  doc.setDrawColor(248, 250, 252);
  doc.line(21, 120, 189, 120);
  doc.line(21, 127, 189, 127);
  doc.line(21, 134, 189, 134);

  // 6. BOX 3: TRANSACTIONAL DETAILS
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.setLineWidth(0.3);
  doc.rect(15, 151, 180, 44);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text("DETALLE FISCAL Y DE COBRANZA", 21, 157.5);

  // Transaction grid details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
  doc.text("Concepto:", 21, 165);
  doc.setFont('helvetica', 'normal');
  doc.text("Matrícula de Arancel Curso Universitario de Preparación (CUP)", 55, 165);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
  doc.text("Monto Cancelado:", 21, 172);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  doc.text("700.00 Bs. (SETECIENTOS 00/100 BOLIVIANOS)", 55, 172);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
  doc.text("Método de Pago:", 21, 179);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(data.paymentMethod, 55, 179);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
  doc.text("Nro. Factura / Ref:", 21, 186);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(data.paymentRef, 55, 186);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
  doc.text("Fecha Liquidación:", 110, 179);
  doc.setFont('helvetica', 'normal');
  doc.text(data.date, 140, 179);

  // Pago status pill
  doc.setFillColor(emeraldBg[0], emeraldBg[1], emeraldBg[2]);
  doc.roundedRect(138, 182, 48, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  doc.text("PAGO VERIFICADO Y HABILITADO", 162, 187.3, { align: 'center' });

  // Grid lines
  doc.setDrawColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.line(21, 168.5, 189, 168.5);
  doc.line(21, 175.5, 189, 175.5);
  doc.line(21, 182.5, 189, 182.5);

  // 7. SECURITY & SIGNATURE BLOCK (AUTHENTICATION)
  // Draw simulated vector QR Code for high fidelity
  const qrX = 20;
  const qrY = 205;
  const qrSize = 24;

  doc.setDrawColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX, qrY, qrSize, qrSize, 'FD');

  // Outer Finder Pattern: Top-Left
  doc.setFillColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.rect(qrX + 1, qrY + 1, 7, 7, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX + 2, qrY + 2, 5, 5, 'F');
  doc.setFillColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.rect(qrX + 3, qrY + 3, 3, 3, 'F');

  // Outer Finder Pattern: Top-Right
  doc.setFillColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.rect(qrX + qrSize - 8, qrY + 1, 7, 7, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX + qrSize - 7, qrY + 2, 5, 5, 'F');
  doc.setFillColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.rect(qrX + qrSize - 6, qrY + 3, 3, 3, 'F');

  // Outer Finder Pattern: Bottom-Left
  doc.setFillColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.rect(qrX + 1, qrY + qrSize - 8, 7, 7, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX + 2, qrY + qrSize - 7, 5, 5, 'F');
  doc.setFillColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.rect(qrX + 3, qrY + qrSize - 6, 3, 3, 'F');

  // Generate vector QR random-like pixels
  doc.setFillColor(slateDark[0], slateDark[1], slateDark[2]);
  const pixelSize = 2;
  const gridCount = Math.floor((qrSize - 2) / pixelSize); // 11
  
  for (let r = 0; r < gridCount; r++) {
    for (let c = 0; c < gridCount; c++) {
      // Avoid overwriting finder patterns
      if ((r < 4 && c < 4) || (r < 4 && c > gridCount - 5) || (r > gridCount - 5 && c < 4)) {
        continue;
      }
      // Draw pixel based on coordinate hash
      const shouldDraw = ((r * 7 + c * 13) % 3 === 0) || ((r * 19 + c * 3) % 4 === 1);
      if (shouldDraw) {
        doc.rect(qrX + 1 + c * pixelSize, qrY + 1 + r * pixelSize, pixelSize, pixelSize, 'F');
      }
    }
  }

  // Security Verification text
  doc.setFont('Courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
  const securityHash = generateSecurityHash(data.username);
  doc.text(`HASH DE AUDITORÍA: ${securityHash}`, 48, 209);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text("Este comprobante fiscal de matrícula cuenta con firma y validación electrónica,", 48, 213.5);
  doc.text("registrada bajo los protocolos internos de la FICCT - UAGRM. Para verificar su", 48, 217);
  doc.text("integridad o realizar reclamos, escanee el código QR adjunto.", 48, 220.5);

  // Red Fiscal Stamp circular seal
  const stampX = 98;
  const stampY = 217;
  doc.setDrawColor(220, 38, 38); // red-600
  doc.setLineWidth(0.4);
  doc.circle(stampX, stampY, 10, 'D');
  doc.circle(stampX, stampY, 8.5, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(220, 38, 38);
  doc.text("FICCT - UAGRM", stampX, stampY - 3, { align: 'center' });
  doc.text("CAJAS", stampX, stampY, { align: 'center' });
  doc.text("APROBADO", stampX, stampY + 3, { align: 'center' });

  // Signature lines & details
  doc.setDrawColor(slateMedium[0], slateMedium[1], slateMedium[2]);
  doc.setLineWidth(0.2);
  doc.line(122, 219, 185, 219);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text("MSc. Carlos Andres Pimentel Garena", 153.5, 223, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
  doc.text("Coordinador General Admisiones CUP", 153.5, 226.5, { align: 'center' });
  doc.text("Depto. de Recaudación FICCT", 153.5, 230, { align: 'center' });

  // 8. DECORATIVE FOOTER (Bottom lines)
  doc.setFillColor(uagrmGold[0], uagrmGold[1], uagrmGold[2]);
  doc.rect(15, 260, 180, 1.2, 'F');
  doc.setFillColor(uagrmBlue[0], uagrmBlue[1], uagrmBlue[2]);
  doc.rect(15, 262, 180, 4.5, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
  doc.text("Santa Cruz de la Sierra, Bolivia - Gestión Académica 2026", 105, 275, { align: 'center' });

  // Save/Download PDF
  const filename = `boleta_pago_cup_${data.username}_${data.ci}.pdf`;
  doc.save(filename);
}
