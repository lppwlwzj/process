<template>
  <view class="content" :style="{ paddingTop: statusBarHeight }">
    <view class="page-title">椅旁操作</view>

    <view class="form-container">
      <view class="btn-row">
        <button class="icon-btn" :class="{ active: currentOperation === 'start' }" :disabled="!canStartChairside"
          @click="handleOperationSelect('start')">
          <view class="btn-icon">⏻</view>
          <view class="btn-text">开始椅旁</view>
        </button>
        <button class="icon-btn" :class="{ active: currentOperation === 'complete' }" :disabled="!canCompleteChairside"
          @click="handleOperationSelect('complete')">
          <view class="btn-icon">✓</view>
          <view class="btn-text">完成椅旁</view>
        </button>
      </view>

      <button class="full-btn" :class="{ disabled: isOperationInProgress }"
        @click="isOperationInProgress ? null : (showDoctorPicker = true)">
        <view class="btn-icon">⚕</view>
        <view class="btn-text">医生/椅旁技师：{{ selectedDoctor }}</view>
        <view class="arrow">›</view>
      </button>

      <view class="btn-row">
        <button class="icon-btn status-btn" :class="{ active: wearStatus === 'today' }"
          @click="handleWearStatusSelect('today')">
          <view class="btn-icon success">✓</view>
          <view class="btn-text">当日戴牙</view>
        </button>
        <button class="icon-btn status-btn" :class="{ active: wearStatus === 'notToday' }"
          @click="handleWearStatusSelect('notToday')">
          <view class="btn-icon error">✕</view>
          <view class="btn-text">当日未戴牙</view>
        </button>
      </view>

      <view class="btn-row">
        <!-- <button class="icon-btn upload-btn" @click="handleUploadAudio">
          <view class="btn-icon">🎤</view>
          <view class="btn-text">上传录音</view>
        </button> -->
        <button class="icon-btn upload-btn" @click="handleUploadVideo">
          <view class="btn-icon">▶</view>
          <view class="btn-text">上传视频</view>
        </button>
      </view>
    </view>

    <view class="yipan-button-container">
      <button class="yipan-action-btn" @click="goToYipan">
        <view class="btn-text">客户操作记录</view>
      </button>
    </view>

    <u-picker :show="showDoctorPicker" :columns="doctorColumns" @confirm="onDoctorConfirm" keyName="label"
      @cancel="showDoctorPicker = false" @close="showDoctorPicker = false"></u-picker>
  </view>
</template>

<script>
export default {
  data() {
    return {
      statusBarHeight: +(+uni.getSystemInfoSync().statusBarHeight + 10) + "px",
      customerId: null,
      customerName: "",
      form: {
        customer_id: null,
        customer_name: "",
        chairside_doctor: "",
        daily_wear_status: null,
        chairside_audio: "",
        chairside_video: "",
        start_time: null
      },
      currentOperation: "",
      selectedDoctor: "",
      wearStatus: "",
      showDoctorPicker: false,
      doctorColumns: [
        []
      ],
      canStartChairside: false,
      canCompleteChairside: false,
      isOperationInProgress: false
    };
  },

  onReady() {
    this.fetchDoctors();
    this.fetchYipanData();
  },

  onLoad: function (option) {
    if (option.customerId) {
      this.customerId = option.customerId;
      console.log("接收到客户ID:", this.customerId);
    }
    if (option.customerName) {
      this.customerName = option.customerName;
      console.log("接收到客户名称:", this.customerName);
    }
  },

  options: { styleIsolation: "shared" },

  methods: {
    async fetchDoctors() {
      try {
        const res = await this.$api.getUserList();
        if (res.code === 0 && res.re) {
          const list = res.re.filter(user => user.role === "医生椅旁技师").map(user => ({ key: user.usercount, label: user.username }));
          this.doctorColumns = [list];
        } else {
          console.error("获取用户列表失败:", res);
          this.doctorColumns = [
            []
          ];
        }
      } catch (err) {
        console.error("请求用户列表失败:", err);
        this.doctorColumns = [
          []
        ];
      }
    },

    async fetchYipanData() {
      if (!this.customerId) {
        console.log("缺少客户ID");
        return;
      }

      uni.showLoading({ title: "加载中..." });

      try {
        const res = await this.$api.getYipanDetail({ customer_id: this.customerId });
        console.log("获取椅旁数据:", res);
        if (res.code === 0 && res.re) {
          const data = res.re;

          this.selectedDoctor = data.chairside_doctor || "";
          this.isOperationInProgress = !!data.start_time;

          if (data.daily_wear_status !== null) {
            this.wearStatus = data.daily_wear_status === 1 ? 'today' : 'notToday';
          }

          this.form = {
            ...this.form,
            customer_id: this.customerId,
            customer_name: this.customerName,
            chairside_doctor: data.chairside_doctor || "",
            daily_wear_status: data.daily_wear_status,
            chairside_audio: data.chairside_audio || "",
            chairside_video: data.chairside_video || "",
            start_time: data.start_time
          };

          this.updateButtonStates();

          console.log("加载椅旁数据成功:", data);
        } else {
          console.log("暂无椅旁数据");
          this.form.customer_id = this.customerId;
          this.form.customer_name = this.customerName;
        }
      } catch (err) {
        console.error("获取椅旁数据失败:", err);
        uni.showToast({
          title: "加载失败",
          icon: "none"
        });
      } finally {
        uni.hideLoading();
      }
    },

    updateButtonStates() {
      if (this.isOperationInProgress) {
        this.canStartChairside = false;
        this.canCompleteChairside = true;
      } else {
        this.canStartChairside = !!this.selectedDoctor;
        this.canCompleteChairside = false;
      }
    },

    async handleOperationSelect(type) {
      if (type === 'start') {
        if (!this.canStartChairside) return;
        if (this.isOperationInProgress) {
          uni.showToast({
            title: `医生${this.selectedDoctor}正在进行椅旁操作，请先完成后再开始新的椅旁`,
            icon: "none",
            duration: 2500
          });
          return;
        }

        if (!this.selectedDoctor) {
          uni.showToast({
            title: "请先选择医生/椅旁技师",
            icon: "none"
          });
          return;
        }

        uni.showModal({
          title: "确认开始椅旁",
          content: `医生：${this.selectedDoctor}`,
          success: async (res) => {
            if (res.confirm) {
              uni.showLoading({ title: "提交中..." });
              try {
                const result = await this.$api.startChairside({
                  customer_id: this.customerId,
                  chairside_doctor: this.selectedDoctor
                });

                if (result.code === 0) {
                  uni.showToast({
                    title: "开始椅旁操作成功",
                    icon: "success"
                  });
                  this.isOperationInProgress = true;
                  this.currentOperation = 'start';
                  this.updateButtonStates();
                  await this.fetchYipanData();
                } else {
                  uni.showToast({
                    title: result.message || "开始椅旁操作失败",
                    icon: "none"
                  });
                }
              } catch (err) {
                console.error("开始椅旁操作失败:", err);
                uni.showToast({
                  title: err.message || "操作失败",
                  icon: "none"
                });
              } finally {
                uni.hideLoading();
              }
            }
          }
        });

      } else if (type === 'complete') {
        if (!this.canCompleteChairside) return;
        if (!this.isOperationInProgress) {
          uni.showToast({
            title: "尚未开始椅旁操作，无法完成",
            icon: "none"
          });
          return;
        }

        // if (!this.wearStatus) {
        //   uni.showToast({
        //     title: "请先选择当日戴牙状态",
        //     icon: "none"
        //   });
        //   return;
        // }

        const wearText = this.wearStatus === 'today' ? '当日戴牙' : '当日未戴牙';

        uni.showModal({
          title: "确认完成椅旁",
          content: `医生：${this.selectedDoctor}\n状态：${wearText}`,
          success: async (res) => {
            if (res.confirm) {
              uni.showLoading({ title: "提交中..." });
              try {
                const result = await this.$api.completeChairside({
                  customer_id: this.customerId
                });

                if (result.code === 0) {
                  uni.showToast({
                    title: "完成椅旁操作成功",
                    icon: "success"
                  });
                  this.isOperationInProgress = false;
                  this.currentOperation = '';
                  this.updateButtonStates();
                  this.resetForm();
                  await this.fetchYipanData();
                } else {
                  uni.showToast({
                    title: result.message || "完成椅旁操作失败",
                    icon: "none"
                  });
                }
              } catch (err) {
                console.error("完成椅旁操作失败:", err);
                uni.showToast({
                  title: err.message || "操作失败",
                  icon: "none"
                });
              } finally {
                uni.hideLoading();
              }
            }
          }
        });
      }
    },

    async handleWearStatusSelect(status) {
      this.wearStatus = status;
      this.form.daily_wear_status = status === 'today' ? 1 : 0;

      if (!this.customerId) {
        console.warn("缺少客户ID，无法更新戴牙状态");
        return;
      }

      try {
        const res = await this.$api.updateYipan({
          customer_id: this.customerId,
          daily_wear_status: this.form.daily_wear_status
        });

        if (res.code === 0) {
          console.log("戴牙状态更新成功");
        } else {
          console.error("戴牙状态更新失败:", res);
          uni.showToast({
            title: "更新失败",
            icon: "none"
          });
        }
      } catch (err) {
        console.error("更新戴牙状态失败:", err);
        uni.showToast({
          title: "更新失败",
          icon: "none"
        });
      }
    },

    onDoctorConfirm(e) {
      if (this.isOperationInProgress) {
        uni.showToast({
          title: "请先完成当前椅旁操作后再更换医生",
          icon: "none",
          duration: 2500
        });
        return;
      }

      this.selectedDoctor = e.value[0].key;
      this.form.chairside_doctor = e.value[0].key;
      this.showDoctorPicker = false;
      this.updateButtonStates();
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

      this.form.customer_id = this.customerId;
      this.form.customer_name = this.customerName;

      uni.showModal({
        title: "确认信息",
        content: `操作：${operationText}\n医生：${this.selectedDoctor}\n状态：${wearText}`,
        success: (res) => {
          if (res.confirm) {
            uni.showLoading({ title: "提交中..." });

            console.log("提交的表单数据:", this.form);

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
      this.wearStatus = "";
      this.form = {
        customer_id: this.customerId,
        customer_name: this.customerName,
        chairside_doctor: this.selectedDoctor,
        daily_wear_status: null,
        chairside_audio: "",
        chairside_video: "",
        start_time: null
      };
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

