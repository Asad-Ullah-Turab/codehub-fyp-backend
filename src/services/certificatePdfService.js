import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CertificatePdfService {
  /**
   * Generate a professional certificate PDF
   * @param {Object} certificateData - Certificate data object
   * @param {Object} certificateData.user - User object with name, email
   * @param {Object} certificateData.course - Course object with title
   * @param {string} certificateData.certificateNumber - Unique certificate number
   * @param {number} certificateData.finalScore - Final score achieved
   * @param {Date} certificateData.issuedDate - Date issued
   * @param {string} certificateData.approvedBy - Admin name (optional)
   * @returns {Promise<Buffer>} PDF buffer
   */
  static async generateCertificate(certificateData) {
    return new Promise((resolve, reject) => {
      try {
        const {
          user,
          course,
          certificateNumber,
          finalScore,
          averageScore,
          quizzesAttempted,
          issuedDate,
        } = certificateData;

        // Create PDF document in landscape orientation
        const doc = new PDFDocument({
          size: "A4",
          landscape: true,
          margin: 0,
          bufferPages: true,
        });

        const buffer = [];

        doc.on("data", (chunk) => buffer.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(buffer)));
        doc.on("error", reject);

        // Page dimensions (landscape)
        const pageWidth = 842; // A4 landscape width in points
        const pageHeight = 595; // A4 landscape height in points

        // ===== BACKGROUND & BORDERS =====
        // Elegant gradient background (simulated with color)
        import PDFDocument from "pdfkit";
        import fs from "fs";
        import path from "path";
        import { fileURLToPath } from "url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        class CertificatePdfService {
          static async generateCertificate(certificateData) {
            return new Promise((resolve, reject) => {
              try {
                const {
                  user,
                  course,
                  certificateNumber,
                  finalScore,
                  averageScore,
                  quizzesAttempted,
                  issuedDate,
                } = certificateData;

                const doc = new PDFDocument({
                  size: "A4",
                  landscape: true,
                  margin: 0,
                  bufferPages: true,
                });

                const buffer = [];
                doc.on("data", (chunk) => buffer.push(chunk));
                doc.on("end", () => resolve(Buffer.concat(buffer)));
                doc.on("error", reject);

                const pageWidth = 842;
                const pageHeight = 595;

                doc.rect(0, 0, pageWidth, pageHeight).fill("#fafafa");

                doc
                  .strokeColor("#d4af37")
                  .lineWidth(8)
                  .rect(20, 20, pageWidth - 40, pageHeight - 40)
                  .stroke();

                doc
                  .strokeColor("#c0c0c0")
                  .lineWidth(2)
                  .rect(35, 35, pageWidth - 70, pageHeight - 70)
                  .stroke();

                const topY = 50;
                doc.fillColor("#d4af37").fontSize(18).text("★", 60, topY);
                doc.text("★", pageWidth - 100, topY);

                doc
                  .fillColor("#1a3a52")
                  .fontSize(44)
                  .font("Helvetica-Bold")
                  .text("CERTIFICATE OF ACHIEVEMENT", 50, 85, {
                    align: "center",
                    width: pageWidth - 100,
                  });

                doc
                  .fillColor("#d4af37")
                  .fontSize(12)
                  .font("Helvetica-Oblique")
                  .text("This Certificate is Proudly Presented to", 50, 150, {
                    align: "center",
                    width: pageWidth - 100,
                  });

                doc
                  .fillColor("#1a3a52")
                  .fontSize(32)
                  .font("Helvetica-Bold")
                  .text(user.name.toUpperCase(), 50, 180, {
                    align: "center",
                    width: pageWidth - 100,
                  });

                doc
                  .fillColor("#333333")
                  .fontSize(11)
                  .font("Helvetica")
                  .text(
                    "For successfully completing and demonstrating mastery of",
                    50,
                    230,
                    { align: "center", width: pageWidth - 100 },
                  );

                doc
                  .fillColor("#d4af37")
                  .fontSize(24)
                  .font("Helvetica-Bold")
                  .text(course.title, 50, 255, {
                    align: "center",
                    width: pageWidth - 100,
                  });

                const detailsStartY = 310;
                const leftCol = 100;
                const rightCol = pageWidth / 2 + 50;
                const labelFontSize = 9;
                const valueFontSize = 12;

                doc
                  .fillColor("#666666")
                  .fontSize(labelFontSize)
                  .font("Helvetica")
                  .text("Final Score", leftCol, detailsStartY);
                doc
                  .fillColor("#27ae60")
                  .fontSize(valueFontSize)
                  .font("Helvetica-Bold")
                  .text(`${finalScore}%`, leftCol, detailsStartY + 14);

                doc
                  .fillColor("#666666")
                  .fontSize(labelFontSize)
                  .font("Helvetica")
                  .text("Average Quiz Score", leftCol, detailsStartY + 38);
                doc
                  .fillColor("#2980b9")
                  .fontSize(valueFontSize)
                  .font("Helvetica-Bold")
                  .text(`${averageScore || finalScore}%`, leftCol, detailsStartY + 52);

                doc
                  .fillColor("#666666")
                  .fontSize(labelFontSize)
                  .font("Helvetica")
                  .text("Quizzes Completed", leftCol, detailsStartY + 76);
                doc
                  .fillColor("#8e44ad")
                  .fontSize(valueFontSize)
                  .font("Helvetica-Bold")
                  .text(`${quizzesAttempted || 1} Assessments`, leftCol, detailsStartY + 90);

                doc
                  .fillColor("#666666")
                  .fontSize(labelFontSize)
                  .font("Helvetica")
                  .text("Certificate ID", rightCol, detailsStartY);
                doc
                  .fillColor("#1a3a52")
                  .fontSize(valueFontSize)
                  .font("Helvetica-Bold")
                  .text(certificateNumber, rightCol, detailsStartY + 14);

                const issueDate = issuedDate
                  ? new Date(issuedDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    });

                doc
                  .fillColor("#666666")
                  .fontSize(labelFontSize)
                  .font("Helvetica")
                  .text("Date Issued", rightCol, detailsStartY + 38);
                doc
                  .fillColor("#1a3a52")
                  .fontSize(valueFontSize)
                  .font("Helvetica-Bold")
                  .text(issueDate, rightCol, detailsStartY + 52);

                doc
                  .fillColor("#666666")
                  .fontSize(labelFontSize)
                  .font("Helvetica")
                  .text("Email", rightCol, detailsStartY + 76);
                doc
                  .fillColor("#1a3a52")
                  .fontSize(9)
                  .font("Helvetica")
                  .text(user.email, rightCol, detailsStartY + 90);

                const sigY = pageHeight - 120;
                const sigLineY = sigY + 50;
                const sigLineLength = 100;

                doc
                  .strokeColor("#333333")
                  .lineWidth(1.5)
                  .moveTo(leftCol, sigLineY)
                  .lineTo(leftCol + sigLineLength, sigLineY)
                  .stroke();

                doc
                  .fillColor("#1a3a52")
                  .fontSize(10)
                  .font("Helvetica-Bold")
                  .text(course.certificateSignerName || "", leftCol, sigLineY - 18, {
                    width: sigLineLength,
                    align: "center",
                  });

                doc
                  .fillColor("#666666")
                  .fontSize(9)
                  .font("Helvetica")
                  .text(
                    course.certificateSignerTitle || "Director Signature",
                    leftCol,
                    sigLineY + 8,
                    { width: sigLineLength, align: "center" },
                  );

                doc
                  .strokeColor("#333333")
                  .lineWidth(1.5)
                  .moveTo(rightCol, sigLineY)
                  .lineTo(rightCol + sigLineLength, sigLineY)
                  .stroke();

                doc
                  .fillColor("#1a3a52")
                  .fontSize(10)
                  .font("Helvetica-Bold")
                  .text(course.certificateSealLabel || "Official Seal", rightCol, sigLineY - 18, {
                    width: sigLineLength,
                    align: "center",
                  });

                doc
                  .fillColor("#666666")
                  .fontSize(9)
                  .font("Helvetica")
                  .text("Official Seal", rightCol, sigLineY + 8, {
                    width: sigLineLength,
                    align: "center",
                  });

                doc
                  .fillColor("#8B7355")
                  .fontSize(9)
                  .font("Helvetica-Oblique")
                  .text(
                    course.certificateFooterText ||
                      "Verified Achievement • Authenticated Completion • Excellence Recognized",
                    50,
                    pageHeight - 45,
                    {
                      align: "center",
                      width: pageWidth - 100,
                    },
                  );

                doc
                  .strokeColor("#d4af37")
                  .lineWidth(2)
                  .moveTo(100, pageHeight - 30)
                  .lineTo(pageWidth - 100, pageHeight - 30)
                  .stroke();

                doc.end();
              } catch (error) {
                reject(error);
              }
            });
          }

          static async saveCertificatePdf(certificateData, fileName) {
            try {
              const uploadsDir = path.join(__dirname, "../../uploads/certificates");

              if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
              }

              const filePath = path.join(uploadsDir, fileName);
              const pdfBuffer = await this.generateCertificate(certificateData);
              fs.writeFileSync(filePath, pdfBuffer);

              return `/uploads/certificates/${fileName}`;
            } catch (error) {
              console.error("Error saving certificate PDF:", error);
              throw error;
            }
          }

          static generateFileName(userId, courseId, certificateNumber) {
            return `cert_${userId}_${courseId}_${certificateNumber}.pdf`;
          }
        }

        export default CertificatePdfService;
    return `cert_${userId}_${courseId}_${certificateNumber}.pdf`;
