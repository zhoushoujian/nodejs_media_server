﻿# NODEJS媒体服务器

## Useage

```shell
npm i
npm run start
```

双击打开index.html即可使用

## Functions

1. 上传的文件名和后缀名在前端和后端已做处理，文件名不能不含%或#，后缀名仅开放jpg|png|gif|mp3|mp4

2. 一次可上传多个文件，每个文件上传成功后会给出弹框提示，都上传成功后自动刷新并显示刚上传的文件

3. 点击列表的文件名即可下载，点击文件名后面的删除可以删除文件

4. 音频和视频文件只有点击中间的三角形按钮才能播放

5. 上传图片,音频和视频后会自动归类到响应的区域

6. 上传过程中显示上传进度

7. 若上传的文件名与已存在的文件名重复，则会静默覆盖原有文件

8. 上传文件大小规定不得超过4GB,前后端都已做处理

9. 若文件已被其他用户删除,这时您再删除该文件,浏览器会给出提示

10. 每次可上传的文件任意个数量文件,但单个文件大小不可超过4GB,前后端皆已作处理

11. 后台有事件的日志记录,控制台一份,log一份,其中关键信息在控制台有特殊颜色标识

12. 创建多线程服务器处理请求
