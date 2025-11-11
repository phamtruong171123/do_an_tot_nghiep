import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/global.scss";
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'tippy.js/dist/tippy.css';



ReactDOM.createRoot(document.getElementById("root")).render(
 
    <BrowserRouter>
      <App />
    </BrowserRouter>
  
);
