package actions

import (
	"aichat_golang/models"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
)

func ChatPage(c buffalo.Context) error {
	user, err := LogIn(c)
	if err != nil {
		return c.Redirect(http.StatusSeeOther, "/login")
	}
	chatID := c.Param("chat_id")

	tx := c.Value("tx").(*pop.Connection)

	chat := &models.Chat{}
	err = tx.Find(chat, chatID)
	if err != nil {
		fmt.Println("에러: ", err)
		return c.Redirect(http.StatusSeeOther, "/chat") // DB에서 채팅 id 찾기 실패
	}

	if chat.UserID != user.ID {
		return c.Redirect(http.StatusSeeOther, "/chat") // 다른 유저 채팅 접근 금지
	}

	character := &models.Character{}
	err = tx.Find(character, chat.CharacterID)
	if err != nil {
		fmt.Println("에러: ", err)
		return c.Redirect(http.StatusSeeOther, "/chat") // DB에서 캐릭터 id 찾기 실패
	}

	creator := &models.User{}
	err = tx.Find(creator, character.CreatorID)
	if err != nil {
		fmt.Println("에러: ", err)
		return c.Redirect(http.StatusSeeOther, "/chat") // DB에서 크리에이터 id 찾기 실패
	}
	firstMsg := ReplaceMessages(character.FirstMsgCharacter, user.Name, character.CharacterName)
	worldView := ReplaceMessages(character.WorldView, user.Name, character.CharacterName)
	characterInfo := ReplaceMessages(character.CharacterInfo, user.Name, character.CharacterName)
	escapedInfo, err := json.Marshal(characterInfo)

	if err != nil {
		fmt.Println("characterInfo JSON 변환 실패:", err)
		escapedInfo = []byte(`""`)
	}

	c.Set("title", fmt.Sprintf("%s x %s", character.CharacterName, user.Name))
	c.Set("login", true)
	c.Set("user", user)
	c.Set("character", character)
	c.Set("characterCreator", creator)
	c.Set("firstMsg", firstMsg)
	c.Set("worldView", worldView)
	c.Set("characterInfo", string(escapedInfo))
	c.Set("navBarType", "chat")
	c.Set("javascript", "pages/chat.js")

	return c.Render(http.StatusOK, r.HTML("pages/chat.plush.html"))
}

func ChatMainPage(c buffalo.Context) error {
	user, err := LogIn(c)
	if err != nil {
		return c.Redirect(http.StatusSeeOther, "/login")
	}

	tx := c.Value("tx").(*pop.Connection)

	var chats []models.Chat
	err = tx.Where("user_id = ?", user.ID).All(&chats)
	if err != nil {
		return c.Render(http.StatusInternalServerError, r.String("DB 에러: "+err.Error()))
	}
	var characters []models.Character
	err = tx.All(&characters)
	if err != nil {
		return c.Render(http.StatusInternalServerError, r.String("DB 에러: "+err.Error()))
	}

	sort.Slice(chats, func(i, j int) bool {
		return chats[i].UpdatedAt.After(chats[j].UpdatedAt)
	})

	c.Set("title", "Chat")
	c.Set("login", true)
	c.Set("user", user)
	c.Set("chats", &chats)
	c.Set("characters", &characters)
	c.Set("javascript", "pages/chat-main.js")

	return c.Render(http.StatusOK, r.HTML("pages/chat-main.plush.html"))
}

func CreateChat(c buffalo.Context) error {
	user, err := LogIn(c)
	if err != nil {
		return c.Redirect(http.StatusSeeOther, "/login")
	}
	characterStringID := c.Param("character_id")
	characterID, err := strconv.Atoi(characterStringID)
	if err != nil {
		fmt.Println("변환 에러:", err)
		return c.Render(http.StatusBadRequest, r.String("character_id 변환 실패"))
	}

	tx := c.Value("tx").(*pop.Connection)

	chat := &models.Chat{
		UserID:      user.ID,
		CharacterID: characterID,
		UserMessage: []string{},
		AiMessage:   []string{},
	}
	if err := tx.Create(chat); err != nil {
		fmt.Println(err)
		return c.Render(http.StatusInternalServerError, r.String(err.Error()))
	}
	url := fmt.Sprintf("/chat/%d", chat.ID)
	return c.Redirect(http.StatusSeeOther, url)
}

func DeleteChat(c buffalo.Context) error {

	user, err := LogIn(c)
	if err != nil {
		return c.Render(http.StatusBadRequest, r.String("권한 없음"))
	}

	chatID := c.Param("chat_id")

	tx := c.Value("tx").(*pop.Connection)

	chat := &models.Chat{}

	if err := tx.Find(chat, chatID); err != nil {
		fmt.Println("Can't Find Chat:", err)
		return c.Render(http.StatusNotFound, r.String("채팅을 찾을 수 없습니다"))
	}

	if chat.UserID != user.ID {
		return c.Render(http.StatusForbidden, r.String("권한 없음"))
	}

	var chatSummary []models.ChatSummary

	err = tx.Where("chat_id = ?", chatID).All(&chatSummary)
	if err != nil {
		fmt.Println("에러: ", err)
		return c.Render(http.StatusBadRequest, r.String("Chat Summary 찾기 실패"))
	}

	if err := tx.Destroy(chat); err != nil {
		return c.Render(http.StatusInternalServerError, r.String("삭제 실패: "+err.Error()))
	}

	for _, summary := range chatSummary {
		if err := tx.Destroy(&summary); err != nil {
			return c.Render(http.StatusInternalServerError, r.String("삭제 실패: "+err.Error()))
		}
	}

	return c.Render(http.StatusNoContent, nil)
}

func DeleteMessage(c buffalo.Context) error {

	user, err := LogIn(c)
	if err != nil {
		return c.Render(http.StatusBadRequest, r.String("권한 없음"))
	}

	chatID := c.Param("chat_id")

	tx := c.Value("tx").(*pop.Connection)

	chat := &models.Chat{}

	if err := tx.Find(chat, chatID); err != nil {
		fmt.Println("Can't Find Chat:", err)
		return c.Render(http.StatusNotFound, r.String("채팅을 찾을 수 없습니다"))
	}

	if user.ID != chat.UserID {
		return c.Render(http.StatusBadRequest, r.String("권한 없음"))
	}

	if len(chat.UserMessage) > 0 {
		chat.UserMessage = chat.UserMessage[:len(chat.UserMessage)-1]
	}

	if len(chat.AiMessage) > 0 {
		chat.AiMessage = chat.AiMessage[:len(chat.AiMessage)-1]
	}

	var chatSummary []models.ChatSummary

	err = tx.Where("chat_id = ?", chatID).All(&chatSummary)
	if err != nil {
		fmt.Println("에러: ", err)
		return c.Render(http.StatusBadRequest, r.String("Chat Summary 찾기 실패"))
	}

	if err = tx.Update(chat); err != nil {
		fmt.Println("Update Failed:", err)
		return c.Render(http.StatusInternalServerError, r.String("채팅 저장 실패"))
	}

	for _, summary := range chatSummary {
		if summary.MessageID == len(chat.UserMessage)-4 {
			if err := tx.Destroy(&summary); err != nil {
				return c.Render(http.StatusInternalServerError, r.String("Summary 삭제 실패"))
			}
		}
	}

	return c.Render(http.StatusNoContent, nil)
}

type DataForAI struct {
	MyName          string `json:"my_name"`
	MyInfo          string `json:"my_info"`
	CharacterName   string `json:"character_name"`
	CharacterInfo   string `json:"character_info"`
	CharacterGender string `json:"character_gender"`
	WorldView       string `json:"world_view"`
	Message         string `json:"message"`
}

type Conversation struct {
	Role    string
	Content string
}

func GetAllMessage(c buffalo.Context) error {

	user, err := LogIn(c)
	if err != nil {
		return c.Render(http.StatusBadRequest, r.String(err.Error()))
	}

	chatID := c.Param("chat_id")

	tx := c.Value("tx").(*pop.Connection)

	chat := &models.Chat{}

	if err = tx.Find(chat, chatID); err != nil {
		fmt.Println("Can't Find Chat:", err)
		return c.Render(http.StatusNotFound, r.String("채팅을 찾을 수 없습니다 "+err.Error()))
	}

	if chat.UserID != user.ID {
		return c.Render(http.StatusForbidden, r.String("권한 없음"))
	}

	return c.Render(http.StatusOK, r.JSON(chat))
}

func ReplaceMessages(s, userName, charName string) string {
	s = strings.ReplaceAll(s, "{{user}}", fmt.Sprintf("{{%s}}", userName))
	return strings.ReplaceAll(s, "{{char}}", charName)
}
