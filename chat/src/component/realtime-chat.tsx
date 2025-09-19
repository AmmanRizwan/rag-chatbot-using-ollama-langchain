import { cn } from '../../lib/utils'
import { ChatMessageItem } from "@/component/chat-message"
import { useChatScroll } from '@/hooks/use-chat-scroll'
import {
  type ChatMessage,
  useChat,
} from '@/hooks/use-chat'
import { Button } from "@/component/ui/button"
import { Input } from "@/component/ui/input"
import { Send } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface RealtimeChatProps {
  roomName: string
  username: string
  onMessage?: (messages: ChatMessage[]) => void
  messages?: ChatMessage[]
}

/**
 * Realtime chat component
 * @param roomName - The name of the room to join. Each room is a unique chat.
 * @param username - The username of the user
 * @param onMessage - The callback function to handle the messages. Useful if you want to store the messages in a database.
 * @param messages - The messages to display in the chat. Useful if you want to display messages from a database.
 * @returns The chat component
 */
export const RealtimeChat = ({
  username,
  onMessage,
  messages: initialMessages = [],
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll()

  const {
    messages: chatMessages,
    sendMessage,
    isConnected,
    isThinking,
    isUploading,
    uploadDocument,
    sources,
  } = useChat({
    username,
  })
  const [newMessage, setNewMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = useCallback((file: File) => {
    if (!file) return;
    setSelectedFile(file);
  }, []);

  // Merge initial messages with chat messages
  const allMessages = useMemo(() => {
    const mergedMessages = [...initialMessages, ...chatMessages]
    // Remove duplicates based on message id
    const uniqueMessages = mergedMessages.filter(
      (message, index, self) => index === self.findIndex((m) => m.id === message.id)
    )
    // Sort by creation date
    const sortedMessages = uniqueMessages.sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    return sortedMessages
  }, [initialMessages, chatMessages])

  useEffect(() => {
    if (onMessage) {
      onMessage(allMessages)
    }
  }, [allMessages, onMessage])

  useEffect(() => {
    // Scroll to bottom whenever messages change
    scrollToBottom()
  }, [allMessages, scrollToBottom])

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if ((!newMessage.trim() && !selectedFile) || !isConnected) return

      try {
        // If there's a file selected, upload it first
        if (selectedFile) {
          await uploadDocument(selectedFile);
          // Clear the selected file after successful upload
          setSelectedFile(null);
        }

        // Now send the message if there is one
        if (newMessage.trim()) {
          await sendMessage(newMessage);
          setNewMessage('');
        }
      } catch (error) {
        console.error('Error processing request:', error);
      }
    },
    [newMessage, isConnected, sendMessage, selectedFile, uploadDocument]
  )

  return (
    <div className="flex flex-col h-[650px] w-[500px] border bg-background text-foreground antialiased">
      <div className='bg-black text-white p-4 font-bold'>
        ChatBot
      </div>
      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : null}
        <div className="space-y-1">
          {allMessages.map((message, index) => {
            const prevMessage = index > 0 ? allMessages[index - 1] : null
            const showHeader = !prevMessage || prevMessage.user.name !== message.user.name

            return (
              <div
                key={message.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-300"
              >
                <ChatMessageItem
                  message={message}
                  isOwnMessage={message.user.name === username}
                  showHeader={showHeader}
                />
              </div>
            )
          })}
          {isThinking && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <ChatMessageItem
                message={{
                  id: 'thinking',
                  content: "...",
                  user: { name: 'AI Assistant' },
                  createdAt: new Date().toISOString()
                }}
                isOwnMessage={false}
                showHeader={!allMessages.length || allMessages[allMessages.length - 1]?.user.name !== 'AI Assistant'}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sources Section */}
      {sources.length > 0 && (
        <div className="border-t border-border p-4 bg-gray-50">
          <h3 className="text-sm font-medium mb-2">Sources:</h3>
          <div className="space-y-2 text-sm text-gray-600 max-h-32 overflow-y-auto">
            {sources.map((source, index) => (
              <div key={index} className="p-2 bg-white rounded shadow-sm">
                {source}
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex w-full gap-2 border-t border-border p-4">
        <div className="flex-1 flex gap-2">
          <Input
            className={cn(
              'rounded-full bg-background text-sm transition-all duration-300 flex-1'
            )}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={selectedFile ? `Ask about ${selectedFile.name}...` : "Type a message..."}
            disabled={!isConnected || isUploading}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn(
                "rounded-full transition-all duration-300",
                selectedFile && "bg-green-50 border-green-500 text-green-600"
              )}
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={!isConnected || isUploading}
            >
              <input
                id="file-upload"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleFileSelect(file)
                  }
                }}
              />
              {isUploading ? (
                <div className="animate-spin">⌛</div>
              ) : selectedFile ? (
                <span className="text-green-600">📄</span>
              ) : (
                <span>+</span>
              )}
            </Button>
            <Button
              className="aspect-square rounded-full"
              type="submit"
              disabled={!isConnected || isUploading || (!newMessage.trim() && !selectedFile)}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}