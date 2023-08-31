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
          className="fixed w-full h-full top-0 left-0 flex items-center justify-center font-[blueaka]"
        >
          <motion.div
            initial="hidden"
            variants={{
              open: {
                opacity: 1,
                // y: 0,
                scale: 1,
              },
              hidden: {
                opacity: 0,
                // y: 20,
                // scale: 1.01,
              },
            }}
            animate={open ? 'open' : 'hidden'}
            className="w-full h-full fixed top-0 left-0 z-40 bg-[#00000080] "
            onClick={props.onClose}
          ></motion.div>

          <motion.div
            initial="hidden"
            variants={{
              open: {
                opacity: 1,
                // y: 0,
                scale: 1,
              },
              hidden: {
                opacity: 0,
                // y: 20,
                scale: 1.01,
              },
            }}
            animate={open ? 'open' : 'hidden'}
            // initial={{ opacity: 0, scale: 1.1 }}
            // animate={{
            //   opacity: 1,
            //   scale: 1,
            //   transition: {
            //     // delay: 1,
            //     when: 'beforeChildren',
            //     staggerChildren: 1,
            //   },
            // }}
            // exit={{ opacity: 0, scale: 1.1 }}
            className="w-[1280px] h-[90%] max-md:w-[340px] max-md:h-[80%] bg-white flex flex-wrap pr-0 py-4 pl-4 max-md:py-2 max-md:pl-2 rounded-md overflow-hidden overflow-y-auto z-50"
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
                className="relative w-[110px] h-[130px] max-md:w-[74px] max-md:h-[100px] mr-4 mb-4 max-md:mr-2 max-md:mb-2"
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
                    // src={`https://schale.gg/images/student/collection/${student.collection_texture}.webp`}
                    src={`https://schale.gg/images/student/icon/${student.collection_texture}.png`}
                    alt={student.dev_name}
                    loading="lazy"
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
  )
}

export default StudentModal
