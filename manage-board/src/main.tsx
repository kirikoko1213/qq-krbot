import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App, { RouterMap } from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Configs } from "./page/configs/Configs.tsx";
import { Triggers } from "./page/configs/Triggers.tsx";


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
        element: <Triggers />
      }
    ]
  }
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
