import { reactive } from 'vue'

const STORAGE_KEY = 'old-sms-love-letter-store'

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch (e) {
    console.warn('[Store] Failed to load from localStorage:', e)
    return null
  }
}

function saveToStorage(state) {
  try {
    const data = {
      compareSelectedAId: state.compareSelectedAId,
      compareSelectedBId: state.compareSelectedBId,
      compareResult: state.compareResult
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('[Store] Failed to save to localStorage:', e)
  }
}

const savedState = loadFromStorage()

export const store = reactive({
  conversations: [],
  selectedConversation: null,
  loveLetters: [],
  anonymousPosts: [],
  processing: false,
  error: null,

  compareSelectedAId: savedState?.compareSelectedAId || null,
  compareSelectedBId: savedState?.compareSelectedBId || null,
  compareResult: savedState?.compareResult || null,

  setConversations(convs) {
    this.conversations = convs
  },

  setLoveLetters(letters) {
    this.loveLetters = letters
  },

  setSelectedConversation(conv) {
    this.selectedConversation = conv
  },

  addAnonymousPost(post) {
    this.anonymousPosts.unshift(post)
  },

  setProcessing(val) {
    this.processing = val
  },

  setError(err) {
    this.error = err
  },

  setCompareSelectedAId(id) {
    this.compareSelectedAId = id
    saveToStorage(this)
  },

  setCompareSelectedBId(id) {
    this.compareSelectedBId = id
    saveToStorage(this)
  },

  setCompareResult(result) {
    this.compareResult = result
    saveToStorage(this)
  },

  clearCompareState() {
    this.compareSelectedAId = null
    this.compareSelectedBId = null
    this.compareResult = null
    saveToStorage(this)
  },

  getCompareSelectedA() {
    if (!this.compareSelectedAId) return null
    return this.loveLetters.find(l => l.conversation.id === this.compareSelectedAId) || null
  },

  getCompareSelectedB() {
    if (!this.compareSelectedBId) return null
    return this.loveLetters.find(l => l.conversation.id === this.compareSelectedBId) || null
  },

  clearAll() {
    this.conversations = []
    this.selectedConversation = null
    this.loveLetters = []
    this.error = null
    this.clearCompareState()
  }
})
