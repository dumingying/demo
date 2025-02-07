
import { getItem } from "../util/storageHelper";
let lang = getItem("lang") === 'en' ? 'en' : 'zh'
let content = {
    zh: {
        no_space: '链上文档空间不足,',
        move_to: `请前往移动端或 <a class="open-link" data-link="https://cloud.tongfudun.com/#/user/homeDetail?productId=38"> 数信云 </a>购买`,
        add_fail_group: '添加失败，群聊人数已达到上限',
        save_fail: '保存失败，',
        upload_fail: '上传失败，',
        add_fail: '添加失败，',
        upper_limit: '添加失败，群成员人数已达上限，请提示群主前往升级会员提高上限',
        create_failed: '创建失败',
        enjoy_meeting: ", 立享“周期会议”等多项高级功能",
        enjoy_designated: ', 立享“指定参会人员”等多项高级功能',
        group_limit: '群聊创建个数已达上限，',
        member_limit: '群成员人数已达上限，',
        friend_limit: '好友人数已达上限，',
        insufficient: '当前权益不足，',
        delete_fail: "双侧删除失败，"

    },
    en: {
        no_space: 'There is insufficient space for the document on the chain,',
        move_to: `Please go to the ChainPal or <a class="open-link" data-link="https://cloud.tongfudun.com/#/user/homeDetail?productId=38"> Dcloud </a> to purchase`,
        add_fail_group: 'Failed to add, the number of people in the group chat has reached the upper limit',
        save_fail: 'The save failed.',
        upload_fail: 'The upload failed.',
        add_fail: 'Failed to add. ',
        upper_limit: 'Failed to add. The number of group members has reached the upper limit. Please prompt the group owner to upgrade members to increase the upper limit.',
        create_failed: 'Creation failed. ',
        enjoy_meeting: 'and enjoy multiple advanced functions such as "periodic meetings" immediately',
        enjoy_designated: 'and enjoy multiple advanced features such as "designated participants".',
        group_limit: ' The number of group chats created has reached the upper limit.',
        member_limit: 'The number of group members has reached the upper limit.',
        friend_limit: 'The number of friends has reached the upper limit.',
        insufficient: 'The current rights are insufficient,',
        delete_fail: "Failed，"
    }
}
let langText = content[lang]
export const tipsContent = {
    1: `<p style="text-align:center;">${langText.save_fail}${langText.no_space}</p>`,
    2: `<p style="text-align:center;">${langText.save_fail}${langText.no_space}${langText.move_to}</p>`,
    3: `<p style="text-align:center;">${langText.upload_fail}${langText.no_space}</p>`,
    4: `<p style="text-align:center;">${langText.upload_fail}${langText.no_space}${langText.move_to}</p>`,
    5: `<p style="text-align:center;">${langText.delete_fail}${langText.move_to}</p>`,
    6: `<p style="text-align:center;">${langText.add_fail_group}</p>`,
    7: `<p style="text-align:center;">${langText.add_fail}${langText.member_limit}${langText.move_to}</p> `,
    8: `<p style="text-align:center;">${langText.upper_limit}</p>`,
    9: `<p style="text-align:center;">${langText.create_failed}${langText.member_limit}${langText.move_to}</p>`,
    10: `<p style="text-align:center;">${langText.create_failed}${langText.group_limit}${langText.move_to}</p>`,
    11: `<p style="text-align:center;">${langText.move_to}</p>`,
    12: `<p style="text-align:center;">${langText.move_to} ${langText.enjoy_designated}</p>`,
    13: `<p style="text-align:center;">${langText.move_to} ${langText.enjoy_meeting}</p>`,
    14: `<p style="text-align:center;">${langText.create_failed}${langText.move_to}</p>`,
    15: `<p style="text-align:center;">${langText.move_to}升级会员，立享“参会信息导出”等多项高级功能</p>`,
    16: `<p style="text-align:center;">${langText.add_fail}${langText.friend_limit}${langText.move_to}</p> `,
    17: `<p style="text-align:center;">${langText.insufficient}${langText.move_to}</p> `,
};
