<template>
  <view class="content" :style="{ paddingTop: statusBarHeight }">
    <view class="page-title">当前进度： <text class="progress-label" v-show="progressLabel">（{{ progressLabel }}）</text>
    </view>

    <view class="preparation-time">
      <!-- <view class="preparation-time-text">备牙时间:{{
        formatDateSimple(form.preparation_time)
}}</view> -->
      备牙时间:{{
        formatDateSimple(form.preparation_time)
      }}
    </view>

    <view class="form-container">
      <view class="customer-header">
        <text class="customer-name">{{ form.customer_name }}</text>
        <view>
          <div class="wear-time-label">戴牙时间: </div>
          <!-- <div class="wear-time-value">10-01</div> -->
          <div class="wear-time-value">{{ formatDateSimple(form.wear_time) }}</div>
        </view>
      </view>

      <view class="action-grid">
        <view class="action-card" :class="{ selected: progressLabel }" @click="showProgressPicker = true">
          <view class="card-icon-wrapper" :class="{ selected: progressLabel }">
            <text class="card-icon">⏱</text>
          </view>
          <view class="card-content">
            <view class="card-text">
              <text class="card-label">{{ progressLabel || '进度选择' }}</text>
              <!-- <text class="card-selected-value" v-if="progressLabel">{{ progressLabel }}</text> -->
            </view>
            <text class="card-arrow">›</text>
          </view>
        </view>

        <view class="action-card" :class="{ selected: technicianLabel }" @click="openTechnicianPicker">
          <view class="card-icon-wrapper" :class="{ selected: technicianLabel }">
            <text class="card-icon">👨‍🔧</text>
          </view>
          <view class="card-content">
            <view class="card-text">
              <text class="card-label">{{ technicianLabel || '技师选择' }}</text>
              <!-- <text class="card-selected-value" v-if="technicianLabel">{{ technicianLabel }}</text> -->
            </view>
            <text class="card-arrow">›</text>
          </view>
        </view>
        <!-- <view class="action-card note-card" v-for="(item, index) in getMaterialsList()" :key="index">
          <view class="card-content note-content">
            <text class="note-value" :class="{ 'note-empty': !item.material }">
              {{ getMaterialLabel(item.material) || '暂无材料' }}
            </text>
          </view>
          <view class="card-content note-content" style="margin-top: 8px;">
            <text class="note-value" :class="{ 'note-empty': !item.quantity }">{{ item.quantity || '暂无数量' }}颗</text>
          </view>
        </view> -->
        <!--    <view class="action-card note-card" v-if="getMaterialsList().length === 0">
          <view class="card-content note-content">
            <text class="card-label note-label">材料</text>
            <text class="note-value note-empty">暂无材料</text>
          </view>
          <view class="card-content note-content" style="margin-top: 8px;">
            <text class="card-label note-label">数量</text>
            <text class="note-value note-empty">暂无数量</text>
          </view>
        </view> -->

        <view class="action-card" @click="handleStart"
          :class="{ disabled: !form.progress || !form.technician || form.progress === 'not_started' }">
          <view class="card-icon-wrapper">
            <text class="card-icon">⚡</text>
          </view>
          <view class="card-content">
            <view class="card-text">
              <text class="card-label">开始操作</text>
            </view>
          </view>
        </view>

        <view class="action-card" @click="handleUploadVideo">
          <view class="card-icon-wrapper">
            <text class="card-icon">▶</text>
          </view>
          <view class="card-content">
            <view class="card-text">
              <text class="card-label">上传视频</text>
            </view>
          </view>
        </view>

        <view class="action-card  full-width-card" style="min-height: 0;padding:36rpx" @click="handleUploadImage">
          <view class="card-content">
            <view class="card-text">
              <text class="card-label">上传图片</text>
            </view>
          </view>
        </view>


        <view class="action-card note-card full-width-card">
          <view class="card-content note-content">
            <text class="card-label note-label">文字备注</text>
            <text class="note-value" :class="{ 'note-empty': !form.customer_note }">{{ form.customer_note || '暂无备注'
              }}</text>
          </view>

        </view>
        <view class="action-card note-card full-width-card">
          <view class="card-content note-content">
            <video-list label="视频备注"
              :videos="form.type === '工厂' ? form.factory_web_video : form.web_video || ''"></video-list>
          </view>
        </view>
        <view class="action-card note-card full-width-card">
          <view class="card-content note-content">
            <images-list label="图片备注"
              :images="form.type === '工厂' ? form.factory_image : form.image || ''"></images-list>
          </view>
        </view>
        <!-- 

        <view class="action-card image-card" @click="previewImage">
          <view class="image-wrapper" v-if="form.image">
            <image :src="form.image" mode="aspectFill" class="card-image"></image>
          </view>
          <view class="no-image" v-else>
            <text class="no-image-icon">📷</text>
            <text class="no-image-text">暂无图片</text>
          </view>
        </view> -->

        <!-- <view class="action-card">
          <view class="card-icon-wrapper">
            <text class="card-icon">🎙</text>
          </view>
          <view class="card-content">
            <view class="card-text">
              <text class="card-label">上传录音</text>
            </view>
          </view>
        </view> -->



      </view>

      <view class="yipan-action-btn" @click="goToYipan">贴面质检/椅旁操作</view>

    </view>

    <u-action-sheet :show="showProgressPicker" :actions="progressActions" title="选择进度"
      closeOnClickOverlay @select="onProgressSelect" @close="showProgressPicker = false"></u-action-sheet>

    <u-action-sheet :show="showTechnicianPicker" :actions="technicianActions" title="选择技工师"
      closeOnClickOverlay @select="onTechnicianSelect" @close="showTechnicianPicker = false"></u-action-sheet>

    <u-modal :show="confirmModalShow" title="确认操作" content="确定要开始操作吗？" :showCancelButton="true"
      @confirm="onConfirmStart" @cancel="confirmModalShow = false" @close="confirmModalShow = false"></u-modal>

    <u-modal :show="successModalShow" title="成功" :content="successModalContent" :showCancelButton="false"
      @confirm="successModalShow = false" @close="successModalShow = false"></u-modal>

    <u-toast ref="uToast"></u-toast>
  </view>
</template>

<script>
import VideoList from '../../components/video-list.vue';
import ImagesList from '../../components/images-list.vue';
import config from '@/common/config';


export const materialOptions = [
  { value: "guochan_quancitiemin", label: "国产全瓷贴面" },
  { value: "derendun_zhugongzhuguangci", label: "珠光瓷" },
  { value: "deguo_weilan_lengchaici", label: "冷釉瓷" },
  { value: "delanxi_quanshougongchaobaocaigao", label: "全手工超薄" },
  { value: "ruishiweidian_candianci", label: "睿典瓷" },
  { value: "deguo_aidisiteyanghuagao", label: "爱迪特氧化锆" },
  { value: "deguo_weilandeyanghuagao", label: "VITA氧化锆" },
  { value: "meiguo_shidan_lawawayanghuagao", label: "阿曼吉尔巴赫拉瓦氧化锆" },
  { value: "quanshougongdalilavayanghuagao", label: "人工定制lava氧化锆" },
  { value: "ruishiweidian_shidiancandianshuibozhanciyanghuagao", label: "睿典钻瓷氧化锆" }
]


export default {
  components: {
    VideoList,
    ImagesList
  },
  data() {
    return {
      statusBarHeight: ((uni.getSystemInfoSync().statusBarHeight || 0) + 10) + "px",
      customerId: null,
      cacheLastProgress: null, // 缓存上次选择的进度
      cacheLastTechnician: null, // 缓存上次选择的技工师
      form: {
        customer_id: null,
        customer_name: "",
        wear_time: "",
        customer_note: "",
        technician_video: "",
        factory_technician_video: "",
        factory_web_video: "",
        factory_image: "",
        type: "",
        image: "",
        web_video: "",
        preparation_time: "",
        progress: "",
        technician: "",
        materials: [],
        remark: "",
        doctor: "",
        qr_code: "",
        process_id: null,
        technician_audio: "",
        process_created_at: "",
        process_updated_at: "",

        edge_seating: null,
        occlusion_status: null
      },
      progressLabel: "",
      technicianLabel: "",
      showProgressPicker: false,
      showTechnicianPicker: false,
      isSubmitting: false,
      confirmModalShow: false,
      successModalShow: false,
      successModalContent: "",
      progressColumns: [
        [
          { key: "not_started", label: "未开始" },
          { key: "guan_mo", label: "灌模完成" },
          { key: "xiu_mo", label: "修模完成" },
          { key: "cad_design", label: "CAD设计" },
          { key: "qie_xue", label: "切削完成" },
          { key: "che_jin", label: "车金完成" },
          { key: "shang_ci", label: "上瓷完成" },
          { key: "che_ci", label: "车瓷完成" },
          { key: "shang_you", label: "上釉完成" },
          { key: "completed", label: "戴牙结束" }
        ]
      ],
      technicianActions: []
    };
  },

  computed: {
    progressActions() {
      return (this.progressColumns[0] || []).map(item => ({ name: item.label, key: item.key }));
    }
  },

  async onReady() {
    // await this.fetchData();

  },

  onLoad: async function (option) {
    // 小程序环境直接从 option 获取
    if (option.scene) {
      console.log("option.scene", option.scene);
      this.customerId = option.scene;
      await this.fetchData();
    } else if (option.customerId) {
      console.log("option.customerId", option.customerId);
      this.customerId = option.customerId;
      await this.fetchData();
    } else {
      // #ifdef H5
      const urlParams = new URLSearchParams(window.location.search);
      let customerIdFromUrl = urlParams.get('customerId') || urlParams.get('customer_id');
      if (!customerIdFromUrl && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
        customerIdFromUrl = hashParams.get('customerId') || hashParams.get('customer_id');
      }
      if (customerIdFromUrl) {
        this.customerId = customerIdFromUrl;
        await this.fetchData();
      }
      // #endif
    }
  },

  options: { styleIsolation: "shared" },

  methods: {
    getMaterialsList() {
      if (!this.form.materials || !Array.isArray(this.form.materials) || this.form.materials.length === 0) {
        // 如果没有 materials，返回一个空数组（不显示任何卡片）
        return []
      }
      return this.form.materials
    },
    getMaterialLabel(materialValue) {
      if (!materialValue) return "-"

      const values = typeof materialValue === 'string' ? materialValue.split(',') : materialValue
      const labels = values.map(val => {
        const material = materialOptions.find(m => m.value === val)
        return material ? material.label : val
      })

      return labels.join(', ')
    },
    async fetchData() {
      console.log("this.customerId", this.customerId);
      if (!this.customerId) {
        this.$refs.uToast.show({ message: "缺少客户ID" });
        return;
      }

      uni.showLoading({ title: "加载中..." });

      try {
        const res = await this.$api.getProcessDetailByCustomerId({ id: this.customerId });
        if (res.code === 0 && res.re) {
          // 处理 materials 字段，确保是数组格式
          let materials = [];
          if (res.re.materials) {
            if (typeof res.re.materials === 'string') {
              try {
                materials = JSON.parse(res.re.materials);
              } catch (e) {
                console.error("解析 materials JSON 失败:", e);
                materials = [];
              }
            } else if (Array.isArray(res.re.materials)) {
              materials = res.re.materials;
            }
          }

          this.form = {
            ...this.form,
            ...res.re,
            materials: materials
          }
          await this.fetchTechnicians(this.form.type);
          this.cacheLastProgress = this.form.progress;
          this.cacheLastTechnician = this.form.technician;
          this.progressLabel = this.progressColumns[0].find(item => item.key === this.form.progress)?.label || "";
          this.technicianLabel = (this.technicianActions.find(item => item.key === this.form.technician) || {}).name || "";
        } else {
          console.error("获取客户详情失败:", res);
          this.$refs.uToast.show({ message: "获取客户信息失败" });
        }
      } catch (err) {
        console.error("请求客户详情失败:", err);
        this.$refs.uToast.show({ message: "加载失败" });
      } finally {
        uni.hideLoading();
      }
    },
    handleUploadVideo() {
      // #ifdef H5
      const videoSourceType = ['album'];
      // #endif
      // #ifndef H5
      const videoSourceType = ['camera', 'album'];
      // #endif
      uni.chooseVideo({
        sourceType: videoSourceType,
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
    handleUploadImage() {
      // #ifdef H5
      const imageSourceType = ['album'];
      // #endif
      // #ifndef H5
      const imageSourceType = ['album', 'camera'];
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
      console.log("imagePath", imagePath);
      uni.showLoading({ title: "上传中..." });

      const userInfo = uni.getStorageSync("userInfo");
      const timestamp = Date.now();
      const fileName = `image_${timestamp}_${this.customerId || 'unknown'}.jpg`;
      uni.uploadFile({
        // url: "https://gdcasa.cn/api/upload",
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
    uploadVideoToCOS(videoPath) {
      uni.showLoading({ title: "上传中..." });

      const userInfo = uni.getStorageSync("userInfo");
      const timestamp = Date.now();
      const fileName = `video_${timestamp}_${this.customerId || 'unknown'}.mp4`;

      uni.uploadFile({
        // url: "https://gdcasa.cn/api/upload",
        url: "http://115.159.109.106/api/upload",
        // url: "http://127.0.0.1:3006/api/upload",
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
    async updateImageToDatabase(imageUrl) {
      try {
        console.log("imageUrl", imageUrl);
        const currentImages = this.form.type === '工厂' ? this.form.factory_mini_image : this.form.mini_image || '';
        let newImages = '';
        if (currentImages) {
          newImages = currentImages + ',' + imageUrl;
        } else {
          newImages = imageUrl;
        }
        console.log("newImages", this.form, newImages);
        const requestFn = this.$api.updateMiniImage;
        const data = this.form.type === '工厂' ? { customer_id: this.customerId, factory_mini_image: newImages } : { customer_id: this.customerId, mini_image: newImages };
        const res = await requestFn(data);
        if (res.code === 0) {
          this.$refs.uToast.show({ message: "上传成功", type: "success" });
          await this.fetchData();
        } else {
          this.$refs.uToast.show({ message: res.message || "更新失败" });
        }
      } catch (err) {
        console.error("更新图片到数据库失败:", err);
        this.$refs.uToast.show({ message: "更新失败" });
      }
    },
    async updateVideoToDatabase(videoUrl) {
      try {
        // 获取当前已有的视频URL
        const currentVideos = this.form.type === '工厂' ? this.form.factory_technician_video : this.form.technician_video || '';

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
        const requestFn = this.form.type === '工厂' ? this.$api.updateFactoryTechnicianVideo : this.$api.updateTechnicianVideo;
        const data = this.form.type === '工厂' ? { customer_id: this.customerId, factory_technician_video: newVideos } : { customer_id: this.customerId, technician_video: newVideos };
        const res = await requestFn(data);

        if (res.code === 0) {
          this.$refs.uToast.show({ message: "上传成功", type: "success" });
          await this.fetchData();
        } else {
          this.$refs.uToast.show({ message: res.message || "更新失败" });
        }
      } catch (err) {
        console.error("更新视频到数据库失败:", err);
        this.$refs.uToast.show({ message: "更新失败" });
      }
    },

    async fetchTechnicians(type) {
      try {
        const res = await this.$api.getUserList();
        if (res.code === 0 && res.re) {
          const role = type === "工厂" ? "工厂技师" : "技师";
          this.technicianActions = res.re.filter(user => user.role === role).map(user => ({ name: user.username, key: user.usercount }));
        } else {
          console.error("获取用户列表失败:", res);
          this.technicianActions = [];
        }
      } catch (err) {
        console.error("请求用户列表失败:", err);
        this.technicianActions = [];
      }
    },

    onProgressSelect(item) {
      this.form.progress = item.key;
      this.progressLabel = item.name;
      this.showProgressPicker = false;
    },

    openTechnicianPicker() {
      if (!this.technicianActions || !this.technicianActions.length) {
        this.$refs.uToast.show({ message: "技工师加载中，请稍候" });
        return;
      }
      this.showTechnicianPicker = true;
    },

    onTechnicianSelect(item) {
      this.form.technician = item.key;
      this.technicianLabel = item.name;
      this.showTechnicianPicker = false;
    },
    goToYipan() {
      uni.navigateTo({
        url: "/pages/yipan/yipan?customerId=" + this.customerId
      });
    },

    formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}年${month}月${day}日`;
    },

    formatDateSimple(dateStr) {
      if (!dateStr) return '';
      const date = dateStr.split('-');
      if (!date.length) return '';
      return `${date[0]}月${date[1]}号`;
      // const chinese = moment(dateStr)
      //   .format('MM-DD')          // 先拿到 “10-01”
      //   .replace(/(\d+)-(\d+)/, '$1月$2号'); // → “10月01号”
      // return chinese;
    },

    previewImage() {
      if (!this.form.image) {
        this.$refs.uToast.show({ message: "暂无图片" });
        return;
      }
      uni.previewImage({
        urls: [this.form.image],
        current: 0
      });
    },

    handleStart() {
      if (this.isSubmitting) {
        this.$refs.uToast.show({ message: "请勿重复提交" });
        return;
      }

      if (!this.form.progress) {
        this.$refs.uToast.show({ message: "请选择进度" });
        return;
      }

      const newProgress = this.form.progress;
      const newTechnician = this.form.technician;

      console.log("this.progressLabel", this.cacheLastProgress, this.form.progress);
      if (this.progressLabel === newProgress || newProgress === "not_started") {
        return;
      }
      if (!this.form.technician) {
        this.$refs.uToast.show({ message: "请选择技工师" });
        return;
      }

      this.confirmModalShow = true;
    },

    async onConfirmStart() {
      this.confirmModalShow = false;
      if (this.isSubmitting) return;
      const newProgress = this.form.progress;
      const newTechnician = this.form.technician;
      this.isSubmitting = true;
      const now = new Date();
      const startTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      try {
        const result = await this.$api.addProcessHistory({
          customer_id: this.customerId,
          customer_name: this.form.customer_name,
          progress: newProgress,
          technician: newTechnician,
          start_time: startTime
        });
        uni.hideLoading();
        if (result.code === 0) {
          const { operation_count, duration_minutes, previous_progress, previous_technician } = result.re;
          let message = "操作记录成功！\n";
          message += `\n这是第 ${operation_count} 次操作`;
          if (previous_progress && previous_technician) {
            message += `\n上次进度：${previous_progress}`;
            message += `\n上次技工师：${previous_technician}`;
            if (duration_minutes !== null) {
              const hours = Math.floor(duration_minutes / 60);
              const minutes = duration_minutes % 60;
              message += `\n距离上次：${hours > 0 ? hours + '小时' : ''}${minutes}分钟`;
            }
          } else {
            message += "\n这是第一次操作记录";
          }
          this.successModalContent = message;
          this.successModalShow = true;
          this.cacheLastProgress = newProgress;
          this.cacheLastTechnician = newTechnician;
        } else {
          this.$refs.uToast.show({ message: result.message || "操作失败" });
        }
      } catch (err) {
        uni.hideLoading();
        console.error("添加操作记录失败:", err);
        this.$refs.uToast.show({ message: "操作失败" });
      } finally {
        this.isSubmitting = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>
