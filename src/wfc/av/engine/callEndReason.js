/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

export default class CallEndReason {
    static REASON_Unknown = 0; // 未接通
    static REASON_Busy = 1; // 线路忙 == 忙线中
    static REASON_SignalError = 2; // 网络错误
    static REASON_Hangup = 3; // 已取消 === 已挂断
    static REASON_MediaError = 4; // 网络错误
    static REASON_RemoteHangup = 5; // 对方已取消 === 已挂断
    static REASON_OpenCameraFailure = 6; // 网络错误
    static REASON_Timeout = 7; // 未接听 ===  通话未接通
    static REASON_AcceptByOtherClient = 8; // 已在其他端接听 === 已在其他端接听
    static REASON_AllLeft = 9; // 通话已结束
    static RemoteBusy = 10; // 对方已取消 === 对方忙线中
    static RemoteTimeout = 11; // 对方未接听 ===通话未接通
    static RemoteNetworkError = 12; // 对方网络错误 === 网络错误
    static RoomDestroyed = 13; // 通话已结束 === 通话结束
    static RoomNotExist = 14; // 通话已结束 ==== 通话结束
    static RoomParticipantsFull = 15; // 已达到最大通话人数 === 已达到最大通话人数
    static Interrupted = 16;
    static RemoteInterrupted = 17;

}
