import { FC, useEffect, useMemo, useState } from "react";
import { Button, Form, Input, Modal, Popconfirm, Table, TableProps } from "antd";
import TextArea from "antd/es/input/TextArea";
import request from "../../lib/request.ts";

interface DataType {
  key: string;
  value: string;
  description: string;
}

export const Configs: FC<{}> = (props) => {
  const [open, setOpen] = useState<boolean>(false);
  const [tableData, setTableData] = useState<any[]>([]);
  const columns: TableProps<DataType>["columns"] = useMemo(() => {
    return [
      {
        title: "名称",
        dataIndex: "key",
        key: "key",
        render: (value, record, index) => {
          return (
            <a
              onClick={() => {
                onOpen(value);
              }}
            >
              {value}
            </a>
          );
        },
      },
      {
        title: "值",
        dataIndex: "value",
        key: "value",
      },
      {
        title: "operation",
        dataIndex: "operation",
        key: "operation",
        render: (value, record, index) => {
          return (
            <Popconfirm
              title={"确定删除吗?"}
              onConfirm={() => {
                request
                  .post("/api/config/remove", {
                    key: record.key,
                  })
                  .then(() => {
                    onLoadTable();
                  });
              }}
            >
              <Button type={"link"}>删除</Button>
            </Popconfirm>
          );
        },
      },
    ];
  }, []);

  const [formRef] = Form.useForm();

  const onOpen = (key?: string) => {
    if (key) {
      onLoadForm(key);
      setOpen(true);
    } else {
      onAdd();
    }
  };

  const onClose = () => {
    setOpen(false);
  };

  const onLoadTable = () => {
    request.get("/api/config/list", {}).then((resp) => {
      setTableData(resp.data || []);
    });
  };

  const onOk = () => {
    if (!formRef.getFieldValue("key") || !formRef.getFieldValue("value")) {
      alert("配置不能为空");
      return;
    }
    request
      .post<any>("/api/config/set", {
        key: formRef.getFieldValue("key"),
        value: formRef.getFieldValue("value"),
        description: formRef.getFieldValue("description"),
      })
      .then((response) => {
        onClose();
      })
      .finally(() => {
        onLoadTable();
      });
  };

  const onLoadForm = (key: string) => {
    request
      .get("/api/config/get", {
        key,
      })
      .then((resp) => {
        formRef.setFieldValue("key", resp.data.key);
        formRef.setFieldValue("value", resp.data.value);
        formRef.setFieldValue("description", resp.data.description);
      });
  };

  const onAdd = () => {
    setOpen(true);
    formRef.resetFields();
  };

  useEffect(() => {
    onLoadTable();
  }, []);

  return (
    <div>
      <Modal
        title={"编辑面板"}
        cancelText={"取消"}
        okText={"确定"}
        open={open}
        onClose={onClose}
        onCancel={onClose}
        onOk={onOk}
      >
        <Form
          form={formRef}
          labelCol={{
            span: 3,
          }}
        >
          <Form.Item name={"key"} label={"配置项"} required>
            <Input readOnly disabled />
          </Form.Item>
          <Form.Item name={"value"} label={"值"} required>
            <TextArea />
          </Form.Item>
          <Form.Item name={"description"} label={"描述"}>
            <TextArea />
          </Form.Item>
        </Form>
      </Modal>
      <div
        style={{
          margin: "10px 0",
        }}
      >
        <Button type={"primary"} onClick={onAdd}>
          添加
        </Button>
      </div>
      <Table columns={columns} dataSource={tableData} />
    </div>
  );
};
