import store from "../../store";
import ForwardMessageByPickConversationView from "../main/conversation/message/forward/ForwardMessageByPickConversationView";
import ForwardMessageByCreateConversationView from "../main/conversation/message/forward/ForwardMessageByCreateConversationView";

export default {
    install(app, options) {
        app.config.globalProperties.$forwardMessage = function(options) {
            const pickConversationAndForwardMessage = options => {
                let {
                    forwardType,
                    messages,
                    forwardFrom,
                    forwardFilterAnonymous,
                    isCallBack
                } = options;
                return new Promise((resolve, reject) => {
                    let beforeClose = event => {
                        console.log("Closing...", event, event.params);
                        if (!event.params) {
                            resolve('cancel');
                            return
                        }
                        if (event.params.toCreateConversation) {
                            createConversationAndForwardMessage(options)
                                .then(resolve)
                                .catch(reject);
                        } else if (event.params.confirm) {
                            if (isCallBack) {
                                resolve({
                                    ...event.params,
                                    forwardType,
                                    messages
                                });
                            } else {
                                let conversations = event.params.conversations;
                                let extraMessageText =
                                    event.params.extraMessageText;
                                store.forwardMessage(
                                    forwardType,
                                    conversations,
                                    messages,
                                    extraMessageText
                                );
                                resolve();
                            }
                        } else {
                            console.log("cancel");
                            resolve('cancel');
                            // reject()
                        }
                    };

                    this.$modal.show(
                        ForwardMessageByPickConversationView,
                        {
                            forwardType: forwardType,
                            messages: messages,
                            forwardFrom,
                            forwardFilterAnonymous
                        }, null,
                        {
                            name: "forward-by-pick-conversation-modal",
                            width: 600,
                            height: 480,
                            clickToClose: false
                        },
                        {
                            "before-close": beforeClose
                        }
                    );
                });
            };

            const createConversationAndForwardMessage = options => {
                let { forwardType, messages, forwardFrom } = options;
                return new Promise((resolve, reject) => {
                    let beforeClose = event => {
                        console.log("Closing...", event, event.params);
                        if (!event.params) {
                            resolve('cancel');
                            return
                        }
                        if (event.params.backPickConversation) {
                            pickConversationAndForwardMessage(options)
                                .then(resolve)
                                .then(reject);
                        } else if (event.params.confirm) {
                            let users = event.params.users;
                            let extraMessageText =
                                event.params.extraMessageText;
                            // 创建单个聊天
                            store.newForwardByCreateConversation(
                                forwardType,
                                users,
                                messages,
                                extraMessageText
                            );
                            resolve();
                        } else {
                            console.log("cancel");
                            resolve('cancel');
                        }
                    };
                    this.$modal.show(
                        ForwardMessageByCreateConversationView,
                        {
                            forwardType: forwardType,
                            messages: messages,
                            users: store.state.contact.friendList,
                            forwardFrom
                        }, null, {
                        name: "forward-by-create-conversation-modal",
                        width: 600,
                        height: 480,
                        clickToClose: false
                    },
                        {
                            "before-close": beforeClose
                        }
                    );
                });
            };
            return pickConversationAndForwardMessage(options);
        };
    }
};
