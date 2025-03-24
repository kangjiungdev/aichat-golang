const aiReqForm = document.getElementById("ai-req-form")
const chatID = window.location.pathname.split("/")[2]
const chatBox = document.getElementById("chat-box")
const chatInput = document.getElementById("chat-input")
const userNameInput = document.getElementById("my-name-input")
const userInfoInput = document.getElementById("my-info-input")
const deleteChatBtn = document.getElementById("delete-chat")
const firstMessageOfCharacter = document.getElementById("first-message")

document.addEventListener("DOMContentLoaded", async() => {
    try {
        const req = await fetch("/get-all-chat", {
            method:"POST",
            headers: {
                "Content-Type": "text/plain"
              },
            body: chatID
        })
        const res = await req.json()
        for (let i=0; i < res.user_message.length; i++) {
            createChatBlock(res.user_message[i], "User")
            createChatBlock(res.ai_message[i], "AI")
        }
    }
    catch (e) {
        console.error(e)
    }
})
aiReqForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if(chatInput.value.trim() === "" || userNameInput.value.trim() === "") {
        return
    }
    chatInput.value = chatInput.value.trim()
    userNameInput.value = userNameInput.value.trim()
    userInfoInput.value = userInfoInput.value.trim()

    createChatBlock(chatInput.value, "User")

    const form = new FormData(aiReqForm)
    form.append("chat-id", chatID)
    chatInput.value = ""
    try {
        const req = await fetch("/ai-response", {method:"POST", body: form})
        const res = await req.text()
        createChatBlock(res, "AI")
    }
    catch (e) {
        console.error(e)
    }
})

deleteChatBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    try {
        const req = await fetch(`/chat/${chatID}`, { method: "DELETE" })
        if (req.redirected) {
            window.location.href = req.url
        }
        const res = await req.text()
        console.log(res)
    }
    catch (e) {
        console.error(e)
    }
})

if(firstMessageOfCharacter) {
    const checkAction = actionChat(firstMessageOfCharacter.innerText)
    firstMessageOfCharacter.innerText = ""
    checkAction.forEach((object) => {
        const chatSpan = document.createElement("span")
        if(object.word) {
            chatSpan.innerText = object.word
                chatSpan.classList.add("ai-conversation-chat")
        } else {
            chatSpan.innerText = object.act
                chatSpan.classList.add("ai-action-chat")
                chatBlock.classList.add("ai-chat-block-div")
        }
        chatSpan.classList.add("chat-span")
        firstMessageOfCharacter.appendChild(chatSpan)
    })
}

function createChatBlock(chatContents, who) {
    const chatBlock = document.createElement("div");
    const chat = document.createElement("p")
    const checkAction = actionChat(chatContents)
    checkAction.forEach((object) => {
        const chatSpan = document.createElement("span")
        if(object.word) {
            chatSpan.innerText = object.word
            if (who === "User") {
                chatSpan.classList.add("user-conversation-chat")
            } else {
                chatSpan.classList.add("ai-conversation-chat")
                chatBlock.classList.add("ai-chat-block-div")
            }
        } else {
            chatSpan.innerText = object.act
            if (who === "User") {
                chatSpan.classList.add("user-action-chat")
            } else {
                chatSpan.classList.add("ai-action-chat")
                chatBlock.classList.add("ai-chat-block-div")
            }
        }
        chatSpan.classList.add("chat-span")
        chat.appendChild(chatSpan)
    })
    chatBlock.appendChild(chat)
    chatBlock.classList.add("chat-block-div")
    chatBox.appendChild(chatBlock)
}

function actionChat(chatContents) {
    const regex = /\*([^*]+)\*|([^*]+)/g;

    let txtArray = [];
    let match;
    
    while ((match = regex.exec(chatContents)) !== null) {
      if (match[1]) {
        // *로 감싸인 부분은 act로 저장
        txtArray.push({ act: match[1] });
      } else if (match[2]) {
        // *로 감싸지 않은 부분은 word로 저장
        txtArray.push({ word: match[2] });
      }
    }
    return txtArray
}

function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}