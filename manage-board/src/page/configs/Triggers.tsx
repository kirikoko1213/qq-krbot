import { FC, useEffect, useMemo, useState } from "react";
import { Button, Form, Input, Modal, Popconfirm, Select, Table, TableProps } from "antd";
import request, { RequestResult } from "../../lib/request.ts";
import TextArea from "antd/es/input/TextArea";

interface DataType {
  ID: string;
  messageType: string;
  conditionType: string;
  conditionValue: string;
  triggerContentType: string;
  triggerContent: string;
  sequence: number;
  description: string;
}

export const Triggers: FC<{}> = (props) => {
  const [open, setOpen] = useState<boolean>(false);
  const [tableData, setTableData] = useState<any[]>([]);
  const [handlers, setHandlers] = useState<string[]>([]);
  const [triggerContentTypeState, setTriggerContentTypeState] = useState();
  const columns: TableProps<DataType>["columns"] = useMemo(() => {
    return [
      {
        title: "描述",
        dataIndex: "description",
        key: "description",
        render: (value, record, index) => {
          return (
            <a
              onClick={() => {
                onOpen(record.ID);
              }}
            >
              {value}
            </a>
          );
        }
      },
      {
        title: "消息类型",
        dataIndex: "messageType",
        key: "messageType"
      },
      {
        title: "条件类型",
        dataIndex: "conditionType",
        key: "conditionType"
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
                  .post("/api/dynamic-trigger/delete", {
                    id: record.ID
                  })
                  .then(() => {
                    onLoadTable();
                  });
              }}
            >
              <Button type={"link"}>删除</Button>
            </Popconfirm>
          );
        }
      }
    ];
  }, []);

  const [formRef] = Form.useForm();

  const onOpen = (id?: string) => {
    if (id) {
      onLoadForm(id);
      setOpen(true);
    } else {
      onAdd();
    }
  };

  const onClose = () => {
    setOpen(false);
  };

  const onLoadTable = () => {
    request.get("/api/dynamic-trigger/list", {}).then((resp) => {
      setTableData(resp.data || []);
    });
  };

  const onLoadHandlers = () => {
    request.get("/api/dynamic-trigger/get-functions", {}).then(resp => {
      setHandlers(resp.data)
    });
  };

  const onOk = () => {
    if (!formRef.getFieldValue("messageType") || !formRef.getFieldValue("conditionValue") || !formRef.getFieldValue("triggerContent")) {
      alert("配置不能为空");
      return;
    }
    request
      .post<any>("/api/dynamic-trigger/save", {
        id: formRef.getFieldValue("id"),
        messageType: formRef.getFieldValue("messageType"),
        conditionType: formRef.getFieldValue("conditionType"),
        conditionValue: formRef.getFieldValue("conditionValue"),
        triggerContentType: formRef.getFieldValue("triggerContentType"),
        triggerContent: formRef.getFieldValue("triggerContent"),
        description: formRef.getFieldValue("description")
      })
      .then((response) => {
        onClose();
      })
      .finally(() => {
        onLoadTable();
      });
  };

  const onLoadForm = (id: string) => {
    request
      .get<RequestResult<DataType>>("/api/dynamic-trigger/find", {
        id
      })
      .then((resp) => {
        formRef.setFieldValue("id", resp.data?.ID);
        formRef.setFieldValue("conditionType", resp.data?.conditionType);
        formRef.setFieldValue("conditionValue", resp.data?.conditionValue);
        formRef.setFieldValue("messageType", resp.data?.messageType);
        formRef.setFieldValue("triggerContent", resp.data?.triggerContent);
        formRef.setFieldValue("triggerContentType", resp.data?.triggerContentType);
        formRef.setFieldValue("sequence", resp.data?.sequence);
        formRef.setFieldValue("description", resp.data?.description);
      });
  };

  const onAdd = () => {
    setOpen(true);
    formRef.resetFields();
  };

  useEffect(() => {
    onLoadTable();
    onLoadHandlers();
  }, []);

  return (
    <div>
      <Modal
        width={800}
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
          onValuesChange={values => {
            if (values.triggerContentType) {
              setTriggerContentTypeState(values.triggerContentType)
            }
            formRef.setFieldsValue(values)
          }}
          labelCol={{
            span: 4
          }}
        >
          <Form.Item name={"id"} hidden>
            <Input />
          </Form.Item>
          <Form.Item name={"messageType"} label={"消息类型"} required>
            <Select options={messageType} />
          </Form.Item>
          <Form.Item name={"conditionType"} label={"条件类型"} required>
            <Select options={conditionType} />
          </Form.Item>
          <Form.Item name={"conditionValue"} label={"条件值"} required>
            <TextArea />
          </Form.Item>
          <Form.Item name={"triggerContentType"} label={"触发内容类型"} required>
            <Select options={triggerContentType} />
          </Form.Item>
          <Form.Item name={"triggerContent"} label={"触发内容"} required>
            {triggerContentTypeState === "handler" ? <Select options={handlers.map(h => ({
              label: h,
              value: h
            }))} /> : <TextArea />}
          </Form.Item>
          <Form.Item name={"description"} label={"描述"}>
            <TextArea />
          </Form.Item>
        </Form>
      </Modal>
      <div
        style={{
          margin: "10px 0"
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

const conditionType = [
  {
    label: "equals",
    value: "equals"
  },
  {
    label: "notEquals",
    value: "notEquals"
  },
  {
    label: "contains",
    value: "contains"
  },
  {
    label: "notContains",
    value: "notContains"
  },
  {
    label: "startsWith",
    value: "startsWith"
  },
  {
    label: "endsWith",
    value: "endsWith"
  },
  {
    label: "matches",
    value: "matches"
  },
  {
    label: "notMatches",
    value: "notMatches"
  }
];

const messageType = [
  {
    label: "pr",
    value: "pr"
  },
  {
    label: "gr",
    value: "gr"
  },
  {
    label: "at",
    value: "at"
  }
];

const triggerContentType = [
  {
    label: "text",
    value: "text"
  },
  {
    label: "image",
    value: "image"
  },
  {
    label: "ai",
    value: "ai"
  },
  {
    label: "api",
    value: "api"
  },
  {
    label: "handler",
    value: "handler"
  }
];
