import { MessageScene, WrapMessageType } from '../../types/message.js';
import { ChatTrigger } from './triggers/chat.js';
import { helpTrigger } from './triggers/help.js';
import { offlineWorkTrigger } from './triggers/offline-work.js';
import {
  CallbackFunc,
  ConditionFunc,
  TriggerModel,
  TriggerType,
} from './types.js';

export const fixedTriggers: TriggerType[] = [];
export const dynamicTriggers: TriggerType[] = [];

const triggerHandler = {
  addTrigger: (scene: MessageScene[], trigger: TriggerModel) => {
    scene.forEach(scene => {
      fixedTriggers.push({
        scene,
        condition: trigger.condition,
        callback: trigger.callback,
      });
    });
  },
  addDynamicTrigger: (
    scene: MessageScene,
    condition: ConditionFunc,
    callback: CallbackFunc
  ) => {
    dynamicTriggers.push({
      scene,
      condition,
      callback,
    });
  },
  resetDynamicTriggers: () => {
    dynamicTriggers.splice(0, dynamicTriggers.length);
  },
};

export function initTriggers() {
  triggerHandler.addTrigger(['atMe'], helpTrigger);
  triggerHandler.addTrigger(['atMe', 'atAll', 'gr'], offlineWorkTrigger);
  triggerHandler.addTrigger(['atMe'], ChatTrigger);
}
