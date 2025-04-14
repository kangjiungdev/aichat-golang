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




// 스크롤바

let isScrolling = false;

$(document).on('click', '.usermade-scroll-btn.right-btn', function () {
  if (isScrolling) return;

  isScrolling = true;
  $('.character-usermade-div-list').animate({
    scrollLeft: $('.character-usermade-div-list').scrollLeft() + 261
  }, 300, function () {
    isScrolling = false;
  });
});

$(document).on('click', '.usermade-scroll-btn.left-btn', function () {
  if (isScrolling) return;

  isScrolling = true;
  $('.character-usermade-div-list').animate({
    scrollLeft: $('.character-usermade-div-list').scrollLeft() - 261
  }, 300, function () {
    isScrolling = false;
  });
});

bindUsermadeScrollEvent()

function bindUsermadeScrollEvent() {
  const $row = $(".character-usermade-div-list")[0];
  if (!$row) return;

  // 넘치지 않으면 버튼 제거
  if ($row.scrollWidth <= $row.clientWidth) {
    $(".usermade-scroll-btn").remove();
    return;
  }

  $(".character-usermade-div-list").off("scroll").on("scroll", function () {
    const el = this;
    const isAtRightEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    const $existingLeft = $(".usermade-scroll-btn.left-btn");

    if (isAtRightEnd) {
      $(".usermade-scroll-btn.right-btn").remove();
    } else if ($(".usermade-scroll-btn.right-btn").length === 0) {
      $(".character-usermade-wrapper").append(`<div class="usermade-scroll-btn right-btn">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </div>`);
    }

    if (el.scrollLeft > 0) {
      if ($existingLeft.length === 0) {
        $(".character-usermade-wrapper").prepend(`<div class="usermade-scroll-btn left-btn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </div>`);
      }
    } else if ($existingLeft.length > 0) {
      $existingLeft.remove();
    }
  });

  // 처음에 스크롤 상태 체크하여 버튼 표시
  $(".character-usermade-div-list").trigger("scroll");
}