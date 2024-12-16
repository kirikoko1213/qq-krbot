import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App, { RouterMap } from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Configs } from "./page/configs/Configs.tsx";


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: RouterMap.configs,
        element: <Configs />
      },
      {
        path: RouterMap.trigger_config,
        element: <Configs />
      }
    ]
  }
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
