// 1. 成功的結構：isSuccess 必為 true，data 必有值
declare interface SuccessVo<T> {
  isSuccess: true
  code: 'OK'
  message: string
  data: T
}

// 2. 失敗的結構：isSuccess 必為 false，data 固定為 null
declare interface FailVo {
  isSuccess: false
  code: string // 錯誤代碼
  message: string
  data: null
}

// 3. 統一的 BaseVo：對應後端的 BaseVo<T>
declare type BaseVo<T> = SuccessVo<T> | FailVo

declare interface About {
  id: number
  paragraph: string
  createTime: string
  updateTime: string
}

declare interface CoreSkill {
  id: number
  summary: string
  details: string
  createTime: string
  updateTime: string
}

declare interface KeyResponsibility {
  id: number
  workingId: number
  title: string | null
  responsibility: string
}

declare interface WorkingExperience {
  id: number
  startDate: string
  endDate: string | null
  jobTitle: string
  company: string
  location: string
  createTime: string
  updateTime: string
  keyResponsibilities: Array<KeyResponsibility>
}

declare interface Education {
  id: number
  startDate: string
  endDate: string | null
  institution: string
  degree: string | null
  major: string
  location: string
}

declare interface LoginVo {
  token: string
  username: string
}

declare type SocialLinkPlatform = 'github' | 'linkedin'

declare interface SocialLinks {
  github?: string
  linkedin?: string
}

declare interface PublicMap {
  [key: string]: boolean
}

declare interface Contact {
  displayName: string | null
  title: string | null
  email: string
  phone: string | null
  address: string | null
  socialLinks: SocialLinks | null
  publicMap: PublicMap | null
  createTime: string | null
  updateTime: string | null
}
