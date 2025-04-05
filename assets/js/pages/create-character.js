const $form = $("#create-character-form");
const $name = $("#character-name");
const $info = $("#character-info");
const $oneline = $("#character-oneline-info");
const $gender = $("input[name='character-gender']");
const $assets = $("#character-assets");
const $fileName = $("#file-name");
const $uploadBtn = $(".upload-button");

  // 폼 제출
$form.on("submit", async function (e) {
  e.preventDefault();

  const genderChecked = $gender.filter(":checked").val();
  if (
    !$name.val().trim() ||
    !$info.val().trim() ||
    !$oneline.val().trim() ||
    !$assets[0].files.length ||
    !genderChecked
  ) return;

  const formData = new FormData(this);
  const res = await fetch("/create-character", { method: "POST", body: formData });
  if (res.redirected) {
    window.location.href = res.url;
  }
});

  // 성별 선택
$(".gender-tab input[type='radio']").on("change", function () {
  $(".gender-tab").removeClass("gender-checked");
  $(this).closest(".gender-tab").addClass("gender-checked");
});

  // 파일 선택
$assets.on("change", function () {
  const files = Array.from(this.files);
  const maxChar = 60;

  if (!files.length) {
    $fileName.text("선택된 파일 없음");
    return;
  }

  let names = files.map(f => f.name).join(", ");
  if (names.length > maxChar) {
    names = names.slice(0, maxChar - 10) + "...";
  }

  $fileName.text(`${names} (총 ${files.length}개)`);
});

// 파일명 클릭 시 input 열기
$fileName.on("click", () => $assets.click());

// 버튼 hover 색상 설정
const setBtnColor = (el, event, color) => {
  el.on(event, () => $uploadBtn.css("background-color", color));
};

setBtnColor($uploadBtn, "mouseover", "#e6ad00");
setBtnColor($fileName, "mouseover", "#e6ad00");
setBtnColor($uploadBtn, "mouseout", "#FFC200");
setBtnColor($fileName, "mouseout", "#FFC200");