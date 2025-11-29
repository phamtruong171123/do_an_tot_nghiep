import { ChatUnreadProvider } from "./contexts/ChatUnReadContext";
import AppRoutes from "./routes";
import { ToastProvider } from "./components/Toast";


export default function App() {
  return (
    <ToastProvider>
      <ChatUnreadProvider>
        <AppRoutes />
        
      </ChatUnreadProvider>
    </ToastProvider>
  );
}
