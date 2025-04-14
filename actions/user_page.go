package actions

import (
	"aichat_golang/models"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
)

func UserPage(c buffalo.Context) error {
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

	pageUser := &models.User{}

	userID := c.Param("userid")
	err = tx.Where("user_id = ?", userID).First(pageUser)
	if err != nil {
		return c.Error(http.StatusNotFound, errors.New("유저를 찾을 수 없습니다"))
	}

	var characters []models.Character
	err = tx.Where("creator_id = ?", pageUser.ID).All(&characters)
	if err != nil {
		return c.Render(http.StatusInternalServerError, r.String("DB 에러: "+err.Error()))
	}
	fmt.Println(characters)

	var pageUserMessageNumber int
	var characterUserNumber int

	for i, character := range characters {
		fmt.Println(character.ID)
		characters[i].WorldView = ReplaceMessages(characters[i].WorldView, userName, characters[i].CharacterName)
		characters[i].CharacterInfo = ReplaceMessages(characters[i].CharacterInfo, userName, characters[i].CharacterName)
		characters[i].FirstMsgCharacter = ReplaceMessages(characters[i].FirstMsgCharacter, userName, characters[i].CharacterName)

		var pageUserMessageNumberStruct struct {
			Count int `db:"count"`
		}

		err = tx.RawQuery("SELECT COALESCE(SUM(CASE WHEN JSON_VALID(user_message) THEN JSON_LENGTH(user_message) ELSE 0 END), 0) AS count FROM chats WHERE character_id = ?", character.ID).First(&pageUserMessageNumberStruct)
		if err != nil {
			fmt.Println("DB 에러: " + err.Error())
			return c.Render(http.StatusInternalServerError, r.String("DB 에러: "+err.Error()))
		}

		pageUserMessageNumber += pageUserMessageNumberStruct.Count
	}

	var characterUserNumberStruct struct {
		Count int `db:"count"`
	}

	err = tx.RawQuery("SELECT COUNT(DISTINCT chats.user_id) AS count FROM chats JOIN characters ON chats.character_id = characters.id WHERE characters.creator_id = ?", pageUser.ID).First(&characterUserNumberStruct)
	if err != nil {
		fmt.Println("DB 에러: " + err.Error())
		return c.Render(http.StatusInternalServerError, r.String("DB 에러: "+err.Error()))
	}

	characterUserNumber = characterUserNumberStruct.Count

	signupDate := pageUser.CreatedAt.Format("2006-01-02")
	signupDateConvert := strings.Replace(signupDate, "-", ".", -1)

	c.Set("title", "Home")
	c.Set("characters", characters)
	c.Set("pageUser", pageUser)
	c.Set("pageUserMessageNumber", FormatKoreanNumber(pageUserMessageNumber))
	c.Set("characterUserNumber", FormatKoreanNumber(characterUserNumber))
	c.Set("signupDate", signupDateConvert)
	c.Set("javascript", "pages/user-page.js")
	return c.Render(http.StatusOK, r.HTML("pages/user-page.plush.html"))
}
