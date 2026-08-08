'use client'

import { useEffect, useState } from 'react'
import { Button, message, Spin } from 'antd'
import SectionTitle from '@/components/sectionTitle'
import { resumeService } from '@/services/resume.service'
import { useAuthStore } from '@/stores/auth.store'

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  return 'Unexpected error occurred.'
}

export default function ExportPdfPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const [previewUrl, setPreviewUrl] = useState('')
  const [isPreviewLoading, setIsPreviewLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const { user } = useAuthStore()

  useEffect(() => {
    let currentPreviewUrl = ''

    const loadPreview = async () => {
      setIsPreviewLoading(true)
      try {
        const pdfBlob = await resumeService.getResumePreview()
        currentPreviewUrl = URL.createObjectURL(pdfBlob)
        setPreviewUrl(currentPreviewUrl)
      } catch (error) {
        messageApi.error(getErrorMessage(error))
      } finally {
        setIsPreviewLoading(false)
      }
    }

    void loadPreview()

    return () => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl)
      }
    }
  }, [messageApi])

  const handleExportPdf = async () => {
    setIsExporting(true)
    try {
      const pdfBlob = await resumeService.exportResume()
      const downloadUrl = URL.createObjectURL(pdfBlob)
      const anchor = document.createElement('a')
      anchor.href = downloadUrl
      anchor.download = user?.username + '_resume.pdf'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(downloadUrl)
      messageApi.success('Export PDF success!')
    } catch (error) {
      messageApi.error(getErrorMessage(error))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <section>
      {contextHolder}
      <div className="flex justify-between items-center mb-4">
        <SectionTitle>Resume Preview</SectionTitle>
        <Button type="primary" loading={isExporting} onClick={handleExportPdf}>
          Export PDF
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden min-h-[800px]">
        {isPreviewLoading ? (
          <div className="min-h-[800px] flex items-center justify-center">
            <Spin />
          </div>
        ) : (
          <iframe title="Resume PDF Preview" src={previewUrl} className="w-full min-h-[800px]" />
        )}
      </div>
    </section>
  )
}
