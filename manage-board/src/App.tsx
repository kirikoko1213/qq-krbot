import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import { AppstoreOutlined, MailOutlined, SettingOutlined } from "@ant-design/icons";
import "./App.css";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import { Layout, Menu, MenuProps, Slider } from "antd";
import { Content, Footer, Header } from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";


type MenuItem = Required<MenuProps>["items"][number];

const items: MenuItem[] = [
  {
    key: "feature-enabled",
    label: "功能启用",
    icon: <MailOutlined />
  },
  {
    key: "ai-config",
    label: "AI配置",
    icon: <MailOutlined />
  },
  {
    key: "sub1",
    label: "Navigation One",
    icon: <MailOutlined />,
    children: [
      {
        key: "g1",
        label: "Item 1",
        type: "group",
        children: [
          { key: "1", label: "Option 1" },
          { key: "2", label: "Option 2" }
        ]
      },
      {
        key: "g2",
        label: "Item 2",
        type: "group",
        children: [
          { key: "3", label: "Option 3" },
          { key: "4", label: "Option 4" }
        ]
      }
    ]
  }
];


function App() {

  const onClick: MenuProps["onClick"] = (e) => {
    console.log("click ", e);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider style={{
        background: "white"
      }}>
        <Menu
          onClick={onClick}
          defaultSelectedKeys={["1"]}
          defaultOpenKeys={["sub1"]}
          mode="inline"
          items={items}
          theme="light"
        />
      </Sider>
      <Layout>
        {/*<Header />*/}
        <Content>
          <div>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
