import type { TableColumnType } from 'ant-design-vue'
import dayjs from 'dayjs';
export const blfParameterTableColumns: TableColumnType[] = [
  // {
  //   title: 'ID',
  //   dataIndex: 'id',
  //   key: 'id',
  //   width: 80,
  //   align: 'center',
  //   sorter: (a, b) => a.id - b.id, // 升序/降序自动切换
  //   sortDirections: ['ascend', 'descend'], // 支持的排序方向
  // },
  {
    title: '序号',
    key: 'index',
    width: 100
  },
  {
    title: '工单号',
    dataIndex: 'workOrderNumber',
    key: 'workOrderNumber',
    width: 150,
    sorter: (a, b) => {
      // 处理可能为空的情况
      const aVal = a.workOrderNumber || '';
      const bVal = b.workOrderNumber || '';
      
      // 如果是数字类型的工单号，按数字排序
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      
      // 否则按字符串排序
      return aVal.localeCompare(bVal);
    },
    sortDirections: ['ascend', 'descend'],
  },
  {
    title: '比例阀编号',
    dataIndex: 'blfNumber',
    key: 'blfNumber',
    width: 150,
    sorter: (a, b) => {
      // 处理可能为空的情况
      const aVal = a.blfNumber || '';
      const bVal = b.blfNumber || '';
      // 尝试提取编号中的数字部分进行排序
      const aNumMatch = aVal.match(/\d+/);
      const bNumMatch = bVal.match(/\d+/);      
      if (aNumMatch && bNumMatch) {
        const aNum = parseInt(aNumMatch[0], 10);
        const bNum = parseInt(bNumMatch[0], 10);
        return aNum - bNum;
      }
      // 如果没有数字部分，按字符串排序
      return aVal.localeCompare(bVal);
    },
    sortDirections: ['ascend', 'descend'],
  },
  {
    title: '线圈电阻',
    dataIndex: 'coilResistance',
    key: 'coilResistance',
    width: 100
  },
  {
    title: '绝缘电阻',
    dataIndex: 'insulationResistance',
    key: 'insulationResistance',
    width: 100
  },
  {
    title: '绝缘强度',
    dataIndex: 'insulationStrength',
    key: 'insulationStrength',
    width: 100
  },
  {
    title: '耐压强度',
    dataIndex: 'withstandVoltageStrength',
    key: 'withstandVoltageStrength',
    width: 100
  },
  {
    title: '内泄漏',
    dataIndex: 'internalLeakage',
    key: 'internalLeakage',
    width: 100
  },
  {
    title: '外泄漏',
    dataIndex: 'externalLeakage',
    key: 'externalLeakage',
    width: 100
  },
  {
    title: '电流流量曲线',
    dataIndex: 'currentFlowRateCurve',
    key: 'currentFlowRateCurve',
    align: 'center',
    width: 150
  },
  {
    title: '起始电流',
    dataIndex: 'startingCurrent',
    key: 'startingCurrent',
    width: 100
  },
  {
    title: '最大流量',
    dataIndex: 'maximumFlowRate',
    key: 'maximumFlowRate',
    width: 100
  },
  {
    title: '滞回',
    dataIndex: 'hysteresis',
    key: 'hysteresis',
    width: 100
  }, {
    title: '压力流量曲线',
    dataIndex: 'pressureFlowRateCurve',
    key: 'pressureFlowRateCurve',
    align: 'center',
    width: 150
  }, {
    title: '闭环波动0.5%',
    dataIndex: 'closedLoopFluctuation1',
    key: 'closedLoopFluctuation1',
    width: 150
  }, {
    title: '闭环波动25%',
    dataIndex: 'closedLoopFluctuation2',
    key: 'closedLoopFluctuation2',
    width: 150
  }, {
    title: '闭环波动75%',
    dataIndex: 'closedLoopFluctuation3',
    key: 'closedLoopFluctuation3',
    width: 150
  }, {
    title: '闭环波动100%',
    dataIndex: 'closedLoopFluctuation4',
    key: 'closedLoopFluctuation4',
    width: 150
  },
  {
    title: '创建时间',
    dataIndex: 'createDate',
    key: 'createDate',
    width: 180,
    align: 'center',
     customRender: ({ text }) => {
      if (!text) return '-';
      return dayjs(text).format('YYYY-MM-DD HH:mm:ss');
    }
  },
  {
    title: '修改时间',
    dataIndex: 'modifyDate',
    key: 'modifyDate',
    width: 180,
    align: 'center',
     customRender: ({ text }) => {
      //简单的判空
      if (!text||text.includes('0001')) return '-';
      return dayjs(text).format('YYYY-MM-DD HH:mm:ss');
    }
  },
  // {
  //   title: '产品名称',
  //   dataIndex: 'name',
  //   key: 'name',
  //   ellipsis: true
  // },
  // {
  //   title: '价格',
  //   dataIndex: 'price',
  //   key: 'price',
  //   width: 120,
  //   align: 'right',
  //   sorter: (a, b) => a.price - b.price, // 升序/降序自动切换
  //   sortDirections: ['ascend', 'descend'], // 支持的排序方向
  // },
  // {
  //   title: '分类',
  //   dataIndex: 'category',
  //   key: 'category',
  //   width: 120
  // },
  // {
  //   title: '创建时间',
  //   dataIndex: 'createdAt',
  //   key: 'createdAt',
  //   width: 180,
  //   align: 'center'
  // },
//   {
//     title: '操作',
//     dataIndex: 'action',
//     key: 'action',
//     width: 150,
//     align: 'center',
//     fixed: 'right',
//   }
]