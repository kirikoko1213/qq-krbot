import { MessageScene, WrapMessageType } from '../../types/message';
import { helpTrigger } from './triggers/help';

type TriggerParameter = {
  message: WrapMessageType;
};

type ConditionFunc = (parameter: TriggerParameter) => boolean;
type CallbackFunc = (parameter: TriggerParameter) => string;

export type TriggerType = {
  scene: MessageScene;
  condition: ConditionFunc;
  callback: CallbackFunc;
};

export const fixedTriggers: TriggerType[] = [];
export const dynamicTriggers: TriggerType[] = [];

const triggerHandler = {
  addTrigger: (trigger: TriggerType) => {
    fixedTriggers.push({
      scene: trigger.scene,
      condition: trigger.condition,
      callback: trigger.callback,
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
  triggerHandler.addTrigger(helpTrigger);
}
