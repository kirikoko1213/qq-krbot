package repo

import (
	"database/sql"
	"errors"
	"fmt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"gorm.io/gorm/logger"
	"log"
	"os"
	"qq-krbot/env"
	lg "qq-krbot/logx"
	"sync"
	"time"
)

var (
	Sql  *gorm.DB
	Conn *sql.DB
)

func init() {
	initORM(fmt.Sprintf(
		`%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local&&timeout=1s&readTimeout=5s&writeTimeout=5s`,
		env.Get(`mysql.username`),
		env.Get(`mysql.password`),
		env.Get(`mysql.host`),
		env.Get(`mysql.port`),
		env.Get(`mysql.database`),
	), 10, 500, time.Minute*15)
	err := Sql.AutoMigrate(&MessageRecord{})
	if err != nil {
		return
	}
	err = Sql.AutoMigrate(&MessageCount{})
	if err != nil {
		return
	}
	err = Sql.AutoMigrate(&DynamicTriggerModel{})
	if err != nil {
		return
	}
}

func initORM(dsn string, idle, max int, life time.Duration) {
	var once sync.Once
	var err error

	// 初始化数据库配置方法
	connect := func() error {
		Sql, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
			Logger: logger.New(
				log.New(os.Stdout, "\r\n", log.LstdFlags), // io writer
				logger.Config{
					SlowThreshold: time.Second * 1, // 慢 SQL 阈值
					LogLevel:      logger.Silent,   // Log level
					Colorful:      true,            // 禁用彩色打印
				},
			),
			CreateBatchSize:        1000,  // 全局批量插入分批设置
			SkipDefaultTransaction: true,  // 跳过默认事务,自主开启
			PrepareStmt:            true,  // 预编译模式
			AllowGlobalUpdate:      false, // 每次更新有赋值的字段，注意0值，如有必要临时session开启为true
			QueryFields:            false, // 查询语句展示所有字段，就算select * 也是
		})

		if err != nil {
			lg.Log.Error(fmt.Errorf(`InitORM Err: %v`, fmt.Sprintf("数据库配置错误:%s, 尝试重新连接", err.Error())))
			return err
		}

		// 获取连接实例，其实当前方法内部只用到了Ping探活
		Conn, err = Sql.DB()
		if err != nil {
			lg.Log.Error(fmt.Errorf(`InitORM Err: %v`, fmt.Sprintf("数据库配置错误:%s, 尝试重新连接", err.Error())))
			return err
		}

		if err = Conn.Ping(); err != nil {
			lg.Log.Error(fmt.Errorf(`InitORM Err: %v`, fmt.Sprintf("数据库配置错误:%s, 尝试重新连接", err.Error())))
			return err
		}

		// SetMaxIdleConns 设置空闲连接池中连接的最大数量
		Conn.SetMaxIdleConns(idle)
		// SetMaxOpenConns 设置打开数据库连接的最大数量。
		Conn.SetMaxOpenConns(max)
		// SetConnMaxLifetime 设置了连接可复用的最大时间。
		Conn.SetConnMaxLifetime(life)
		return nil
	}
	if Sql == nil {
		once.Do(func() {
			_ = connect()
		})
	}
}

// GetBatchDB 获取 设置批量插入数据size设置的 session
func GetBatchDB(size int, hook, conflict bool) *gorm.DB {
	return Sql.Session(&gorm.Session{CreateBatchSize: size, SkipHooks: !hook}).Clauses(clause.OnConflict{DoNothing: !conflict})
}

// GetTransactionDB 获取开启默认事务的session
func GetTransactionDB() *gorm.DB {
	return Sql.Session(&gorm.Session{SkipDefaultTransaction: false})
}

func IsNotFound(err error) bool {
	return errors.Is(err, gorm.ErrRecordNotFound)
}

func NotFound(err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil
	}

	return err
}

type Tx struct {
	once   sync.Once
	commit bool
	Sql    *gorm.DB
	Force  bool // 强制提交
}

func (t *Tx) Terminate() {
	t.once.Do(func() {
		if t.Force == true {
			t.Sql.Commit()
			return
		}

		if t.commit {
			t.Sql.Commit()
			return
		}

		t.Sql.Rollback()

		return
	})
}

func (t *Tx) Commit() {
	t.commit = true
}

func (t *Tx) Fail() {
	t.commit = false
}

func (t *Tx) Check() bool {
	return t.commit
}

func (t *Tx) Error(m string) error {
	t.commit = false
	return errors.New(m)
}

func (t *Tx) Create(data interface{}) error {
	return t.Sql.Create(data).Error
}

func (t *Tx) Save(data interface{}) error {
	return t.Sql.Save(data).Error
}

func (t *Tx) Update(model interface{}, data interface{}) error {
	return t.Sql.Model(model).Updates(data).Error
}

func Transaction() *Tx {
	return &Tx{Sql: Sql.Begin(), commit: false, Force: false}
}
