import { Message } from './Message'
import { PageStatus } from './PageStatus'

export type Student = {
  collection_texture: string
  dev_name: string
  family_name: string
  id: number
  is_online: boolean
  is_latest_login: boolean
  messages: Message[] | null
  unread_count: number

  _messageLoadStatus: PageStatus | null
  _messageLoadMoreStatus: PageStatus | null
}
