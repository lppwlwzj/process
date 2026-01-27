const { DynamicStructuredTool } = require('@langchain/core/tools');
const { z } = require('zod');
const { findAvailableTimeSlots, findAvailableDoctors, findAvailableRooms, getProjectDefaultDuration } = require('../utils/resource-allocator');

const queryAvailableResourcesTool = new DynamicStructuredTool({
  name: 'query_available_resources',
  description: '查询可用资源（医生、诊室、时间段）。用于自动分配资源。',
  schema: z.object({
    date: z.string().describe('日期，格式：YYYY-MM-DD'),
    duration: z.number().describe('所需时长（分钟）'),
    doctor_id: z.number().optional().describe('指定医生ID，可选'),
    start_time: z.string().optional().describe('指定开始时间，格式：YYYY-MM-DD HH:mm:ss，可选')
  }),
  func: async ({ date, duration, doctor_id, start_time }) => {
    try {
      const timeRange = start_time ? {
        start_time: new Date(start_time),
        end_time: new Date(new Date(start_time).getTime() + duration * 60 * 1000)
      } : null;

      const results = {
        available_doctors: [],
        available_rooms: [],
        available_time_slots: []
      };

      if (doctor_id && timeRange) {
        return new Promise((resolve, reject) => {
          findAvailableTimeSlots(doctor_id, date, duration, (err, slots) => {
            if (err) {
              reject(new Error(`查询可用时间段失败: ${err.message}`));
              return;
            }
            results.available_time_slots = slots;
            resolve(JSON.stringify({
              success: true,
              ...results
            }));
          });
        });
      }

      if (timeRange) {
        return new Promise((resolve, reject) => {
          Promise.all([
            new Promise((res, rej) => {
              findAvailableDoctors(date, timeRange, (err, doctors) => {
                if (err) rej(err);
                else res(doctors);
              });
            }),
            new Promise((res, rej) => {
              findAvailableRooms(date, timeRange, (err, rooms) => {
                if (err) rej(err);
                else res(rooms);
              });
            })
          ]).then(([doctors, rooms]) => {
            results.available_doctors = doctors;
            results.available_rooms = rooms;
            resolve(JSON.stringify({
              success: true,
              ...results
            }));
          }).catch(err => {
            reject(new Error(`查询可用资源失败: ${err.message}`));
          });
        });
      }

      return JSON.stringify({
        success: true,
        message: '需要更多参数来查询可用资源',
        ...results
      });
    } catch (error) {
      throw new Error(`查询可用资源失败: ${error.message}`);
    }
  }
});

module.exports = {
  queryAvailableResourcesTool
};
