// api接口管理
const install = (Vue, vm) => {
  Vue.prototype.$api = {
  
    getUserList: () => vm.$u.http.post("/api/user/list"),
    getCustomerDetailById: (data) =>
      vm.$u.http.post("/api/customer/detail", data),
    getProcessDetailByCustomerId: (data) =>
      vm.$u.http.post("/api/process/detail", data),


    //图片上传
    uploadImg: (formData) => vm.$u.http.upload("/api/upload", formData),
    deleteImg: (data) => vm.$u.http.post("/api/upload/delete", data),

    login: (data) => vm.$u.http.post("/api/user/login", data),
    getQrImg: (data) => vm.$u.http.post("/api/user/getQrImg", data),

    addCustomer: (data) => vm.$u.http.post("/api/customer/add", data),

    editCustomer: (data) => vm.$u.http.post("/api/customer/edit", data),
    getCustomerList: (data) => vm.$u.http.post("/api/customer/list", data),
    // getKehuList: (data) => vm.$u.http.post("/api/kehu/list", data),
    // addKehu: (data) => vm.$u.http.post("/api/kehu/add", data),
    // editKehu: (data) => vm.$u.http.post("/api/kehu/edit", data),
    // getKehuDetailById: (data) =>
    //   vm.$u.http.post("/api/kehu/detail", data),
    // deleteKehu: (data) => vm.$u.http.post("/api/kehu/delete", data),

    deleteCustomer: (data) => vm.$u.http.post("/api/customer/delete", data),

    getLogList: (data) => vm.$u.http.post("/api/user/log", data),

    getRegisterCover: () => vm.$u.http.get("/api/index/registerCover"),
    register: (data) => vm.$u.http.post("/api/user/register", data),
    getmiyao: (data) => {
      return vm.$u.http.post("/api/user/getmiyao", data);
    },
    jiemi: (data) => vm.$u.http.post("/api/user/jiemi", data),
    
    // 客户进度操作历史
    addProcessHistory: (data) => vm.$u.http.post("/api/process_history/add", data),
    getProcessHistory: (data) => vm.$u.http.post("/api/process_history/list", data),
    
    // 椅旁操作
    addYipan: (data) => vm.$u.http.post("/api/yipan/add", data),
    getYipanDetail: (data) => vm.$u.http.post("/api/yipan/detail", data),
    updateYipan: (data) => vm.$u.http.post("/api/yipan/update", data),
    startChairside: (data) => vm.$u.http.post("/api/yipan/start", data),
    completeChairside: (data) => vm.$u.http.post("/api/yipan/complete", data),
    getYipanHistory: (data) => vm.$u.http.post("/api/yipan/history", data),
  };
};

export default {
  install
};
