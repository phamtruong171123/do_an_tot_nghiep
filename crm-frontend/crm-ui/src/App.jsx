import { ChatUnreadProvider } from "./contexts/ChatUnReadContext";
import AppRoutes from "./routes";

export default function App() {
  return (
    <ChatUnreadProvider>
      <AppRoutes />
    </ChatUnreadProvider>
);
}
