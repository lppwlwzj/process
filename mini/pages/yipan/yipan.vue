<template>
  <view class="content" :style="{ paddingTop: statusBarHeight }">
    <view class="page-title">贴面质检</view>

    <button class="full-btn" :class="{ disabled: isOperationInProgress }" @click="openShapeInspectorPicker">
      <view class="btn-icon">⚕</view>
      <view class="btn-text">形态质检师：{{ selectedShapeInspectorDisplay || '请选择' }}</view>
      <view class="arrow">›</view>
    </button>

    <view class="form-container">
      <view class="btn-row">
        <button class="icon-btn status-btn" :class="{ active: edgeSeating === 'seated' }"
          @click="handleEdgeSeatingSelect('seated')">
          <view class="btn-icon success">✓</view>
          <view class="btn-text">边缘已就位</view>
        </button>
        <button class="icon-btn status-btn" :class="{ active: edgeSeating === 'notSeated' }"
          @click="handleEdgeSeatingSelect('notSeated')">
          <view class="btn-icon error">✕</view>
          <view class="btn-text">边缘未就位</view>
        </button>
      </view>
      <view class="btn-row">
        <button class="icon-btn status-btn" :class="{ active: occlusionStatus === 'normal' }"
          @click="handleOcclusionStatusSelect('normal')">
          <view class="btn-icon success">✓</view>
          <view class="btn-text">咬合正常</view>
        </button>
        <button class="icon-btn status-btn" :class="{ active: occlusionStatus === 'abnormal' }"
          @click="handleOcclusionStatusSelect('abnormal')">
          <view class="btn-icon error">✕</view>
          <view class="btn-text">咬合不正常</view>
        </button>
      </view>
      <view class="btn-row">
        <button class="icon-btn status-btn" :class="{ active: colorStatus === 'normal' }"
          @click="handleColorStatusSelect('normal')">
          <view class="btn-icon success">✓</view>
          <view class="btn-text">颜色质地正常</view>
        </button>
        <button class="icon-btn status-btn" :class="{ active: colorStatus === 'abnormal' }"
          @click="handleColorStatusSelect('abnormal')">
          <view class="btn-icon error">✕</view>
          <view class="btn-text">颜色质地不正常</view>
        </button>
      </view>
    </view>

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

      <button class="full-btn" :class="{ disabled: isOperationInProgress }" @click="openDoctorPicker">
        <view class="btn-icon">⚕</view>
        <view class="btn-text">医生/椅旁技师：{{ selectedDoctorDisplay }}</view>
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

      <view class="action-card note-card full-width-card">
        <view class="card-content note-content">
          <text class="card-label note-label">椅旁问题描述</text>
          <textarea class="progress-note-input" v-model="form.chairside_note" maxlength="1000"
            @blur="handleChairsideNoteBlur"></textarea>
        </view>
      </view>

      <view class="btn-row">
        <button class="icon-btn upload-btn" @click="handleUploadVideo">
          <view class="btn-icon">▶</view>
          <view class="btn-text">上传视频</view>
        </button>
      </view>
    </view>

    <!-- <view class="btn-row  full-width-card" style="min-height: 0;padding:36rpx" @click="handleUploadImage">
      <view class="card-content">
        <view class="card-text">
          <text class="card-label">上传图片</text>
        </view>
      </view>
    </view> -->

    <view class="btn-row">
      <button class="icon-btn upload-btn" @click="handleUploadImage">
        <!-- <view class="btn-icon">▶</view> -->
        <view class="btn-text">上传图片</view>
      </button>
    </view>

    <view class="yipan-action-btn" @click="goToYipan">客户进度表</view>

    <u-action-sheet :show="showDoctorPicker" :actions="doctorActions" title="选择医生/椅旁技师" closeOnClickOverlay
      @select="onDoctorSelect" @close="showDoctorPicker = false"></u-action-sheet>
    <u-action-sheet :show="showShapeInspectorPicker" :actions="doctorActions" title="选择形态质检师" closeOnClickOverlay
      @select="onShapeInspectorSelect" @close="showShapeInspectorPicker = false"></u-action-sheet>

    <u-modal :show="startModalShow" title="确认开始椅旁" :content="startModalContent" :showCancelButton="true"
      @confirm="onConfirmStartChairside" @cancel="startModalShow = false" @close="startModalShow = false"></u-modal>

    <u-modal :show="completeModalShow" title="确认完成椅旁" :content="completeModalContent" :showCancelButton="true"
      @confirm="onConfirmCompleteChairside" @cancel="completeModalShow = false"
      @close="completeModalShow = false"></u-modal>

    <u-modal :show="submitModalShow" title="确认信息" :content="submitModalContent" :showCancelButton="true"
      @confirm="onConfirmSubmit" @cancel="submitModalShow = false" @close="submitModalShow = false"></u-modal>

    <u-toast ref="uToast"></u-toast>
  </view>
</template>

<script>
import VideoList from '../../components/video-list.vue';

export default {
  components: {
    VideoList
  },
  data() {
    return {
      statusBarHeight: ((uni.getSystemInfoSync().statusBarHeight || 0) + 10) + "px",
      customerId: null,
      customerName: "",
      form: {
        customer_id: null,
        customer_name: "",
        shape_quality_inspector: "",
        chairside_doctor: "",
        daily_wear_status: null,
        edge_seating: null,
        occlusion_status: null,
        chairside_audio: "",
        chairside_video: "",
        yipan_image: "",
        chairside_note: "",
        start_time: null,
        color_status: null
      },
      currentOperation: "",
      selectedShapeInspector: "",
      selectedDoctor: "",
      wearStatus: "",
      edgeSeating: "",
      occlusionStatus: "",
      colorStatus: "",
      showDoctorPicker: false,
      showShapeInspectorPicker: false,
      doctorActions: [],
      canStartChairside: false,
      canCompleteChairside: false,
      isOperationInProgress: false,
      startModalShow: false,
      startModalContent: "",
      completeModalShow: false,
      completeModalContent: "",
      submitModalShow: false,
      submitModalContent: ""
    };
  },

  computed: {
    selectedShapeInspectorDisplay() {
      const d = this.doctorActions.find(item => item.key === this.selectedShapeInspector);
      return d ? d.name : this.selectedShapeInspector;
    },
    selectedDoctorDisplay() {
      const d = this.doctorActions.find(item => item.key === this.selectedDoctor);
      return d ? d.name : this.selectedDoctor;
    }
  },

  onReady() {
  },

  onLoad: function (option) {
    this.fetchDoctors();
    if (option.customerId) {
      this.customerId = option.customerId;
      this.fetchYipanData();

    }
    if (option.customerName) {
      this.customerName = option.customerName;
    }
  },

  options: { styleIsolation: "shared" },

  methods: {
    goToYipan() {
      uni.navigateTo({
        url: `/pages/index/index?customerId=${this.customerId}`
      });
    },

    async handleEdgeSeatingSelect(status) {
      this.edgeSeating = status;
      this.form.edge_seating = status === 'seated' ? 1 : 0;

      if (!this.customerId) {
        return;
      }

      try {
        const res = await this.$api.updateYipan({
          customer_id: this.customerId,
          edge_seating: this.form.edge_seating
        });

        if (res.code === 0) {
          console.log("边缘就位状态更新成功");
        } else {
          console.error("边缘就位状态更新失败:", res);
          this.$refs.uToast.show({ message: "更新失败" });
        }
      } catch (err) {
        console.error("更新边缘就位状态失败:", err);
        this.$refs.uToast.show({ message: "更新失败" });
      }
    },
    async handleColorStatusSelect(status) {
      this.colorStatus = status;
      this.form.color_status = status === 'normal' ? 1 : 0;
      if (!this.customerId) {
        return;
      }

      try {
        const res = await this.$api.updateYipan({
          customer_id: this.customerId,
          color_status: this.form.color_status
        });
        if (res.code === 0) {
          this.$refs.uToast.show({ message: "颜色质地更新成功", type: "success" });
        } else {
          console.error("颜色质地状态更新失败:", res);
          this.$refs.uToast.show({ message: "更新失败" });
        }
      } catch (err) {
        console.error("更新颜色质地状态失败:", err);
        this.$refs.uToast.show({ message: "更新失败" });
      }
    },

    async handleOcclusionStatusSelect(status) {
      this.occlusionStatus = status;
      this.form.occlusion_status = status === 'normal' ? 1 : 0;

      if (!this.customerId) {
        console.warn("缺少客户ID，无法更新咬合状态");
        return;
      }

      try {
        const res = await this.$api.updateYipan({
          customer_id: this.customerId,
          occlusion_status: this.form.occlusion_status
        });

        if (res.code === 0) {
          console.log("咬合状态更新成功");
        } else {
          console.error("咬合状态更新失败:", res);
          this.$refs.uToast.show({ message: "更新失败" });
        }
      } catch (err) {
        console.error("更新咬合状态失败:", err);
        this.$refs.uToast.show({ message: "更新失败" });
      }
    },

    async fetchDoctors() {
      try {
        const res = await this.$api.getUserList();
        if (res.code === 0 && res.re) {
          this.doctorActions = res.re
            .filter(user => user.role === "医生椅旁技师")
            .map(user => ({ name: user.username, key: user.usercount }));
        } else {
          console.error("获取用户列表失败:", res);
          this.doctorActions = [];
        }
      } catch (err) {
        console.error("请求用户列表失败:", err);
        this.doctorActions = [];
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

          this.selectedShapeInspector = data.shape_quality_inspector || "";
          this.selectedDoctor = data.chairside_doctor || "";
          this.isOperationInProgress = !!data.start_time;

          if (data.daily_wear_status !== null) {
            this.wearStatus = data.daily_wear_status === 1 ? 'today' : 'notToday';
          }

          if (data.edge_seating !== null) {
            this.edgeSeating = data.edge_seating === 1 ? 'seated' : 'notSeated';
          }

          if (data.occlusion_status !== null) {
            this.occlusionStatus = data.occlusion_status === 1 ? 'normal' : 'abnormal';
          }

          if (data.color_status !== null) {
            this.colorStatus = data.color_status === 1 ? 'normal' : 'abnormal';
          }

          this.form = {
            ...this.form,
            customer_id: this.customerId,
            customer_name: this.customerName,
            shape_quality_inspector: data.shape_quality_inspector || "",
            chairside_doctor: data.chairside_doctor || "",
            daily_wear_status: data.daily_wear_status,
            edge_seating: data.edge_seating,
            occlusion_status: data.occlusion_status,
            chairside_audio: data.chairside_audio || "",
            chairside_video: data.chairside_video || "",
            yipan_image: data.yipan_image || "",
            chairside_note: data.chairside_note || "",
            start_time: data.start_time,
            color_status: data.color_status
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
        this.$refs.uToast.show({ message: "加载失败" });
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
          this.$refs.uToast.show({
            message: `医生${this.selectedDoctorDisplay}正在进行椅旁操作，请先完成后再开始新的椅旁`,
            duration: 2500
          });
          return;
        }
        if (!this.selectedDoctor) {
          this.$refs.uToast.show({ message: "请先选择医生/椅旁技师" });
          return;
        }

        this.startModalContent = `医生：${this.selectedDoctorDisplay}`;
        this.startModalShow = true;

      } else if (type === 'complete') {
        if (!this.canCompleteChairside) return;
        if (!this.isOperationInProgress) {
          this.$refs.uToast.show({ message: "尚未开始椅旁操作，无法完成" });
          return;
        }

        // if (!this.wearStatus) {
        //   this.$refs.uToast.show({ message: "请先选择当日戴牙状态" });
        //   return;
        // }

        const wearText = this.wearStatus === 'today' ? '当日戴牙' : '当日未戴牙';
        this.completeModalContent = `医生：${this.selectedDoctorDisplay}\n状态：${wearText}`;
        this.completeModalShow = true;
      }
    },

    async onConfirmStartChairside() {
      this.startModalShow = false;
      uni.showLoading({ title: "提交中..." });
      try {
        const result = await this.$api.startChairside({
          customer_id: this.customerId,
          chairside_doctor: this.selectedDoctor
        });
        if (result.code === 0) {
          this.$refs.uToast.show({ message: "开始椅旁操作成功", type: "success" });
          this.isOperationInProgress = true;
          this.currentOperation = 'start';
          this.updateButtonStates();
          await this.fetchYipanData();
        } else {
          this.$refs.uToast.show({ message: result.message || "开始椅旁操作失败" });
        }
      } catch (err) {
        console.error("开始椅旁操作失败:", err);
        this.$refs.uToast.show({ message: err.message || "操作失败" });
      } finally {
        uni.hideLoading();
      }
    },

    async onConfirmCompleteChairside() {
      this.completeModalShow = false;
      uni.showLoading({ title: "提交中..." });
      try {
        const result = await this.$api.completeChairside({
          customer_id: this.customerId
        });
        if (result.code === 0) {
          this.$refs.uToast.show({ message: "完成椅旁操作成功", type: "success" });
          this.isOperationInProgress = false;
          this.currentOperation = '';
          this.updateButtonStates();
          this.resetForm();
          await this.fetchYipanData();
        } else {
          this.$refs.uToast.show({ message: result.message || "完成椅旁操作失败" });
        }
      } catch (err) {
        console.error("完成椅旁操作失败:", err);
        this.$refs.uToast.show({ message: err.message || "操作失败" });
      } finally {
        uni.hideLoading();
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
          this.$refs.uToast.show({ message: "更新失败" });
        }
      } catch (err) {
        console.error("更新戴牙状态失败:", err);
        this.$refs.uToast.show({ message: "更新失败" });
      }
    },

    openDoctorPicker() {
      if (this.isOperationInProgress) return;
      if (!this.doctorActions || !this.doctorActions.length) {
        this.$refs.uToast.show({ message: "医生列表加载中，请稍候" });
        return;
      }
      this.showDoctorPicker = true;
    },

    openShapeInspectorPicker() {
      if (this.isOperationInProgress) return;
      if (!this.doctorActions || !this.doctorActions.length) {
        this.$refs.uToast.show({ message: "医生列表加载中，请稍候" });
        return;
      }
      this.showShapeInspectorPicker = true;
    },

    async onShapeInspectorSelect(item) {
      if (this.isOperationInProgress) {
        this.$refs.uToast.show({
          message: "请先完成当前椅旁操作后再更换形态质检师",
          duration: 2500
        });
        this.showShapeInspectorPicker = false;
        return;
      }
      this.selectedShapeInspector = item.key;
      this.form.shape_quality_inspector = item.key;
      this.showShapeInspectorPicker = false;

      if (!this.customerId) return;
      try {
        const res = await this.$api.updateYipan({
          customer_id: this.customerId,
          shape_quality_inspector: item.key
        });
        if (res.code !== 0) {
          this.$refs.uToast.show({ message: res.message || "更新失败" });
        }
      } catch (err) {
        console.error("更新形态质检师失败:", err);
        this.$refs.uToast.show({ message: "更新失败" });
      }
    },

    onDoctorSelect(item) {
      if (this.isOperationInProgress) {
        this.$refs.uToast.show({
          message: "请先完成当前椅旁操作后再更换医生",
          duration: 2500
        });
        this.showDoctorPicker = false;
        return;
      }
      this.selectedDoctor = item.key;
      this.form.chairside_doctor = item.key;
      this.showDoctorPicker = false;
      this.updateButtonStates();
    },

    handleSubmit() {
      if (!this.currentOperation) {
        this.$refs.uToast.show({ message: "请选择操作类型" });
        return;
      }
      if (!this.selectedDoctor) {
        this.$refs.uToast.show({ message: "请选择医生" });
        return;
      }
      if (!this.wearStatus) {
        this.$refs.uToast.show({ message: "请选择戴牙状态" });
        return;
      }

      const operationText = this.currentOperation === 'start' ? '开始椅旁' : '完成椅旁';
      const wearText = this.wearStatus === 'today' ? '当日戴牙' : '当日未戴牙';

      this.form.customer_id = this.customerId;
      this.form.customer_name = this.customerName;
      this.submitModalContent = `操作：${operationText}\n医生：${this.selectedDoctorDisplay}\n状态：${wearText}`;
      this.submitModalShow = true;
    },

    onConfirmSubmit() {
      this.submitModalShow = false;
      uni.showLoading({ title: "提交中..." });
      console.log("提交的表单数据:", this.form);
      setTimeout(() => {
        uni.hideLoading();
        this.$refs.uToast.show({ message: "提交成功", type: "success" });
        this.resetForm();
      }, 1000);
    },

    resetForm() {
      const chairsideNote = this.form.chairside_note;
      this.currentOperation = "";
      this.wearStatus = "";
      this.edgeSeating = "";
      this.occlusionStatus = "";
      this.colorStatus = "";
      this.form = {
        customer_id: this.customerId,
        customer_name: this.customerName,
        shape_quality_inspector: this.selectedShapeInspector,
        chairside_doctor: this.selectedDoctor,
        daily_wear_status: null,
        edge_seating: null,
        occlusion_status: null,
        chairside_audio: "",
        chairside_video: "",
        yipan_image: "",
        chairside_note: chairsideNote,
        start_time: null,
        color_status: null
      };
    },

    async handleChairsideNoteBlur() {
      if (!this.customerId) {
        return;
      }

      try {
        const res = await this.$api.updateYipan({
          customer_id: this.customerId,
          chairside_note: this.form.chairside_note || ""
        });

        if (res.code !== 0) {
          this.$refs.uToast.show({ message: "椅旁问题描述保存失败" });
        }
      } catch (err) {
        console.error("保存椅旁问题描述失败:", err);
        this.$refs.uToast.show({ message: "椅旁问题描述保存失败" });
      }
    },

    handleUploadAudio() {
      this.$refs.uToast.show({ message: "上传录音功能" });
    },

    handleUploadImage() {
      let imageSourceType = ['album', 'camera'];
      // #ifdef H5
      imageSourceType = ['album'];
      // #endif
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: imageSourceType,
        success: (res) => {
          if (res.tempFilePaths && res.tempFilePaths.length > 0) {
            this.uploadImageToCOS(res.tempFilePaths[0]);
          } else {
            this.$refs.uToast.show({ message: "未选择图片" });
          }
        },
        fail: (err) => {
          console.error("选择图片失败:", err);
          if (err.errMsg !== 'chooseImage:fail cancel') {
            this.$refs.uToast.show({ message: "选择图片失败" });
          }
        }
      });
    },
    uploadImageToCOS(imagePath) {
      uni.showLoading({ title: "上传中..." });

      const userInfo = uni.getStorageSync("userInfo");
      const timestamp = Date.now();
      const fileName = `image_${timestamp}_${this.customerId || 'unknown'}.jpg`;
      uni.uploadFile({
        url: "http://115.159.109.106/api/upload",
        filePath: imagePath,
        name: "file",
        header: {
          Authorization: userInfo?.token || ""
        },
        formData: {
          id: this.customerId || "",
          name: fileName
        },
        success: (res) => {
          uni.hideLoading();
          if (res?.statusCode === 401) {
            uni.removeStorageSync("userInfo");
            uni.redirectTo({
              url: "/pages/login/login"
            });
          } else if (res?.statusCode === 200) {
            const data = JSON.parse(res.data);
            if (data.code === 0) {
              const imageUrl = data.re?.img_url;

              if (imageUrl && this.customerId) {
                this.updateImageToDatabase(imageUrl);
              }
            } else {
              this.$refs.uToast.show({ message: data.message || "上传失败" });
            }
          } else {
            this.$refs.uToast.show({ message: "上传失败" });
          }
        },
        fail: (err) => {
          uni.hideLoading();
          console.error("上传图片失败:", err);
          this.$refs.uToast.show({ message: "上传失败" });
        }
      });
    },
    async updateImageToDatabase(imageUrl) {
      try {
        const currentImages = this.form.yipan_image || '';
        let newImages = '';
        if (currentImages) {
          newImages = currentImages + ',' + imageUrl;
        } else {
          newImages = imageUrl;
        }
        const res = await this.$api.updateYipan({
          customer_id: this.customerId,
          yipan_image: newImages
        });
        if (res.code === 0) {
          this.$refs.uToast.show({ message: "上传成功", type: "success" });
          await this.fetchYipanData();
        } else {
          this.$refs.uToast.show({ message: res.message || "更新失败" });
        }
      } catch (err) {
        console.error("更新图片到数据库失败:", err);
        this.$refs.uToast.show({ message: "更新失败" });
      }
    },
    handleUploadVideo() {
      uni.chooseVideo({
        sourceType: ['camera', 'album'],
        maxDuration: 60,
        camera: 'back',
        success: (res) => {
          this.uploadVideoToCOS(res.tempFilePath);
        },
        fail: (err) => {
          console.error("选择视频失败:", err);
          if (err.errMsg !== 'chooseVideo:fail cancel') {
            this.$refs.uToast.show({ message: "选择视频失败" });
          }
        }
      });
    },
    uploadVideoToCOS(videoPath) {
      uni.showLoading({ title: "上传中..." });

      const userInfo = uni.getStorageSync("userInfo");
      const timestamp = Date.now();
      const fileName = `video_${timestamp}_${this.customerId || 'unknown'}.mp4`;

      uni.uploadFile({
        // url: "https://gdcasa.cn/api/upload",
        url: "http://115.159.109.106/api/upload",
        filePath: videoPath,
        name: "file",
        header: {
          Authorization: userInfo?.token || ""
        },
        formData: {
          id: this.customerId || "",
          name: fileName
        },
        success: (res) => {
          uni.hideLoading();
          if (res?.statusCode === 401) {
            uni.removeStorageSync("userInfo");
            uni.redirectTo({
              url: "/pages/login/login"
            });
          } else if (res?.statusCode === 200) {
            const data = JSON.parse(res.data);
            if (data.code === 0) {
              const videoUrl = data.re?.img_url;

              if (videoUrl && this.customerId) {
                this.updateVideoToDatabase(videoUrl);
              }
            } else {
              this.$refs.uToast.show({ message: data.message || "上传失败" });
            }
          } else {
            this.$refs.uToast.show({ message: "上传失败" });
          }
        },
        fail: (err) => {
          uni.hideLoading();
          console.error("上传视频失败:", err);
          this.$refs.uToast.show({ message: "上传失败" });
        }
      });
    },
    async updateVideoToDatabase(videoUrl) {
      try {
        // 获取当前已有的视频URL
        const currentVideos = this.form.chairside_video || '';

        // 用逗号拼接新视频URL（追加而不是覆盖）
        let newVideos = '';
        if (currentVideos) {
          // 如果已有视频，追加到后面
          newVideos = currentVideos + ',' + videoUrl;
        } else {
          // 如果没有视频，直接使用新URL
          newVideos = videoUrl;
        }

        console.log("当前视频:", currentVideos);
        console.log("新视频:", videoUrl);
        console.log("合并后:", newVideos);

        const res = await this.$api.updateChairsideVideo({
          customer_id: this.customerId,
          chairside_video: newVideos
        });

        if (res.code === 0) {
          this.$refs.uToast.show({ message: "上传成功", type: "success" });
          await this.fetchYipanData();
        } else {
          this.$refs.uToast.show({ message: res.message || "更新失败" });
        }
      } catch (err) {
        console.error("更新视频到数据库失败:", err);
        this.$refs.uToast.show({ message: "更新失败" });
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import "./indes.scss";
</style>

