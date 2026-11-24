# 동현촙™: 출처·이용 안내

동현촙은 1991년 게임보이 게임 「Choplifter II」(Beam Software)에서 **조작과 규칙**을 참고한 비상업적 취미 작품이다. 그 뿌리는 Dan Gorlin이 만들고 Broderbund가 1982년에 낸 「Choplifter」다. Choplifter와 Choplifter II의 이름과 권리는 각 권리자에게 있다. 동현촙은 이들과 관계가 없고 승인도 받지 않았다.

## 원작에서 참고한 것

- 조작 체계를 따랐다: 십자키를 누르고 있으면 속도가 붙고 떼면 미끄러지다 멎는 것, 중력이 없는 것, 좌우를 짧게 톡 눌러 왼쪽·정면·오른쪽으로 기수를 돌리는 것, 반대쪽을 누르면 뒤로 나는 것, A 기관포와 B 보조 무기, Select로 보조 무기 바꾸기, Start로 멈추기.
- 규칙의 틀을 따랐다: 정면을 볼 때 탄이 아래로 떨어지는 것, 정원 10명, 피해 막대, 막사 옆에 내려 한 명씩 태우고 기지에서 한 명씩 내리는 것, 구출 목표를 채우면 클리어인 것.
- 다르게 만들었다: 가로로 넓은 400×225칸 화면, 부딪히면 곧바로 추락하지 않고 피해를 입고 튕겨 나오는 것, 새로 지은 스테이지 일곱 장, 보조 무기 셋(폭탄·미사일·방패), 기지에 앉아 있는 동안 피해가 줄어드는 것, 동현랭으로 정하는 헬기 수·시작 스테이지·배경 색·정원, 전체 화면, 손가락 조작, 게임패드.
- 원작 게임의 그림·음악·효과음·글·스테이지 자료·코드는 하나도 쓰지 않았다. 원작 파일과 그 일부는 이 저장소에 없고, 원작 파일에서 그림이나 자료를 꺼내 쓰지도 않았다.
- 지형·배치·적의 움직임과 수치는 모두 동현촙이 정한 것이다.

## 동현촙이 새로 만든 것

- 게임 엔진(`src/game.js`), 스테이지 일곱 장(`src/level.js`), 그림(`src/art.js`), 화면(`src/render.js`), 입력(`src/input.js`), 출전·메뉴·저장(`src/app.js`), 동현랭 출전 규약과 예제(`src/examples.js`), 문서, 시험.
- 연필 선과 종이(`src/sketch.js`)는 [동현스](https://github.com/Raspberry-Kim/donghyun-lab21)의 연필 엔진을 가져다 썼다. 효과음과 팡파르 합성(`src/sfx.js`), 게임패드, 편집기·전체 화면 메뉴도 동현스의 방식을 따랐다.
- 그림 파일은 출전 준비 화면의 제목 한 장(`src/title.png`)이다. 그 밖의 헬기, 사람, 전차, 땅, 나무, 구름, 폭발, 종이의 결은 쪽이 열릴 때 코드가 연필 선을 그어 만든다.
- 출전 준비 화면의 제목 ‘동현촙’은 제작자 본인이 직접 쓴 글씨다. 이 글씨에 대한 권리는 MIT 코드 라이선스와 별개로 쓴 사람에게 있다. 코드를 가져다 쓸 때 이 글씨는 바꿔 쓰기를 권한다.
- 동현랭 실행기(`src/donghyun.js`)는 [동현랭 저장소](https://github.com/Raspberry-Kim/donghyun-lang)의 v1.55를 고치지 않고 썼다.

## 승리 팡파르와 꽃비

- 일곱 스테이지를 마친 엔딩 화면에서 팡파르가 울리고 꽃비가 내린다. 동현삼·동현항·동현스의 승리 연출을 옮긴 것이다.
- 선율은 에드워드 엘가의 「위풍당당 행진곡」 1번(Op. 39 No. 1, 1901년 작곡·출판)의 트리오 첫 줄이다. 악보는 공공 영역이다([IMSLP의 작품 면](https://imslp.org/wiki/Pomp_and_Circumstance_March_No.1,_Op.39_No.1_(Elgar,_Edward))).
- 녹음이나 연주 음원을 쓰지 않았다. 음높이와 박자를 `src/sfx.js`에 적고 브라우저에서 합성한다.
- 꽃비(`src/petals.js`)는 그림 파일 없이 작은 픽셀 무늬를 캔버스에 찍는다.

## 포동이

머리글의 포동이는 동현 시리즈의 말티즈다. 포동이의 이름과 모습에 대한 권리는 MIT 코드 라이선스와 별개로 만든 사람에게 있다. 코드를 가져다 쓸 때 이 그림과 이름은 바꿔 쓰기를 권한다.

## 참고한 자료

- Choplifter II — Wikipedia: https://en.wikipedia.org/wiki/Choplifter_II
- Choplifter — Wikipedia: https://en.wikipedia.org/wiki/Choplifter
- Choplifter II: Rescue & Survive — MobyGames: https://www.mobygames.com/game/17485/choplifter-ii-rescue-survive/
- Choplifter II 공략 — GameFAQs: https://gamefaqs.gamespot.com/gameboy/585666-choplifter-ii/faqs/61168

## 글꼴

검은고딕 Black Han Sans · Pretendard · 나눔고딕코딩 · 개구 Gaegu — SIL Open Font License 1.1 (`licenses/`). 게임 화면의 글은 손글씨 글꼴 Gaegu에서 쓰는 글자만 추려 담았다. 출전 준비 화면의 제목 ‘동현촙’은 글꼴이 아니라 제작자 본인이 직접 쓴 글씨이고, 이 글씨의 권리는 MIT와 별개로 쓴 사람에게 있다.

## 라이선스

동현촙 코드·문서: MIT (`LICENSE`). 출전 준비 화면의 제목 글씨(`src/title.png`)는 여기에 들지 않는다. 동현랭 실행기: MIT (`licenses/DONGHYUN-MIT.txt`).
