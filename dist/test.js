// // const { Wechaty, Room } = require('wechaty')
// // const bot = Wechaty.instance(); // Singleton
// // bot.on('scan', function(url, code){
// //     let loginUrl = url.replace('qrcode', 'l');
// //     require('qrcode-terminal').generate(loginUrl, {small: true});
// // })
// // .on('login', function(user){
// //     console.log(`User ${user} login`)
// // }) 
// // .on('message',  function(message){
// //     console.log(`Message: ${message}`);
// //         const contact = message.from();
// //         if(message.self()){
// //             console.log(contact.name());
// //         }
// //         (async () => {
// //             const room = await Room.find({topic:"一天一个概念"});
// //             if(room){
// //                 room.say('Hello world');
// //             }else{
// //                 console.log("未找到该群");
// //             }
// //         })();
// // } );
// // bot.start();
// // process.on("unhandledRejection", function(err){
// //     console.log(err);
// // })
// import {CheckTicketInfo, CheckTicket} from "./CheckTicket";
// import * as dotenv from "dotenv";
// dotenv.config();
// let checkTicketInfo: CheckTicketInfo = new CheckTicketInfo("HiYellowC", "15289842383@163.com", "true", "2018-01-15", "beijingxi", "guangzhou");
// CheckTicket.checkTicket(checkTicketInfo);
if (/.*;.*;.*/.test("nihao;nihao;nihao")) {
    console.log(true);
}
//# sourceMappingURL=test.js.map