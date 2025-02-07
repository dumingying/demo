import { isElectron } from "./platform";
import { avatarBase64, thumbnailBase64 } from "./base64.js";

export default class Config {
    //  正式环境
    static APP_SERVER = "https://chat-auth.tongfudun.com";
    static DEFAULT_APP_SERVER = "https://beidou.tongfudun.com";
    static STATIC_SERVER = "https://chat-minio.tongfudun.com";

    // qa
    // static APP_SERVER = "http://192.168.109.150:8888"; // 'http://192.168.109.150:8888';
    // static DEFAULT_APP_SERVER = "http://imtest.tongfudun.com:7081"; //'http://192.168.109.150:7081'
    // static STATIC_SERVER = "https://test-minio.tongfudun.com";

    // dev
    // static APP_SERVER = "http://192.168.110.122:8888";
    // static DEFAULT_APP_SERVER = "http://imdev.arraypay.cn:7081"; //'http://192.168.110.240:7081';

    static SERVE_HOST = [
        "https://chatapi.tongfudun.com",
        "https://beidou.tongfudun.com",
        "https://tianshu.tongfudun.com",
        "https://tianxuan.tongfudun.com",
    ];

    static TWEMOJI_URL = "https://chat-minio.tongfudun.com/emoji/";
    // 调试用
    static ENABLE_AUTO_LOGIN = true;
    // 是否支持多人音视频通话
    static ENABLE_MULTI_VOIP_CALL = true;
    // 是否支持1对1音视频通话
    static ENABLE_SINGLE_VOIP_CALL = true;

    static QR_CODE_PREFIX_PC_SESSION = "wildfirechat://pcsession/";
    // turn server 配置，可以添加多个
    static ICE_SERVERS = [
        {
            uri: "turn:turn.wildfirechat.net:3478",
            userName: "wfchat",
            password: "wfchat",
        },
    ];
    static LANGUAGE = "zh_CN";

    // 兼容旧的头像连接
    static OLD_HTTP_PORTRAIT = [
        "http://chat.tongfudun.com:8989/im-fs",
        "https://chat-minio.tongfudun.com/im-fs",
    ];

    static DEFAULT_PORTRAIT_URL = avatarBase64;
    static DEFAULT_THUMBNAIL_URL = thumbnailBase64;

    // "http://192.168.109.225:8989/im-fs"; "http://imdev.arraypay.cn:8989/im-fs";

    static CLOUD_IMG_SERVER = "https://prove-image.tongfudun.com"; // 正式环境 云盘媒体资源域名
    static CLOUD_IMG_SERVER_QA = "http://192.168.109.150:8020/share"; // 测试环境 云盘媒体资源域名

    static SDK_PLATFORM_WINDOWS = 3;
    static SDK_PLATFORM_OSX = 4;
    static SDK_PLATFORM_WEB = 5;
    static SDK_PLATFORM_WX = 6;

    // html5 audio 标签不能播放amr格式的音频，需要将amr格式转换为mp3格式
    // 本服务传入amr音频文件的地址，将音频文件转换为mp3格式，并以application/octet-stream的格式返回
    // 如果语音消息很多，建议使用cdn
    static AMR_TO_MP3_SERVER_ADDRESS = Config.APP_SERVER + "/amr2mp3?path=";
    static HELPER_IDS = [
        "wfc_file_transfer", // 文件传输助手ID
        "admin", // 系统管理员
    ];

    static TEAM_IDS = [
        "1c4ccfbda8da446b99362faefbd60708", // 通付盾团队ID
        "6750b7961f9a48ea9452202b01b9cb9a", // 会议助手ID
        "d8b279bbe285432c8518b8ce88d872ed", // 安全助手ID
        "526126fcaa6d48f7bbed5b5f42a05107", // 通付盾团队ID2
        "e889a5b8147d11edaf58000c296f40d4", // D市场团队ID
        "66214ff9282d11edaace000c296f40d4", // 数信云ID
        "ae4b5087281111edaace000c296f40d4", // D签约ID
        "011944112cc611edaace000c296f40d4", // 数字藏品ID
        "3dc79bab2cc511edaace000c296f40d4", // D查查ID
        "0191833de1aa40f182d3dde3cdddb2ea", // 英文 通付盾团队ID
    ];

    /**
     * 允许重新编辑多长时间内的撤回消息，单位是秒
     */
    static RECALL_REEDIT_TIME_LIMIT = 60;

    static SECRET_CHAT_MEDIA_DECODE_SERVER_PORT = 7982;

    static OPEN_PLATFORM_SERVE_PORT = 6869;

    // 允许主动加入多人音视频通话
    static ENABLE_MULTI_CALL_AUTO_JOIN = false;

    // ase 加解密， 用于外链加好友和进群解密
    static AES_KEY = "w2d3g1h8na4f5t9a";

    // 发送日志命令，当发送此文本消息时，会把协议栈日志发送到当前会话中，为空时关闭此功能。
    static SEND_LOG_COMMAND = "*#marslog#";

    static getWFCPlatform() {
        if (isElectron()) {
            if (window.process && window.process.platform === "darwin") {
                // osx
                return 4;
            } else if (window.process && window.process.platform === "linux") {
                return 7;
            } else {
                // windows
                return 3;
            }
        } else {
            // web
            return 5;
        }
    }

    static config(options) {
        Object.keys(options).forEach((key) => {
            Config[key] = options[key];
        });
    }

    /**
     * 网络地址重定向
     *
     * 仅当双网环境时，需要特殊处理，默认原样返回
     *
     * @param {string} url
     * @return {string} newUrl
     */
    static urlRedirect(url) {
        if (!url) {
            return url;
        }
        // 示例代码
        // url = url.replace('oss.xxxx.com', '192.168.2.19');
        return url;
    }
}
