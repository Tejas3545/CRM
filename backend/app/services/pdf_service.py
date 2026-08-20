import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from app.core.config import settings

def generate_gst_invoice_pdf(sale, customer, items) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30
    )
    story = []
    styles = getSampleStyleSheet()

    # Define custom styles
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#1E293B'),
    )

    subtitle_style = ParagraphStyle(
        'ShopDetails',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#475569')
    )

    right_header_style = ParagraphStyle(
        'RightHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        alignment=2,  # Right aligned
        textColor=colors.HexColor('#0F172A')
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white,
        alignment=1  # Centered
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#1E293B')
    )

    table_cell_right = ParagraphStyle(
        'TableCellRight',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        alignment=2,
        textColor=colors.HexColor('#1E293B')
    )

    # Top Header Banner
    header_data = [
        [
            Paragraph(f"<b>{settings.SHOP_NAME}</b><br/>{settings.SHOP_ADDRESS}<br/>Phone: {settings.SHOP_PHONE} | Email: {settings.SHOP_EMAIL}<br/><b>GSTIN: {settings.SHOP_GSTIN}</b>", subtitle_style),
            Paragraph(f"<font size=14 color='#C2410C'>TAX INVOICE</font><br/><br/><b>Invoice No:</b> {sale.invoice_no}<br/><b>Date:</b> {sale.date.strftime('%d-%b-%Y %H:%M')}<br/><b>Payment:</b> {sale.payment_type}", right_header_style)
        ]
    ]

    header_table = Table(header_data, colWidths=[330, 205])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=10))

    # Customer Details Block
    cust_name = customer.name if customer else "Walk-in Customer"
    cust_phone = customer.phone if customer else "N/A"
    cust_address = customer.address if (customer and customer.address) else "N/A"
    cust_type = customer.type if customer else "Retail"

    customer_info_data = [
        [
            Paragraph(f"<b>Billed To:</b><br/><b>{cust_name}</b> ({cust_type})<br/>Phone: {cust_phone}<br/>Address: {cust_address}", subtitle_style),
            Paragraph(f"<b>Place of Supply:</b> {settings.SHOP_STATE}<br/><b>Status:</b> {sale.payment_status}", subtitle_style)
        ]
    ]
    cust_table = Table(customer_info_data, colWidths=[350, 185])
    cust_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(cust_table)
    story.append(Spacer(1, 12))

    # Invoice Items Table
    headers = [
        Paragraph("<b>#</b>", table_header_style),
        Paragraph("<b>Item Description</b>", table_header_style),
        Paragraph("<b>HSN</b>", table_header_style),
        Paragraph("<b>Qty</b>", table_header_style),
        Paragraph("<b>Rate (₹)</b>", table_header_style),
        Paragraph("<b>GST %</b>", table_header_style),
        Paragraph("<b>GST (₹)</b>", table_header_style),
        Paragraph("<b>Total (₹)</b>", table_header_style),
    ]

    items_data = [headers]
    for idx, item in enumerate(items, start=1):
        product_name = item.product.name if hasattr(item, 'product') and item.product else f"Product #{item.product_id}"
        hsn = item.product.hsn_code if hasattr(item, 'product') and item.product and item.product.hsn_code else "3917"
        unit = item.product.unit if hasattr(item, 'product') and item.product else "pc"
        
        row = [
            Paragraph(str(idx), table_cell_style),
            Paragraph(f"{product_name} ({unit})", table_cell_style),
            Paragraph(hsn, table_cell_style),
            Paragraph(f"{item.qty:.2f}", table_cell_right),
            Paragraph(f"{item.unit_price:.2f}", table_cell_right),
            Paragraph(f"{item.gst_rate:.1f}%", table_cell_right),
            Paragraph(f"{item.gst_amount:.2f}", table_cell_right),
            Paragraph(f"{item.total:.2f}", table_cell_right),
        ]
        items_data.append(row)

    col_widths = [25, 175, 45, 45, 60, 50, 60, 75]
    items_table = Table(items_data, colWidths=col_widths, repeatRows=1)
    
    table_styles = [
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]
    items_table.setStyle(TableStyle(table_styles))
    story.append(items_table)
    story.append(Spacer(1, 12))

    # Calculation Summary Box (Subtotal, CGST, SGST, Total)
    cgst = sale.gst_amount / 2.0
    sgst = sale.gst_amount / 2.0

    summary_data = [
        [Paragraph("Subtotal Excl. Tax:", table_cell_style), Paragraph(f"₹ {sale.subtotal:.2f}", table_cell_right)],
        [Paragraph("CGST (Intra-state):", table_cell_style), Paragraph(f"₹ {cgst:.2f}", table_cell_right)],
        [Paragraph("SGST (Intra-state):", table_cell_style), Paragraph(f"₹ {sgst:.2f}", table_cell_right)],
        [Paragraph("Total GST Tax Amount:", table_cell_style), Paragraph(f"₹ {sale.gst_amount:.2f}", table_cell_right)],
    ]
    if sale.discount > 0:
        summary_data.append([Paragraph("Discount Offered:", table_cell_style), Paragraph(f"- ₹ {sale.discount:.2f}", table_cell_right)])

    summary_data.append([
        Paragraph("<b>GRAND TOTAL:</b>", ParagraphStyle('GT', parent=table_cell_style, fontName='Helvetica-Bold', fontSize=10)),
        Paragraph(f"<b>₹ {sale.total:.2f}</b>", ParagraphStyle('GTR', parent=table_cell_right, fontName='Helvetica-Bold', fontSize=11, textColor=colors.HexColor('#C2410C')))
    ])
    summary_data.append([
        Paragraph("<b>Amount Paid:</b>", table_cell_style),
        Paragraph(f"₹ {sale.amount_paid:.2f}", table_cell_right)
    ])
    balance_due = max(0.0, sale.total - sale.amount_paid)
    if balance_due > 0:
        summary_data.append([
            Paragraph("<b>Balance Due (Udhaar):</b>", ParagraphStyle('BD', parent=table_cell_style, textColor=colors.HexColor('#B91C1C'))),
            Paragraph(f"<b>₹ {balance_due:.2f}</b>", ParagraphStyle('BDR', parent=table_cell_right, textColor=colors.HexColor('#B91C1C')))
        ])

    summary_table = Table(summary_data, colWidths=[140, 100])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0,0), (-1,-1), 4),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))

    # Wrap summary table in right-aligned container layout
    container_data = [
        [
            Paragraph("<b>Terms & Conditions:</b><br/>1. Goods once sold will not be taken back.<br/>2. Subject to Delhi jurisdiction.<br/>3. This is a computer generated GST Tax invoice.", subtitle_style),
            summary_table
        ]
    ]
    container_table = Table(container_data, colWidths=[285, 250])
    container_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(container_table)

    story.append(Spacer(1, 25))
    story.append(Paragraph("<b>Thank you for your business! - Apex Plumbing & Hardware</b>", ParagraphStyle('FooterText', parent=styles['Normal'], alignment=1, fontSize=9, textColor=colors.HexColor('#64748B'))))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
