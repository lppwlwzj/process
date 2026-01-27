function validateRequiredFields(extractedInfo) {
  const { project, doctor_name, customer_name, start_time } = extractedInfo;
  
  const missingFields = [];
  
  if (!project) {
    missingFields.push('项目类型');
  }
  
  if (!doctor_name) {
    missingFields.push('医生');
  }
  
  if (!customer_name) {
    missingFields.push('客户');
  }
  
  if (!start_time) {
    missingFields.push('开始时间');
  }
  
  return {
    valid: missingFields.length === 0,
    missing_fields: missingFields
  };
}

function getMissingFieldsMessage(missingFields) {
  if (missingFields.length === 0) {
    return null;
  }
  
  return `请提供以下信息：${missingFields.join('、')}`;
}

module.exports = {
  validateRequiredFields,
  getMissingFieldsMessage
};
