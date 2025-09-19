export const ThinkingAnimation = () => {
  return (
    <div className="flex items-center space-x-1.5 p-1">
      <div className="size-2 animate-bounce bg-zinc-600 rounded-full [animation-delay:-0.3s]" />
      <div className="size-2 animate-bounce bg-zinc-600 rounded-full [animation-delay:-0.15s]" />
      <div className="size-2 animate-bounce bg-zinc-600 rounded-full" />
    </div>
  )
}
