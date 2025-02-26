import sgMail from '@sendgrid/mail';
import Message from '../models/Message.js';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const submitContactForm = async (req, res) => {
  const { name, email, message } = req.body;

  // Save the message to the database
  const newMessage = new Message({ name, email, message });
  await newMessage.save();

  // Send an email notification
  const msg = {
    to: 'bca19073150@gmail.com',
    from: 'saugatghimire.study@gmail.com',
    subject: 'User query from Quiz Craft',
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
  };

  try {
    await sgMail.send(msg);
    res.status(200).send('Message sent successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to send message');
  }
};

export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).send('Failed to fetch messages');
  }
};