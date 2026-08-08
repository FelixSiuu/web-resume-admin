import api from './api'

export const resumeService = {
  getResumePreview: async (): Promise<Blob> => {
    const url = '/resume'
    return api.get(url, { responseType: 'blob' })
  },
  exportResume: async (): Promise<Blob> => {
    const url = '/resume/export'
    return api.get(url, { responseType: 'blob' })
  }
}
