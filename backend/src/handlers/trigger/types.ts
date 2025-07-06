import { MessageScene, WrapMessageType } from '../../types/message.js';

export type TriggerParameter = {
  message: WrapMessageType;
  queue: WrapMessageType[];
};

export type CallbackResult = {
  data: any;
  type: 'text' | 'image';
};

export type ConditionFunc = (parameter: TriggerParameter) => boolean;
export type CallbackFunc = (
  parameter: TriggerParameter
) => Promise<CallbackResult>;

export type TriggerType = {
  scene: MessageScene;
  condition: ConditionFunc;
  callback: CallbackFunc;
  desc: string;
};

export type TriggerModel = {
  desc: string;
  condition: ConditionFunc;
  callback: CallbackFunc;
};
