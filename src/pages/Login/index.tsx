import './index.scss'

import { AnimatePresence, motion } from 'framer-motion'
import update from 'immutability-helper'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import api from '@/api'
import Modal from '@/components/Modal'
import SkewButton from '@/components/SkewButton'
import BaseLayout from '@/layout/BaseLayout'
import authStore, { clear } from '@/store/authStore'
import { Student } from '@/type/Student'
import { toCatch } from '@/utils'

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

  const [chooseStudentModalVisible, setChooseStudentModalVisible] = useState<boolean>()

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

  const handleLogin = async () => {
    // 校验学生有效性
    if (!selectedStudent?.id) {
      openModal('请选择学生')
      return
    }

    const [err, res] = await toCatch(api.auth.login(selectedStudent.id))
    if (err) return
    console.log('res ', res)

    authStore.token = res
    authStore.isLogin = true
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
  }

  //
  const fetchStudent = async () => {
    console.log('[fetchStudent]')

    const [err, res] = await toCatch(api.student.all())
    if (err) return
    // console.log('res ', res)
    // res.forEach((item, index) => (item.isOnline = index % 3 === 0))

    setStudents(res)
  }

  //
  const handleChooseStudent = async (student: Student) => {
    if (student.is_online || student.is_latest_login) return

    setSelectedStudent(student)
    setChooseStudentModalVisible(false)
  }

  const clearToken = () => {
    clear()
    //
    localStorage.removeItem('token')
  }

  useEffect(() => {
    clearToken()
    fetchStudent()
  }, [])

  return (
    <div className="w-full h-full absolute top-0 left-0 z-50 bg-[#00000080] flex items-center justify-center select-none font-[blueaka]">
      <div className="flex flex-col justify-end items-center">
        <motion.div
          className="w-[300px] flex flex-col items-center justify-center"
          layout
        >
          <motion.div
            onClick={() => setChooseStudentModalVisible(true)}
            animate="rest"
            whileHover="hover"
            className="w-[100px] h-[100px] rounded-xl overflow-hidden relative cursor-pointer"
          >
            <motion.img
              variants={{
                hover: {
                  scale: 1.2,
                },
              }}
              alt=""
              className="object-cover w-full h-full"
              src={
                selectedStudent
                  ? `https://schale.gg/images/student/collection/${selectedStudent?.collection_texture}.webp`
                  : 'https://schale.gg/images/schale.png'
              }
            ></motion.img>

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
              className="absolute w-full h-full top-0 left-0 text-sm text-white flex items-center justify-center bg-[#00000080]"
            >
              选择学生
            </motion.div>
          </motion.div>

          <div className="mt-2">
            <span className="text-white text-xl font-bold">
              {selectedStudent?.dev_name || '请选择学生'}
            </span>
          </div>
        </motion.div>

        <motion.div layout className="mt-8 flex flex-col md:flex-row w-full">
          <SkewButton colored className="w-full" onClick={handleLogin}>
            Login
          </SkewButton>
        </motion.div>
      </div>

      <AnimatePresence>
        {chooseStudentModalVisible && (
          <motion.div className="fixed w-full h-full top-0 left-0 flex items-center justify-center font-[blueaka]">
            <div
              className="w-full h-full fixed top-0 left-0 z-40 bg-[#00000080] "
              onClick={() => setChooseStudentModalVisible(false)}
            ></div>

            <motion.div
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: {
                  // delay: 1,
                  when: 'beforeChildren',
                  staggerChildren: 1,
                },
              }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="w-[1200px] h-[90%] bg-white flex flex-wrap p-4 rounded-md overflow-hidden overflow-y-auto z-50"
            >
              {students.map((student) => (
                <motion.div
                  onClick={() => handleChooseStudent(student)}
                  initial={{
                    opacity: 0,
                    scale: 0.9,
                  }}
                  whileInView={{
                    opacity: 1,
                    scale: 1,
                    transition: {
                      delay: 0.3,
                    },
                  }}
                  className="relative w-[110px] h-[130px] mr-4 mb-4"
                  key={student.id}
                >
                  <motion.div
                    whileHover="hover"
                    animate="rest"
                    className="rounded-md overflow-hidden absolute w-full h-full cursor-pointer"
                  >
                    <motion.img
                      variants={{
                        hover:
                          student.is_online || student.is_latest_login
                            ? {}
                            : {
                                scale: 1.2,
                              },
                      }}
                      className="w-full h-full object-cover"
                      src={`https://schale.gg/images/student/collection/${student.collection_texture}.webp`}
                      alt=""
                    />

                    <div className="absolute bottom-0 left-0 flex flex-col items-center justify-center w-full bg-[#ffffffcc]">
                      {/* <span className="text-md text-black-400">Aru</span> */}
                      <span className="text-md text-black-400">{student.dev_name}</span>
                    </div>
                    <motion.div
                      variants={{
                        rest:
                          student.is_online || student.is_latest_login
                            ? {}
                            : {
                                opacity: 0,
                                scale: 1.2,
                              },
                        hover:
                          student.is_online || student.is_latest_login
                            ? {}
                            : {
                                opacity: 1,
                                scale: 1,
                              },
                      }}
                      className="absolute w-full h-full top-0 left-0 text-sm text-white flex items-center justify-center bg-[#00000080]"
                    >
                      {student.is_online || student.is_latest_login
                        ? '不可选择'
                        : '选择学生'}
                    </motion.div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        open={modalStatus.open}
        content={modalStatus.content}
        onOk={handleModalOk}
      ></Modal>
    </div>
  )
}

export default Login
