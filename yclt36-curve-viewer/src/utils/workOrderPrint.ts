import { toDataURL } from 'qrcode'

export interface WorkOrderPrintItem {
  id: number
  工单单号: string
  排产编号: string
  排产用户: string
  交货日期: string
  生产数: number
  入库数: number
  待产数: number
  // 外产生产扩展字段（可选，查询到才回填）
  来源?: string
  工序车间?: string
  工序?: string
  工单层级?: string
  电压?: string
  线圈?: string
  订单数?: string
  单位?: string
  仓库名称?: string
  备注?: string
  用量?: string
}

export interface MaterialPrintItem {
  id: number
  货号: string
  品名: string
  规格: string
  产品属性: string
  来源: string
  单位: string
  用量: number
  需求数: number
  已出库数: number
  缺料数: number
  仓库名称: string
  仓库数: number
  仓库缺料: number
  备注: string
}

export interface WorkOrderPrintData {
  /** 产品编号（主产品货号） */
  productNo: string
  /** 产品名称 */
  productName: string
  /** 产品规格 */
  productSpec: string
  /** 工单列表，通常只传一条 */
  workOrders: WorkOrderPrintItem[]
  /** 物料明细 */
  materials: MaterialPrintItem[]
}

const EMPTY = '-'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fmt(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return EMPTY
  return escapeHtml(String(value))
}

async function makeQrCode(text: string): Promise<string> {
  if (!text) return ''
  try {
    return await toDataURL(text, {
      width: 120,
      margin: 1,
      errorCorrectionLevel: 'M',
    })
  } catch {
    return ''
  }
}

function renderInfoTable(
  wo: WorkOrderPrintItem,
  productQr: string,
  materialQr: string,
  data: WorkOrderPrintData,
): string {
  return `
    <table class="info-table">
      <tbody>
        <tr>
          <td class="label">工单单号：</td>
          <td class="value">${fmt(wo.工单单号)}</td>
          <td class="label">排 产 人：</td>
          <td class="value">${fmt(wo.排产用户)}</td>
          <td class="label">下单日期：</td>
          <td class="value">${fmt(wo.交货日期)}</td>
          <td class="label">计划交期：</td>
          <td class="value">${fmt(wo.交货日期)}</td>
          <td class="label">类 型：</td>
          <td class="value">${fmt(wo.来源)}</td>
          <td class="qr-cell" rowspan="6">
            <div class="qr-box">
              ${productQr ? `<img class="qr-img" src="${productQr}" alt="工单码" />` : `<div class="qr-placeholder"></div>`}
              <div class="qr-label">主产品</div>
              <div class="qr-label">工单码</div>
            </div>
          </td>
        </tr>
        <tr>
          <td class="label">工单状态：</td>
          <td class="value">${EMPTY}</td>
          <td class="label">工序车间：</td>
          <td class="value">${fmt(wo.工序车间)}</td>
          <td class="label">工 序：</td>
          <td class="value">${fmt(wo.工序)}</td>
          <td class="label">工单层级：</td>
          <td class="value" colspan="3">${fmt(wo.工单层级)}</td>
        </tr>
        <tr>
          <td class="label">货 号：</td>
          <td class="value" colspan="3">${fmt(data.productNo)}</td>
          <td class="label">品 名：</td>
          <td class="value" colspan="3">${fmt(data.productName)}</td>
          <td class="label">规 格：</td>
          <td class="value">${fmt(data.productSpec)}</td>
        </tr>
        <tr>
          <td class="label">倒扣仓库：</td>
          <td class="value" colspan="2">${fmt(wo.仓库名称)}</td>
          <td class="qr-cell-mid" rowspan="3">
            <div class="qr-box">
              ${materialQr ? `<img class="qr-img" src="${materialQr}" alt="物料码" />` : `<div class="qr-placeholder"></div>`}
              <div class="qr-label">物料码</div>
            </div>
          </td>
          <td class="label">电 压：</td>
          <td class="value" colspan="2">${fmt(wo.电压)}</td>
          <td class="label">线 圈：</td>
          <td class="value" colspan="2">${fmt(wo.线圈)}</td>
        </tr>
        <tr>
          <td class="label" rowspan="2">备 注：</td>
          <td class="value" rowspan="2" colspan="2">${fmt(wo.备注)}</td>
          <td class="label">排产编号：</td>
          <td class="value" colspan="2">${fmt(wo.排产编号)}</td>
          <td class="label">订 单 数：</td>
          <td class="value" colspan="2">${fmt(wo.订单数)}</td>
        </tr>
        <tr>
          <td class="label">生 产 数：</td>
          <td class="value">${fmt(wo.生产数)}</td>
          <td class="label">入 库 数：</td>
          <td class="value">${fmt(wo.入库数)}</td>
          <td class="label">单 位：</td>
          <td class="value">${fmt(wo.单位)}</td>
        </tr>
      </tbody>
    </table>
  `
}

function renderMaterialTable(materials: MaterialPrintItem[]): string {
  if (materials.length === 0) {
    return `<div class="no-material">暂无物料明细</div>`
  }

  const rows = materials
    .map((m, index) => {
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${fmt(m.产品属性)}</td>
          <td>${fmt(m.货号)}</td>
          <td>${fmt(m.品名)}</td>
          <td>${fmt(m.规格)}</td>
          <td>${fmt(m.来源)}</td>
          <td>${fmt(m.需求数)}</td>
          <td>${fmt(m.单位)}</td>
          <td>${fmt(m.仓库名称)}</td>
          <td>${fmt(m.仓库数)}</td>
          <td>${fmt(m.备注)}</td>
          <td>${EMPTY}</td>
          <td>${fmt(m.已出库数)}</td>
          <td>${fmt(m.用量)}</td>
          <td>${EMPTY}</td>
        </tr>
      `
    })
    .join('')

  return `
    <table class="material-table">
      <colgroup>
        <col style="width: 4%;" />
        <col style="width: 7%;" />
        <col style="width: 12%;" />
        <col style="width: 17%;" />
        <col style="width: 10%;" />
        <col style="width: 6%;" />
        <col style="width: 5%;" />
        <col style="width: 5%;" />
        <col style="width: 9%;" />
        <col style="width: 6%;" />
        <col style="width: 8%;" />
        <col style="width: 5%;" />
        <col style="width: 6%;" />
        <col style="width: 5%;" />
        <col style="width: 5%;" />
      </colgroup>
      <thead>
        <tr>
          <th>序号</th>
          <th>商品属性</th>
          <th>货号</th>
          <th>品名</th>
          <th>规格</th>
          <th>来源</th>
          <th>数量</th>
          <th>单位</th>
          <th>仓库名称</th>
          <th>仓库数</th>
          <th>备注</th>
          <th>货位号</th>
          <th>出库数量</th>
          <th>单位用量</th>
          <th>配料模式</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `
}

async function buildHtml(data: WorkOrderPrintData): Promise<string> {
  const pages = await Promise.all(
    data.workOrders.map(async (wo) => {
      const productQr = await makeQrCode(data.productNo || wo.工单单号)
      const materialQr = await makeQrCode(data.productNo)
      const infoTable = renderInfoTable(wo, productQr, materialQr, data)
      const materialTable = renderMaterialTable(data.materials)

      return `
        <div class="print-page">
          <div class="page-header">
            <div class="page-title">生 产 工 单</div>
            <div class="order-type">订单类型：</div>
          </div>
          ${infoTable}
          <div class="material-section">
            ${materialTable}
          </div>
        </div>
      `
    }),
  )

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>生产工单打印</title>
        <style>
          @page {
            size: 241mm 140mm;
            margin: 0;
          }
          * {
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
            font-family: 'Microsoft YaHei', SimSun, Arial, sans-serif;
            font-size: 10pt;
            color: #000;
            background: #fff;
          }
          .print-page {
            width: 241mm;
            min-height: 140mm;
            padding: 5mm 4mm 4mm 4mm;
            page-break-after: always;
            overflow: hidden;
          }
          .print-page:last-child {
            page-break-after: auto;
          }
          .page-header {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 3mm;
          }
          .page-title {
            text-align: center;
            font-size: 20pt;
            font-weight: bold;
            letter-spacing: 6px;
            color: #000;
          }
          .order-type {
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            font-size: 9pt;
            white-space: nowrap;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          .info-table td {
            border: 1px solid #000;
            padding: 1.5mm 1.5mm;
            vertical-align: middle;
            font-size: 9pt;
            line-height: 1.25;
            word-break: break-all;
          }
          .info-table .label {
            width: 6%;
            text-align: center;
            font-weight: normal;
            background: #fff;
            white-space: nowrap;
            padding: 1.5mm 0.5mm;
          }
          .info-table .value {
            width: 11%;
            text-align: left;
            padding-left: 1.5mm;
          }
          .qr-cell {
            width: 12%;
            text-align: center;
            vertical-align: middle;
            padding: 1mm;
          }
          .qr-cell-mid {
            width: 8%;
            text-align: center;
            vertical-align: middle;
            padding: 0.5mm;
          }
          .qr-box {
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.5mm;
          }
          .qr-img {
            width: 25mm;
            height: 25mm;
            display: block;
          }
          .qr-placeholder {
            width: 25mm;
            height: 25mm;
            border: 1px dashed #999;
          }
          .qr-label {
            font-size: 8pt;
            color: #000;
            text-align: center;
            white-space: nowrap;
            line-height: 1.2;
          }
          .material-section {
            margin-top: 2mm;
          }
          .material-table th,
          .material-table td {
            border: 1px solid #000;
            padding: 1mm 0.8mm;
            text-align: center;
            vertical-align: middle;
            font-size: 8pt;
            line-height: 1.2;
            word-break: break-all;
          }
          .material-table th {
            font-weight: bold;
            background: #fff;
          }
          .material-table td:nth-child(4),
          .material-table td:nth-child(3) {
            text-align: left;
            padding-left: 1.5mm;
          }
          .no-material {
            text-align: center;
            padding: 10mm 0;
            font-size: 10pt;
            color: #666;
            border: 1px solid #000;
          }
          @media print {
            html, body {
              background: #fff;
            }
            .print-page {
              width: 241mm;
              min-height: 140mm;
            }
          }
        </style>
      </head>
      <body>
        ${pages.join('')}
      </body>
    </html>
  `
}

function openPrintWindow(html: string): void {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = 'none'
  iframe.style.visibility = 'hidden'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) {
    document.body.removeChild(iframe)
    return
  }

  doc.open()
  doc.write(html)
  doc.close()

  const printWin = iframe.contentWindow
  if (!printWin) {
    document.body.removeChild(iframe)
    return
  }

  printWin.onafterprint = () => {
    if (iframe.parentNode) {
      document.body.removeChild(iframe)
    }
  }

  setTimeout(() => {
    printWin.focus()
    printWin.print()
  }, 200)

  setTimeout(() => {
    if (iframe.parentNode) {
      document.body.removeChild(iframe)
    }
  }, 10000)
}

export async function printWorkOrder(data: WorkOrderPrintData): Promise<void> {
  if (!data.workOrders || data.workOrders.length === 0) return
  const html = await buildHtml(data)
  openPrintWindow(html)
}
