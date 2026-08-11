const nodemailer = require('nodemailer');

async function sendInvoiceEmail(customerEmail, customerName, challanData) {
  try {
    // Generate test SMTP service account from ethereal.email
    let testAccount = await nodemailer.createTestAccount();

    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, 
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    let itemsHtml = challanData.items.map(item => 
      `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.product_name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">₹${item.unit_price}</td>
      </tr>`
    ).join('');

    let info = await transporter.sendMail({
      from: '"Dundoo ERP" <noreply@dundoo.com>',
      to: customerEmail,
      subject: `Your Invoice/Challan #${challanData.challan_number}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #1B512D;">DUNDOO - Hyperlocal Business Platform</h2>
          <h3>Hello ${customerName},</h3>
          <p>Thank you for your business. Your order has been confirmed.</p>
          <p><strong>Challan No:</strong> ${challanData.challan_number}</p>
          <p><strong>Date:</strong> ${new Date(challanData.created_at).toLocaleDateString()}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f8f9fa; text-align: left;">
                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Product</th>
                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Quantity</th>
                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <p style="margin-top: 30px; font-size: 12px; color: #777;">
            This is an automated message. Please do not reply.
          </p>
        </div>
      `,
    });

    console.log("Email sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    return nodemailer.getTestMessageUrl(info);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

module.exports = {
  sendInvoiceEmail
};
