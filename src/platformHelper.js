import { ipcRenderer, isElectron } from "@/platform";
import { stringValue } from "@/wfc/util/longUtil";
import { remote } from "./platform";
import wfc from "./wfc/client/wfc";
import { toRaw } from "vue";
import SavePathType from "./savePathType";
/**
 * 消息内文件预览或下载【有messageId】
 * message {
 *  ...message
 *  isOpen:Boolean 是否打开，
 *  savePath:String 保存路径
 * }
 *  */
export function downloadFile(message, isOpen = false) {
    let file = message.messageContent;
    if (isElectron()) {
        ipcRenderer.send("file-download", {
            messageUid: stringValue(message.messageUid),
            remotePath: file.remotePath,
            fileName: file.name || file.fileName,
            isOpen, // isOpen  是否设置自动打开文件
            savePath: SavePathType.Message, // 保存路径
            fromTarget: message.conversation.target, // 消息来源（群id/单聊Id）
            userId: wfc.getUserId(),
            windowId: remote.getCurrentWindow().getMediaSourceId(),
        });
    } else {
        let fileHref = file.remotePath;
        let filename = file.name;
        if (window.navigator.msSaveBlob) {
            // ie
            let xhr = new XMLHttpRequest();
            xhr.onloadstart = function() {
                xhr.responseType = "blob";
            };
            xhr.onload = function() {
                navigator.msSaveOrOpenBlob(xhr.response, filename);
            };
            xhr.open("GET", fileHref, true);
            xhr.send();
        } else {
            let anchor = document.createElement("a");
            anchor.download = filename;
            anchor.href = fileHref;
            anchor.target = "about:blank";
            anchor.click();
        }
    }
}
/**
 * 非消息文件预览或下载
 * file {
 *  fileName,
 *  url
 *  isOpen:Boolean 是否打开,
 *  savePath: String 保存路径
 * }
 *  */
export function downloadOtherFile(file, isOpen = false, savePath) {
    if (isElectron()) {
        let { url, fileName } = file
        ipcRenderer.send("file-other-download", {
            fileName,
            url,
            isOpen,
            savePath, // 保存路径
            userId: wfc.getUserId(),
            windowId: remote.getCurrentWindow().getMediaSourceId(),
        });
    }
}
/**
 * 预览图片和视频
 * {previewInfo} 预览信息 视频: {src:String , name:String, thumbnail:String} 图片: {images:Array,index:Number}
 * {type} 预览类型 0 图片 1视频
 **/

export function previewImagesOrVideo(previewInfo, type) {
    if ((type && !previewInfo.src) || (!type && previewInfo.images && !previewInfo.images.length)) return
    let hash = window.location.hash;
    let url = window.location.origin;
    if (hash) {
        url = window.location.href.replace(hash, `#/previewmedia?ts=${+new Date()}`);
    } else {
        url += `/previewmedia?ts=${+new Date()}`
    }
    let data = type ? {
        ...previewInfo
    } : {
        images: toRaw(previewInfo.images),
        index: Number(previewInfo.index),
    }
    ipcRenderer.send("show-previewMedia-window", {
        url,
        type,
        ...data
    });
}
