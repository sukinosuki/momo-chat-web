import './index.scss'

import { AnimatePresence, motion } from 'framer-motion'
import update from 'immutability-helper'
import React, { useEffect } from 'react'

import api from '../../api'
import { toCatch } from '../../utils'
import Modal from '../Modal'
import SkewButton from '../SkewButton'

enum ActionType {
  LOGIN = 1,
  REGISTER = 2,
}

type ModalStatus = {
  open: boolean
  content: string
}
const Login = () => {
  const [actionType, setActionType] = React.useState(ActionType.LOGIN)
  const [modalStatus, setModalStatus] = React.useState<ModalStatus>({
    open: false,
    content: '',
  })

  const handleModalClose = () => {
    setModalStatus((prev) =>
      update(prev, {
        open: { $set: false },
      }),
    )
  }

  const handleLogin = async () => {
    if (actionType !== ActionType.LOGIN) {
      setActionType(ActionType.LOGIN)
      return
    }

    setModalStatus((prev) =>
      update(prev, {
        open: { $set: true },
        content: {
          $set: '登录成功',
        },
      }),
    )
  }

  const handleRegister = async () => {
    if (actionType !== ActionType.REGISTER) {
      setActionType(ActionType.REGISTER)
      return
    }
  }
  const fetchStudent = async () => {
    console.log('[fetchStudent]')

    const [err, res] = await toCatch(api.student.all())
    if (err) return
    console.log('res ', res)
  }
  console.log('actionType === ActionType.LOGIN ', actionType === ActionType.LOGIN)

  useEffect(() => {
    fetchStudent()
  }, [])
  return (
    <div className="w-full h-full absolute top-0 left-0 z-50 bg-[#00000080] flex items-center justify-center">
      <motion.div className="flex flex-col justify-end items-center">
        <motion.div className="w-[400px]" layout>
          <AnimatePresence mode="wait">
            {actionType === ActionType.LOGIN && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{
                  duration: 0.3,
                  damping: 50,
                  mass: 0.5,
                }}
                key="login"
              >
                <form>
                  <input
                    type="text"
                    placeholder="请输入4-10位数字字母的用户名"
                    className="input"
                  />
                  <input
                    type="password"
                    placeholder="请输入6-12位密码"
                    className="input mt-4"
                  />
                </form>
              </motion.div>
            )}
            {actionType === ActionType.REGISTER && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                key="register"
                transition={{
                  duration: 0.3,
                  damping: 50,
                  mass: 0.5,
                }}
              >
                <form>
                  <input
                    type="text"
                    placeholder="请输入4-10位数字字母的用户名"
                    className="input"
                  />
                  <input
                    type="password"
                    placeholder="请输入6-12位密码"
                    className="input mt-4"
                  />
                  <input
                    type="text"
                    placeholder="昵称最大10文字"
                    className="input mt-4"
                  />
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div layout className="mt-8 flex flex-col md:flex-row w-full">
          <SkewButton
            colored={actionType === ActionType.LOGIN}
            flex1={actionType === ActionType.LOGIN}
            onClick={handleLogin}
          >
            Login
          </SkewButton>

          <SkewButton
            colored={actionType === ActionType.REGISTER}
            className={`mt-4 md:ml-4 md:mt-0`}
            flex1={actionType === ActionType.REGISTER}
            onClick={handleRegister}
          >
            Register
          </SkewButton>
        </motion.div>
      </motion.div>

      <Modal
        open={modalStatus.open}
        content={modalStatus.content}
        onOk={handleModalClose}
      ></Modal>
    </div>
  )
}

export default Login
