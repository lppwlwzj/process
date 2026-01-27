const { DynamicStructuredTool } = require('@langchain/core/tools');
const { z } = require('zod');
const db = require('../../db/index');

const queryUserTool = new DynamicStructuredTool({
  name: 'query_user',
  description: '查询用户信息（医生或护士）。根据姓名模糊匹配查询用户。',
  schema: z.object({
    name: z.string().describe('用户姓名（支持模糊匹配）'),
    role: z.string().optional().describe('角色：医生椅旁技师 或 护士，可选')
  }),
  func: async ({ name, role }) => {
    return new Promise((resolve, reject) => {
      let sql = `SELECT id, username, role FROM user WHERE username LIKE ?`;
      const params = [`%${name}%`];

      if (role) {
        sql += ` AND role = ?`;
        params.push(role);
      }

      db.query(sql, params, (err, results) => {
        if (err) {
          reject(new Error(`查询用户失败: ${err.message}`));
          return;
        }
        resolve(JSON.stringify({
          success: true,
          count: results.length,
          users: results
        }));
      });
    });
  }
});

const queryCustomerTool = new DynamicStructuredTool({
  name: 'query_customer',
  description: '查询客户信息。根据姓名模糊匹配查询客户。',
  schema: z.object({
    name: z.string().describe('客户姓名（支持模糊匹配）')
  }),
  func: async ({ name }) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT id, customer_name FROM customer WHERE customer_name LIKE ?`;
      const params = [`%${name}%`];

      db.query(sql, params, (err, results) => {
        if (err) {
          reject(new Error(`查询客户失败: ${err.message}`));
          return;
        }
        resolve(JSON.stringify({
          success: true,
          count: results.length,
          customers: results
        }));
      });
    });
  }
});

module.exports = {
  queryUserTool,
  queryCustomerTool
};
