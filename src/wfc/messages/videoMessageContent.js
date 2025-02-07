/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MediaMessageContent from './mediaMessageContent'
import MessageContentMediaType from './messageContentMediaType';
import MessageContentType from './messageContentType';
import { getItem } from "@/ui/util/storageHelper";

export default class VideoMessageContent extends MediaMessageContent {
    // base64 encoded
    thumbnail;
    duration;
    imFileId;
    imFileName;
    imFileSize;
    constructor(fileOrLocalPath, remotePath, thumbnail, duration = 0) {
        super(MessageContentType.Video, MessageContentMediaType.Video, fileOrLocalPath, remotePath);
        this.thumbnail = thumbnail;
        this.duration = duration;
    }

    digest() {
        let lang = getItem('lang')
        let str = lang === 'en' ? "[Video]" : "[视频]"
        return str;
    }

    encode() {
        let payload = super.encode();
        payload.binaryContent = this.thumbnail;
        let obj = {
            d: this.duration,
            duration: this.duration,
            imFileId: this.imFileId,
            imFileName: this.imFileName,
            imFileSize: this.imFileSize,
        }
        payload.content = JSON.stringify(obj);
        payload.mediaType = MessageContentMediaType.Video;
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.thumbnail = payload.binaryContent;
        if (payload.content) {
            let obj = JSON.parse(payload.content)
            if (obj) {
                this.duration = obj.d;
                if (this.duration === undefined) {
                    this.duration = obj.duration;
                }
                this.imFileId = obj.imFileId;
                this.fileName = obj.imFileName;
                this.fileSize = obj.imFileSize;
            }
        }
    }
}
