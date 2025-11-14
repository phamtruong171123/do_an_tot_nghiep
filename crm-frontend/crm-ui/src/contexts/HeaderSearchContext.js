import React from "react";

 export const HeaderSearchContext = React.createContext({
  text: "",
    setText: (t) => {},
});



export function HeaderSearchProvider({ children }) {
  const [text, setText] = React.useState("");

  const value = React.useMemo(() => ({ text, setText }), [text]);

  return (
    <HeaderSearchContext.Provider value={value}>
      {children}
    </HeaderSearchContext.Provider>
  );
}
