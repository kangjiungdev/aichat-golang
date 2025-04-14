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

let scrollInterval = null;
let scrollVelocity = 20; // 스크롤 속도(px/frame)
let scrollDirection = 1;

// 스크롤 시작
function startScrolling(direction) {
  stopScrolling(); // 중복 방지
  scrollDirection = direction;
  scrollInterval = setInterval(() => {
    $(".character-usermade-div-list").scrollLeft((i, current) => current + scrollVelocity * scrollDirection);
  }, 15); // 약 60fps
}

// 스크롤 정지
function stopScrolling() {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
}

// 버튼 이벤트 바인딩
$(document).on("mousedown", ".usermade-scroll-btn", function () {
  if ($(this).hasClass("right-btn")) {
    startScrolling(1);
  } else if ($(this).hasClass("left-btn")) {
    startScrolling(-1);
  }
});

$(document).on("mouseup mouseleave", function () {
  stopScrolling();
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
      stopScrolling();
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
      stopScrolling();
      $existingLeft.remove();
    }
  });

  // 처음에 스크롤 상태 체크하여 버튼 표시
  $(".character-usermade-div-list").trigger("scroll");
}