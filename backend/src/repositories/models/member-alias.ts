import BaseModel from './base-model.js';
import type { MemberAliasData } from '@/common/types.js';

class MemberAliasModel extends BaseModel<MemberAliasData> {
  table = 'member_alias';

  /**
   * 实现字段映射，定义 TypeScript 类型属性与数据库字段的对应关系
   */
  getFieldMapping(): Record<string, string> {
    return {
      id: 'id',
      groupId: 'group_id',
      qqAccount: 'qq_account',
      alias: 'alias',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    };
  }

  static async findAll() {
    const result = await this.query().get();
    return result.all();
  }

  static delete(id: number[]) {
    return this.query().destroy(id);
  }

  static findOne(id: number) {
    return this.query().where('id', '=', id).first();
  }

  static async findByGroupIdAndQqAccount(groupId: number, qqAccount: number) {
    return await this.query()
      .where('group_id', '=', groupId)
      .where('qq_account', '=', qqAccount)
      .first();
  }

  static async findByGroupId(groupId: number) {
    const result = await this.query()
      .where('group_id', '=', groupId)
      .orderBy('qq_account', 'asc')
      .get();
    return result.all();
  }

  static async softDelete(id: number) {
    return await this.query()
      .where('id', '=', id)
      .update({ deleted_at: new Date().toISOString() });
  }

  /**
   * 根据群组ID和QQ账号查找别名列表
   */
  static async findAliasByGroupIdAndQQAccount(
    groupId: number,
    qqAccount: number
  ): Promise<string[]> {
    const result = await this.query()
      .where('group_id', '=', groupId)
      .where('qq_account', '=', qqAccount)
      .first();

    if (!result) {
      return [];
    }

    const data = result.getData();
    if (!data.alias) {
      return [];
    }

    return JSON.parse(data.alias as string);
  }

  /**
   * 更新或创建成员别名
   */
  static async updateAlias(
    groupId: number,
    qqAccount: number,
    alias: string[]
  ): Promise<void> {
    const existingRecord = await this.findByGroupIdAndQqAccount(
      groupId,
      qqAccount
    );

    if (existingRecord) {
      // 更新现有记录
      const currentData = existingRecord.getData();
      const updateData: MemberAliasData = {
        ...currentData,
        alias: JSON.stringify(alias),
      };
      existingRecord.setUpdateData(updateData);
      await existingRecord.save();
    } else {
      // 创建新记录
      const data: MemberAliasData = {
        groupId: groupId,
        qqAccount: qqAccount,
        alias: JSON.stringify(alias),
      };
      const memberAlias = new MemberAliasModel();
      memberAlias.setCreateData(data);
      await memberAlias.save();
    }
  }

  /**
   * 删除成员别名（软删除）
   */
  static async deleteAlias(groupId: number, qqAccount: number): Promise<void> {
    const existingRecord = await this.findByGroupIdAndQqAccount(
      groupId,
      qqAccount
    );

    if (existingRecord) {
      await this.softDelete(existingRecord.getData().id!);
    }
  }
}

export default MemberAliasModel;
