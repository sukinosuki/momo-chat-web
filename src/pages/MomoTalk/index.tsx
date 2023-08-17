import { AnimatePresence, motion, Reorder } from 'framer-motion'
import update from 'immutability-helper'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'

import api from '@/api'
import { API_ChatMessage } from '@/api/chatMessage'
import SideMenu from '@/components/SideMenu'
import SkewButton from '@/components/SkewButton'
import StudentItem from '@/components/StudentItem'
import icon from '@/icon.svg'
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

let _currentStudent: Student | null = null

//
const MomoTalk = () => {
  // TODO
  const wsUrl = 'ws://127.0.0.1:8080/ws'

  const wsRef = useRef<WebSocket>(null)
  const authState = useSnapshot(authStore)
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  // const [messages, setMessages] = useState<Message[]>([])
  const [allStudent, setAllStudent] = useState<Student[]>([])
  const [stampModalVisible, setStampModalVisible] = useState(false)

  const [isInit, setIsInit] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatMessagesBoxRef = useRef<HTMLDivElement>(null)
  const lastMessageBoxRef = useRef<HTMLDivElement>(null)

  const currentStudent: Student | null = useMemo(() => {
    if (currentIndex == null) {
      _currentStudent = null
      return null
    }

    _currentStudent = allStudent[currentIndex]

    return allStudent[currentIndex]
  }, [allStudent, currentIndex])

  const fetchStudents = async () => {
    const [err, res] = await toCatch(api.student.all())
    if (err) return Promise.reject(err)

    res.forEach((item) => {
      item._messageLoadMoreStatus = null
      item._messageLoadStatus = null
      item.messages = []
    })

    // const sorted = res.sort((item) => (item.is_online ? -1 : 1))
    const sorted = res.sort((s1, s2) => {
      return (s1.is_online ? 0 : 1) - (s2.is_online ? 0 : 1) || s1.id - s2.id
    })
    setAllStudent(sorted)

    return Promise.resolve(res)
  }

  //
  const fetchMessages = async (sid: number, messageId: number | null = null) => {
    await sleep(1000)

    const sid_max = authState.user.id > sid ? authState.user.id : sid
    const sid_min = authState.user.id < sid ? authState.user.id : sid

    const params: API_ChatMessage.All = {
      sid_min: sid_min,
      sid_max: sid_max,
      id: messageId,
      size: 50,
    }
    const [err, res] = await toCatch(api.chatMessage.all(params))
    const index = allStudent.findIndex((s) => s.id === sid)
    console.log('index ', index)
    console.log('currentIndex ', currentIndex)

    if (err) {
      setAllStudent((prev) =>
        update(prev, {
          [index]: {
            _messageLoadStatus: {
              $set: PageStatus.FAILED,
            },
          },
        }),
      )
      // TODO
      return
    }

    setAllStudent((prev) =>
      update(prev, {
        [index]: {
          _messageLoadStatus: {
            $set: PageStatus.LOADED,
          },
          messages: {
            $set: res,
          },
        },
      }),
    )

    lastMessageBoxRef.current?.scrollIntoView()
  }

  const initWs = async () => {
    console.log('[initWs] authStore.token ', authStore.token)

    // const ws = new WebSocket(wsUrl, authStore.token)
    wsRef.current = new WebSocket(wsUrl, authStore.token)
    // const ws = new WebSocket(wsUrl)
    // return wsRef.current

    wsRef.current.onopen = () => {
      console.log('ws open')
    }
    wsRef.current.onmessage = (e) => {
      console.log('[onmessage]', e.data)
      console.log('[onmessage] 当前用户 currentStudent ', _currentStudent)
      console.log('[onmessage] 当前用户 currentIndex ', currentIndex)
      console.log('[onmessage] 当前用户 id', _currentStudent?.id)
      const message = JSON.parse(e.data) as Message
      console.log('[onmessage] message ', message)

      // const isAtBottom =
      //   chatMessagesBoxRef.current!.clientHeight + chatMessagesBoxRef.current!.scrollTop >
      //   chatMessagesBoxRef.current!.scrollHeight - 20

      switch (message.type) {
        // 收到内容消息
        case MessageActionType.NORMAL: {
          // const { type, message: msg, toSid, fromSid } = message
          if (message.from_sid === message.to_sid) return

          const h1 =
            chatMessagesBoxRef.current!.clientHeight +
            chatMessagesBoxRef.current!.scrollTop
          const h2 = chatMessagesBoxRef.current!.scrollHeight - 20
          console.log('h1 ', h1)
          console.log('h2 ', h2)

          const isAtBottom = h1 > h2
          // 清空当前未读
          if (message.from_sid === _currentStudent?.id) {
            sendRead(_currentStudent!.id)
          }

          setAllStudent((prev) => {
            console.log('prev ', prev)

            const findIndex = prev.findIndex((item) => item.id === message.from_sid)

            console.log('findIndex ', findIndex)
            if (findIndex === -1) return prev

            return update(prev, {
              [findIndex]: {
                messages: prev[findIndex].messages
                  ? {
                      $push: [message],
                    }
                  : {
                      $set: [message],
                    },
                unread_count: {
                  $set:
                    message.from_sid !== _currentStudent?.id
                      ? prev[findIndex].unread_count + 1
                      : 0,
                },
              },
            })
          })
          setTimeout(() => {
            // console.log('chatMessagesBoxRef ', chatMessagesBoxRef.current)

            // chatMessagesBoxRef.current!.scrollTop =
            //   chatMessagesBoxRef.current!.scrollHeight
            if (isAtBottom) {
              lastMessageBoxRef.current?.scrollIntoView({ behavior: 'smooth' })
            }
          }, 100)
          break
        }
        // 用户上线
        case MessageActionType.ONLINE: {
          setAllStudent((prev) => {
            console.log('用户上线 prev ', prev)

            const findIndex = prev.findIndex((item) => item.id === message.from_sid)

            console.log('findIndex ', findIndex)
            if (findIndex === -1) return prev

            const list = update(prev, {
              [findIndex]: {
                is_online: {
                  $set: true,
                },
              },
            })
            // const sorted = list.sort((item) => (item.is_online ? -1 : 1))
            const sorted = list.sort((s1, s2) => {
              return (s1.is_online ? 0 : 1) - (s2.is_online ? 0 : 1) || s1.id - s2.id
            })
            // setAllStudent(sorted)
            return sorted
          })
          break
        }
        // 用户下线
        case MessageActionType.OFFLINE: {
          setAllStudent((prev) => {
            const findIndex = prev.findIndex((item) => item.id === message.from_sid)

            console.log('findIndex ', findIndex)
            if (findIndex === -1) return prev

            const list = update(prev, {
              [findIndex]: {
                is_online: {
                  $set: false,
                },
              },
            })

            // const sorted = list.sort((item) => (item.is_online ? -1 : 1))
            const sorted = list.sort((s1, s2) => {
              return (s1.is_online ? 0 : 1) - (s2.is_online ? 0 : 1) || s1.id - s2.id
            })

            return sorted
          })
          break
        }
        case MessageActionType.SEND_PONG: {
          setAllStudent((prev) => {
            console.log('发送消息响应 message ', message)
            console.log('发送消息响应 message ', message)

            const findIndex = prev.findIndex((item) => item.id === message.to_sid)
            console.log('发送消息响应 findIndex ', findIndex)

            if (findIndex === -1) return prev

            console.log(
              '发送消息响应 prev[findIndex].messages ',
              prev[findIndex].messages,
            )

            if (!prev[findIndex].messages) return prev

            const msgIndex = prev[findIndex].messages!.findIndex(
              (msg) => msg.send_key === message.send_key,
            )

            console.log('发送消息响应 msgIndex ', msgIndex)
            if (msgIndex === -1) return prev

            return update(prev, {
              [findIndex]: {
                messages: {
                  [msgIndex]: {
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
      // setState(e.data);
    }
    wsRef.current.onclose = () => {
      console.log('ws close')
    }
    wsRef.current.onerror = () => {
      console.log('ws error')
    }

    // return ws
    return wsRef.current
  }

  const sendMessage = async (messageText: string, msgType = MessageContentType.TEXT) => {
    const message: Message = {
      to_sid: currentStudent?.id,
      from_sid: authStore.user.id,
      message: messageText,
      type: MessageActionType.NORMAL,
      // msgType: MessageContentType.TEXT,
      msg_type: msgType,
      send_key: new Date().getTime().toString(),
      send_status: SendStatus.SENDING,
    }

    wsRef.current?.send(JSON.stringify(message))

    const findIndex = allStudent.findIndex((item) => item.id === currentStudent?.id)

    setAllStudent((prev) => {
      return update(prev, {
        [findIndex]: {
          messages: prev[findIndex].messages
            ? {
                $push: [message],
              }
            : {
                $set: [message],
              },
        },
      })
    })
    setTimeout(() => {
      lastMessageBoxRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleSendTextMessage = async () => {
    console.log('inputRef.current ', inputRef.current)
    console.log('inputRef.current ', inputRef.current?.value)
    if (!inputRef.current) return

    const { value } = inputRef.current! || ''
    if (value.trim().length === 0) return

    sendMessage(value)
    inputRef.current.value = ''
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
    setIsInit(true)
  }

  // 发送 [读取消息] 消息
  const sendRead = async (sid: number) => {
    const data: Message = {
      // from_sid: authState.user.id,
      from_sid: authStore.user.id,
      to_sid: sid,
      type: MessageActionType.READ,
    }

    wsRef.current?.send(JSON.stringify(data))
  }

  useEffect(() => {
    console.log('[useEffect] 当前学生改变 sid ', currentStudent?.id)
    console.log('[useEffect] 当前学生改变 auth id', authState.user?.id)
    if (!currentStudent || currentIndex === null) return

    if (currentStudent.unread_count > 0) {
      // 清空对应学生的未读消息
      sendRead(currentStudent.id)
    }

    if (currentStudent._messageLoadStatus === null) {
      setAllStudent((prev) =>
        update(prev, {
          [currentIndex]: {
            _messageLoadStatus: {
              $set: PageStatus.LOADING,
            },
            unread_count: {
              $set: 0,
            },
          },
        }),
      )

      fetchMessages(currentStudent.id)
    } else {
      // lastMessageBoxRef.current?.scrollIntoView({ behavior: 'smooth' })
      lastMessageBoxRef.current?.scrollIntoView()

      setAllStudent((prev) =>
        update(prev, {
          [currentIndex]: {
            unread_count: {
              $set: 0,
            },
          },
        }),
      )
    }
  }, [currentIndex])

  useEffect(() => {
    if (currentIndex === null) return
  }, [currentIndex])

  useEffect(() => {
    init()
  }, [])

  return (
    <motion.div key="home" className="w-full h-full flex items-center justify-center">
      <motion.div
        drag
        dragElastic={0.1}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        className="w-[80%] h-[80%] flex flex-col bg-white m-auto rounded-2xl overflow-hidden relative"
      >
        <motion.div
          variants={{
            hide: {
              height: 0,
              opacity: 0,
              transition: {
                when: 'afterChildren',
              },
            },
            open: {
              opacity: 1,
              height: '100%',
              transition: {
                when: 'beforeChildren',
              },
            },
          }}
          animate={isInit ? 'hide' : 'open'}
          className="absolute flex items-center z-50 justify-center w-full h-full z-50 top-0 left-0 bg-[#fc8da2] overflow-hidden"
        >
          <motion.div
            variants={{
              hide: {
                scale: 0.5,
                opacity: 0.9,
                transition: {
                  // delay: 0.5,
                },
              },
              open: {
                opacity: 1,
                scale: 1.2,
              },
            }}
            animate={isInit ? 'hide' : 'open'}
            className="flex flex-col text-center items-center justify-center"
          >
            <img className="w-[100px] h-[100px]" src={icon} alt=""></img>
            <span className="text-2xl font-bold text-white mt-2 font-[blueaka]">
              MomoTalk
            </span>
          </motion.div>
        </motion.div>

        <div className="h-[60px] flex flex-row items-center px-4 bg-[linear-gradient(#ff899e,#f79bac)]">
          <motion.div
            variants={{
              hide: {
                y: '100%',
                transition: {
                  delay: 0.5,
                },
              },
              open: {
                y: 0,
              },
            }}
            animate={isInit ? 'open' : 'hide'}
            className="flex flex-row items-center"
          >
            <img className="h-[35px] w-[35px]" src={icon} alt="" />
            <h1
              className="text-2xl text-white ml-2 font-bold font-[blueaka]"
              style={{ filter: 'drop-shadow(0 0 2px #FFFFFF)' }}
            >
              MomoTalk
            </h1>
          </motion.div>
        </div>

        <div className="flex-1 flex overflow-hidden flex-row bg-white">
          <div className="w-[80px] h-[100%] relative">
            <motion.div
              variants={{
                open: {
                  width: '100%',
                },
                hide: {
                  width: 0,
                },
              }}
              animate={isInit ? 'open' : 'hide'}
              className="absolute top-0 left-0 w-full h-full bg-[#4b5b6f]"
            ></motion.div>
            <motion.div
              variants={{
                open: {
                  opacity: 1,
                  transition: {
                    delay: 0.3,
                  },
                },
                hide: {
                  opacity: 0,
                },
              }}
              animate={isInit ? 'open' : 'hide'}
              className="z-40 relative"
            >
              <SideMenu icon="user" active />
              <SideMenu icon="message" />
            </motion.div>
          </div>

          <motion.div
            variants={{
              hide: {
                opacity: 0,
              },
              open: {
                opacity: 1,
                transition: {
                  delay: 0.4,
                },
              },
            }}
            animate={isInit ? 'open' : 'hide'}
            className="flex flex-col w-[300px] bg-[#f3f7f8] h-[100%] overflow-y-auto"
          >
            <div className="flex justify-between items-center px-4 bg-white h-[50px] font-[blueaka]">
              <div>
                <span className="text-md font-bold">未读消息(TODO)</span>
              </div>
              <div>
                <SkewButton
                  shadow
                  onClick={() => {
                    console.log('1')
                  }}
                  className="text-white bg-white py-0-important px-3"
                >
                  <svg
                    data-v-6983fa4c=""
                    width="35px"
                    height="28px"
                    viewBox="0 0 24.00 24.00"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="icon list"
                  >
                    <g id="SVGRepo_iconCarrier">
                      <path
                        d="M5 8H19M5 12H19M5 16H19"
                        stroke="#2a323e"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </g>
                  </svg>
                </SkewButton>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <Reorder.Group axis="y" values={allStudent} onReorder={() => {}}>
                {allStudent.map((student, index) => (
                  <Reorder.Item key={student.id} value={student}>
                    <StudentItem
                      student={student}
                      key={student.id}
                      active={index === currentIndex}
                      onClick={() => setCurrentIndex(index)}
                    ></StudentItem>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          </motion.div>

          <div className="flex  flex-col flex-1 h-full relative">
            <div
              ref={chatMessagesBoxRef}
              className="bg-white flex-1 flex-col p-2 overflow-y-auto"
            >
              {currentStudent?.messages?.map((msg, index) => (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.3 } }}
                  key={`${msg.from_sid}_${msg.to_sid}_${msg.id || 0}_${index}`}
                  className={`flex px-2 mb-1 ${
                    msg.from_sid === authState.user.id ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-[45px] ${
                      msg.from_sid === currentStudent.messages?.[index - 1]?.from_sid &&
                      msg.msg_type === currentStudent.messages?.[index - 1]?.msg_type
                        ? 'h-0'
                        : 'h-[45px]'
                    } overflow-hidden rounded-full`}
                  >
                    {msg.from_sid === currentStudent.messages?.[index - 1]?.from_sid &&
                    msg.msg_type ===
                      currentStudent.messages?.[index - 1]?.msg_type ? null : (
                      <motion.img
                        initial={{
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                        className="w-full h-full object-cover"
                        src={
                          msg.from_sid === authState.user.id
                            ? `https://schale.gg/images/student/collection/${authState?.user.collection_texture}.webp`
                            : `https://schale.gg/images/student/collection/${currentStudent?.collection_texture}.webp`
                        }
                        alt=""
                      />
                    )}
                  </div>
                  <div
                    className={`flex flex-col ${
                      msg.from_sid === authState.user.id
                        ? 'items-end mr-2'
                        : 'items-start ml-2'
                    } flex-1 font-[blueaka]`}
                  >
                    {(msg.from_sid !== currentStudent.messages?.[index - 1]?.from_sid ||
                      msg.msg_type !==
                        currentStudent.messages?.[index - 1]?.msg_type) && (
                      <span className="mb-1">
                        {msg.from_sid === authState.user.id
                          ? authState.user.dev_name
                          : currentStudent.dev_name}
                      </span>
                    )}

                    {msg.msg_type === MessageContentType.STAMP && (
                      <motion.img
                        initial={{ opacity: 0.6 }}
                        animate={{ opacity: 1 }}
                        className="w-[80px] h-[80px]"
                        alt=""
                        src={`/images/stamp/${msg.message}.png`}
                      ></motion.img>
                    )}

                    {msg.msg_type === MessageContentType.TEXT && (
                      <span className="bg-[#4c5a6e] p-2 text-[12px] rounded-md text-white max-w-[300px]">
                        {msg.message}
                        {/* <AnimatePresence>
                      {msg.sendStatus === SendStatus.SENDING && (
                        <motion.span
                          className="inline-block"
                          exit={{
                            width: 0,
                            opacity: 0,
                            transition: {},
                          }}
                        >
                          (Sending)
                        </motion.span>
                      )}
                    </AnimatePresence> */}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={lastMessageBoxRef}></div>
            </div>

            <div className="chat-input-placeholder">
              <AnimatePresence mode="wait">
                {currentStudent && (
                  <motion.div
                    initial={{
                      y: '100%',
                      opacity: 0,
                    }}
                    animate={{
                      y: 0,
                      opacity: 1,
                    }}
                    exit={{
                      y: '100%',
                      opacity: 0,
                    }}
                    transition={{
                      damping: 1,
                    }}
                    key={currentStudent?.id | 0}
                    className="flex flex-row items-center p-2"
                  >
                    <button
                      className="relative text-sm p-1 shadow-md"
                      onClick={() => {
                        console.log('click stamp')

                        setStampModalVisible(true)
                      }}
                    >
                      Stamp
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
                          className="w-full h-full fixed top-0 left-0 z-40 "
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
                          className="absolute w-[440px] h-[300px] flex flex-wrap overflow-y-auto py-2 pl-2 shadow-xl rounded-md bg-white bottom-[140%] -left-[100%] z-50"
                        >
                          {new Array(40).fill('').map((_, index) => (
                            <motion.img
                              onClick={(e) => handleSendStampMessage(e, index)}
                              whileHover={{
                                scale: 1.1,
                              }}
                              key={index}
                              className="w-[60px] h-[60px] mr-3 mb-3"
                              src={`/images/stamp/${
                                index < 9 ? '0' + (index + 1) : index + 1
                              }.png`}
                              alt=""
                            ></motion.img>
                          ))}
                        </motion.div>
                      </motion.div>
                    </button>

                    {currentStudent && (
                      <div className="w-[40px] h-[40px] rounded-full overflow-hidden shrink-0 ml-2">
                        <img
                          className="w-full h-full object-cover scale-[1.8]"
                          src={`https://schale.gg/images/student/collection/${currentStudent?.collection_texture}.webp`}
                          alt=""
                        />
                      </div>
                    )}

                    <input
                      type="text"
                      onKeyPress={(e) => e.key === 'Enter' && handleSendTextMessage()}
                      ref={inputRef}
                      className="w-full h-[40px] p-2 border-1 border-momo  rounded-md text-[12px] outline-none caret-momo"
                      placeholder="请输入"
                    />
                    <SkewButton
                      className="bg-momo ml-4 px-3 py-2"
                      onClick={handleSendTextMessage}
                    >
                      Send to {currentStudent.dev_name}
                    </SkewButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {currentIndex === null && (
              <div className="bg-white absolute w-full h-full left-0 top-0"></div>
            )}

            <AnimatePresence mode="wait">
              {currentStudent &&
                currentStudent._messageLoadStatus === PageStatus.LOADING && (
                  <motion.div
                    key={currentStudent.id || 0}
                    // layoutId="underline"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white absolute w-full h-full left-0 top-0 flex items-center justify-center font-[blueaka]"
                  >
                    <span className="text-md">Loading</span>
                  </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default MomoTalk
