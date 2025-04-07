package actions

import (
	"aichat_golang/models"
	"net/http"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
)

func HomeHandler(c buffalo.Context) error {
	user, err := LogIn(c)
	if err == nil {
		c.Set("login", true)
		c.Set("user", user)
	}
	tx := c.Value("tx").(*pop.Connection)
	var characters []models.Character
	err = tx.All(&characters)
	if err != nil {
		return c.Render(http.StatusInternalServerError, r.String("DB 에러: "+err.Error()))
	}

	c.Set("title", "Home")
	c.Set("characters", characters)
	c.Set("javascript", "pages/index.js")
	return c.Render(http.StatusOK, r.HTML("pages/index.plush.html"))
}
