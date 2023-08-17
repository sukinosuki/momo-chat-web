import { Student } from '@/type/Student'

import http from './http'

export default {
  login: (sid: number) => http.post<string>('/api/v1/auth/login', { id: sid }),

  getAuth: () => http.get<Student>('/api/v1/auth'),
}
