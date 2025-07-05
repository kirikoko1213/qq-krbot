import BaseModel from './base-model.js';

export type MessageCountData = {
  id: number;
  groupId: string | null;
  quantity: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

class MessageCountModel extends BaseModel<MessageCountData> {
  table = 'message_count';

  /**
   * 实现字段映射，定义 TypeScript 类型属性与数据库字段的对应关系
   */
  getFieldMapping(): Record<string, string> {
    return {
      id: 'id',
      groupId: 'group_id',
      quantity: 'quantity',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    };
  }

  static async findAll() {
    const result = await this.query()
      .whereNull('deleted_at')
      .orderBy('quantity', 'desc')
      .get();
    return result.all();
  }

  static delete(id: number[]) {
    return this.query().destroy(id);
  }

  static findOne(id: number) {
    return this.query().where('id', '=', id).first();
  }

  static async findByGroupId(groupId: string) {
    return await this.query()
      .where('group_id', '=', groupId)
      .whereNull('deleted_at')
      .first();
  }

  static async softDelete(id: number) {
    return await this.query()
      .where('id', '=', id)
      .update({ deleted_at: new Date().toISOString() });
  }

  /**
   * 更新消息计数
   */
  static async updateCount(
    groupId: string,
    quantity: number
  ): Promise<MessageCountModel> {
    const existing = await this.findByGroupId(groupId);

    if (existing) {
      const currentData = existing.getData();
      const updateData: MessageCountData = {
        ...currentData,
        quantity: quantity,
        updatedAt: new Date().toISOString(),
      };
      existing.setUpdateData(updateData);
      await existing.save();
      return existing;
    } else {
      const data: MessageCountData = {
        id: 0,
        groupId: groupId,
        quantity: quantity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };
      const messageCount = new MessageCountModel();
      messageCount.setCreateData(data);
      await messageCount.save();
      return messageCount;
    }
  }

  /**
   * 增加消息计数
   */
  static async incrementCount(groupId: string): Promise<MessageCountModel> {
    const existing = await this.findByGroupId(groupId);
    const currentCount = existing?.getData().quantity ?? 0;
    return await this.updateCount(groupId, currentCount + 1);
  }

  /**
   * 减少消息计数
   */
  static async decrementCount(groupId: string): Promise<MessageCountModel> {
    const existing = await this.findByGroupId(groupId);
    const currentCount = existing?.getData().quantity ?? 0;
    const newCount = currentCount > 0 ? currentCount - 1 : 0;
    return await this.updateCount(groupId, newCount);
  }

  /**
   * 重置消息计数
   */
  static async resetCount(groupId: string): Promise<MessageCountModel> {
    return await this.updateCount(groupId, 0);
  }

  /**
   * 批量重置所有群组的消息计数
   */
  static async batchResetAllCounts(): Promise<void> {
    await this.query().whereNull('deleted_at').update({
      quantity: 0,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * 根据群组ID数组批量查询消息计数
   */
  static async findByGroupIds(
    groupIds: string[]
  ): Promise<MessageCountModel[]> {
    const result = await this.query()
      .whereIn('group_id', groupIds)
      .whereNull('deleted_at')
      .orderBy('quantity', 'desc')
      .get();
    return result.all();
  }

  /**
   * 获取消息计数排名前N的群组
   */
  static async getTopGroups(limit: number = 10): Promise<MessageCountModel[]> {
    const result = await this.query()
      .whereNull('deleted_at')
      .orderBy('quantity', 'desc')
      .limit(limit)
      .get();
    return result.all();
  }
}

export default MessageCountModel;
