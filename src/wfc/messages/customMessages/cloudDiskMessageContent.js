import MediaMessageContent from "../mediaMessageContent";
import MessageContentType from "../messageContentType";
import { getItem } from "@/ui/util/storageHelper";

export default class CloudDiskMessageContent extends MediaMessageContent {

    fileId;
    fileName;
    iconURL;
    shareId;
    fromUserId;
    fileSize;
    previewUrl;
    imFileId;
    path;
    thumbnailURL;

    constructor(
        fileId,
        fileName,
        iconURL,
        shareId,
        fromUserId,
        fileSize,
        previewUrl,
        imFileId,
        path,
        fileOrLocalPath,
        remotePath,
    ) {
        super(MessageContentType.Cloud_Disk_Message_Content, fileOrLocalPath, remotePath,);
        remotePath = previewUrl
        this.fileId = fileId;
        this.fileName = fileName;
        this.iconURL = iconURL;
        this.operaType = '0';
        this.shareId = shareId;
        this.fromUserId = fromUserId;
        this.fileSize = fileSize;
        this.previewUrl = previewUrl;
        this.imFileId = imFileId;
        this.path = path;
    }

    digest() {
        let lang = getItem('lang')
        let str = lang === 'en' ? '[Encrypted Share]' : '[加密分享]'
        return str + this.fileName;
    }

    encode() {
        let payload = super.encode();
        let lang = getItem('lang')
        let obj = {
            fileId: this.fileId,
            fromUserId: this.fromUserId,
            fileName: this.fileName,
            iconURL: this.iconURL,
            imFileId: this.imFileId,
            previewUrl: this.previewUrl,
            shareId: this.shareId,
            operaType: this.operaType,
            fileSize: this.fileSize,
            path: this.path,
        }
        payload.content = JSON.stringify(obj);
        payload.pushContent = lang === 'en' ? 'Encrypted Share' : '加密分享' //推送
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        if (payload.content) {
            let obj = JSON.parse(payload.content);
            this.fileId = obj.fileId;
            this.fileName = obj.fileName;
            this.iconURL = obj.iconURL;
            this.operaType = obj.operaType;
            this.shareId = obj.shareId;
            this.fromUserId = obj.fromUserId;
            this.fileSize = obj.fileSize;
            this.previewUrl = obj.previewUrl;
            this.imFileId = obj.imFileId;
            this.path = obj.path;
            this.remotePath = obj.previewUrl;
        }
    }

}
