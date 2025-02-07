import store from "../../store";
import ConversationType from "../../wfc/model/conversationType";
import avenginekitproxy from "../../wfc/av/engine/avenginekitproxy";
import IpcSub from "../../ipc/ipcSub";

export default {
    install(app, options) {
        app.config.globalProperties.$startVoipCall = function(options) {
            let { audioOnly, conversation, devices } = options;
            if (store.state.misc.isMainWindow) {
                if (conversation.type === ConversationType.Single) {
                    avenginekitproxy.startCall(conversation, audioOnly, [conversation.target], '', devices)
                } else {
                    let successCB = users => {
                        let participantIds = users.map(u => u.uid);
                        avenginekitproxy.startCall(conversation, audioOnly, participantIds, '', devices)
                    };
                    this.$pickContact({
                        successCB,
                        users: store.getGroupMemberUserInfos(conversation.target, true, true),
                        initialCheckedUsers: [store.state.contact.selfUserInfo],
                        uncheckableUsers: [store.state.contact.selfUserInfo],
                        confirmTitle: this.$t('common.confirm'),
                    });
                }
            } else {
                IpcSub.startVoipCall(conversation, audioOnly);
            }
        };
    }
}
