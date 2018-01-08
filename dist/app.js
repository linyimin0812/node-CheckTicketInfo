"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const dotenv = require("dotenv");
const MailMessage_1 = require("./MailMessage");
const WechatMessage_1 = require("./WechatMessage");
const CheckTicket_1 = require("./CheckTicket");
const fs = require("fs");
const path = require("path");
const SwaggerFile_1 = require("./SwaggerFile");
// 加载配置环境
dotenv.config();
// 产生swagger配置文件
SwaggerFile_1.SwaggerFile.generateFile();
const app = express();
app.use(express.static(path.join(__dirname, "../public")));
// 加载用户信息
let userInfo = require("../UserInfo");
// 加载车站信息
let station = require("../station");
// 微信端使用
WechatMessage_1.WechatMessage.handleMessage(userInfo);
/**
  * @swagger
  * /checkTrainTicket:
  *   get:
  *       description: 查询余票信息
  *       deprecated: false
  *       tags:
  *           - "查询余票信息"
  *       parameters:
  *         - name: userName
  *           in: query
  *           description: 微信的昵称
  *           required: true
  *           type: string
  *         - name: trainDate
  *           in: query
  *           description: 火车票的时间(格式:2018-01-15)
  *           required: true
  *           type: string
  *         - name: from
  *           in: query
  *           description: 火车目的地(全拼音,例如guangzhou)
  *           required: true
  *           type: string
  *         - name: to
  *           in: query
  *           description: 火车出发地(全拼音,例如beijingxi)
  *           required: true
  *           type: string
  *         - name: mail
  *           in: query
  *           description: 用于接收邮箱的邮箱地址
  *           required: false
  *           type: string
  *       produces:
  *         - application/json
  *       responses:
  *         200:
  *           description:OK
  */
app.get("/checkTrainTicket", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        //res.json({data:"开始查询余票信息，请注意查看您的微信及邮件通知哦"})
        let userName = req.query.userName;
        // 如果用户不是我的好友，先让其添加为好友
        let isFriend = yield WechatMessage_1.WechatMessage.isFriend(userName);
        if (isFriend === false) {
            res.sendFile(path.join(__dirname, "../public/mywechat.html"));
            return;
        }
        let user = {};
        user["trainDate"] = req.query.trainDate;
        user["from"] = req.query.from;
        user["to"] = req.query.to;
        user["mail"] = req.query.mail;
        user["isStart"] = req.query.isStart || "true";
        userInfo[userName] = user;
        res.json({ data: `开始为您查询${req.query.trainDate}从${station.stationInfo[req.query.from].name}到${station.stationInfo[req.query.to].name}的余票信息` });
        // 写入文件中
        fs.writeFile("./UserInfo.json", JSON.stringify(userInfo), function (err) {
            if (err) {
                console.log("用户信息写入失败!");
                console.log(err);
            }
        });
        // 查询余票信息，并将信息传给用户
        let checkTicketInfo = new CheckTicket_1.CheckTicketInfo(userName, userInfo[userName].mail, userInfo[userName].trainDate, userInfo[userName].from, userInfo[userName].to);
        // 60秒查询一次
        setInterval(() => __awaiter(this, void 0, void 0, function* () {
            checkTicketInfo = yield CheckTicket_1.CheckTicket.checkTicket(checkTicketInfo);
            let message = CheckTicket_1.CheckTicket.getTicketInfoMessage(checkTicketInfo);
            if (message !== null) {
                // 发送微信信息
                WechatMessage_1.WechatMessage.sendMessage(message.wechatMessage);
                // 发送邮箱信息
                if (message.mailMessage["receiveMail"] !== "") {
                    MailMessage_1.MailMessage.sendMessage(message.mailMessage);
                }
            }
        }), 5000);
    });
});
/**
   * @swagger
   * /addFriend:
   *   get:
   *       description: 添加好友,请复制链接在地址栏中直接打开
   *       deprecated: false
   *       tags:
   *           - "查询余票信息"
   *       produces:
   *         - application/json
   *       responses:
   *         200:
   *           description:OK
   */
app.get("/addFriend", function (req, res) {
    res.sendFile(path.join(__dirname, "../public/mywechat.html"));
});
app.listen(3000);
process.on("uncaughtException", function (err) {
    console.log(err);
});
process.on("unhandledRejection", function (err) {
    console.log(err);
});
//# sourceMappingURL=app.js.map