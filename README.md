# qq-krbot

## 概述
这是一个qq机器人，使用onebot11协议

## 功能
- AI回复：需接入OpenAI接口
- 群复读机
- 群发言排名
- AI神回复
- 以群和人为单位进行AI角色设定
- 下班时间提醒
- 支持群内sql指令快速查询

## 开发计划
- 支持前端修改配置 （react+ts）
- 群老婆随机匹配


## 配置
你需要在项目根目录下创建一个config.properties文件。
```bash
# 服务端口
main.serve.port=10047
# 请求openAI的超时时间（秒）
main.chatgpt.timeout=120
# openAI的镜像地址 https://xxxxx.com
main.chatgpt.server.url=
# openAI的api-key
main.chatgpt.key=
# openAI的模型
main.chatgpt.model=
# qq机器人引擎的上报地址 http://127.0.0.1:3000
main.onebot.http.url=
# 请求openAI的代理地址，默认不配置
#proxy.url=http://192.168.56.1:7890
# 机器人的qq号
main.qq.account=
# 消息存储引擎 db是数据库 memory是内存
main.storage.engine=db
# 如果存储引擎是mysql，以下是认证信息
main.mysql.username=root
main.mysql.password=passwd
main.mysql.host=10.0.0.1
main.mysql.port=3306
main.mysql.database=qq_krbot
# 开发者名称
main.developer=树理
# 每日上报水群排名的群号
main.task.rank_of_group.id.list=1234567,7654321
# 机器人名字
main.bot.name=理理树
# 调用openAI的黑名单QQ号
main.block.account=123456789
# 根据群内的热点词汇进行智能回复，这是提示语
main.smart.reply.prompts=你是一个精通中文的人工智能, 你每次回复我的时候, 必须根据我的回复给出简短的神回复
# 以群和用户为单位，分析人格，这是提示语
main.character.portrait.prompts=你是一个擅长分析性格, 喜好, 习惯的人工智能, 当你收到我给你发送某个人在群里的聊天记录后, 你按照这些消息开始分析, 并且要以"你是一个xxx"作为第一人称, 你的语气要嘲讽且恶毒, 内容尽可能根据聊天记录详细展开
```