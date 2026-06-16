import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function readEnv(path) {
  return Object.fromEntries(
    fs.readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
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

for (const [id, name_zh] of roles) {
  const { error } = await supabase.from("app_roles").update({ name_zh }).eq("id", id);
  if (error) throw error;
}

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

for (const [username, full_name] of userNames) {
  const { error } = await supabase.from("app_users").update({ full_name }).eq("username", username);
  if (error) throw error;
}

const recordUpdates = [
  ["organization", "样例：建立巴基斯坦工厂岗位责任矩阵", "确认每个部门负责人和备用负责人。", "关键岗位空缺超过 48 小时，由总经理指定临时负责人并升级给 CEO。", { department: "管理层", position: "全部关键岗位", permission: "采购、仓库、生产、销售、财务、进出口、实验室审批权限。" }],
  ["documents", "样例：采购审批 SOP V1", "等待 CEO 确认审批金额权限。", "超过预算的采购在批准前不得执行。", { documentNo: "SOP-PUR-001", version: "V1.0", requiredDocs: "采购申请、供应商比价表、采购订单模板", receivedDocs: "采购申请" }],
  ["procurement", "样例：液体钙原料询价", "缺少 MSDS 和最终报价有效期。", "如果今天没有收到 MSDS，暂停付款审批，并启动备用供应商询价。", { supplier: "中国供应商 A", item: "钙原料", quantity: 1000, amount: 0, requiredDocs: "COA, MSDS, 发票, 装箱单", receivedDocs: "COA" }],
  ["warehouse", "样例：DAYI ZINC-MAX 成品库存", "当前库存低于安全库存。", "低于安全库存时，销售确认两周需求预测，采购准备补货。", { sku: "DY-ZN-006", batchNo: "PK-2606-ZN01", quantity: 88, reorderLevel: 120, expiryDate: dateOffset(38), location: "成品库 A2" }],
  ["production", "样例：DAYI HUMATE-FLOW 试生产批次", "等待实验室确认配方。", "如果 pH 或溶解性不合格，停止包装、留样复检并通知 CEO。", { product: "DAYI HUMATE-FLOW", batchNo: "TRIAL-HF-001", quantity: 500, actualQuantity: 0, lossRate: 0 }],
  ["sales", "样例：拉合尔经销商锌肥报价跟进", "今天需要 WhatsApp 跟进报价反馈。", "客户压价时，先用小批量试单和作物效果资料争取订单，不直接降到底价。", { customer: "拉合尔经销商", product: "DAYI ZINC-MAX", amount: 0, paymentDue: dateOffset(12), nextFollowUp: dateOffset(0) }],
  ["finance", "样例：首批进口原料尾款审批", "等待采购补齐缺失文件。", "付款前必须确认 COA、MSDS、发票、装箱单齐全。", { transactionType: "应付", party: "中国供应商 A", amount: 0, paymentDue: dateOffset(1) }],
  ["import_export", "样例：中国到巴基斯坦首柜单证跟进", "缺少提单、COA、MSDS、原产地证和标签。", "单证不齐不得安排清关付款，缺失文件每天追踪两次并抄送 CEO。", { shipmentNo: "DY-CN-PK-001", supplier: "中国供应商 A", port: "Karachi", eta: dateOffset(18), requiredDocs: "发票, 装箱单, 提单, COA, MSDS, 原产地证, 标签", receivedDocs: "发票, 装箱单" }],
  ["logistics", "样例：拉合尔客户样品发货", "需要上传签收证明。", "如果快递未签收，销售当天联系客户确认备用地址。", { deliveryNo: "SAMPLE-LHR-001", customer: "拉合尔经销商", driver: "本地快递", quantity: 2, eta: dateOffset(1) }],
  ["hr", "样例：招聘本地仓库主管", "需要确认本地招聘渠道。", "招聘到位前，由生产经理临时复核仓库出入库。", { employee: "候选人待定", department: "仓库部", position: "仓库主管", trainingDue: dateOffset(20) }],
  ["maintenance", "样例：液体肥搅拌罐月度保养", "准备设备保养记录表。", "保养逾期不得安排满负荷生产，先检查密封件和电机。", { equipment: "搅拌罐", equipmentNo: "MT-001", maintenanceDue: dateOffset(4), downtimeHours: 0, sparePart: "密封件" }],
  ["lab", "样例：DAYI HUMATE-FLOW 溶解性检测", "今天必须出检测结论。", "检测不合格则隔离试产批次，禁止入库销售。", { sampleNo: "LAB-HF-001", product: "DAYI HUMATE-FLOW", testItem: "溶解性 / pH", result: "待检", coaNo: "" }],
  ["affairs", "样例：确认第一阶段系统使用责任人", "用于测试日常事务和提醒显示。", "任何未分配区域由总经理临时负责，直到 CEO 确认最终负责人。", { meeting: "CEO 运营会议", decision: "每个模块必须有负责人、审批人和协助人。", nextStep: "检查样例记录，并逐步替换成真实工厂数据。" }],
  ["market-phosphate-policy", "市场监控：中国产磷肥出口限制对巴基斯坦 DAP/NPK 供应影响", "每周跟踪磷肥出口审批、DAP/MAP/NPK 供应、巴基斯坦清关时间和卡拉奇到岸成本。", "如果出口证书审批延迟，立即准备替代来源，并保留旺季安全库存。", { rawMaterial: "MAP / DAP / 磷基 NPK", originCountry: "中国", chinaPolicyStatus: "受限 / 商检优先关注，持续跟踪磷肥出口审批状态", exportRestrictionLevel: "严重", pakistanImportImpact: "可能导致巴基斯坦进口单证延迟、到岸成本上升，影响旺季经销商供货。", freightRoute: "中国港口到 Karachi", pakistanCropSeason: "Kharif 备货期 / 棉花、水稻、玉米、甘蔗需求窗口", targetCrops: "棉花、水稻、玉米、甘蔗、蔬菜", fertilizerFit: "磷基复合肥、水溶 NPK、锌肥、生物刺激素配套产品。", recommendedAction: "提前锁定供应商单证，比较非中国备用来源，关键 SKU 保持 45-60 天库存，报价有效期每周更新。" }],
  ["market-freight-energy", "市场监控：运费与能源波动对特肥进口成本影响", "监控中东/霍尔木兹风险、集装箱、Karachi 港口拥堵和燃油附加费。", "如果运费超过预算，确认客户报价前必须重新计算到岸成本。", { rawMaterial: "液体钙、腐植酸、氨基酸、水溶 NPK", originCountry: "中国 / 中东供应链相关路线", chinaPolicyStatus: "多数特肥液体原料正常，但仍需关注单证检查和船期延误。", exportRestrictionLevel: "高运费风险", pakistanImportImpact: "运费上涨会抬高巴基斯坦到岸成本，给经销商报价需要缩短有效期。", freightRoute: "中国 / 海湾相关路线到 Karachi", pakistanCropSeason: "棉花、水稻营养需求；蔬菜钙肥和抗逆产品需求", targetCrops: "棉花、水稻、蔬菜、果树", fertilizerFit: "钙肥、腐植酸、氨基酸、锌肥、叶面 NPK 产品。", recommendedAction: "每周重算到岸成本，报价中加入运费缓冲，优先推广运费敏感度低、利润较高的产品。" }],
  ["market-crop-season-fit", "市场监控：巴基斯坦作物季节与重点产品匹配", "作为每周销售计划记录，判断当前巴基斯坦市场重点推广哪类产品。", "如果大宗肥价格剧烈波动，销售重点转向低用量、效果明显的特肥产品。", { rawMaterial: "特肥产品组合", originCountry: "中国成品 / 巴基斯坦本地复配", chinaPolicyStatus: "持续关注，不是所有特肥都受限；发货前确认 HS 编码和单证。", exportRestrictionLevel: "中等", pakistanImportImpact: "经销商需求随作物季节和农户现金压力变化，产品选择必须匹配作物痛点。", freightRoute: "中国到 Karachi，再到 Lahore/Punjab 分销", pakistanCropSeason: "小麦、棉花、水稻、玉米、甘蔗是主要用肥作物。", targetCrops: "小麦、棉花、甘蔗、水稻、玉米、蔬菜、果树", fertilizerFit: "水稻/棉花缺锌用锌肥；果实品质用钙肥；盐碱地和根系用腐植酸；抗逆恢复用氨基酸；叶面补充用 NPK。", recommendedAction: "准备按作物分类的经销商资料卡和 WhatsApp 跟进清单，旺季前优先推广锌肥、腐植酸和钙肥。" }]
];

for (const [seed, title, notes, contingency, dataPatch] of recordUpdates) {
  const { data, error } = await supabase.from("records").select("id,data").eq("data->>sampleSeedId", seed).maybeSingle();
  if (error) throw error;
  if (!data) continue;
  const { error: updateError } = await supabase
    .from("records")
    .update({ title, notes, contingency, data: { ...(data.data || {}), ...dataPatch } })
    .eq("id", data.id);
  if (updateError) throw updateError;
}

console.log(JSON.stringify({ roles: roles.length, users: userNames.length, records: recordUpdates.length }, null, 2));
