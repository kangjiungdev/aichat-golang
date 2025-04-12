import $ from "jquery";
import "bootstrap/dist/js/bootstrap.bundle.js";
import "@fortawesome/fontawesome-free/js/all.js";
import "jquery-ujs/src/rails.js";

import * as popup from "./components/popup";

$("input, textarea").attr("autocomplete", "off");

$("input[type='password']").on("paste copy cut", function (event) {
  event.preventDefault();
});


// true는 타입 문제 없음, false는 타입 문제 있어서 수정
// return 값: [에러 존재 여부, 조건에 맞는 userInfos object]
export function userInfosValidationCheck(chatID) {
  const raw = localStorage.getItem("userInfos") || "{}";
  let userInfos = {};

  try {
    userInfos = JSON.parse(raw) || {};

    if (userInfos?.[chatID] && typeof userInfos[chatID] !== "object") {
      console.error(`userInfos["${chatID}"]의 타입이 object가 아닙니다. 해당 항목을 제거합니다.`);
      delete userInfos[chatID];
      localStorage.setItem("userInfos", JSON.stringify(userInfos));
    }

  } catch (e) {
    console.warn("userInfos의 JSON 파싱에 실패했습니다. 복구 가능한 항목을 찾아 다시 저장합니다.");

    // 일단 localStorage 초기화 (나중에 복구된 데이터로 덮어쓸 예정)
    localStorage.setItem("userInfos", JSON.stringify({}));

    const validEntries = [];

    // 중괄호 중첩 없는 안전한 entry만 추출
    const partialEntries = raw.match(/"[^"]+"\s*:\s*\{[^{}]*\}/g);

    partialEntries?.forEach((entry) => {
      try {
        JSON.parse(`{${entry}}`);
        validEntries.push(entry);
      } catch {
        const key = entry.match(/"([^"]+)"/)?.[1];
        console.warn(`chatID "${key || "unknown"}"의 값이 손상되어 복구 대상에서 제외됩니다.`);
      }
    });

    const fixedJson = `{${validEntries.join(",")}}`;

    try {
      userInfos = JSON.parse(fixedJson);
      localStorage.setItem("userInfos", JSON.stringify(userInfos));
      console.log("userInfos 데이터가 정상적으로 복구되었습니다.");

      // 복구 후에도 chatID의 타입 확인
      if (userInfos?.[chatID] && typeof userInfos[chatID] !== "object") {
        console.warn(`복구 후 userInfos["${chatID}"]의 타입이 여전히 유효하지 않아 제거했습니다.`);
        delete userInfos[chatID];
        localStorage.setItem("userInfos", JSON.stringify(userInfos));
      }

    } catch {
      userInfos = {}
      console.error("복구된 데이터도 JSON 파싱에 실패했습니다. userInfos를 초기화합니다.");
      localStorage.setItem("userInfos", JSON.stringify(userInfos));
      
    }
  }
  return userInfos;
}


export { popup };