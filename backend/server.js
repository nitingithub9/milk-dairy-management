const express = require("express");
const twilio = require("twilio");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

app.post("/send-invoice", async (req, res) => {
  const { customerName, phoneNumber, invoiceURL } = req.body;

  try {
    const message = await client.messages.create({
      from: "whatsapp:+14155238886", // Twilio Sandbox Number
      to: `whatsapp:${phoneNumber}`, // Customer's WhatsApp Number
      body: `Hello ${customerName}, here is your invoice: ${invoiceURL}`,
      mediaUrl: [invoiceURL],
    });

    res.json({ success: true, messageSid: message.sid });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
