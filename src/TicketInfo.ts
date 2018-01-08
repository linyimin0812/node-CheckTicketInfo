/**
 * 保存车次的余票的信息
 */

 interface TicketInfo{
    // 火车车次信息
    trainNo: string,
    // 出发时间
    startTime: string;
    // 到达时间
    arriveTime: string;
    // 历时
    requireTime: string;
    // 剩余软座票的数量
    rw: string;
    // 剩余硬卧票的数量
    rz: string;
    // 剩余硬卧票的数量
    yw: string;
    // 剩余硬座票的数量
    yz: string;
 }

 export{TicketInfo};