"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();
let transporter = nodemailer.createTransport({
    service: "163",
    auth: {
        user: process.env.SendMail,
        pass: process.env.MailPass
    }
});
/**
 * 向用户发送邮件
 */
class MailMessage {
    /**
     * 发送邮件信息函数
     * @param content
     */
    static sendMessage(content) {
        // 配置发送信息
        let mailOptions = {
            from: process.env.sendMail,
            to: content.receiveMail,
            subject: "火车票余票查询结果",
            html: content.content
        };
        transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                console.log("发送邮箱失败");
                console.log(err);
                return;
            }
            console.log("邮箱发送成功");
        });
    }
}
exports.MailMessage = MailMessage;
//# sourceMappingURL=MailMessage.js.map