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
    static handleMessage(userInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            bot.on("message", function (message) {
                return __awaiter(this, void 0, void 0, function* () {
                    let content = message.content();
                    // 获取发送信息的用户信息
                    let contact = message.from();
                    if (content === "查看余票信息") {
                        // 如果用户信息已经存在，直接查询
                        if (userInfo[contact.name()]) {
                            let name = contact.name();
                            let mail = userInfo[name].mail;
                            let date = userInfo[name].trainDate;
                            let from = userInfo[name].from;
                            let to = userInfo[name].to;
                            CheckTicket_1.CheckTicket.checkTicket(new CheckTicket_1.CheckTicketInfo(name, mail, date, from, to));
                        }
                        else {
                            // 否则提示输入信息
                            let data = `欢迎使用火车余票查询系统，请按照以下格式输入相关信息`;
                            yield contact.say(data);
                            data = `例如您想乘坐1月15号从北京西到广州的火车，请输入"2018-01-15;beijingxi;guangzhou"`;
                            yield contact.say(data);
                        }
                    }
                    if (/.*;.*;.*/.test(content)) {
                        let name = contact.name();
                        let data = content.split(";");
                        let date = data[0];
                        let from = data[1];
                        let to = data[2];
                        let user = {};
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
                            CheckTicket_1.CheckTicket.sendTicketInfoMessage(checkTicketInfo);
                        }), 5000);
                    }
                });
            });
        });
    }
}
exports.WechatMessage = WechatMessage;
//# sourceMappingURL=WechatMessage.js.map