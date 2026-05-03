<script lang="ts" setup>
import { getToken } from "@@/utils/cache/cookies"
import { useUserStore } from "@/pinia/stores/user"

const VALID_USERNAME = "ysd888666"
const VALID_PASSWORD = "6688ysd8866"

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loginFormRef = useTemplateRef("loginFormRef")

const loading = ref(false)
const shake = ref(false)

const form = reactive({
  username: "",
  password: ""
})

const rules = {
  username: [{ required: true, message: "请输入账号", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }]
}

function goAfterLogin() {
  const redirect = route.query.redirect
  const path = typeof redirect === "string" && redirect ? decodeURIComponent(redirect) : "/"
  router.replace(path)
}

function handleSubmit() {
  loginFormRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error("请完善表单")
      return
    }
    if (form.username !== VALID_USERNAME || form.password !== VALID_PASSWORD) {
      shake.value = true
      setTimeout(() => {
        shake.value = false
      }, 520)
      ElMessage.error("账号或密码错误")
      form.password = ""
      return
    }
    loading.value = true
    userStore.setToken("ysd-mng-local-auth")
    userStore.username = form.username
    ElMessage.success("登录成功")
    goAfterLogin()
    loading.value = false
  })
}

onMounted(() => {
  if (getToken()) {
    goAfterLogin()
  }
})
</script>

<template>
  <div class="ysd-login">
    <div class="ysd-login__grain" aria-hidden="true" />
    <div class="ysd-login__panel ysd-login__panel--art">
      <div class="ysd-login__brand">
        <span class="ysd-login__mark">◇</span>
        <h1 class="ysd-login__title">易时代石材</h1>
        <!-- <p class="ysd-login__subtitle">内部管理入口 · 凭证仅作本地校验</p> -->
      </div>
      <div class="ysd-login__deco-line" />
      <!-- <p class="ysd-login__tagline">
        精研流程，沉淀每一次协作。
      </p> -->
    </div>

    <div class="ysd-login__panel ysd-login__panel--form">
      <div class="ysd-login__form-wrap" :class="{ 'ysd-login__form-wrap--shake': shake }">
        <h2 class="ysd-login__form-title">
          登录
        </h2>
        <p class="ysd-login__form-hint">
          使用分配的账号进入系统
        </p>

        <el-form
          ref="loginFormRef"
          class="ysd-login__form"
          :model="form"
          :rules="rules"
          label-position="top"
          @submit.prevent="handleSubmit"
        >
          <el-form-item label="账号" prop="username">
            <el-input
              v-model="form.username"
              size="large"
              placeholder="账号"
              autocomplete="username"
              class="ysd-login__input"
            />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              size="large"
              placeholder="密码"
              show-password
              autocomplete="current-password"
              class="ysd-login__input"
              @keyup.enter="handleSubmit"
            />
          </el-form-item>
          <el-button
            type="primary"
            size="large"
            class="ysd-login__submit"
            :loading="loading"
            native-type="submit"
          >
            进入系统
          </el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import url("https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;1,9..144,500&family=Syne:wght@400;500;600&display=swap");

.ysd-login {
  --ysd-bg: #0f1419;
  --ysd-paper: #f5f7fa;
  --ysd-ink: #1d2129;
  --ysd-primary: #409eff;
  --ysd-primary-dim: #337ecc;
  --ysd-mist: rgba(64, 158, 255, 0.08);

  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(360px, 1.05fr);
  background: var(--ysd-bg);
  color: var(--ysd-paper);
  font-family: Syne, system-ui, sans-serif;

  @media (max-width: 880px) {
    grid-template-columns: 1fr;
 }
}

.ysd-login__grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.35;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
  mix-blend-mode: overlay;
}

.ysd-login__panel {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(2rem, 6vw, 4.5rem);
}

.ysd-login__panel--art {
  background:
    radial-gradient(ellipse 120% 80% at 20% 30%, rgba(64, 158, 255, 0.22), transparent 55%),
    radial-gradient(ellipse 90% 60% at 80% 70%, rgba(51, 126, 204, 0.1), transparent 50%),
    linear-gradient(165deg, #141a22 0%, #0c1016 100%);
  border-right: 1px solid var(--ysd-mist);

  @media (max-width: 880px) {
    border-right: none;
    border-bottom: 1px solid var(--ysd-mist);
    min-height: 38vh;
    justify-content: flex-end;
    padding-bottom: 2rem;
  }
}

.ysd-login__brand {
  animation: ysd-fade-up 0.85s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.ysd-login__mark {
  display: inline-block;
  color: var(--ysd-primary);
  font-size: 1.25rem;
  letter-spacing: 0.2em;
  margin-bottom: 0.75rem;
  animation: ysd-fade-up 0.85s cubic-bezier(0.22, 1, 0.36, 1) 0.08s both;
}

.ysd-login__title {
  font-family: Fraunces, Georgia, serif;
  font-weight: 500;
  font-size: clamp(2rem, 4.5vw, 3rem);
  line-height: 1.12;
  letter-spacing: -0.02em;
  margin: 0 0 0.75rem;
  font-style: italic;
  animation: ysd-fade-up 0.85s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both;
}

.ysd-login__subtitle {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 400;
  color: rgba(245, 247, 250, 0.55);
  max-width: 22rem;
  line-height: 1.55;
  animation: ysd-fade-up 0.85s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both;
}

.ysd-login__deco-line {
  width:4rem;
  height: 3px;
  margin: 2rem 0 1.25rem;
  background: linear-gradient(90deg, var(--ysd-primary), var(--ysd-primary-dim), transparent);
  border-radius: 2px;
  animation: ysd-fade-up 0.85s cubic-bezier(0.22, 1, 0.36, 1) 0.28s both;
}

.ysd-login__tagline {
  margin: 0;
  font-size: 0.82rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(245, 247, 250, 0.38);
  animation: ysd-fade-up 0.85s cubic-bezier(0.22, 1, 0.36, 1) 0.34s both;
}

.ysd-login__panel--form {
  background: var(--ysd-paper);
  color: var(--ysd-ink);
  align-items: center;
}

.ysd-login__form-wrap {
  width: 100%;
  max-width: 22rem;
  transition: transform 0.18s ease;
}

.ysd-login__form-wrap--shake {
  animation: ysd-shake 0.5s ease;
}

.ysd-login__form-title {
  font-family: Fraunces, Georgia, serif;
  font-weight: 500;
  font-size: 1.75rem;
  margin: 0 0 0.35rem;
  letter-spacing: -0.02em;
}

.ysd-login__form-hint {
  margin: 0 0 1.75rem;
  font-size: 0.875rem;
  color: rgba(29, 33, 41, 0.55);
}

.ysd-login__form :deep(.el-form-item__label) {
  font-family: Syne, sans-serif;
  font-weight: 600;
  color: var(--ysd-ink);
}

.ysd-login__input :deep(.el-input__wrapper) {
  border-radius: 2px;
  box-shadow: none;
  border: 1px solid rgba(29, 33, 41, 0.14);
  background: #fff;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.ysd-login__input :deep(.el-input__wrapper:hover) {
  border-color: rgba(64, 158, 255, 0.45);
}

.ysd-login__input :deep(.el-input__wrapper.is-focus) {
  border-color: var(--ysd-primary);
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.25);
}

.ysd-login__submit {
  width: 100%;
  margin-top: 0.5rem;
  height: 46px;
  font-family: Syne, sans-serif;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 0.78rem;
  border-radius: 2px;
  border: none;
  background: linear-gradient(135deg, var(--ysd-primary) 0%, var(--ysd-primary-dim) 100%);
  transition:
    transform 0.2s,
    filter 0.2s;
}

.ysd-login__submit:hover {
  filter: brightness(1.06);
  transform: translateY(-1px);
}

@keyframes ysd-fade-up {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ysd-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-10px);
  }
  40% {
    transform: translateX(10px);
  }
  60% {
    transform: translateX(-6px);
  }
  80% {
    transform: translateX(6px);
  }
}
</style>
