// import WebSocket from "ws";

/**
 * 大概流程
 *  采用类 client-server 模式实现开发平台 js sdk，有两部分相关代码：
 * 1. client 运行在工作台所加载的 webview 里面
 * 2. server 直接运行在工作台页面里面，也就是主窗口的渲染进程
 * 3. client 和 server 之间的交互，通过 websocket 进行中转
 *
 */

let handlers;
let client;
let mWfc;
let mHostPage;

export function init(wfc, hostPage, wsPort) {
    console.log("bridgeServerImpl init 0000");
    mWfc = wfc;
    mHostPage = hostPage;
    // 存在且是在线状态 返回 无需要在建立链接
    if (client && client.readyState === 1) {
        return;
    }
    console.log("bridgeServerImpl init 1111");
    client = new WebSocket("ws://127.0.0.1:" + wsPort + "/");
    // 监听消息
    // client.addEventListener("message", function(event) {
    client.onmessage = (event) => {
        event.data.text().then(async (data) => {
            let obj;
            try {
                obj = JSON.parse(data);
            } catch (e) {
                console.error("parse ws data error", e);
                return;
            }
            let curWinId = await require("electron").ipcRenderer.invoke(
                "getMediaSourceId"
            );
            if (curWinId !== obj.windowId) {
                return;
            }
            console.log("chainpal-webview-request", obj);
            if (obj.type === "chainpal-webview-request") {
                if (handlers[obj.handlerName]) {
                    handlers[obj.handlerName](obj);
                } else {
                    console.log(
                        "chainpal-webview-request, unknown handlerName",
                        obj.handlerName
                    );
                }
            }
        });
    };

    handlers = {
        NativeShare: getNativeShareModal, // 分享链接
        LightApplication: getAuthCode, // 授权
        ShowChannelInfo: goToChannelInfo, // 公众号
        CloudFileSelector: getCloudFileSelector, // 天天打卡=>链上文档
        OpenSingleConversation: goToConversation, // 天天打卡=> 聊天 个人
        OpenSingleConversation_v2: goToConversation, // 天天打卡=> 聊天 个人
        OpenGroupConversation: goToConversation, // 天天打卡=> 聊天 群
        OpenNewPage: goToNewPage,
        GetLocalGroupChatList: getLocalGroupChatList, // 天天打卡 =>获取本地群聊列表
        GetWebsiteInfo: getWebsiteInfo, // 天天打卡 =>获取链接信息
        ShareTextContentToContacts: goToshareTextContentToContacts, // 链上打卡 =>转发文字
        ShareBusinessCardImage: goToContactShareImage, // 分享名片图片
        SaveLocalPhotoAlbum: goToBusinessCardDownloadImage, // 保存名片到相册
        CloseWebView: goToCloseWebView, // 关闭当前webview
    };
}

// H5   分享（对应移动端的分享面板）
let getNativeShareModal = (obj) => {
    let { args, appUrl } = obj;
    mHostPage.getNativeShareModal({ args, appUrl });
};
// 轻应用授权登录方法 LightApplication 回调web的chainMeetCheckAccount方法
let getAuthCode = (obj) => {
    let { args, appUrl } = obj;
    mHostPage.getAuthCode({ args, appUrl }, (data) => {
        _sendEvent("chainMeetCheckAccount", obj.appUrl, data);
    });
};

// H5 唤起公众号信息
let goToChannelInfo = (obj) => {
    let { args, appUrl } = obj;
    mHostPage.goToChannelInfo({ args, appUrl });
};

// H5 唤起云盘列表
let getCloudFileSelector = (obj) => {
    let { args, appUrl } = obj;
    mHostPage.getCloudFileSelector({ args, appUrl }, (data) => {
        _sendEvent("cloudFileSelectResult", obj.appUrl, data);
    });
};
// H5 唤起聊天（个人，群聊）
let goToConversation = (obj) => {
    let { args, appUrl } = obj;
    mHostPage.goToConversation({ args, appUrl });
};
// H5内部打开新页面
let goToNewPage = (obj) => {
    let { args, appUrl } = obj;
    mHostPage.goToNewPage({ args, appUrl });
};
// H5内部内执行关闭当前webview
let goToCloseWebView = (obj) => {
    let { args, appUrl } = obj;
    mHostPage.goToCloseWebView({ args, appUrl });
};

// H5获取本地群组列表
let getLocalGroupChatList = (obj) => {
    let { args, appUrl } = obj;
    mHostPage.getLocalGroupChatList({ args, appUrl }, (data) => {
        _sendEvent("localGroupChatListResult", obj.appUrl, data);
    });
};
// H5获取分享信息
let getWebsiteInfo = (obj) => {
    let { args, appUrl } = obj;
    mHostPage.getWebsiteInfo({ args, appUrl }, (data) => {
        _sendEvent("websiteInfoResult", obj.appUrl, data);
    });
};
// 链上打卡，文字转发
let goToshareTextContentToContacts = (obj) => {
    let { args, appUrl } = obj;
    mHostPage.goToshareTextContentToContacts({ args, appUrl });
};
// 链上名片，图片分享
let goToContactShareImage = (obj) => {
    let { args, appUrl } = obj;
    mHostPage.goToContactShareImage({ args, appUrl });
};
let goToBusinessCardDownloadImage = (obj) => {
    let { args, appUrl } = obj;
    mHostPage.goToBusinessCardDownloadImage({ args, appUrl });
};

//检测是否连接 Websocket
export function checkWebsocket() {
    return (client && client.readyState !== 1) || !client;
}

// 发送回调到webview层
async function _sendEvent(handlerName, appUrl, args) {
    let obj = {
        type: "chainpal-webview-event",
        handlerName,
        appUrl,
        windowId: await require("electron").ipcRenderer.invoke(
            "getMediaSourceId"
        ),
        args,
    };
    console.log("send event", obj);
    client.send(JSON.stringify(obj));
}
