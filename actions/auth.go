package actions

import (
	"aichat_golang/models"
	"errors"
	"fmt"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
)

// 2번째 return값이 nil이면 로그인 된거
func LogIn(c buffalo.Context) (*models.User, error) {
	user := &models.User{}
	userId := c.Session().Get("current_user_id")
	if userId == nil {
		return nil, errors.New("로그인 안됨")
	}

	tx, ok := c.Value("tx").(*pop.Connection)
	if !ok {
		tx = models.DB
	}
	err := tx.Find(user, userId)
	if err != nil {
		return nil, fmt.Errorf("유저 조회 실패: %w", err)
	}
	return user, nil
}
