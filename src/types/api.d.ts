// 1. 成功的結構：isSuccess 必為 true，data 必有值
declare interface SuccessVo<T> {
  isSuccess: true
  code: 'OK'
  message: string
  data: T
}

// 2. 失敗的結構：isSuccess 必為 false，data 可能是 T 或 null
declare interface FailVo<T = null> {
  isSuccess: false
  code: string // 錯誤代碼
  message: string
  data: T | null
}

// 3. 統一的 BaseVo：對應後端的 BaseVo<T>
// isSuccess 為 true 時 data 是 T；為 false 時 data 可能是 T 或 null
declare type BaseVo<T> = SuccessVo<T> | FailVo<T>

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
  username: string
  /** Same value as API-domain XSRF_TOKEN cookie; returned because cross-origin JS cannot read that cookie. */
  xsrfToken: string
}

/** Cooldown seconds (`cd`) from POST /auth/forgot-password and GET /auth/delete-token. */
declare interface CoolDownVo {
  cd: number
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

declare interface Project {
  slug: string
  sortOrder: number
  name: string
  value: string
  summary: string
  stacks: string[]
  featured: boolean
  createTime: string
  updateTime: string
}

declare interface ProjectDetail extends Project {
  role?: string | null
  duration?: string | null
  challenge?: string | null
  solution?: string | null
  impact?: string | null
  liveUrl?: string | null
  repoUrl?: string | null
}
