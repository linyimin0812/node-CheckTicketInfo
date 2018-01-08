import * as https from "https"
import * as iconv from "iconv-lite";
import * as express from "express"
import {Request, Response} from "express";
import * as dotenv from "dotenv";
import { MailMessage } from "./MailMessage";
import { WechatMessage } from "./WechatMessage";
import {CheckTicketInfo, CheckTicket} from "./CheckTicket";
import {TicketInfo} from "./TicketInfo"
import * as fs from "fs";
import * as path from "path";
import {SwaggerFile} from "./SwaggerFile"

// 加载配置环境
dotenv.config();

// 产生swagger配置文件
SwaggerFile.generateFile();
const app = express();

app.use(express.static(path.join(__dirname, "../public")));

// 加载用户信息
let userInfo = require("../UserInfo");
// 加载车站信息
let station = require("../station");


// 微信端使用
WechatMessage.handleMessage(userInfo);


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
app.get("/checkTrainTicket", async function(req : Request, res: Response){
    //res.json({data:"开始查询余票信息，请注意查看您的微信及邮件通知哦"})
    let userName: string = req.query.userName;
    // 如果用户不是我的好友，先让其添加为好友
    let isFriend: boolean = await WechatMessage.isFriend(userName);
    if(isFriend === false){
        res.sendFile(path.join(__dirname,"../public/mywechat.html"));
        return;
    }
    let user = {};
    user["trainDate"] = req.query.trainDate;
    user["from"] = req.query.from;
    user["to"] = req.query.to;
    user["mail"] = req.query.mail;
    user["isStart"] = req.query.isStart || "true";
    userInfo[userName] = user;
    res.json({data:`开始为您查询${req.query.trainDate}从${station.stationInfo[req.query.from].name}到${station.stationInfo[req.query.to].name}的余票信息`});
    // 写入文件中
    fs.writeFile("./UserInfo.json", JSON.stringify(userInfo), function(err){
        if(err){
            console.log("用户信息写入失败!");
            console.log(err);
        }
    });
    // 查询余票信息，并将信息传给用户
    let checkTicketInfo: CheckTicketInfo = new CheckTicketInfo(userName, userInfo[userName].mail, userInfo[userName].trainDate, userInfo[userName].from, userInfo[userName].to);
    // 60秒查询一次
    setInterval(async () => {
        checkTicketInfo = await CheckTicket.checkTicket(checkTicketInfo);
        let message = CheckTicket.getTicketInfoMessage(checkTicketInfo);
        if(message !== null){
            // 发送微信信息
            WechatMessage.sendMessage(message.wechatMessage);
            // 发送邮箱信息
            if(message.mailMessage["receiveMail"] !== ""){
                MailMessage.sendMessage(message.mailMessage);
            }
        }
       
    }, 5000);
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
app.get("/addFriend", function(req: Request, res: Response){
    res.sendFile(path.join(__dirname, "../public/mywechat.html"));
})
    

app.listen(3000);
 process.on("uncaughtException",function(err){
     console.log(err);
 });

 process.on("unhandledRejection",function(err){
    console.log(err);
});