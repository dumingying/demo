/**
 * 大概流程
 *  采用类 client-server 模式实现开放平台 js sdk，有两部分相关代码：
 * 1. client 运行在工作台所加载的 webview 里面
 * 2. server 直接运行在工作台页面里面，也就是主窗口的渲染进程
 * 3. client 和 server 之间的交互，通过 websocket 进行中转
 * 4. window 系统 本地无法调试，打包安装调试正常
 */

let callbackMap = new Map();
let eventListeners = {};
let requestId = 0;
let client;
let windowId;

async function init() {
    return new Promise(async (resolve, reject) => {
        windowId = await require("electron").ipcRenderer.invoke(
            "getMediaSourceId"
        );
        client = new WebSocket("ws://127.0.0.1:" + 6869 + "/");
        client.onmessage = async (ev) => {
            let obj;
            let data = await ev.data.text();
            try {
                obj = JSON.parse(data);
            } catch (e) {
                console.error("parse ws data error", e);
                return;
            }
            if (obj.windowId !== windowId || obj.appUrl !== location.href) {
                console.log("ignore wf-op data", obj);
                return;
            }
            if (obj.type === "chainpal-webview-event") {
                handleOpEvent(obj.handlerName, obj.args);
            } else if (obj.type === "chainpal-webview-response") {
                handleOpResponse(obj.requestId, obj.args);
            }
        };
        client.onopen = () => {
            resolve();
        };

        console.log("bridgeClientImpl init");
    });
}

// 发送方法到server层
async function postMessage(json, callback) {
    if (!json) {
        return;
    }
    if (!client) {
        await init();
    }
    let data = json;
    if (typeof json === "string") {
        data = JSON.parse(json);
    }
    let reqId = 0;
    if (callback && typeof callback === "function") {
        reqId = requestId++;
        callbackMap.set(reqId, callback);
    }
    let appUrl = location.href;
    let obj = {
        type: "chainpal-webview-request",
        requestId: reqId,
        windowId,
        appUrl,
        handlerName: data.name,
        args: json,
    };
    console.log("chainpal-webview-request", obj);
    client.send(JSON.stringify(obj));
}

function handleOpResponse(requestId, args) {
    console.log("handle op response", requestId, args);
    let cb = callbackMap.get(requestId);
    if (cb) {
        cb(args);
        callbackMap.delete(requestId);
    }
}

function handleOpEvent(handlerName, args) {
    window[handlerName] && window[handlerName](args);
}

function register(handlerName, callback) {
    eventListeners[handlerName] = callback;
}

window.ReactNativeWebView = {
    postMessage: postMessage,
    register: register,
};

try {
    // electron的BrowserWindow设置nodeIntegration为true时，导致页面可以访问node的module影响页面正常模块引入功能，如jQuery
    document.addEventListener("DOMNodeInserted", function (event) {
        // 页面内容加载之前需要引入的一些代码
        if (document.head && !document.getElementById("module")) {
            var script = document.createElement("script");
            script.setAttribute("id", "module");
            script.innerHTML =
                "if (typeof module === 'object') {window.module = module; module = undefined;}";
            document.head.appendChild(script);
        }
    });
} catch (error) {
    console.log(error);
}
