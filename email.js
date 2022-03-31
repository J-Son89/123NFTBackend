require("dotenv").config();
const nodemailer = require("nodemailer");
const path = require("path");
/**
 * sendEmail
 * @param {Object} mailObj - Email information
 * @param {String} from - Email address of the sender
 * @param {Array} to - Array of receipents email address
 * @param {String} subject - Subject of the email
 * @param {String} text - Email body
 */
const sendEmail = async ({
  from,
  to = "jamiecaprani@gmail.com",
  subject,
  text,
}) => {
  console.log("EMAIL_USER", process.env.EMAIL_USER);
  try {
    // Create a transporter
    let transporter = nodemailer.createTransport({
      host: "mail.privateemail.com",

      port: 465,
      secureConnection: false, // TLS requires secureConnection to be false

      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        ciphers:'SSLv3'
    }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: process.env.EMAIL_USER, // sender address
      to: to, // list of receivers
      subject: subject, // Subject line
      text: text, // plain text body
    //   html: {
    //     path: path.resolve(__dirname, "../template/mail.html"),
    //   },
    });

    console.log(`Message sent: ${info.messageId}`);
    return `Message sent: ${info.messageId}`;
  } catch (error) {
    console.error(error);
    throw new Error(
      `Something went wrong in the sendmail method. Error: ${error.message}`
    );
  }
};

module.exports = { sendEmail };
