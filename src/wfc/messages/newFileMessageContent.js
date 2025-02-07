/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MessageContentMediaType from "./messageContentMediaType";
import MediaMessageContent from "./mediaMessageContent";
import MessageContentType from "./messageContentType";
import { getItem } from "@/ui/util/storageHelper";
export default class FileMessageContent extends MediaMessageContent {
    name = '';
    size = 0;

    imFileId;
    // imFileName;
    // imFileSize;

    constructor(fileOrLocalPath, remotePath, name, size, imFileId) {
        super(MessageContentType.File, MessageContentMediaType.File, fileOrLocalPath, remotePath);
        if (fileOrLocalPath && fileOrLocalPath.name) {
            this.name = fileOrLocalPath.name;
            this.size = fileOrLocalPath.size;
        } else if (remotePath) {
            this.name = name ? name : remotePath.substring(remotePath.lastIndexOf('/') + 1)
            this.size = size ? size : 0;
        }
        this.imFileId = imFileId
    }

    digest() {
        let lang = getItem('lang')
        let str = lang === 'en' ? '[File]' : "[文件]";
        return str + this.name;
    }

    encode() {
        let payload = super.encode();
        payload.searchableContent = this.name;
        payload.content = JSON.stringify({
            size: this.size + '',
            imFileId: this.imFileId + ''
        });
        // payload.imFileId = this.imFileId + ''
        // payload.content = this.size + ''
        // let obj = {
        //     size: this.size + '',
        //     name: this.name,
        //     imFileId: this.imFileId,
        //     imFileName: this.imFileName,
        //     imFileSize: this.imFileSize + '',
        // }
        // payload.content = JSON.stringify(obj)
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        if (payload.searchableContent) {
            if (payload.searchableContent.indexOf(FileMessageContent.FILE_NAME_PREFIX) === 0) {
                this.name = payload.searchableContent.substring(payload.searchableContent.indexOf(FileMessageContent.FILE_NAME_PREFIX) + FileMessageContent.FILE_NAME_PREFIX.length);
            } else {
                this.name = payload.searchableContent;
            }
            // console.log(payload, '======');
            let content = JSON.parse(payload.content);
            // 兼容历史错误类型问题
            if (typeof content === 'object') {
                this.size = Number(content.size);
                this.imFileId = content.imFileId;
            } else {
                this.size = Number(payload.content);
                this.imFileId = payload.imFileId
                // this.imFileName = payload.imFileName
                // this.imFileSize = payload.imFileSize
            }
        }
    }

}
