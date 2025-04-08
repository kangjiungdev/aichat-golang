const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
const chatID = window.location.pathname.split("/")[2]
let isSubmitting = false


const aiReqForm = document.getElementById("ai-req-form")
const chatBox = document.getElementById("chat-box")
const chatInput = document.getElementById("chat-input")
const navCharacterInfoButton = document.getElementById("nav-character-info-button")
const userNameInput = document.getElementById("my-name-input")
const userInfoInput = document.getElementById("my-info-input")
const firstMessageOfCharacter = document.getElementById("first-message")
const chatCharacterImage = document.querySelector(".chat-character-image")

async function chatPageLoad() {
    const userInfos = JSON.parse(localStorage.getItem("userInfos"))
    if (userInfos?.[chatID] && typeof userInfos[chatID] === "object") {
        userNameInput.value = userInfos[chatID].userName
        userInfoInput.value = userInfos[chatID].userInfo
        chatCharacterImage.src = userInfos[chatID].characterImg
    }

    const imgSrcWhenLoadErr = JSON.parse(chatCharacterImage.dataset.img)[0]

    if (chatCharacterImage.complete) {
        if (chatCharacterImage.naturalWidth === 0) {
          console.error('로드 실패: 이미지가 없거나 깨졌음');
          chatCharacterImage.src = `/${imgSrcWhenLoadErr}`
        }
      } else {
        chatCharacterImage.addEventListener('error', () => {
          console.error('로드 실패: 잘못된 URL이거나 이미지 없음');
          chatCharacterImage.src = `/${imgSrcWhenLoadErr}`
        });
      }


    try {
        const req = await fetch(`/get-all-chat/${chatID}`, {
            method:"POST",
            headers: {
                "Content-Type": "text/plain",
                "X-CSRF-Token": csrfToken
              },
        })
        const res = await req.json()
        for (let i=0; i < res.user_message.length; i++) {
            createChatBlock(res.user_message[i], "User")
            createChatBlock(res.ai_message[i], "AI")
        }
        createDeleteButton()
        scrollToBottom()

        document.addEventListener("click", function (e) {
            const popup = document.querySelector(".character-popup");
            const button = navCharacterInfoButton;
          
            if (!popup) return;
          
            // 팝업 외부 && 버튼(전체 영역 포함) 외부 클릭 시 닫기
            if (!popup.contains(e.target) && !button.contains(e.target)) {
              popup.remove();
              removeBlurOverlay()
            }
          });
    }
    catch (e) {
        console.error(e)
    }}

chatPageLoad()

navCharacterInfoButton.addEventListener("click", function() {
    const characterName = document.querySelector(".navbar-div3 span").dataset.characterName
    const imgsRoute = chatCharacterImage.dataset.img
    const imgArray = JSON.parse(imgsRoute);
    const characterInfo = JSON.parse(document.querySelector(".nav-infodiv").dataset.characterInfo)
    const characterWorldView = document.querySelector(".navbar-div1").dataset.characterWorldView
    const characterOnelineInfo = document.querySelector(".navbar-div2").dataset.characterOnelineInfo
    const creatorUserID = document.querySelector(".navbar-chat-user-id span").dataset.creatorUserid
    const characterInfoDiv = document.createElement("div")
    characterInfoDiv.innerHTML = `
    <div class="popup-container">
    <!-- 좌측: 캐릭터 이미지 및 정보 -->
    <div class="popup-left">
      <div class="character-header">
      <h3 class="popup-character-name">${characterName}</h3>
        <img src="${chatCharacterImage.src}" class="character-image" alt="캐릭터 이미지" style="width: 351.297px; height: 526.938px; object-fit: cover;">
        <div class="character-meta">
          <a href="/user/${creatorUserID}" class="creator">@${creatorUserID}</a>
          <span class="views">8.1천</span>
          <span class="likes">444</span>
        </div>
      </div>
      
      <!-- 썸네일 리스트 -->
      <div class="thumbnail-row">
        ${imgArray.map(element => {
            return `<img src="/${element}" class="thumb">`;
          }).join('')}
      </div>


      <div class="popup-oneline-info">${characterOnelineInfo}</div>
    </div>

    <!-- 우측: 세계관 + 캐릭터 소개 -->
    <div class="popup-right">
      <div class="section">
        <h3>세계관</h3>
        <p>
          ${convertText(characterWorldView)}
        </p>
      </div>

      <div class="section">
        <h3>캐릭터 소개</h3>
        <p style="white-space: pre-wrap;">${convertText(characterInfo)}</p>
      </div>
    </div>
  </div>

  <!-- 하단: 내 정보 -->
  <div class="popup-footer">
    <h4>내 정보</h4>
            <label for="popup-input-user-name">
            <p>이름</p>
            <input type="text" placeholder="캐릭터에게 내 이름을 알려주세요." id="popup-input-user-name" class="popup-input-user-name input-box" value="${userNameInput.value}">
        </label>
        <label for="popup-input-user-info">
            <p>소개</p>
            <textarea placeholder="캐릭터에게 나에 대해 알려주세요." id="popup-input-user-info" class="popup-input-user-info input-box">${userInfoInput.value}</textarea>
        </label>
  </div>
    `
    characterInfoDiv.classList.add("character-popup")
    document.body.appendChild(characterInfoDiv)
    const thumbImg = document.querySelectorAll(".thumb")
    if(!document.querySelector(".active")) {
        thumbImg.forEach(element => {
            if(chatCharacterImage.src === element.src) {
                element.classList.add("active")
            }
        })
    }
    characterInfoDiv.style.display = "block";
    document.querySelector(".container").classList.add("blurred");
    thumbImg.forEach(element => {
        element.addEventListener("click", function() {
            if(this.classList.contains("active")) {
                return
            }
            const activeElement = document.querySelector(".active")
            activeElement.classList.remove("active")
            this.classList.add("active")
            document.querySelector(".character-image").src = this.src
            chatCharacterImage.src = this.src
            let userInfos = JSON.parse(localStorage.getItem("userInfos")) || {};
            userInfos[chatID] = {
                userName: userNameInput.value,
                userInfo: userInfoInput.value,
                characterImg: this.src
            }
            localStorage.setItem("userInfos", JSON.stringify(userInfos));
        })
    })
    document.querySelector(".popup-input-user-name").addEventListener("change", function() {
        userNameInput.value = this.value
        userNameInput.dispatchEvent(new Event('change'));
    })
    document.querySelector(".popup-input-user-info").addEventListener("change", function() {
        userInfoInput.value = this.value
        userInfoInput.dispatchEvent(new Event('change'));
    })
    showBlurOverlay()
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
            createChatBlock("오류가 발생했습니다. 현재 AI가 응답할 수 없는 상태입니다. 잠시 후 다시 시도해 주세요.", "AI")
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
    const firstMsgConverted = convertText(firstMessageOfCharacter.textContent)
    firstMessageOfCharacter.textContent = firstMsgConverted
    
    const checkAction = actionChat(firstMessageOfCharacter.textContent)
    firstMessageOfCharacter.textContent = ""
    checkAction.forEach((object) => {
        const chatSpan = document.createElement("span")
        if(object.word) {
            chatSpan.textContent = object.word
                chatSpan.classList.add("ai-conversation-chat")
        } else {
            chatSpan.textContent = object.act
                chatSpan.classList.add("ai-action-chat")
        }
        chatSpan.classList.add("chat-span")
        firstMessageOfCharacter.appendChild(chatSpan)
    })
}

document.querySelector(".navbar-chat-go-back").addEventListener("click", () => { history.back() })

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

function convertText(text) {
    const userInfos = JSON.parse(localStorage.getItem("userInfos"))
    const matches = [...text.matchAll(/{{(.*?)}}/g)];
    let textConverted;
    const name = matches.map(m => m[1]);
    if (userInfos?.[chatID] && typeof userInfos[chatID] === "object") {
        textConverted = text.replaceAll(`{{${name[0]}}}`, userInfos[chatID].userName)
    } else {
        textConverted = text.replaceAll(`{{${name[0]}}}`, name[0])
    }
    return textConverted
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
    if (allUserChat[1]) {
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
            userInfo: userInfoInput.value,
            characterImg: chatCharacterImage.src
        }
        localStorage.setItem("userInfos", JSON.stringify(userInfos));
    })
}

function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

// blur 오버레이 추가
function showBlurOverlay() {
    const overlay = document.createElement("div");
    overlay.classList.add("blur-overlay");
    overlay.id = "blur-overlay";
    document.body.appendChild(overlay);
  }
  
  // 오버레이 제거
function removeBlurOverlay() {
    const existing = document.getElementById("blur-overlay");
    if (existing) {
      existing.remove();
    }
}