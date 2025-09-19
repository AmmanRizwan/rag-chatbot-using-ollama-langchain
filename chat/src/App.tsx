import { RealtimeChat } from "@/component/realtime-chat"


function App() {  
  return (
    <div className="flex justify-center items-center">
      <RealtimeChat roomName="my-chat-room" username="amman" />
    </div>
  )
  
}

export default App
