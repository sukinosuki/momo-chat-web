import { Message } from '@/type/Message'

import http from './http'

export namespace API_ChatMessage {
  export type All = {
    sid_min: number
    sid_max: number
    size?: number
    id?: number | null
  }
}

export default {
  all: (params: API_ChatMessage.All) =>
    http.get<Message[]>('/api/v1/chat-message', params),
}
