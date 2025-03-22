package actions

import (
	"aichat_golang/models"
	"errors"
	"fmt"

	"github.com/gobuffalo/buffalo"
)

// 2번째 return값이 nil이면 로그인 된거
func LogIn(c buffalo.Context) (*models.User, error) {
	user := &models.User{}
	userId := c.Session().Get("current_user_id")
	if userId == nil {
		return nil, errors.New("로그인 안됨")
	}
	err := models.DB.Find(user, userId)
	if err != nil {
		return nil, fmt.Errorf("유저 조회 실패")
	}
	return user, nil
}
