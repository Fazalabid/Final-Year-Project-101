const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // Looking to send emails in production? Check out our Email API/SMTP product!
  var transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  const mailOptions = {
    from: '"BooknBite Support" <support@booknbite.com>',
    to: options.email,
    subject: options.subject,
    html: options.message,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
