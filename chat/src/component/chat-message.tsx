import { cn } from '../../lib/utils'
import type { ChatMessage } from "@/hooks/use-chat"
import { ThinkingAnimation } from '@/component/ui/thinking-animation'
import ReactMarkdown from "react-markdown";

interface ChatMessageItemProps {
  message: ChatMessage
  isOwnMessage: boolean
  showHeader: boolean
}

export const ChatMessageItem = ({ message, isOwnMessage, showHeader }: ChatMessageItemProps) => {
  return (
    <div className={`flex mt-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={cn('max-w-[75%] w-fit flex flex-col gap-1', {
          'items-end': isOwnMessage,
        })}
      >
        {showHeader && (
          <div
            className={cn('flex items-center gap-2 text-xs px-3', {
              'justify-end flex-row-reverse': isOwnMessage,
            })}
          >
            <span className={'font-medium'}>{message.user.name}</span>
            <span className="text-foreground/50 text-xs">
              {new Date(message.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
          </div>
        )}
        <div
          className={cn(
            'py-2 px-3 rounded-xl text-sm w-fit markdown-content',
            isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
          )}
        >
          {message.content === "..." ? (
            <ThinkingAnimation />
          ) : (
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-bold mb-1">{children}</h3>,
                p: ({ children }) => <p className="mb-2">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                code: ({ className, children, ...props }) => {
                  const match = (className || '').match(/language-(\w+)/);
                  const isInline = !match;
                  return isInline ? (
                    <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5" {...props}>{children}</code>
                  ) : (
                    <code className="block bg-gray-100 dark:bg-gray-800 rounded p-2 my-2 whitespace-pre-wrap overflow-x-auto" {...props}>{children}</code>
                  );
                },
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300 pl-4 my-2">{children}</blockquote>
                ),
                img: ({ ...props }) => (
                  <img 
                    {...props} 
                    className="max-w-full rounded-lg my-2"
                    loading="lazy"
                  />
                ),
                a: ({ href, children }) => (
                  <a href={href} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                )
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  )
}