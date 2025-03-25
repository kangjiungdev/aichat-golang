const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
const aiReqForm = document.getElementById("ai-req-form")
const chatID = window.location.pathname.split("/")[2]
const chatBox = document.getElementById("chat-box")
const chatInput = document.getElementById("chat-input")
const userNameInput = document.getElementById("my-name-input")
const userInfoInput = document.getElementById("my-info-input")
const firstMessageOfCharacter = document.getElementById("first-message")
let isSubmitting = false

document.addEventListener("DOMContentLoaded", async() => {
    const userInfos = JSON.parse(localStorage.getItem("userInfos"))
    if (userInfos?.[chatID] && typeof userInfos[chatID] === "object") {
        userNameInput.value = userInfos[chatID].userName
        userInfoInput.value = userInfos[chatID].userInfo
    }
    try {
        const req = await fetch("/get-all-chat", {
            method:"POST",
            headers: {
                "Content-Type": "text/plain",
                "X-CSRF-Token": csrfToken
              },
            body: chatID
        })
        const res = await req.json()
        for (let i=0; i < res.user_message.length; i++) {
            createChatBlock(res.user_message[i], "User")
            createChatBlock(res.ai_message[i], "AI")
        }
        scrollToBottom()
    }
    catch (e) {
        console.error(e)
    }
})
aiReqForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if(isSubmitting) {
        return
    }
    if(chatInput.value.trim() === "" || userNameInput.value.trim() === "") {
        return
    }
    isSubmitting = true
    chatInput.value = chatInput.value.trim()
    userNameInput.value = userNameInput.value.trim()
    userInfoInput.value = userInfoInput.value.trim()

    createChatBlock(chatInput.value, "User")
    scrollToBottom()

    const form = new FormData(aiReqForm)
    form.append("chat-id", chatID)
    chatInput.value = ""
    try {
        const req = await fetch("/ai-response", {method:"POST", body: form})
        const res = await req.text()
        createChatBlock(res, "AI")
    }   catch (e) {
        console.error(e)
    } finally {
        isSubmitting = false
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
        }
        chatSpan.classList.add("chat-span")
        firstMessageOfCharacter.appendChild(chatSpan)
    })
}

storageSetEvent(userNameInput)
storageSetEvent(userInfoInput)

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

function storageSetEvent(element) {
    element.addEventListener("change", function() {
        let userInfos = JSON.parse(localStorage.getItem("userInfos")) || {};
        userInfos[chatID] = {
            userName: userNameInput.value,
            userInfo: userInfoInput.value
        }
        localStorage.setItem("userInfos", JSON.stringify(userInfos));
    })
}

function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}