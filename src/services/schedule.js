import schedule from 'node-schedule';
import sendEmail from './email.js';
import userModel from './../../DB/models/user.model.js';


export default schedule.scheduleJob('59 21 3 * * *', async () => { //0 30 13 * * *
    const users = userModel.find({ age: { $gt: 20 } }).select({ email: 1, _id: 0 }).cursor()
    const emails = [];
    for (let user = await users.next(); user != null; user = await users.next()) {
        emails.push(user.email)
    }
    const attachment = [
        {
            fileName: "Daily PDF.pdf",
            path: "./src/attachments/MySQL.pdf", //cause it runs at app.JS
            contentType: "application/pdf"
        }
    ]
    sendEmail(emails, "Daily PDF", "<h1>Check the attachments!</h1>", attachment)
});
