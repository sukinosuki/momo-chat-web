import { motion, useInView } from 'framer-motion'
import React, { useEffect, useMemo, useRef } from 'react'

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
    return authStore.user.id === student.id
  }, [authStore, student])

  const studentName = useMemo(() => {
    const { dev_name: devName, is_online, id } = student
    if (isMe) {
      return `${devName}(${id})(我)`
    }

    return `${devName}(${id})(${is_online ? '在线' : '离线'})`
  }, [student, isMe])

  useEffect(() => {
    if (inView) {
    }
  }, [inView])
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
      className="user-item select-none cursor-pointer font-[blueaka]"
      onClick={props.onClick}
    >
      <div className={`flex flex-row p-2 ${active ? 'bg-[#dae5e9]' : ''}`}>
        <div className="w-[60px] h-[60px] max-md:w-[40px] max-md:h-[40px] bg-slate-300 rounded-full overflow-hidden shrink-0">
          {inView && (
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full object-cover max-md:scale-[1.5]"
              src={`https://schale.gg/images/student/icon/${student.collection_texture}.png`}
              alt=""
            />
          )}
        </div>

        <div className="flex flex-col justify-between ml-2 flex-1 h-[60px] max-md:h-[40px] overflow-hidden">
          <span
            className={`${
              student.is_online ? 'text-[#2a323e]' : 'text-[#9ca5ab]'
            } text-xl max-md:text-sm font-bold`}
          >
            {studentName}
          </span>
          <span className="text-[#9ca5ab] text-md max-md:text-xs text-ellipsis truncate">
            自行车伙伴招募中……(1/5)
          </span>
        </div>

        <div className="flex items-center shrink-0">
          {student.unread_count ? (
            <span className="bg-[#fb4719] text-white px-[6px] rounded-sm">
              {student.unread_count}
            </span>
          ) : null}
        </div>
      </div>
    </motion.div>
  )
}

export default UserItem
