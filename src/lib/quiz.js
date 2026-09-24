import riddleData from '../assets/riddles.json'

/** 题库（50 题，含 14 道“习俗文化”题） */
export const RIDDLES = riddleData.riddles

/** 习俗文化类题目的类型标识 */
export const CULTURE_TYPE = riddleData.meta?.cultureType || '习俗文化'

/** 每次答题抽取的题目数量 */
export const DRAW_COUNT = riddleData.meta?.drawCount || 3

/** 洗牌（Fisher-Yates），返回新数组，不修改原数组 */
export function shuffle(list) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * 随机抽题：保证至少包含 1 道“习俗文化”题
 * @param {number} count 抽题数量，默认 3
 * @returns {Array} 打乱顺序后的题目数组
 */
export function pickQuestions(count = DRAW_COUNT) {
  const culturePool = RIDDLES.filter((item) => item.type === CULTURE_TYPE)
  const otherPool = RIDDLES.filter((item) => item.type !== CULTURE_TYPE)

  const picked = []

  // 1. 必抽 1 道中秋习俗文化题
  if (culturePool.length > 0) {
    picked.push(culturePool[Math.floor(Math.random() * culturePool.length)])
  }

  // 2. 其余题目从剩余题库中随机抽取（优先其它类型，不足时用文化题补足）
  const rest = shuffle([...otherPool, ...culturePool.filter((item) => !picked.includes(item))])
  while (picked.length < count && rest.length > 0) {
    picked.push(rest.pop())
  }

  return shuffle(picked).slice(0, count)
}

/** 需要忽略的标点、空白等字符 */
const PUNCTUATION = /[\s,，。.、;；:：!！?？"'“”‘’()（）《》〈〉<>【】[\]{}—\-_…·~～/\\|]+/g
/** 常见口语化前缀，例如“答案是月饼” */
const ANSWER_PREFIX = /^(答案是|答案|谜底是|谜底|应该是|答|我认为是|是)/

/**
 * 答案归一化：去空格、去标点、去口语前缀、统一小写
 */
export function normalizeAnswer(text) {
  return String(text ?? '')
    .trim()
    .toLowerCase()
    .replace(PUNCTUATION, '')
    .replace(ANSWER_PREFIX, '')
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 65248))
}

/**
 * 判断单个题目是否答对：支持“标准答案命中 + 核心词命中”
 */
export function isAnswerCorrect(riddle, userAnswer) {
  const user = normalizeAnswer(userAnswer)
  if (!user) return false

  const accepted = (riddle?.answers || []).map(normalizeAnswer).filter(Boolean)
  const keywords = (riddle?.keywords || []).map(normalizeAnswer).filter(Boolean)

  // 1. 完全一致
  if (accepted.some((answer) => answer === user)) return true

  // 2. 包含关系（长度 < 2 的单字答案只允许完全一致，避免误判）
  if (
    accepted.some(
      (answer) => user.length >= 2 && answer.length >= 2 && (user.includes(answer) || answer.includes(user)),
    )
  ) {
    return true
  }

  // 3. 核心词命中
  if (keywords.some((keyword) => keyword.length >= 2 && user.includes(keyword))) return true

  return false
}

/**
 * 批量判分
 * @param {Array} questions 抽到的题目
 * @param {Array<string>} answers 与题目顺序一致的作答内容
 */
export function gradeAnswers(questions, answers) {
  const details = questions.map((riddle, index) => {
    const userAnswer = (answers[index] || '').trim()
    return {
      id: riddle.id,
      type: riddle.type,
      question: riddle.question,
      userAnswer,
      expected: (riddle.answers || [])[0] || '',
      correct: isAnswerCorrect(riddle, userAnswer),
      explain: riddle.explain || '',
    }
  })

  const score = details.filter((item) => item.correct).length

  return {
    score,
    total: details.length,
    accuracy: details.length ? Math.round((score / details.length) * 100) : 0,
    details,
  }
}
