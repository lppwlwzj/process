<script>
export default {
  // onLaunch: function (options) {
	//   uni.redirectTo({
	//     url: "/pages/index/index"
	//   });
  //   // if (
  //   //   !["pages/zhibao/zhibao", "pages/zbQuery/zbQuery"].includes(options.path)
  //   // ) {
  //   //   const userInfo = uni.getStorageSync("userInfo"); //设置缓存
  //   //   if (userInfo) {
  //   //     uni.redirectTo({
  //   //       url: "/pages/index/index"
  //   //     });
  //   //   } else {
  //   //     uni.redirectTo({
  //   //       url: "/pages/login/login"
  //   //     });
  //   //   }
  //   // }
  // }
};
</script>

<style lang="scss">
/* 注意要写在第一行，同时给style标签加入lang="scss"属性 */
@import "uview-ui/index.scss";
/*每个页面公共css */
@import "@/uni_modules/uni-scss/index.scss";
.u-popup__content__close--top-left {
  top: 75px !important;
  left: 28px !important;
}
uni-modal,
.uni-modal,
.uni-modal__hd,
.uni-modal__bd,
.uni-modal__ft,
.uni-modal__content {
  z-index: 999999 !important;
}

.uni-actionsheet__cell {
  display: none !important;
  // position: fixed !important;
  // bottom: 0 !important;
  // left: 0 !important;
  // right: 0 !important;
  // z-index: 99999 !important;
  // transform: translateY(100%) !important;
  // transition: transform 0.3s ease !important;
  // &.uni-actionsheet--active {
  //   transform: translateY(0) !important;
  // }
}
</style>
