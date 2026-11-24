/* 동현촙 출전 예제. 동현랭이 출력한 정수를 차례로 읽는다: 첫 정수 = 헬기 수(1~9, 필수)
   · 둘째 정수 = 시작 스테이지(1~7, 선택) · 셋째 정수 = 배경 색(1 미색 · 2 스케치북 흰색, 선택) · 넷째 정수 = 정원(4~16, 선택). */
function expression(n){
  if(n===0)return '도옹ㅠ';
  if(n<0)return 'ㅠ '+expression(-n);
  if(n<=10)return '도'+'오'.repeat(n-1)+'옹';
  for(let a=10;a>=2;a--)if(n%a===0)return expression(a)+' '+expression(n/a);
  return '도'+'오'.repeat(n-1)+'옹';
}
const output=(...ns)=>ns.map(n=>'뿡뿡 '+expression(n)+'~뿡뿡뿡').join('~');
const block=(label,...ns)=>'ㅋㅋ '+label+'\n'+output(...ns);
const wrap=a=>['나는 동현이냐?',...a,'동현이구나'].join('\n');
const examples=[
 {id:'basic',title:'01 · 기본 · 헬기 3',note:'첫 정수 3이 헬기 수다. 나머지는 기본값이라 스테이지 1부터, 종이는 미색, 정원은 10명이다. 처음이라면 이 예제로 기수 돌리기와 착륙을 익히자.',
  code:wrap([block('헬기 3',3)])},
 {id:'easy',title:'02 · 넉넉하게 · 헬기 6',note:'헬기가 여섯이다. 추락해도 기지에서 새 헬기가 나선다. 탄 채로 추락하면 타고 있던 사람은 잃는다.',
  code:wrap([block('헬기 6',6)])},
 {id:'white',title:'03 · 스케치북 흰색 종이',note:'셋째 정수 2는 스케치북 수준의 흰색 종이다. 셋째를 쓰려면 앞의 둘도 차례로 써야 한다. 종이 색이 바뀌면 그림을 모두 새로 그리느라 잠깐 기다린다.',
  code:wrap([block('헬기 3',3),block('스테이지 1',1),block('배경 2 · 스케치북 흰색',2)])},
 {id:'stage2',title:'04 · 스테이지 2 · 종유 동굴부터',note:'둘째 정수가 시작 스테이지다. 2이면 둘째 장 「종유 동굴」부터 난다. 천장이 낮으니 위아래를 살살 다루자.',
  code:wrap([block('헬기 4',4),block('스테이지 2',2)])},
 {id:'sea',title:'05 · 스테이지 3 · 먹구름 바다',note:'섬과 배 갑판에만 내려앉을 수 있다. 물에 닿으면 데미지가 쌓인다.',
  code:wrap([block('헬기 4',4),block('스테이지 3',3)])},
 {id:'small',title:'06 · 작은 헬기 · 정원 5',note:'넷째 정수가 정원이다. 5명씩만 탈 수 있어 더 여러 번 오가야 한다. 넷째를 쓰려면 앞의 셋도 차례로 써야 한다.',
  code:wrap([block('헬기 3',3),block('스테이지 1',1),block('배경 1 · 미색',1),block('정원 5',5)])},
 {id:'big',title:'07 · 큰 헬기 · 정원 16',note:'열여섯 명이 한 번에 탄다. 오가는 횟수는 줄지만, 탄 채로 추락하면 잃는 사람도 많다.',
  code:wrap([block('헬기 3',3),block('스테이지 1',1),block('배경 1 · 미색',1),block('정원 16',16)])},
 {id:'last',title:'08 · 마지막 스테이지 연습 · 헬기 9',note:'가장 넉넉한 헬기 수로 스테이지 7 「백지 요새」를 연습한다. 스무 사람 가운데 열여섯을 데려와야 한다.',
  code:wrap([block('헬기 9',9),block('스테이지 7',7)])},
 {id:'one',title:'09 · 헬기 하나',note:'헬기 1. 한 번 추락하면 끝난다.',
  code:wrap([block('헬기 1',1)])}
];
