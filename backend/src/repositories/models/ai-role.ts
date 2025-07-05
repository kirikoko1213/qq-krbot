import { AiRoleData } from '@/common/types.js';
import BaseModel from './base-model.js';

class AiRoleModel extends BaseModel<AiRoleData> {
  table = 'ai_role';

  /**
   * 实现字段映射，定义 TypeScript 类型属性与数据库字段的对应关系
   */
  getFieldMapping(): Record<string, string> {
    return {
      id: 'id',
      qqAccount: 'qq_account',
      qqNickname: 'qq_nickname',
      groupId: 'group_id',
      groupName: 'group_name',
      setting: 'setting',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    };
  }

  static async findAll() {
    const result = await this.query()
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc')
      .get();
    return result.all();
  }

  static delete(id: number[]) {
    return this.query().destroy(id);
  }

  static findOne(id: number) {
    return this.query().where('id', '=', id).first();
  }

  static async findByQqAccountAndGroupId(qqAccount: number, groupId: number) {
    return await this.query()
      .where('qq_account', '=', qqAccount)
      .where('group_id', '=', groupId)
      .whereNull('deleted_at')
      .first();
  }

  static async findByGroupId(groupId: number) {
    const result = await this.query()
      .where('group_id', '=', groupId)
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc')
      .get();
    return result.all();
  }

  static async softDelete(id: number) {
    return await this.query()
      .where('id', '=', id)
      .update({ deleted_at: new Date().toISOString() });
  }

  /**
   * 根据QQ账号查找AI角色列表
   */
  static async findByQQAccount(qqAccount: number): Promise<AiRoleModel[]> {
    const result = await this.query()
      .where('qq_account', '=', qqAccount)
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc')
      .get();
    return result.all();
  }

  /**
   * 创建AI角色
   */
  static async saveRecord(model: Partial<AiRoleData>): Promise<AiRoleModel> {
    const data: AiRoleData = {
      id: 0,
      qqAccount: model.qqAccount || null,
      qqNickname: model.qqNickname || null,
      groupId: model.groupId || null,
      groupName: model.groupName || null,
      setting: model.setting || null,
    };

    const aiRole = new AiRoleModel();
    aiRole.setCreateData(data);
    await aiRole.save();
    return aiRole;
  }

  /**
   * 更新AI角色
   */
  static async updateRecord(
    id: number,
    data: Partial<AiRoleData>
  ): Promise<AiRoleModel> {
    const aiRole = await this.findOne(id);
    if (!aiRole) {
      throw new Error('AI role not found');
    }

    const currentData = aiRole.getData();
    const updateData: AiRoleData = {
      ...currentData,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    aiRole.setUpdateData(updateData);
    await aiRole.save();
    return aiRole;
  }

  /**
   * 根据设置查找AI角色
   */
  static async findBySetting(setting: string): Promise<AiRoleModel[]> {
    const result = await this.query()
      .where('setting', 'like', `%${setting}%`)
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc')
      .get();
    return result.all();
  }

  /**
   * 批量更新AI角色设置
   */
  static async batchUpdateSetting(
    qqAccounts: number[],
    setting: string
  ): Promise<void> {
    await this.query()
      .whereIn('qq_account', qqAccounts)
      .whereNull('deleted_at')
      .update({
        setting: setting,
        updated_at: new Date().toISOString(),
      });
  }
}

export default AiRoleModel;
