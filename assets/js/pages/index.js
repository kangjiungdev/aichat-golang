import { popup } from '../application';

const csrfToken = $('meta[name="csrf-token"]').attr("content");
const $homeCharacterDiv = $(".home-character-div")


$homeCharacterDiv.on("click", async function() {
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
      <div class="section"><h3>세계관</h3><p>${convertText(characterWorldView)}</p></div>

      <div class="section"><h3>캐릭터 소개</h3><p style="white-space: pre-wrap;">${convertText(characterInfo)}</p></div>
      <button id="popup-chat-button" data-character-id="${this.dataset.characterId}">대화 시작</button>
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
    popup.bindScrollEvent()
    showBlurOverlay()
})


$(document).on("click", "#popup-chat-button", async function (event) {
    const characterID = this.dataset.characterId;
    try {
        const req = await fetch("/chat/" + characterID, {
            method: "POST",
            headers: { "X-CSRF-Token": csrfToken }
        });
        if (req.ok && req.redirected) location.href = req.url;
    } catch (e) {
        console.error(e);
    }
});


$(document).on("click", function (event) {
    const $popup = $(".character-popup");
  
    if ($popup.length === 0) return;
  
    if (!$(event.target).closest(".character-popup").length && 
        !$(event.target).closest(".home-character-div").length) {
      $popup.remove();
      removeBlurOverlay();
    }
});



function convertText(text) {
    const matches = [...text.matchAll(/{{(.*?)}}/g)];
    let textConverted;
    const name = matches.map(m => m[1]);
    textConverted = htmlToText(text.replaceAll(`{{${name[0]}}}`, name[0]))
    return textConverted
}

function htmlToText(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
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