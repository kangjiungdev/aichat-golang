package actions

import (
	"aichat_golang/models"
	"fmt"
	"net/http"

	"github.com/gobuffalo/buffalo"
)

func HomeHandler(c buffalo.Context) error {
	user, err := LogIn(c)
	if err == nil {
		c.Set("login", true)
		c.Set("user", user)
	}
	var characters []models.Character
	err = models.DB.All(&characters)
	if err != nil {
		return c.Render(http.StatusInternalServerError, r.String("DB 에러: "+err.Error()))
	}

	token := c.Value("authenticity_token")

	fmt.Println(token)

	c.Set("title", "Home")
	c.Set("characters", characters)
	c.Set("javascript", "pages/index.js")
	return c.Render(http.StatusOK, r.HTML("pages/index.plush.html"))
}
