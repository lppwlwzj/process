import { useState, useEffect } from 'react'
import {
  DatePicker,
  Picker,
  Input,
  TextArea,
  Button,
  Toast,
  Form,
  Modal
} from 'antd-mobile'
import dayjs from 'dayjs'
import { request } from '@/utils/request'
import styles from './ScheduleForm.module.less'

interface User {
  id: number
  username: string
  role: string
}

interface ScheduleFormProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
  doctors: User[]
  nurses: User[]
  defaultDate?: string
}


const PROJECT_TYPES = [
  { label: '面诊', value: '面诊' },
  { label: '备牙', value: '备牙' },
  { label: '戴牙', value: '戴牙' },
  // { label: '椅旁', value: '椅旁' },
  { label: '复诊', value: '复诊' },
  // { label: '雕蜡', value: '雕蜡' },
  { label: '休息', value: '休息' },
  // { label: '蜡形试戴', value: '蜡形试戴' },
]

const ROOMS = [
  { label: '诊室1', value: '诊室1' },
  { label: '诊室2', value: '诊室2' },
  { label: '诊室3', value: '诊室3' },
  { label: '诊室4', value: '诊室4' }
]

const PROJECT_DURATIONS: Record<string, number> = {
  '面诊': 40,
  '雕蜡': 70,
  '椅旁': 90,
  '备牙': 70,
  '戴牙': 90,
  '复诊': 30,
  '蜡形试戴': 45,
  '休息': 60
}

export default function ScheduleForm({ visible, onClose, onSuccess, doctors, nurses, defaultDate }: ScheduleFormProps) {
  const [form] = Form.useForm()
  const project = Form.useWatch('project', form)
  const doctorId = Form.useWatch('doctor_id', form)
  const nurseId = Form.useWatch('nurse_id', form)
  const room = Form.useWatch('room', form)
  const [loading, setLoading] = useState(false)
  const [startDateTime, setStartDateTime] = useState<Date | null>(null)
  const [endDateTime, setEndDateTime] = useState<Date | null>(null)
  const [startPickerVisible, setStartPickerVisible] = useState(false)
  const [endPickerVisible, setEndPickerVisible] = useState(false)
  const [doctorPickerVisible, setDoctorPickerVisible] = useState(false)
  const [nursePickerVisible, setNursePickerVisible] = useState(false)
  const [projectPickerVisible, setProjectPickerVisible] = useState(false)
  const [roomPickerVisible, setRoomPickerVisible] = useState(false)

  useEffect(() => {
    if (visible) {
      form.resetFields()
      if (defaultDate) {
        const defaultDateTime = dayjs(defaultDate).hour(9).minute(0).second(0).millisecond(0).toDate()
        const defaultEndDateTime = dayjs(defaultDate).hour(10).minute(0).second(0).millisecond(0).toDate()
        setStartDateTime(defaultDateTime)
        setEndDateTime(defaultEndDateTime)
        form.setFieldsValue({
          start_time: defaultDateTime,
          end_time: defaultEndDateTime
        })
      } else {
        setStartDateTime(null)
        setEndDateTime(null)
      }
    } else {
      setStartPickerVisible(false)
      setEndPickerVisible(false)
      setDoctorPickerVisible(false)
      setNursePickerVisible(false)
      setProjectPickerVisible(false)
      setRoomPickerVisible(false)
    }
  }, [visible, defaultDate])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      console.log(values)

      if (!values.customer_name) {
        Toast.show('请输入客户姓名')
        setLoading(false)
        return
      }

      if (!values.project) {
        Toast.show('请选择项目')
        setLoading(false)
        return
      }

      if (!startDateTime) {
        Toast.show('请选择开始时间')
        setLoading(false)
        return
      }

      const start = dayjs(startDateTime).second(0).millisecond(0)
      const end = dayjs(endDateTime).second(0).millisecond(0)

      const duration = Math.round(end.diff(start, 'minute', true))

      if (duration <= 0) {
        Toast.show('结束时间必须晚于开始时间')
        setLoading(false)
        return
      }

      const submitData = {
        project: Array.isArray(values.project) ? values.project[0] : values.project,
        doctor_id: Array.isArray(values.doctor_id) ? values.doctor_id[0] : values.doctor_id,
        nurse_id: values.nurse_id && Array.isArray(values.nurse_id) ? values.nurse_id[0] : (values.nurse_id || null),
        customer_name: typeof values.customer_name === 'string' ? values.customer_name.trim() : String(values.customer_name || ''),
        // room: Array.isArray(values.room) ? values.room[0] : values.room,
        start_time: start.format('YYYY-MM-DD HH:mm:ss'),
        end_time: end.format('YYYY-MM-DD HH:mm:ss'),
        duration: duration,
        remark: values.remark || null
      }

      const res = await request({
        url: '/schedule/create',
        method: 'POST',
        data: submitData
      })

      if (res.code === 0) {
        Toast.show('创建排班成功')
        onSuccess()
        handleClose()
      } else {
        Modal.confirm({
          content: <div dangerouslySetInnerHTML={{ __html: res.message || '创建排班失败' }}></div>
        })
      }
    } catch (error: any) {
      if (error.errorFields) {
        Toast.show('请填写完整信息')
      } else {
        Modal.confirm({
          content: <div dangerouslySetInnerHTML={{ __html: error.message.replace(/\n/g, '<br>') || '创建排班失败' }}></div>
        })
      }
    } finally {
      setLoading(false)
    }
  }
  const handleClose = () => {
    form.resetFields()
    setStartDateTime(null)
    setEndDateTime(null)
    onClose()
  }

  if (!visible) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.formContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>新增排班</h2>
          <button className={styles.closeButton} onClick={handleClose}>×</button>
        </div>

        <Form form={form} className={styles.form} layout='horizontal'>
          <Form.Item
            name="customer_name"
            label="客户"
            className={styles.customerInput}
          >
            <Input
              placeholder="请输入客户姓名"
              clearable
            />
          </Form.Item>

          <Form.Item
            name="project"
            label="项目"
          >
            <div onClick={() => setProjectPickerVisible(true)} style={{ width: '100%' }}>
              <Picker
                visible={projectPickerVisible}
                onClose={() => setProjectPickerVisible(false)}
                columns={[PROJECT_TYPES]}
                value={project ? [project] : ["戴牙"]}
                onConfirm={(val) => {
                  if (val && Array.isArray(val) && val.length > 0) {
                    const selectedProject = val[0]
                    form.setFieldsValue({ project: selectedProject })

                    // 如果已经选择了开始时间，根据项目时长自动计算结束时间
                    if (startDateTime) {
                      const duration = PROJECT_DURATIONS[selectedProject as keyof typeof PROJECT_DURATIONS]
                      const newEndDateTime = dayjs(startDateTime).add(duration, 'minute').toDate()
                      setEndDateTime(newEndDateTime)
                      form.setFieldsValue({ end_time: newEndDateTime })
                    }
                  } else {
                    form.setFieldsValue({ project: null })
                    // 清除项目后，如果已选择开始时间，重置结束时间
                    if (startDateTime) {
                      const newEndDateTime = dayjs(startDateTime).add(60, 'minute').toDate()
                      setEndDateTime(newEndDateTime)
                      form.setFieldsValue({ end_time: newEndDateTime })
                    }
                  }
                  setProjectPickerVisible(false)
                }}
              >
                {(value) => {
                  const selectedProject = PROJECT_TYPES.find(p => p.value === project)
                  return (
                    <div className={styles.pickerContent}>
                      <span>{selectedProject ? selectedProject.label : '请选择项目'}</span>
                      {selectedProject && (
                        <span
                          className={styles.clearButton}
                          onClick={(e) => {
                            e.stopPropagation()
                            form.setFieldsValue({ project: null })
                            // 清除项目后，如果已选择开始时间，重置结束时间为默认1小时
                            if (startDateTime) {
                              const newEndDateTime = dayjs(startDateTime).add(60, 'minute').toDate()
                              setEndDateTime(newEndDateTime)
                              form.setFieldsValue({ end_time: newEndDateTime })
                            }
                          }}
                        >
                          ×
                        </span>
                      )}
                    </div>
                  )
                }}

              </Picker>
            </div>
          </Form.Item>


          <Form.Item
            name="doctor_id"
            label="医生"
          >
            <div onClick={() => setDoctorPickerVisible(true)} style={{ width: '100%' }}>
              <Picker
                visible={doctorPickerVisible}
                onClose={() => setDoctorPickerVisible(false)}
                columns={[(doctors || []).map(d => ({ label: d.username, value: d.id }))]}
                value={doctorId ? [doctorId] : [doctors[Math.floor(doctors.length / 2)].id]}
                onConfirm={(val) => {
                  if (val && Array.isArray(val) && val.length > 0) {
                    form.setFieldsValue({ doctor_id: val[0] })
                  } else {
                    form.setFieldsValue({ doctor_id: null })
                  }
                  setDoctorPickerVisible(false)
                }}
              >
                {(value) => {
                  const doctor = (doctors || []).find(d => d.id === doctorId)
                  return (
                    <div className={styles.pickerContent}>
                      <span>{doctor ? doctor.username : '请选择医生'}</span>
                      {doctor && (
                        <span
                          className={styles.clearButton}
                          onClick={(e) => {
                            e.stopPropagation()
                            form.setFieldsValue({ doctor_id: null })
                          }}
                        >
                          ×
                        </span>
                      )}
                    </div>
                  )
                }}
              </Picker>
            </div>
          </Form.Item>

          {/* <Form.Item
            name="nurse_id"
            label="护士"
          >
            <div onClick={() => setNursePickerVisible(true)} style={{ width: '100%' }}>
              <Picker
                visible={nursePickerVisible}
                onClose={() => setNursePickerVisible(false)}
                columns={[(nurses || []).map(n => ({ label: n.username, value: n.id }))]}
                value={nurseId ? [nurseId] : []}
                onConfirm={(val) => {
                  if (val && Array.isArray(val) && val.length > 0) {
                    form.setFieldsValue({ nurse_id: val[0] })
                  } else {
                    form.setFieldsValue({ nurse_id: null })
                  }
                  setNursePickerVisible(false)
                }}
              >
                {(value) => {
                  const nurse = (nurses || []).find(n => n.id === nurseId)
                  return (
                    <div className={styles.pickerContent}>
                      <span>{nurse ? nurse.username : '请选择护士'}</span>
                      {nurse && (
                        <span
                          className={styles.clearButton}
                          onClick={(e) => {
                            e.stopPropagation()
                            form.setFieldsValue({ nurse_id: null })
                          }}
                        >
                          ×
                        </span>
                      )}
                    </div>
                  )
                }}
              </Picker>
            </div>
          </Form.Item> */}

          <Form.Item
            name="start_time"
            label="开始时间"
          >
            <div style={{ width: '100%' }}>
              <DatePicker
                visible={startPickerVisible}
                onClose={() => setStartPickerVisible(false)}
                precision="minute"
                value={startDateTime}
                min={defaultDate ? dayjs(defaultDate).startOf('day').toDate() : undefined}
                max={defaultDate ? dayjs(defaultDate).endOf('day').toDate() : undefined}
                onConfirm={(val) => {
                  const date = val as Date
                  setStartDateTime(date)
                  form.setFieldsValue({ start_time: date })
                  setStartPickerVisible(false)

                  // 如果已经选择了项目，根据项目时长计算结束时间；否则默认1小时
                  const projectValue = form.getFieldValue('project')
                  const duration = projectValue && PROJECT_DURATIONS[projectValue]
                    ? PROJECT_DURATIONS[projectValue]
                    : 60

                  if (!endDateTime || dayjs(date).isBefore(endDateTime) || dayjs(date).isSame(endDateTime)) {
                    const newEndDateTime = dayjs(date).add(duration, 'minute').toDate()
                    setEndDateTime(newEndDateTime)
                    form.setFieldsValue({ end_time: newEndDateTime })
                  }
                }}
              >
                {(value) => (
                  <div onClick={() => setStartPickerVisible(true)}>
                    {value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '请选择开始时间'}
                  </div>
                )}
              </DatePicker>
            </div>
          </Form.Item>

          <Form.Item
            name="end_time"
            label="结束时间"
          >

            <div style={{ width: '100%' }}>
              <DatePicker
                visible={endPickerVisible}
                onClose={() => setEndPickerVisible(false)}
                precision="minute"
                value={endDateTime}
                min={startDateTime || (defaultDate ? dayjs(defaultDate).startOf('day').toDate() : undefined)}
                max={defaultDate ? dayjs(defaultDate).endOf('day').toDate() : undefined}
                onConfirm={(val) => {
                  const date = val as Date
                  setEndDateTime(date)
                  form.setFieldsValue({ end_time: date })
                  setEndPickerVisible(false)
                }}
              >
                {(value) => (
                  <div onClick={() => setEndPickerVisible(true)}>
                    {value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '请选择结束时间'}
                  </div>
                )}
              </DatePicker>
            </div>
          </Form.Item>

          {/* <Form.Item
            name="room"
            label="诊室"
          >
            <div onClick={() => setRoomPickerVisible(true)} style={{ width: '100%' }}>
              <Picker
                visible={roomPickerVisible}
                onClose={() => setRoomPickerVisible(false)}
                columns={[ROOMS]}
                value={room ? [room] : []}
                onConfirm={(val) => {
                  if (val && Array.isArray(val) && val.length > 0) {
                    form.setFieldsValue({ room: val[0] })
                  } else {
                    form.setFieldsValue({ room: null })
                  }
                  setRoomPickerVisible(false)
                }}
              >
                {(value) => {
                  const selectedRoom = ROOMS.find(r => r.value === room)
                  return (
                    <div className={styles.pickerContent}>
                      <span>{selectedRoom ? selectedRoom.label : '请选择诊室'}</span>
                      {selectedRoom && (
                        <span
                          className={styles.clearButton}
                          onClick={(e) => {
                            e.stopPropagation()
                            form.setFieldsValue({ room: null })
                          }}
                        >
                          ×
                        </span>
                      )}
                    </div>
                  )
                }}
              </Picker>
            </div>
          </Form.Item> */}

          <Form.Item
            name="remark"
            label="备注"
            className={styles.customerInput}
          >
            <TextArea
              placeholder="请输入备注（可选）"
              rows={3}
              showCount
              maxLength={1000}
            />
          </Form.Item>
        </Form>

        <div className={styles.footer}>
          <Button className={styles.cancelButton} onClick={handleClose}>
            取消
          </Button>
          <Button
            className={styles.submitButton}
            onClick={handleSubmit}
            loading={loading}
            color="primary"
          >
            创建
          </Button>
        </div>
      </div>
    </div >
  )
}
