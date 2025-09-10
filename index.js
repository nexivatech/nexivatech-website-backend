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
  from: process.env.EMAIL_USER,
  to: "nexivatech@gmail.com",
  subject: "Contact Us Form Submission",
  html: `
  <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; background-color:#eef2f7; padding:40px 15px;">
    <div style="max-width:650px; margin:0 auto; background:#ffffff; border-radius:14px; box-shadow:0 6px 20px rgba(0,0,0,0.08); overflow:hidden;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0f4c81, #10c6cc); padding:30px; text-align:center;">
        <h2 style="margin:0; color:#ffffff; font-size:24px; font-weight:600; letter-spacing:0.5px;">Contact Us Form </h2>
      </div>

      <!-- Body -->
      <div style="padding:30px;">
        
        <!-- Contact Info -->
        <div style="margin-bottom:25px;">
          <h3 style="margin:0 0 15px 0; color:#0f4c81; font-size:19px; border-left:4px solid #10c6cc; padding-left:10px;">Contact Information</h3>
          <table style="width:100%; border-collapse:collapse; font-size:15px;">
            <tr style="background:#f9fafc;">
              <td style="padding:12px 10px; font-weight:600; color:#333; width:35%;">Full Name</td>
              <td style="padding:12px 10px; color:#555;">${firstName}</td>
            </tr>
            <tr>
              <td style="padding:12px 10px; font-weight:600; color:#333;">Company</td>
              <td style="padding:12px 10px; color:#555;">${company || 'Not provided'}</td>
            </tr>
            <tr style="background:#f9fafc;">
              <td style="padding:12px 10px; font-weight:600; color:#333;">Email</td>
              <td style="padding:12px 10px; color:#555;">${email}</td>
            </tr>
            <tr>
              <td style="padding:12px 10px; font-weight:600; color:#333;">Phone</td>
              <td style="padding:12px 10px; color:#555;">${phoneNumber}</td>
            </tr>
          </table>
        </div>

        <!-- Message -->
        <div style="margin-bottom:25px;">
          <h3 style="margin:0 0 15px 0; color:#0f4c81; font-size:19px; border-left:4px solid #10c6cc; padding-left:10px;">Message</h3>
          <div style="background:#f9fafc; padding:20px; border-radius:10px; color:#444; line-height:1.6; font-size:15px;">
            ${message}
          </div>
        </div>

        <!-- CTA -->
        <div style="text-align:center; margin:30px 0;">
          <a href="mailto:${email}" style="background:linear-gradient(135deg, #0f4c81, #10c6cc); color:#ffffff; text-decoration:none; padding:12px 25px; border-radius:8px; font-size:15px; font-weight:500; display:inline-block;">Reply to ${firstName}</a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background:linear-gradient(135deg, #0f4c81, #10c6cc); padding:20px; text-align:center; color:#ffffff; font-size:13px;">
        <p style="margin:0;">📅 Submitted on ${new Date().toLocaleString()}</p>
      </div>
    </div>
  </div>
  `
};

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Contact form submitted successfully!'
    });

  } 
  
  catch (error) {
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
      expectedSalary,
      joiningDate,
      portfolio,
      linkedin
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !jobTitle || !location || !currentRole || !experience || !expectedSalary || !joiningDate || !linkedin) {
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
  from: process.env.EMAIL_USER,
  to: "nexivatech@gmail.com",
  subject: `New Job Application - ${displayJobTitle}`,
  html: `
  <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; background-color:#eef2f7; padding:40px 15px;">
    <div style="max-width:650px; margin:0 auto; background:#ffffff; border-radius:14px; box-shadow:0 6px 20px rgba(0,0,0,0.08); overflow:hidden;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0f4c81, #10c6cc); padding:30px; text-align:center;">
        <h2 style="margin:0; color:#ffffff; font-size:24px; font-weight:600; letter-spacing:0.5px;">Job Application</h2>
        <p style="margin:8px 0 0 0; color:#e0f7fa; font-size:15px;">Position Applied: <b>${displayJobTitle}</b></p>
      </div>

      <!-- Personal Info -->
      <div style="padding:30px; border-bottom:1px solid #eee;">
        <h3 style="margin:0 0 15px 0; color:#0f4c81; font-size:19px; border-left:4px solid #10c6cc; padding-left:10px;">👤 Personal Information</h3>
        <table style="width:100%; border-collapse:collapse; font-size:15px;">
          <tr style="background:#f9fafc;">
            <td style="padding:12px 10px; font-weight:600; color:#333; width:35%;">Name</td>
            <td style="padding:12px 10px; color:#555;">${firstName} ${lastName}</td>
          </tr>
          <tr>
            <td style="padding:12px 10px; font-weight:600; color:#333;">Email</td>
            <td style="padding:12px 10px; color:#555;">${email}</td>
          </tr>
          <tr style="background:#f9fafc;">
            <td style="padding:12px 10px; font-weight:600; color:#333;">Phone</td>
            <td style="padding:12px 10px; color:#555;">${phone}</td>
          </tr>
          <tr>
            <td style="padding:12px 10px; font-weight:600; color:#333;">Location</td>
            <td style="padding:12px 10px; color:#555;">${location}</td>
          </tr>
        </table>
      </div>

      <!-- Professional Info -->
      <div style="padding:30px; border-bottom:1px solid #eee;">
        <h3 style="margin:0 0 15px 0; color:#0f4c81; font-size:19px; border-left:4px solid #10c6cc; padding-left:10px;">💼 Professional Information</h3>
        <table style="width:100%; border-collapse:collapse; font-size:15px;">
          <tr style="background:#f9fafc;">
            <td style="padding:12px 10px; font-weight:600; color:#333; width:35%;">Applied Position</td>
            <td style="padding:12px 10px; color:#555;">${displayJobTitle}</td>
          </tr>
          <tr>
            <td style="padding:12px 10px; font-weight:600; color:#333;">Current Role</td>
            <td style="padding:12px 10px; color:#555;">${currentRole}</td>
          </tr>
          <tr style="background:#f9fafc;">
            <td style="padding:12px 10px; font-weight:600; color:#333;">Experience</td>
            <td style="padding:12px 10px; color:#555;">${experience} years</td>
          </tr>
           <tr style="background:#f9fafc;">
            <td style="padding:12px 10px; font-weight:600; color:#333;">Expected Sallary</td>
            <td style="padding:12px 10px; color:#555;">${expectedSalary}</td>
          </tr>
             <tr style="background:#f9fafc;">
            <td style="padding:12px 10px; font-weight:600; color:#333;">Joining Date</td>
            <td style="padding:12px 10px; color:#555;">${joiningDate}</td>
          </tr>
          <tr>
            <td style="padding:12px 10px; font-weight:600; color:#333;">LinkedIn</td>
            <td style="padding:12px 10px;"><a href="${linkedin}" style="color:#10c6cc; text-decoration:none;">${linkedin}</a></td>
          </tr>
          ${portfolio ? `
          <tr style="background:#f9fafc;">
            <td style="padding:12px 10px; font-weight:600; color:#333;">Portfolio/GitHub</td>
            <td style="padding:12px 10px;"><a href="${portfolio}" style="color:#10c6cc; text-decoration:none;">${portfolio}</a></td>
          </tr>
          ` : ""}
        </table>
      </div>

      <!-- Resume Section -->
      <div style="padding:25px; background:#f9fbfd; text-align:center;">
        <p style="margin:0; font-size:15px; color:#333;">
          📎 Resume Attached: <b>${req.file.originalname}</b>
        </p>
      </div>

      <!-- Footer -->
      <div style="background:linear-gradient(135deg, #0f4c81, #10c6cc); padding:20px; text-align:center; color:#ffffff; font-size:13px;">
        <p style="margin:0;">📅 Application submitted on ${new Date().toLocaleString()}</p>
      </div>
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

  } 
  
  catch (error) {
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
});

module.exports = app;