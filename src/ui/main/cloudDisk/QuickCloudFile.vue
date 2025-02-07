<template>
    <div class="quick-cloud-file">
        <Spin size="large" fix v-if="init"></Spin>
        <div @click="close" class="close-btn">
            <Icon type="md-close" />
        </div>
        <div class="myfile-search">
            <div class="myfile-search-fileName">
                <span
                    v-for="(item, index) in filenameList"
                    :key="item.folderId"
                    @click="goTofolder(item)"
                >
                    <em>
                        {{
                            !index ? $t("common.cloud_disk") : item.folderName
                        }}</em
                    >
                    <Icon type="ios-arrow-forward" />
                </span>
            </div>
            <div class="myfile-search-findfile">
                <input
                    type="text"
                    :placeholder="$t('common.search')"
                    @keydown.enter="handleSearch"
                    @input="searchUserData"
                    @compositionstart="isLock = true"
                    @compositionend="isLock = false"
                    @contextmenu.prevent="openMenu"
                    v-model="searchName"
                />
            </div>
        </div>
        <div class="myfile-fileMainContainer" id="drop">
            <div class="myfile-allfile-title">
                <div class="myfile-allfile-allchecked">
                    <!-- 复选框样式重构 -->
                    <input
                        type="checkbox"
                        name=""
                        id="allchecked"
                        class="input-checkbox"
                        v-model="isAllChecked"
                    />
                    <label
                        for="allchecked"
                        class="checkbox-label"
                        @click="chooseAll"
                    ></label>
                    <span>{{ $t("disk.file_name") }}</span>
                </div>
                <div class="myfile-allfile-revisetime">
                    {{ $t("disk.edit_time") }}
                </div>
                <div class="myfile-allfile-filesize">
                    <span>{{ $t("disk.size") }}</span>
                </div>
            </div>
            <EmptyList
                v-if="
                    (!searchData.length && isSearch) ||
                    (!userData.length && !isSearch)
                "
                >{{ $t("disk.no_data") }}</EmptyList
            >
            <ul class="myfile-filecontent">
                <li v-for="item in currentFileList" :key="item.fileid">
                    <div class="myfile-filelistname">
                        <span class="label-wrap">
                            <input
                                type="checkbox"
                                class="input-checkbox"
                                v-model="checkedData"
                                :id="item.fileid"
                                :value="item.fileid"
                                @change="chooseSingle($event, item)"
                            />
                            <label
                                :for="item.fileid"
                                class="checkbox-label"
                                v-if="item.filetype !== 0"
                            ></label>
                        </span>
                        <div class="icon-name" @click="gofileRouter(item)">
                            <figure class="file-name">
                                <img :src="item.iconUrl" draggable="false" />
                            </figure>
                            <p class="new-single-line">{{ item.filename }}</p>
                        </div>
                    </div>
                    <span class="myfile-file-list-time">
                        {{ item.createtime }}
                    </span>
                    <span class="myfile-file-list-size">
                        {{ item.filesize }}
                    </span>
                </li>
            </ul>
        </div>
        <div class="footer-bar">
            <button
                v-if="checkedData.length"
                class="cancel"
                @click="cancelSelection"
            >
                {{ $t("disk.cancel_selection") }}
            </button>
            <button
                type="button"
                :class="['confirm', { disabled: !checkedData.length }]"
                @click="send"
            >
                {{ btn }}{{ checkedLength }}
            </button>
        </div>
        <right-click-menu
            ref="menuComponent"
            :inputText="searchName"
            @resetInputText="resetInputText"
        ></right-click-menu>
    </div>
</template>

<script>
import EmptyList from "../../common/empty/EmptyList";
import RightClickMenu from "../../common/rightClick/RightClickMenu";
import {
    getCloudFolderView,
    getCloudFolderInfo,
    getFilesByName,
} from "@/axios";
import wfc from "@/wfc/client/wfc";
import { nextTick } from "vue";
import dayjs from "dayjs";

export default {
    name: "QuickCloudFile",
    components: { EmptyList, RightClickMenu },
    props: {
        btn: {
            type: String,
        },
        from: {
            type: String,
            default: "",
        },
    },
    data() {
        return {
            init: true,
            userId: "",
            isAllChecked: false,
            checkedData: [],
            allCheckedLength: 0,
            filenameList: [],
            userData: [],
            sortType: "createDate",
            sortOrder: "1",
            searchName: "",
            isLock: false,
            isSearch: false,
            searchData: [],
            currentFolderId: "",
            checkedDataInfo: [], // web3模块用
        };
    },
    computed: {
        currentFileList() {
            return this.isSearch ? this.searchData : this.userData;
        },
        checkedLength() {
            return this.checkedData.length
                ? `(${this.checkedData.length})`
                : "";
        },
    },
    created() {
        this.getFileView("");
    },
    methods: {
        //请求文件视图
        async getFileView(fileid) {
            this.init = true;
            try {
                let res = await getCloudFolderView({
                    userId: wfc.getUserId(),
                    folderId: fileid,
                    orderBy: "createDate",
                    isDesc: "1",
                });
                const { data, code } = res.data;
                this.userData = [];
                this.allCheckedLength = 0;
                if (code == "000000") {
                    this.currentFolderId = data.folder.id;
                    this.currentParentFolderId = data.folder.folderParent;
                    if (this.searchName) {
                        this.searchUserData();
                    }
                    await this.getFolderList();
                    // 处理文件夹数据格式
                    this.userData = [
                        ...this.resetFileOrFolderList(
                            [...data.defaultFolderList, ...data.folderList],
                            "folder"
                        ),
                        ...this.resetFileOrFolderList(data.fileList, "file"),
                    ];
                    this.userData.forEach((value) => {
                        if (value.filetype !== 0) {
                            this.allCheckedLength++;
                        }
                    });
                } else {
                    this.$Message.error(this.$t("disk.no_find_file"));
                }
                nextTick(() => {
                    this.init = false;
                });
            } catch (error) {
                this.init = false;
                console.error("Error:", error);
            }
        },
        // 统一格式
        resetFileOrFolderList(list, type) {
            return list.map((item) => {
                let createtime = dayjs(item.createDate).format(
                    "YYYY/MM/DD HH:mm:ss"
                );
                item.fileid = item.id;
                item.isStore = item.isStored;
                item.filetype = item.nodeType;
                return type === "folder"
                    ? {
                          ...item,
                          filename: item.folderName,
                          fileParent: item.folderParent,
                          filesize: "-",
                          createtime,
                          iconUrl: item.iconURL,
                      }
                    : {
                          ...item,
                          filename: item.fileName,
                          fileParent: item.fileParentFolder,
                          filesize: this.mixinTransfromByte(item.fileSize),
                          createtime,
                          iconUrl: item.shotcut || item.iconURL,
                      };
            });
        },
        //点击文件名称跳转
        gofileRouter(item) {
            let { fileid, filetype } = item;
            if (filetype) return;
            this.isSearch = false;
            this.searchName = "";
            this.userData = [];
            this.getFileView(fileid);
        },
        chooseAll() {
            this.checkedData = [];
            this.checkedDataInfo = [];
            if (!this.isAllChecked) {
                this.currentFileList.forEach((currentValue) => {
                    if (!currentValue.operaType) {
                        this.checkedData.push(currentValue.fileid);
                        this.from === "web3" &&
                            this.checkedDataInfo.push(currentValue);
                    }
                });
            }
        },
        chooseSingle(event, item) {
            if (this.from === "web3") {
                if (event.target.checked) {
                    this.checkedDataInfo.push(item);
                } else {
                    this.checkedDataInfo = this.checkedDataInfo.filter(
                        (e) => item.fileid !== e.fileid
                    );
                }
            }
            //选择单个文件时触发
            if (this.checkedData.length === this.allCheckedLength) {
                this.isAllChecked = true;
            } else {
                this.isAllChecked = false;
            }
        },
        // 搜索内容
        async searchUserData() {
            if (this.isLock) return;
            this.searchData = [];
            this.allCheckedLength = 0;
            try {
                let res = await getFilesByName({
                    userId: wfc.getUserId(),
                    fileName: this.searchName,
                    parentFolderId:
                        this.currentParentFolderId === "root"
                            ? ""
                            : this.currentFolderId, // 当前文件夹Id
                });
                const { code, data } = res.data;
                if (code == "000000") {
                    this.isSearch = true;
                    // 处理文件夹数据格式
                    this.searchData = [
                        ...this.resetFileOrFolderList(
                            [...data.defaultFolderList, ...data.folderList],
                            "folder"
                        ),
                        ...this.resetFileOrFolderList(data.fileList, "file"),
                    ];
                    this.searchData.forEach((value) => {
                        if (!value.operaType) {
                            this.allCheckedLength++;
                        }
                    });
                } else {
                    this.isSearch = false;
                    this.getFileView(this.currentFolderId);
                }
            } catch (error) {
                console.log(error);
            }
        },
        // 点击取消选择
        cancelSelection() {
            if (!this.checkedData.length) return;
            this.isAllChecked = false;
            this.checkedData = [];
            this.checkedDataInfo = [];
        },
        async getFolderList() {
            try {
                let res = await getCloudFolderInfo({
                    userId: wfc.getUserId(),
                    folderId: this.currentFolderId,
                });
                const { code, data, message } = res.data;
                if (code == "000000") {
                    this.filenameList = data.folderPathDtoList.reverse();
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
        // 点击面包屑
        goTofolder(item) {
            this.currentFolderId = item.folderId;
            this.currentParentFolderId = item.parentFolderId;
            this.getFileView(item.folderId);
        },
        handleSearch() {
            if (!this.searchName) return;
            this.searchUserData();
        },
        send() {
            this.$modal.hide(
                "QuickCloudFile-modal",
                this.from === "web3" ? this.checkedDataInfo : this.checkedData
            );
        },
        //关闭页面
        close() {
            this.checkedData = [];
            this.checkedDataInfo = [];
            this.$modal.hide("QuickCloudFile-modal", "");
        },
        openMenu($event) {
            this.$refs.menuComponent.$refs.menu.open($event);
        },
        resetInputText() {
            this.searchName = "";
            this.searchUserData();
        },
    },
};
</script>
<style lang="less" scoped>
.quick-cloud-file {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    .close-btn {
        width: 20px;
        height: 20px;
        position: absolute;
        right: 12px;
        top: 8px;
        font-size: 20px;
    }
    .myfile-search {
        display: flex;
        align-items: center;
        padding: 0 20px;
        margin-top: 42px;
        .myfile-search-findfile {
            width: 200px;
            height: 30px;
            border-radius: 4px;
            border: 1px solid #ccc;
            box-sizing: border-box;
            overflow: hidden;
            display: flex;
            align-items: center;
            input {
                width: 100%;
                height: 100%;
                display: block;
                border: 0;
                outline: none;
                padding: 0 5px;
                &:focus {
                    outline: none;
                    border-color: #1dbb88;
                    box-shadow: 0 0 10px #1dbb88;
                }
            }
        }
    }
    .myfile-search-fileName {
        flex: 10;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        height: 90%;
        box-sizing: border-box;
        font-weight: 600;
        span {
            font-size: 12px;
            margin-right: 4px;
            color: #666;
            cursor: pointer;
            display: flex;
            align-items: center;
            &:last-child {
                color: #000;
            }
            em {
                max-width: 100px;
                display: inline-block;
                height: 20px;
                line-height: 20px;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                font-style: normal;
                vertical-align: middle;
            }
            i {
                display: inline-block;
                vertical-align: middle;
                font-size: 12px;
                // margin-left: 10px;
                color: #666;
            }
        }
    }
    .myfile-fileMainContainer {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        position: relative;
        margin-top: 10px;
        border: 1px solid #fff;
        min-height: 350px;
        padding: 0 20px;
        &.filedrop {
            border-color: #1dbb88;
        }
        .droptext {
            position: absolute;
            top: 0;
            bottom: 0;
            right: 0;
            left: 0;
            margin: auto;
            width: 240px;
            height: 30px;
        }
        .myfile-allfile-title {
            height: 40px;
            line-height: 40px;
            background-color: #f5f5f5;
            display: flex;
            align-items: center;
            font-size: 14px;
            font-weight: 600;
            padding: 0 5px;
            box-sizing: border-box;
            .myfile-allfile-allchecked {
                flex: 2;
                display: flex;
                align-items: center;
                .checkbox-label {
                    margin-right: 12px;
                }
            }
            .myfile-allfile-revisetime {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;

                i {
                    font-size: 14px;
                    color: #515a6e;
                    cursor: pointer;
                }
            }
            .myfile-allfile-filesize {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 90%;
            }
            .myfile-allfile-occupied {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 90%;
            }
        }
        .myfile-filecontent {
            flex: 1;
            background-color: #fff;
            overflow: auto;
            max-height: 300px;
            li {
                display: flex;
                height: 48px;
                border-top: 1px solid #f3f3f3;
                margin: 0 10px;
                &:last-child {
                    border-bottom: 1px solid #f3f3f3;
                }
                .myfile-filelistname {
                    flex: 2;
                    display: flex;
                    align-items: center;
                    position: relative;
                    .label-wrap {
                        width: 24px;
                        display: flex;
                        align-items: center;
                    }
                    .icon-name {
                        display: flex;
                        align-items: center;
                        flex: 1;
                        p {
                            margin-left: 8px;
                            font-size: 12px;
                            font-weight: 600;
                            flex: 1;
                        }
                        figure {
                            width: 40px;
                            height: 40px;
                            border-radius: 3px;
                            overflow: hidden;
                            img {
                                width: 100%;
                                height: 100%;
                                object-fit: cover;
                            }
                        }
                    }
                    .icon-star {
                        width: 12px;
                        height: 12px;
                        &:hover {
                            opacity: 0.6;
                        }
                    }
                    .remove-collect {
                        margin-left: 8px;
                        i {
                            display: block;
                            font-size: 16px;
                            color: #1dbb88;
                        }
                    }
                }
                .myfile-file-list-time {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    color: #666;
                }
                .myfile-file-list-size {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    color: #666;
                }
            }
        }
    }
    .input-checkbox {
        display: none;
        &:checked + .checkbox-label {
            border: 0;
            background: #1dbb88 url(../../../assets/images/ok-icon.png)
                no-repeat center center;
            background-size: 10px auto;
        }
    }

    .checkbox-label {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #bababa;
        box-sizing: border-box;
        border-radius: 50%;
        &:hover {
            border: 2px solid #1dbb88;
        }
    }
    .empty-container {
        flex: 1;
        display: flex;
        margin-top: 120px;
        flex-direction: column;
        align-items: center;
        p {
            margin-top: 10px;
            color: #999;
            font-size: 12px;
        }
    }
    .footer-bar {
        margin: 20px auto;
        button {
            min-width: 60px;
            height: 32px;
            background-color: #ffffff;
            border-radius: 4px;
            border: solid 1px rgba(151, 151, 151, 0.2);
            font-size: 14px;
            padding: 3px 5px;
            cursor: pointer;
            &:focus {
                outline: 0;
            }
        }
        .confirm {
            margin-left: 8px;
            width: 120px;
            background-color: #1dbb88;
            color: #fff;
            &.disabled {
                opacity: 0.4;
            }
        }
        .cancel {
            width: 120px;
        }
    }
}
</style>
