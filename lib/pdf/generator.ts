import { jsPDF } from "jspdf";
import { SalesOrder } from "../../types/sales";
import { PurchaseOrder } from "../../types/purchase";
import { ManufacturingBatch } from "../../types/manufacturing";

export type DocType = "Sales Order" | "Purchase Order" | "Manufacturing Batch";

export const generateProfessionalPDF = (data: any, type: DocType) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // --- Helper: Header ---
  const drawHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(30, 64, 175); // Blue-700
    doc.text("InventoryForge", margin, y);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Enterprise SME Operations Suite", margin, y + 7);
    
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(type.toUpperCase(), pageWidth - margin, y, { align: "right" });
    
    y += 25;
    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
  };

  // --- Helper: Info Section ---
  const drawInfo = (title: string, value: string, x: number, align: "left" | "right" = "left") => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(150);
    doc.text(title, x, y, { align });
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(value, x, y + 6, { align });
  };

  drawHeader();

  // --- Doc Specific Info ---
  if (type === "Sales Order") {
    const order = data as SalesOrder;
    drawInfo("CUSTOMER NAME", order.customer_name, margin);
    drawInfo("ORDER ID", order.id.substring(0, 18), pageWidth - margin, "right");
    y += 20;
    drawInfo("DATE", new Date(order.order_date || Date.now()).toLocaleDateString(), margin);
    drawInfo("STATUS", order.status, pageWidth - margin, "right");
  } else if (type === "Purchase Order") {
    const order = data as PurchaseOrder;
    drawInfo("SUPPLIER NAME", order.supplier_name, margin);
    drawInfo("PO NUMBER", order.po_number || order.id.substring(0, 12), pageWidth - margin, "right");
    y += 20;
    drawInfo("DATE", new Date(order.order_date || Date.now()).toLocaleDateString(), margin);
    drawInfo("STATUS", order.status, pageWidth - margin, "right");
  } else if (type === "Manufacturing Batch") {
    const batch = data as ManufacturingBatch;
    drawInfo("OUTPUT PRODUCT", batch.output_product?.name || "Unknown", margin);
    drawInfo("BATCH NUMBER", batch.batch_number || batch.id.substring(0, 12), pageWidth - margin, "right");
    y += 20;
    drawInfo("QUANTITY", `${batch.output_quantity} Units`, margin);
    drawInfo("STATUS", batch.status, pageWidth - margin, "right");
  }

  y += 25;

  // --- Table Header ---
  const drawTableRow = (cols: string[], isHeader = false) => {
    if (isHeader) {
      doc.setFillColor(245, 247, 250);
      doc.rect(margin, y - 5, pageWidth - (margin * 2), 10, "F");
      doc.setTextColor(50);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
    } else {
      doc.setTextColor(80);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    }

    const colWidths = [90, 30, 30, 20]; // Product, Qty, Rate, Total
    let currentX = margin + 5;
    
    cols.forEach((col, i) => {
      doc.text(col, currentX, y);
      currentX += colWidths[i];
    });
    
    y += 10;
    doc.setDrawColor(240);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
  };

  if (type === "Sales Order" || type === "Purchase Order") {
    drawTableRow(["ITEM DESCRIPTION", "QUANTITY", "RATE", "SUBTOTAL"], true);
    const items = (data.sales_order_items || data.purchase_order_items || []) as any[];
    
    items.forEach((item) => {
      const name = item.product?.name || "Unknown Product";
      const qty = item.quantity.toString();
      const rate = `$${item.rate.toFixed(2)}`;
      const total = `$${(item.quantity * item.rate).toFixed(2)}`;
      drawTableRow([name, qty, rate, total]);
    });

    // --- Footer Totals ---
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`GRAND TOTAL: $${data.total_amount.toFixed(2)}`, pageWidth - margin, y, { align: "right" });
  } else if (type === "Manufacturing Batch") {
    drawTableRow(["INPUT MATERIAL", "USAGE QTY", "STATUS", ""], true);
    const items = (data.manufacturing_raw_materials || []) as any[];
    
    items.forEach((item) => {
      const name = item.product?.name || "Raw Material";
      const qty = item.quantity.toString();
      const status = "Allocated";
      drawTableRow([name, qty, status, ""]);
    });
    
    y += 15;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text("*This batch converts the above inputs into the target output product listed in header.", margin, y);
  }

  // --- Final Footer ---
  const bottom = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(180);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated by InventoryForge SME Suite | ${new Date().toLocaleString()}`, pageWidth / 2, bottom, { align: "center" });

  return doc;
};
