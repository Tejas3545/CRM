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

    # Define custom clean typography styles (Using Helvetica without missing unicode glyphs)
    shop_title_style = ParagraphStyle(
        'ShopTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#991B1B'), # Deep Crimson
    )

    shop_details_style = ParagraphStyle(
        'ShopDetails',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#475569')
    )

    invoice_badge_style = ParagraphStyle(
        'InvoiceBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        alignment=2, # Right aligned
        textColor=colors.HexColor('#DC2626') # Vibrant Red
    )

    right_header_style = ParagraphStyle(
        'RightHeader',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=13,
        alignment=2,  # Right aligned
        textColor=colors.HexColor('#1E293B')
    )

    customer_label_style = ParagraphStyle(
        'CustomerLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#0F172A')
    )

    customer_text_style = ParagraphStyle(
        'CustomerText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155')
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
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
        textColor=colors.HexColor('#0F172A')
    )

    table_cell_center = ParagraphStyle(
        'TableCellCenter',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        alignment=1, # Centered
        textColor=colors.HexColor('#0F172A')
    )

    table_cell_right = ParagraphStyle(
        'TableCellRight',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        alignment=2, # Right aligned
        textColor=colors.HexColor('#0F172A')
    )

    footer_style = ParagraphStyle(
        'FooterText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#64748B')
    )

    # 1. Top Decorative Red Banner Line
    story.append(HRFlowable(width="100%", thickness=3, color=colors.HexColor('#DC2626'), spaceAfter=10))

    # 2. Header Block: Shop Info (Left) & Invoice Metadata (Right)
    inv_date_str = sale.date.strftime('%d-%b-%Y %H:%M') if sale.date else datetime.now().strftime('%d-%b-%Y %H:%M')
    
    header_left = Paragraph(
        f"<font color='#991B1B'><b>{settings.SHOP_NAME}</b></font><br/>"
        f"{settings.SHOP_ADDRESS}<br/>"
        f"Phone: {settings.SHOP_PHONE} | Email: {settings.SHOP_EMAIL}<br/>"
        f"<b>GSTIN: {settings.SHOP_GSTIN}</b>",
        shop_details_style
    )

    header_right = Paragraph(
        f"<b>TAX INVOICE</b><br/><br/>"
        f"<b>Invoice No:</b> {sale.invoice_no}<br/>"
        f"<b>Date:</b> {inv_date_str}<br/>"
        f"<b>Payment Mode:</b> {sale.payment_type}",
        right_header_style
    )

    header_table = Table([[header_left, header_right]], colWidths=[335, 200])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))

    # Divider Line
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E2E8F0'), spaceAfter=10))

    # 3. Customer Info Block ("Billed To")
    cust_name = customer.name if customer else "Walk-in Retail Buyer"
    cust_phone = customer.phone if customer else "N/A"
    cust_address = customer.address if (customer and customer.address) else "N/A"
    cust_type = customer.type if customer else "Retail"
    cust_gstin = customer.gstin if (customer and customer.gstin) else "N/A"

    cust_left = Paragraph(
        f"<b>Billed To:</b><br/>"
        f"<b>{cust_name}</b> ({cust_type})<br/>"
        f"Phone: {cust_phone}<br/>"
        f"Address: {cust_address}",
        customer_text_style
    )

    cust_right = Paragraph(
        f"<b>Customer GSTIN:</b> {cust_gstin}<br/>"
        f"<b>Place of Supply:</b> {settings.SHOP_STATE}<br/>"
        f"<b>Payment Status:</b> {sale.payment_status}",
        customer_text_style
    )

    cust_table = Table([[cust_left, cust_right]], colWidths=[330, 205])
    cust_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(cust_table)
    story.append(Spacer(1, 12))

    # 4. Invoice Items Table Header (Using "Rs." instead of missing unicode glyph "₹")
    headers = [
        Paragraph("<b>#</b>", table_header_style),
        Paragraph("<b>Item Description</b>", table_header_style),
        Paragraph("<b>HSN</b>", table_header_style),
        Paragraph("<b>Qty</b>", table_header_style),
        Paragraph("<b>Rate (Rs.)</b>", table_header_style),
        Paragraph("<b>GST %</b>", table_header_style),
        Paragraph("<b>GST Amt (Rs.)</b>", table_header_style),
        Paragraph("<b>Total (Rs.)</b>", table_header_style),
    ]

    items_data = [headers]
    for idx, item in enumerate(items, start=1):
        product_name = item.product.name if hasattr(item, 'product') and item.product else f"Product #{item.product_id}"
        hsn = item.product.hsn_code if hasattr(item, 'product') and item.product and item.product.hsn_code else "3917"
        unit = item.product.unit if hasattr(item, 'product') and item.product else "pc"
        
        row = [
            Paragraph(str(idx), table_cell_center),
            Paragraph(f"{product_name} ({unit})", table_cell_style),
            Paragraph(hsn, table_cell_center),
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
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#991B1B')), # Deep Crimson Table Header
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]

    # Alternating row background for visual contrast
    for row_idx in range(1, len(items_data)):
        if row_idx % 2 == 0:
            table_styles.append(('BACKGROUND', (0, row_idx), (-1, row_idx), colors.HexColor('#F8FAFC')))

    items_table.setStyle(TableStyle(table_styles))
    story.append(items_table)
    story.append(Spacer(1, 10))

    # 5. Calculation Summary Box (Subtotal, CGST, SGST, Total, Paid, Balance)
    cgst = sale.gst_amount / 2.0
    sgst = sale.gst_amount / 2.0

    summary_data = [
        [Paragraph("Subtotal (Excl. Tax):", table_cell_style), Paragraph(f"Rs. {sale.subtotal:.2f}", table_cell_right)],
        [Paragraph("CGST (Intra-state):", table_cell_style), Paragraph(f"Rs. {cgst:.2f}", table_cell_right)],
        [Paragraph("SGST (Intra-state):", table_cell_style), Paragraph(f"Rs. {sgst:.2f}", table_cell_right)],
        [Paragraph("Total GST Tax Amount:", table_cell_style), Paragraph(f"Rs. {sale.gst_amount:.2f}", table_cell_right)],
    ]
    if sale.discount > 0:
        summary_data.append([Paragraph("Discount Offered:", table_cell_style), Paragraph(f"- Rs. {sale.discount:.2f}", table_cell_right)])

    summary_data.append([
        Paragraph("<b>GRAND TOTAL:</b>", ParagraphStyle('GT', parent=table_cell_style, fontName='Helvetica-Bold', fontSize=9.5)),
        Paragraph(f"<b>Rs. {sale.total:.2f}</b>", ParagraphStyle('GTR', parent=table_cell_right, fontName='Helvetica-Bold', fontSize=10.5, textColor=colors.HexColor('#991B1B')))
    ])
    summary_data.append([
        Paragraph("<b>Amount Paid:</b>", table_cell_style),
        Paragraph(f"Rs. {sale.amount_paid:.2f}", table_cell_right)
    ])

    balance_due = max(0.0, sale.total - sale.amount_paid)
    if balance_due > 0:
        summary_data.append([
            Paragraph("<b>Balance Due (Udhaar):</b>", ParagraphStyle('BD', parent=table_cell_style, fontName='Helvetica-Bold', textColor=colors.HexColor('#DC2626'))),
            Paragraph(f"<b>Rs. {balance_due:.2f}</b>", ParagraphStyle('BDR', parent=table_cell_right, fontName='Helvetica-Bold', textColor=colors.HexColor('#DC2626')))
        ])

    summary_table = Table(summary_data, colWidths=[150, 110])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0,0), (-1,-1), 4.5),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))

    # Wrap summary table in right-aligned layout with Terms on the left
    terms_text = Paragraph(
        "<b>Terms & Conditions:</b><br/>"
        "1. Goods once sold will not be taken back or exchanged.<br/>"
        "2. All disputes are subject to local jurisdiction.<br/>"
        "3. This is a computer generated GST Tax Invoice.",
        footer_style
    )

    bottom_block_table = Table([[terms_text, summary_table]], colWidths=[270, 265])
    bottom_block_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(bottom_block_table)
    story.append(Spacer(1, 20))

    # 6. Signatory & Thank You Footer
    signatory_text = Paragraph("<b>For Apex Plumbing & Hardware Stores</b><br/><br/><br/>Authorized Signatory", ParagraphStyle('Sig', parent=right_header_style, fontSize=8.5))
    thankyou_text = Paragraph("<b>Thank you for your business!</b><br/>For any billing queries, please contact us at " + settings.SHOP_PHONE, footer_style)

    footer_table = Table([[thankyou_text, signatory_text]], colWidths=[335, 200])
    footer_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
    ]))
    story.append(footer_table)

    doc.build(story)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data
