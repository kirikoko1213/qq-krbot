import { MessageScene } from '../../types/message.js';
import BaseModel from './base-model.js';

export type ConditionType = 'equals' | 'contains' | 'startsWith' | 'endsWith';

export type TriggerContentType = 'text' | 'api' | 'image' | 'handler';

export type DynamicTriggerData = {
  id: number;
  conditionType: ConditionType;
  conditionValue: string;
  triggerContentType: TriggerContentType;
  triggerContent: string;
  sequence: number;
  scene: MessageScene;
  description: string;
  createdAt: string;
  updatedAt: string;
};

class DynamicTriggerModel extends BaseModel<DynamicTriggerData> {
  table = 'dynamic_trigger_models';

  /**
   * 实现字段映射，定义 TypeScript 类型属性与数据库字段的对应关系
   */
  getFieldMapping(): Record<string, string> {
    return {
      id: 'id',
      conditionType: 'condition_type',
      conditionValue: 'condition_value',
      triggerContentType: 'trigger_content_type',
      triggerContent: 'trigger_content',
      sequence: 'sequence',
      scene: 'scene',
      description: 'description',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    };
  }

  static async findAll() {
    return await this.query().orderBy('sequence', 'asc').get();
  }
  static delete(id: number[]) {
    return this.query().destroy(id);
  }
  static findOne(id: number) {
    return this.query().where('id', '=', id).first();
  }

  static async moveUp(id: number) {
    const record = await this.query().where('id', '=', id).first();
    if (!record) {
      throw new Error(`Record with id ${id} not found`);
    }

    const currentData = record.getData();

    // 找到上面的记录（sequence 比当前小的最大值）
    const prevRecord = await this.query()
      .where('sequence', '<', currentData.sequence)
      .orderBy('sequence', 'desc')
      .first();

    if (!prevRecord) {
      throw new Error('No record found above the current one');
    }

    const prevData = prevRecord.getData();

    // 交换两个记录的 sequence
    await this.query()
      .where('id', '=', id)
      .update({ sequence: prevData.sequence });
    await this.query()
      .where('id', '=', prevData.id)
      .update({ sequence: currentData.sequence });

    return true;
  }

  static async moveDown(id: number) {
    const record = await this.query().where('id', '=', id).first();
    if (!record) {
      throw new Error(`Record with id ${id} not found`);
    }

    const currentData = record.getData();

    // 找到下面的记录（sequence 比当前大的最小值）
    const nextRecord = await this.query()
      .where('sequence', '>', currentData.sequence)
      .orderBy('sequence', 'asc')
      .first();

    if (!nextRecord) {
      throw new Error('No record found below the current one');
    }

    const nextData = nextRecord.getData();

    // 交换两个记录的 sequence
    await this.query()
      .where('id', '=', id)
      .update({ sequence: nextData.sequence });
    await this.query()
      .where('id', '=', nextData.id)
      .update({ sequence: currentData.sequence });

    return true;
  }
}

export default DynamicTriggerModel;
