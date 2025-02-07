import { createRouter, createWebHashHistory } from "vue-router";

import HomePage from "./ui/main/HomePage";
import LoginPage from "./ui/main/LoginPage";
import ConversationPage from "./ui/main/ConversationPage";
import ContactPage from "./ui/main/ContactPage";
import SettingPage from "./ui/main/SettingPage";
import CloudDisk from "./ui/main/CloudDisk";
import Single from "@/ui/voip/Single";
import Multi from "@/ui/voip/Multi";

// import FileRecordPage from "@/ui/fileRecord/FileRecordPage";
import Web3Page from "./ui/web3/Web3View";
import PreviewMediaFiles from "./ui/main/conversation/PreviewMediaFiles";
import Conference from "./ui/voip/Conference";
import ConferencePage from "./ui/voip/ConferencePage";
import HistoryConferencePage from "./ui/voip/HistoryConferencePage";
import ChatRoomPage from "./ui/voip/chatRoom/ChatRoomPage";
import QuickMeetingCallView from "./ui/voip/QuickMeetingCall";

// import FavPage from "@/ui/main/fav/FavPage";

// import CompositeMessagePage from "./ui/main/CompositeMessagePage";
import MessageHistoryPage from "./ui/main/MessageHistoryPage";
import ConversationMessageHistoryPage from "./ui/main/ConversationMessageHistoryPage";

const routers = [
    {
        path: '/',
        name: 'login',
        component: LoginPage,
    },
    {
        path: '/home',
        name: 'home',
        component: HomePage,
        children: [
            {
                path: '',
                name: 'conferencePage',
                component: ConferencePage,
            },
            {
                path: "conversation",
                name: "conversation",
                component: ConversationPage,
            },
            {
                path: 'historyconference',
                name: 'historyConference',
                component: HistoryConferencePage,
            },
            {
                path: "contact",
                name: "contact",
                component: ContactPage,
            },
            // {
            //     path: 'fav',
            //     name: 'fav',
            //     component: FavPage,
            // },
            {
                path: "web3",
                name: "web3",
                component: Web3Page,
            },

            {
                path: "cloud",
                name: "cloud",
                component: CloudDisk,
            },
            {
                path: "setting",
                name: "setting",
                component: SettingPage,
            },
        ],
    },
    {
        path: "/voip/single",
        name: "voipSingle",
        component: Single,
    },
    {
        path: "/voip/multi",
        name: "voipMulti",
        component: Multi,
    },
    {
        path: "/voip/conference",
        name: "voipConference",
        component: Conference,
    },
    {
        path: "/voip/chatroom",
        name: "voipChatroom",
        component: ChatRoomPage,
    },
    {
        path: "/voip/quickcall",
        name: "quickMeetingCall",
        component: QuickMeetingCallView,
    },
    {
        path: "/previewmedia",
        name: "previewMedia",
        component: PreviewMediaFiles,
    },

    // {
    //     name: 'composite-message',
    //     path: '/composite',
    //     component: CompositeMessagePage,
    // },
    // 历史消息相关内容
    {
        path: "/history/message",
        name: "messageHistory",
        component: MessageHistoryPage,
    },
    {
        path: "/history/conversation",
        name: "conversationMessageHistory",
        component: ConversationMessageHistoryPage,
    },
    // {
    //     path: "/files",
    //     name: "files",
    //     component: FileRecordPage,
    // },
];
export default createRouter({
    history: createWebHashHistory(),
    routes: routers,
});
