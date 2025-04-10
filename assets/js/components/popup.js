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