import { Transaction } from '../types';

/**
 * Simulates sending a transactional email.
 * In a real application, this would call a Cloud Function or an API like EmailJS/SendGrid.
 */
export const sendOrderConfirmationEmail = async (transaction: Transaction): Promise<boolean> => {
  console.log("🔄 Connecting to Email Server...");
  
  // Generate Personalized Email Body
  const emailSubject = `Order Confirmation: ${transaction.transactionId} - LearnSphere`;
  
  const courseList = transaction.courses.map(c => `• ${c}`).join('\n');
  
  const emailBody = `
  ---------------------------------------------------------------
  FROM: no-reply@learnsphere.com
  TO: ${transaction.payerEmail}
  SUBJECT: ${emailSubject}
  ---------------------------------------------------------------
  
  Dear ${transaction.customerName},

  Thank you for choosing LearnSphere! Your payment has been successfully processed.
  Here are the details of your purchase:

  ORDER SUMMARY
  =========================================
  Transaction ID : ${transaction.transactionId}
  Date           : ${new Date(transaction.timestamp).toLocaleString()}
  Total Paid     : ₹${transaction.totalAmount}
  =========================================

  COURSES UNLOCKED:
  ${courseList}

  You can now access your course materials from your dashboard.
  We hope you enjoy your learning journey!

  Best regards,
  The LearnSphere Team
  ---------------------------------------------------------------
  `;

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Log the email to console for developer verification
  console.log("%c ✅ EMAIL SENT SUCCESSFULLY ", "background: #22c55e; color: #fff; font-weight: bold; padding: 4px; border-radius: 4px;");
  console.log(emailBody);

  return true;
};
