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


     /**
      * 给自己发送消息
      * @param contact 
      * @param content 
      */
     public static async sendMessageToSelf(contact: Contact, content){
        if(contact){
            await contact.say(content);
            console.log("发送微信消息成功");
        }else{
            console.log("该用户不存在, 无法发送微信消息");
        }
     }
     public static async handleMessage(userInfo){
         bot.on("message", async function(message){
             let content = message.content();
             // 获取发送信息的用户信息
             let contact: Contact = message.from();
             if(content === "查看余票信息"){
                // 提示输入信息
                let data: string = `欢迎使用火车余票查询系统，请按照以下格式输入相关信息`;
                await contact.say(data);
                data = `如果您想查看1月15号从北京到广州的所有火车余票信息，请输入"2018-01-15;beijing;guangzhou"`;
                await contact.say(data);
                data = `如果您想查看1月15号从北京到广州的指定火车车次余票信息，请输入"2018-01-15;beijing;guangzhou;Z201"`;
                await contact.say(data);
             }else if(/.*;.*;.*/.test(content) && /如果*/.test(content) === false){
                let name: string = contact.name();
                let data: string[] = content.split(";");
                let date: string = data[0];
                let from: string = data[1];
                let to: string = data[2];
                let trainNo: string = data[3] || "";
                let user = {};
                user["trainNo"] = trainNo;
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
                    let message = CheckTicket.getTicketInfoMessage(checkTicketInfo);
                    if(message === null){
                        return;
                    }
                    // 发送指定车次信息
                    if(trainNo !== ""){
                        let len: number = checkTicketInfo.currentResult.length;
                        for(let i =0 ; i < len; i++){
                            if(trainNo === checkTicketInfo.currentResult[i].trainNo){
                                let temp = checkTicketInfo.currentResult[i];
                                checkTicketInfo.currentResult = [];
                                checkTicketInfo.currentResult[0] = temp;
                                break;
                            }
                        }
                        len = checkTicketInfo.lastResult.length;
                        for(let i = 0; i < len; i++){
                            if(trainNo === checkTicketInfo.lastResult[i].trainNo){
                                let temp = checkTicketInfo.lastResult[i];
                                checkTicketInfo.lastResult = [];
                                checkTicketInfo.lastResult[0] = temp;
                                break;
                            }
                        }
                        console.log(checkTicketInfo.currentResult.length);
                        message = CheckTicket.getTicketInfoMessage(checkTicketInfo);
                        if(message === null){
                            return;
                        }
                    }
                    if(contact.self()){
                        WechatMessage.sendMessageToSelf(contact, message.wechatMessage["content"]);
                    }else{
                        WechatMessage.sendMessage(message.wechatMessage);
                    }
                    
                }, 5000);
             }
         });
     }
 }

 export{WechatMessage};