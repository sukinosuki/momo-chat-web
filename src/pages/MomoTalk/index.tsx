import { AnimatePresence, motion } from 'framer-motion'
import update from 'immutability-helper'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { BiMinus } from 'react-icons/bi'
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import { useSnapshot } from 'valtio'

import api from '@/api'
import { API_ChatMessage } from '@/api/chatMessage'
import { BaFilter } from '@/components/icons'
import SkewButton from '@/components/SkewButton'
import StudentItem from '@/components/StudentItem'
import authStore from '@/store/authStore'
import {
  Message,
  MessageActionType,
  MessageContentType,
  SendStatus,
} from '@/type/Message'
import { PageStatus } from '@/type/PageStatus'
import { Student } from '@/type/Student'
import { sleep, toCatch } from '@/utils'

import BoxHeader from './components/BoxHeader'
import BoxLoading from './components/BoxLoading'
import ChatMessageItem from './components/ChatMessageItem'
import GroupMemberList from './components/GroupMemberList'
import SideBar from './components/SideBar'
import WsClosedModal from './components/WsClosedModal'

let _currentStudent: Student | null = null
let _isGroupChat = false
let _isOne2OneChat = false
let _currentStudentLock = false
let _messageScrollTimer: number | null = null
let _groupMessageCount = 0
let _reconnectWebsocketTimer: number | null = null

enum WsStatus {
  CONNECTED = 1,
  CLOSED = 2,
}

//
const MomoTalk = () => {
  console.log('<MomoTalk> render')

  const authState = useSnapshot(authStore.state)
  const [currentStudentId, setCurrentStudentId] = useState<number | null>(null)
  const [students, setStudents] = useState<Student[]>([])

  const [studentsChatMap, setStudentChatMap] = useState<Record<number, Student>>({})
  const [groupMessages, setGroupMessages] = useState<Message[]>([])

  const [stampModalVisible, setStampModalVisible] = useState(false)
  const [studentListSideVisible, setStudentListSideVisible] = useState(false)
  const [wsStatus, setWsStatus] = useState<WsStatus | null>(null)

  const [tabIndex, setTabIndex] = useState(0)
  const [isInit, setIsInit] = useState(false)

  const wsRef = useRef<WebSocket>(null)
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [isGroupChat, isOne2OneChat] = useMemo(() => {
    _isGroupChat = tabIndex === 1
    _isOne2OneChat = tabIndex === 0

    return [_isGroupChat, _isOne2OneChat]
  }, [tabIndex])

  const currentStudent = useMemo(() => {
    if (currentStudentId == null) {
      _currentStudent = null
      return null
    }

    _currentStudent = studentsChatMap[currentStudentId]

    return _currentStudent
  }, [studentsChatMap, currentStudentId])

  console.log('currentStudent ', currentStudent)
  const totalUnreadMessageCount = useMemo(() => {
    return students.reduce((acc: number, next) => {
      acc += next.unread_count
      return acc
    }, 0)
  }, [students])

  //
  const fetchStudents = async () => {
    const [err, res] = await toCatch(api.student.all())
    if (err) return Promise.reject(err)

    const _studentMap = res.reduce((acc: Record<number, Student>, next) => {
      next._messageLoadMoreStatus = null
      next._messageLoadStatus = null
      next.messages = []

      acc[next.id] = next

      return acc
    }, {})

    const sorted = sortByOnlineAndUnread(res)

    const simpleList: any[] = sorted.map((item) => {
      const { id, dev_name, family_name, collection_texture, unread_count, is_online } =
        item

      return {
        id,
        dev_name,
        family_name,
        collection_texture,
        unread_count,
        is_online,
      }
    })

    setStudents(simpleList)
    setStudentChatMap(_studentMap)

    return Promise.resolve(res)
  }

  const sortByOnlineAndUnread = (list: Student[]) => {
    return list.sort((s1, s2) => {
      return (
        (s1.is_online ? 0 : 1) - (s2.is_online ? 0 : 1) ||
        s2.unread_count - s1.unread_count ||
        s1.id - s2.id
      )
    })
  }

  //
  const fetchMessages = async (sid: number, messageId: number | null = null) => {
    const sid_max = authState.user.id > sid ? authState.user.id : sid
    const sid_min = authState.user.id < sid ? authState.user.id : sid

    const params: API_ChatMessage.All = {
      sid_min: sid_min,
      sid_max: sid_max,
      id: messageId,
      size: 50,
    }
    const [err, res] = await toCatch(api.chatMessage.all(params))

    // TODO: 测试获取消息出错时
    if (err) {
      setStudentChatMap((prev) =>
        update(prev, {
          [sid]: {
            _messageLoadStatus: {
              $set: PageStatus.FAILED,
            },
          },
        }),
      )
      return
    }

    setStudentChatMap((prev) =>
      update(prev, {
        [sid]: {
          _messageLoadStatus: {
            $set: PageStatus.LOADED,
          },
          messages: {
            $unshift: res, // TODO: 有可能在获取历史消息时有新的消息到来
          },
        },
      }),
    )

    if (sid === currentStudentId) {
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex?.({
          index: _currentStudent?.messages?.length || 999,
        })
      }, 100)
    }
  }

  const initWs = async () => {
    const wsUrl = import.meta.env.VITE_WS_URL

    wsRef.current = new WebSocket(wsUrl, authState.token)

    wsRef.current.onopen = () => {
      console.log('ws open')
      setWsStatus(WsStatus.CONNECTED)
      if (_reconnectWebsocketTimer) {
        clearTimeout(_reconnectWebsocketTimer)
      }

      setStudents((prev) => {
        const index = prev.findIndex((s) => s.id === authStore.state.user.id)
        if (index === -1) return prev
        return update(prev, {
          [index]: {
            is_online: {
              $set: true,
            },
          },
        })
      })
    }

    wsRef.current.onmessage = (e) => {
      const message = JSON.parse(e.data) as Message

      switch (message.type) {
        // 收到内容消息
        case MessageActionType.NORMAL: {
          // const { type, message: msg, toSid, fromSid } = message
          if (message.from_sid === message.to_sid) return

          if (message.to_sid !== 0) {
            // 清空当前未读
            if (message.from_sid === _currentStudent?.id) {
              sendRead(_currentStudent!.id)

              // 未读数+1
            } else {
              setStudents((prev) => {
                const findIndex = prev.findIndex((item) => item.id === message.from_sid)

                if (findIndex === -1) return prev

                return update(prev, {
                  [findIndex]: {
                    unread_count: {
                      $set: prev[findIndex].unread_count + 1,
                    },
                  },
                })
              })
            }
            setStudentChatMap((prev) => {
              return update(prev, {
                [message.from_sid!]: {
                  messages: {
                    $push: [message],
                  },
                },
              })
            })
          } else {
            setGroupMessages((prev) => {
              const some = prev.some((msg) => msg.send_key === message.send_key)
              if (some) return prev

              return update(prev, {
                $push: [message],
              })
            })
          }

          // TODO: 判断虚拟列表是否在底部附近位置才滚动到最后一条记录位置

          if (_messageScrollTimer) {
            clearTimeout(_messageScrollTimer)
          }

          let isAtBottom = false

          const element = document.querySelector('div[data-test-id="virtuoso-item-list"]')
          if (element) {
            console.log('element!.style.paddingBottom ', element!.style.paddingBottom)

            const paddingBottom = Number(element?.style?.paddingBottom?.replace('px', ''))
            if (paddingBottom <= 200) {
              isAtBottom = true
            }
          }

          _messageScrollTimer = setTimeout(() => {
            if (_isOne2OneChat) {
              if (message.from_sid === _currentStudent?.id && isAtBottom) {
                virtuosoRef.current?.scrollToIndex?.({
                  index: _currentStudent?.messages?.length || 999,
                  behavior: 'smooth',
                })
              }
            } else if (_isGroupChat) {
              // TODO
              if (isAtBottom) {
                virtuosoRef.current?.scrollToIndex?.({
                  index: _groupMessageCount,
                  behavior: 'smooth',
                })
              }
            }
          }, 100)
          break
        }
        // 用户上线
        case MessageActionType.ONLINE: {
          setStudents((prev) => {
            const findIndex = prev.findIndex((item) => item.id === message.from_sid)

            if (findIndex === -1) return prev

            const list = update(prev, {
              [findIndex]: {
                is_online: {
                  $set: true,
                },
              },
            })

            return sortByOnlineAndUnread(list)
          })
          break
        }
        // 用户下线
        case MessageActionType.OFFLINE: {
          setStudents((prev) => {
            const findIndex = prev.findIndex((item) => item.id === message.from_sid)

            if (findIndex === -1) return prev

            const list = update(prev, {
              [findIndex]: {
                is_online: {
                  $set: false,
                },
              },
            })

            return sortByOnlineAndUnread(list)
          })
          break
        }
        case MessageActionType.SEND_PONG: {
          if (!message.to_sid) return

          setStudentChatMap((prev) => {
            const find = prev[message.to_sid!]
            const index =
              find.messages?.findIndex((msg) => msg.send_key === message.send_key) || -1

            if (index === -1) return prev

            return update(prev, {
              [message.to_sid!]: {
                messages: {
                  [index]: {
                    send_status: {
                      $set: SendStatus.OK,
                    },
                  },
                },
              },
            })
          })

          break
        }
      }
    }

    wsRef.current.onclose = () => {
      setWsStatus(WsStatus.CLOSED)

      if (_reconnectWebsocketTimer) {
        clearTimeout(_reconnectWebsocketTimer)
      }

      _reconnectWebsocketTimer = setTimeout(() => {
        initWs()
      }, 3000)

      // TODO:
      setStudents((prev) => {
        const index = prev.findIndex((s) => s.id === authStore.state.user.id)

        if (index === -1) return prev

        return update(prev, {
          [index]: {
            is_online: {
              $set: false,
            },
          },
        })
      })
    }

    wsRef.current.onerror = (e) => {
      console.log('ws error ', e)
    }

    // return ws
    return wsRef.current
  }

  const sendMessage = async (messageText: string, msgType = MessageContentType.TEXT) => {
    // 发送群消息,群消息sid默认为0
    const toSid = isOne2OneChat ? currentStudent!.id : 0

    const message: Message = {
      to_sid: toSid,
      from_sid: authState.user.id,
      message: messageText,
      type: MessageActionType.NORMAL,

      msg_type: msgType,
      send_key: new Date().getTime().toString(),
      send_status: SendStatus.SENDING,
    }

    wsRef.current?.send(JSON.stringify(message))

    if (isOne2OneChat) {
      setStudentChatMap((prev) =>
        update(prev, {
          [toSid]: {
            messages: {
              $push: [message],
            },
          },
        }),
      )
    } else {
      setGroupMessages((prev) =>
        update(prev, {
          $push: [message],
        }),
      )
    }

    console.log('virtuosoRef.current. ', virtuosoRef.current)

    setTimeout(() => {
      virtuosoRef.current?.scrollToIndex?.({
        index: isGroupChat
          ? groupMessages.length
          : studentsChatMap[toSid].messages?.length || 999,
        behavior: 'smooth',
      })
    }, 30)
  }

  //
  const handleSendTextMessage = async () => {
    const { value } = inputRef.current! || ''
    if (value.trim().length === 0) return

    sendMessage(value)
    inputRef.current!.value = ''
  }

  const handleSendStampMessage = async (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>,
    index: number,
  ) => {
    e.stopPropagation()

    let msg = index + 1 + ''
    if (index < 9) {
      msg = '0' + (index + 1)
    }
    sendMessage(msg, MessageContentType.STAMP)

    setStampModalVisible(false)
  }

  const init = async () => {
    const [err, res] = await toCatch(api.auth.getAuth())
    if (err) return

    authStore.setUser(res)
    await initWs()

    await fetchStudents()
    await sleep()
    setStudentListSideVisible(true)
    setIsInit(true)
  }

  // 发送 [读取消息] 消息
  const sendRead = async (sid: number) => {
    const data: Message = {
      // from_sid: authState.user.id,
      from_sid: authState.user.id,
      to_sid: sid,
      type: MessageActionType.READ,
    }

    wsRef.current?.send(JSON.stringify(data))
  }

  useEffect(() => {
    _groupMessageCount = groupMessages.length
  }, [groupMessages])

  useEffect(() => {
    if (_messageScrollTimer) {
      clearTimeout(_messageScrollTimer)
    }
    _messageScrollTimer = setTimeout(() => {
      virtuosoRef.current?.scrollToIndex?.({
        index: _isGroupChat ? _groupMessageCount : _currentStudent?.messages?.length || 0,
      })
    }, 300)
  }, [tabIndex])

  useEffect(() => {
    if (!currentStudent || currentStudentId === null) return

    // 清空对应学生的未读消息
    if (currentStudent.unread_count > 0) {
      sendRead(currentStudent.id)
    }

    const index = students.findIndex((item) => item.id === currentStudent.id)

    // _currentOne2OneChatCount = currentStudent.messages?.length || 0

    setStudents((prev) =>
      update(prev, {
        [index]: {
          unread_count: {
            $set: 0,
          },
        },
      }),
    )

    if (
      currentStudent._messageLoadStatus === null ||
      currentStudent._messageLoadStatus === PageStatus.FAILED
    ) {
      setStudentChatMap((prev) =>
        update(prev, {
          [currentStudent.id]: {
            _messageLoadStatus: {
              $set: PageStatus.LOADING,
            },
          },
        }),
      )

      fetchMessages(currentStudent.id)
    } else {
      if (_messageScrollTimer) {
        clearTimeout(_messageScrollTimer)
      }
      _messageScrollTimer = setTimeout(() => {
        virtuosoRef.current?.scrollToIndex?.({
          index: _currentStudent?.messages?.length || 999,
        })
      }, 300)
    }

    return function () {
      if (_messageScrollTimer) {
        clearTimeout(_messageScrollTimer)
      }
    }
  }, [currentStudentId])

  useEffect(() => {
    init()
  }, [])

  return (
    <motion.div
      key="home"
      className="flex h-full w-full items-center justify-center bg-[#00000080]"
    >
      <motion.div
        drag
        dragElastic={0.05}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        className="relative m-auto flex h-[100%] w-[100%] flex-col overflow-hidden bg-white md:h-[80%] md:w-[780px] md:rounded-2xl lg:w-[1024px] xl:w-[1200px]"
      >
        <BoxLoading isInit={isInit}></BoxLoading>

        <BoxHeader isInit={isInit}></BoxHeader>

        <div className="relative flex flex-1 flex-row overflow-hidden bg-white">
          <SideBar
            isInit={isInit}
            activeIndex={tabIndex}
            onIndexChange={(index) => setTabIndex(index)}
          ></SideBar>

          {isOne2OneChat && (
            <AnimatePresence>
              <motion.div
                initial={{
                  display: 'none',
                }}
                variants={{
                  open: {
                    display: 'flex',
                  },
                  hidden: {
                    display: 'none',
                    transition: {
                      delay: 0.3,
                    },
                  },
                }}
                animate={studentListSideVisible ? 'open' : 'hidden'}
              >
                <motion.div
                  initial="hide"
                  variants={{
                    hide: {
                      opacity: 0,
                    },
                    open: {
                      opacity: 1,
                      transition: {
                        delay: 0.3,
                      },
                    },
                  }}
                  exit="hide"
                  // animate="open"
                  animate={studentListSideVisible ? 'open' : 'hidden'}
                  className="absolute left-0 right-0 top-0 z-[200] flex h-[100%] w-full flex-col overflow-y-auto bg-[#00000080] max-md:px-6 max-md:py-14 md:relative md:w-[300px]"
                >
                  <div className="flex flex-col overflow-hidden bg-[#f3f7f8] shadow-xl max-md:rounded-md">
                    <div className="flex h-[50px] items-center justify-between bg-white px-4">
                      <div>
                        <span className="text-md font-bold">
                          未读消息({totalUnreadMessageCount})
                        </span>
                      </div>

                      <div className="flex  ">
                        <div className="max-md:hidden">
                          <SkewButton
                            shadow
                            onClick={() => {
                              // TODO
                            }}
                            className="py-0-important bg-white px-3 text-white"
                          >
                            <BaFilter></BaFilter>
                          </SkewButton>
                        </div>
                        {currentStudentId && (
                          <div className="md:hidden">
                            <SkewButton
                              shadow
                              onClick={() => {
                                setStudentListSideVisible(false)
                              }}
                              className="py-0-important bg-white px-3 text-white"
                            >
                              <BiMinus color="#2a323e" fontSize={28}></BiMinus>
                            </SkewButton>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {students.map((student, index) => (
                        <StudentItem
                          student={student}
                          key={student.id}
                          active={student.id === currentStudentId}
                          onClick={() => {
                            if (_currentStudentLock) return
                            _currentStudentLock = true

                            setCurrentStudentId(student.id)

                            setTimeout(() => {
                              _currentStudentLock = false
                            }, 700)
                          }}
                        ></StudentItem>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          )}

          <div className="relative flex h-full flex-1 flex-col">
            <div className="flex flex-1 flex-row overflow-hidden" id="chat-messages-box">
              <div className="flex-1 flex-col overflow-y-auto bg-white">
                <Virtuoso
                  ref={virtuosoRef}
                  style={{ height: '100%' }}
                  key={currentStudent?.id}
                  data={isOne2OneChat ? currentStudent?.messages || [] : groupMessages}
                  itemContent={(index, msg) => (
                    <ChatMessageItem
                      groupMessages={groupMessages}
                      index={index}
                      authState={authState}
                      currentStudent={currentStudent}
                      isOne2OneChat={isOne2OneChat}
                      message={msg}
                      studentsChatMap={studentsChatMap}
                    ></ChatMessageItem>
                  )}
                ></Virtuoso>
              </div>
            </div>

            <div className="chat-input-placeholder flex-shrink-0 bg-white">
              <AnimatePresence mode="wait">
                {((isOne2OneChat && currentStudent) || isGroupChat) && (
                  <motion.div
                    initial={{
                      y: '10%',
                      opacity: 0,
                    }}
                    animate={{
                      y: 0,
                      opacity: 1,
                    }}
                    exit={{
                      y: '10%',
                      opacity: 0,
                    }}
                    key={currentStudent?.id || 0}
                    className="flex flex-row items-center p-2"
                  >
                    {isOne2OneChat && currentStudent && (
                      <div className="relative h-[40px] w-[40px] shrink-0 overflow-hidden rounded-full">
                        <img
                          className="h-full w-full scale-[1.8] object-cover"
                          src={`https://schale.gg/images/student/icon/${currentStudent?.collection_texture}.png`}
                          alt={currentStudent?.collection_texture}
                        />
                        <div
                          className="max-md:[hidden] absolute  left-0 top-0 h-full w-full"
                          onClick={() => setStudentListSideVisible(true)}
                        ></div>
                      </div>
                    )}

                    <button
                      className="relative m-2 rounded-sm text-xs"
                      onClick={() => {
                        setStampModalVisible(true)
                      }}
                    >
                      <div className="h-6 w-6">
                        <motion.img
                          whileHover={{ scale: 1.1 }}
                          className="h-full w-full object-cover"
                          src="/images/stamp/01.png"
                          alt="stamp"
                        />
                      </div>
                      <motion.div
                        initial={{
                          display: 'none',
                        }}
                        variants={{
                          open: {
                            display: 'block',
                          },
                          hidden: {
                            display: 'none',
                            transition: {
                              delay: 0.2,
                            },
                          },
                        }}
                        animate={stampModalVisible ? 'open' : 'hidden'}
                      >
                        <div
                          className="fixed left-0 top-0 z-40 h-full w-full "
                          onClick={(e) => {
                            e.stopPropagation()
                            setStampModalVisible(false)
                          }}
                        ></div>

                        <motion.div
                          initial="hidden"
                          variants={{
                            open: {
                              opacity: 1,
                              y: 0,
                            },
                            hidden: {
                              opacity: 0,
                              y: 20,
                            },
                          }}
                          animate={stampModalVisible ? 'open' : 'hidden'}
                          className="absolute bottom-[140%] left-[0] z-50 flex h-[300px] w-[300px] flex-wrap overflow-y-auto rounded-md bg-white py-2 pl-2 shadow-xl md:w-[440px]"
                        >
                          {new Array(40).fill('').map((_, index) => (
                            <motion.img
                              onClick={(e) => handleSendStampMessage(e, index)}
                              initial={{
                                opacity: 0.4,
                              }}
                              whileHover={{
                                scale: 1.1,
                              }}
                              whileInView={{
                                // scale: 1.1,
                                opacity: 1,
                                transition: {
                                  delay: 0.2,
                                },
                              }}
                              viewport={{ once: true }}
                              key={index}
                              className="mb-3 mr-3 h-[60px] w-[60px]"
                              src={`/images/stamp/${
                                index < 9 ? '0' + (index + 1) : index + 1
                              }.png`}
                              loading="lazy"
                              alt="stamp"
                            ></motion.img>
                          ))}
                        </motion.div>
                      </motion.div>
                    </button>

                    <input
                      type="text"
                      onKeyPress={(e) => e.key === 'Enter' && handleSendTextMessage()}
                      ref={inputRef}
                      maxLength={100}
                      className="border-1 h-[40px] w-full rounded-md border-momo p-2  text-[12px] caret-momo outline-none"
                      placeholder="请输入"
                    />
                    <SkewButton
                      className="ml-4 flex-shrink-0 bg-momo px-6 py-2"
                      onClick={handleSendTextMessage}
                    >
                      Send
                    </SkewButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isOne2OneChat && currentStudentId === null && (
              <div className="absolute left-0 top-0 h-full w-full bg-white"></div>
            )}

            <AnimatePresence mode="wait">
              {isOne2OneChat &&
                currentStudent &&
                [null, PageStatus.LOADING].includes(
                  currentStudent._messageLoadStatus,
                ) && (
                  <motion.div
                    key={currentStudent.id || 0}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-white"
                  >
                    <span className="text-md">Loading</span>
                  </motion.div>
                )}
            </AnimatePresence>
          </div>

          {isGroupChat && (
            <GroupMemberList className="w-[180px]" students={students}></GroupMemberList>
          )}
        </div>
      </motion.div>

      <WsClosedModal open={wsStatus === WsStatus.CLOSED}></WsClosedModal>
    </motion.div>
  )
}

export default MomoTalk
