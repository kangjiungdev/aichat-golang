const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
const deleteChatBtn = document.getElementsByClassName("delete-chat")
const userName = document.querySelectorAll(".chat-footer-username")
const chatCharacterImage = document.querySelectorAll(".chat-img")
const chatPreview = document.querySelectorAll(".chat-preview")

const userInfos = JSON.parse(localStorage.getItem("userInfos"))

userName.forEach(element => {
    chatID = element.dataset.chatId
    if (userInfos?.[chatID] && typeof userInfos[chatID] === "object") {
        element.innerText = userInfos[chatID].userName
    }
})

chatCharacterImage.forEach(element => {
    chatID = element.dataset.chatId
    if (userInfos?.[chatID] && typeof userInfos[chatID] === "object") {
        element.src = userInfos[chatID].characterImg
    }

    const imgSrcWhenLoadErr = JSON.parse(element.dataset.img)[0]


    if (element.complete) {
        if (chatCharacterImage.naturalWidth === 0) {
          console.error('로드 실패: 이미지가 없거나 깨졌음');
          element.src = `/${imgSrcWhenLoadErr}`
        }
      } else {
        element.addEventListener('error', () => {
          console.error('로드 실패: 잘못된 URL이거나 이미지 없음');
          element.src = `/${imgSrcWhenLoadErr}`
        });
      }
})


if (deleteChatBtn.length > 0) {
    [...deleteChatBtn].forEach(element => {
        element.addEventListener("click", async event => {
            event.preventDefault();
            const chatID = element.value
            try {
                const req = await fetch(`/chat/${chatID}`, { method: "DELETE", headers: { "X-CSRF-Token": csrfToken } })
                if (req.ok) {
                    const chatCard = element.closest(".chat-card");
                    if (chatCard) {
                        chatCard.remove();
                      }
                    let userInfos = JSON.parse(localStorage.getItem("userInfos")) || {};
                    delete userInfos[chatID];
                    localStorage.setItem("userInfos", JSON.stringify(userInfos));
                } else {
                    const res = await req.text()
                    console.log(res)
                }
            }
            catch (e) {
                console.error(e)
            }
        })
    });
}

chatPreview.forEach(element => {
    parseAndDisplay(element)
})

function parseAndDisplay(element) {
    const text = convertText(element);
    const regex = /\*([^*]+)\*|([^*]+)/g;
    const txtArray = [];
    let match;
  
    // 1. *...* → act / 나머지 → word 로 구분
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        txtArray.push({ act: match[1] });
      } else if (match[2]) {
        txtArray.push({ word: match[2] });
      }
    }
  
    // 2. 글자 수 제한 + 색상/클래스 처리
    const maxLength = 63;
    let currentLength = 0;
    const container = document.createElement("span");
  
    for (const chunk of txtArray) {
      const content = chunk.act || chunk.word;
      const nextLength = currentLength + [...content].length;
  
      if (nextLength > maxLength) {
        const remaining = maxLength - currentLength;
        const slice = [...content].slice(0, remaining).join('');
        const span = document.createElement("span");
        span.innerText = slice + "...";
        span.classList.add("chat-span");
        span.classList.add(chunk.act ? "ai-action-chat" : "ai-conversation-chat");
        container.appendChild(span);
        break;
      }
  
      const span = document.createElement("span");
      span.innerText = content;
      span.classList.add("chat-span");
      span.classList.add(chunk.act ? "ai-action-chat" : "ai-conversation-chat");
      container.appendChild(span);
      currentLength = nextLength;
    }
  
    // 기존 텍스트 제거 후, 파싱된 결과 추가
    element.innerText = "";
    element.appendChild(container);
}

function convertText(element) {
    const chatID = element.dataset.chatId
    const text = element.innerText
    const charName = element.dataset.charName
    const userName = element.dataset.userName
    const userInfos = JSON.parse(localStorage.getItem("userInfos"))
    const matches = [...text.matchAll(/{{(.*?)}}/g)];
    let textConverted;
    const name = matches.map(m => m[1]);
    if (userInfos?.[chatID] && typeof userInfos[chatID] === "object") {
        textConverted = text.replaceAll(`{{${name[0]}}}`, userInfos[chatID].userName)
    } else {
        textConverted = text.replaceAll(`{{${name[0]}}}`, userName)
    }
    textConverted = textConverted.replaceAll(`{{char}}`, charName)
    return textConverted
}