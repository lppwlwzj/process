<template>
  <view class="video-list-container">
    <view class="video-list-header">
      <text class="video-list-label">{{ label }}</text>
     <!-- <text class="video-count">共{{ videoList.length }}个视频</text> -->
    </view>
    <view v-if="videoList.length > 0" class="video-grid">
      <view v-for="(video, index) in videoList" :key="index" class="video-item" @click="handlePlayVideo(video, index)" hover-class="video-item-hover">
        <view class="video-cover">
          <uni-icons type="videocam-filled" size="48" color="#ff758c"></uni-icons>
          <view class="play-icon">
            <uni-icons type="play-filled" size="24" color="#fff"></uni-icons>
          </view>
        </view>
        <text class="video-index">视频 {{ index + 1 }}</text>
      </view>
    </view>
    <view v-else class="empty-state">
      <uni-icons type="video" size="64" color="#ccc"></uni-icons>
      <text class="empty-text">暂无视频</text>
    </view>

    <view v-if="showVideoPopup" class="video-popup-mask" @click="closeVideo">
      <view class="video-popup-container" @click.stop>
        <view class="video-popup-header">
          <text class="video-popup-title">视频 {{ currentIndex + 1 }}/{{ videoList.length }}</text>
          <view class="close-btn" @click="closeVideo">
            <uni-icons type="closeempty" size="24" color="#fff"></uni-icons>
          </view>
        </view>
        <video 
          v-if="currentVideoUrl" 
          :src="currentVideoUrl" 
          class="video-player"
          controls
          :show-center-play-btn="true"
          :enable-progress-gesture="true"
          :page-gesture="false"
        ></video>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'VideoList',
  components: {
    // uni-icons 和 uni-popup 通过 easycom 自动引入
  },
  props: {
    label: {
      type: String,
      default: '视频'
    },
    videos: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      showVideoPopup: false,
      currentVideoUrl: '',
      currentIndex: 0
    }
  },
  computed: {
    videoList() {
      if (!this.videos) return []
      return this.videos.split(',').filter(v => v.trim())
    }
  },
  methods: {
    handlePlayVideo(videoUrl, index) {
      this.currentVideoUrl = videoUrl
      this.currentIndex = index
      this.showVideoPopup = true
    },
    closeVideo() {
      this.showVideoPopup = false
      setTimeout(() => {
        this.currentVideoUrl = ''
      }, 300)
    }
  }
}
</script>

<style lang="scss" scoped>
.video-list-container {
  width: 100%;
  padding: 8rpx 0;
}

.video-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.video-list-label {
  font-size: 28rpx;
  color: #999;
  font-weight: 500;
}

.video-count {
  font-size: 24rpx;
  color: #ff758c;
  font-weight: 500;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.video-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  cursor: pointer;
}

.video-cover {
  width: 100%;
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, #ffe5ec 0%, #ffd4e5 100%);
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  box-shadow: 0 2rpx 8rpx rgba(255, 117, 140, 0.15);
  position: relative;
  overflow: hidden;
}

.play-icon {
  position: absolute;
  bottom: 8rpx;
  right: 8rpx;
  width: 44rpx;
  height: 44rpx;
  background: rgba(255, 117, 140, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
}

.video-item-hover .video-cover {
  transform: scale(0.95);
  box-shadow: 0 4rpx 16rpx rgba(255, 117, 140, 0.3);
}

.video-index {
  font-size: 24rpx;
  color: #666;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
  gap: 16rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #ccc;
}

.video-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.video-popup-container {
  width: 90vw;
  background: #000;
  border-radius: 16rpx;
  overflow: hidden;
}

.video-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx;
  background: rgba(0, 0, 0, 0.8);
}

.video-popup-title {
  font-size: 28rpx;
  color: #fff;
  font-weight: 500;
}

.close-btn {
  padding: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-player {
  width: 100%;
  height: 50vh;
  background: #000;
}
</style>
