import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function readEnv(path) {
  return Object.fromEntries(
    fs.readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.trim().startsWith("#"))
      .map((line) => {
        const idx = line.indexOf("=");
        return [line.slice(0, idx), line.slice(idx + 1)];
      })
  );
}

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const env = readEnv(".env.local");
const supabase = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const roles = [
  ["super_admin", "CEO / 超级管理员"],
  ["general_manager", "总经理"],
  ["procurement_manager", "采购经理"],
  ["warehouse_manager", "仓库主管"],
  ["production_manager", "生产经理"],
  ["qc_manager", "质量/实验室负责人"],
  ["sales_manager", "销售经理"],
  ["finance_manager", "财务经理"],
  ["import_export_manager", "进出口负责人"],
  ["logistics_coordinator", "物流运输协调"],
  ["hr_admin", "人事行政"],
  ["maintenance_supervisor", "设备维护主管"]
];

const userNames = [
  ["gm_sample", "总经理样例"],
  ["procurement_sample", "采购负责人样例"],
  ["warehouse_sample", "仓库负责人样例"],
  ["production_sample", "生产负责人样例"],
  ["qc_sample", "实验室负责人样例"],
  ["sales_sample", "销售负责人样例"],
  ["finance_sample", "财务负责人样例"],
  ["export_sample", "进出口负责人样例"],
  ["logistics_sample", "物流负责人样例"],
  ["hr_sample", "人事负责人样例"],
  ["maintenance_sample", "设备维护负责人样例"]
];

const recordUpdates = [
  {
    seed: "organization",
    title_zh: "样例：建立巴基斯坦工厂岗位责任矩阵",
    title_en: "Sample: Pakistan factory responsibility matrix",
    notes_zh: "确认每个部门负责人和备用负责人。",
    notes_en: "Confirm the owner and backup owner for every department.",
    contingency_zh: "关键岗位空缺超过 48 小时，由总经理指定临时负责人并升级给 CEO。",
    contingency_en: "If a key position is vacant for more than 48 hours, the general manager appoints a temporary owner and escalates to the CEO.",
    data: {
      department_zh: "管理层",
      department_en: "Management",
      position_zh: "全部关键岗位",
      position_en: "All key positions",
      permission_zh: "采购、仓库、生产、销售、财务、进出口、实验室审批权限。",
      permission_en: "Approval access for procurement, warehouse, production, sales, finance, import/export and laboratory work."
    }
  },
  {
    seed: "documents",
    title_zh: "样例：采购审批 SOP V1",
    title_en: "Sample: Procurement approval SOP V1",
    notes_zh: "等待 CEO 确认审批金额权限。",
    notes_en: "Waiting for CEO confirmation of approval amount limits.",
    contingency_zh: "超过预算的采购在批准前不得执行。",
    contingency_en: "Purchases above budget must not be executed before approval.",
    data: {
      documentNo: "SOP-PUR-001",
      version: "V1.0",
      requiredDocs_zh: "采购申请、供应商比价表、采购订单模板",
      requiredDocs_en: "Purchase request, supplier comparison sheet, purchase order template",
      receivedDocs_zh: "采购申请",
      receivedDocs_en: "Purchase request"
    }
  },
  {
    seed: "procurement",
    title_zh: "样例：液体钙原料询价",
    title_en: "Sample: Liquid calcium raw material RFQ",
    notes_zh: "缺少 MSDS 和最终报价有效期。",
    notes_en: "MSDS and final quotation validity are missing.",
    contingency_zh: "如果今天没有收到 MSDS，暂停付款审批，并启动备用供应商询价。",
    contingency_en: "If MSDS is not received today, pause payment approval and start RFQ with a backup supplier.",
    data: {
      supplier_zh: "中国供应商 A",
      supplier_en: "China Supplier A",
      item_zh: "钙原料",
      item_en: "Calcium raw material",
      quantity: 1000,
      amount: 0,
      requiredDocs_zh: "COA, MSDS, 发票, 装箱单",
      requiredDocs_en: "COA, MSDS, invoice, packing list",
      receivedDocs_zh: "COA",
      receivedDocs_en: "COA"
    }
  },
  {
    seed: "warehouse",
    title_zh: "样例：DAYI ZINC-MAX 成品库存",
    title_en: "Sample: DAYI ZINC-MAX finished goods stock",
    notes_zh: "当前库存低于安全库存。",
    notes_en: "Current stock is below safety stock.",
    contingency_zh: "低于安全库存时，销售确认两周需求预测，采购准备补货。",
    contingency_en: "When stock is below safety level, sales confirms the two-week demand forecast and procurement prepares replenishment.",
    data: { sku: "DY-ZN-006", batchNo: "PK-2606-ZN01", quantity: 88, reorderLevel: 120, expiryDate: dateOffset(38), location_zh: "成品库 A2", location_en: "Finished goods warehouse A2" }
  },
  {
    seed: "production",
    title_zh: "样例：DAYI HUMATE-FLOW 试生产批次",
    title_en: "Sample: DAYI HUMATE-FLOW trial batch",
    notes_zh: "等待实验室确认配方。",
    notes_en: "Waiting for laboratory formula confirmation.",
    contingency_zh: "如果 pH 或溶解性不合格，停止包装、留样复检并通知 CEO。",
    contingency_en: "If pH or solubility fails, stop packing, retain samples for retest and notify the CEO.",
    data: { product: "DAYI HUMATE-FLOW", batchNo: "TRIAL-HF-001", quantity: 500, actualQuantity: 0, lossRate: 0 }
  },
  {
    seed: "sales",
    title_zh: "样例：拉合尔经销商锌肥报价跟进",
    title_en: "Sample: Lahore dealer zinc fertilizer quote follow-up",
    notes_zh: "今天需要 WhatsApp 跟进报价反馈。",
    notes_en: "WhatsApp quotation feedback follow-up is needed today.",
    contingency_zh: "客户压价时，先用小批量试单和作物效果资料争取订单，不直接降到底价。",
    contingency_en: "If the customer pushes price down, use a small trial order and crop result materials before reducing to bottom price.",
    data: { customer_zh: "拉合尔经销商", customer_en: "Lahore dealer", product: "DAYI ZINC-MAX", amount: 0, paymentDue: dateOffset(12), nextFollowUp: dateOffset(0) }
  },
  {
    seed: "finance",
    title_zh: "样例：首批进口原料尾款审批",
    title_en: "Sample: First import raw material balance payment approval",
    notes_zh: "等待采购补齐缺失文件。",
    notes_en: "Waiting for procurement to complete missing documents.",
    contingency_zh: "付款前必须确认 COA、MSDS、发票、装箱单齐全。",
    contingency_en: "Before payment, COA, MSDS, invoice and packing list must all be complete.",
    data: { transactionType_zh: "应付", transactionType_en: "Payable", party_zh: "中国供应商 A", party_en: "China Supplier A", amount: 0, paymentDue: dateOffset(1) }
  },
  {
    seed: "import_export",
    title_zh: "样例：中国到巴基斯坦首柜单证跟进",
    title_en: "Sample: China to Pakistan first container documents",
    notes_zh: "缺少提单、COA、MSDS、原产地证和标签。",
    notes_en: "Bill of lading, COA, MSDS, certificate of origin and label are missing.",
    contingency_zh: "单证不齐不得安排清关付款，缺失文件每天追踪两次并抄送 CEO。",
    contingency_en: "Do not arrange clearance payment until documents are complete. Missing files are followed up twice daily and copied to the CEO.",
    data: { shipmentNo: "DY-CN-PK-001", supplier_zh: "中国供应商 A", supplier_en: "China Supplier A", port: "Karachi", eta: dateOffset(18), requiredDocs_zh: "发票, 装箱单, 提单, COA, MSDS, 原产地证, 标签", requiredDocs_en: "Invoice, packing list, bill of lading, COA, MSDS, certificate of origin, label", receivedDocs_zh: "发票, 装箱单", receivedDocs_en: "Invoice, packing list" }
  },
  {
    seed: "logistics",
    title_zh: "样例：拉合尔客户样品发货",
    title_en: "Sample: Lahore customer sample delivery",
    notes_zh: "需要上传签收证明。",
    notes_en: "Proof of delivery needs to be uploaded.",
    contingency_zh: "如果快递未签收，销售当天联系客户确认备用地址。",
    contingency_en: "If the courier is not signed, sales contacts the customer the same day to confirm a backup address.",
    data: { deliveryNo: "SAMPLE-LHR-001", customer_zh: "拉合尔经销商", customer_en: "Lahore dealer", driver_zh: "本地快递", driver_en: "Local courier", quantity: 2, eta: dateOffset(1) }
  },
  {
    seed: "hr",
    title_zh: "样例：招聘本地仓库主管",
    title_en: "Sample: Recruit local warehouse supervisor",
    notes_zh: "需要确认本地招聘渠道。",
    notes_en: "Local recruitment channels need confirmation.",
    contingency_zh: "招聘到位前，由生产经理临时复核仓库出入库。",
    contingency_en: "Before hiring is complete, the production manager temporarily checks warehouse in/out records.",
    data: { employee_zh: "候选人待定", employee_en: "Candidate pending", department_zh: "仓库部", department_en: "Warehouse", position_zh: "仓库主管", position_en: "Warehouse supervisor", trainingDue: dateOffset(20) }
  },
  {
    seed: "maintenance",
    title_zh: "样例：液体肥搅拌罐月度保养",
    title_en: "Sample: Monthly mixing tank maintenance",
    notes_zh: "准备设备保养记录表。",
    notes_en: "Prepare the equipment maintenance record sheet.",
    contingency_zh: "保养逾期不得安排满负荷生产，先检查密封件和电机。",
    contingency_en: "If maintenance is overdue, avoid full-load production and inspect seals and motor first.",
    data: { equipment_zh: "搅拌罐", equipment_en: "Mixing tank", equipmentNo: "MT-001", maintenanceDue: dateOffset(4), downtimeHours: 0, sparePart_zh: "密封件", sparePart_en: "Seal parts" }
  },
  {
    seed: "lab",
    title_zh: "样例：DAYI HUMATE-FLOW 溶解性检测",
    title_en: "Sample: DAYI HUMATE-FLOW solubility test",
    notes_zh: "今天必须出检测结论。",
    notes_en: "The test conclusion must be issued today.",
    contingency_zh: "检测不合格则隔离试生产批次，禁止入库销售。",
    contingency_en: "If the test fails, isolate the trial batch and block warehouse entry and sales.",
    data: { sampleNo: "LAB-HF-001", product: "DAYI HUMATE-FLOW", testItem_zh: "溶解性 / pH", testItem_en: "Solubility / pH", result_zh: "待检", result_en: "Pending test", coaNo: "" }
  },
  {
    seed: "affairs",
    title_zh: "样例：确认第一阶段系统使用责任人",
    title_en: "Sample: Confirm first-stage system responsibility owners",
    notes_zh: "用于测试日常事务和提醒显示。",
    notes_en: "Used to test daily affairs and reminder display.",
    contingency_zh: "任何未分配区域由总经理临时负责，直到 CEO 确认最终负责人。",
    contingency_en: "Any unassigned area is temporarily owned by the general manager until the CEO confirms the final owner.",
    data: { meeting_zh: "CEO 运营会议", meeting_en: "CEO operations meeting", decision_zh: "每个模块必须有负责人、审批人和协助人。", decision_en: "Every module must have an owner, approver and support person.", nextStep_zh: "检查样例记录，并逐步替换成真实工厂数据。", nextStep_en: "Review sample records and gradually replace them with real factory data." }
  },
  {
    seed: "market-phosphate-policy",
    title_zh: "市场监控：中国磷肥出口限制对巴基斯坦 DAP/NPK 供应影响",
    title_en: "Market Watch: China phosphate export restriction impact on Pakistan DAP/NPK supply",
    notes_zh: "每周跟踪磷肥出口审批、DAP/MAP/NPK 供应、巴基斯坦清关时间和卡拉奇到岸成本。",
    notes_en: "Track phosphate export approvals, DAP/MAP/NPK supply, Pakistan clearance time and Karachi landed cost every week.",
    contingency_zh: "如果出口证书审批延迟，立即准备替代来源，并保留旺季安全库存。",
    contingency_en: "If export certificate approval is delayed, prepare alternative sources immediately and reserve peak-season safety stock.",
    data: { rawMaterial_zh: "MAP / DAP / 磷基 NPK", rawMaterial_en: "MAP / DAP / phosphate-based NPK", originCountry_zh: "中国", originCountry_en: "China", chinaPolicyStatus_zh: "受限 / 商检优先关注，持续跟踪磷肥出口审批状态", chinaPolicyStatus_en: "Restricted / inspection priority, continuously track phosphate export approval status", exportRestrictionLevel_zh: "严重", exportRestrictionLevel_en: "Critical", pakistanImportImpact_zh: "可能导致巴基斯坦进口单证延迟、到岸成本上升，影响旺季经销商供货。", pakistanImportImpact_en: "May delay Pakistan import documents, increase landed cost and affect dealer supply in peak season.", currentPriceUsd: 630, previousPriceUsd: 520, priceChangePercent: 21, freightCostUsd: 95, freightRoute_zh: "中国港口到 Karachi", freightRoute_en: "China port to Karachi", pakistanCropSeason_zh: "Kharif 备货期 / 棉花、水稻、玉米、甘蔗需求窗口", pakistanCropSeason_en: "Kharif stocking period / cotton, rice, maize and sugarcane demand window", targetCrops_zh: "棉花、水稻、玉米、甘蔗、蔬菜", targetCrops_en: "Cotton, rice, maize, sugarcane and vegetables", fertilizerFit_zh: "磷基复合肥、水溶 NPK、锌肥、生物刺激素配套产品。", fertilizerFit_en: "Phosphate compound fertilizer, water-soluble NPK, zinc fertilizer and biostimulant support products.", inventoryCoverDays: 22, recommendedAction_zh: "提前锁定供应商单证，比较非中国备用来源，关键 SKU 保持 45-60 天库存，报价有效期每周更新。", recommendedAction_en: "Lock supplier documents early, compare non-China backup sources, keep 45-60 days of key SKU stock and update quotation validity weekly." }
  },
  {
    seed: "market-freight-energy",
    title_zh: "市场监控：运费与能源波动对特肥进口成本影响",
    title_en: "Market Watch: Freight and energy disruption risk for specialty fertilizer imports",
    notes_zh: "监控中东/霍尔木兹风险、集装箱、Karachi 港口拥堵和燃油附加费。",
    notes_en: "Monitor Middle East/Hormuz risk, containers, Karachi port congestion and fuel surcharges.",
    contingency_zh: "如果运费超过预算，确认客户报价前必须重新计算到岸成本。",
    contingency_en: "If freight exceeds budget, recalculate landed cost before confirming customer quotations.",
    data: { rawMaterial_zh: "液体钙、腐植酸、氨基酸、水溶 NPK", rawMaterial_en: "Liquid calcium, humic acid, amino acid and water-soluble NPK", originCountry_zh: "中国 / 中东供应链相关路线", originCountry_en: "China / Middle East-linked supply routes", chinaPolicyStatus_zh: "多数特肥液体原料正常，但仍需关注单证检查和船期延误。", chinaPolicyStatus_en: "Most liquid specialty fertilizer inputs are normal, but document checks and sailing delays still need attention.", exportRestrictionLevel_zh: "高运费风险", exportRestrictionLevel_en: "High freight risk", pakistanImportImpact_zh: "运费上涨会抬高巴基斯坦到岸成本，给经销商报价需要缩短有效期。", pakistanImportImpact_en: "Rising freight increases Pakistan landed cost, so dealer quotation validity should be shortened.", currentPriceUsd: 420, previousPriceUsd: 390, priceChangePercent: 8, freightCostUsd: 135, freightRoute_zh: "中国 / 海湾相关路线到 Karachi", freightRoute_en: "China / Gulf-linked route to Karachi", pakistanCropSeason_zh: "棉花、水稻营养需求；蔬菜钙肥和抗逆产品需求", pakistanCropSeason_en: "Cotton and rice nutrition demand; vegetable calcium and stress-resistance product demand", targetCrops_zh: "棉花、水稻、蔬菜、果树", targetCrops_en: "Cotton, rice, vegetables and orchards", fertilizerFit_zh: "钙肥、腐植酸、氨基酸、锌肥、叶面 NPK 产品。", fertilizerFit_en: "Calcium fertilizer, humic acid, amino acid, zinc fertilizer and foliar NPK products.", inventoryCoverDays: 36, recommendedAction_zh: "每周重算到岸成本，报价中加入运费缓冲，优先推广运费敏感度低、利润较高的产品。", recommendedAction_en: "Recalculate landed cost weekly, include freight buffer in quotations and prioritize higher-margin products with lower freight sensitivity." }
  },
  {
    seed: "market-crop-season-fit",
    title_zh: "市场监控：巴基斯坦作物季节与重点产品匹配",
    title_en: "Market Watch: Pakistan crop season product fit and dealer priority",
    notes_zh: "作为每周销售计划记录，判断当前巴基斯坦市场重点推广哪类产品。",
    notes_en: "Weekly sales planning record to decide which product types should be promoted in Pakistan now.",
    contingency_zh: "如果大宗肥价格剧烈波动，销售重点转向低用量、效果明显的特肥产品。",
    contingency_en: "If commodity fertilizer prices swing sharply, shift sales focus to low-dose specialty fertilizers with visible effects.",
    data: { rawMaterial_zh: "特肥产品组合", rawMaterial_en: "Specialty fertilizer product portfolio", originCountry_zh: "中国成品 / 巴基斯坦本地复配", originCountry_en: "China finished products / Pakistan local blending", chinaPolicyStatus_zh: "持续关注，不是所有特肥都受限；发货前确认 HS 编码和单证。", chinaPolicyStatus_en: "Continue monitoring. Not all specialty fertilizers are restricted; confirm HS code and documents before shipment.", exportRestrictionLevel_zh: "中等", exportRestrictionLevel_en: "Medium", pakistanImportImpact_zh: "经销商需求随作物季节和农户现金压力变化，产品选择必须匹配作物痛点。", pakistanImportImpact_en: "Dealer demand changes with crop season and farmer cash pressure, so product choice must match crop pain points.", currentPriceUsd: 980, previousPriceUsd: 960, priceChangePercent: 2, freightCostUsd: 82, freightRoute_zh: "中国到 Karachi，再到 Lahore/Punjab 分销", freightRoute_en: "China to Karachi, then distribution to Lahore/Punjab", pakistanCropSeason_zh: "小麦、棉花、水稻、玉米、甘蔗是主要用肥作物。", pakistanCropSeason_en: "Wheat, cotton, rice, maize and sugarcane are the main fertilizer-use crops.", targetCrops_zh: "小麦、棉花、甘蔗、水稻、玉米、蔬菜、果树", targetCrops_en: "Wheat, cotton, sugarcane, rice, maize, vegetables and orchards", fertilizerFit_zh: "水稻/棉花缺锌用锌肥；果实品质用钙肥；盐碱地和根系用腐植酸；抗逆恢复用氨基酸；叶面补充用 NPK。", fertilizerFit_en: "Use zinc fertilizer for rice/cotton zinc deficiency, calcium for fruit quality, humic acid for saline soil and roots, amino acid for stress recovery and foliar NPK for nutrition.", inventoryCoverDays: 55, recommendedAction_zh: "准备按作物分类的经销商资料卡和 WhatsApp 跟进清单，旺季前优先推广锌肥、腐植酸和钙肥。", recommendedAction_en: "Prepare crop-specific dealer cards and WhatsApp follow-up lists. Before peak season, prioritize zinc fertilizer, humic acid and calcium fertilizer." }
  }
];

for (const [id, name_zh] of roles) {
  const { error } = await supabase.from("app_roles").update({ name_zh }).eq("id", id);
  if (error) throw error;
}

for (const [username, full_name] of userNames) {
  const { error } = await supabase.from("app_users").update({ full_name }).eq("username", username);
  if (error) throw error;
}

for (const record of recordUpdates) {
  const { data: row, error } = await supabase.from("records").select("id,data").eq("data->>sampleSeedId", record.seed).maybeSingle();
  if (error) throw error;
  if (!row) continue;

  const patch = {
    title_zh: record.title_zh,
    title_en: record.title_en,
    notes_zh: record.notes_zh,
    notes_en: record.notes_en,
    contingency_zh: record.contingency_zh,
    contingency_en: record.contingency_en,
    ...record.data
  };

  const { error: updateError } = await supabase
    .from("records")
    .update({
      title: record.title_zh,
      notes: record.notes_zh,
      contingency: record.contingency_zh,
      data: { ...(row.data || {}), ...patch }
    })
    .eq("id", row.id);
  if (updateError) throw updateError;
}

console.log(JSON.stringify({ roles: roles.length, users: userNames.length, records: recordUpdates.length }, null, 2));
