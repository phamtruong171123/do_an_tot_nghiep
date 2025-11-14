import React from "react";

export const ChatUnreadContext = React.createContext({
  total: 0,
  setTotal: () => {},
});

export function ChatUnreadProvider({ children }) {
  const [total, setTotal] = React.useState(0);

  const value = React.useMemo(() => ({ total, setTotal }), [total]);

  return (
    <ChatUnreadContext.Provider value={value}>
      {children}
    </ChatUnreadContext.Provider>
  );
}
