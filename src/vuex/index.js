import { createStore } from 'vuex'
import createPersistedState from "vuex-persistedstate";

const store = createStore({
    state: {
        // 当前账号权限信息
        permissionList: {},
        isPlaying: false,
        toggleMenubar: false,
        pluginsList: [],
        // 设备信息 （音视频）
        deviceObj: {
            hasAudio: false,
            hasVideo: false,
            audioInList: [],
            audioOutList: [],
            videoList: []
        },
        currentLanguage: 'zh_CN',
        newVersion: ''
    },
    mutations: {
        UpdatePermissionList(state, b) {
            state.permissionList = b;
        },
        UpdateArmPlaying(state, b) {
            state.isPlaying = b;
        },
        UpdateToogleMenuBar(state, b) {
            state.toggleMenubar = b;
        },
        UpdateDeviceObj(state, b) {
            state.deviceObj = b;
        },
        UpdatePluginsList(state, b) {
            state.pluginsList = b;
        },
        UpdateCurrentLanguage(state, b) {
            state.currentLanguage = b;
        },
        UpdateNewVersion(state, b) {
            state.newVersion = b;
        }
    },
    actions: {
        UpdatePermissionList(context, b) {
            context.commit("UpdatePermissionList", b);
        },
        UpdateArmPlaying(context, b) {
            context.commit("UpdateArmPlaying", b);
        },
        UpdateToogleMenuBar(context, b) {
            context.commit("UpdateToogleMenuBar", b);
        },
        UpdateDeviceObj(context, b) {
            context.commit("UpdateDeviceObj", b);
        },
        UpdatePluginsList(context, b) {
            context.commit("UpdatePluginsList", b);
        },
        UpdateCurrentLanguage(context, b) {
            context.commit("UpdateCurrentLanguage", b);
        },
        UpdateNewVersion(context, b) {
            context.commit("UpdateNewVersion", b);
        }
    },
    plugins: [createPersistedState()]
})


export default store;
