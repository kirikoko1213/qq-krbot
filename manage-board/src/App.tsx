import { MailOutlined } from "@ant-design/icons";
import "./App.css";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Layout, Menu, MenuProps } from "antd";
import { Content } from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";

type MenuItem = Required<MenuProps>["items"][number];

export const RouterMap: any = {
  configs: "/configs",
  trigger_config: "/trigger-config",
};

const items: MenuItem[] = [
  {
    key: "trigger-config",
    label: "触发器",
    icon: <MailOutlined />,
  },
  {
    key: "configs",
    label: "配置",
    icon: <MailOutlined />,
  },
];

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const onClick: MenuProps["onClick"] = (e: any) => {
    navigate(RouterMap[e.key]);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        style={{
          background: "white",
        }}
      >
        <Menu
          onClick={onClick}
          defaultSelectedKeys={["1"]}
          defaultOpenKeys={["sub1"]}
          mode='inline'
          items={items}
          theme='light'
        />
      </Sider>
      <Layout>
        {/*<Header />*/}
        <Content>
          <div
            style={{
              padding: "20px",
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
