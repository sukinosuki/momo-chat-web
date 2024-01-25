import { motion } from 'framer-motion'
import React, { useEffect, useMemo, useRef } from 'react'

import { Message, MessageContentType } from '@/type/Message'
import { Student } from '@/type/Student'

type TProps = {
  message: Message
  index: number
  authState: any
  isOne2OneChat: boolean
  currentStudent: Student | null
  groupMessages: Message[]
  studentsChatMap: Record<number, Student>
}

//
const ChatMessageItem: React.FC<TProps> = (props) => {
  const {
    message: msg,
    index,
    authState,
    isOne2OneChat,
    currentStudent,
    groupMessages,
    studentsChatMap,
  } = props

  const [isStampMsg, isTextMsg] = useMemo(() => {
    return [
      msg.msg_type === MessageContentType.STAMP,
      msg.msg_type === MessageContentType.TEXT,
    ]
  }, [msg])

  // 该消息是否与上一条消息是同一个人发的
  const isThisMsgAndPrevMsgIsFromSameStudent = useMemo(() => {
    return (
      msg.from_sid ===
      (isOne2OneChat ? currentStudent?.messages : groupMessages)?.[index - 1]?.from_sid
    )
  }, [msg, isOne2OneChat, currentStudent, groupMessages])

  // 该消息与上一条消息是否是同一类型的消息
  const isThisMsgAndPrevMsgIsSameType = useMemo(() => {
    return (
      msg.msg_type ===
      (isOne2OneChat ? currentStudent?.messages : groupMessages)?.[index - 1]?.msg_type
    )
  }, [msg, isOne2OneChat, currentStudent, groupMessages])

  // 消息是否是我发的
  const isMsgFromMine = useMemo(() => {
    return msg.from_sid === authState.user.id
  }, [msg, authState])

  // 要显示的头像
  const messageAvatar = useMemo(() => {
    return isMsgFromMine
      ? `https://schale.gg/images/student/icon/${authState?.user.id}.webp`
      : isOne2OneChat
      ? `https://schale.gg/images/student/icon/${currentStudent?.id}.webp`
      : `https://schale.gg/images/student/icon/${studentsChatMap[msg.from_sid!]?.id}.webp`
  }, [isMsgFromMine, isOne2OneChat, studentsChatMap])

  // 要显示的用户名
  const messageUsername = useMemo(() => {
    return isMsgFromMine
      ? authState.user.dev_name
      : isOne2OneChat
      ? currentStudent?.dev_name
      : studentsChatMap[msg.from_sid!]?.dev_name
  }, [isMsgFromMine, msg, authState, isOne2OneChat, currentStudent, studentsChatMap])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: 0.3 } }}
      key={`${msg.from_sid}_${msg.to_sid}_${msg.id || 0}_${index}`}
      className={`flex px-0 pb-1 md:px-2 ${isMsgFromMine ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`w-[45px] ${
          isThisMsgAndPrevMsgIsFromSameStudent && isThisMsgAndPrevMsgIsSameType
            ? 'h-0'
            : 'h-[45px]'
        } overflow-hidden rounded-full`}
      >
        {isThisMsgAndPrevMsgIsFromSameStudent && isThisMsgAndPrevMsgIsSameType ? null : (
          <img className="h-full w-full object-cover" src={messageAvatar} alt="avatar" />
        )}
      </div>

      <div
        className={`flex flex-1 flex-col ${
          isMsgFromMine ? 'mr-1 items-end md:mr-2' : 'ml-1 items-start md:ml-2'
        }`}
      >
        {(!isThisMsgAndPrevMsgIsFromSameStudent || !isThisMsgAndPrevMsgIsSameType) && (
          <div className="mb-1">{messageUsername}</div>
        )}

        {isStampMsg && (
          <motion.img
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            className="h-[80px] w-[80px]"
            alt="stamp"
            src={`/images/stamp/${msg.message}.png`}
          ></motion.img>
        )}

        {isTextMsg && (
          <div className="max-w-[300px] rounded-md bg-[#4c5a6e] p-2 text-[12px] leading-none text-white">
            {msg.message}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default React.memo(ChatMessageItem, () => true)
