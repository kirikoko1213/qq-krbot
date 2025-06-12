package agent

import (
	"fmt"
	"sync"
	"time"
)

// ContextStorage 上下文存储接口
type ContextStorage interface {
	// SaveMessage 保存单条消息到指定会话
	SaveMessage(sessionID string, message Message) error

	// LoadMessages 加载指定会话的所有消息
	LoadMessages(sessionID string) ([]Message, error)

	// ClearSession 清空指定会话的所有消息
	ClearSession(sessionID string) error

	// DeleteSession 删除指定会话
	DeleteSession(sessionID string) error

	// ListSessions 列出所有会话ID
	ListSessions() ([]string, error)

	// GetSessionInfo 获取会话信息（消息数量、最后更新时间等）
	GetSessionInfo(sessionID string) (*SessionInfo, error)
}

// SessionInfo 会话信息
type SessionInfo struct {
	SessionID    string    `json:"session_id"`    // 会话ID
	MessageCount int       `json:"message_count"` // 消息数量
	CreatedAt    time.Time `json:"created_at"`    // 创建时间
	UpdatedAt    time.Time `json:"updated_at"`    // 最后更新时间
	FirstMessage string    `json:"first_message"` // 第一条消息内容（用于显示）
}

// MemoryContextStorage 内存存储实现
type MemoryContextStorage struct {
	sessions    map[string][]Message    // 存储会话消息
	sessionInfo map[string]*SessionInfo // 存储会话信息
	maxMessages int                     // 每个会话最大消息数量
	mu          sync.RWMutex            // 读写锁保证线程安全
}

// NewMemoryContextStorage 创建内存存储实例
func NewMemoryContextStorage(maxMessages int) *MemoryContextStorage {
	if maxMessages <= 0 {
		maxMessages = 100 // 默认最大100条消息
	}

	return &MemoryContextStorage{
		sessions:    make(map[string][]Message),
		sessionInfo: make(map[string]*SessionInfo),
		maxMessages: maxMessages,
	}
}

// SaveMessage 保存消息
func (m *MemoryContextStorage) SaveMessage(sessionID string, message Message) error {
	if sessionID == "" {
		return fmt.Errorf("会话ID不能为空")
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	// 初始化会话（如果不存在）
	if _, exists := m.sessions[sessionID]; !exists {
		m.sessions[sessionID] = make([]Message, 0)
		m.sessionInfo[sessionID] = &SessionInfo{
			SessionID: sessionID,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
	}

	// 添加消息
	m.sessions[sessionID] = append(m.sessions[sessionID], message)

	// 限制消息数量（保留最新的消息）
	if len(m.sessions[sessionID]) > m.maxMessages {
		// 保留系统消息（如果第一条是系统消息）
		start := 1
		if len(m.sessions[sessionID]) > 0 && m.sessions[sessionID][0].Role != "system" {
			start = 0
		}

		// 保留系统消息 + 最新的消息
		keepCount := m.maxMessages - start
		newMessages := make([]Message, 0, m.maxMessages)

		if start > 0 {
			newMessages = append(newMessages, m.sessions[sessionID][0]) // 保留系统消息
		}

		// 保留最新的消息
		startIndex := len(m.sessions[sessionID]) - keepCount
		newMessages = append(newMessages, m.sessions[sessionID][startIndex:]...)

		m.sessions[sessionID] = newMessages
	}

	// 更新会话信息
	info := m.sessionInfo[sessionID]
	info.MessageCount = len(m.sessions[sessionID])
	info.UpdatedAt = time.Now()

	// 设置第一条消息内容（用于显示）
	if info.FirstMessage == "" && len(m.sessions[sessionID]) > 0 {
		firstMsg := m.sessions[sessionID][0]
		if firstMsg.Role == "system" && len(m.sessions[sessionID]) > 1 {
			info.FirstMessage = m.sessions[sessionID][1].Content
		} else {
			info.FirstMessage = firstMsg.Content
		}

		// 截断显示内容
		if len(info.FirstMessage) > 50 {
			info.FirstMessage = info.FirstMessage[:50] + "..."
		}
	}

	return nil
}

// LoadMessages 加载消息
func (m *MemoryContextStorage) LoadMessages(sessionID string) ([]Message, error) {
	if sessionID == "" {
		return []Message{}, nil
	}

	m.mu.RLock()
	defer m.mu.RUnlock()

	messages, exists := m.sessions[sessionID]
	if !exists {
		return []Message{}, nil
	}

	// 返回副本以避免外部修改
	result := make([]Message, len(messages))
	copy(result, messages)

	return result, nil
}

// ClearSession 清空会话
func (m *MemoryContextStorage) ClearSession(sessionID string) error {
	if sessionID == "" {
		return fmt.Errorf("会话ID不能为空")
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.sessions[sessionID]; exists {
		m.sessions[sessionID] = make([]Message, 0)

		// 重置会话信息
		if info, exists := m.sessionInfo[sessionID]; exists {
			info.MessageCount = 0
			info.UpdatedAt = time.Now()
			info.FirstMessage = ""
		}
	}

	return nil
}

// DeleteSession 删除会话
func (m *MemoryContextStorage) DeleteSession(sessionID string) error {
	if sessionID == "" {
		return fmt.Errorf("会话ID不能为空")
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	delete(m.sessions, sessionID)
	delete(m.sessionInfo, sessionID)

	return nil
}

// ListSessions 列出所有会话
func (m *MemoryContextStorage) ListSessions() ([]string, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	sessions := make([]string, 0, len(m.sessions))
	for sessionID := range m.sessions {
		sessions = append(sessions, sessionID)
	}

	return sessions, nil
}

// GetSessionInfo 获取会话信息
func (m *MemoryContextStorage) GetSessionInfo(sessionID string) (*SessionInfo, error) {
	if sessionID == "" {
		return nil, fmt.Errorf("会话ID不能为空")
	}

	m.mu.RLock()
	defer m.mu.RUnlock()

	info, exists := m.sessionInfo[sessionID]
	if !exists {
		return nil, fmt.Errorf("会话不存在: %s", sessionID)
	}

	// 返回副本
	result := *info
	return &result, nil
}

// GetMessageCount 获取会话消息数量
func (m *MemoryContextStorage) GetMessageCount(sessionID string) int {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if messages, exists := m.sessions[sessionID]; exists {
		return len(messages)
	}
	return 0
}

// GetAllSessionsInfo 获取所有会话信息
func (m *MemoryContextStorage) GetAllSessionsInfo() ([]*SessionInfo, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	infos := make([]*SessionInfo, 0, len(m.sessionInfo))
	for _, info := range m.sessionInfo {
		// 返回副本
		infoCopy := *info
		infos = append(infos, &infoCopy)
	}

	return infos, nil
}
