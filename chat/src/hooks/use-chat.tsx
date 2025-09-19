import { useState, useCallback } from 'react'
import { getApiUrl } from '@/lib/api-config'

export interface ChatMessage {
  id: string
  content: string
  user: {
    name: string
  }
  createdAt: string
}

// Sample data to simulate chat history
const SAMPLE_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    content: 'Hello! How can I help you today?',
    user: {
      name: 'AI Assistant'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  }
]

interface UseChatProps {
  username: string
}

interface UploadResponse {
  message: string
  document_count: number
}

interface UseChatReturn {
  messages: ChatMessage[]
  sendMessage: (content: string) => Promise<void>
  isConnected: boolean
  isThinking: boolean
  isUploading: boolean
  uploadDocument: (file: File) => Promise<UploadResponse>
  sources: string[]
}

export function useChat({ username }: UseChatProps): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(SAMPLE_MESSAGES)
  const [sources, setSources] = useState<string[]>([])
  const [isConnected] = useState(true)
  const [isThinking, setIsThinking] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const uploadDocument = useCallback(async (file: File): Promise<UploadResponse> => {
    if (!file || !file.name.endsWith('.pdf')) {
      throw new Error('Only PDF files are supported')
    }

    setIsUploading(true)
    setIsThinking(false)

    const formData = new FormData()
    formData.append('file', file)

    try {
      console.log('Uploading file:', file.name)
      const response = await fetch(getApiUrl('/upload'), {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Upload failed:', errorText)
        throw new Error(`Upload failed: ${errorText}`)
      }

      const result: UploadResponse = await response.json()
      console.log('Upload successful:', result)
      
      const systemMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: `✅ Successfully uploaded and processed "${file.name}". Ask me questions about the document!`,
        user: {
          name: 'System'
        },
        createdAt: new Date().toISOString(),
      }
      setMessages(current => [...current, systemMessage])
      return result
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: `❌ Failed to upload "${file.name}": ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        user: {
          name: 'System'
        },
        createdAt: new Date().toISOString(),
      }
      setMessages(current => [...current, errorMessage])
      throw error
    } finally {
      setIsUploading(false)
    }
  }, [])

  const sendMessage = useCallback(async (content: string): Promise<void> => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      user: {
        name: username,
      },
      createdAt: new Date().toISOString(),
    }

    setMessages(current => [...current, userMessage])
    setIsThinking(true)

    const aiMessageId = crypto.randomUUID()
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      content: '',
      user: {
        name: 'AI Assistant'
      },
      createdAt: new Date().toISOString(),
    }
    setMessages(current => [...current, aiMessage])

    try {
      const response = await fetch(getApiUrl('/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: content }),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available')
      }

      let currentContent = ''

      setSources([])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n\n')

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const [eventLine, dataLine] = line.split('\n')
            if (!dataLine) continue

            const event = eventLine.replace('event: ', '')
            const data = JSON.parse(dataLine.replace('data: ', ''))
            
            if (event === 'token') {
              currentContent += data.content
              setMessages(current =>
                current.map(msg =>
                  msg.id === aiMessageId
                    ? { ...msg, content: currentContent }
                    : msg
                )
              )
            } else if (event === 'sources') {
              setSources(data.content)
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e)
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: 'Sorry, there was an error processing your request.',
        user: {
          name: 'AI Assistant'
        },
        createdAt: new Date().toISOString(),
      }
      setMessages(current => [...current, errorMessage])
    } finally {
      setIsThinking(false)
    }
  }, [username])

  return {
    messages,
    sendMessage,
    isConnected,
    isThinking,
    isUploading,
    uploadDocument,
    sources
  }
}
