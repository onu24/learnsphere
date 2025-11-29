import { Transaction } from '../types';
import emailjs from '@emailjs/browser';

// --- CONFIGURATION ---
// 1. Go to emailjs.com, create an account.
// 2. Connect your SMTP service (Gmail, Outlook, etc).
// 3. Create an email template.
// 4. Paste your keys below.
const EMAILJS_CONFIG = {
  SERVICE_ID: "service_placeholder", // e.g., service_xyz
  TEMPLATE_ID: "template_placeholder", // e.g., template_abc
  PUBLIC_KEY: "key_placeholder"      // e.g., user_123
};

/**
 * Sends a real email via EmailJS (SMTP wrapper).
 * If keys are missing or email fails, falls back to downloading a receipt.
 */
export const sendOrderConfirmationEmail = async (transaction: Transaction): Promise<boolean> => {
  console.log("🔄 Initiating Email Service...");
  
  // Prepare template params matching your EmailJS template variables
  const templateParams = {
    to_name: transaction.customerName,
    to_email: transaction.payerEmail,
    transaction_id: transaction.transactionId,
    total_amount: transaction.totalAmount,
    date: new Date(transaction.timestamp).toLocaleString(),
    course_list: transaction.courses.map(c => `• ${c}`).join('\n')
  };

  try {
    // Check if configured
    if (EMAILJS_CONFIG.PUBLIC_KEY === "key_placeholder") {
      throw new Error("EmailJS not configured. Falling back to receipt download.");
    }

    await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );

    console.log("%c ✅ SMTP EMAIL SENT ", "background: #22c55e; color: #fff; padding: 4px;");
    return true;

  } catch (error) {
    console.warn("⚠️ Email send failed (or not configured). Downloading receipt instead.", error);
    downloadReceipt(transaction);
    return false;
  }
};

/**
 * Fallback: Downloads a text file receipt to the user's computer.
 * Ensures the user gets their order info even if email fails.
 */
const downloadReceipt = (transaction: Transaction) => {
  const element = document.createElement("a");
  const receiptContent = `
  LEARNSPHERE - OFFICIAL RECEIPT
  =========================================
  Order Status   : CONFIRMED
  Transaction ID : ${transaction.transactionId}
  Date           : ${new Date(transaction.timestamp).toLocaleString()}
  Customer       : ${transaction.customerName}
  Email          : ${transaction.payerEmail}
  -----------------------------------------
  PURCHASED ITEMS:
  ${transaction.courses.map(c => `[x] ${c}`).join('\n')}
  -----------------------------------------
  TOTAL PAID     : ₹${transaction.totalAmount}
  =========================================
  
  Thank you for your purchase!
  Please keep this file for your records.
  `;
  
  const file = new Blob([receiptContent], {type: 'text/plain'});
  element.href = URL.createObjectURL(file);
  element.download = `Receipt-${transaction.transactionId}.txt`;
  document.body.appendChild(element); // Required for this to work in FireFox
  element.click();
  document.body.removeChild(element);
};