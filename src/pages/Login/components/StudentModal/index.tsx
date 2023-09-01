import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'

import { Student } from '@/type/Student'

type TProps = {
  open: boolean
  onChoose: (student: Student) => void
  onClose: () => void
  students: Student[]
}

//
const StudentModal: React.FC<TProps> = (props) => {
  const { open, students } = props
  const [flag, setFlag] = useState(false)

  useEffect(() => {
    if (!flag) {
      setFlag(true)
    }
  }, [open])

  return (
    <AnimatePresence>
      {flag && (
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
          animate={open ? 'open' : 'hidden'}
          className="fixed left-0 top-0 flex h-full w-full items-center justify-center"
        >
          <motion.div
            initial="hidden"
            variants={{
              open: {
                opacity: 1,
                scale: 1,
              },
              hidden: {
                opacity: 0,
              },
            }}
            animate={open ? 'open' : 'hidden'}
            className="fixed left-0 top-0 z-40 h-full w-full bg-[#00000080] "
            onClick={props.onClose}
          ></motion.div>

          <motion.div
            initial="hidden"
            variants={{
              open: {
                opacity: 1,
                scale: 1,
              },
              hidden: {
                opacity: 0,
                scale: 1.01,
              },
            }}
            animate={open ? 'open' : 'hidden'}
            className="z-50 flex grid 
            h-[90%] 
            grid-cols-4
            flex-wrap
            gap-4
            overflow-hidden
             overflow-y-auto rounded-md bg-white p-4 max-md:h-[80%] 
            max-md:w-[340px] max-md:gap-2
            max-md:p-2 md:w-[768px] md:grid-cols-6 lg:w-[1024px] 
            lg:grid-cols-8
            xl:w-[1280px]
            xl:grid-cols-10"
          >
            {students.map((student) => (
              <motion.div
                onClick={() => props.onChoose(student)}
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
                viewport={{ once: true }}
                className="relative h-[130px] max-md:h-[100px]  "
                key={student.id}
              >
                <motion.div
                  whileHover="hover"
                  animate="rest"
                  className="absolute h-full w-full cursor-pointer overflow-hidden rounded-md"
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
                    className="h-full w-full object-cover"
                    src={`https://schale.gg/images/student/icon/${student.collection_texture}.png`}
                    alt={student.dev_name}
                    loading="lazy"
                  />

                  <div className="absolute bottom-0 left-0 flex w-full flex-col items-center justify-center bg-[#ffffffcc]">
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
                    className="absolute left-0 top-0 flex h-full w-full items-center justify-center bg-[#00000080] text-sm text-white"
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
  )
}

export default StudentModal
