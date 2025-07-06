import { RegisterDynamicTriggerFunc } from '../handlers/trigger/trigger.js';
import { CallbackFunc, TriggerParameter } from '../handlers/trigger/types.js';
import DynamicTriggerModel, {
  DynamicTriggerData,
} from '../repositories/models/dynamic-trigger.js';

const getCondition = (trigger: DynamicTriggerData) => {
  if (trigger.conditionType === 'equals') {
    return (parameter: TriggerParameter) => {
      return parameter.message.textMessage.trim() === trigger.conditionValue;
    };
  } else if (trigger.conditionType === 'contains') {
    return (parameter: TriggerParameter) => {
      return parameter.message.textMessage.includes(trigger.conditionValue);
    };
  } else if (trigger.conditionType === 'startsWith') {
    return (parameter: TriggerParameter) => {
      return parameter.message.textMessage.startsWith(trigger.conditionValue);
    };
  } else if (trigger.conditionType === 'endsWith') {
    return (parameter: TriggerParameter) => {
      return parameter.message.textMessage.endsWith(trigger.conditionValue);
    };
  }
  return () => false;
};

const getCallback = (trigger: DynamicTriggerData): CallbackFunc => {
  if (trigger.triggerContentType === 'text') {
    return () => {
      return Promise.resolve({
        data: trigger.triggerContent,
        type: 'text',
      });
    };
  } else if (trigger.triggerContentType === 'handler') {
    return () => {
      return Promise.resolve({
        data: trigger.triggerContent,
        type: 'text',
      });
    };
  }
  return () =>
    Promise.resolve({
      data: '',
      type: 'text',
    });
};

class DynamicTriggerService {
  async getDynamicTriggers() {
    return (await DynamicTriggerModel.findAll()).map(item => item.getData());
  }

  async saveDynamicTrigger(data: DynamicTriggerData) {
    if (data.id) {
      const trigger = await DynamicTriggerModel.findOne(data.id);
      if (trigger) {
        trigger.setUpdateData(data);
        await trigger.save();
      }
    } else {
      const trigger = new DynamicTriggerModel();
      trigger.setCreateData(data);
      await trigger.save();
    }
  }

  async deleteDynamicTrigger(id: number) {
    await DynamicTriggerModel.delete([id]);
  }

  async moveUpDynamicTrigger(id: number) {
    await DynamicTriggerModel.moveUp(id);
  }

  async moveDownDynamicTrigger(id: number) {
    await DynamicTriggerModel.moveDown(id);
  }
  async registerDynamicTrigger(regFunc: RegisterDynamicTriggerFunc) {
    const triggers = (await this.getDynamicTriggers()) || [];

    triggers.each((trigger: DynamicTriggerData) => {
      regFunc(
        trigger.scene,
        trigger.description,
        getCondition(trigger),
        getCallback(trigger)
      );
    });
  }
}

export const dynamicTriggerService = new DynamicTriggerService();
