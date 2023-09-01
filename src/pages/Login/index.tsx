import { AnimatePresence, motion } from 'framer-motion'
import update from 'immutability-helper'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { debounce } from 'throttle-debounce'

import api from '@/api'
import Modal from '@/components/Modal'
import SkewButton from '@/components/SkewButton'
import authStore from '@/store/authStore'
import { Student } from '@/type/Student'
import { toCatch } from '@/utils'

import StudentModal from './components/StudentModal'

enum ModalAction {
  Normal = 0,
  LoginSuccess = 1,
}

type ModalStatus = {
  open: boolean
  content: string
  action: ModalAction
}

//
const Login = () => {
  const navigate = useNavigate()

  const [selectedStudent, setSelectedStudent] = useState<Student | null>()

  const [chooseStudentModalVisible, setChooseStudentModalVisible] =
    useState<boolean>(false)

  const [students, setStudents] = useState<Student[]>([])
  const [modalStatus, setModalStatus] = React.useState<ModalStatus>({
    open: false,
    content: '',
    action: ModalAction.Normal,
  })

  const closeModal = () => {
    setModalStatus((prev) =>
      update(prev, {
        open: { $set: false },
      }),
    )
  }

  const openModal = (msg: string) => {
    setModalStatus((prev) =>
      update(prev, {
        open: { $set: true },
        content: {
          $set: msg,
        },
      }),
    )
  }

  const handleModalOk = async () => {
    switch (modalStatus.action) {
      case ModalAction.Normal:
        closeModal()
        break
      case ModalAction.LoginSuccess:
        navigate('/')
        break
      default:
        closeModal()

        break
    }
  }

  const handleLogin = debounce(
    300,
    async () => {
      if (!selectedStudent?.id) {
        openModal('请选择学生')
        return
      }

      const [err, res] = await toCatch(api.auth.login(selectedStudent.id))
      if (err) return
      console.log('res ', res)

      authStore.setToken(res)
      localStorage.setItem('token', res)

      setModalStatus((prev) =>
        update(prev, {
          open: { $set: true },
          content: {
            $set: '登录成功',
          },
          action: {
            $set: ModalAction.LoginSuccess,
          },
        }),
      )
    },
    { atBegin: true },
  )

  //
  const fetchStudent = async () => {
    const [err, res] = await toCatch(api.student.all())
    if (err) return

    setStudents(res)
  }

  //
  const handleChooseStudent = async (student: Student) => {
    if (student.is_online || student.is_latest_login) return

    setSelectedStudent(student)
    setChooseStudentModalVisible(false)
  }

  const clearToken = () => {
    authStore.clear()
    //
    localStorage.removeItem('token')
  }

  useEffect(() => {
    clearToken()
    fetchStudent()
  }, [])

  return (
    <div className="absolute left-0 top-0 z-50 flex h-full w-full select-none items-center justify-center bg-[#00000080]">
      <div className="flex flex-col items-center justify-end">
        <div className="flex w-[300px] flex-col items-center justify-center">
          <motion.div
            onClick={() => setChooseStudentModalVisible(true)}
            animate="rest"
            whileHover="hover"
            className="relative h-[100px] w-[100px] cursor-pointer overflow-hidden rounded-xl"
          >
            <AnimatePresence mode="wait">
              <motion.img
                variants={{
                  hover: {
                    scale: 1.2,
                  },
                }}
                key={selectedStudent?.id || 0}
                alt={selectedStudent?.dev_name}
                exit={{ opacity: 0, scale: 1.2, transition: { delay: 0.3 } }}
                animate={{ opacity: 1, scale: 1 }}
                initial={{ opacity: 0, scale: 1.2 }}
                className="h-full w-full object-cover"
                src={
                  selectedStudent
                    ? `https://schale.gg/images/student/icon/${selectedStudent.collection_texture}.png`
                    : 'https://schale.gg/images/schale.png'
                }
              ></motion.img>
            </AnimatePresence>

            <motion.div
              variants={{
                rest: {
                  opacity: 0,
                  scale: 1.2,
                },
                hover: {
                  opacity: 1,
                  scale: 1,
                },
              }}
              className="absolute left-0 top-0 flex h-full w-full items-center justify-center bg-[#00000080] text-sm text-white"
            >
              选择学生
            </motion.div>
          </motion.div>

          <div className="mt-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedStudent?.id || 0}
                initial={{ opacity: 0, scaleY: 1.1, y: 20 }}
                animate={{ opacity: 1, scaleY: 1, y: 0 }}
                exit={{ opacity: 0, scaleY: 0.9, y: -20, transition: { delay: 0.2 } }}
                className="text-xl font-bold text-white"
              >
                {selectedStudent?.dev_name || '请选择学生'}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <motion.div layout className="mt-8 flex w-full flex-col md:flex-row">
          <SkewButton colored className="w-full py-2" onClick={handleLogin}>
            Login
          </SkewButton>
        </motion.div>
      </div>

      <StudentModal
        open={chooseStudentModalVisible}
        onChoose={handleChooseStudent}
        onClose={() => setChooseStudentModalVisible(false)}
        students={students}
      ></StudentModal>

      <Modal
        open={modalStatus.open}
        content={modalStatus.content}
        onOk={handleModalOk}
      ></Modal>
    </div>
  )
}

export default Login
