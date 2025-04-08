package actions

import (
	"aichat_golang/models"
	"net/http"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
)

func HomeHandler(c buffalo.Context) error {
	var userName string

	user, err := LogIn(c)
	if err == nil {
		c.Set("login", true)
		c.Set("user", user)
		userName = user.Name
	} else {
		userName = "Guest"
	}

	tx := c.Value("tx").(*pop.Connection)
	var characters []models.Character
	err = tx.All(&characters)
	if err != nil {
		return c.Render(http.StatusInternalServerError, r.String("DB 에러: "+err.Error()))
	}

	creator := make(map[int]string)

	for i, character := range characters {
		characters[i].WorldView = ReplaceMessages(characters[i].WorldView, userName, characters[i].CharacterName)
		characters[i].CharacterInfo = ReplaceMessages(characters[i].CharacterInfo, userName, characters[i].CharacterName)
		characters[i].FirstMsgCharacter = ReplaceMessages(characters[i].FirstMsgCharacter, userName, characters[i].CharacterName)

		var creators models.User

		err := tx.Find(&creators, character.CreatorID)
		if err != nil {
			return c.Render(http.StatusInternalServerError, r.String("DB 에러: "+err.Error()))
		}
		creator[character.CreatorID] = creators.UserID
	}

	c.Set("title", "Home")
	c.Set("characters", characters)
	c.Set("characterCreator", creator)
	c.Set("javascript", "pages/index.js")
	return c.Render(http.StatusOK, r.HTML("pages/index.plush.html"))
}
