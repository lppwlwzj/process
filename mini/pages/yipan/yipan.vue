<template>
  <view class="content" :style="{ paddingTop: statusBarHeight }">
    <view class="page-title">椅旁操作</view>

    <view class="form-container">
      <view class="section-title">操作选择</view>
      <view class="btn-row">
        <button 
          class="half-btn" 
          :class="{ active: currentOperation === 'start' }"
          @click="handleOperationSelect('start')"
        >
          开始椅旁
        </button>
        <button 
          class="half-btn" 
          :class="{ active: currentOperation === 'complete' }"
          @click="handleOperationSelect('complete')"
        >
          完成椅旁
        </button>
      </view>

      <view class="section-title">医生选择</view>
      <view class="picker-row" @click="showDoctorPicker = true">
        <view class="picker-label">医生</view>
        <view class="picker-value" :class="{ placeholder: !selectedDoctor }">
          {{ selectedDoctor || '请选择医生' }}
          <text class="arrow">›</text>
        </view>
      </view>

      <view class="section-title">戴牙状态</view>
      <view class="btn-row">
        <button 
          class="half-btn" 
          :class="{ active: wearStatus === 'today' }"
          @click="handleWearStatusSelect('today')"
        >
          当日戴牙
        </button>
        <button 
          class="half-btn" 
          :class="{ active: wearStatus === 'notToday' }"
          @click="handleWearStatusSelect('notToday')"
        >
          当日未戴牙
        </button>
      </view>

      <view class="btn-container">
        <button class="action-btn" @click="handleSubmit">确认提交</button>
      </view>
    </view>

    <u-picker
      :show="showDoctorPicker"
      :columns="doctorColumns"
      @confirm="onDoctorConfirm"
      @cancel="showDoctorPicker = false"
      @close="showDoctorPicker = false"
    ></u-picker>
  </view>
</template>

<script>
export default {
  data() {
    return {
      statusBarHeight: +(+uni.getSystemInfoSync().statusBarHeight + 10) + "px",
      currentOperation: "",
      selectedDoctor: "",
      wearStatus: "",
      showDoctorPicker: false,
      doctorColumns: [
        []
      ]
    };
  },

  onReady() {
    this.fetchDoctors();
  },

  onLoad: function (option) {},

  options: { styleIsolation: "shared" },

  methods: {
    fetchDoctors() {
      setTimeout(() => {
        this.doctorColumns = [
          ["张医生", "李医生", "王医生", "赵医生", "刘医生"]
        ];
      }, 300);
    },

    handleOperationSelect(type) {
      this.currentOperation = type;
    },

    handleWearStatusSelect(status) {
      this.wearStatus = status;
    },

    onDoctorConfirm(e) {
      this.selectedDoctor = e.value[0];
      this.showDoctorPicker = false;
    },

    handleSubmit() {
      if (!this.currentOperation) {
        uni.showToast({
          title: "请选择操作类型",
          icon: "none"
        });
        return;
      }
      if (!this.selectedDoctor) {
        uni.showToast({
          title: "请选择医生",
          icon: "none"
        });
        return;
      }
      if (!this.wearStatus) {
        uni.showToast({
          title: "请选择戴牙状态",
          icon: "none"
        });
        return;
      }

      const operationText = this.currentOperation === 'start' ? '开始椅旁' : '完成椅旁';
      const wearText = this.wearStatus === 'today' ? '当日戴牙' : '当日未戴牙';

      uni.showModal({
        title: "确认信息",
        content: `操作：${operationText}\n医生：${this.selectedDoctor}\n状态：${wearText}`,
        success: (res) => {
          if (res.confirm) {
            uni.showLoading({ title: "提交中..." });
            setTimeout(() => {
              uni.hideLoading();
              uni.showToast({
                title: "提交成功",
                icon: "success"
              });
              this.resetForm();
            }, 1000);
          }
        }
      });
    },

    resetForm() {
      this.currentOperation = "";
      this.selectedDoctor = "";
      this.wearStatus = "";
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

.section-title {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
  font-weight: 500;
}

.btn-row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 40rpx;

  .half-btn {
    flex: 1;
    height: 80rpx;
    background: #f8f8f8;
    color: #666;
    font-size: 30rpx;
    border-radius: 12rpx;
    border: 2rpx solid #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;

    &::after {
      border: none;
    }

    &.active {
      background: rgba(221, 82, 77, 0.1);
      border-color: #ff6b6b;
      color: #ff6b6b;
      font-weight: bold;
    }

    &:active {
      opacity: 0.8;
      transform: scale(0.98);
    }
  }
}

.picker-row {
  margin-bottom: 40rpx;
  
  .picker-label {
    font-size: 28rpx;
    color: #666;
    margin-bottom: 16rpx;
    font-weight: 500;
  }

  .picker-value {
    font-size: 30rpx;
    color: #ff6b6b;
    padding: 20rpx;
    background: rgba(221, 82, 77, 0.05);
    border: 2rpx solid rgba(221, 82, 77, 0.2);
    border-radius: 12rpx;
    min-height: 44rpx;
    line-height: 44rpx;
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

.btn-container {
  margin-top: 60rpx;

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

