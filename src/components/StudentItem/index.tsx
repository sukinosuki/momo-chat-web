import { motion, useInView } from 'framer-motion'
import React, { useMemo, useRef } from 'react'

import authStore from '@/store/authStore'

import { Student } from '../../type/Student'

type TProps = {
  student: Student
  active?: boolean
  onClick: () => void
}

//
const UserItem: React.FC<TProps> = (props) => {
  const { student, active } = props

  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  const isMe = useMemo(() => {
    return authStore.state.user.id === student.id
  }, [authStore, student])

  const studentName = useMemo(() => {
    const { dev_name: devName, is_online, id } = student
    if (isMe) {
      return `${devName}(${id})(我)`
    }

    return `${devName}(${id})(${is_online ? '在线' : '离线'})`
  }, [student, isMe])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      whileInView={{
        opacity: 1,
        transition: {
          delay: 0.2,
        },
      }}
      viewport={{ once: true }}
      className="user-item cursor-pointer select-none"
      onClick={props.onClick}
    >
      <div className={`flex flex-row p-2 ${active ? 'bg-[#dae5e9]' : ''}`}>
        <div className="h-[60px] w-[60px] shrink-0 overflow-hidden rounded-full bg-slate-300 max-md:h-[40px] max-md:w-[40px]">
          {inView && (
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full w-full object-cover max-md:scale-[1.5]"
              src={`https://schale.gg/images/student/icon/${student.collection_texture}.png`}
              alt={student.collection_texture}
            />
          )}
        </div>

        <div className="ml-2 flex h-[60px] flex-1 flex-col justify-between overflow-hidden max-md:h-[40px]">
          <span
            className={`${
              student.is_online ? 'text-[#2a323e]' : 'text-[#9ca5ab]'
            } text-xl font-bold max-md:text-sm`}
          >
            {studentName}
          </span>
          {/* TODO */}
          <span className="text-md truncate text-ellipsis text-[#9ca5ab] max-md:text-xs">
            自行车伙伴招募中……(1/5)
          </span>
        </div>

        <div className="flex shrink-0 items-center">
          {student.unread_count ? (
            <span className="rounded-sm bg-[#fb4719] px-[6px] text-white">
              {student.unread_count}
            </span>
          ) : null}
        </div>
      </div>
    </motion.div>
  )
}

export default UserItem
