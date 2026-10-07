// Replace with nodemailer/SES/Resend in production.
export const sendMail = async (to, subject, link) => console.log(`\n[mail] To: ${to}\n${subject}\n${link}\n`);
