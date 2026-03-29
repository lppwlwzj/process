<template>
  <view class="images-list-container">
    <view class="images-list-header">
      <text class="images-list-label">{{ label }}</text>
    </view>
    <view v-if="imageList.length > 0" class="images-grid">
      <view v-for="(image, index) in imageList" :key="index" class="image-item" :data-index="index"  hover-class="image-item-hover">
        <image :src="image" mode="aspectFill" class="image-thumbnail" @click="handlePreviewImage(index)"></image>
        <text class="image-index">图片 {{ index + 1 }}</text>
      </view>
    </view>
    <view v-else class="empty-state">
      <uni-icons type="image" size="64" color="#ccc"></uni-icons>
      <text class="empty-text">暂无图片</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ImagesList',
  props: {
    label: {
      type: String,
      default: '图片'
    },
    images: {
      type: String,
      default: ''
    }
  },
  computed: {
    imageList() {
      if (!this.images) return []
      return this.images.split(',').map(img => img.trim()).filter(img => img)
    }
  },
  methods: {
    handlePreviewImage(index) {
      console.log('预览图片，索引:', index, '图片列表:', this.imageList)
      if (index < 0 || index >= this.imageList.length) {
        console.error('索引无效:', index, '数组长度:', this.imageList.length)
        return
      }
      uni.previewImage({
        urls: this.imageList,
        current: index,
        longPressActions: {
          itemList: ['保存图片'],
          success: (data) => {
            if (data.tapIndex === 0) {
              this.saveImage(this.imageList[data.index])
            }
          }
        }
      })
    },
    saveImage(url) {
      // #ifdef H5
      const a = document.createElement('a')
      a.href = url
      a.download = url.split('/').pop() || 'image.jpg'
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      uni.showToast({ title: '已触发下载', icon: 'success' })
      // #endif
      // #ifndef H5
      uni.downloadFile({
        url: url,
        success: (res) => {
          if (res.statusCode === 200) {
            uni.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                uni.showToast({
                  title: '保存成功',
                  icon: 'success'
                })
              },
              fail: () => {
                uni.showToast({
                  title: '保存失败',
                  icon: 'none'
                })
              }
            })
          }
        },
        fail: () => {
          uni.showToast({
            title: '下载失败',
            icon: 'none'
          })
        }
      })
      // #endif
    }
  }
}
</script>

<style lang="scss" scoped>
.images-list-container {
  width: 100%;
  padding: 8rpx 0;
}

.images-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.images-list-label {
  font-size: 28rpx;
  color: #999;
  font-weight: 500;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.image-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  cursor: pointer;
}

.image-thumbnail {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12rpx;
  background: #f5f5f5;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  width:120rpx;
  height:120rpx;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  border-radius: 12rpx;
}

.image-item-hover .image-thumbnail {
  transform: scale(0.95);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.2);
}

.image-item-hover .image-overlay {
  opacity: 1;
}

.image-index {
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
</style>
