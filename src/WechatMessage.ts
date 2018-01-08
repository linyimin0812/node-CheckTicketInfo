import {Wechaty, Contact, Room} from "wechaty";
import * as  qrcode from "qrcode-terminal";
import {CheckTicketInfo, CheckTicket} from "./CheckTicket";
import * as fs from "fs";

// 使用wechaty进行个人微信号的开发
const bot = Wechaty.instance(); 
bot.start();
bot.on("scan", function(url ,code){
    if(code == 0){
        // 在服务器端打印出登录所需的二维码
        let baseUrl: string = url.replace("qrcode", "l");
        qrcode.generate(baseUrl, {small:true});
    }
}).on("login", function(user){
    console.log(`User ${user} login`);
}).on("friend", async function(contact, request){
    if(request){
        await request.accept();
        console.log(`Contact: ${contact.name()} send request ${request.hello}`)
    }
});


/**
 * 向用户发送微信信息
 */

 class WechatMessage{
     /**
      * 通过微信向用户发送信息
      * @param content 
      */
     public static async sendMessage(content){
         // 查找用户
         let contact: Contact = await Contact.find({name: content.userName});
         // 查找群用户
         let room: Room = await Room.find({topic: content.userName});
         // 用户存在
         if(contact){
            await contact.say(content.content);
            console.log("微信发送成功");
         }
     }

     /**
      * 判断微信昵称是否是登录微信的好友
      * @param userName 
      */
     public static async isFriend(userName: string): Promise<boolean>{
          // 查找用户
          let contact: Contact = await Contact.find({name: userName});
          // 用户存在
          if(contact){
             return true;
          }
          return false;
     }

     public static async handleMessage(userInfo){
         bot.on("message", async function(message){
             let content = message.content();
             // 获取发送信息的用户信息
             let contact: Contact = message.from();
             if(content === "查看余票信息"){
                // 如果用户信息已经存在，直接查询
                if(userInfo[contact.name()]){
                    let name: string = contact.name();
                    let mail: string = userInfo[name].mail;
                    let date: string = userInfo[name].trainDate;
                    let from: string = userInfo[name].from;
                    let to: string = userInfo[name].to;
                    CheckTicket.checkTicket(new CheckTicketInfo(name, mail, date, from, to));
                }else{
                    // 否则提示输入信息
                    let data: string = `欢迎使用火车余票查询系统，请按照以下格式输入相关信息`;
                    await contact.say(data);
                    data = `例如您想乘坐1月15号从北京西到广州的火车，请输入"2018-01-15;beijingxi;guangzhou"`;
                    await contact.say(data);
                }
             }
             if(/.*;.*;.*/.test(content)){
                let name: string = contact.name();
                let data: string[] = content.split(";");
                let date: string = data[0];
                let from: string = data[1];
                let to: string = data[2];
                let user = {};
                user["trainDate"] = date;
                user["from"] = from;
                user["to"] = to;
                user["ticketType"] = "ADULT";
                user["mail"] = "";
                user["isStart"] = "true";
                userInfo[name] = user;
                fs.writeFile("./UserInfo.json", JSON.stringify(userInfo), function(err){
                    console.log(err);
                });
                let checkTicketInfo: CheckTicketInfo = new CheckTicketInfo(name, "", date, from, to);
                setInterval(async () => {
                    checkTicketInfo = await CheckTicket.checkTicket(checkTicketInfo);
                    CheckTicket.sendTicketInfoMessage(checkTicketInfo);
                }, 5000);
             }
         });
     }
 }

 export{WechatMessage};