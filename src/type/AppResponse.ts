export type AppResponse<T = null> = {
  msg: string
  code: number
  data: T
}
