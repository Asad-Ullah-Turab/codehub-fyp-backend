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
        const { user, course, certificateNumber, finalScore, issuedDate } =
          certificateData;

        // Create PDF document
        const doc = new PDFDocument({
          size: "A4",
          margin: 0,
          bufferPages: true,
        });

        const buffer = [];

        doc.on("data", (chunk) => buffer.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(buffer)));
        doc.on("error", reject);

        // Page dimensions
        const pageWidth = 595; // A4 width in points
        const pageHeight = 842; // A4 height in points

        // Background color
        doc.rect(0, 0, pageWidth, pageHeight).fill("#f5f5f5");

        // Border
        doc
          .strokeColor("#1e3a8a")
          .lineWidth(4)
          .rect(30, 30, pageWidth - 60, pageHeight - 60)
          .stroke();

        // Inner decorative border
        doc
          .strokeColor("#3b82f6")
          .lineWidth(1)
          .rect(45, 45, pageWidth - 90, pageHeight - 90)
          .stroke();

        // Top decorative line
        doc
          .strokeColor("#1e3a8a")
          .lineWidth(2)
          .moveTo(80, 100)
          .lineTo(pageWidth - 80, 100)
          .stroke();

        // Title
        doc
          .fillColor("#1e3a8a")
          .fontSize(48)
          .font("Helvetica-Bold")
          .text("CERTIFICATE OF COMPLETION", 50, 140, {
            align: "center",
            width: pageWidth - 100,
          });

        // Subtitle
        doc
          .fillColor("#3b82f6")
          .fontSize(14)
          .font("Helvetica")
          .text("This Certifies That", 50, 220, {
            align: "center",
            width: pageWidth - 100,
          });

        // User Name - Large and prominent
        doc
          .fillColor("#1e3a8a")
          .fontSize(32)
          .font("Helvetica-Bold")
          .text(user.name.toUpperCase(), 50, 260, {
            align: "center",
            width: pageWidth - 100,
          });

        // Achievement text
        doc
          .fillColor("#2c3e50")
          .fontSize(12)
          .font("Helvetica")
          .text("has successfully completed the course", 50, 320, {
            align: "center",
            width: pageWidth - 100,
          });

        // Course Name - Highlight
        doc
          .fillColor("#1e3a8a")
          .fontSize(24)
          .font("Helvetica-Bold")
          .text(course.title, 50, 350, {
            align: "center",
            width: pageWidth - 100,
          });

        // Details section
        const detailsStartY = 420;
        doc
          .fillColor("#2c3e50")
          .fontSize(11)
          .font("Helvetica");

        // Score
        doc.text("Final Score: ", 100, detailsStartY, { continued: true });
        doc
          .fillColor("#27ae60")
          .font("Helvetica-Bold")
          .text(`${finalScore}%`);

        // Certificate Number
        doc
          .fillColor("#2c3e50")
          .font("Helvetica")
          .text("Certificate Number: ", 100, detailsStartY + 25, { continued: true });
        doc
          .fillColor("#1e3a8a")
          .font("Helvetica-Bold")
          .text(certificateNumber);

        // Issue Date
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
          .fillColor("#2c3e50")
          .font("Helvetica")
          .text("Issued Date: ", 100, detailsStartY + 50, { continued: true });
        doc
          .fillColor("#1e3a8a")
          .font("Helvetica-Bold")
          .text(issueDate);

        // User Email
        doc
          .fillColor("#2c3e50")
          .font("Helvetica")
          .text("Email: ", 100, detailsStartY + 75, { continued: true });
        doc
          .fillColor("#1e3a8a")
          .font("Helvetica-Bold")
          .text(user.email);

        // Signature lines
        const signatureY = pageHeight - 180;

        doc
          .strokeColor("#2c3e50")
          .lineWidth(1)
          .moveTo(80, signatureY)
          .lineTo(220, signatureY)
          .stroke();

        doc
          .strokeColor("#2c3e50")
          .lineWidth(1)
          .moveTo(pageWidth - 220, signatureY)
          .lineTo(pageWidth - 80, signatureY)
          .stroke();

        // Signature labels
        doc
          .fillColor("#2c3e50")
          .fontSize(10)
          .font("Helvetica")
          .text("Admin Signature", 80, signatureY + 10, {
            width: 140,
            align: "center",
          });

        doc.text("Date", pageWidth - 220, signatureY + 10, {
          width: 140,
          align: "center",
        });

        // Footer
        doc
          .fillColor("#666666")
          .fontSize(8)
          .font("Helvetica")
          .text(
            "This certificate is awarded in recognition of outstanding achievement and dedication.",
            50,
            pageHeight - 50,
            {
              align: "center",
              width: pageWidth - 100,
            }
          );

        // Decorative bottom line
        doc
          .strokeColor("#1e3a8a")
          .lineWidth(2)
          .moveTo(80, pageHeight - 80)
          .lineTo(pageWidth - 80, pageHeight - 80)
          .stroke();

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Save certificate PDF to file system
   * @param {Object} certificateData - Certificate data
   * @param {string} fileName - Output file name
   * @returns {Promise<string>} File path
   */
  static async saveCertificatePdf(certificateData, fileName) {
    try {
      const uploadsDir = path.join(__dirname, "../../uploads/certificates");

      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, fileName);
      const pdfBuffer = await this.generateCertificate(certificateData);

      // Write file to disk
      fs.writeFileSync(filePath, pdfBuffer);

      // Return relative path for storage in database
      return `/uploads/certificates/${fileName}`;
    } catch (error) {
      console.error("Error saving certificate PDF:", error);
      throw error;
    }
  }

  /**
   * Generate file name for certificate
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @param {string} certificateNumber - Certificate number
   * @returns {string} File name
   */
  static generateFileName(userId, courseId, certificateNumber) {
    return `cert_${userId}_${courseId}_${certificateNumber}.pdf`;
  }
}

export default CertificatePdfService;
