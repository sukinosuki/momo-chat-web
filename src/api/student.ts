import { Student } from '../type/Student'
import http from './http'

export namespace API_Student {
  export type All = {
    isOnline?: boolean
  }
}

export default {
  all: (params?: API_Student.All) => http.get<Student[]>('/api/v1/student', params),
}
