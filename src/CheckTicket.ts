import * as https from "https";
import * as iconv from "iconv-lite";
import * as fs from "fs";
import * as nodehash from "nodehash";
import {MailMessage} from "./MailMessage";
import {WechatMessage} from "./WechatMessage";
import {TicketInfo} from "./TicketInfo";

const station = require("../station");
/**
 * 查询余票信息，并发送相关信息
 */

class CheckTicketInfo{
    /**
     * 保存上次查询结果
     */
    public lastResult: TicketInfo[] = [];
    /**
     * 保存当前查询结果
     */
    public currentResult: TicketInfo[] = [];

    // 保存用户名
    public userName: string;
    // 保存用户邮箱
    public mail: string;

    public hostName: string;
    public baseUrl: string;
    public date: string;
    public from: string;
    public to: string;
    public type: string;

    constructor(userName, mail, date, from, to){
        this.userName = userName;
        this.mail = mail;
        this.date = `leftTicketDTO.train_date=` + `${date}`;
        this.from = `leftTicketDTO.from_station=` + `${station.stationInfo[from].code}`;
        this.to = `leftTicketDTO.to_station=` + `${station.stationInfo[to].code}`;
        this.hostName = "https://kyfw.12306.cn";
        this.baseUrl = "/otn/leftTicket/query";
        this.type = `purpose_codes=ADULT`;
    }

    /**
     * 比较两次结果是否相同
     * @param lastResult 
     * @param currentResult 
     */
    public compare(lastResult: Array<any>, currentResult: Array<any>){
        if(lastResult.length !== currentResult.length){
            return false;
        }
        let flag = true;
        for(let i = 0; i < lastResult.length; i++){
            if(lastResult[i].rw === currentResult[i].rw && lastResult[i].rz === currentResult[i].rz && 
                lastResult[i].yw === currentResult[i].yw && lastResult[i].yz === currentResult[i].yz){
                    continue;
            }else{
                flag = false;
                break;
            }
        }
        return flag;
    }
}

class CheckTicket{
     

    /**
     * 查询余票信息,并返回余票信息
     */
    public static async checkTicket(checkTicketInfo: CheckTicketInfo): Promise<CheckTicketInfo>{
        return new Promise<CheckTicketInfo>((resolve, reject) => {
            // 保存上次查询的信息
            checkTicketInfo.lastResult = checkTicketInfo.currentResult;
            checkTicketInfo.currentResult = [];
            // 构造查询url
            let url: string = `${checkTicketInfo.hostName}${checkTicketInfo.baseUrl}?${checkTicketInfo.date}&${checkTicketInfo.from}&${checkTicketInfo.to}&${checkTicketInfo.type}`;
            console.log(url);
            https.get(url, function(res){
                let datas: Array<any> = [];
                let size: number = 0;
                // 接收数据，并保存数据的长度接收数据，并保存数据的长度
                res.on("data", function(data){
                    datas.push(data);
                    size += data.length;
                });
                res.on("end", () => {
                    let buffer: Buffer = Buffer.concat(datas, size);
                    let result: string = iconv.decode(buffer, "utf-8");
                    let queryResult = null;
                    // 访问出错时重新访问
                    try{
                        queryResult = JSON.parse(result);                    
                    }catch(err){
                        console.log(err);
                        return;
                    }
                    // 查询失败,调整url并重新查询
                    if(queryResult.status === false){
                        checkTicketInfo.baseUrl =  "/otn/" + queryResult.c_url;
                        return;
                    }
                    queryResult = queryResult.data.result;
                    for(let i = 0; i < queryResult.length; i++){
                        let data = queryResult[i].split("|");
                        let current: TicketInfo = {
                            trainNo: data[3],
                            startTime: data[8],
                            arriveTime: data[9],
                            requireTime: data[10],
                            rw: data[23] || "无",
                            rz: data[23] || "无",
                            yw: data[23] || "无",
                            yz: data[23] || "无"                    
                        };
                        checkTicketInfo.currentResult[i] = current;
                    }
                    resolve(checkTicketInfo);
                }).on("error", function(err){
                    console.error(err.stack);
                    reject(err);
                });
            });
        });
    }

    /**
     * 发送查询结果信息
     * @param checkTicketInfo 
     */
    public static sendTicketInfoMessage(checkTicketInfo: CheckTicketInfo){
        // 如果两次查询的结果不一样且有票时给用户发送数据
        let isSend = checkTicketInfo.compare(checkTicketInfo.lastResult, checkTicketInfo.currentResult);
        // 发送消息
        if(isSend !== true){
            // 构造发送的消息格式
            let content = `
                <table border="1">
                <caption>火车票剩余票数查询结果</caption>
                <tr>
                <td>车次</td>
                <td>出发时间</td>
                <td>到达时间</td>
                <td>历时</td>
                <td>软卧</td>
                <td>软座</td>
                <td>硬卧</td>
                <td>硬座</td>
                </tr>
            `;
            for(let i = 0; i < checkTicketInfo.currentResult.length; i++){
                let current = checkTicketInfo.currentResult[i];
                if(current["rw"] === "无" && current["rz"] === "无" && current["yw"] === "无" && current["yz"] === "无"){
                    continue;
                 }
                content += `
                    <tr>
                    <td>${checkTicketInfo.currentResult[i].trainNo}</td>
                    <td>${checkTicketInfo.currentResult[i].startTime}</td>
                    <td>${checkTicketInfo.currentResult[i].arriveTime}</td>
                    <td>${checkTicketInfo.currentResult[i].requireTime}</td>
                    <td>${checkTicketInfo.currentResult[i].rw}</td>
                    <td>${checkTicketInfo.currentResult[i].rz}</td>
                    <td>${checkTicketInfo.currentResult[i].yw}</td>
                    <td>${checkTicketInfo.currentResult[i].yz}</td>
                    </tr>
                `;
            }
            content += `</table>`
            let userName: string = checkTicketInfo.userName;
            let userNamePinyin: string =  nodehash.sha256FromStringSync(userName);            
            fs.writeFile(`./public/user/${userNamePinyin}-result.html`, content, (err) => {
                if(err){
                    console.log("查询结果写入文件失败,无法发送微信信息");
                    console.log(err);
                }else{
                    // 发送微信信息
                    let sendContent = {};
                    sendContent["userName"] =userName;
                    sendContent["content"] = `${process.env.HOST}:${process.env.PORT}/user/${userNamePinyin}-result.html`; 
                    WechatMessage.sendMessage(sendContent);
                }
            });
            // 如果邮箱信息部位空就向邮件发送相关信息
            if(checkTicketInfo.mail !== ""){
                MailMessage.sendMessage({"receiveMail": checkTicketInfo.mail, "content": content});
            }                                   
        }
    } 
}   
export{CheckTicketInfo, CheckTicket};