import { MessageScene, WrapMessageType } from '../../types/message.js';

export type TriggerParameter = {
  message: WrapMessageType;
};

export type ConditionFunc = (parameter: TriggerParameter) => boolean;
export type CallbackFunc = (parameter: TriggerParameter) => Promise<string>;

export type TriggerType = {
  scene: MessageScene;
  condition: ConditionFunc;
  callback: CallbackFunc;
};

export type TriggerModel = {
  condition: ConditionFunc;
  callback: CallbackFunc;
};
