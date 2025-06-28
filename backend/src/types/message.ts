/**
 * {"self_id":1105624883,"user_id":2187391949,"time":1751080098,"message_id":271846689,"message_seq":2065,"message_type":"group","sender":{"user_id":2187391949,"nickname":"†✰⇝树理♡†","card":"†✰⇝TT树理♡†","role":"admin","title":""},"raw_message":"1","font":14,"sub_type":"normal","message":[{"type":"text","data":{"text":"1"}}],"message_format":"array","post_type":"message","group_id":815182520}
 */
export type EngineMessageType = {
  self_id: number;
  user_id: number;
  time: number;
  message_id: number;
  message_seq: number;
  message_type: 'group' | 'private';
  sender: {
    user_id: number;
    nickname: string;
    card: string;
    role: string;
    title: string;
  };
  raw_message: string;
  font: number;
  sub_type: 'normal' | 'anonymous' | 'notice';
  message: {
    type:
      | 'text'
      | 'image'
      | 'at'
      | 'reply'
      | 'forward'
      | 'video'
      | 'audio'
      | 'file'
      | 'dice'
      | 'shake'
      | 'anonymous';
    data: {
      text: string;
    };
  }[];
  message_format: string;
  post_type: string;
  group_id: number;
};

export type WrapMessageType = {
  engineMessage: EngineMessageType;
  scene: MessageScene;
  atAccount?: number;
  textMessage: string;
};

export type MessageScene = 'pr' | 'gr' | 'atMe' | 'atOther' | 'atAll';
