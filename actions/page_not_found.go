package actions

import (
	"github.com/gobuffalo/buffalo"
)

func PageNotFound(status int, _ error, c buffalo.Context) error {
	// 로그인 상태 처리
	user, err := LogIn(c)
	if err != nil {
		c.Set("login", false)
	} else {
		c.Set("login", true)
		c.Set("user", user)
	}

	c.Set("title", "404 - Page Not Found")

	// 404 페이지 렌더링
	return c.Render(status, r.HTML("pages/404.plush.html"))
}
