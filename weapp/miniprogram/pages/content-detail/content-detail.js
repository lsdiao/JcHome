const api = require('../../utils/api.js')
const config = require('../../config.js')

Page({
  data: {
    brand: config.brand,
    item: null,
    bodyParts: [],
    loading: true,
    failed: false,
    canOpenChannels: false
  },

  onLoad(options) {
    this.id = options.id
    this.canShare = true
    this.setData({
      canOpenChannels: typeof wx.openChannelsActivity === 'function'
    })
    this.load()
  },

  load() {
    return api.call('content.list')
      .then(list => {
        const item = (list || []).find(x => x._id === this.id)
        if (!item) {
          this.setData({ loading: false, item: null })
          return
        }
        const bodyParts = (item.body || '')
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean)
        this.setData({ item, bodyParts, loading: false })
        wx.setNavigationBarTitle({ title: item.type === 'video' ? '视频详情' : '图文详情' })
      })
      .catch(err => {
        this.setData({ loading: false })
        api.toast(err.message)
      })
  },

  /** 视频号原视频被删除 / 参数错误时触发 */
  onVideoError(e) {
    console.error('[channel-video] 播放失败：', e && e.detail)
    this.setData({ failed: true })
    api.toast('视频已失效，请联系管理员更新')
  },

  /** 跳转视频号观看（无主体限制，作为兜底方案） */
  openInChannels() {
    const item = this.data.item
    if (!item || !item.feedId) {
      api.toast('未配置视频号 feedId')
      return
    }
    wx.openChannelsActivity({
      finderUserName: item.finderUserName || '',
      feedId: item.feedId,
      fail: err => {
        console.error('[openChannelsActivity] 失败：', err)
        api.toast('打开视频号失败，请检查主体与参数配置')
      }
    })
  },

  onShareAppMessage() {
    const item = this.data.item || {}
    return {
      title: item.title || config.brand.name,
      path: `/pages/content-detail/content-detail?id=${this.id}&type=${item.type}`,
      imageUrl: item.cover || ''
    }
  }
})