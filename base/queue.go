package base

import "fmt"

// 定义一个队列结构体
type Queue struct {
	items []interface{}
	max   int
}

// 创建一个新的队列
func NewQueue(max int) *Queue {
	return &Queue{
		items: make([]interface{}, 0, max),
		max:   max,
	}
}

// 入队操作
func (q *Queue) Enqueue(value interface{}) {
	if len(q.items) >= q.max {
		// 如果队列已满，删除最旧的元素
		q.items = q.items[1:]
	}
	// 添加新元素
	q.items = append(q.items, value)
}

// 出队操作
func (q *Queue) Dequeue() interface{} {
	if len(q.items) == 0 {
		return nil
	}
	value := q.items[0]
	q.items = q.items[1:]
	return value
}

// 检查队列是否为空
func (q *Queue) IsEmpty() bool {
	return len(q.items) == 0
}

// 获取当前队列长度
func (q *Queue) Length() int {
	return len(q.items)
}

// 打印队列内容
func (q *Queue) Print() {
	fmt.Println(q.items)
}

func (q *Queue) GetIndex(index int) interface{} {
	return q.items[index]
}

func (q *Queue) GetItems() []interface{} {
	return q.items
}
