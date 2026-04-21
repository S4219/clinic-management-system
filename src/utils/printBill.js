export function printBill(bill) {
  const patient = bill.patients?.name ?? 'N/A'
  const inv     = bill.invoice_number ?? '—'
  const date    = bill.date ?? new Date().toISOString().split('T')[0]
  const con = (bill.consultation_fee   || 0).toFixed(2)
  const lab = (bill.lab_charges        || 0).toFixed(2)
  const med = (bill.medicine_charges   || 0).toFixed(2)
  const oth = (bill.other_charges      || 0).toFixed(2)
  const tot = (bill.total_amount       || 0).toFixed(2)
  const status = (bill.payment_status  || 'pending').toUpperCase()
  const method = bill.payment_method   || '—'

  const statusColor = bill.payment_status === 'paid' ? '#16a34a' : bill.payment_status === 'pending' ? '#ca8a04' : '#dc2626'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice ${inv}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; border-bottom: 2px solid #2578ea; padding-bottom: 20px; }
    .clinic-name { font-size: 22px; font-weight: 800; color: #2578ea; }
    .clinic-sub  { font-size: 12px; color: #718096; margin-top: 3px; }
    .inv-box { text-align: right; }
    .inv-number { font-size: 20px; font-weight: 700; color: #1a1a2e; }
    .inv-label  { font-size: 11px; color: #718096; text-transform: uppercase; letter-spacing: 1px; }
    .details { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .detail-block h4 { font-size: 11px; color: #718096; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .detail-block p  { font-size: 14px; color: #2d3748; margin-bottom: 3px; }
    .detail-block .name { font-size: 16px; font-weight: 600; color: #1a1a2e; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f7fafc; text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 600; color: #718096; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1px solid #e2e8f0; }
    td { padding: 12px 14px; font-size: 14px; border-bottom: 1px solid #f0f0f0; }
    .amount { text-align: right; }
    .total-row td { font-weight: 700; font-size: 15px; background: #f7fafc; border-top: 2px solid #e2e8f0; border-bottom: none; }
    .footer { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .status-badge { display: inline-block; padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; background: ${statusColor}20; color: ${statusColor}; letter-spacing: 0.5px; }
    .note { font-size: 12px; color: #a0aec0; }
    @media print {
      body { padding: 0; }
      @page { margin: 20mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="clinic-name">🏥 ClinicMS</div>
      <div class="clinic-sub">123 Health Street, Mumbai, MH 400001<br/>+91 98765 43210 · support@clinicms.com</div>
    </div>
    <div class="inv-box">
      <div class="inv-label">Invoice</div>
      <div class="inv-number">${inv}</div>
      <div style="font-size:12px;color:#718096;margin-top:4px;">Date: ${date}</div>
    </div>
  </div>

  <div class="details">
    <div class="detail-block">
      <h4>Bill To</h4>
      <p class="name">${patient}</p>
    </div>
    <div class="detail-block" style="text-align:right;">
      <h4>Payment</h4>
      <p>Method: <strong>${method}</strong></p>
      <p style="margin-top:6px;"><span class="status-badge">${status}</span></p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="amount">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Consultation Fee</td><td class="amount">₹${con}</td></tr>
      <tr><td>Laboratory Charges</td><td class="amount">₹${lab}</td></tr>
      <tr><td>Medicine Charges</td><td class="amount">₹${med}</td></tr>
      <tr><td>Other Charges</td><td class="amount">₹${oth}</td></tr>
      <tr class="total-row">
        <td>Total Amount</td>
        <td class="amount">₹${tot}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <div class="note">Thank you for choosing ClinicMS.<br/>For queries: support@clinicms.com</div>
    <div class="note" style="text-align:right;">Authorised Signatory<br/><br/>___________________</div>
  </div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=800,height=900')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 400)
}
