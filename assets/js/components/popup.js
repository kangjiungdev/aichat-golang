import { userInfosValidationCheck } from "../application"

export async function createPopUp(csrfToken, characterID, chatID, userNameInput, userInfoInput, pageName) {
  let res
      try {
        const req = await fetch("/get-character-data", {
          method:"POST",
          headers: {"Content-Type": "text/plain", "X-CSRF-Token":csrfToken},
          body: characterID
        })
        res = await req.json()
      } catch (e) {
        console.error(e)
        return
      }
      const creatorUserID = res["creator_id"]
      const characterName = res["character_name"]
      const characterInfo = res["character_info"]
      const characterOnelineInfo = res["character_oneline_info"]
      const characterWorldView = res["world_view"]
      const imgsRoute = res["character_assets"]
      const chatNumber = res["chat_number"]
      const characterUserNumber = res["character_user_number"]
  
      const characterInfoDiv = document.createElement("div")
      characterInfoDiv.innerHTML = `
      <div class="popup-container ${pageName === "chat-popup-container" ? `` : ""}">
      <!-- 좌측: 캐릭터 이미지 및 정보 -->
      <div class="popup-left">
        <div class="character-header">
        <h3 class="popup-character-name">${htmlToText(characterName)}</h3>
          <img src="/${imgsRoute[0]}" class="character-image" alt="캐릭터 이미지" style="width: 351.297px; height: 526.938px; object-fit: cover;">
          <div class="character-meta">
            <a href="/user/${creatorUserID}" class="creator">@${creatorUserID}</a>
            <div class="character-figure">
              <span class="views"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"></path></svg>${chatNumber}</span>
              <span class="likes"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"></path></svg>${characterUserNumber}</span>
            </div>
          </div>
        </div>
        
        <!-- 썸네일 리스트 -->
        <div class="thumbnail-wrapper">
          <div class="thumbnail-row">
            ${imgsRoute.map(element => {
              return `<img src="/${element}" class="thumb">`;
             }).join('')}
          </div>
          <div class="thumb-scroll-btn right-btn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </div>
        </div>
  
  
        <div class="popup-oneline-info">${htmlToText(characterOnelineInfo)}</div>
      </div>
  
      <!-- 우측: 세계관 + 캐릭터 소개 -->
      <div class="popup-right">
        <div class="section"><h3>세계관</h3><p>${htmlToText(convertText(chatID, characterWorldView))}</p></div>
  
        <div class="section"><h3>캐릭터 소개</h3><p style="white-space: pre-wrap;">${htmlToText(convertText(chatID, characterInfo))}</p></div>
        ${
          pageName === "home" ? `<button id="popup-chat-button" data-character-id="${characterID}">대화 시작</button>`:
          pageName === "chat-main" ? `<button id="popup-chat-button" onclick='location.href="/chat/${chatID}"'>대화 시작</button>`:
          ``
        }
      </div>
    </div>
    
      ${pageName === "chat" ? `
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
  ` : ''}
      `
      characterInfoDiv.classList.add("character-popup")
      document.body.appendChild(characterInfoDiv)

      const thumbImg = document.querySelectorAll(".thumb")

      if(!document.querySelector(".active")) {
        const [validation, userInfos] = userInfosValidationCheck(chatID)
        if ((pageName === "chat" || pageName === "chat-main") && validation) {
          thumbImg.forEach(element => {
              if(element.src === (userInfos[chatID]?.characterImg || thumbImg[0].src)) {
                element.classList.add("active")
              }
          })
        } else {
          thumbImg[0].classList.add("active")
        }
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
              const [validation, userInfos] = userInfosValidationCheck(chatID)
              if ((pageName === "chat" || pageName === "chat-main")) {
                $(".chat-character-image, .chat-img").attr("src", this.src)
                if (validation && userInfos[chatID]?.characterImg) {
                  userInfos[chatID].characterImg = this.src
                } else {
                  userInfos[chatID] = {
                    characterImg: this.src
                  }
                }
                localStorage.setItem("userInfos", JSON.stringify(userInfos));
              }
          })
      })

      if (pageName === "chat") {
        document.getElementById("popup-input-user-name").addEventListener("change", function(){
          userNameInput.value = this.value
          userNameInput.dispatchEvent(new Event("change"));
        })
        document.getElementById("popup-input-user-info").addEventListener("change", function(){
          userInfoInput.value = this.value
          userInfoInput.dispatchEvent(new Event("change"));
        })
      }

      bindScrollEvent()
}

function htmlToText(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function convertText(chatID, text) {
  const userInfos = JSON.parse(localStorage.getItem("userInfos")) || {}
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



//스크롤 바


let scrollInterval = null;
let scrollVelocity = 5;
let scrollDirection = 1;
let lastScrollTime = 0;
let isInertialScrolling = false;

// 스크롤 시작
function startScrolling(direction) {
  stopScrolling(); // 혹시 남은 거 있으면 초기화

  scrollVelocity = 5;
  scrollDirection = direction;
  isInertialScrolling = false;

  scrollInterval = setInterval(() => {
    $(".thumbnail-row").scrollLeft((i, current) => current + scrollVelocity * scrollDirection);
    lastScrollTime = Date.now(); // 마지막 스크롤 시간 기록
  }, 16); // 60fps
}

// 스크롤 정지 + 관성 효과
function stopScrolling() {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }

  if (isInertialScrolling) return;
  isInertialScrolling = true;

  let velocity = scrollVelocity;
  const friction = 0.95;
  const minVelocity = 0.5;

  function inertialScroll() {
    if (Math.abs(velocity) > minVelocity) {
      $(".thumbnail-row").scrollLeft((i, current) => current + velocity * scrollDirection);
      velocity *= friction;
      requestAnimationFrame(inertialScroll);
    } else {
      isInertialScrolling = false;
    }
  }

  // 바로 멈춘 경우엔 관성 생략
  if (Date.now() - lastScrollTime < 100) {
    requestAnimationFrame(inertialScroll);
  } else {
    isInertialScrolling = false;
  }
}

// 버튼 누르면 스크롤 시작
$(document).on("mousedown", ".thumb-scroll-btn", function () {
  if ($(this).hasClass("right-btn")) {
    startScrolling(1);
  } else if ($(this).hasClass("left-btn")) {
    startScrolling(-1);
  }
});

// 마우스를 떼거나 벗어나면 정지 + 관성
$(document).on("mouseup mouseleave", function () {
  stopScrolling();
});

export function bindScrollEvent() {
    $(".thumbnail-row").off('scroll').on('scroll', function () {
      const el = this;
      const isAtRightEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      const $existingLeft = $(".thumb-scroll-btn.left-btn");
      if (isAtRightEnd) {
        stopScrolling(); // ← 스크롤 중이었으면 정지
        $(".thumb-scroll-btn.right-btn").remove();
      } else if ($(".thumb-scroll-btn.right-btn").length === 0) {
        $(".thumbnail-wrapper").append(`<div class="thumb-scroll-btn right-btn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </div>`);
      }
      if (el.scrollLeft > 0) {
        if ($existingLeft.length === 0) {
          $(".thumbnail-wrapper").prepend(`<div class="thumb-scroll-btn left-btn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </div>`);
        }
      } else if ($existingLeft.length > 0) {
        stopScrolling(); // ← 왼쪽 버튼 사라질 때도 정지
        $existingLeft.remove();
      }
    });
}