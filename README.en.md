# tfd-pc-im 桌面端 链上会应用， 兼容 Mac Window 系统

## description

pc 端链上会

## 运行

1. npm install
2. npm run dev
3. npm run package

## 注意事项 上线前请检查

1. 不同环境需要更换【接口地址】与【proto_addon 】文件中的对应的文件
2. 该路径下的文件是有会议部分功能【wfc/av/internal/engine-conference.min.js】需要重命名为【engine.min.js】使用会议
3. package.json 文件更改 appDebug:true/false 是否打开 debug 模式（全局控制）
4. package.json 文件更改 appId 需要更新为 com.tongfudun.chainpal (需要在重大版本中变更，变更后是新的 app,历史记录会清空) 4.9.0 mas 版本已更新
5. mac 系统 12 以上打包时解决 python 路径改变问题: export PYTHON_PATH=/Library/Frameworks/Python.framework/Versions/2.7/bin/python

## 更新说明

| 版本     | 分支/标签           | 说明                                 |
| -------- | ------------------- | ------------------------------------ |
| master   | 主分支 （线上代码） |                                      |
| mas      | appstore            | vue3                                 |
| dev      | 开发分支            | vue2 版本 nodejs 14.18.0 npm 6.14.15 |
| dev-vue3 | 开发分支            | vue3                                 |

## sdk 更新明细

| 更新版本 | sdk 更新日期 | 代码合并更新日期 | 更新内容                             |
| -------- | ------------ | ---------------- | ------------------------------------ |
| 4.5.0    | 4.3          | 4.1              | vue2 升级 vue3                       |
| 4.0.0    | 7.11         | 7.11             | 更新音视频(sdk 保持 3.17)            |
| 3.8.6    | 3.17         | 未合并           | 更换永久 sdk(音视频未更新)           |
| 3.6.3    | 11.22        | 12.2             | 添加全选功能，修复聊天室消息重复问题 |
| 3.5.2    | 9.13         | 9.22             | 修复双侧删除数量未变更问题，方法抽离 |
