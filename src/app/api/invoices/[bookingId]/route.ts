import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(_: Request, context: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await context.params;
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText("FootTN Invoice", { x: 50, y: 790, size: 24, font, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(`Booking ID: ${bookingId}`, { x: 50, y: 750, size: 12, font });
  page.drawText(`Generated: ${new Date().toISOString()}`, { x: 50, y: 730, size: 12, font });
  const bytes = await pdf.save();
  const body = Buffer.from(bytes);
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${bookingId}.pdf"`,
    },
  });
}
