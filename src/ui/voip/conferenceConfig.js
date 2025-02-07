import ConferenceInviteMessageContent from "@/wfc/av/messages/conferenceInviteMessageContent";
import Message from "@/wfc/messages/message";
import wfc from "@/wfc/client/wfc";
import dayjs from "dayjs";

// 邀请会议的消息体
export const getInviteMessageContent = (data) => {
    let detail = { ...data };
    // 处理格式不统一问题
    if (detail.imMeetingCallId || detail.imMeetingTitle) {
        let {
            imMeetingCallId: callId,
            imMeetingTitle: title,
            imMeetingEndTime: endTime,
            imMeetingStartTime: startTime,
            imMeetingCode: code,
            imCreateMeeting,
            isPasswordNeed,
            password,
            type,
        } = data;
        let {
            description,
            host,
            audioOnly,
            advance,
            pin: imPin,
        } = imCreateMeeting;
        detail = {
            callId,
            title,
            endTime,
            startTime,
            code,
            isPasswordNeed,
            password,
            type,
            description,
            host,
            audioOnly,
            advance,
            imPin,
        };
    } else {
        detail = {
            ...data,
            audioOnly: false,
            advance: false,
            host: wfc.getUserId(),
        };
    }
    let {
        callId,
        title,
        description,
        startTime,
        imPin,
        endTime,
        code,
        type,
        isPasswordNeed,
        password,
        audioOnly,
        advance,
        host,
    } = detail;
    let inviteMessageContent = new ConferenceInviteMessageContent(
        callId,
        host,
        title,
        description,
        new Date(startTime).getTime(),
        audioOnly, // audioOnly,
        true, // audience,
        advance, // advance
        imPin, //pin,
        new Date(endTime).getTime(),
        code,
        type,
        isPasswordNeed, // 是否密码
        password // 具体密码
    );
    let messageContent = Message.messageContentFromMessagePayload(
        inviteMessageContent.encode(),
        wfc.getUserId()
    );
    let inviteMessage = new Message(null, messageContent);
    return inviteMessage;
};
// 生成会议基本信息（预约会议，快速会议中使用）
export const createConferenceInfo = (type, { meetingTitle }) => {
    let currentTime = dayjs().format("YYYY-MM-DD HH:mm");
    let info = {
        userId: wfc.getUserId(),
        type,
        title: meetingTitle,
        scheduleTime: currentTime, //预约时间
        startTime: currentTime, //会议实际开始时间
        endTime: currentTime, //会议实际结束时间
        isPasswordNeed: "", // 是否需要密码 0-不需要；1-需要
        password: "", // 会议密码
        isDesignatedParticipant: 0, //是否是指定成员会议 0-非；1-是
        designatedParticipantIds: [], //指定 成员id数组
        isCycle: 0, // 是否是周期会议 0-否；1-是
        cycleType: 0, //  周期会议类型
        description: "", // 会议描述
    };
    // 快速会议 需要多添加野火相关传参
    let callId = `${wfc.getUserId()}|${+new Date()}`;
    let pin = Math.ceil(Math.random() * 1000000) + "";
    info.imCreateMeeting = { pin, roomId: callId };
    return info;
};
