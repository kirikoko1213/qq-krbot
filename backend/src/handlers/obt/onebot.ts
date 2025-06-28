import { env } from 'process';
import { EngineMessageType } from '../../types/message';
import conf from '../config/config';
import request from './request';

const baseUrl = conf.get('QQ_ENGINE_URL');

export const botEngine = {
  sendGroupMessage: async (groupId: number, message: string) => {
    await request.post(`${baseUrl}/send_group_msg`, {
      group_id: groupId,
      message: message,
    });
  },
};
