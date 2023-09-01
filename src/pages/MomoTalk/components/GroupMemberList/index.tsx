import { motion, Reorder } from 'framer-motion'
import React from 'react'

import { Student } from '@/type/Student'

type TProps = {
  students: Student[]
  className?: string
}

//
const GroupMemberList: React.FC<TProps> = (props) => {
  const { students, className } = props

  return (
    <div className={[' overflow-y-auto p-1', className].join(' ')}>
      <Reorder.Group
        axis="y"
        values={students}
        onReorder={() => {
          // TODO
        }}
      >
        {students.map((student) => (
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
  )
}

export default GroupMemberList
