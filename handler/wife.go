package handler

import "math/rand"

type WifeHandler struct{}

func NewWifeHandler() *WifeHandler {
	return &WifeHandler{}
}

func (receiver *WifeHandler) BuildWifeGroup(accounts []int64) (pairs [][2]int64, remainder *int64) {
	// 创建原数组的副本，避免修改原数组
	temp := make([]int64, len(accounts))
	copy(temp, accounts)

	// 随机打乱数组
	rand.Shuffle(len(temp), func(i, j int) {
		temp[i], temp[j] = temp[j], temp[i]
	})

	// 计算能够配对的组数
	pairCount := len(temp) / 2

	// 创建结果数组
	pairs = make([][2]int64, pairCount)

	// 将账号两两配对
	for i := 0; i < pairCount; i++ {
		pairs[i] = [2]int64{temp[i*2], temp[i*2+1]}
	}

	// 如果有余数，保存最后一个账号
	if len(temp)%2 != 0 {
		last := temp[len(temp)-1]
		remainder = &last
	}

	return pairs, remainder
}
