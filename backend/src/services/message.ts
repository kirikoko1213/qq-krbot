import { botEngine } from '../handlers/obt/onebot';
import { dynamicTriggers, fixedTriggers } from '../handlers/trigger';
import { TriggerType } from '../handlers/trigger/types';
import {
  EngineMessageType,
  MessageScene,
  WrapMessageType,
} from '../types/message';
import { Logger } from '../utils/logger';

export class MessageService {
  /**
   * 处理接收到的消息
   * @param message 接收到的消息
   */
  handleReceiveMessage = async (message: EngineMessageType) => {
    Logger.info(`收到消息: ${message.raw_message}`);
    const wrapMessage = this.convertToWrapMessage(message);

    const handle = async (trigger: TriggerType): Promise<boolean> => {
      if (
        trigger.scene === wrapMessage.scene &&
        trigger.condition({ message: wrapMessage })
      ) {
        const response = await trigger.callback({ message: wrapMessage });
        await botEngine.sendGroupMessage(
          wrapMessage.engineMessage.group_id,
          response
        );
        return true;
      } else {
        return false;
      }
    };
    for (const trigger of fixedTriggers) {
      if (await handle(trigger)) {
        break;
      }
    }
    for (const trigger of dynamicTriggers) {
      if (await handle(trigger)) {
        break;
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
