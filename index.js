const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], 
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
  fileFilter: fileFilter
});

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS    
    }
  });
};

app.post('/api/contact', async (req, res) => {
  try {
    const { firstName, company, email, phoneNumber, message } = req.body;

    if (!firstName || !email || !phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: 'nexivatech@gmail.com',
      subject: 'New Contact Us Form Submission',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10c6cc, #022e75); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #ffffff; margin: 0; text-align: center;">New Contact Us Form Submission</h2>
          </div>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #022e75; margin-bottom: 15px;">Contact Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold; color: #555;">Full Name:</td>
                <td style="padding: 10px; color: #333;">${firstName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold; color: #555;">Company:</td>
                <td style="padding: 10px; color: #333;">${company || 'Not provided'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold; color: #555;">Email:</td>
                <td style="padding: 10px; color: #333;">${email}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold; color: #555;">Phone Number:</td>
                <td style="padding: 10px; color: #333;">${phoneNumber}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
            <h3 style="color: #022e75; margin-bottom: 15px;">Message:</h3>
            <p style="color: #333; line-height: 1.6; margin: 0;">${message}</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 15px; background: #e8f4f8; border-radius: 8px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              This message was sent from your website's contact form on ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Contact form submitted successfully!'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again.'
    });
  }
});

app.post('/api/career', upload.single('resume'), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      location,
      currentRole,
      experience,
      portfolio,
      linkedin
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !jobTitle || !location || !currentRole || !experience || !linkedin) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload your resume'
      });
    }

    const transporter = createTransporter();

    const jobTitleMap = {
      'node-js-developer': 'Node.js Developer',
      'ui-ux-designer': 'UI/UX Designer',
      'internee-mobile-app-developer': 'Internee Mobile App Developer',
      'jr-web-developer': 'Jr. Web Developer',
      'sr-web-developer': 'Sr. Web Developer',
      'jr-mobile-app-developer': 'Jr. Mobile App Developer',
      'sr-mobile-app-developer': 'Sr. Mobile App Developer',
      'graphic-designer': 'Graphic Designer',
      'digital-marketing-specialist': 'Digital Marketing Specialist',
      'project-manager': 'Project Manager',
      'seo-expert': 'SEO Expert'
    };

    const displayJobTitle = jobTitleMap[jobTitle] || jobTitle;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: 'nexivatech@gmail.com',
      subject: `New Job Application - ${displayJobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10c6cc, #022e75); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color:  #ffffff; margin: 0; text-align: center;">New Job Application Received</h2>
            <p style="color:  #ffffff; text-align: center; margin: 10px 0 0 0;">Position: ${displayJobTitle}</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #022e75; margin-bottom: 15px;">Personal Information:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold; color: #555;">Name:</td>
                <td style="padding: 10px; color: #333;">${firstName} ${lastName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold; color: #555;">Email:</td>
                <td style="padding: 10px; color: #333;">${email}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold; color: #555;">Phone:</td>
                <td style="padding: 10px; color: #333;">${phone}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold; color: #555;">Location:</td>
                <td style="padding: 10px; color: #333;">${location}</td>
              </tr>
            </table>
          </div>

          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #022e75; margin-bottom: 15px;">Professional Information:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold; color: #555;">Applied Position:</td>
                <td style="padding: 10px; color: #333;">${displayJobTitle}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold; color: #555;">Current Role:</td>
                <td style="padding: 10px; color: #333;">${currentRole}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold; color: #555;">Experience:</td>
                <td style="padding: 10px; color: #333;">${experience} years</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold; color: #555;">LinkedIn Profile:</td>
                <td style="padding: 10px;"><a href="${linkedin}" style="color: #10c6cc;">${linkedin}</a></td>
              </tr>
              ${portfolio ? `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold; color: #555;">Portfolio/GitHub:</td>
                <td style="padding: 10px;"><a href="${portfolio}" style="color: #10c6cc;">${portfolio}</a></td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 15px; background: #e8f4f8; border-radius: 8px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              Application submitted on ${new Date().toLocaleString()}<br>
              Resume attached: ${req.file.originalname}
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: req.file.originalname,
          path: req.file.path
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully!'
    });

  } catch (error) {
    console.error('Career form error:', error);
    
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit application. Please try again.'
    });
  }
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running successfully!',
    timestamp: new Date().toISOString()
  });
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Please upload a file smaller than 5MB.'
      });
    }
  }
  
  if (error.message === 'Only PDF, DOC, and DOCX files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Please upload a PDF, DOC, or DOCX file.'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📧 Email will be sent to: nexivatech@gmail.com`);
  console.log(`📁 File uploads directory: ${uploadsDir}`);
});

module.exports = app;