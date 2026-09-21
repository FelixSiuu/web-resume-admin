import api from './api'

const basePath = '/myInfo'
export interface aboutDto {
  paragraph: About['paragraph']
}
export const aboutService = {
  getAboutMe: async (): Promise<BaseVo<About[]>> => {
    const url = `${basePath}/about`
    return api.get(url)
  },
  editAboutMe: async (id: number, postBody: aboutDto): Promise<BaseVo<void>> => {
    const url = `${basePath}/about/${id}`
    return api.put(url, postBody)
  },
  deleteAboutMe: async (id: number): Promise<BaseVo<void>> => {
    const url = `${basePath}/about/${id}`
    return api.delete(url)
  },
  addAboutMe: async (postBody: aboutDto): Promise<BaseVo<void>> => {
    const url = `${basePath}/about`
    return api.post(url, postBody)
  }
}
export interface skillDto {
  summary: CoreSkill['summary']
  details: CoreSkill['details']
}
export const coreSkillsService = {
  getCoreSkills: async (): Promise<BaseVo<CoreSkill[]>> => {
    const url = `${basePath}/coreSkills`
    return api.get(url)
  },
  editCoreSkill: async (id: number, postBody: skillDto): Promise<BaseVo<void>> => {
    const url = `${basePath}/coreSkills/${id}`
    return api.put(url, postBody)
  },
  deleteCoreSkill: async (id: number): Promise<BaseVo<void>> => {
    const url = `${basePath}/coreSkills/${id}`
    return api.delete(url)
  },
  addCoreSkill: async (postBody: skillDto): Promise<BaseVo<void>> => {
    const url = `${basePath}/coreSkills`
    return api.post(url, postBody)
  }
}

export type WorkingExpDto = Omit<WorkingExperience, 'id' | 'createTime' | 'updateTime'>
export const workingExpService = {
  getWorkingExp: async (): Promise<BaseVo<WorkingExperience[]>> => {
    const url = `${basePath}/workingExperiences`
    return api.get(url)
  },
  editWorkingExp: async (id: number, postBody: WorkingExpDto): Promise<BaseVo<void>> => {
    const url = `${basePath}/workingExperiences/${id}`
    return api.post(url, postBody)
  },
  deleteWorkingExp: async (id: number): Promise<BaseVo<void>> => {
    const url = `${basePath}/workingExperiences/${id}`
    return api.delete(url)
  },
  addWorkingExp: async (postBody: WorkingExpDto): Promise<BaseVo<void>> => {
    const url = `${basePath}/workingExperiences`
    return api.post(url, postBody)
  }
}

export type EduDto = Omit<Education, 'id'>
export const educationService = {
  getEducation: async (): Promise<BaseVo<Education[]>> => {
    const url = `${basePath}/education`
    return api.get(url)
  },
  editEducation: async (id: number, postBody: EduDto): Promise<BaseVo<void>> => {
    const url = `${basePath}/education/${id}`
    return api.post(url, postBody)
  },
  deleteEducation: async (id: number): Promise<BaseVo<void>> => {
    const url = `${basePath}/education/${id}`
    return api.delete(url)
  },
  addEducation: async (postBody: EduDto): Promise<BaseVo<void>> => {
    const url = `${basePath}/education`
    return api.post(url, postBody)
  }
}

export type ContactDto = Omit<Contact, 'createTime' | 'updateTime'>
export const contactService = {
  getContact: async (): Promise<BaseVo<Contact>> => {
    const url = `${basePath}/contact`
    return api.get(url)
  },
  updateContact: async (postBody: ContactDto): Promise<BaseVo<void>> => {
    const url = `${basePath}/contact`
    return api.post(url, postBody)
  }
}

export const avatarService = {
  getAvatar: async (): Promise<Blob> => {
    const url = `${basePath}/avatar`
    return api.get(url, { responseType: 'blob' })
  },
  uploadAvatar: async (file: File): Promise<BaseVo<void>> => {
    const url = `${basePath}/avatar`
    const formData = new FormData()
    formData.append('avatar', file)
    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  deleteAvatar: async (): Promise<BaseVo<void>> => {
    const url = `${basePath}/avatar`
    return api.delete(url)
  }
}
