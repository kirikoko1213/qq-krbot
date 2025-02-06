package repo

import (
	"context"
	"qq-krbot/env"
	"time"

	"github.com/kiririx/krutils/ut"
	"github.com/redis/go-redis/v9"
)

var (
	RedisClient *redis.Client
	ctx         = context.Background()
)

// InitRedis 初始化Redis连接
func InitRedis() error {
	db := env.Get("main.redis.db")
	RedisClient = redis.NewClient(&redis.Options{
		Addr:     env.Get("redis.host") + ":" + env.Get("redis.port"),
		Password: env.Get("redis.password"),                       // 如果有密码，在这里设置
		DB:       ut.Then(db == "", 0, ut.Convert(db).IntValue()), // 使用默认数据库
	})

	// 测试连接
	_, err := RedisClient.Ping(ctx).Result()
	if err != nil {
		return err
	}
	return nil
}

// Set 设置键值对
func Set(key string, value interface{}, expiration time.Duration) error {
	return RedisClient.Set(ctx, key, value, expiration).Err()
}

// Get 获取值
func Get(key string) (string, error) {
	return RedisClient.Get(ctx, key).Result()
}

// Del 删除键
func Del(key string) error {
	return RedisClient.Del(ctx, key).Err()
}

// Exists 检查键是否存在
func Exists(key string) (bool, error) {
	result, err := RedisClient.Exists(ctx, key).Result()
	return result > 0, err
}

// TTL 获取键的过期时间
func TTL(key string) (time.Duration, error) {
	return RedisClient.TTL(ctx, key).Result()
}

// HSet 设置哈希表字段
func HSet(key string, field string, value interface{}) error {
	return RedisClient.HSet(ctx, key, field, value).Err()
}

// HGet 获取哈希表字段
func HGet(key, field string) (string, error) {
	return RedisClient.HGet(ctx, key, field).Result()
}

// HGetAll 获取哈希表所有字段
func HGetAll(key string) (map[string]string, error) {
	return RedisClient.HGetAll(ctx, key).Result()
}
