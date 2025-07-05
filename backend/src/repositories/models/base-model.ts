import { Model } from 'sutando';

abstract class BaseModel<T> extends Model {
  /**
   * 抽象方法：子类需要实现此方法来定义字段映射
   * key: T 类型中的属性名（驼峰命名）
   * value: 数据库字段名（下划线命名）
   */
  abstract getFieldMapping(): Record<string, string>;

  /**
   * 子类需要实现此方法来定义忽略更新字段
   */
  getIgnoreUpdateFields(): string[] {
    return ['createdAt', 'updatedAt'];
  }

  /**
   * 子类需要实现此方法来定义忽略创建字段
   */
  getIgnoreCreateFields(): string[] {
    return ['createdAt', 'updatedAt'];
  }

  /**
   * 获取转换后的数据，只返回 T 类型中定义的属性
   */
  getData(): T {
    const data = this as any;
    const mapping = this.getFieldMapping();
    const result = {} as any;

    // 只转换映射中定义的字段
    for (const [camelKey, snakeKey] of Object.entries(mapping)) {
      if (data[snakeKey] !== undefined) {
        result[camelKey] = data[snakeKey];
      }
    }

    return result as T;
  }

  setUpdateData(data: T) {
    const mapping = this.getFieldMapping();
    for (const [camelKey, snakeKey] of Object.entries(mapping)) {
      if (!this.getIgnoreUpdateFields().includes(camelKey)) {
        (this as any)[snakeKey] = (data as any)[camelKey];
      }
    }
  }

  setCreateData(data: T) {
    const mapping = this.getFieldMapping();
    for (const [camelKey, snakeKey] of Object.entries(mapping)) {
      if (!this.getIgnoreCreateFields().includes(camelKey)) {
        (this as any)[snakeKey] = (data as any)[camelKey];
      }
    }
  }
}

export default BaseModel;
