import { dynamicTriggerService } from '../../services/dynamic-trigger-service.js';
import { MessageScene } from '../../types/message.js';
import { ChatTrigger } from './triggers/chat.js';
import { EroImageTrigger } from './triggers/ero-image.js';
import { helpTrigger } from './triggers/help.js';
import { offlineWorkTrigger } from './triggers/offline-work.js';
import { repeatChatTrigger } from './triggers/repeat_chat.js';
import {
  CallbackFunc,
  ConditionFunc,
  TriggerModel,
  TriggerType,
} from './types.js';

export const fixedTriggers: TriggerType[] = [];
export const dynamicTriggers: TriggerType[] = [];

export type RegisterDynamicTriggerFunc = (
  scene: MessageScene,
  desc: string,
  condition: ConditionFunc,
  callback: CallbackFunc
) => void;

const triggerHandler = {
  addTrigger: (scene: MessageScene[], trigger: TriggerModel) => {
    scene.forEach(scene => {
      fixedTriggers.push({
        scene,
        condition: trigger.condition,
        callback: trigger.callback,
        desc: trigger.desc,
      });
    });
  },
  addDynamicTrigger: (
    scene: MessageScene,
    desc: string,
    condition: ConditionFunc,
    callback: CallbackFunc
  ) => {
    dynamicTriggers.push({
      scene,
      condition,
      callback,
      desc,
    });
  },
  resetDynamicTriggers: () => {
    dynamicTriggers.splice(0, dynamicTriggers.length);
  },
};

export async function initTriggers() {
  triggerHandler.addTrigger(['atMe'], helpTrigger);
  triggerHandler.addTrigger(['atMe', 'atAll', 'gr'], offlineWorkTrigger);
  triggerHandler.addTrigger(['atMe', 'gr'], EroImageTrigger);
  triggerHandler.addTrigger(['atOther', 'gr'], repeatChatTrigger);
  triggerHandler.addTrigger(['atMe'], ChatTrigger);
  // 添加动态触发器
  dynamicTriggerService.registerDynamicTrigger(
    triggerHandler.addDynamicTrigger
  );
}
