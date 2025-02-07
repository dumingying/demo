<template>
    <div class="cloud-disk-container">
        <cloud-disk-header
            :space="{
                use: this.use,
                total: this.total,
                totalSpace: this.totalSpace,
                usedSpace: this.usedSpace,
            }"
        ></cloud-disk-header>
        <div class="cloud-main">
            <!-- 头部操作 -->
            <div class="header-bar">
                <div class="bar" v-if="!checkedIds.length">
                    <!-- 上传文件 -->
                    <div class="myfile-upload" @click="uploadFile">
                        <input
                            ref="cloudFileInput"
                            @change="onPickFile($event)"
                            class="icon-ion-android-attach"
                            type="file"
                            multiple
                            style="display: none"
                        />
                        <span>{{ $t("common.upload_files") }}</span>
                    </div>
                    <!-- 新建文件夹 -->
                    <div class="myfile-new" @click="handlerFolder('create')">
                        <span>{{ $t("disk.new_folder") }}</span>
                    </div>
                </div>
                <div class="bar" v-else>
                    <div class="icon-text" @click="handlerDownloadFile">
                        <span>{{ $t("disk.download") }}</span>
                    </div>
                    <div class="icon-text" @click="deleteFile">
                        <span>{{ $t("common.delete") }}</span>
                    </div>
                    <div class="icon-text" @click="handlerShareFile">
                        <span>{{ $t("common.share") }}</span>
                    </div>
                    <div class="icon-text myfile-more" ref="dropMore">
                        <span @click="openDropDown('more')">{{
                            $t("disk.more")
                        }}</span>
                        <transition name="fade">
                            <drop-down
                                v-if="isDropdown === 'more'"
                                :listData="dropdownMoreData"
                                @operate="doMoreOperate"
                            ></drop-down>
                        </transition>
                    </div>
                </div>
                <div class="action-right">
                    <div class="myfile-search-findfile">
                        <input
                            type="text"
                            :placeholder="$t('common.search')"
                            @input="searchUserData"
                            @compositionstart="isLock = true"
                            @compositionend="isLock = false"
                            @keydown.enter="send"
                            @contextmenu.prevent="openMenu"
                            v-model="searchName"
                        />
                        <i class="search-icon"></i>
                    </div>
                    <!-- 传输列表 -->
                    <div
                        class="uploader-list-btn"
                        ref="uploader-btn"
                        @click="changeUploaderList"
                    >
                        {{ $t("disk.transmission") }}
                    </div>
                    <!-- 排序 -->
                    <div class="myfile-sort-dropdown" ref="dropSort">
                        <span @click="openDropDown('sort')" class="sort-btn">{{
                            $t("disk.sort")
                        }}</span>
                        <transition name="fade">
                            <drop-down
                                v-if="isDropdown === 'sort'"
                                :listData="dropdownSortData"
                                @operate="doSort"
                            ></drop-down>
                        </transition>
                    </div>
                </div>
            </div>
            <!-- 文档列表 -->
            <div class="myfile-fileMain">
                <Spin size="large" fix v-if="init"></Spin>
                <div class="myfile-nav-fileName">
                    <div class="nav-wrap">
                        <span
                            v-for="(item, index) in filenameList"
                            :key="item.folderId"
                            @click="goTofolder(item)"
                        >
                            <em>
                                {{
                                    !index
                                        ? $t("common.cloud_disk")
                                        : item.folderName
                                }}</em
                            >
                            <Icon type="ios-arrow-forward" />
                        </span>
                    </div>
                    <div
                        class="cancel-selection"
                        v-if="checkedIds.length"
                        @click="cancelSelection"
                    >
                        {{ $t("disk.cancel_selection") }} ({{
                            checkedIds.length
                        }})
                    </div>
                </div>
                <!-- 拖拽区域 -->
                <div
                    :class="[
                        'myfile-fileMainContainer',
                        { fileDrop: isDropFile },
                    ]"
                    id="drop"
                >
                    <span
                        style="font-size: 12px; color: #1dbb88"
                        class="dropText"
                        v-if="isDropFile"
                        >{{ $t("disk.drag_files") }}</span
                    >
                    <div class="myfile-allfile-title">
                        <div class="myfile-allfile-allchecked">
                            <!-- 复选框样式 -->
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
                            <span>{{
                                isSetRow
                                    ? $t("disk.all_file")
                                    : $t("disk.file_name")
                            }}</span>
                        </div>
                        <template v-if="!isSetRow">
                            <div class="myfile-allfile-revisetime">
                                {{ $t("disk.edit_time") }}
                            </div>
                            <div class="myfile-allfile-type">
                                {{ $t("disk.type") }}
                            </div>
                            <div class="myfile-allfile-filesize">
                                {{ $t("disk.size") }}
                            </div>
                        </template>
                    </div>
                    <EmptyList
                        v-if="
                            (!searchData.length && isSearch) ||
                            (!userData.length && !isSearch)
                        "
                        >{{ $t("disk.no_data") }}</EmptyList
                    >
                    <!-- list -->
                    <ul
                        :class="[
                            'myfile-filecontent',
                            { 'row-list': isSetRow },
                        ]"
                    >
                        <li v-for="item in currentFileList" :key="item.fileid">
                            <div class="myfile-filelistname">
                                <span class="label-wrap">
                                    <input
                                        type="checkbox"
                                        :id="item.fileid"
                                        class="input-checkbox"
                                        :value="item.fileid"
                                        v-model="checkedIds"
                                        @change="chooseSingle($event, item)"
                                    />
                                    <label
                                        :for="item.fileid"
                                        v-show="!item.operaType"
                                        class="checkbox-label"
                                    ></label>
                                </span>
                                <div
                                    class="icon-name"
                                    @click="gofileRouter(item)"
                                >
                                    <figure :title="setTitle(item)">
                                        <img
                                            :src="item.iconUrl"
                                            draggable="false"
                                        />
                                    </figure>
                                    <p
                                        :class="
                                            isSetRow
                                                ? 'second-line'
                                                : 'new-single-line'
                                        "
                                        :title="item.filename"
                                    >
                                        {{ item.filename }}
                                    </p>
                                </div>
                            </div>
                            <span
                                class="myfile-fileListTime"
                                v-show="!isSetRow"
                                >{{ item.createtime }}</span
                            >
                            <figure title="ipfs" class="ipfs-icon">
                                <img
                                    src="../../assets/images/ipfs.png"
                                    @click="showIpfs(item)"
                                    draggable="false"
                                    v-if="item.cid"
                                />
                                <span
                                    v-if="!item.cid && !isSetRow"
                                    class="myfile-filetype"
                                >
                                    -
                                </span>
                            </figure>
                            <span
                                class="myfile-fileListSize"
                                v-show="!isSetRow"
                            >
                                {{ item.filesize }}
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
            <!-- 文件预览弹窗 -->
            <div class="file-view-wrap" v-if="showFileView">
                <FilePreview
                    :info="fileViewInfo"
                    @close="toggleFilePreview"
                ></FilePreview>
            </div>
        </div>
        <!-- 文件上传列表组件 -->
        <transition name="fade">
            <global-uploader
                v-show="showUploader"
                ref="uploader-wrap"
            ></global-uploader>
        </transition>
        <right-click-menu
            ref="menuComponent"
            :inputText="searchName"
            @resetInputText="resetInputText"
        ></right-click-menu>
    </div>
</template>

<script>
import dropDown from "./cloudDisk/Dropdown";
import newOrRename from "./cloudDisk/NewOrRename";
import moveOrCopy from "./cloudDisk/MoveOrCopy";
import globalUploader from "./cloudDisk/GlobalUploader";
import CloudDiskHeader from "./cloudDisk/Header";
import IpfsModal from "./cloudDisk/IpfsModal";
import FilePreview from "./cloudDisk/FilePreview";
import EmptyList from "../common/empty/EmptyList";
import RightClickMenu from "../common/rightClick/RightClickMenu";
import ForwardType from "@/ui/main/conversation/message/forward/ForwardType";

import { downloadOtherFile } from "@/platformHelper";
import SavePathType from "@/savePathType";
import { tipsContent } from "@/ui/common/Tips";
import wfc from "@/wfc/client/wfc";
let md5 = require("js-md5");
import { nextTick } from "vue";
import dayjs from "dayjs";
import store from "@/store";

import {
    getCloudUsedSpace,
    getCloudFolderView,
    getCloudFolderInfo,
    getNewFolder,
    getFilesByName,
    getDeleteFiles,
    getRenameFile,
    getRenameFolder,
    getDoMoveFiles,
    shareFile,
    getDownloadFileForWeb,
} from "@/axios";

export default {
    components: {
        dropDown,
        globalUploader,
        CloudDiskHeader,
        FilePreview,
        EmptyList,
        RightClickMenu,
    },
    data() {
        return {
            init: false,
            isAllChecked: false,
            newOrReFileName: "", //用于重命名或新建文件夹
            renameIcon: "",
            checkedIds: [], // 选中文件或者文件夹的Id集合
            checkedDataInfo: [], // 选中文件夹或文件信息集合
            allCheckedLength: 0,
            openNewDialog: false,
            openRenameDialog: false,
            openMoveDialog: false,
            openCopyDialog: false,
            renameFileType: "",
            dropFileData: "",
            uploadFileList: [], //用于存放多文件的校验类型
            isDropFile: false,
            dropdownMoreData: [
                {
                    listName: this.$t("common.copy"),
                    type: "copy",
                    name: "more",
                },
                {
                    listName: this.$t("disk.move"),
                    type: "move",
                    name: "more",
                },
                {
                    listName: this.$t("disk.rename"),
                    type: "rename",
                    name: "more",
                },
            ],
            dropdownSortData: [
                {
                    listName: this.$t("disk.by_time"),
                    type: "time",
                    name: "sort",
                },
                {
                    listName: this.$t("disk.by_name"),
                    type: "name",
                    name: "sort",
                },
            ],
            isDropdown: "",
            filenameList: [],
            userData: [],
            sortType: "createDate",
            sortOrder: "1",
            searchName: "",
            isLock: false,
            isSearch: false,
            searchData: [],
            currentFolderId: "",
            currentParentFolderId: "",
            use: 0,
            total: 0,
            totalSpace: 0,
            usedSpace: 0,
            deleteFileLock: false,
            sharedContactState: store.state.contact,
            sharedPickMessage: [],
            errorFileId: [],
            shareFileLock: false,
            isPicFile: false,
            showUploader: false,
            showFileView: false,
            fileViewInfo: null,
        };
    },

    computed: {
        // 当前文件
        currentFileList() {
            return this.isSearch ? this.searchData : this.userData;
        },
        isSetRow() {
            let currentFolder = this.filenameList.filter(
                (item) => item.folderId === this.currentFolderId
            )[0];
            return (
                this.currentParentFolderId === "root" ||
                (currentFolder && currentFolder.isPicFile)
            );
        },
        permissionList() {
            return this.$store.state.permissionList;
        },
        setTitle() {
            return (item) => {
                const { filesize, filename, cid, createtime } = item;
                let size = filesize === "-" ? "" : filesize;
                let filesizeStr = size
                    ? `\n ${this.$t("disk.size")}：${size}`
                    : "";
                let cidStr = cid ? `\n ${this.$t("disk.type")}：IPFS` : "";
                return this.isSetRow
                    ? ` ${this.$t("disk.name")}：${filename}\n ${this.$t(
                          "disk.time"
                      )}：${createtime}${filesizeStr}${cidStr}`
                    : "";
            };
        },
    },
    watch: {
        $route(to) {
            if (to.name === "cloud-disk") {
                this.isAllChecked = false;
                this.checkedIds = [];
                this.checkedDataInfo = [];
            }
        },
    },
    created() {
        this.getFileView("");
    },
    activated() {
        this.getSpaceData();
        document.addEventListener("click", this.windowClick);
        let dom = document.getElementById("drop");
        let lastEnter = null;
        dom.addEventListener("drop", this.eventDrop);
        dom.addEventListener(
            "dragleave",
            (e) => {
                if (lastEnter === e.target) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("dragleave");
                    this.isDropFile = false;
                }
            },
            false
        );
        dom.addEventListener(
            "dragenter",
            (e) => {
                e.stopPropagation();
                e.preventDefault();
                lastEnter = e.target;
                this.isDropFile = true;
            },
            false
        );
        dom.addEventListener(
            "dragover",
            (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.isDropFile = true;
            },
            false
        );
        // 文件上传成功后刷新数据
        this.$eventBus.$on("uploadSuccess", (id) => {
            this.getFileView(id);
            this.getSpaceData();
        });
    },
    methods: {
        /**
         * @description:获取选中数据的 文件夹id 或者 文件id
         * @param {String} 0 文件夹 1 文件
         */
        getFoldeOrFileIds(type) {
            return this.checkedDataInfo
                .filter((item) => (type ? item.filetype : !item.filetype))
                .map((e) => e.fileid);
        },
        // 拖拽上传文件
        eventDrop(e) {
            this.isDropFile = false;
            e.stopPropagation();
            e.preventDefault(); //必填字段
            if (this.isSearch) {
                this.$Message.error(this.$t("disk.not_upload_files"));
            } else {
                this.dropFileData = e.dataTransfer.files;
                // 触发拖拽上传
                this.$eventBus.$emit("uploadDrop", {
                    files: this.dropFileData,
                    userId: wfc.getUserId(),
                    parentFolderId: this.currentFolderId, // 传入的参数
                });
            }
        },
        // 获取链上文档信息
        async getSpaceData() {
            try {
                const res = await getCloudUsedSpace({
                    userId: wfc.getUserId(),
                });
                const { code, message, data } = res.data;
                if (code == "000000") {
                    let { usedSpace, totalSpace } = data;
                    this.totalSpace = totalSpace;
                    this.usedSpace = usedSpace;
                    this.total = this.mixinTransfromByte(totalSpace);
                    this.use = this.mixinTransfromByte(usedSpace);
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
        //请求文件视图列表
        async getFileView(
            fileid,
            sort = this.sortType,
            sortOrder = this.sortOrder
        ) {
            this.init = true;
            try {
                const res = await getCloudFolderView({
                    folderId: fileid,
                    orderBy: sort,
                    isDesc: sortOrder,
                });
                this.sortOrder = sortOrder;
                this.userData = [];
                this.allCheckedLength = 0;
                const { data, code } = res.data;
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
                        if (!value.operaType) {
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
        // 获取文件路径信息
        async getFolderList() {
            try {
                const res = await getCloudFolderInfo({
                    folderId: this.currentFolderId,
                });
                const { code, data, message } = res.data;
                if (code == "000000") {
                    this.filenameList = data.folderPathDtoList
                        .reverse()
                        .map((item) => {
                            return {
                                ...item,
                                isPicFile:
                                    data.operaType &&
                                    data.folderName === this.$t("disk.photos"),
                            };
                        });
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
        //
        //点击文件名称图片跳转
        async gofileRouter(item) {
            let { fileid, filetype } = item;
            if (!filetype) {
                this.isSearch = false;
                this.searchName = "";
                this.userData = [];
                this.getFileView(fileid);
                return;
            }
            //1,图片, 2:视频, 3：音频,
            if ([1, 2, 3].includes(filetype)) {
                this.toggleFilePreview(true);
                this.fileViewInfo = { fileid, filetype };
                return;
            }
            //5,word ,6:txt,7：excel, 8:ppt, 9:pdf
            if ([5, 6, 7, 8, 9].includes(filetype)) {
                this.nextDownloadFile(item, true); // 仅打开
                return;
            }
            this.$alert({
                content: this.$t("disk.another_application"),
                isText: true,
                cancelText: "",
                height: 200,
                confirmText: this.$t("setting.ok"),
            });
        },
        async getImageSrc(fileId) {
            if (!fileId) return "";
            try {
                const res = await getDownloadFileForWeb({ fileId });
                const { code, data } = res.data;
                return code === "000000"
                    ? `${this.mixinHttps}/disk/previewFileByKey?downloadKey=${data}`
                    : "";
            } catch (error) {
                return "";
            }
        },
        // 点击面包屑
        goTofolder(item) {
            this.currentFolderId = item.folderId;
            this.currentParentFolderId = item.parentFolderId;
            this.getFileView(item.folderId);
        },
        // 点击更多
        openDropDown(prop) {
            this.isDropdown = prop;
        },
        // 点击全选
        chooseAll() {
            this.checkedIds = [];
            this.checkedDataInfo = [];
            if (!this.isAllChecked) {
                this.currentFileList.forEach((value) => {
                    // operaType : 0 可以删除的文件夹
                    if (!value.operaType) {
                        this.checkedIds.push(value.fileid);
                        this.checkedDataInfo.push(value);
                    }
                });
            }
        },
        // 点击单选
        chooseSingle(event, item) {
            if (event.target.checked) {
                this.checkedDataInfo.push(item);
            } else {
                this.checkedDataInfo = this.checkedDataInfo.filter(
                    (e) => item.fileid !== e.fileid
                );
            }
            //选择单个文件时触发
            this.isAllChecked =
                this.checkedIds.length === this.allCheckedLength;
        },
        //新建或重命名弹框
        handlerFolder(type) {
            if (this.isSearch && type === "create") {
                this.$Message.warning(this.$t("disk.not_search_new_folder"));
                return;
            }
            if (["move", "copy"].includes(type)) {
                this.$modal.show(
                    moveOrCopy,
                    {
                        title: this.$t(
                            type === "move"
                                ? "disk.select_move"
                                : "disk.select_copy"
                        ),
                        selectData: this.checkedIds,
                    },
                    null,
                    {
                        name: "moveOrCopy-modal",
                        width: 560,
                        height: 400,
                    },
                    {
                        "before-close": (event) => {
                            if (event.params) {
                                type === "move"
                                    ? this.closeMoveFile(event.params.id)
                                    : this.closeCopyFile(event.params.id);
                            }
                        },
                    }
                );
            } else {
                this.$modal.show(
                    newOrRename,
                    {
                        title:
                            type === "create"
                                ? this.$t("disk.new_folder")
                                : this.$t("disk.rename"),
                        iconfont:
                            type === "create"
                                ? require("@/assets/images/folder.png")
                                : this.renameIcon,
                        filename: type === "create" ? "" : this.newOrReFileName,
                    },
                    null,
                    {
                        name: "newOrRename-modal",
                        width: 380,
                        height: 200,
                    },
                    {
                        "before-close": (event) => {
                            if (event.params) {
                                nextTick(() => {
                                    type === "create"
                                        ? this.closeNew(
                                              event.params.filePackage
                                          )
                                        : this.closeRename(
                                              event.params.filePackage
                                          );
                                });
                            }
                        },
                    }
                );
            }
        },
        //新建对话框下的按钮触发
        async closeNew(filename) {
            try {
                const res = await getNewFolder({
                    parentId: this.currentFolderId,
                    folderName: filename,
                });
                const { code, message } = res.data;
                if (code == "000000") {
                    this.getFileView(this.currentFolderId);
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
                this.$Message.error(this.$t("common.error_later"));
            }
        },
        //重命名对话框下的按钮触发
        closeRename(filename) {
            try {
                const { filetype, fileid } = this.checkedDataInfo[0];
                let methodsName = !filetype ? getRenameFolder : getRenameFile;
                let params = !filetype
                    ? {
                          folderId: fileid,
                          folderNewName: filename,
                      }
                    : {
                          fileId: fileid,
                          fileNewName: `${filename}.${this.renameFileType}`,
                      };
                methodsName(params).then((res) => {
                    const { code, message } = res.data;
                    if (code == "000000") {
                        this.getFileView(this.currentFolderId);
                        this.isAllChecked = false;
                        this.checkedDataInfo = [];
                        this.checkedIds = [];
                    } else {
                        this.$Message.error(message);
                    }
                });
            } catch (error) {
                console.log(error);
            }
        },
        //移动文件API
        async closeMoveFile(id) {
            try {
                let res = await getDoMoveFiles({
                    isCopy: 2,
                    targetFolderId: id,
                    fileIdList: JSON.stringify(this.getFoldeOrFileIds(1)),
                    folderIdList: JSON.stringify(this.getFoldeOrFileIds(0)),
                });
                const { code, message } = res.data;
                if (code == "000000") {
                    this.getFileView(this.currentFolderId);
                    this.$Message.success(this.$t("disk.move_success"));
                } else {
                    this.$Message.error(message);
                }
                this.checkedIds = [];
                this.checkedDataInfo = [];
                this.isAllChecked = false;
            } catch (error) {
                console.log(error);
            }
        },
        //复制文件API
        async closeCopyFile(id) {
            try {
                let res = await getDoMoveFiles({
                    isCopy: 1,
                    targetFolderId: id,
                    fileIdList: JSON.stringify(this.getFoldeOrFileIds(1)),
                    folderIdList: JSON.stringify(this.getFoldeOrFileIds(0)),
                });
                const { code, message } = res.data;
                if (code === "000000") {
                    this.getFileView(this.currentFolderId);
                    this.$Message.success(this.$t("disk.copy_success"));
                } else {
                    this.$Message.error(message);
                }
                this.checkedIds = [];
                this.checkedDataInfo = [];
                this.isAllChecked = false;
            } catch (error) {
                console.log(error);
            }
        },
        // 删除文件
        async deleteFile() {
            let length = this.checkedIds.length;
            if (!length) {
                this.$Message.warning(this.$t("disk.select_file"));
                return;
            }
            if (this.deleteFileLock) return;
            this.deleteFileLock = true;
            this.$Toast.show({
                type: "loading",
                text: this.$t("disk.deleting"),
                time: 300000,
            });
            try {
                let res = await getDeleteFiles({
                    folderIdList: JSON.stringify(this.getFoldeOrFileIds(0)),
                    fileIdList: JSON.stringify(this.getFoldeOrFileIds(1)),
                });
                const { code } = res.data;
                this.$Toast.hide();
                this.deleteFileLock = false;
                if (code == "000000") {
                    this.$Message.success(this.$t("disk.delete_success"));
                    this.getFileView(this.currentFolderId);
                } else {
                    this.$Message.error(this.$t("disk.delete_fail"));
                }
                this.checkedIds = [];
                this.checkedDataInfo = [];
                this.isAllChecked = false;
            } catch (error) {
                this.$Toast.hide();
                this.deleteFileLock = false;
                console.log(error);
            }
        },
        // 点击上传文件
        uploadFile() {
            if (this.totalSpace - this.usedSpace <= 0) {
                const { isAppCharge, vipLevel } = this.permissionList;
                this.$alert({
                    content:
                        isAppCharge && vipLevel === 4
                            ? tipsContent[3]
                            : tipsContent[4],
                    height: 150,
                    cancelText: "",
                });
                return;
            }
            if (this.isSearch) {
                this.$Message.warning(this.$t("disk.not_upload_files"));
                return;
            }
            this.$refs["cloudFileInput"].click();
        },
        // 唤起上传
        onPickFile(event) {
            this.$eventBus.$emit("uploadDrop", {
                files: event.target.files,
                userId: wfc.getUserId(),
                parentFolderId: this.currentFolderId, // 传入的参数
            });
            event.target.value = "";
        },
        // 点击下载
        handlerDownloadFile() {
            let length = this.checkedIds.length;
            if (!length) {
                this.$Message.warning(this.$t("disk.select_file"));
                return;
            }
            if (this.getFoldeOrFileIds(0).length) {
                this.$Message.error(this.$t("disk.not_folder_download"));
                return;
            }
            if (length > 1) {
                this.$Message.error(this.$t("disk.not_batch_download"));
                return;
            }
            this.nextDownloadFile(this.checkedDataInfo[0], false); // 下载，弹窗选择路径
        },
        //点击更多, 复制、移动 、重命名
        doMoreOperate(prop) {
            this.isDropdown = "";
            let length = this.checkedIds.length;
            if (!length) {
                this.$Message.warning(this.$t("disk.select_file"));
                return;
            }
            if (prop == "rename" && length > 1) {
                this.$Message.warning(this.$t("disk.select_single_file"));
                return;
            }
            if (prop == "rename") {
                const { filetype, filename, iconUrl } = this.checkedDataInfo[0];
                this.renameIcon = iconUrl;
                this.newOrReFileName = filename;
                if (Number(filetype)) {
                    //取到文件名开始到最后一个点的长度
                    let index = filename.lastIndexOf(".");
                    if (index > -1) {
                        //获得文件名
                        this.newOrReFileName = filename.substring(0, index);
                        this.renameFileType = filename.substring(
                            index + 1,
                            filename.length
                        );
                    }
                }
            }
            this.handlerFolder(prop); // 显示弹窗
        },
        // 排序
        doSort(prop, sortOrder) {
            switch (prop) {
                case "time":
                case "createDate":
                case "name":
                    this.sortType = prop === "name" ? "name" : "createDate";
                    this.getFileView(
                        this.currentFolderId,
                        this.sortType,
                        sortOrder
                    );
                    break;
            }
            this.isDropdown = "";
        },
        // 搜索内容
        async searchUserData() {
            if (this.isLock) return;
            try {
                this.searchData = [];
                this.allCheckedLength = 0;
                let res = await getFilesByName({
                    fileName: this.searchName,
                    parentFolderId:
                        this.currentParentFolderId === "root"
                            ? ""
                            : this.currentFolderId, // 当前文件夹Id
                });
                const { code, data } = res.data;
                if (code === "000000") {
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
        //统一处理数组字段
        resetFileOrFolderList(list, type) {
            return list.map((item) => {
                let createtime = dayjs(item.createDate).format(
                    "YYYY/MM/DD HH:mm:ss"
                );
                item.fileid = item.id;
                item.isStore = item.isStored;
                item.filetype = item.nodeType;
                if (type === "folder") {
                    return {
                        ...item,
                        filename: item.folderName,
                        fileParent: item.folderParent,
                        filesize: "-",
                        createtime,
                        iconUrl: item.iconURL,
                    };
                } else {
                    return {
                        ...item,
                        filename: item.fileName,
                        fileParent: item.fileParentFolder,
                        filesize: this.mixinTransfromByte(item.fileSize),
                        createtime,
                        iconUrl: item.shotcut || item.iconURL,
                    };
                }
            });
        },
        // 点击分享
        handlerShareFile() {
            if (!this.checkedIds.length || this.shareFileLock) return;
            // 文件夹不可分享
            if (this.getFoldeOrFileIds(0).length) {
                this.$Message.error(this.$t("disk.not_select_folder"));
                return;
            }
            this.shareFileLock = true;
            this.$Toast.show({
                type: "loading",
                text: this.$t("disk.file_loading"),
                time: 30000,
            });
            this.sharedPickMessage = [];
            this.errorFileId = [];
            for (let i = 0; i < this.checkedIds.length; i++) {
                this.shareFileInfo(this.checkedIds[i], this.checkedIds.length);
            }
        },
        // 获取链上文档分享信息
        async shareFileInfo(fileId, length) {
            try {
                let res = await shareFile({
                    originFileId: fileId,
                    originType: "0", //0:链上文档分享  1:本地
                    imFileId: md5(Math.random() * 1e31 + ""), // 生成32位字符串
                });
                const { data, code, message } = res.data;
                if (code === "000000") {
                    data.fromUserId = wfc.getUserId();
                    data.fileId = fileId;
                    let msg = await store.cloudMessageContent(data);
                    if (!msg) {
                        this.shareFileLock = false;
                        this.errorFileId.push(fileId);
                        // 过滤 失败的文件
                        this.checkedIds = this.checkedIds.filter(
                            (item) => item !== fileId
                        );
                        this.checkedDataInfo = this.checkedDataInfo.filter(
                            (item) => item.fileid !== fileId
                        );
                        return false;
                    }
                    this.sharedPickMessage.push(msg);
                    let totalLength =
                        this.sharedPickMessage.length + this.errorFileId.length;
                    if (totalLength === length) {
                        this.shareFileLock = false;
                        this.$Toast.hide();
                        // 可以分享到匿名群
                        this.$forwardMessage({
                            forwardType: ForwardType.ONE_BY_ONE,
                            messages: this.sharedPickMessage,
                            forwardFrom: "cloud",
                            isCallBack: true,
                        }).then((data) => {
                            if (data !== "cancel") {
                                store.forwardAnonymousGroupMessage(data, true);
                                this.$Message.success(
                                    this.$t("friend_request.sent")
                                );
                                this.checkedIds = [];
                                this.checkedDataInfo = [];
                                this.sharedPickMessage = [];
                                this.errorFileId = [];
                            }
                        });
                    }
                } else {
                    this.errorFileId.push(fileId);
                    this.$Message.error(message);
                    this.$Toast.hide();
                    this.shareFileLock = false;
                }
            } catch (error) {
                this.$Toast.hide();
                this.errorFileId.push(fileId);
                this.shareFileLock = false;
                console.log(error);
                this.$Message.error(this.$t("common.error_later"));
            }
        },
        // 显示ipfs
        showIpfs(item) {
            this.$modal.show(
                IpfsModal,
                {
                    title: this.$t("disk.ipfs_info"),
                    cid: item.cid,
                },
                null,
                {
                    name: "Ipfs-modal",
                    width: 350,
                    height: 200,
                    clickToClose: true,
                }
            );
        },
        // 点击取消选择
        cancelSelection() {
            if (this.checkedIds.length) {
                this.isAllChecked = false;
                this.checkedIds = [];
                this.checkedDataInfo = [];
            }
        },
        // 预览弹窗切换
        toggleFilePreview(toggle) {
            this.showFileView = toggle;
        },
        // 显示上传列表
        changeUploaderList() {
            this.showUploader = true;
        },
        /*用于dropdown的全局点击事件*/
        windowClick(e) {
            let currentDom = e.target;
            let dropSort = this.$refs["dropSort"];
            let dropMore = this.$refs["dropMore"];
            let uploader = this.$refs["uploader-wrap"].$refs["globalUploader"];
            let uploaderBtn = this.$refs["uploader-btn"];
            if (this.checkedIds.length) {
                if (
                    !dropSort.contains(currentDom) &&
                    !dropMore.contains(currentDom)
                ) {
                    this.isDropdown = "";
                }
            } else {
                if (!dropSort.contains(currentDom)) {
                    this.isDropdown = "";
                }
            }
            if (
                !uploader.contains(currentDom) &&
                !uploaderBtn.contains(currentDom)
            ) {
                this.showUploader = false;
            }
        },
        openMenu($event) {
            this.$refs.menuComponent.$refs.menu.open($event);
        },
        resetInputText() {
            this.searchName = "";
            this.searchUserData();
        },
        send() {
            if (!this.searchName) return;
            this.searchUserData();
        },
        // 文件 仅下载或者仅打开
        nextDownloadFile(file, isOpen) {
            try {
                const { fileName, fileid } = file;
                downloadOtherFile(
                    {
                        fileName,
                        url: `${
                            this.mixinHttps
                        }/disk/downloadFile?userId=${wfc.getUserId()}&fileId=${fileid}`,
                    },
                    isOpen, // 打开 或 下载
                    SavePathType.Clouds // 保存路径
                );
                if (!isOpen) {
                    nextTick(() => {
                        this.checkedIds = [];
                        this.checkedDataInfo = [];
                        this.isAllChecked = false;
                    });
                }
            } catch (error) {
                console.log(error);
            }
        },
    },
    deactivated() {
        this.$Toast.hide();
        this.$eventBus.$off("uploadSuccess");
        document.removeEventListener("click", this.windowClick);
    },
};
</script>

<style lang="less" scoped>
.cloud-disk-container {
    height: 100%;
    flex: 1;
    background: rgba(245, 246, 249, 1);
    padding: 30px 24px 20px;
    .cloud-main {
        margin-top: 15px;
        border-radius: 12px;
        width: 100%;
        height: calc(100% - 50px);
        background: #fff;
        overflow: hidden;
        padding: 20px 20px 0;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        position: relative;
        .file-view-wrap {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
            z-index: 8;
        }
    }
    .header-bar {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        padding-bottom: 12px;
        border-bottom: 1px solid #f7f7f7;
        .bar {
            display: flex;
            align-items: center;
            .icon-text {
                border: 1px solid #f5f6f9;
                cursor: pointer;
                height: 32px;
                font-family: "PingFang SC";
                font-weight: 500;
                font-size: 14px;
                line-height: 32px;
                color: #333333;
                padding-left: 12px;
                span {
                    padding: 5px 12px;
                    display: block;
                    padding-left: 20px;
                    font-size: 14px;
                    color: #515a6e;
                    line-height: 20px;
                }
            }
            .icon-text:first-child {
                border-radius: 4px 0px 0px 4px;
                border-right: 0;
                span {
                    background: url(../../assets/images/cloud-download.svg)
                        no-repeat left center;
                    background-size: 18px auto;
                }
            }

            .icon-text:nth-child(2) {
                border-right: 0;
                span {
                    background: url(../../assets/images/cloud-del.svg) no-repeat
                        left center;
                    background-size: 18px auto;
                }
            }
            .icon-text:nth-child(3) span {
                background: url(../../assets/images/cloud-share.svg) no-repeat
                    left center;
                background-size: 18px auto;
            }
            .icon-text:last-child {
                border-radius: 0 4px 4px 0;
                border-left: 0;
                span {
                    background: url(../../assets/images/cloud-more.svg)
                        no-repeat left center;
                    background-size: 18px auto;
                }
            }
            .myfile-new,
            .myfile-upload {
                height: 32px;
                border-radius: 4px;
                overflow: hidden;
                cursor: pointer;
                text-align: center;
                display: flex;
                align-items: center;
                box-sizing: border-box;
                padding: 0 12px;
                span {
                    padding-left: 26px;
                    font-family: "PingFang SC";
                    font-style: normal;
                    font-weight: 500;
                    font-size: 13px;
                    line-height: 20px;
                    color: #333333;
                }
            }
            .myfile-upload {
                background: #daf6ed;
                span {
                    background: url(../../assets/images/upload-icon.png)
                        no-repeat left center;
                    background-size: 24px auto;
                }
            }
            .myfile-new {
                background: #f0f7ff;
                margin-left: 16px;
                span {
                    background: url(../../assets/images/create-file-icon.png)
                        no-repeat left center;
                    background-size: 24px auto;
                }
            }

            .myfile-more {
                position: relative;
            }
        }
        .action-right {
            display: flex;
            align-items: center;
            .uploader-list-btn,
            .sort-btn {
                margin-left: 16px;
                padding-left: 20px;
                font-family: "PingFang SC";
                font-style: normal;
                font-weight: 500;
                font-size: 14px;
                line-height: 18px;
                color: #333333;
            }
            .uploader-list-btn {
                background: url(../../assets/images/cloud-uploader-icon.png)
                    no-repeat left center;
                background-size: 15px auto;
            }
            .sort-btn {
                background: url(../../assets/images/cloud-sort-icon.png)
                    no-repeat left center;
                background-size: 15px auto;
            }
            .myfile-sort-dropdown {
                position: relative;
            }

            .myfile-search-findfile {
                width: 160px;
                height: 30px;
                border-radius: 4px;
                box-sizing: border-box;
                overflow: hidden;
                position: relative;
                .search-icon {
                    position: absolute;
                    left: 8px;
                    /* 兼容Firefox 52 */
                    top: 50%;
                    transform: translate(0, -50%);
                    width: 12px;
                    height: 12px;
                    background: url(../../assets/images/search-icon.png)
                        no-repeat center;
                    background-size: 100%;
                }
                input {
                    width: 100%;
                    height: 100%;
                    display: block;
                    background: #f5f6f9;
                    border: 0;
                    outline: none;
                    padding: 0 5px;
                    padding-left: 24px;
                    font-size: 12px;
                }
            }
        }
    }
    .myfile-fileMain {
        flex: 1;
        padding: 10px 0;
        overflow: hidden;
        position: relative;
        .myfile-nav-fileName {
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 32px;
            .nav-wrap {
                flex: 1;
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                box-sizing: border-box;
                font-weight: 600;
                span {
                    font-size: 14px;
                    margin-right: 4px;
                    margin-top: 4px;
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
                        color: #666;
                    }
                }
            }
            .cancel-selection {
                font-family: "PingFang SC";
                font-weight: 500;
                padding-left: 12px;
                background: #1dbb88;
                font-size: 12px;
                color: #fff;
                padding: 3px 10px;
                border-radius: 6px;
            }
        }
        .myfile-fileMainContainer {
            height: calc(100% - 46px);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            position: relative;
            margin-top: 10px;
            border: 1px solid #fff;
            &.fileDrop {
                border-color: #1dbb88;
            }
            .dropText {
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
                display: flex;
                align-items: center;
                font-size: 14px;
                font-weight: 600;
                box-sizing: border-box;
                .myfile-allfile-allchecked {
                    flex: 3;
                    display: flex;
                    align-items: center;
                }
                .myfile-allfile-filesize,
                .myfile-allfile-type,
                .myfile-allfile-revisetime {
                    width: 130px;
                    display: flex;
                    align-items: center;
                    justify-content: left;
                }
                .myfile-allfile-filesize {
                    width: 100px;
                }
                .myfile-allfile-type {
                    width: 70px;
                    margin: 0 20px 0 10px;
                    justify-content: center;
                }
            }
            .myfile-filecontent {
                flex: 1;
                background-color: #fff;
                overflow: auto;
                li {
                    display: flex;
                    height: 52px;
                    &:hover {
                        background: #f3fffb;
                        border-radius: 4px;
                    }

                    .myfile-filelistname {
                        flex: 3;
                        display: flex;
                        align-items: center;
                        .label-wrap {
                            width: 26px;
                        }
                        .icon-name {
                            display: flex;
                            align-items: center;
                            flex: 1;
                            .new-single-line {
                                margin: 0 12px;
                                font-size: 12px;
                                flex: 1;
                                font-family: "PingFang SC";
                                font-style: normal;
                                font-weight: 500;
                                font-size: 12px;
                                line-height: 18px;
                                color: #000000;
                            }
                            .tooltip-text {
                                width: 168px;
                                font-style: normal;
                                font-weight: 400;
                                font-size: 12px;
                                line-height: 18px;
                                color: #6f6f6f;
                                white-space: normal;
                                word-break: break-word;
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
                            cursor: pointer;
                            &:hover {
                                opacity: 0.6;
                            }
                        }
                        .remove-collect {
                            margin-left: 8px;
                            i {
                                display: block;
                                font-size: 20px;
                                color: #ff9634;
                            }
                        }
                    }
                    .myfile-fileListTime,
                    .myfile-fileListSize,
                    .myfile-filetype {
                        width: 130px;
                        display: flex;
                        align-items: center;
                        justify-content: left;
                        font-family: "PingFang SC";
                        font-style: normal;
                        font-weight: 400;
                        font-size: 12px;
                        line-height: 18px;
                        color: #999999;
                    }
                    .myfile-filetype {
                        justify-content: center;
                    }
                    .myfile-fileListSize {
                        width: 100px;
                    }
                    .ipfs-icon {
                        width: 70px;
                        margin: 0 20px 0 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        img {
                            width: 16px;
                            height: auto;
                            vertical-align: middle;
                        }
                    }
                }
                &.row-list {
                    display: flex;
                    flex-wrap: wrap;
                    align-content: flex-start;
                    li {
                        width: 110px;
                        height: auto;
                        padding: 8px;
                        border: none;
                        margin: 4px 2px 0;
                        position: relative;
                        display: flex;
                        flex-direction: column;
                        text-align: center;
                        align-items: center;
                        .input-checkbox + .checkbox-label {
                            display: none;
                        }
                        .input-checkbox:checked + .checkbox-label {
                            display: block;
                        }
                        &:hover {
                            background: #f3fffb;
                            border-radius: 4px;
                            .input-checkbox + .checkbox-label,
                            .input-checkbox:checked + .checkbox-label {
                                display: block;
                            }
                        }
                        .checkbox-label {
                            margin: 0;
                        }
                        .myfile-filelistname {
                            align-items: flex-start;
                        }
                        .label-wrap,
                        .ipfs-icon,
                        .remove-collect {
                            position: absolute;
                            top: 4px;
                            z-index: 1;
                        }
                        .label-wrap {
                            right: 12px;
                        }
                        .ipfs-icon {
                            margin: 0;
                            left: 0;
                        }
                        .remove-collect {
                            left: 20px;
                        }
                        .icon-name {
                            display: flex;
                            flex-direction: column;
                            text-align: center;
                            align-items: center;
                            flex: 1;
                            figure {
                                width: 64px;
                                height: 64px;
                                img {
                                    border-radius: 4px;
                                    width: 100%;
                                    height: 100%;
                                    object-fit: contain;
                                    overflow: hidden;
                                }
                            }
                            .second-line {
                                max-width: 200px;
                                margin-top: 10px;
                                line-height: 18px;
                                margin-left: 0;
                                display: -webkit-box;
                                -webkit-box-orient: vertical;
                                overflow: hidden;
                                -webkit-line-clamp: 2;
                                word-break: break-word;
                            }
                        }
                    }
                }
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
    }
}

.input-checkbox {
    display: none;
    &:checked + .checkbox-label {
        border: 0;
        background: #1dbb88 url(../../assets/images/ok-icon.png) no-repeat
            center center;
        background-size: 10px auto;
    }
}

.checkbox-label {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #808080;
    background: #fff;
    box-sizing: border-box;
    border-radius: 50%;
    margin-right: 10px;
}
.history {
    color: #333 !important;
    cursor: pointer;
}
</style>

<style>
.fade-enter {
    opacity: 0;
}
.fade-enter-active {
    transition: opacity 0.2s;
}
.fade-leave-to {
    opacity: 0;
}
.fade-leave-active {
    transition: opacity 1s;
}
</style>
