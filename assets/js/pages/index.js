import { popup } from '../application';

const csrfToken = $('meta[name="csrf-token"]').attr("content");
const $homeCharacterDiv = $(".home-character-div")


$homeCharacterDiv.on("click", async function() {
  popup.createPopUp(csrfToken, this.dataset.characterId, null, null, null, "home")
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