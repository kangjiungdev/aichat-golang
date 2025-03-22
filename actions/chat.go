package actions

import (
	"aichat_golang/models"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gobuffalo/buffalo"
)

func ChatPage(c buffalo.Context) error {
	user, err := LogIn(c)
	if err != nil {
		fmt.Println(err)
		c.Redirect(http.StatusSeeOther, "/login")
	}
	chatID := c.Param("chat_id")

	chat := &models.Chat{}
	err = models.DB.Where("id = ?", chatID).First(chat)
	if err != nil {
		fmt.Println("에러: ", err)
		return c.Redirect(http.StatusSeeOther, "/chat") // DB에서 채팅 id 찾기 실패
	}

	if chat.UserID != user.ID {
		return c.Redirect(http.StatusSeeOther, "/chat") // 다른 유저 채팅 접근 금지
	}

	c.Set("title", "Chat")
	c.Set("login", true)
	c.Set("user", user)
	c.Set("javascript", "pages/chat.js")

	return c.Render(http.StatusOK, r.HTML("pages/chat.plush.html"))
}

func ChatMainPage(c buffalo.Context) error {
	user, err := LogIn(c)
	if err != nil {
		fmt.Println(err)
		c.Redirect(http.StatusSeeOther, "/login")
	}

	var chats []models.Chat
	err = models.DB.All(&chats)
	if err != nil {
		return c.Render(http.StatusInternalServerError, r.String("DB 에러: "+err.Error()))
	}
	var characters []models.Character
	err = models.DB.All(&characters)
	if err != nil {
		return c.Render(http.StatusInternalServerError, r.String("DB 에러: "+err.Error()))
	}

	c.Set("title", "Chat")
	c.Set("login", true)
	c.Set("user", user)
	c.Set("chats", &chats)
	c.Set("characters", &characters)
	c.Set("javascript", "pages/chat_main.js")

	return c.Render(http.StatusOK, r.HTML("pages/chat_main.plush.html"))
}

func CreateChat(c buffalo.Context) error {
	user, err := LogIn(c)
	if err != nil {
		fmt.Println(err)
		c.Redirect(http.StatusSeeOther, "/login")
	}
	characterStringID := c.Param("character_id")
	characterID, err := strconv.Atoi(characterStringID)
	if err != nil {
		fmt.Println("변환 에러:", err)
	}
	createat, err := time.Parse("2006-01-02", time.Now().Format("2006-01-02"))
	if err != nil {
		fmt.Println(err)
	}
	chat := &models.Chat{
		UserID:      user.ID,
		CharacterID: characterID,
		UserMessage: []string{},
		AiMessage:   []string{},
		CreatedAt:   createat,
	}
	if err := models.DB.Create(chat); err != nil {
		fmt.Println(err)
		return c.Render(http.StatusInternalServerError, r.String(err.Error()))
	}
	url := fmt.Sprintf("/chat/%d", chat.ID)
	return c.Redirect(http.StatusSeeOther, url)
}
