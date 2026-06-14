<template>
  <div class="compare-page">
    <div class="page-header">
      <h2>⚖️ 关系对比</h2>
      <p class="subtitle">选择两位联系人，全方位对比你们的关系亲密度</p>
    </div>

    <div v-if="store.loveLetters.length === 0" class="empty-state">
      <div class="icon">💌</div>
      <h3>还没有数据哦</h3>
      <p>先去首页上传短信备份，或者加载演示数据看看效果吧</p>
      <router-link to="/" class="btn btn-primary">去上传</router-link>
    </div>

    <div v-else>
      <div v-if="hasPersistedState" class="persist-notice card">
        <span class="notice-icon">💾</span>
        <span class="notice-text">已恢复上次的对比结果，您可以继续查看或重新选择</span>
        <button class="btn btn-secondary btn-small" @click="resetCompare">🔄 重新开始</button>
      </div>

      <div class="selector-section card">
        <div class="section-header">
          <div>
            <h3>🎯 选择对比对象</h3>
            <p class="tip">从下方列表中选择两位联系人进行对比</p>
          </div>
          <button
            v-if="hasPersistedState"
            class="btn btn-secondary btn-small"
            @click="resetCompare"
          >
            清空选择
          </button>
        </div>

        <div class="selector-grid">
          <div class="selector-col">
            <div class="selector-label">
              <span class="badge badge-a">A</span>
              <span>{{ selectedA ? selectedA.conversation.name : '请选择' }}</span>
            </div>
            <div class="contact-list">
              <div
                v-for="item in store.loveLetters"
                :key="item.conversation.id"
                class="contact-item"
                :class="{ selected: selectedA?.conversation.id === item.conversation.id, disabled: selectedB?.conversation.id === item.conversation.id }"
                @click="selectA(item)"
              >
                <div class="contact-avatar">{{ getAvatar(item.conversation.name) }}</div>
                <div class="contact-info">
                  <div class="contact-name">{{ item.conversation.name }}</div>
                  <div class="contact-meta">
                    <span>📝 {{ item.conversation.messages.length }}条</span>
                    <span>❤️ {{ item.loveScore }}分</span>
                  </div>
                </div>
                <div v-if="selectedA?.conversation.id === item.conversation.id" class="check-icon">✓</div>
              </div>
            </div>
          </div>

          <div class="vs-divider">
            <span class="vs-text">VS</span>
          </div>

          <div class="selector-col">
            <div class="selector-label">
              <span class="badge badge-b">B</span>
              <span>{{ selectedB ? selectedB.conversation.name : '请选择' }}</span>
            </div>
            <div class="contact-list">
              <div
                v-for="item in store.loveLetters"
                :key="item.conversation.id"
                class="contact-item"
                :class="{ selected: selectedB?.conversation.id === item.conversation.id, disabled: selectedA?.conversation.id === item.conversation.id }"
                @click="selectB(item)"
              >
                <div class="contact-avatar">{{ getAvatar(item.conversation.name) }}</div>
                <div class="contact-info">
                  <div class="contact-name">{{ item.conversation.name }}</div>
                  <div class="contact-meta">
                    <span>📝 {{ item.conversation.messages.length }}条</span>
                    <span>❤️ {{ item.loveScore }}分</span>
                  </div>
                </div>
                <div v-if="selectedB?.conversation.id === item.conversation.id" class="check-icon">✓</div>
              </div>
            </div>
          </div>
        </div>

        <div class="compare-actions">
          <button
            class="btn btn-primary btn-large"
            :disabled="!canCompare"
            @click="doCompare"
          >
            🔍 开始对比
          </button>
        </div>
      </div>

      <div v-if="compareResult" class="results-section">
        <div class="result-header card">
          <div class="result-title">
            <h3>📊 对比报告</h3>
            <p class="result-desc">{{ compareResult.overall.description }}</p>
          </div>
          <div class="overall-score">
            <div class="score-item" :class="{ winner: compareResult.overall.winner === 'A' }">
              <div class="score-label">A 方胜项</div>
              <div class="score-value">{{ compareResult.overall.winsA }}</div>
            </div>
            <div class="score-divider">:</div>
            <div class="score-item" :class="{ winner: compareResult.overall.winner === 'B' }">
              <div class="score-label">B 方胜项</div>
              <div class="score-value">{{ compareResult.overall.winsB }}</div>
            </div>
          </div>
        </div>

        <div class="compare-sections">
          <div class="compare-card card">
            <div class="card-header">
              <span class="card-icon">📈</span>
              <h4>互动频率</h4>
              <span class="winner-badge" :class="'winner-' + compareResult.frequency.winner">
                {{ compareResult.frequency.winner === 'tie' ? '平局' : compareResult.frequency.winner + ' 胜' }}
              </span>
            </div>

            <div class="compare-bars">
              <div class="bar-item">
                <div class="bar-label">消息总数</div>
                <div class="bar-row">
                  <div class="bar-side bar-left">
                    <div class="bar-fill fill-a" :style="{ width: getBarWidth(compareResult.frequency.A.totalMessages, compareResult.frequency.B.totalMessages, 'A') }"></div>
                    <span class="bar-value">{{ compareResult.frequency.A.totalMessages }}</span>
                  </div>
                  <div class="bar-side bar-right">
                    <div class="bar-fill fill-b" :style="{ width: getBarWidth(compareResult.frequency.A.totalMessages, compareResult.frequency.B.totalMessages, 'B') }"></div>
                    <span class="bar-value">{{ compareResult.frequency.B.totalMessages }}</span>
                  </div>
                </div>
              </div>

              <div class="bar-item">
                <div class="bar-label">日均消息</div>
                <div class="bar-row">
                  <div class="bar-side bar-left">
                    <div class="bar-fill fill-a" :style="{ width: getBarWidth(compareResult.frequency.A.msgPerDay, compareResult.frequency.B.msgPerDay, 'A') }"></div>
                    <span class="bar-value">{{ compareResult.frequency.A.msgPerDay.toFixed(1) }}/天</span>
                  </div>
                  <div class="bar-side bar-right">
                    <div class="bar-fill fill-b" :style="{ width: getBarWidth(compareResult.frequency.A.msgPerDay, compareResult.frequency.B.msgPerDay, 'B') }"></div>
                    <span class="bar-value">{{ compareResult.frequency.B.msgPerDay.toFixed(1) }}/天</span>
                  </div>
                </div>
              </div>

              <div class="bar-item">
                <div class="bar-label">活跃天数</div>
                <div class="bar-row">
                  <div class="bar-side bar-left">
                    <div class="bar-fill fill-a" :style="{ width: getBarWidth(compareResult.frequency.A.activeDays, compareResult.frequency.B.activeDays, 'A') }"></div>
                    <span class="bar-value">{{ compareResult.frequency.A.activeDays }}天</span>
                  </div>
                  <div class="bar-side bar-right">
                    <div class="bar-fill fill-b" :style="{ width: getBarWidth(compareResult.frequency.A.activeDays, compareResult.frequency.B.activeDays, 'B') }"></div>
                    <span class="bar-value">{{ compareResult.frequency.B.activeDays }}天</span>
                  </div>
                </div>
              </div>

              <div class="bar-item">
                <div class="bar-label">深夜聊天</div>
                <div class="bar-row">
                  <div class="bar-side bar-left">
                    <div class="bar-fill fill-a" :style="{ width: getBarWidth(compareResult.frequency.A.lateNightMsgs, compareResult.frequency.B.lateNightMsgs, 'A') }"></div>
                    <span class="bar-value">{{ compareResult.frequency.A.lateNightMsgs }}次</span>
                  </div>
                  <div class="bar-side bar-right">
                    <div class="bar-fill fill-b" :style="{ width: getBarWidth(compareResult.frequency.A.lateNightMsgs, compareResult.frequency.B.lateNightMsgs, 'B') }"></div>
                    <span class="bar-value">{{ compareResult.frequency.B.lateNightMsgs }}次</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="compare-card card">
            <div class="card-header">
              <span class="card-icon">🔑</span>
              <h4>关键词分析</h4>
              <span class="winner-badge" :class="'winner-' + compareResult.keywords.winner">
                {{ compareResult.keywords.winner === 'tie' ? '平局' : compareResult.keywords.winner + ' 胜' }}
              </span>
            </div>

            <div class="keyword-compare">
              <div class="keyword-stats">
                <div class="stat-item stat-a">
                  <div class="stat-value">{{ compareResult.keywords.A.totalKeywordHits }}</div>
                  <div class="stat-label">关键词总数</div>
                </div>
                <div class="stat-item stat-b">
                  <div class="stat-value">{{ compareResult.keywords.B.totalKeywordHits }}</div>
                  <div class="stat-label">关键词总数</div>
                </div>
              </div>

              <div class="keyword-list">
                <div class="keyword-header">
                  <span class="kw-col-a">A 方</span>
                  <span class="kw-col-label">关键词</span>
                  <span class="kw-col-b">B 方</span>
                </div>
                <div
                  v-for="kw in getAllKeywords()"
                  :key="kw.key"
                  class="keyword-row"
                >
                  <div class="kw-count kw-count-a">
                    <div class="kw-bar" :style="{ width: getKeywordBarWidth(kw.key) + '%' }"></div>
                    <span>{{ compareResult.keywords.A.keywords[kw.key]?.count || 0 }}</span>
                  </div>
                  <div class="kw-label">{{ kw.label }}</div>
                  <div class="kw-count kw-count-b">
                    <div class="kw-bar kw-bar-right" :style="{ width: getKeywordBarWidth(kw.key, 'B') + '%' }"></div>
                    <span>{{ compareResult.keywords.B.keywords[kw.key]?.count || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="compare-card card">
            <div class="card-header">
              <span class="card-icon">⚡</span>
              <h4>回复速度</h4>
              <span class="winner-badge" :class="'winner-' + compareResult.replySpeed.winner">
                {{ compareResult.replySpeed.winner === 'tie' ? '平局' : compareResult.replySpeed.winner + ' 胜' }}
              </span>
            </div>

            <div class="reply-compare">
              <div class="reply-metrics">
                <div class="metric-item">
                  <div class="metric-label">平均回复时间</div>
                  <div class="metric-values">
                    <span class="metric-a">{{ formatDuration(compareResult.replySpeed.A.avgReplyTime) }}</span>
                    <span class="metric-divider">vs</span>
                    <span class="metric-b">{{ formatDuration(compareResult.replySpeed.B.avgReplyTime) }}</span>
                  </div>
                </div>

                <div class="metric-item">
                  <div class="metric-label">秒回次数（5分钟内）</div>
                  <div class="metric-values">
                    <span class="metric-a">{{ compareResult.replySpeed.A.quickReplyCount }}次</span>
                    <span class="metric-divider">vs</span>
                    <span class="metric-b">{{ compareResult.replySpeed.B.quickReplyCount }}次</span>
                  </div>
                </div>

                <div class="metric-item">
                  <div class="metric-label">秒回率</div>
                  <div class="metric-values">
                    <span class="metric-a">{{ (compareResult.replySpeed.A.quickReplyRatio * 100).toFixed(1) }}%</span>
                    <span class="metric-divider">vs</span>
                    <span class="metric-b">{{ (compareResult.replySpeed.B.quickReplyRatio * 100).toFixed(1) }}%</span>
                  </div>
                </div>

                <div class="metric-item">
                  <div class="metric-label">最快回复</div>
                  <div class="metric-values">
                    <span class="metric-a">{{ formatDuration(compareResult.replySpeed.A.minReplyTime) }}</span>
                    <span class="metric-divider">vs</span>
                    <span class="metric-b">{{ formatDuration(compareResult.replySpeed.B.minReplyTime) }}</span>
                  </div>
                </div>
              </div>

              <div class="reply-bars">
                <div class="reply-bar-row">
                  <span class="reply-bar-label">A 方秒回率</span>
                  <div class="reply-bar-track">
                    <div class="reply-bar-fill fill-a" :style="{ width: (compareResult.replySpeed.A.quickReplyRatio * 100) + '%' }"></div>
                  </div>
                  <span class="reply-bar-value">{{ (compareResult.replySpeed.A.quickReplyRatio * 100).toFixed(0) }}%</span>
                </div>
                <div class="reply-bar-row">
                  <span class="reply-bar-label">B 方秒回率</span>
                  <div class="reply-bar-track">
                    <div class="reply-bar-fill fill-b" :style="{ width: (compareResult.replySpeed.B.quickReplyRatio * 100) + '%' }"></div>
                  </div>
                  <span class="reply-bar-value">{{ (compareResult.replySpeed.B.quickReplyRatio * 100).toFixed(0) }}%</span>
                </div>
              </div>
            </div>
          </div>

          <div class="compare-card card">
            <div class="card-header">
              <span class="card-icon">💖</span>
              <h4>情书指数</h4>
              <span class="winner-badge" :class="'winner-' + compareResult.loveIndex.winner">
                {{ compareResult.loveIndex.winner === 'tie' ? '平局' : compareResult.loveIndex.winner + ' 胜' }}
              </span>
            </div>

            <div class="love-index-compare">
              <div class="love-scores">
                <div class="love-score-item score-a">
                  <div class="love-score-ring">
                    <svg viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="54" fill="none" stroke="#ffe5e5" stroke-width="8" />
                      <circle
                        cx="60" cy="60" r="54"
                        fill="none"
                        :stroke="getLoveColor(compareResult.loveIndex.A.totalScore)"
                        stroke-width="8"
                        stroke-linecap="round"
                        :stroke-dasharray="getStrokeDashArray(compareResult.loveIndex.A.totalScore)"
                        transform="rotate(-90 60 60)"
                      />
                    </svg>
                    <div class="ring-content">
                      <div class="ring-score">{{ compareResult.loveIndex.A.totalScore }}</div>
                      <div class="ring-level">{{ compareResult.loveIndex.A.level }}</div>
                    </div>
                  </div>
                  <div class="love-tags">
                    <span v-for="tag in compareResult.loveIndex.A.tags" :key="tag" class="tag tag-love">{{ tag }}</span>
                  </div>
                </div>

                <div class="vs-divider-small">VS</div>

                <div class="love-score-item score-b">
                  <div class="love-score-ring">
                    <svg viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="54" fill="none" stroke="#e8f5e9" stroke-width="8" />
                      <circle
                        cx="60" cy="60" r="54"
                        fill="none"
                        :stroke="getLoveColor(compareResult.loveIndex.B.totalScore)"
                        stroke-width="8"
                        stroke-linecap="round"
                        :stroke-dasharray="getStrokeDashArray(compareResult.loveIndex.B.totalScore)"
                        transform="rotate(-90 60 60)"
                      />
                    </svg>
                    <div class="ring-content">
                      <div class="ring-score">{{ compareResult.loveIndex.B.totalScore }}</div>
                      <div class="ring-level">{{ compareResult.loveIndex.B.level }}</div>
                    </div>
                  </div>
                  <div class="love-tags">
                    <span v-for="tag in compareResult.loveIndex.B.tags" :key="tag" class="tag tag-freq">{{ tag }}</span>
                  </div>
                </div>
              </div>

              <div class="love-breakdown">
                <h5>得分构成</h5>
                <div class="breakdown-list">
                  <div class="breakdown-item">
                    <span class="breakdown-label">互动分</span>
                    <div class="breakdown-bars">
                      <div class="breakdown-bar bar-a" :style="{ width: getBreakdownWidth(compareResult.loveIndex.A.interactionScore) + '%' }">
                        <span>{{ compareResult.loveIndex.A.interactionScore }}</span>
                      </div>
                      <div class="breakdown-bar bar-b" :style="{ width: getBreakdownWidth(compareResult.loveIndex.B.interactionScore) + '%' }">
                        <span>{{ compareResult.loveIndex.B.interactionScore }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="breakdown-item">
                    <span class="breakdown-label">关键词分</span>
                    <div class="breakdown-bars">
                      <div class="breakdown-bar bar-a" :style="{ width: getBreakdownWidth(compareResult.loveIndex.A.keywordScore) + '%' }">
                        <span>{{ compareResult.loveIndex.A.keywordScore }}</span>
                      </div>
                      <div class="breakdown-bar bar-b" :style="{ width: getBreakdownWidth(compareResult.loveIndex.B.keywordScore) + '%' }">
                        <span>{{ compareResult.loveIndex.B.keywordScore }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="breakdown-item">
                    <span class="breakdown-label">频率分</span>
                    <div class="breakdown-bars">
                      <div class="breakdown-bar bar-a" :style="{ width: getBreakdownWidth(compareResult.loveIndex.A.frequencyScore) + '%' }">
                        <span>{{ compareResult.loveIndex.A.frequencyScore }}</span>
                      </div>
                      <div class="breakdown-bar bar-b" :style="{ width: getBreakdownWidth(compareResult.loveIndex.B.frequencyScore) + '%' }">
                        <span>{{ compareResult.loveIndex.B.frequencyScore }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { store } from '@/store'
import { compareConversations, formatDuration } from '@/utils/compareAnalysis.js'
import { LOVE_KEYWORDS } from '@/detectors/keywordDetector.js'

const selectedA = computed(() => store.getCompareSelectedA())
const selectedB = computed(() => store.getCompareSelectedB())
const compareResult = computed(() => store.compareResult)

watch(
  () => store.loveLetters,
  () => {
    if (store.compareResult && (!selectedA.value || !selectedB.value)) {
      store.setCompareResult(null)
    }
  },
  { deep: true }
)

const canCompare = computed(() => {
  return selectedA.value && selectedB.value && selectedA.value.conversation.id !== selectedB.value.conversation.id
})

const hasPersistedState = computed(() => {
  return store.compareSelectedAId || store.compareSelectedBId || store.compareResult
})

function selectA(item) {
  if (selectedB.value?.conversation.id === item.conversation.id) return
  store.setCompareSelectedAId(item.conversation.id)
  store.setCompareResult(null)
}

function selectB(item) {
  if (selectedA.value?.conversation.id === item.conversation.id) return
  store.setCompareSelectedBId(item.conversation.id)
  store.setCompareResult(null)
}

function resetCompare() {
  store.clearCompareState()
}

function getAvatar(name) {
  return name ? name.charAt(0) : '?'
}

function doCompare() {
  if (!canCompare.value) return
  const result = compareConversations(
    selectedA.value.conversation,
    selectedB.value.conversation
  )
  store.setCompareResult(result)
}

function getBarWidth(valA, valB, side) {
  const max = Math.max(valA, valB, 1)
  const val = side === 'A' ? valA : valB
  return (val / max * 100) + '%'
}

function getAllKeywords() {
  return LOVE_KEYWORDS.map(kw => ({ key: kw.tag, label: kw.label }))
}

function getKeywordBarWidth(key, side = 'A') {
  const kwA = compareResult.value.keywords.A.keywords[key]?.count || 0
  const kwB = compareResult.value.keywords.B.keywords[key]?.count || 0
  const max = Math.max(kwA, kwB, 1)
  const val = side === 'A' ? kwA : kwB
  return (val / max * 100)
}

function getLoveColor(score) {
  if (score >= 200) return '#e74c3c'
  if (score >= 150) return '#ff6b6b'
  if (score >= 100) return '#ffa94d'
  if (score >= 50) return '#ffd93d'
  return '#95a5a6'
}

function getStrokeDashArray(score) {
  const maxScore = 250
  const circumference = 2 * Math.PI * 54
  const progress = Math.min(score / maxScore, 1)
  const dashLength = circumference * progress
  const gapLength = circumference - dashLength
  return `${dashLength} ${gapLength}`
}

function getBreakdownWidth(score) {
  const maxScore = 100
  return Math.min(score / maxScore * 100, 100)
}
</script>

<style scoped>
.compare-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  padding: 2rem 0 3rem;
}

.page-header h2 {
  font-size: 2rem;
  color: var(--love-red);
  margin-bottom: 0.5rem;
}

.page-header .subtitle {
  color: var(--text-light);
  font-size: 1.1rem;
}

.persist-notice {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #fff9e6 0%, #fff5f5 100%);
  border: 1px solid #ffe0b2;
}

.notice-icon {
  font-size: 1.3rem;
  flex-shrink: 0;
}

.notice-text {
  flex: 1;
  color: var(--text-dark);
  font-size: 0.95rem;
}

.btn-small {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.section-header h3 {
  color: var(--text-dark);
  margin-bottom: 0.5rem;
}

.section-header .tip {
  color: var(--text-light);
  margin-bottom: 0;
}

.selector-section {
  margin-bottom: 2rem;
}

.selector-section h3 {
  color: var(--text-dark);
  margin-bottom: 0.5rem;
}

.selector-section .tip {
  color: var(--text-light);
  margin-bottom: 0;
}

.selector-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  align-items: start;
}

.selector-col {
  background: var(--bg-light);
  border-radius: 12px;
  padding: 1rem;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  font-weight: 600;
  font-size: 1.1rem;
}

.badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 0.9rem;
}

.badge-a {
  background: linear-gradient(135deg, var(--love-red), var(--love-pink));
}

.badge-b {
  background: linear-gradient(135deg, #3498db, #2ecc71);
}

.contact-list {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.contact-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.contact-item.selected {
  border-color: var(--love-pink);
  background: #fff5f5;
}

.contact-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.contact-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--love-red), var(--love-pink));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-name {
  font-weight: 500;
  color: var(--text-dark);
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-light);
}

.check-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--love-red);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
}

.vs-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
}

.vs-text {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-light);
  background: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow);
}

.compare-actions {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}

.btn-large {
  padding: 1rem 3rem;
  font-size: 1.1rem;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #fff5f5 0%, #fff0f6 100%);
}

.result-title h3 {
  color: var(--love-red);
  margin-bottom: 0.25rem;
}

.result-desc {
  color: var(--text-light);
}

.overall-score {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.score-item {
  text-align: center;
  padding: 0.5rem 1.5rem;
  border-radius: 12px;
  background: white;
  transition: all 0.3s;
}

.score-item.winner {
  background: linear-gradient(135deg, var(--love-red), var(--love-pink));
  color: white;
  transform: scale(1.1);
}

.score-label {
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
}

.score-item.winner .score-label {
  opacity: 0.9;
}

.score-value {
  font-size: 2rem;
  font-weight: bold;
}

.score-divider {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-light);
}

.compare-sections {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.compare-card {
  transition: all 0.3s;
}

.compare-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.card-icon {
  font-size: 1.3rem;
}

.card-header h4 {
  flex: 1;
  color: var(--text-dark);
}

.winner-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.winner-badge.winner-A {
  background: #ffe5e5;
  color: var(--love-red);
}

.winner-badge.winner-B {
  background: #e8f5e9;
  color: #2ecc71;
}

.winner-badge.winner-tie {
  background: #f5f5f5;
  color: var(--text-light);
}

.compare-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bar-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bar-label {
  font-size: 0.9rem;
  color: var(--text-light);
}

.bar-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.bar-side {
  display: flex;
  align-items: center;
  position: relative;
  height: 32px;
  background: var(--bg-light);
  border-radius: 8px;
  overflow: hidden;
}

.bar-left {
  flex-direction: row-reverse;
}

.bar-fill {
  height: 100%;
  border-radius: 8px;
  transition: width 0.5s ease;
}

.fill-a {
  background: linear-gradient(90deg, var(--love-red), var(--love-pink));
}

.bar-left .fill-a {
  background: linear-gradient(270deg, var(--love-red), var(--love-pink));
}

.fill-b {
  background: linear-gradient(90deg, #3498db, #2ecc71);
}

.bar-value {
  position: absolute;
  padding: 0 0.75rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.bar-left .bar-value {
  left: auto;
  right: 0.75rem;
}

.keyword-compare {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.keyword-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  border-radius: 12px;
}

.stat-a {
  background: #fff5f5;
}

.stat-b {
  background: #f0f9ff;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--text-dark);
}

.stat-a .stat-value {
  color: var(--love-red);
}

.stat-b .stat-value {
  color: #3498db;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-light);
  margin-top: 0.25rem;
}

.keyword-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.keyword-header {
  display: grid;
  grid-template-columns: 1fr 80px 1fr;
  align-items: center;
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-light);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
}

.kw-col-label {
  font-weight: 500;
}

.keyword-row {
  display: grid;
  grid-template-columns: 1fr 80px 1fr;
  align-items: center;
  gap: 0.5rem;
}

.kw-label {
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-dark);
}

.kw-count {
  position: relative;
  height: 28px;
  display: flex;
  align-items: center;
  overflow: hidden;
  border-radius: 6px;
  background: var(--bg-light);
}

.kw-count-a {
  justify-content: flex-end;
}

.kw-count-b {
  justify-content: flex-start;
}

.kw-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, var(--love-red), var(--love-pink));
  border-radius: 6px;
  transition: width 0.5s ease;
}

.kw-bar-right {
  left: auto;
  right: 0;
  background: linear-gradient(270deg, #3498db, #2ecc71);
}

.kw-count span {
  position: relative;
  z-index: 1;
  padding: 0 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.kw-count-a span {
  color: var(--love-red);
}

.kw-count-b span {
  color: #3498db;
}

.reply-compare {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.reply-metrics {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--bg-light);
  border-radius: 10px;
}

.metric-label {
  font-size: 0.9rem;
  color: var(--text-light);
}

.metric-values {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 500;
}

.metric-a {
  color: var(--love-red);
}

.metric-b {
  color: #3498db;
}

.metric-divider {
  color: var(--text-light);
  font-size: 0.8rem;
}

.reply-bars {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.reply-bar-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.reply-bar-label {
  width: 100px;
  font-size: 0.85rem;
  color: var(--text-light);
  flex-shrink: 0;
}

.reply-bar-track {
  flex: 1;
  height: 20px;
  background: var(--bg-light);
  border-radius: 10px;
  overflow: hidden;
}

.reply-bar-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.5s ease;
}

.reply-bar-value {
  width: 50px;
  text-align: right;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-dark);
}

.love-index-compare {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.love-scores {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 1rem 0;
}

.love-score-item {
  text-align: center;
}

.love-score-ring {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 0.75rem;
}

.love-score-ring svg {
  width: 100%;
  height: 100%;
}

.ring-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.ring-score {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--text-dark);
}

.score-a .ring-score {
  color: var(--love-red);
}

.score-b .ring-score {
  color: #2ecc71;
}

.ring-level {
  font-size: 0.75rem;
  color: var(--text-light);
}

.love-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.35rem;
  max-width: 160px;
}

.vs-divider-small {
  font-size: 1rem;
  font-weight: bold;
  color: var(--text-light);
}

.love-breakdown h5 {
  color: var(--text-dark);
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.breakdown-label {
  width: 60px;
  font-size: 0.8rem;
  color: var(--text-light);
  flex-shrink: 0;
}

.breakdown-bars {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.breakdown-bar {
  height: 20px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.5rem;
  font-size: 0.75rem;
  color: white;
  font-weight: 500;
  min-width: 30px;
  transition: width 0.5s ease;
}

.breakdown-bar.bar-a {
  background: linear-gradient(90deg, var(--love-red), var(--love-pink));
}

.breakdown-bar.bar-b {
  background: linear-gradient(90deg, #3498db, #2ecc71);
}

@media (max-width: 768px) {
  .selector-grid {
    grid-template-columns: 1fr;
  }

  .vs-divider {
    min-height: auto;
    padding: 0.5rem 0;
  }

  .compare-sections {
    grid-template-columns: 1fr;
  }

  .result-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .love-scores {
    flex-direction: column;
    gap: 1.5rem;
  }

  .vs-divider-small {
    transform: rotate(90deg);
  }
}
</style>
