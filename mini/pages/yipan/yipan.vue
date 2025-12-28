<template>
  <view class="content" :style="{ paddingTop: statusBarHeight }">
    <view class="page-title">椅旁操作</view>

    <view class="form-container">
      <view class="btn-row">
        <button 
class="icon-btn"
          :class="{ active: currentOperation === 'start' }"
          @click="handleOperationSelect('start')"
        >
          <view class="btn-icon">⏻</view>
          <view class="btn-text">开始椅旁</view>
        </button>
        <button 
class="icon-btn"
          :class="{ active: currentOperation === 'complete' }"
          @click="handleOperationSelect('complete')"
        >
          <view class="btn-icon">✓</view>
          <view class="btn-text">完成椅旁</view>
        </button>
      </view>

      <button class="full-btn" @click="showDoctorPicker = true">
        <view class="btn-icon">⚕</view>
        <view class="btn-text">{{ selectedDoctor || '医生/椅旁技师' }}</view>
        <view class="arrow">›</view>
      </button>

      <view class="btn-row">
        <button 
class="icon-btn status-btn"
          :class="{ active: wearStatus === 'today' }"
          @click="handleWearStatusSelect('today')"
        >
          <view class="btn-icon success">✓</view>
          <view class="btn-text">当日戴牙</view>
        </button>
        <button 
class="icon-btn status-btn"
          :class="{ active: wearStatus === 'notToday' }"
          @click="handleWearStatusSelect('notToday')"
        >
          <view class="btn-icon error">✕</view>
          <view class="btn-text">当日未戴牙</view>
        </button>
      </view>

      <view class="btn-row">
        <button class="icon-btn upload-btn" @click="handleUploadAudio">
          <view class="btn-icon">🎤</view>
          <view class="btn-text">上传录音</view>
        </button>
        <button class="icon-btn upload-btn" @click="handleUploadVideo">
          <view class="btn-icon">▶</view>
          <view class="btn-text">上传视频</view>
        </button>
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
    },

    handleUploadAudio() {
      uni.showToast({
        title: "上传录音功能",
        icon: "none"
      });
    },

    handleUploadVideo() {
      uni.showToast({
        title: "上传视频功能",
        icon: "none"
      });
    }
  }
};
</script>

<style lang="scss" scoped>
@import "./indes.scss";
</style>

