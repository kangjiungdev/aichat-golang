package actions

import (
	"aichat_golang/models"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	anthropic "github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
	"github.com/gobuffalo/buffalo"
)

func ResponseOfAI(c buffalo.Context) error {

	user, err := LogIn(c)
	if err != nil {
		return c.Render(http.StatusBadRequest, r.String("권한 없음"))
	}

	userName := c.Request().FormValue("my-name-input")
	userInfo := c.Request().FormValue("my-info-input")
	userMsg := c.Request().FormValue("chat-input")

	if userMsg == "" || userName == "" {
		return c.Render(http.StatusBadRequest, r.String("input 값 비었음"))
	}

	apiKey := os.Getenv("ANTHROPIC_API_KEY")

	client := anthropic.NewClient(
		option.WithAPIKey(apiKey),
	)

	chatID := c.Request().FormValue("chat-id")

	chat := &models.Chat{}
	err = models.DB.Find(chat, chatID)

	if err != nil {
		fmt.Println("에러: ", err)
		return c.Render(http.StatusBadRequest, r.String("채팅 찾기 실패: "+err.Error()))
	}

	if chat.UserID != user.ID {
		return c.Render(http.StatusForbidden, r.String("다른 사용자의 채팅에 접근할 수 없습니다."))
	}

	character := &models.Character{}
	err = models.DB.Find(character, chat.CharacterID)
	if err != nil {
		fmt.Println("에러: ", err)
		return c.Render(http.StatusBadRequest, r.String("캐릭터 찾기 실패: "+err.Error()))
	}

	worldView := replaceMessages(character.WorldView, userName, character.CharacterName)
	characterInfo := replaceMessages(character.CharacterInfo, userName, character.CharacterName)

	dataforai := DataForAI{
		MyName:          fmt.Sprintf("내 이름은 '%s'(이)다.", userName),
		MyInfo:          fmt.Sprintf("내 정보(사실 기반): %s.", strings.TrimSuffix(userInfo, ".")),
		CharacterName:   fmt.Sprintf("너의 이름은 '%s'(이)다.", character.CharacterName),
		CharacterInfo:   fmt.Sprintf("너의 설정 정보(사실 기반): %s.", strings.TrimSuffix(characterInfo, ".")),
		CharacterGender: fmt.Sprintf("너의 성별은 '%s'다.", character.CharacterGender),
		WorldView:       fmt.Sprintf("세계관 설정: %s.", strings.TrimSuffix(worldView, ".")),
	}

	jsonBytes, err := json.Marshal(dataforai)
	if err != nil {
		fmt.Println("json 변환 실패", err)
		return c.Render(http.StatusBadRequest, r.String("json 변환 실패: "+err.Error()))
	}

	var previousConversation []Conversation
	var chatSummary []models.ChatSummary

	err = models.DB.Q().Where("chat_id = ?", chatID).All(&chatSummary)
	if err != nil {
		fmt.Println(err)
	}
	var summary []anthropic.MessageParam
	if len(chatSummary) > 0 {
		if len(chat.UserMessage) >= chatSummary[len(chatSummary)-1].MessageID+14 {

			start := chatSummary[len(chatSummary)-1].MessageID
			end := len(chat.UserMessage) - 4

			for i := start; i < end; i++ {
				summary = append(summary, anthropic.NewUserMessage(anthropic.NewTextBlock(chat.UserMessage[i])))
				summary = append(summary, anthropic.NewUserMessage(anthropic.NewTextBlock(chat.AiMessage[i])))
			}
			for i := len(chat.UserMessage) - 4; i < len(chat.UserMessage); i++ {
				previousConversation = append(previousConversation, Conversation{Role: "user", Content: chat.UserMessage[i]})
				previousConversation = append(previousConversation, Conversation{Role: "ai", Content: chat.AiMessage[i]})
			}

			message, err := SendSummaryReqToAI(client, summary)
			if err != nil {
				fmt.Println("API call failed", err)
				return c.Render(http.StatusInternalServerError, r.String("API call failed: "+err.Error()))
			}

			saveSummary := &models.ChatSummary{
				UserID:    user.ID,
				ChatID:    chat.ID,
				Summary:   message.Content[0].Text,
				MessageID: len(chat.UserMessage),
			}

			if err = models.DB.Create(saveSummary); err != nil {
				fmt.Println(err)
				return c.Render(http.StatusInternalServerError, r.String(err.Error()))
			}
		}
	} else if len(chatSummary) == 0 && len(chat.UserMessage) >= 14 {

		for i := 0; i < len(chat.UserMessage)-4; i++ {
			summary = append(summary, anthropic.NewUserMessage(anthropic.NewTextBlock(chat.UserMessage[i])))
			summary = append(summary, anthropic.NewUserMessage(anthropic.NewTextBlock(chat.AiMessage[i])))
		}
		for i := len(chat.UserMessage) - 4; i < len(chat.UserMessage); i++ {
			previousConversation = append(previousConversation, Conversation{Role: "user", Content: chat.UserMessage[i]})
			previousConversation = append(previousConversation, Conversation{Role: "ai", Content: chat.AiMessage[i]})
		}

		message, err := SendSummaryReqToAI(client, summary)
		if err != nil {
			fmt.Println("API call failed", err)
			return c.Render(http.StatusInternalServerError, r.String("API call failed: "+err.Error()))
		}

		saveSummary := &models.ChatSummary{
			UserID:    user.ID,
			ChatID:    chat.ID,
			Summary:   message.Content[0].Text,
			MessageID: len(chat.UserMessage),
		}

		if err = models.DB.Create(saveSummary); err != nil {
			fmt.Println(err)
			return c.Render(http.StatusInternalServerError, r.String(err.Error()))
		}

	} else {
		for i := 0; i < len(chat.UserMessage); i++ {
			previousConversation = append(previousConversation, Conversation{Role: "user", Content: chat.UserMessage[i]})
			previousConversation = append(previousConversation, Conversation{Role: "ai", Content: chat.AiMessage[i]})
		}
	}

	msg := []anthropic.MessageParam{}

	systemText := []anthropic.TextBlockParam{
		anthropic.NewTextBlock(`비언어적 표현과 말을 평균 300자 이상으로 최대한 자세히 작성해주세요.  
비언어적 표현은 앞뒤에 * (별표 기호)를 붙여 감싸며, 말과 자연스럽게 동시에 일어나는 행동은 대사와 함께 써주세요.  
대사 없이 단독 행동은 *...다* 형태로 끝내주세요.  
감정, 표정, 눈빛, 몸짓을 시각적·감각적으로 묘사해 주세요.  

모든 비언어적 행동 표현은 반드시 "~하고 있다", "~이다", "~한다" 등 서술형 문체를 사용해주세요.  
"~하고 있습니다", "~입니다" 같은 존댓말 문체는 행동 표현에서는 절대 사용하지 마세요. 
대사는 자유롭게 작성해도 됩니다.`),
		anthropic.NewTextBlock(fmt.Sprintf("이 대화에서 '%s'는 사용자(User)이며, 너는 '%s'라는 캐릭터다. 너는 이제부터 %s로서 대화해야 하며, 절대 이 역할을 벗어나지 마라.", userName, character.CharacterName, character.CharacterName)),
		anthropic.NewTextBlock(string(jsonBytes)),
	}

	if character.FirstMsgCharacter != "" {
		firstMsg := strings.ReplaceAll(character.FirstMsgCharacter, "{{user}}", userName)
		firstMsg = strings.ReplaceAll(firstMsg, "{{char}}", character.CharacterName)
		msg = append(msg, anthropic.NewAssistantMessage(anthropic.NewTextBlock(firstMsg)))
	}

	if len(chatSummary) > 0 {
		summary := []string{}
		for i := 0; i < len(chatSummary); i++ {
			summary = append(summary, chatSummary[i].Summary)
		}
		for i := len(chat.UserMessage) - 4; i < len(chat.UserMessage); i++ {
			previousConversation = append(previousConversation, Conversation{Role: "user", Content: chat.UserMessage[i]})
			previousConversation = append(previousConversation, Conversation{Role: "ai", Content: chat.AiMessage[i]})
		}
		msg = append(msg, anthropic.NewUserMessage(anthropic.NewTextBlock(fmt.Sprintf("대화 요약: %s", strings.Join(summary, " ")))))
		msg = append(msg, CheckWho(previousConversation)...)
	}

	if len(previousConversation) > 0 && len(chatSummary) == 0 {
		msg = append(msg, CheckWho(previousConversation)...)
	}

	msg = append(msg, anthropic.NewUserMessage(anthropic.NewTextBlock(userMsg)))

	message, err := client.Messages.New(context.TODO(), anthropic.MessageNewParams{
		Model:     anthropic.F(anthropic.ModelClaude3_7SonnetLatest),
		MaxTokens: anthropic.F(int64(4096)),
		System:    anthropic.F(systemText),
		Messages:  anthropic.F(msg),
	})
	if err != nil {
		fmt.Println("API call failed", err)
		return c.Render(http.StatusInternalServerError, r.String("API call failed: "+err.Error()))
	}

	chat.UserMessage = append(chat.UserMessage, userMsg)
	chat.AiMessage = append(chat.AiMessage, message.Content[0].Text)

	err = models.DB.Update(chat)

	if err != nil {
		fmt.Println("DB Update Error", err)
		return c.Render(http.StatusBadRequest, r.String("DB Update Error: "+err.Error()))
	}

	return c.Render(http.StatusOK, r.String(message.Content[0].Text))
}

func CheckWho(previousConversation []Conversation) []anthropic.MessageParam {
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

func SendSummaryReqToAI(client *anthropic.Client, summary []anthropic.MessageParam) (*anthropic.Message, error) {
	message, err := client.Messages.New(context.TODO(), anthropic.MessageNewParams{
		Model:     anthropic.F(anthropic.ModelClaude3_7SonnetLatest),
		MaxTokens: anthropic.F(int64(4096)),
		System:    anthropic.F([]anthropic.TextBlockParam{anthropic.NewTextBlock("다음은 유저와 캐릭터 사이의 대화입니다. 이 대화의 중요한 내용을 간결하게 요약해 주세요. 요약에는 감정 변화, 관계 흐름, 세계관/설정 변화, 말투나 행동의 특징, 중요한 대사나 장면을 포함해야 합니다. 단, '요약:', '대화 요약:' 같은 제목이나 항목명은 출력하지 말고, 자연스러운 문장 형태로 본문 내용만 작성하세요.")}),
		Messages:  anthropic.F(summary),
	})
	return message, err
}
