<template>
  <view class="content" :style="{ paddingTop: statusBarHeight }">
    <view class="page-title">当前进度： <text class="progress-label" v-show="progressLabel">（{{ progressLabel }}）</text>
    </view>

    <view class="preparation-time">
      <text class="preparation-time-text">备牙时间:{{
        formatDateSimple(form.preparation_time)
        }}</text>
    </view>

    <view class="form-container">
      <view class="customer-header">
        <text class="customer-name">{{ form.customer_name }}</text>
        <view class="wear-time-info">
          <text class="wear-time-label">戴牙时间: </text>
          <text class="wear-time-value">{{ formatDateSimple(form.wear_time) }}</text>
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

        <view class="action-card" :class="{ selected: technicianLabel }" @click="showTechnicianPicker = true">
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
        <view class="action-card note-card" v-for="(item, index) in getMaterialsList()" :key="index">
          <view class="card-content note-content">
            <text class="card-label note-label">材料</text>
            <text class="note-value" :class="{ 'note-empty': !item.material }">
              {{ getMaterialLabel(item.material) || '暂无材料' }}
            </text>
          </view>
          <view class="card-content note-content" style="margin-top: 8px;">
            <text class="card-label note-label">数量</text>
            <text class="note-value" :class="{ 'note-empty': !item.quantity }">{{ item.quantity || '暂无数量' }}颗</text>
          </view>
        </view>
        <view class="action-card note-card" v-if="getMaterialsList().length === 0">
          <view class="card-content note-content">
            <text class="card-label note-label">材料</text>
            <text class="note-value note-empty">暂无材料</text>
          </view>
          <view class="card-content note-content" style="margin-top: 8px;">
            <text class="card-label note-label">数量</text>
            <text class="note-value note-empty">暂无数量</text>
          </view>
        </view>

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

        <view class="action-card note-card full-width-card">
          <view class="card-content note-content">
            <text class="card-label note-label">备注</text>
            <text class="note-value" :class="{ 'note-empty': !form.customer_note }">{{ form.customer_note || '暂无备注'
              }}</text>
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

      <view class="yipan-button-container">
        <button class="yipan-action-btn" @click="goToYipan">
          <view class="btn-icon">🦷</view>
          <view class="btn-text">贴面质检/椅旁操作</view>
        </button>
      </view>

    </view>

    <u-picker :show="showProgressPicker" :columns="progressColumns" keyName="label" @confirm="onProgressConfirm"
      @cancel="showProgressPicker = false" @close="showProgressPicker = false"></u-picker>

    <u-picker :show="showTechnicianPicker" :columns="technicianColumns" @confirm="onTechnicianConfirm" keyName="label"
      @cancel="showTechnicianPicker = false" @close="showTechnicianPicker = false"></u-picker>
  </view>
</template>

<script>
import moment from 'moment';
export const materialOptions = [
  { value: "guochan_quancitiemin", label: "国产全瓷贴面" },
  { value: "deguo_aidisiteyanghuagao", label: "德国爱迪特氧化锆" },
  { value: "deguo_weilandeyanghuagao", label: "德国威兰德氧化锆" },
  { value: "meiguo_shidan_lawawayanghuagao", label: "美国3M拉瓦氧化锆" },
  { value: "derendun_zhugongzhuguangci", label: "德国以色列珠光瓷" },
  { value: "deguo_weilan_lengchaici", label: "德国威兰冷釉瓷" },
  { value: "delanxi_quanshougongchaobaocaigao", label: "德兰希全手工超薄彩锆" },
  { value: "quanshougongdalilavayanghuagao", label: "全手工大立lava氧化锆" },
  { value: "ruishiweidian_shidiancandianshuibozhanciyanghuagao", label: "瑞士维典睿典水波钻瓷氧化锆" },
  { value: "ruishiweidian_candianci", label: "瑞士维典睿典瓷" }
]


export default {
  data() {
    return {
      statusBarHeight: +(+uni.getSystemInfoSync().statusBarHeight + 10) + "px",
      customerId: null,
      cacheLastProgress: null, // 缓存上次选择的进度
      cacheLastTechnician: null, // 缓存上次选择的技工师
      form: {
        customer_id: null,
        customer_name: "",
        wear_time: "",
        customer_note: "",
        technician_video: "",
        preparation_time: "",
        progress: "",
        technician: "",
        materials: [],
        image: "",
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
      progressColumns: [
        [
          { key: "not_started", label: "未开始" },
          { key: "guan_mo", label: "灌模" },
          { key: "xiu_mo", label: "修模" },
          { key: "cad_design", label: "CAD设计" },
          { key: "qie_xue", label: "切削" },
          { key: "che_jin", label: "车金" },
          { key: "shang_ci", label: "上瓷" },
          { key: "che_ci", label: "车瓷" },
          { key: "shang_you", label: "上釉" },
          { key: "completed", label: "已完成" }
        ]
      ],
      technicianColumns: [
        []
      ]
    };
  },

  async onReady() {
    // await this.fetchData();

  },

  onLoad: async function (option) {
    await this.fetchTechnicians();
    // 小程序环境直接从 option 获取
    if (option.scene) {
      console.log("option.scene", option.scene);
      this.customerId = option.scene;
      await this.fetchData();
    } else if (option.customerId) {
      console.log("option.customerId", option.customerId);
      this.customerId = option.customerId;
      await this.fetchData();
    }
    // H5 环境从 URL 参数获取
    // else {
    //   // #ifdef H5
    //   const urlParams = new URLSearchParams(window.location.search);
    //   const customerIdFromUrl = urlParams.get('customerId');
    //   if (customerIdFromUrl) {
    //     this.customerId = customerIdFromUrl;

    //   }
    //   // 也尝试从 hash 后面的参数获取
    //   const hash = window.location.hash;
    //   if (hash.includes('?')) {
    //     const hashParams = new URLSearchParams(hash.split('?')[1]);
    //     const customerIdFromHash = hashParams.get('customerId');
    //     if (customerIdFromHash) {
    //       this.customerId = customerIdFromHash;
    //     }
    //   }
    //   // #endif
    // }
  },

  options: { styleIsolation: "shared" },

  computed: {},

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
        uni.showToast({
          title: "缺少客户ID",
          icon: "none"
        });
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
          this.cacheLastProgress = this.form.progress;
          this.cacheLastTechnician = this.form.technician;
          this.progressLabel = this.progressColumns[0].find(item => item.key === this.form.progress)?.label || "";
          this.technicianLabel = this.technicianColumns[0].find(item => item.key === this.form.technician)?.label || "";
        } else {
          console.error("获取客户详情失败:", res);
          uni.showToast({
            title: "获取客户信息失败",
            icon: "none"
          });
        }
      } catch (err) {
        console.error("请求客户详情失败:", err);
        uni.showToast({
          title: "加载失败",
          icon: "none"
        });
      } finally {
        uni.hideLoading();
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
            uni.showToast({
              title: "选择视频失败",
              icon: "none"
            });
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
        url: "https://gdcasa.cn/api/upload",
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
              uni.showToast({
                title: data.message || "上传失败",
                icon: "none"
              });
            }
          } else {
            uni.showToast({
              title: "上传失败",
              icon: "none"
            });
          }
        },
        fail: (err) => {
          uni.hideLoading();
          console.error("上传视频失败:", err);
          uni.showToast({
            title: "上传失败",
            icon: "none"
          });
        }
      });
    },
    async updateVideoToDatabase(videoUrl) {
      try {
        // 获取当前已有的视频URL
        const currentVideos = this.form.technician_video || '';

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

        const res = await this.$api.updateTechnicianVideo({
          customer_id: this.customerId,
          technician_video: newVideos
        });

        if (res.code === 0) {
          uni.showToast({
            title: "上传成功",
            icon: "success"
          });
          await this.fetchData();
        } else {
          uni.showToast({
            title: res.message || "更新失败",
            icon: "none"
          });
        }
      } catch (err) {
        console.error("更新视频到数据库失败:", err);
        uni.showToast({
          title: "更新失败",
          icon: "none"
        });
      }
    },

    async fetchTechnicians() {
      try {
        const res = await this.$api.getUserList();
        if (res.code === 0 && res.re) {
          const list = res.re.filter(user => user.role === "技师").map(user => ({ key: user.usercount, label: user.username }));
          this.technicianColumns = [list];
        } else {
          console.error("获取用户列表失败:", res);
          this.technicianColumns = [
            []
          ];
        }
      } catch (err) {
        console.error("请求用户列表失败:", err);
        this.technicianColumns = [
          []
        ];
      }
    },

    onProgressConfirm(e) {
      const selected = e.value[0];
      this.form.progress = selected.key;
      this.progressLabel = selected.label;
      this.showProgressPicker = false;
    },

    onTechnicianConfirm(e) {
      const selected = e.value[0];
      this.form.technician = selected.key;
      this.technicianLabel = selected.label;
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
      return moment(dateStr).format('YYYY-MM-DD');
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
      if (this.isSubmitting) {
        uni.showToast({
          title: "请勿重复提交",
          icon: "none"
        });
        return;
      }

      if (!this.form.progress) {
        uni.showToast({
          title: "请选择进度",
          icon: "none"
        });
        return;
      }

      const newProgress = this.form.progress;
      const newTechnician = this.form.technician;

      console.log("this.progressLabel", this.cacheLastProgress, this.form.progress);
      if (this.progressLabel === newProgress || newProgress === "not_started") {
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
        success: async (res) => {
          if (res.confirm) {
            if (this.isSubmitting) {
              return;
            }

            this.isSubmitting = true;

            // 记录当前操作时间
            const now = new Date();
            const startTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

            try {
              // 调用添加操作历史API
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

                uni.showModal({
                  title: "成功",
                  content: message,
                  showCancel: false
                });

                // 更新缓存
                this.cacheLastProgress = newProgress;
                this.cacheLastTechnician = newTechnician;
              } else {
                uni.showToast({
                  title: result.message || "操作失败",
                  icon: "none"
                });
              }
            } catch (err) {
              uni.hideLoading();
              console.error("添加操作记录失败:", err);
              uni.showToast({
                title: "操作失败",
                icon: "none"
              });
            } finally {
              this.isSubmitting = false;
            }
          }
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>
