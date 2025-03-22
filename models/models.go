package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/gobuffalo/envy"
	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"
)

type StringArray []string

func (s StringArray) Value() (driver.Value, error) {
	return json.Marshal(s)
}

func (s *StringArray) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("failed to convert value to []byte")
	}
	return json.Unmarshal(b, s)
}

type User struct {
	ID          int       `json:"id" db:"id"`
	UserID      string    `json:"user_id" db:"user_id"`
	Password    string    `json:"password" db:"password"`
	Name        string    `json:"name" db:"name"`
	PhoneNumber string    `json:"phone_number" db:"phone_number"`
	BirthDate   time.Time `json:"birth_date" db:"birth_date"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

func (u User) TableName() string {
	return "users"
}

type Character struct {
	ID                   int         `json:"id" db:"id"`
	CreatorID            int         `json:"creator" db:"creator_id"`
	CharacterName        string      `json:"character_name" form:"character-name" db:"character_name"`
	CharacterInfo        string      `json:"character_info" form:"character-info" db:"character_info"`
	CharacterGender      string      `json:"character_gender" form:"character-gender" db:"character_gender"`
	CharacterOnelineInfo string      `json:"character_oneline_info" form:"character-oneline-info" db:"character_oneline_info"`
	WorldView            string      `json:"world_view" form:"world-view" db:"world_view"`
	FirstMsgCharacter    string      `json:"first_msg_character" form:"first-msg-character" db:"first_msg_character"`
	CharacterAssets      StringArray `json:"character_assets" form:"character-assets" db:"character_assets"`
	CreatorComment       string      `json:"creator_comment" form:"creator-comment" db:"creator_comment"`
	CreatedAt            time.Time   `json:"created_at" db:"created_at"`
}

func (c Character) TableName() string {
	return "characters"
}

type Chat struct {
	ID          int         `json:"id" db:"id"`
	UserID      int         `json:"user_id" db:"user_id"`
	CharacterID int         `json:"character_id" form:"character-id" db:"character_id"`
	UserMessage StringArray `json:"user_message" form:"user_message" db:"user_message"`
	AiMessage   StringArray `json:"ai_message" form:"ai_message" db:"ai_message"`
	CreatedAt   time.Time   `json:"created_at" db:"created_at"`
}

func (c Chat) TableName() string {
	return "chats"
}

// DB is a connection to your database to be used
// throughout your application.
var DB *pop.Connection

func init() {
	var err error
	env := envy.Get("GO_ENV", "development")
	DB, err = pop.Connect(env)
	if err != nil {
		log.Fatal(err)
	}
	pop.Debug = env == "development"
}

func (u *User) Validate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}
