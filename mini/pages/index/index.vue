<template>
  <view class="content" :style="{ paddingTop: statusBarHeight }">
    <view class="page-title">客户进度表 <text class="progress-label" v-show="progressLabel">（{{ progressLabel }}）</text>
    </view>

    <view class="form-container">
      <view class="customer-header">
        <text class="customer-name">{{ form.customerName }}</text>
        <view class="wear-time-info">
          <text class="wear-time-label">戴牙时间: </text>
          <text class="wear-time-value">{{ formatDate(form.wearTime) }}</text>
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
        <view class="action-card">
          <view class="card-icon-wrapper">
            <text class="card-icon">👤</text>
          </view>
          <view class="card-content">
            <view class="card-text">
              <text class="card-label">材料</text>
              <text class="card-selected-value">{{ form.material }}</text>
            </view>
            <text class="card-arrow">›</text>
          </view>
        </view>

        <view class="action-card" @click="handleStart" :class="{ disabled: !form.progress || !form.technician }">
          <view class="card-icon-wrapper">
            <text class="card-icon">⚡</text>
          </view>
          <view class="card-content">
            <view class="card-text">
              <text class="card-label">开始操作</text>
            </view>
          </view>
        </view>

        <view class="action-card">
          <view class="card-icon-wrapper">
            <text class="card-icon">👤</text>
          </view>
          <view class="card-content">
            <view class="card-text">
              <text class="card-label">备注</text>
              <text class="card-selected-value">{{ form.remark }}</text>
            </view>
          </view>
        </view>


        <view class="action-card image-card" @click="previewImage">
          <view class="image-wrapper" v-if="form.image">
            <image :src="form.image" mode="aspectFill" class="card-image"></image>
          </view>
          <view class="no-image" v-else>
            <text class="no-image-icon">📷</text>
            <text class="no-image-text">暂无图片</text>
          </view>
        </view>

        <view class="action-card">
          <view class="card-icon-wrapper">
            <text class="card-icon">🎙</text>
          </view>
          <view class="card-content">
            <view class="card-text">
              <text class="card-label">上传录音</text>
            </view>
          </view>
        </view>



        <view class="action-card" @click="goToYipan">
          <view class="card-icon-wrapper">
            <text class="card-icon">▶</text>
          </view>
          <view class="card-content">
            <view class="card-text">
              <text class="card-label">上传视频</text>
            </view>
          </view>
        </view>
      </view>

      <view class="yipan-button-container">
        <button class="yipan-action-btn" @click="goToYipan">
          <view class="btn-icon">🦷</view>
          <view class="btn-text">椅旁操作</view>
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
      customerId: null,
      cacheLastProgress: null, // 缓存上次选择的进度
      cacheLastTechnician: null, // 缓存上次选择的技工师
      form: {
        customerName: "",
        wearTime: "",
        progress: "",
        technician: "",
        material: "",
        image: "",
        remark: ""
      },
      progressLabel: "",
      technicianLabel: "",
      showProgressPicker: false,
      showTechnicianPicker: false,
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
    await this.fetchTechnicians();
    await this.fetchData();

  },

  onLoad: function (option) {
    // 小程序环境直接从 option 获取
    if (option.customerId) {
      this.customerId = option.customerId;

      console.log("接收到客户ID:", this.customerId);
    }
    // H5 环境从 URL 参数获取
    else {
      // #ifdef H5
      const urlParams = new URLSearchParams(window.location.search);
      const customerIdFromUrl = urlParams.get('customerId');
      if (customerIdFromUrl) {
        this.customerId = customerIdFromUrl;

        console.log("从URL获取客户ID:", this.customerId);
      }
      // 也尝试从 hash 后面的参数获取
      const hash = window.location.hash;
      if (hash.includes('?')) {
        const hashParams = new URLSearchParams(hash.split('?')[1]);
        const customerIdFromHash = hashParams.get('customerId');
        if (customerIdFromHash) {
          this.customerId = customerIdFromHash;

          console.log("从Hash获取客户ID:", this.customerId);
        }
      }
      // #endif
    }
  },

  options: { styleIsolation: "shared" },

  computed: {},

  methods: {
    async fetchData() {
      if (!this.customerId) {
        uni.showToast({
          title: "缺少客户ID",
          icon: "none"
        });
        return;
      }

      uni.showLoading({ title: "加载中..." });

      try {
        const res = await this.$api.getCustomerProcessDetailByCustomerId({ id: this.customerId });
        if (res.code === 0 && res.re) {
          this.form = {
            customerName: res.re.customer_name || "",
            wearTime: res.re.wear_time || "",
            progress: res.re.progress || "",
            technician: res.re.technician || "",
            material: res.re.material || "",
            image: res.re.image || "",
            remark: res.re.remark || ""
          };
          this.cacheLastProgress = this.form.progress;
          this.cacheLastTechnician = this.form.technician;
          this.progressLabel = this.progressColumns.find(item => item.key === this.form.progress)?.label || "";
          this.technicianLabel = this.technicianColumns.find(item => item.key === this.form.technician)?.label || "";
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
        success: async (res) => {
          if (res.confirm) {
            const newProgress = this.form.progress;
            const newTechnician = this.form.technician;

            // 记录当前操作时间
            const now = new Date();
            const startTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

            try {
              uni.showLoading({ title: "保存中..." });

              // 调用添加操作历史API
              const result = await this.$api.addProcessHistory({
                customer_id: this.customerId,
                customer_name: this.form.customerName,
                progress: newProgress,
                technician: newTechnician,
                start_time: startTime
              });

              uni.hideLoading();

              if (result.code === 0) {
                const { duration_minutes, previous_progress, previous_technician } = result.re;

                let message = "操作记录成功！\n";
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
