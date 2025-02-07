import axios from "axios";
import Config from "../config";
import pkg from "../../package.json";
import wfc from "@/wfc/client/wfc";
import { getItem, setItem } from "@/ui/util/storageHelper";
import SHA256 from "crypto-js/sha256";

const HTTPS = Config.APP_SERVER; // 扫码登录域名
const HTTPS_INIT = Config.DEFAULT_APP_SERVER; // 初始域名
let HTTPS1 = Config.DEFAULT_APP_SERVER; // 其他接口域名 || 默认初始

const lang = getItem("lang") === "en" ? "en" : "zh";

const ajax = ({
    url,
    data,
    method,
    headers,
    withCredentials,
    responseType,
}) => {
    let newData = {};
    for (let i in data) {
        newData[i] =
            Object.is(data[i], null) || Object.is(data[i], undefined)
                ? ""
                : data[i];
    }
    newData.userId = data.userId || wfc.getUserId() || getItem("userId") || "";
    let defaultHeaders = {
        language: lang,
        os: "pc",
        appVersion: pkg.version,
        "Content-Type": "application/json",
        ...headers,
    };
    let isNotUserId = url.indexOf("/disk/postUpload") === -1; // 上传缩略图不需要加 userId
    if (method === "get") {
        return axios.get(
            url,
            { params: newData },
            { responseType, headers: defaultHeaders }
        );
    } else {
        return axios.post(url, isNotUserId ? newData : data, {
            withCredentials,
            headers: defaultHeaders,
        });
    }
};
function sortDataToString(obj) {
    if (!obj) return "";
    let keysArr = Object.keys(obj).sort();
    let sortObj = {};
    for (let i in keysArr) {
        sortObj[keysArr[i]] = obj[keysArr[i]];
    }
    let str = Object.keys(sortObj)
        .map((key) => {
            return `${key}=${
                sortObj[key] instanceof Array || sortObj[key] instanceof Object
                    ? JSON.stringify(sortObj[key])
                    : sortObj[key]
            }`;
        })
        .join("&");
    return str;
}
// 添加请求拦截器
axios.interceptors.request.use(
    function (config) {
        // 在发送请求之前做些什么
        if (
            config.url.indexOf("pc_session") < 0 &&
            config.url.indexOf("session_login") < 0 &&
            config.url.indexOf("/disk/postUpload") < 0
        ) {
            let secretKey = "f6819cb0e0c8c1ed86e5f5acc8bfe084c0f12235";
            let timestamp = +new Date();
            let stringSign =
                (sortDataToString(config.data)
                    ? `${sortDataToString(config.data)}&`
                    : "") + `secretKey=${secretKey}&timestamp=${timestamp}`;
            let hash = SHA256(stringSign);
            config.headers["X-Header-App-ID"] = "At5ipFo4";
            config.headers["X-Header-Signature"] = hash.toString();
            config.headers["X-Header-Timestamp"] = timestamp;
        }
        return config;
    },
    function (error) {
        // 对请求错误做些什么
        return Promise.reject(error);
    }
);

// 添加响应拦截器
axios.interceptors.response.use(
    function (response) {
        // 000001 后台返回 系统错误， message 为空，  此处拦截重写文案，
        if (response.data.code === "000001") {
            response.data.message =
                lang === "en"
                    ? "Network connection failed, please try again later!"
                    : "网络连接失败，请稍后再试~";
        }
        return response;
    },
    function (error) {
        // 超出 2xx 范围的状态码都会触发该函数。
        // 对响应错误做点什么
        return Promise.reject(error);
    }
);

// 获取其他接口请求域名地址
(async () => {
    try {
        if (ajax) {
            let res = await axios.post(
                `${HTTPS_INIT}/prepare`,
                { userId: getItem("userId") },
                {
                    withCredentials: true,
                    headers: {
                        language: lang,
                        os: "pc",
                        appVersion: pkg.version,
                        "Content-Type": "application/json",
                    },
                }
            );

            const { data, code, message } = res.data;
            if (code === "000000") {
                let { serverURL, unVipUserChatSwitch } = data;
                HTTPS1 = data.serverURL;
                setItem("ServerURL", serverURL);
                setItem("UnVipUserChatSwitch", unVipUserChatSwitch);
                console.log(serverURL, "init serverURL");
            } else {
                console.log(message);
            }
        }
    } catch (error) {
        console.log(error);
    }
})();

// 获取pc session
export const getPcSessionAjax = (params, headers) => {
    return ajax({
        url: `${HTTPS}/pc_session`,
        data: params,
        method: "post",
        headers,
        withCredentials: true,
    });
};
// 获取 session 登录
export const getSessionLogin = (url, headers) => {
    return ajax({
        url: `${HTTPS}/session_login/${url}`,
        data: {},
        method: "post",
        headers,
        withCredentials: true,
    });
};
// 版本更新获取当前版本
export const getPcVersion = (params) => {
    return ajax({
        url: `${HTTPS1}/version_v4`,
        data: params,
        method: "post",
        headers: {
            packagename: "ChainMeet",
        },
    });
};
// 获取公共设置信息
export const getHttpsPrepare = (params) => {
    return ajax({
        url: `${HTTPS1}/prepare`,
        data: params,
        method: "post",
        headers: {
            packagename: "ChainMeet",
        },
    });
};
// 获取时区用
export const sendSyncLoginSession = (params) => {
    return ajax({
        url: `${HTTPS1}/syncLoginSession`,
        data: params,
        method: "post",
    });
};
// 获取当前用户是否是有效账号
export const getIsHasUser = (params) => {
    return ajax({
        url: `${HTTPS1}/user/get`,
        data: params,
        method: "post",
    });
};
// 删除消息
export const delMessage = (params) => {
    return ajax({
        url: `${HTTPS1}/im/delMessage`,
        data: params,
        method: "post",
    });
};

// 插件会员查阅等级
export const getPluginsList = (params) => {
    return ajax({
        url: `${HTTPS1}/plugin/getAll`,
        data: params,
        method: "post",
    });
};
// 搜索好友，添加，查找用，手机号，名称，邮箱号 模糊查询
export const postSearchUser = (params) => {
    return ajax({
        url: `${HTTPS1}/user/fuzzySearchUser`,
        data: params,
        method: "post",
    });
};

// 获取用户信息 cns
export const getInfoByUserId = (params) => {
    return ajax({
        url: `${HTTPS1}/user/getInfoByUserId`,
        data: params,
        method: "post",
    });
};

// ==============会议相关接口==================//
// 检查是否有人共享屏幕
export const getShareScreenState = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/shareScreenState`,
        data: params,
        method: "post",
    });
};
// 更新共享屏幕信息
export const getUpdateShareScreenState = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/updateShareScreenState`,
        data: params,
        method: "post",
    });
};
// 设置会议相关信息
export const getSaveMeeting = (params, headers) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/saveMeeting/v1`,
        data: params,
        method: "post",
        headers,
    });
};
// 获取会议详情
export const getMyMeeting = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/myMeeting`,
        data: params,
        method: "post",
    });
};
// 更新会议状态
export const getUpdateMeeting = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/updateMeeting`,
        data: params,
        method: "post",
    });
};
// 会议详情-点击加入会议
export const getJoinMeeting = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/joinMeeting`,
        data: params,
        method: "post",
    });
};
// 会议列表-预约的会议
export const getMyMeetingList = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/myMeetingList`,
        data: params,
        method: "post",
    });
};
// 生成会议连接旧 (未使用)
// export const getGenerateShortUrl = params => {
//     return ajax({
//         url: `${HTTPS1}/generateShortUrl`,
//         data: params,
//         method: "post"
//     });
// };
// 解析会议连接旧 (未使用)
// export const getQueryShortUrl = params => {
//     return ajax({
//         url: `${HTTPS1}/queryShortUrl`,
//         data: params,
//         method: "post"
//     });
// };
// 生成会议连接
export const getGenerateShortUrlV1 = (params) => {
    return ajax({
        url: `${HTTPS1}/generateShortUrl/v1`,
        data: params,
        method: "post",
    });
};
// 解析会议连接
export const getQueryShortUrlV1 = (params) => {
    return ajax({
        url: `${HTTPS1}/queryShortUrl/v1`,
        data: params,
        method: "post",
    });
};
// 编辑指定成员会议
export const modifyParticipant = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/modifyParticipant`,
        data: params,
        method: "post",
    });
};
// 取消参会（将自己从指定成员会议中移除）
export const removeSelfFromParticipant = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/removeSelfFromParticipant`,
        data: params,
        method: "post",
    });
};
// 离开会议 埋点
export const leftMeeting = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/leftMeeting`,
        data: params,
        method: "post",
    });
};

// 会议错误日志
export const recordMeetingError = (params) => {
    return ajax({
        url: `${HTTPS1}/meetingError/recordMeetingError`,
        data: params,
        method: "post",
    });
};
// 指定会议中 申请入会
export const requestJoin = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/requestJoin`,
        data: params,
        method: "post",
    });
};
// 指定会议中 拒绝入会
export const refuseJoin = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/refuseJoin`,
        data: params,
        method: "post",
    });
};
// 指定会议中 同意入会
export const acceptJoin = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/acceptJoin`,
        data: params,
        method: "post",
    });
};
// 入会申请列表
export const joinMeetingList = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/joinList`,
        data: params,
        method: "post",
    });
};
// 历史会议列表
export const meetingHistoryList = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/meetingHistory/list/v1`,
        data: params,
        method: "post",
    });
};
// 历史会议详情
export const meetingHistoryDetail = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/meetingHistory/detail`,
        data: params,
        method: "post",
    });
};
// 删除历史会议
export const delMeetingHistory = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/meetingHistory/del`,
        data: params,
        method: "post",
    });
};
// 历史会议上传文件
export const diskMeetingFile = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/diskMeetingFile`,
        data: params,
        method: "post",
    });
};
// 历史会议中删除文档
export const deleteMeetingFile = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/deleteMeetingFile`,
        data: params,
        method: "post",
    });
};
// 历史会议中保存到链上文档
export const meetingFileToDisk = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/meetingFileToDisk`,
        data: params,
        method: "post",
    });
};
// 上传文档
// export const meetingUploadFile = params => {
//     return ajax({
//         url: `${HTTPS1}/im/meeting/meetingUpload`,
//         data: params,
//         method: "post"
//     });
// };
// 检查是否是好友关系
export const friendsCheckBatch = (params) => {
    return ajax({
        url: `${HTTPS1}/im/friendsCheckBatch`,
        data: params,
        method: "post",
    });
};
// 过滤需要进群的成员
export const filterGroupMembers = (params) => {
    return ajax({
        url: `${HTTPS1}/im/filterGroupMembers/v2`,
        data: params,
        method: "post",
    });
};
// 会议与群绑定
export const bindConferenceAndGroup = (params) => {
    return ajax({
        url: `${HTTPS1}/im/bindConferenceAndGroup/v2`,
        data: params,
        method: "post",
    });
};
// 会前、会中、会后、创建群组
export const createConferenceGroup = (params) => {
    return ajax({
        url: `${HTTPS1}/im/createConferenceGroup`,
        data: params,
        method: "post",
    });
};
// 会议详情编辑概述
export const modifyMeetingInfo = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/modifyMeetingInfo`,
        data: params,
        method: "post",
    });
};
//会议日历视图
export const meetingCalendar = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/meetingHistory/month/v1`,
        data: params,
        method: "post",
    });
};
//普通会议转周期会议（包含历史会议）
export const changeMeeting2Cycle = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/changeMeeting2Cycle`,
        data: params,
        method: "post",
    });
};
//切换周期会议类型(会议详情)
export const changeMeetingCycleType = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/changeMeetingCycleType`,
        data: params,
        method: "post",
    });
};
// 修改预约会议时间（会议详情）
export const changeMeetingScheduleTime = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/changeMeetingScheduleTime`,
        data: params,
        method: "post",
    });
};
// 会议详情中文档ai摘要
export const getAiSummary = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/aiSummary`,
        data: params,
        method: "post",
    });
};

// ==============群聊相关接口==================//
// 是否是匿名群（单个）
export const getGroupAnonymousWeb = (params) => {
    return ajax({
        url: `${HTTPS1}/im/getGroupAnonymousWeb`,
        data: params,
        method: "post",
    });
};
// 点击左侧群聊显示聊天数据
export const getGroupAnonymousMembersInfo = (params) => {
    return ajax({
        url: `${HTTPS1}/im/getGroupAnonymousMembers`,
        data: params,
        method: "post",
    });
};
// 设置群公告
export const putGroupAnnouncement = (params) => {
    return ajax({
        url: `${HTTPS1}/putIMGroupAnnouncement`,
        data: params,
        method: "post",
        withCredentials: true,
    });
};
// 获取群公共告
export const getGroupAnnouncement = (params) => {
    return ajax({
        url: `${HTTPS1}/getIMGroupAnnouncement`,
        data: params,
        method: "post",
        withCredentials: true,
    });
};
// 获取临时群列表
export const getTemporaryGroupIdList = (params) => {
    return ajax({
        url: `${HTTPS1}/im/temporaryGroupIdList`,
        data: params,
        method: "post",
        withCredentials: true,
    });
};
// 批量获取群信息是否是匿名群
export const getGroupInfos = (params) => {
    return ajax({
        url: `${HTTPS1}/im/groupInfo`,
        data: params,
        method: "post",
    });
};

// 收藏
export const getAddFavMessage = (params) => {
    return ajax({
        url: `${HTTPS1}/fav/add`,
        data: params,
        method: "post",
        withCredentials: true,
    });
};

// 检查群聊成员是否达到上限
// export const getGroupMemberLimit = params => {
//     return ajax({
//         url: `${HTTPS1}/im/groupMemberLimit`,
//         data: params,
//         method: "post"
//     });
// };
// 群头像生成接口
export const generateGroupPortrait = (params) => {
    return ajax({
        url: `${HTTPS1}/im/generateGroupPortrait`,
        data: params,
        method: "post",
    });
};
// 检测当前群是否开启了入群申请功能
export const getQueryGroupCheckSwitch = (params) => {
    return ajax({
        url: `${HTTPS1}/im/queryGroupCheckSwitch`,
        data: params,
        method: "post",
    });
};
// 群主开启入群申请，发送入群申请
export const sendSaveGroupInvite = (params) => {
    return ajax({
        url: `${HTTPS1}/im/saveGroupInvite`,
        data: params,
        method: "post",
    });
};
// 群主开启入群申请，发送入群申请
export const groupLinkImHistoryMeeting = (params) => {
    return ajax({
        url: `${HTTPS1}/im/meeting/groupLinkImHistoryMeeting`,
        data: params,
        method: "post",
    });
};
export const delMultiMessage = (params) => {
    return ajax({
        url: `${HTTPS1}/im/delMultiMessage`,
        data: params,
        method: "post",
    });
};
export const postDismissGroup = (params) => {
    return ajax({
        url: `${HTTPS1}/im/record/dismiss/group`,
        data: params,
        method: "post",
    });
};

// ============== 链上文档相关接口==================//
// 链上文档文件分享
export const shareFile = (params) => {
    return ajax({
        url: `${HTTPS1}/disk/shareFile`,
        data: params,
        method: "post",
    });
};
export const getCloudUsedSpace = (params) => {
    return ajax({
        url: `${HTTPS1}/disk/getUsedSpace/v1`,
        data: params,
        method: "post",
    });
};
//获取文件列表
export const getCloudFolderView = (params) => {
    return ajax({
        url: `${HTTPS1}/disk/getFolderView`,
        data: params,
        method: "post",
    });
};
// 获取链上文档列表信息
export const getCloudFolderInfo = (params) => {
    return ajax({
        url: `${HTTPS1}/disk/getFolderInfo`,
        data: params,
        method: "post",
    });
};
// 新建链上文档文件夹
export const getNewFolder = (params) => {
    return ajax({
        url: `${HTTPS1}/disk/newFolder`,
        data: params,
        method: "post",
    });
};
// 修改名称
export const getFilesByName = (params) => {
    return ajax({
        url: `${HTTPS1}/disk/getFilesByName`,
        data: params,
        method: "post",
    });
};
// 点击收藏
// export const getStoreFiles = params => {
//     return ajax({
//         url: `${HTTPS1}/disk/storeFiles`,
//         data: params,
//         method: "post"
//     });
// };
// 点击取消收藏（未使用）
// export const getCancelStoreFile = params => {
//     return ajax({
//         url: `${HTTPS1}/disk/cancelStoreFile`,
//         data: params,
//         method: "post"
//     });
// };
// 更新
export const getCheckUploadEnvironment = (params) => {
    return ajax({
        url: `${HTTPS1}/disk/checkUploadEnvironment`,
        data: params,
        method: "post",
    });
};
// 上传缩略图
export const getPostUpload = (params) => {
    return ajax({
        url: `${HTTPS1}/disk/postUpload`,
        data: params,
        method: "post",
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};
// 停止上传缩略图
export const getStopUpload = (params) => {
    return ajax({
        url: `${HTTPS1}/disk/stopUpload`,
        data: params,
        method: "post",
    });
};
// 删除文件
export const getDeleteFiles = (params) => {
    return ajax({
        url: `${HTTPS1}/disk/deleteFiles`,
        data: params,
        method: "post",
    });
};
// 重命名
export const getRenameFile = (params) => {
    return ajax({
        url: `${HTTPS1}/disk/renameFile`,
        data: params,
        method: "post",
    });
};
// 重命名文件夹
export const getRenameFolder = (params) => {
    return ajax({
        url: `${HTTPS1}/disk/renameFolder`,
        data: params,
        method: "post",
    });
};
// 移动文件
export const getDoMoveFiles = (params) => {
    return ajax({
        url: `${HTTPS1}/disk/doMoveFiles`,
        data: params,
        method: "post",
    });
};
// 下载文件1
export const getDownloadFile = (params) => {
    return ajax({
        url: `${HTTPS1}/disk/downloadFile`,
        data: params,
        method: "get",
    });
};
// 下载文件2
// export const getDownloadFile0 = params => {
//     return ajax({
//         url: `${HTTPS1}/disk/downloadFile0`,
//         data: params,
//         method: "get",
//         responseType: "blob"
//     });
// };
// 更新id
export const updateIMFileRecord = (params) => {
    return ajax({
        url: `${HTTPS1}/disk/updateIMFileRecord`,
        data: params,
        method: "post",
    });
};
export const getDownloadFileForWeb = (params) => {
    return ajax({
        url: `${HTTPS1}/disk/downloadFileForWeb`,
        data: params,
        method: "get",
    });
};
// 更多操作中使用获取所有文件
export const getCloudAllFolders = (params) => {
    return ajax({
        url: `${HTTPS1}/disk/getAllFolders`,
        data: params,
        method: "post",
    });
};
// 更多操作中使用获取所有文件
export const getFileInfo = (params) => {
    return ajax({
        url: `${HTTPS1}/disk/getFileInfo`,
        data: params,
        method: "post",
    });
};

// =============保存链上文档相关接口=============//
export const getAddIMFileRecord = (params) => {
    return ajax({
        url: `${HTTPS1}/disk/addIMFileRecord`,
        data: params,
        method: "post",
    });
};
// 发送链上文档文件接口
export const getSaveIMFile = (params) => {
    return ajax({
        url: `${HTTPS1}/disk/saveIMFile`,
        data: params,
        method: "post",
    });
};
//链上文档 图片， 视频 文件类型上传 minio 服务
export const getUpload2Minio = (params) => {
    return ajax({
        url: `${HTTPS1}/disk/upload2Minio`,
        data: params,
        method: "post",
    });
};

// ===========  轻应用相关 ================== //

// 添加关注轻应用 （未使用）
// export const getAddUserLightApp = params => {
//     return ajax({
//         url: `${HTTPS1}/lightApp/addUserLightApp`,
//         data: params,
//         method: "post"
//     });
// };

// 更新轻应用排序（未使用）
// export const getUpdateLightAppIndex = params => {
//     return ajax({
//         url: `${HTTPS1}/lightApp/updateLightAppIndex`,
//         data: params,
//         method: "post"
//     });
// };

// 获取我的关注列表（未使用）
// export const getMyLightAppList = params => {
//     return ajax({
//         url: `${HTTPS1}/lightApp/myLightAppList`,
//         data: params,
//         method: "post"
//     });
// };
// 移除我的关注
export const getRemoveLightApp = (params) => {
    return ajax({
        url: `${HTTPS1}/lightApp/removeLightApp`,
        data: params,
        method: "post",
    });
};

// 获取连接信息
export const getParseUrl = (params) => {
    return ajax({
        url: `${HTTPS1}/im/parseUrl`,
        data: params,
        method: "post",
    });
};

// 添加历史浏览
export const addSearchHistory = (params) => {
    return ajax({
        url: `${HTTPS1}/lightApp/addSearchHistory`,
        data: params,
        method: "post",
    });
};
// 轻应用 - 申请授权
export const getApplyToken = (params) => {
    return ajax({
        url: `${HTTPS1}/lightApp/applyToken`,
        data: params,
        method: "post",
    });
};

// 获取推荐应用 （未使用）
// export const getRecommendAppList = params => {
//     return ajax({
//         url: `${HTTPS1}/lightApp/recommendAppList`,
//         data: params,
//         method: "post"
//     });
// };

// 获取推荐应用 (新)
export const getRecommendAppListV2 = (params) => {
    return ajax({
        url: `${HTTPS1}/lightApp/recommendAppList/v2`,
        data: params,
        method: "post",
    });
};
// 获取个人收藏接口(v3.5.0)
export const getWeb3Favorites = (params) => {
    return ajax({
        url: `${HTTPS1}/lightApp/getFavorites`,
        data: params,
        method: "post",
    });
};
// 轻应用 - 获取搜索记录
export const getSearchHistory = (params) => {
    return ajax({
        url: `${HTTPS1}/lightApp/searchHistory`,
        data: params,
        method: "post",
    });
};
// 轻应用 - 删除历史记录
export const delSearchHistory = (params) => {
    return ajax({
        url: `${HTTPS1}/lightApp/delSearchHistory`,
        data: params,
        method: "post",
    });
};
// 轻应用 - 删除全部历史记录(v3.5.0)
export const delAllSearchHistory = (params) => {
    return ajax({
        url: `${HTTPS1}/lightApp/delAllSearchHistory`,
        data: params,
        method: "post",
    });
};
// 轻应用 - 新增收藏 (v3.5.0)
export const addWeb3Favorite = (params) => {
    return ajax({
        url: `${HTTPS1}/lightApp/addFavorite`,
        data: params,
        method: "post",
    });
};
// 轻应用 - 新增收藏 (v3.5.0)
export const delWeb3Favorite = (params) => {
    return ajax({
        url: `${HTTPS1}/lightApp/delFavorite`,
        data: params,
        method: "post",
    });
};
// 轻应用 - 当前链接是否收藏(v3.5.0)
export const web3IsInFavorite = (params) => {
    return ajax({
        url: `${HTTPS1}/lightApp/isInFavorite`,
        data: params,
        method: "post",
    });
};
// 轻应用 -代理切换
export const proxySwitch = (params) => {
    return ajax({
        url: `${HTTPS1}/lightApp/proxySwitch`,
        data: params,
        method: "post",
    });
};
// 轻应用 -焦点图
export const getBannerAppList = (params) => {
    return ajax({
        url: `${HTTPS1}/lightApp/bannerAppList`,
        data: params,
        method: "post",
    });
};

// ========= 邀请成员添加群聊  ==================//
// 加入视频群聊
export const getAddAnonymousMember = (params) => {
    return ajax({
        url: `${HTTPS1}/im/addAnonymousMember`,
        data: params,
        method: "post",
    });
};
// 加入视频群聊
export const getGroupAnonymousMembers = (params) => {
    return ajax({
        url: `${HTTPS1}/im/getGroupAnonymousMembers`,
        data: params,
        method: "post",
    });
};
// 会前，会中、会后 绑定群组用，获取群组列表
export const getGroupList = (params) => {
    return ajax({
        url: `${HTTPS1}/im/groupList`,
        data: params,
        method: "post",
    });
};

//================= 会员相关接口 ==============//
// 是否可以邀请检测
export const inviteCheck = (params) => {
    return ajax({
        url: `${HTTPS1}/vip/inviteCheck`,
        data: params,
        method: "post",
    });
};
// 获取会员权限信息
export const getPermissionList = (params) => {
    return ajax({
        url: `${HTTPS1}/vip/permissionList`,
        data: params,
        method: "post",
    });
};
// 获取用户及会员相关动态信息
export const getUserVipInfo = (params) => {
    return ajax({
        url: `${HTTPS1}/vip/userVipInfo`,
        data: params,
        method: "post",
    });
};

//================= im 聊天==============//
// 检测图片是否存在 聊天资源储存过期
export const checkImFileExist = (params) => {
    return ajax({
        url: `${HTTPS1}/im/checkImFileExist`,
        data: params,
        method: "post",
    });
};
// 语音识别
export const getAudiosChangeText = (params) => {
    return ajax({
        url: `${HTTPS1}/speech/getText`,
        data: params,
        method: "post",
    });
};

//================= im 好友模块相关接口 ==============//
// 检测是否是好友
export const checkIsFriends = (params) => {
    return ajax({
        url: `${HTTPS1}/im/friendsCheck`,
        data: params,
        method: "post",
    });
};
// H5 外链加好友
export const getUserInfoWeb = (params) => {
    return ajax({
        url: `${HTTPS1}/im/userInfoWeb`,
        data: params,
        method: "post",
    });
};
// H5 外链进群
export const getGroupInfoWeb = (params) => {
    return ajax({
        url: `${HTTPS1}/im/groupInfoWeb`,
        data: params,
        method: "post",
    });
};

//================= im 公众号相关接口 ==============//
// 公众号文章列表
export const channelArticleList = (params) => {
    return ajax({
        url: `${HTTPS1}/im/channel/article/list`,
        data: params,
        method: "post",
    });
};
// 推荐公众号列表
// export const recommendChannels = params => {
//     return ajax({
//         url: `${HTTPS1}/im/channel/recommendChannels`,
//         data: params,
//         method: "post"
//     });
// };

// ===================    秘密令牌相关接口    ============//

export const postSecretTokenConfig = (params) => {
    return ajax({
        url: `${HTTPS1}/safe/friend/getConfig`,
        data: params,
        method: "post",
    });
};
//  更新令牌状态
export const postSecretTokenUpdateConfig = (params) => {
    return ajax({
        url: `${HTTPS1}/safe/friend/updateConfig`,
        data: params,
        method: "post",
    });
};
// 获取密友和密群
export const postSecretFriendsOrGroup = (params) => {
    return ajax({
        url: `${HTTPS1}/safe/friend/getSafeFriends`,
        data: params,
        method: "post",
    });
};
// 删除秘密好友，秘密群聊
export const postDelSafeFriendList = (params) => {
    return ajax({
        url: `${HTTPS1}/safe/friend/delSafeFriendList`,
        data: params,
        method: "post",
    });
};
// 添加秘密好友，秘密群聊
export const postAddSafeFriendList = (params) => {
    return ajax({
        url: `${HTTPS1}/safe/friend/addSafeFriendList`,
        data: params,
        method: "post",
    });
};
