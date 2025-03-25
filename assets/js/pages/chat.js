const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
const aiReqForm = document.getElementById("ai-req-form")
const chatID = window.location.pathname.split("/")[2]
const chatBox = document.getElementById("chat-box")
const chatInput = document.getElementById("chat-input")
const navCharacterInfoButton = document.getElementById("nav-character-info-button")
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
        createDeleteButton()
        scrollToBottom()
    }
    catch (e) {
        console.error(e)
    }
})

navCharacterInfoButton.addEventListener("click", () => {
    console.log("user info")
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
    removeDeleteButton()

    const form = new FormData(aiReqForm)
    form.append("chat-id", chatID)
    chatInput.value = ""
    try {
        const req = await fetch("/ai-response", {method:"POST", body: form})
        if(req.ok) {
            const res = await req.text()
            createChatBlock(res, "AI")
        } else {
            createChatBlock("오류가 발생했습니다. 현재 AI가 응답할 수 없는 상태입니다. 잠시 후 다시 시도해 주세요..", "AI")
        }
    }   catch (e) {
        console.error(e)
    } finally {
        createDeleteButton()
        isSubmitting = false
    }
})

chatInput.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        aiReqForm.requestSubmit();
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

function createDeleteButton() {
    const allUserChat = chatBox.querySelectorAll(".chat-block-div")
    if (allUserChat[0]) {
        const lastUserChat = allUserChat[allUserChat.length - 2]
        const deleteButton = document.createElement("button")
        deleteButton.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
       stroke-width="1.5" stroke="currentColor" >
    <path stroke-linecap="round" stroke-linejoin="round" 
          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
  </svg>
`
        deleteButton.id = "delete-chat"
        deleteButton.addEventListener("click", deleteReq)
        lastUserChat.appendChild(deleteButton)
    }
}

function removeDeleteButton() {
    const deleteBtn = document.getElementById("delete-chat")
    if (deleteBtn) {
        deleteBtn.remove()
    }
}

async function deleteReq() {
    const allUserChat =  chatBox.querySelectorAll(".chat-block-div")
    try {
        const req = await fetch(`/delete-message/${chatID}`, {method: "POST", headers: {"X-CSRF-Token": csrfToken}})
        if (req.ok) {
            chatBox.lastElementChild.remove()
            allUserChat[allUserChat.length - 2].remove()
            createDeleteButton()
        }
    } catch (e) {
        console.error(e)
    }
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