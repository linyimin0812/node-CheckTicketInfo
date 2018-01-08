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
const wechaty_1 = require("wechaty");
const qrcode = require("qrcode-terminal");
const CheckTicket_1 = require("./CheckTicket");
const fs = require("fs");
// 使用wechaty进行个人微信号的开发
const bot = wechaty_1.Wechaty.instance();
bot.start();
bot.on("scan", function (url, code) {
    if (code == 0) {
        // 在服务器端打印出登录所需的二维码
        let baseUrl = url.replace("qrcode", "l");
        qrcode.generate(baseUrl, { small: true });
    }
}).on("login", function (user) {
    console.log(`User ${user} login`);
}).on("friend", function (contact, request) {
    return __awaiter(this, void 0, void 0, function* () {
        if (request) {
            yield request.accept();
            console.log(`Contact: ${contact.name()} send request ${request.hello}`);
        }
    });
});
/**
 * 向用户发送微信信息
 */
class WechatMessage {
    /**
     * 通过微信向用户发送信息
     * @param content
     */
    static sendMessage(content) {
        return __awaiter(this, void 0, void 0, function* () {
            // 查找用户
            let contact = yield wechaty_1.Contact.find({ name: content.userName });
            // 查找群用户
            let room = yield wechaty_1.Room.find({ topic: content.userName });
            // 用户存在
            if (contact) {
                yield contact.say(content.content);
                console.log("微信发送成功");
            }
        });
    }
    /**
     * 判断微信昵称是否是登录微信的好友
     * @param userName
     */
    static isFriend(userName) {
        return __awaiter(this, void 0, void 0, function* () {
            // 查找用户
            let contact = yield wechaty_1.Contact.find({ name: userName });
            // 用户存在
            if (contact) {
                return true;
            }
            return false;
        });
    }
    /**
     * 给自己发送消息
     * @param contact
     * @param content
     */
    static sendMessageToSelf(contact, content) {
        return __awaiter(this, void 0, void 0, function* () {
            if (contact) {
                yield contact.say(content);
                console.log("发送微信消息成功");
            }
            else {
                console.log("该用户不存在, 无法发送微信消息");
            }
        });
    }
    static handleMessage(userInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            bot.on("message", function (message) {
                return __awaiter(this, void 0, void 0, function* () {
                    let content = message.content();
                    // 获取发送信息的用户信息
                    let contact = message.from();
                    if (content === "查看余票信息") {
                        // 提示输入信息
                        let data = `欢迎使用火车余票查询系统，请按照以下格式输入相关信息`;
                        yield contact.say(data);
                        data = `如果您想查看1月15号从北京到广州的所有火车余票信息，请输入"2018-01-15;beijing;guangzhou"`;
                        yield contact.say(data);
                        data = `如果您想查看1月15号从北京到广州的指定火车车次余票信息，请输入"2018-01-15;beijing;guangzhou;Z201"`;
                        yield contact.say(data);
                    }
                    else if (/.*;.*;.*/.test(content) && /如果*/.test(content) === false) {
                        let name = contact.name();
                        let data = content.split(";");
                        let date = data[0];
                        let from = data[1];
                        let to = data[2];
                        let trainNo = data[3] || "";
                        let user = {};
                        user["trainNo"] = trainNo;
                        user["trainDate"] = date;
                        user["from"] = from;
                        user["to"] = to;
                        user["ticketType"] = "ADULT";
                        user["mail"] = "";
                        user["isStart"] = "true";
                        userInfo[name] = user;
                        fs.writeFile("./UserInfo.json", JSON.stringify(userInfo), function (err) {
                            console.log(err);
                        });
                        let checkTicketInfo = new CheckTicket_1.CheckTicketInfo(name, "", date, from, to);
                        setInterval(() => __awaiter(this, void 0, void 0, function* () {
                            checkTicketInfo = yield CheckTicket_1.CheckTicket.checkTicket(checkTicketInfo);
                            let message = CheckTicket_1.CheckTicket.getTicketInfoMessage(checkTicketInfo);
                            if (message === null) {
                                return;
                            }
                            // 发送指定车次信息
                            if (trainNo !== "") {
                                let len = checkTicketInfo.currentResult.length;
                                for (let i = 0; i < len; i++) {
                                    if (trainNo === checkTicketInfo.currentResult[i].trainNo) {
                                        let temp = checkTicketInfo.currentResult[i];
                                        checkTicketInfo.currentResult = [];
                                        checkTicketInfo.currentResult[0] = temp;
                                        break;
                                    }
                                }
                                len = checkTicketInfo.lastResult.length;
                                for (let i = 0; i < len; i++) {
                                    if (trainNo === checkTicketInfo.lastResult[i].trainNo) {
                                        let temp = checkTicketInfo.lastResult[i];
                                        checkTicketInfo.lastResult = [];
                                        checkTicketInfo.lastResult[0] = temp;
                                        break;
                                    }
                                }
                                console.log(checkTicketInfo.currentResult.length);
                                message = CheckTicket_1.CheckTicket.getTicketInfoMessage(checkTicketInfo);
                                if (message === null) {
                                    return;
                                }
                            }
                            if (contact.self()) {
                                WechatMessage.sendMessageToSelf(contact, message.wechatMessage["content"]);
                            }
                            else {
                                WechatMessage.sendMessage(message.wechatMessage);
                            }
                        }), 5000);
                    }
                });
            });
        });
    }
}
exports.WechatMessage = WechatMessage;
//# sourceMappingURL=WechatMessage.js.map