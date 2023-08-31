import { AnimatePresence, motion, Reorder } from 'framer-motion'
import html2canvas from 'html2canvas'
import update from 'immutability-helper'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { BiDownload, BiMinus } from 'react-icons/bi'
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import { useSnapshot } from 'valtio'

import api from '@/api'
import { API_ChatMessage } from '@/api/chatMessage'
import { BaFilter } from '@/components/icons'
import SkewButton from '@/components/SkewButton'
import StudentItem from '@/components/StudentItem'
import icon from '@/icon.svg'
import SideMenu from '@/pages/MomoTalk/components/SideMenu'
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

import ChatMessageItem from './components/ChatMessageItem'
import WsClosedModal from './components/WsClosedModal'

let _currentStudent: Student | null = null
let _isGroupChat = false
let _isOne2OneChat = false
let _currentStudentLock = false
let _messageScrollTimer: number | null = null
let _groupMessageCount = 0
let _reconnectWebsocketTimer: number | null = null

// const messages = new Array(10000).fill('').map((_, index) => ({
//   type: 1,
//   msg_type: 1,
//   message: `hello-${index}`,
//   from_sid: 10000,
//   to_sid: 0,
//   send_key: index,
//   send_status: 2,
//   id: index,
// }))
enum WsStatus {
  CONNECTED = 1,
  CLOSED = 2,
}

//
const MomoTalk = () => {
  console.log('<MomoTalk> render')

  const authState = useSnapshot(authStore)
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
  const chatMessagesBoxRef = useRef<HTMLDivElement>(null)

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
    // await sleep(2000)

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
        console.log('_currentStudent?.messages ', _currentStudent?.messages)

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
        const index = prev.findIndex((s) => s.id === authStore.user.id)
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
      console.log('[onmessage] 当前用户 currentStudent ', _currentStudent)
      console.log('[onmessage] 当前用户 currentStudentId ', currentStudentId)
      console.log('[onmessage] 当前用户 id', _currentStudent?.id)
      const message = JSON.parse(e.data) as Message
      console.log('[onmessage] message ', message)

      switch (message.type) {
        // 收到内容消息
        case MessageActionType.NORMAL: {
          // const { type, message: msg, toSid, fromSid } = message
          if (message.from_sid === message.to_sid) return

          if (message.to_sid !== 0) {
            // 清空当前未读
            if (message.from_sid === _currentStudent?.id) {
              sendRead(_currentStudent!.id)

              // 本地未读数+1
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

          // 判断虚拟列表是否在底部附近位置才滚动到最后一条记录位置
          const isAtBottom =
            chatMessagesBoxRef.current!.clientHeight +
              chatMessagesBoxRef.current!.scrollTop >
            chatMessagesBoxRef.current!.scrollHeight - 120

          if (_messageScrollTimer) {
            clearTimeout(_messageScrollTimer)
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
      console.log('ws close')

      setWsStatus(WsStatus.CLOSED)

      if (_reconnectWebsocketTimer) {
        clearTimeout(_reconnectWebsocketTimer)
      }

      _reconnectWebsocketTimer = setTimeout(() => {
        initWs()
      }, 3000)

      // TODO:
      setStudents((prev) => {
        const index = prev.findIndex((s) => s.id === authStore.user.id)

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

    wsRef.current.onerror = () => {
      console.log('ws error')
    }

    // return ws
    return wsRef.current
  }

  const sendMessage = async (messageText: string, msgType = MessageContentType.TEXT) => {
    // 发送群消息,群消息sid默认为0
    const toSid = isOne2OneChat ? currentStudent!.id : 0

    const message: Message = {
      // to_sid: currentStudent?.id,
      to_sid: toSid,
      from_sid: authState.user.id,
      message: messageText,
      type: MessageActionType.NORMAL,
      // msgType: MessageContentType.TEXT,
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
    authStore.user = res
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

    if (currentStudent._messageLoadStatus === null) {
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
    <motion.div key="home" className="flex h-full w-full items-center justify-center">
      <motion.div
        drag
        dragElastic={0.05}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        className="relative m-auto flex h-[100%] w-[100%] flex-col overflow-hidden bg-white md:h-[80%] md:w-[1200px] md:rounded-2xl"
      >
        <motion.div
          variants={{
            hide: {
              height: 0,
              // transition: {
              //   delay: 0.5,
              // },
            },
            open: {
              height: '100%',
            },
          }}
          animate={isInit ? 'hide' : 'open'}
          className="absolute left-0 top-0 z-50 z-[500] flex h-full w-full items-center justify-center overflow-hidden bg-[#fc8da2]"
        >
          <motion.div
            variants={{
              hide: {
                scale: 0.5,
                opacity: 0.6,
              },
              open: {
                opacity: 1,
                scale: 1.2,
                transition: {
                  delay: 0.3,
                },
              },
            }}
            animate={isInit ? 'hide' : 'open'}
            className="flex flex-col items-center justify-center text-center"
          >
            <img className="h-[100px] w-[100px]" src={icon} alt=""></img>
            <span className="mt-2 text-2xl font-bold text-white">MomoTalk</span>
          </motion.div>
        </motion.div>

        <div className="flex h-[48px] flex-row items-center  justify-center bg-[linear-gradient(#ff899e,#f79bac)] px-4 md:h-[60px] md:justify-start">
          <motion.div
            variants={{
              hide: {
                y: '40%',
              },
              open: {
                y: 0,
                transition: {
                  delay: 0.2,
                },
              },
            }}
            animate={isInit ? 'open' : 'hide'}
            className="flex flex-row items-center"
          >
            <img className="h-[35px] w-[35px]" src={icon} alt="" />
            <h1
              className="ml-2 text-2xl font-bold text-white"
              style={{ filter: 'drop-shadow(0 0 2px #FFFFFF)' }}
            >
              MomoTalk
            </h1>
          </motion.div>
        </div>

        <div className="relative flex flex-1 flex-row overflow-hidden bg-white">
          <div className="relative h-[100%] w-[80px] max-md:hidden">
            <motion.div
              variants={{
                open: {
                  width: '100%',
                  transition: {
                    delay: 0.2,
                  },
                },
                hide: {
                  width: 0,
                },
              }}
              animate={isInit ? 'open' : 'hide'}
              className="absolute left-0 top-0 h-full w-full bg-[#4b5b6f]"
            ></motion.div>

            <motion.div
              initial="hide"
              variants={{
                open: {
                  opacity: 1,
                  transition: {
                    delay: 0.5,
                  },
                },
                hide: {
                  opacity: 0,
                },
              }}
              animate={isInit ? 'open' : 'hide'}
              className="relative z-40 overflow-hidden"
            >
              <SideMenu
                icon="user"
                active={isOne2OneChat}
                onClick={() => setTabIndex(0)}
              />
              <SideMenu
                icon="message"
                active={isGroupChat}
                onClick={() => setTabIndex(1)}
              />
            </motion.div>
          </div>

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
                            // onClick={() => {
                            //   setStudentListSideVisible(false)
                            // }}
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
                      {/* <Reorder.Group
                  axis="y"
                  values={allStudent}
                  draggable={false}
                  onReorder={() => {}}
                > */}
                      {students.map((student, index) => (
                        // <Reorder.Item draggable={false} drag key={student.id} value={student}>
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
                      {/* </Reorder.Item> */}
                      {/* </Reorder.Group> */}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          )}

          <div className="relative flex h-full flex-1 flex-col">
            <div className="flex flex-1 flex-row overflow-hidden" id="chat-messages-box">
              <div
                ref={chatMessagesBoxRef}
                className="flex-1 flex-col overflow-y-auto bg-white px-2"
              >
                <Virtuoso
                  ref={virtuosoRef}
                  style={{ height: '100%' }}
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
                          alt=""
                        />
                        <div
                          className="max-md:[hidden] absolute  left-0 top-0 h-full w-full"
                          onClick={() => setStudentListSideVisible(true)}
                        ></div>
                      </div>
                    )}

                    {/* <button
                      onClick={() => {
                        // TODO
                        html2canvas(
                      
                          document.getElementById('chat-messages-box'),
                        ).then((canvas) => {
                          document.body.appendChild(canvas)
                        })
                      }}
                    >
                      <BiDownload color="#2a323e" fontSize={28}></BiDownload>
                    </button> */}

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
                          alt=""
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
                          // initial={{ scaleY: 1, y: 20 }}
                          // animate={{ scaleY: 1, y: 0 }}
                          // exit={{ scale: 1, opacity: 0, y: -20 }}
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
                    // layoutId="underline"
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
            <div className="w-[180px] overflow-y-auto p-1">
              <Reorder.Group axis="y" values={students} onReorder={() => {}}>
                {students.map((student, index) => (
                  <Reorder.Item key={student.id} value={student}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{
                        opacity: 1,
                      }}
                      viewport={{ once: true }}
                      className="mb-1 flex items-center"
                    >
                      <div
                        className={`h-[30px] w-[30px] overflow-hidden rounded-full ${
                          student.is_online ? '' : 'grayscale'
                        }`}
                      >
                        <img
                          loading="lazy"
                          className="h-full w-full object-cover"
                          src={`https://schale.gg/images/student/icon/${student.collection_texture}.png`}
                          alt={student.collection_texture}
                        />
                      </div>
                      <span className="ml-1 text-sm">{student.dev_name}</span>
                    </motion.div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          )}
        </div>
      </motion.div>

      <WsClosedModal open={wsStatus === WsStatus.CLOSED}></WsClosedModal>
    </motion.div>
  )
}

export default MomoTalk
