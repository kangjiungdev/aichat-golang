package actions

import (
	"aichat_golang/models"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"time"

	anthropic "github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
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

	character := &models.Character{}
	err = models.DB.Where("id = ?", chat.CharacterID).First(character)
	if err != nil {
		fmt.Println("에러: ", err)
		return c.Redirect(http.StatusSeeOther, "/chat") // DB에서 캐릭터 id 찾기 실패
	}

	if chat.UserID != user.ID {
		return c.Redirect(http.StatusSeeOther, "/chat") // 다른 유저 채팅 접근 금지
	}

	c.Set("title", "Chat")
	c.Set("login", true)
	c.Set("user", user)
	c.Set("character", character)
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

func DeleteChat(c buffalo.Context) error {
	fmt.Println("delete request")

	user, err := LogIn(c)
	if err != nil {
		return c.Redirect(http.StatusSeeOther, "/login")
	}

	chatID := c.Param("chat_id")

	chat := &models.Chat{}

	if err := models.DB.Find(chat, chatID); err != nil {
		fmt.Println("Can't Find Chat:", err)
		return c.Render(http.StatusNotFound, r.String("채팅을 찾을 수 없습니다"))
	}

	if chat.UserID != user.ID {
		return c.Render(http.StatusForbidden, r.String("권한 없음"))
	}

	if err := models.DB.Destroy(chat); err != nil {
		return c.Render(http.StatusInternalServerError, r.String("삭제 실패:", err))
	}

	return c.Redirect(http.StatusSeeOther, "/success/delete?what=chat")
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

func ResponseOfAI(c buffalo.Context) error {

	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	client := anthropic.NewClient(
		option.WithAPIKey(apiKey),
	)
	chatID := c.Request().FormValue("chat-id")
	chat := &models.Chat{}
	err := models.DB.Where("id = ?", chatID).First(chat)
	if err != nil {
		fmt.Println("에러: ", err)
		return c.Render(http.StatusBadRequest, r.String(err.Error()))
	}
	character := &models.Character{}
	err = models.DB.Where("id = ?", chat.CharacterID).First(character)
	if err != nil {
		fmt.Println("에러: ", err)
		return c.Render(http.StatusBadRequest, r.String(err.Error()))
	}

	userName := c.Request().FormValue("my-name-input")
	userInfo := c.Request().FormValue("my-info-input")
	userMsg := c.Request().FormValue("chat-input")
	dataforai := DataForAI{
		MyName:          fmt.Sprintf("내 이름은 '%s'(이)다.", userName),
		MyInfo:          fmt.Sprintf("내 정보(사실 기반): %s", userInfo),
		CharacterName:   fmt.Sprintf("너의 이름은 '%s'(이)다.", character.CharacterName),
		CharacterInfo:   fmt.Sprintf("너의 설정 정보(사실 기반): %s", character.CharacterInfo),
		CharacterGender: fmt.Sprintf("너의 성별은 '%s'다.", character.CharacterGender),
		WorldView:       fmt.Sprintf("세계관 설정: %s", character.WorldView),
	}

	jsonBytes, err := json.Marshal(dataforai)
	if err != nil {
		fmt.Println("json 변환 실패", err)
		return c.Render(http.StatusBadRequest, r.String("json 변환 실패: ", err))
	}

	var previousConversation []Conversation
	fmt.Println("user messages:", len(chat.UserMessage))
	fmt.Println("ai messages:", len(chat.AiMessage))
	for i := 0; i < len(chat.UserMessage); i++ {
		previousConversation = append(previousConversation, Conversation{Role: "user", Content: chat.UserMessage[i]})
		previousConversation = append(previousConversation, Conversation{Role: "ai", Content: chat.AiMessage[i]})
	}

	msg := []anthropic.MessageParam{
		anthropic.NewUserMessage(anthropic.NewTextBlock(
			"말이 아닌 비언어적 표현은 *로 감싸고, 말과 자연스럽게 동시에 일어나는 행동은 대사와 함께 쓸 수 있으며, 그 외 대부분의 표현은 *...다* 형태의 문장으로 작성해주세요. 예: *환한 미소를 지으며* 안녕하세요!, *당황한 표정을 짓는다*, *작은 손짓을 하며* 이쪽이야., *고개를 끄덕인다*",
		)),
		anthropic.NewUserMessage(anthropic.NewTextBlock(
			fmt.Sprintf("이 대화에서 '%s'는 사용자(User)이며, 너는 '%s'라는 캐릭터다. 너는 이제부터 %s로서 대화해야 하며, 절대 이 역할을 벗어나지 마라.", userName, character.CharacterName, character.CharacterName),
		)),
		anthropic.NewUserMessage(anthropic.NewTextBlock(string(jsonBytes))),
		anthropic.NewAssistantMessage(anthropic.NewTextBlock(character.FirstMsgCharacter)),
	}

	if len(previousConversation) > 0 {
		msg = append(msg, checkWho(previousConversation)...)
	}

	msg = append(msg, anthropic.NewUserMessage(anthropic.NewTextBlock(userMsg)))

	message, err := client.Messages.New(context.TODO(), anthropic.MessageNewParams{
		Model:     anthropic.F(anthropic.ModelClaude3_7SonnetLatest),
		MaxTokens: anthropic.F(int64(2048)),
		Messages:  anthropic.F(msg),
	})
	if err != nil {
		fmt.Println("API call failed", err)
		return c.Render(http.StatusBadRequest, r.String("API call failed:", err))
	}

	chat.UserMessage = append(chat.UserMessage, userMsg)
	chat.AiMessage = append(chat.AiMessage, message.Content[0].Text)

	err = models.DB.Update(chat)

	if err != nil {
		fmt.Println("DB Update Error", err)
		return c.Render(http.StatusOK, r.String("DB Update Error", err))
	}

	return c.Render(http.StatusOK, r.String(message.Content[0].Text))
}

func GetAllMessage(c buffalo.Context) error {
	defer c.Request().Body.Close()

	bytes, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return c.Render(http.StatusBadRequest, r.String("읽기 실패", err))
	}
	chatID := string(bytes)

	chat := &models.Chat{}

	if err := models.DB.Find(chat, chatID); err != nil {
		fmt.Println("Can't Find Chat:", err)
		return c.Render(http.StatusNotFound, r.String("채팅을 찾을 수 없습니다", err))
	}

	return c.Render(http.StatusSeeOther, r.JSON(chat))
}

func checkWho(previousConversation []Conversation) []anthropic.MessageParam {
	var chat []anthropic.MessageParam
	for _, conversation := range previousConversation {
		if conversation.Role == "user" {
			chat = append(chat, anthropic.NewUserMessage(anthropic.NewTextBlock(conversation.Content)))
		} else {
			chat = append(chat, anthropic.NewAssistantMessage(anthropic.NewTextBlock(conversation.Content)))
		}
	}
	return chat
}
