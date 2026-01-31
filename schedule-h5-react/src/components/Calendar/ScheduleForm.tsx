import { useState, useEffect } from 'react'
import {
  DatePicker,
  Picker,
  Input,
  TextArea,
  Button,
  Toast,
  Form
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
}


const PROJECT_TYPES = [
  { label: '面诊', value: '面诊' },
  { label: '备牙', value: '备牙' },
  { label: '戴牙', value: '戴牙' },
  { label: '椅旁', value: '椅旁' },
  { label: '复诊', value: '复诊' },
  { label: '雕蜡', value: '雕蜡' },
  { label: '蜡形试戴', value: '蜡形试戴' }
]

const ROOMS = [
  { label: '诊室1', value: '诊室1' },
  { label: '诊室2', value: '诊室2' },
  { label: '诊室3', value: '诊室3' },
  { label: '诊室4', value: '诊室4' }
]

export default function ScheduleForm({ visible, onClose, onSuccess, doctors, nurses }: ScheduleFormProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [startDateTime, setStartDateTime] = useState<Date>(new Date())
  const [endDateTime, setEndDateTime] = useState<Date>(new Date())
  const [startPickerVisible, setStartPickerVisible] = useState(false)
  const [endPickerVisible, setEndPickerVisible] = useState(false)
  const [doctorPickerVisible, setDoctorPickerVisible] = useState(false)
  const [nursePickerVisible, setNursePickerVisible] = useState(false)
  const [projectPickerVisible, setProjectPickerVisible] = useState(false)
  const [roomPickerVisible, setRoomPickerVisible] = useState(false)

  useEffect(() => {
    if (visible) {
      form.resetFields()
      const now = new Date()
      setStartDateTime(now)
      setEndDateTime(dayjs(now).add(1, 'hour').toDate())
    } else {
      setStartPickerVisible(false)
      setEndPickerVisible(false)
      setDoctorPickerVisible(false)
      setNursePickerVisible(false)
      setProjectPickerVisible(false)
      setRoomPickerVisible(false)
    }
  }, [visible])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

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
        room: Array.isArray(values.room) ? values.room[0] : values.room,
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
        onClose()
      } else {
        Toast.show(res.message || '创建排班失败')
      }
    } catch (error: any) {
      if (error.errorFields) {
        Toast.show('请填写完整信息')
      } else {
        Toast.show(error.message || '创建排班失败')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!visible) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.formContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>新增排班</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <Form form={form} className={styles.form}>
          <Form.Item
            name="start_time"
            label="开始时间"
            rules={[{ required: true, message: '请选择开始时间' }]}
          >
            <DatePicker
              visible={startPickerVisible}
              onClose={() => setStartPickerVisible(false)}
              precision="minute"
              value={startDateTime}
              onConfirm={(val) => {
                const date = val as Date
                setStartDateTime(date)
                form.setFieldsValue({ start_time: date })
                setStartPickerVisible(false)
                if (dayjs(date).isBefore(endDateTime) || dayjs(date).isSame(endDateTime)) {
                  const newEndDateTime = dayjs(date).add(1, 'hour').toDate()
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
          </Form.Item>

          <Form.Item
            name="end_time"
            label="结束时间"
            rules={[{ required: true, message: '请选择结束时间' }]}
          >
            <DatePicker
              visible={endPickerVisible}
              onClose={() => setEndPickerVisible(false)}
              precision="minute"
              value={endDateTime}
              min={startDateTime}
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
          </Form.Item>

          <Form.Item
            name="doctor_id"
            label="医生"
            rules={[{ required: true, message: '请选择医生' }]}
          >
            <div onClick={() => setDoctorPickerVisible(true)}>
              <Picker
                visible={doctorPickerVisible}
                onClose={() => setDoctorPickerVisible(false)}
                columns={[(doctors || []).map(d => ({ label: d.username, value: d.id }))]}
                onConfirm={(val) => {
                  if (val && Array.isArray(val) && val.length > 0) {
                    form.setFieldsValue({ doctor_id: val[0] })
                  }
                  setDoctorPickerVisible(false)
                }}
              >
                {(value) => {
                  const doctor = (doctors || []).find(d => d.id === (value?.[0]?.value as unknown as number))
                  return (
                    <div>{doctor ? doctor.username : '请选择医生'}</div>
                  )
                }}
              </Picker>
            </div>
          </Form.Item>

          <Form.Item
            name="nurse_id"
            label="护士"
          >
            <div onClick={() => setNursePickerVisible(true)}>
              <Picker
                visible={nursePickerVisible}
                onClose={() => setNursePickerVisible(false)}
                columns={[(nurses || []).map(n => ({ label: n.username, value: n.id }))]}
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
                  const nurse = (nurses || []).find(n => n.id === (value?.[0]?.value as unknown as number))
                  return <div>{nurse ? nurse.username : '请选择护士'}</div>
                }}
              </Picker>
            </div>
          </Form.Item>

          <Form.Item
            name="project"
            label="项目"
            rules={[{ required: true, message: '请选择项目' }]}
          >
            <div onClick={() => setProjectPickerVisible(true)}>
              <Picker
                visible={projectPickerVisible}
                onClose={() => setProjectPickerVisible(false)}
                columns={[PROJECT_TYPES]}
                onConfirm={(val) => {
                  if (val && Array.isArray(val) && val.length > 0) {
                    form.setFieldsValue({ project: val[0] })
                  }
                  setProjectPickerVisible(false)
                }}
              >
                {(value) => {
                  const project = PROJECT_TYPES.find(p => p.value === (value?.[0]?.value as unknown as string))
                  return <div>{project ? project.label : '请选择项目'}</div>
                }}

              </Picker>
            </div>
          </Form.Item>

          <Form.Item
            name="customer_name"
            label="客户"
            rules={[{ required: true, message: '请输入客户姓名' }]}
            className={styles.customerInput}
          >
            <Input
              placeholder="请输入客户姓名"
              clearable
            />
          </Form.Item>

          <Form.Item
            name="room"
            label="诊室"
            rules={[{ required: true, message: '请选择诊室' }]}
          >
            <div onClick={() => setRoomPickerVisible(true)}>
              <Picker
                visible={roomPickerVisible}
                onClose={() => setRoomPickerVisible(false)}
                columns={[ROOMS]}
                onConfirm={(val) => {
                  if (val && Array.isArray(val) && val.length > 0) {
                    form.setFieldsValue({ room: val[0] })
                  }
                  setRoomPickerVisible(false)
                }}
              >
                {(value) => {
                  const room = ROOMS.find(r => r.value === (value?.[0]?.value as unknown as string))
                  return <div>{room ? room.label : '请选择诊室'}</div>
                }}
              </Picker>
            </div>
          </Form.Item>

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
          <Button className={styles.cancelButton} onClick={onClose}>
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
