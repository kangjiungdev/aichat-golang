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
                    console.error(res)
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



$(".character-info-btn").on("click", async function() {
  let res
  try {
    const req = await fetch("/get-character-data", {
      method:"POST",
      headers: {"Content-Type": "text/plain", "X-CSRF-Token":csrfToken},
      body: this.dataset.characterId
    })
    res = await req.json()
  } catch (e) {
    console.error(e)
    return
  }
  const creatorUserID = res["creator_id"]
  const characterName = res["character_name"]
  const imgsRoute = res["character_assets"]
  const characterInfo = res["character_info"]
  const characterWorldView = res["world_view"]
  const characterOnelineInfo = res["character_oneline_info"]

  const characterInfoDiv = document.createElement("div")
  characterInfoDiv.innerHTML = `
  <div class="popup-container">
  <!-- 좌측: 캐릭터 이미지 및 정보 -->
  <div class="popup-left">
    <div class="character-header">
      <h3 class="popup-character-name">${htmlToText(characterName)}</h3>
      <img src="${imgsRoute[0]}" class="character-image" alt="캐릭터 이미지" style="width: 351.297px; height: 526.938px; object-fit: cover;">
      <div class="character-meta">
        <a href="/user/${creatorUserID}" class="creator">@${creatorUserID}</a>
        <span class="views">8.1천</span>
        <span class="likes">444</span>
      </div>
    </div>
    
    <!-- 썸네일 리스트 -->
    <div class="thumbnail-row">
      ${imgsRoute.map(element => {
          return `<img src="/${element}" class="thumb">`;
        }).join('')}
    </div>


    <div class="popup-oneline-info">${htmlToText(characterOnelineInfo)}</div>
  </div>

  <!-- 우측: 세계관 + 캐릭터 소개 -->
  <div class="popup-right">
    <div class="section"><h3>세계관</h3><p>${htmlToText(popUpConvertText(characterWorldView))}</p></div>

    <div class="section"><h3>캐릭터 소개</h3><p style="white-space: pre-wrap;">${htmlToText(popUpConvertText(characterInfo))}</p></div>
    <button id="popup-chat-button" onclick='location.href="/chat/${chatID}"' data-character-id="${this.dataset.characterId}">대화 시작</button>
  </div>
</div>
  `
  characterInfoDiv.classList.add("character-popup")
  document.body.appendChild(characterInfoDiv)
  const thumbImg = document.querySelectorAll(".thumb")
  thumbImg[0].classList.add("active")
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
      })
  })
  showBlurOverlay()
})

function showBlurOverlay() {
  const overlay = document.createElement("div");
  overlay.classList.add("blur-overlay");
  overlay.id = "blur-overlay";
  document.body.appendChild(overlay);
}

$(document).on("click", function (event) {
  const $popup = $(".character-popup");

  if ($popup.length === 0) return;

  if (!$(event.target).closest(".character-popup").length && 
      !$(event.target).closest(".character-info-btn").length) {
    $popup.remove();
    removeBlurOverlay();
  }
});

// 오버레이 제거
function removeBlurOverlay() {
  const existing = document.getElementById("blur-overlay");
  if (existing) {
    existing.remove();
  }
}

function htmlToText(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

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
        span.classList.add("chat-main-span");
        span.classList.add(chunk.act ? "ai-action-chat" : "ai-conversation-chat");
        container.appendChild(span);
        break;
      }
  
      const span = document.createElement("span");
      span.innerText = content;
      span.classList.add("chat-main-span");
      span.classList.add(chunk.act ? "ai-action-chat" : "ai-conversation-chat");
      container.appendChild(span);
      currentLength = nextLength;
    }
  
    // 기존 텍스트 제거 후, 파싱된 결과 추가
    element.innerText = "";
    element.appendChild(container);
}

function popUpConvertText(text) {
  const matches = [...text.matchAll(/{{(.*?)}}/g)];
  let textConverted;
  const name = matches.map(m => m[1]);
      textConverted = text.replaceAll(`{{${name[0]}}}`, name[0])
  return textConverted
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