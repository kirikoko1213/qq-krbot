import { botEngine } from '../handlers/obt/onebot.js';
import { dynamicTriggers, fixedTriggers } from '../handlers/trigger/trigger.js';
import { TriggerType } from '../handlers/trigger/types.js';
import MessageRecordModel from '../repositories/models/message-record.js';
import {
  EngineMessageType,
  MessageScene,
  WrapMessageType,
} from '../types/message.js';
import { Logger } from '../utils/logger.js';

export class MessageService {
  /**
   * 消息队列
   */
  groupMessageQueue: Record<number, WrapMessageType[]> = [];
  /**
   * 添加消息到队列
   * @param message 包装后的消息
   */
  async addMessageToQueue(message: WrapMessageType) {
    const groupId = message.engineMessage.group_id;
    let queue = this.groupMessageQueue[groupId];
    if (!queue) {
      queue = [];
    }
    if (queue.length > 30) {
      queue.shift();
    }
    queue.push(message);
    this.groupMessageQueue[groupId] = queue;
  }
  /**
   * 保存消息
   * @param wrapMessage 包装后的消息
   */
  async saveMessage(wrapMessage: WrapMessageType) {
    MessageRecordModel.createRecord({
      qqAccount: wrapMessage.engineMessage.user_id,
      qqNickname: wrapMessage.engineMessage.sender.nickname,
      groupId: wrapMessage.engineMessage.group_id,
      groupName: '',
      cqMessage: wrapMessage.engineMessage.raw_message,
      textMessage: wrapMessage.textMessage,
      engineMessage: JSON.stringify(wrapMessage.engineMessage),
      messageType: wrapMessage.engineMessage.message_type,
    }).catch(err => {
      Logger.error(`保存消息失败: ${err}`);
    });
  }
  /**
   * 处理接收到的消息
   * @param message 接收到的消息
   */
  handleReceiveMessage = async (message: EngineMessageType) => {
    Logger.info(`收到消息: ${message.raw_message}`);
    const wrapMessage = this.convertToWrapMessage(message);
    this.addMessageToQueue(wrapMessage);
    // 保存消息
    this.saveMessage(wrapMessage);

    const handle = async (trigger: TriggerType): Promise<boolean> => {
      const queue = this.groupMessageQueue[wrapMessage.engineMessage.group_id];
      if (
        trigger.scene === wrapMessage.scene &&
        trigger.condition({ message: wrapMessage, queue })
      ) {
        const response = await trigger.callback({
          message: wrapMessage,
          queue,
        });
        await botEngine.sendGroupMessage(
          wrapMessage.engineMessage.group_id,
          response
        );
        Logger.info(`[触发器] <${trigger.desc}> `);
        return true;
      } else {
        return false;
      }
    };
    for (const trigger of dynamicTriggers) {
      if (await handle(trigger)) {
        return;
      }
    }
    for (const trigger of fixedTriggers) {
      if (await handle(trigger)) {
        return;
      }
    }
  };

  /**
   * 将接收到的消息转换为包装后的消息
   * @param message 接收到的消息
   * @returns 包装后的消息
   */
  convertToWrapMessage = (message: EngineMessageType): WrapMessageType => {
    const wrapMessage: WrapMessageType = {
      engineMessage: message,
      scene: this.getMessageScene(message),
      atAccount: this.getAtAccount(message),
      textMessage: this.getTextMessage(message),
    };
    return wrapMessage;
  };

  /**
   * 获取消息中的@账号
   * @param message 接收到的消息
   * @returns @账号
   */
  getAtAccount = (message: EngineMessageType): number | undefined => {
    if (message.raw_message.includes('[CQ:at,')) {
      return this.extractQQ(message.raw_message);
    }
    return undefined;
  };

  /**
   * 获取消息的场景
   * @param message 接收到的消息
   * @returns 消息的场景
   */
  getMessageScene = (message: EngineMessageType): MessageScene => {
    if (message.raw_message.includes('[CQ:at,')) {
      const qqAccount = this.extractQQ(message.raw_message);
      if (qqAccount === message.self_id) {
        return 'atMe';
      } else {
        return 'atOther';
      }
    } else if (message.message_type === 'group') {
      return 'gr';
    } else if (message.message_type === 'private') {
      return 'pr';
    } else {
      throw new Error(`未知 message type: ${message.message_type}`);
    }
  };

  /**
   * ExtractQQ 从CQ码中提取QQ号
   * @param input CQ码字符串
   * @returns 提取出的QQ号码
   * @throws Error 如果未找到QQ号或转换失败
   */
  extractQQ = (input: string): number => {
    // 定义一个正则表达式来匹配 "qq=" 后面的数字
    const regex = /qq=(\d+)/;

    // 使用正则表达式查找匹配项
    const matches = input.match(regex);
    if (!matches || matches.length < 2) {
      throw new Error('no QQ number found');
    }

    // 返回匹配的 QQ 号码
    const qq = Number(matches[1]);
    if (isNaN(qq)) {
      throw new Error('failed to parse QQ number');
    }

    return qq;
  };

  getTextMessage = (message: EngineMessageType): string => {
    if (message.message_type === 'group') {
      let textMessage = '';
      message.message.forEach(item => {
        if (item.type === 'text') {
          textMessage += item.data.text;
          textMessage += '   ';
        }
      });
      return textMessage;
    } else if (message.message_type === 'private') {
      return message.raw_message;
    } else {
      throw new Error(`unknown message type: ${message.message_type}`);
    }
  };
}
