import { LOVE_KEYWORDS } from '@/detectors/keywordDetector.js'

export function analyzeFrequency(conversation) {
  const messages = conversation.messages
  if (!messages || messages.length === 0) {
    return {
      totalMessages: 0,
      sentMessages: 0,
      receivedMessages: 0,
      msgPerDay: 0,
      activeDays: 0,
      totalDays: 0,
      lateNightMsgs: 0,
      morningMsgs: 0,
      quickReplies: 0,
      quickReplyRate: 0
    }
  }

  const totalMessages = messages.length
  const sentMessages = messages.filter(m => m.isSent).length
  const receivedMessages = messages.filter(m => m.isReceived).length

  const startTime = messages[0].date
  const endTime = messages[messages.length - 1].date
  const totalDays = Math.max(1, (endTime - startTime) / 86400000)
  const msgPerDay = totalMessages / totalDays

  const activeDaysSet = new Set()
  let lateNightMsgs = 0
  let morningMsgs = 0
  let quickReplies = 0

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    const day = new Date(msg.date).toDateString()
    activeDaysSet.add(day)

    const hour = new Date(msg.date).getHours()
    if (hour >= 22 || hour < 2) lateNightMsgs++
    if (hour >= 6 && hour < 9) morningMsgs++

    if (i > 0) {
      const diff = msg.date - messages[i - 1].date
      if (diff < 300000 && msg.isSent !== messages[i - 1].isSent) {
        quickReplies++
      }
    }
  }

  const activeDays = activeDaysSet.size
  const quickReplyRate = totalMessages > 1 ? quickReplies / (totalMessages - 1) : 0

  return {
    totalMessages,
    sentMessages,
    receivedMessages,
    msgPerDay,
    activeDays,
    totalDays,
    lateNightMsgs,
    morningMsgs,
    quickReplies,
    quickReplyRate
  }
}

export function analyzeKeywords(conversation) {
  const messages = conversation.messages
  const result = {}
  let totalKeywordHits = 0

  for (const kw of LOVE_KEYWORDS) {
    result[kw.tag] = {
      label: kw.label,
      count: 0,
      score: 0
    }
  }

  for (const msg of messages) {
    if (!msg.body) continue

    for (const kw of LOVE_KEYWORDS) {
      const matches = msg.body.match(kw.pattern)
      if (matches) {
        const count = matches.length
        result[kw.tag].count += count
        result[kw.tag].score += kw.score * count
        totalKeywordHits += count
      }
    }
  }

  const topKeywords = Object.entries(result)
    .filter(([, v]) => v.count > 0)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([key, value]) => ({ key, ...value }))

  return {
    keywords: result,
    totalKeywordHits,
    topKeywords,
    keywordDiversity: topKeywords.length
  }
}

export function analyzeReplySpeed(conversation) {
  const messages = conversation.messages
  if (messages.length < 2) {
    return {
      avgReplyTime: 0,
      medianReplyTime: 0,
      minReplyTime: 0,
      maxReplyTime: 0,
      quickReplyCount: 0,
      quickReplyRatio: 0,
      replyTimes: []
    }
  }

  const replyTimes = []

  for (let i = 1; i < messages.length; i++) {
    if (messages[i].isSent !== messages[i - 1].isSent) {
      const diff = messages[i].date - messages[i - 1].date
      replyTimes.push(diff)
    }
  }

  if (replyTimes.length === 0) {
    return {
      avgReplyTime: 0,
      medianReplyTime: 0,
      minReplyTime: 0,
      maxReplyTime: 0,
      quickReplyCount: 0,
      quickReplyRatio: 0,
      replyTimes: []
    }
  }

  const sortedTimes = [...replyTimes].sort((a, b) => a - b)
  const avgReplyTime = replyTimes.reduce((a, b) => a + b, 0) / replyTimes.length
  const medianReplyTime = sortedTimes[Math.floor(sortedTimes.length / 2)]
  const minReplyTime = sortedTimes[0]
  const maxReplyTime = sortedTimes[sortedTimes.length - 1]

  const quickReplyCount = replyTimes.filter(t => t < 300000).length
  const quickReplyRatio = quickReplyCount / replyTimes.length

  return {
    avgReplyTime,
    medianReplyTime,
    minReplyTime,
    maxReplyTime,
    quickReplyCount,
    quickReplyRatio,
    replyTimes
  }
}

export function analyzeLoveIndex(conversation) {
  const messages = conversation.messages
  if (messages.length < 2) {
    return {
      totalScore: 0,
      interactionScore: 0,
      keywordScore: 0,
      frequencyScore: 0,
      tags: [],
      level: '初识',
      description: '你们的故事才刚刚开始...'
    }
  }

  let interactionScore = 0
  let keywordScore = 0
  let frequencyScore = 0

  let backAndForth = 0
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].isSent !== messages[i - 1].isSent) {
      backAndForth++
    }
  }
  const interactionRate = backAndForth / messages.length
  if (interactionRate >= 0.7) interactionScore += 25
  else if (interactionRate >= 0.5) interactionScore += 15
  else if (interactionRate >= 0.3) interactionScore += 5

  const keywordAnalysis = analyzeKeywords(conversation)
  keywordScore = Math.min(100, keywordAnalysis.totalKeywordHits * 3)

  const freqAnalysis = analyzeFrequency(conversation)
  if (freqAnalysis.msgPerDay >= 10) frequencyScore += 30
  else if (freqAnalysis.msgPerDay >= 5) frequencyScore += 20
  else if (freqAnalysis.msgPerDay >= 2) frequencyScore += 10
  else if (freqAnalysis.msgPerDay >= 1) frequencyScore += 5

  if (freqAnalysis.lateNightMsgs > 5) frequencyScore += 10
  if (freqAnalysis.quickReplyRate > 0.3) frequencyScore += 15

  const totalScore = interactionScore + keywordScore + frequencyScore

  let level = '初识'
  let description = '你们的故事才刚刚开始...'
  const tags = []

  if (totalScore >= 200) {
    level = '灵魂伴侣'
    description = '你们已经是彼此生命中最重要的人了'
    tags.push('灵魂伴侣')
  } else if (totalScore >= 150) {
    level = '热恋期'
    description = '甜蜜的恋爱正在进行时~'
    tags.push('热恋中')
  } else if (totalScore >= 100) {
    level = '暧昧期'
    description = '空气中都弥漫着甜甜的味道'
    tags.push('有点甜')
  } else if (totalScore >= 50) {
    level = '好感期'
    description = '有点心动的感觉呢'
    tags.push('有好感')
  }

  if (interactionRate >= 0.5) tags.push('双向奔赴')
  if (keywordAnalysis.keywordDiversity >= 4) tags.push('情感丰富')
  if (freqAnalysis.msgPerDay >= 5) tags.push('高频互动')
  if (freqAnalysis.lateNightMsgs > 3) tags.push('深夜相伴')

  return {
    totalScore,
    interactionScore,
    keywordScore,
    frequencyScore,
    tags,
    level,
    description
  }
}

export function compareConversations(convA, convB) {
  const freqA = analyzeFrequency(convA)
  const freqB = analyzeFrequency(convB)
  const kwA = analyzeKeywords(convA)
  const kwB = analyzeKeywords(convB)
  const replyA = analyzeReplySpeed(convA)
  const replyB = analyzeReplySpeed(convB)
  const loveA = analyzeLoveIndex(convA)
  const loveB = analyzeLoveIndex(convB)

  const winner = {
    totalMessages: freqA.totalMessages > freqB.totalMessages ? 'A' : (freqB.totalMessages > freqA.totalMessages ? 'B' : 'tie'),
    msgPerDay: freqA.msgPerDay > freqB.msgPerDay ? 'A' : (freqB.msgPerDay > freqA.msgPerDay ? 'B' : 'tie'),
    activeDays: freqA.activeDays > freqB.activeDays ? 'A' : (freqB.activeDays > freqA.activeDays ? 'B' : 'tie'),
    keywordHits: kwA.totalKeywordHits > kwB.totalKeywordHits ? 'A' : (kwB.totalKeywordHits > kwA.totalKeywordHits ? 'B' : 'tie'),
    keywordDiversity: kwA.keywordDiversity > kwB.keywordDiversity ? 'A' : (kwB.keywordDiversity > kwA.keywordDiversity ? 'B' : 'tie'),
    quickReply: replyA.quickReplyRatio > replyB.quickReplyRatio ? 'A' : (replyB.quickReplyRatio > replyA.quickReplyRatio ? 'B' : 'tie'),
    avgReplyTime: replyA.avgReplyTime < replyB.avgReplyTime ? 'A' : (replyB.avgReplyTime < replyA.avgReplyTime ? 'B' : 'tie'),
    loveIndex: loveA.totalScore > loveB.totalScore ? 'A' : (loveB.totalScore > loveA.totalScore ? 'B' : 'tie')
  }

  let winsA = 0
  let winsB = 0
  Object.values(winner).forEach(w => {
    if (w === 'A') winsA++
    if (w === 'B') winsB++
  })

  let overallWinner = 'tie'
  let overallTitle = '势均力敌'
  let overallDesc = '两位选手各有千秋，难分伯仲~'

  if (winsA > winsB) {
    overallWinner = 'A'
    overallTitle = 'A 方胜出'
    overallDesc = '在综合对比中，A 方的关系更加亲密'
  } else if (winsB > winsA) {
    overallWinner = 'B'
    overallTitle = 'B 方胜出'
    overallDesc = '在综合对比中，B 方的关系更加亲密'
  }

  return {
    frequency: { A: freqA, B: freqB, winner: winner.totalMessages },
    keywords: { A: kwA, B: kwB, winner: winner.keywordHits },
    replySpeed: { A: replyA, B: replyB, winner: winner.quickReply },
    loveIndex: { A: loveA, B: loveB, winner: winner.loveIndex },
    winner,
    overall: {
      winner: overallWinner,
      title: overallTitle,
      description: overallDesc,
      winsA,
      winsB
    }
  }
}

export function formatDuration(ms) {
  if (ms < 1000) return '0秒'
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}秒`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时${minutes % 60}分`
  const days = Math.floor(hours / 24)
  return `${days}天${hours % 24}小时`
}
