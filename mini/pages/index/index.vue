<template>
  <view class="content" :style="{ paddingTop: statusBarHeight }">
    <view class="page-title">客户进度表</view>

    <view class="form-container">
      <view class="form-row">
        <view class="form-item">
          <view class="label">客户名称</view>
          <view class="value readonly">{{ form.customerName }}</view>
        </view>
        <view class="form-item">
          <view class="label">戴牙时间</view>
          <view class="value readonly">{{ form.wearTime }}</view>
    </view>
      </view>

      <view class="form-row">
        <view class="form-item" @click="showProgressPicker = true">
          <view class="label">进度选择</view>
          <view class="value picker-value" :class="{ placeholder: !form.progress }">
            {{ form.progress || '请选择进度' }}
            <text class="arrow">›</text>
    </view>
          </view>
        <view class="form-item" @click="showTechnicianPicker = true">
          <view class="label">技工师选择</view>
          <view class="value picker-value" :class="{ placeholder: !form.technician }">
            {{ form.technician || '请选择技工师' }}
            <text class="arrow">›</text>
        </view>
      </view>
    </view>

      <view class="form-row">
        <view class="form-item">
          <view class="label">材料</view>
          <view class="value readonly">{{ form.material }}</view>
        </view>
        <view class="form-item image-item">
          <view class="label">图片</view>
          <view class="image-preview" @click="previewImage">
            <image v-if="form.image" :src="form.image" mode="aspectFill" class="preview-img" />
            <view v-else class="no-image">暂无图片</view>
      </view>
    </view>
    </view>

      <view class="btn-container">
        <button class="action-btn" @click="handleStart">开始操作</button>
      </view>
    </view>

    <u-picker
      :show="showProgressPicker"
      :columns="progressColumns"
      @confirm="onProgressConfirm"
      @cancel="showProgressPicker = false"
      @close="showProgressPicker = false"
    ></u-picker>

    <u-picker
      :show="showTechnicianPicker"
      :columns="technicianColumns"
      @confirm="onTechnicianConfirm"
      @cancel="showTechnicianPicker = false"
      @close="showTechnicianPicker = false"
    ></u-picker>
  </view>
</template>

<script>
function getDate(date, AddDayCount = 0) {
  if (!date) {
    date = new Date();
  }
  if (typeof date !== "object") {
    date = date.replace(/-/g, "/");
  }
  const dd = new Date(date);

  dd.setDate(dd.getDate() + AddDayCount);

  const y = dd.getFullYear();
  const m =
    dd.getMonth() + 1 < 10 ? "0" + (dd.getMonth() + 1) : dd.getMonth() + 1;
  const d = dd.getDate() < 10 ? "0" + dd.getDate() : dd.getDate();
  return {
    fullDate: y + "-" + m + "-" + d,
    year: y,
    month: m,
    date: d,
    day: dd.getDay()
  };
}

export default {
  data() {
    return {
      statusBarHeight: +(+uni.getSystemInfoSync().statusBarHeight + 10) + "px",
      form: {
        customerName: "",
        wearTime: "",
        progress: "",
        technician: "",
        material: "",
        image: ""
      },
      showProgressPicker: false,
      showTechnicianPicker: false,
      progressColumns: [
        ["未开始", "进行中", "已完成"]
      ],
      technicianColumns: [
        []
      ]
    };
  },

  onReady() {
    this.startDate = getDate(new Date(), -60).fullDate;
    this.endDate = getDate(new Date(), 30).fullDate;
    this.fetchData();
    this.fetchTechnicians();
  },

  onLoad: function (option) {},

  options: { styleIsolation: "shared" },

  computed: {},

  methods: {
    fetchData() {
      uni.showLoading({ title: "加载中..." });
      
      setTimeout(() => {
        this.form = {
          customerName: "张三",
          wearTime: "2024-01-15",
          progress: "",
          technician: "",
          material: "金属托槽",
          image: "https://via.placeholder.com/200"
        };
        uni.hideLoading();
      }, 500);
    },

    fetchTechnicians() {
      setTimeout(() => {
        this.technicianColumns = [
          ["李师傅", "王师傅", "赵师傅", "刘师傅", "陈师傅"]
        ];
      }, 300);
    },

    onProgressConfirm(e) {
      this.form.progress = e.value[0];
      this.showProgressPicker = false;
    },

    onTechnicianConfirm(e) {
      this.form.technician = e.value[0];
      this.showTechnicianPicker = false;
    },

    previewImage() {
      if (!this.form.image) {
        uni.showToast({
          title: "暂无图片",
          icon: "none"
        });
        return;
      }
      uni.previewImage({
        urls: [this.form.image],
        current: 0
      });
    },

    handleStart() {
      if (!this.form.progress) {
        uni.showToast({
          title: "请选择进度",
          icon: "none"
        });
        return;
      }
      if (!this.form.technician) {
        uni.showToast({
          title: "请选择技工师",
          icon: "none"
        });
        return;
      }

      uni.showModal({
        title: "确认操作",
        content: "确定要开始操作吗？",
        success: (res) => {
          if (res.confirm) {
            uni.showLoading({ title: "操作中..." });
            setTimeout(() => {
              uni.hideLoading();
        uni.showToast({
                title: "操作成功",
                icon: "success"
              });
            }, 1000);
          }
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
page {
  background-color: #f5f5f5;
}

.content {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
}

.page-title {
  text-align: center;
  font-size: 40rpx;
  font-weight: bold;
  color: #ff6b6b;
  padding: 40rpx 0;
  background: #fff;
  box-shadow: 0 2rpx 10rpx rgba(221, 82, 77, 0.1);
}

.form-container {
  margin: 30rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.form-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40rpx;

  &:last-of-type {
    margin-bottom: 0;
  }
}

.form-item {
  flex: 1;
  padding: 0 15rpx;

  &:first-child {
    padding-left: 0;
  }

  &:last-child {
    padding-right: 0;
  }

  .label {
    font-size: 28rpx;
    color: #666;
    margin-bottom: 16rpx;
    font-weight: 500;
  }

  .value {
    font-size: 30rpx;
    color: #333;
    padding: 20rpx;
    background: #f8f8f8;
    border-radius: 12rpx;
    min-height: 44rpx;
    line-height: 44rpx;

    &.readonly {
      background: #f0f0f0;
      color: #666;
    }

    &.picker-value {
      background: rgba(221, 82, 77, 0.05);
      border: 2rpx solid rgba(221, 82, 77, 0.2);
      color: #ff6b6b;
    position: relative;
      padding-right: 50rpx;

      &.placeholder {
        color: #999;
      }

      .arrow {
    position: absolute;
        right: 20rpx;
        top: 50%;
        transform: translateY(-50%) rotate(90deg);
        font-size: 40rpx;
        font-weight: bold;
        color: #ff6b6b;
      }
    }
  }

  &.image-item {
    .image-preview {
      width: 100%;
      height: 160rpx;
      border-radius: 12rpx;
      overflow: hidden;
      background: #f8f8f8;
      display: flex;
      align-items: center;
      justify-content: center;

      .preview-img {
        width: 100%;
        height: 100%;
      }

      .no-image {
        font-size: 24rpx;
        color: #999;
      }
    }
  }
}

.btn-container {
  margin-top: 60rpx;
  padding: 0 15rpx;

  .action-btn {
    width: 100%;
    height: 90rpx;
    background: linear-gradient(135deg, #ff6b6b 0%, #ff6b6b 100%);
    color: #fff;
    font-size: 32rpx;
    font-weight: bold;
    border-radius: 45rpx;
    border: none;
    box-shadow: 0 8rpx 20rpx rgba(221, 82, 77, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;

    &::after {
      border: none;
    }

    &:active {
      opacity: 0.9;
      transform: scale(0.98);
    }
  }
}
</style>
