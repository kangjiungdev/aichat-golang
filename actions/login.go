package actions

import (
	"aichat_golang/models"
	"fmt"
	"net/http"
	"regexp"
	"unicode/utf8"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
	"golang.org/x/crypto/bcrypt"
)

func LogInPage(c buffalo.Context) error {
	_, err := LogIn(c)
	if err == nil {
		return c.Redirect(http.StatusSeeOther, "/")
	}
	c.Set("title", "Log In")
	c.Set("javascript", "pages/login.js")
	return c.Render(http.StatusOK, r.HTML("pages/login.plush.html"))
}

func GetUserData(c buffalo.Context) error {
	userId := c.Request().FormValue("user-id")
	password := c.Request().FormValue("password")

	if userId == "" || password == "" {
		return c.Render(http.StatusBadRequest, r.String("입력값이 올바르지 않습니다."))
	}

	// ID는 영어+숫자만 허용 (JS와 동일한 규칙 적용)
	idRegex := regexp.MustCompile(`^[a-zA-Z0-9]+$`)
	if !idRegex.MatchString(userId) {
		fmt.Println("아이디는 영어와 숫자만 입력 가능합니다.")
		return c.Render(http.StatusBadRequest, r.String("아이디는 영어와 숫자만 입력 가능합니다."))
	}

	if utf8.RuneCountInString(password) < 8 || utf8.RuneCountInString(password) > 20 {
		fmt.Println("비밀번호는 8자~20자여야 합니다.")
		return c.Render(http.StatusBadRequest, r.String("비밀번호는 8자~20자여야 합니다."))
	}
	if utf8.RuneCountInString(userId) < 6 || utf8.RuneCountInString(userId) > 15 {
		fmt.Println("아이디는 6자~15자여야 합니다.")
		return c.Render(http.StatusBadRequest, r.String("아이디는 6자~15자여야 합니다."))
	}

	tx := c.Value("tx").(*pop.Connection)

	user := &models.User{}

	err := tx.Where("user_id = ?", userId).First(user)
	if err != nil {
		return c.Render(http.StatusUnauthorized, r.String("아이디 또는 비밀번호가 올바르지 않습니다.")) // DB에서 유저 찾기 실패
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return c.Render(http.StatusUnauthorized, r.String("아이디 또는 비밀번호가 올바르지 않습니다.")) // 비번 틀림
	}

	c.Session().Set("current_user_id", user.ID)
	c.Session().Save()

	return c.Redirect(http.StatusSeeOther, "/")
}
