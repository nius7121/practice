import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './GuidePage.css'

const STEPS = [
  {
    who: '선생님',
    title: '방 만들기',
    body: '방 이름, 주장 수, 학생당 코인 개수, 팀별 최소·최대 인원을 정하고 방을 엽니다. 5자리 입장 코드가 발급돼요.',
    preview: (
      <div className="gp-mock gp-mock-form">
        <div className="gp-mock-field" />
        <div className="gp-mock-row">
          <div className="gp-mock-field short" />
          <div className="gp-mock-field short" />
        </div>
        <div className="gp-mock-btn">방 만들고 입장 코드 받기</div>
      </div>
    ),
  },
  {
    who: '선생님',
    title: '입장 코드 공유 · 주장 지정',
    body: '학생들이 코드로 들어오면 대기실 목록에 실시간으로 쌓입니다. 그중 원하는 학생들을 체크해서 주장으로 지정하세요.',
    preview: (
      <div className="gp-mock">
        <div className="gp-mock-code">7K4RP</div>
        <div className="gp-mock-list">
          <div className="gp-mock-listrow">
            김도윤 <span className="gp-mock-tag">주장</span>
          </div>
          <div className="gp-mock-listrow">이서연</div>
          <div className="gp-mock-listrow">박지호</div>
        </div>
      </div>
    ),
  },
  {
    who: '학생',
    title: '코드로 입장',
    body: '학생은 홈에서 "학생이에요"를 눌러 입장 코드와 이름만 입력하면 바로 대기실에 들어갑니다.',
    preview: (
      <div className="gp-mock gp-mock-form">
        <div className="gp-mock-field center">7K4RP</div>
        <div className="gp-mock-btn">입장하기</div>
      </div>
    ),
  },
  {
    who: '학생',
    title: '코인 배분하기',
    body: '주장이 아닌 학생은 받은 코인을 원하는 주장들에게 자유롭게 나눠 겁니다. 합계가 정확히 맞아야 제출할 수 있어요.',
    preview: (
      <div className="gp-mock">
        <div className="gp-mock-coinpill">2개 남음 (총 5개)</div>
        <div className="gp-mock-listrow">
          김도윤 팀 <span className="gp-mock-stepper">− 3 +</span>
        </div>
        <div className="gp-mock-listrow">
          최민서 팀 <span className="gp-mock-stepper">− 2 +</span>
        </div>
      </div>
    ),
  },
  {
    who: '선생님',
    title: '제출 마감 → 결과 계산',
    body: '제출 현황(제출 완료/대기 중)만 보이고 실제로 건 코인 액수는 아무에게도 보이지 않습니다. 전원 제출을 확인했다면 마감하세요.',
    preview: (
      <div className="gp-mock">
        <div className="gp-mock-pill">제출 3 / 4명</div>
        <div className="gp-mock-btn">제출 마감하고 결과 계산하기 🎲</div>
      </div>
    ),
  },
  {
    who: '다같이',
    title: '실시간 발표',
    body: '가장 높은 코인을 건 학생부터 한 명씩 발표됩니다. 동점이면 룰렛 추첨 연출과 효과음으로 긴장감 있게 결정돼요. 선생님 화면과 학생 화면에 동시에 표시됩니다.',
    preview: (
      <div className="gp-mock gp-mock-spotlight">
        <div className="gp-mock-spotcard">
          <div>이서연</div>
          <div className="gp-mock-arrow">→</div>
          <div className="gp-mock-spotteam">김도윤 팀</div>
        </div>
      </div>
    ),
  },
  {
    who: '선생님',
    title: '최종 확인 및 수정',
    body: '발표가 끝나면 팀별 명단이 그대로 남습니다. 피치 못할 사정이 있으면 드롭다운으로 학생을 다른 팀으로 옮길 수 있고, 팀 이름도 바꿀 수 있어요.',
    preview: (
      <div className="gp-mock gp-mock-result">
        <div className="gp-mock-teamcard">
          <strong>김도윤 팀</strong>
          <div>👑 김도윤</div>
          <div>이서연</div>
        </div>
        <div className="gp-mock-teamcard">
          <strong>최민서 팀</strong>
          <div>👑 최민서</div>
          <div>박지호</div>
        </div>
      </div>
    ),
  },
]

export default function GuidePage() {
  const navigate = useNavigate()

  function handleClose() {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="page wide">
      <div className="guide-page-bar">
        <button type="button" className="icon-btn" onClick={handleClose} aria-label="사용법 닫기">
          ✕
        </button>
        <div>
          <h1 className="page-title">사용 방법</h1>
          <p className="page-subtitle">
            방 만들기부터 발표까지 실제 화면 구성을 그대로 축소해서 단계별로 모았습니다.
          </p>
        </div>
      </div>

      <div className="guide-timeline">
        {STEPS.map((step, i) => (
          <div className="guide-step" key={step.title}>
            <div className="guide-step-num">{i + 1}</div>
            <div className="guide-step-body">
              <div className="guide-step-who">{step.who}</div>
              <div className="guide-step-title">{step.title}</div>
              <p className="guide-step-text">{step.body}</p>
              {step.preview}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
