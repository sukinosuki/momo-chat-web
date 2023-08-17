export type Message = {
  type: MessageActionType
  msg_type?: MessageContentType
  message?: string
  from_sid?: number
  to_sid?: number
  send_key?: string | null
  send_status?: SendStatus

  id?: number
}

export enum MessageActionType {
  NORMAL = 1,
  SEND_PONG = 2,
  ONLINE = 3,
  OFFLINE = 4,
  READ = 5,
}

export enum SendStatus {
  SENDING = 1,
  OK = 2,
  FAILED = 3,
}

export enum MessageContentType {
  // PING = 0,
  TEXT = 1,
  PICTURE = 2,
  VOICE = 3,
  STAMP = 4,
}
