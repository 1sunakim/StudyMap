const mapEl = document.querySelector("#mindMap");
const courseNameEl = document.querySelector("#courseName");
const mapTitleEl = document.querySelector("#mapTitle");
const nodeTitleEl = document.querySelector("#nodeTitle");
const nodeStatusEl = document.querySelector("#nodeStatus");
const nodeContentEl = document.querySelector("#nodeContent");
const reviewListEl = document.querySelector("#reviewList");
const nodeCountEl = document.querySelector("#nodeCount");
const masteredCountEl = document.querySelector("#masteredCount");
const weakCountEl = document.querySelector("#weakCount");
const historyListEl = document.querySelector("#historyList");
const historyCountEl = document.querySelector("#historyCount");

let selectedNodeId = "root";
let nodes = [];
let historyRecords = [];

function createDemoMap(courseName) {
  return [
    {
      id: "root",
      parentId: null,
      title: courseName,
      status: "learning",
      content: `${courseName}的课程总览。这里可以沉淀课堂笔记、考试重点、知识结构和报告素材。`,
    },
    {
      id: "array",
      parentId: "root",
      title: "线性表",
      status: "mastered",
      content: "线性表是一组具有前后关系的数据元素。重点比较顺序表和链表的存储方式、插入删除复杂度。",
    },
    {
      id: "stack",
      parentId: "root",
      title: "栈与队列",
      status: "learning",
      content: "栈遵循后进先出，队列遵循先进先出。常见题型包括括号匹配、表达式求值、广度优先搜索。",
    },
    {
      id: "tree",
      parentId: "root",
      title: "树与二叉树",
      status: "new",
      content: "需要掌握遍历方式、二叉搜索树、平衡树的基本思想，以及堆结构。",
    },
    {
      id: "graph",
      parentId: "root",
      title: "图",
      status: "new",
      content: "图适合描述复杂关系。重点包括邻接矩阵、邻接表、DFS、BFS、最短路径和最小生成树。",
    },
    {
      id: "sort",
      parentId: "root",
      title: "排序算法",
      status: "learning",
      content: "比较冒泡、选择、插入、归并、快速排序的时间复杂度、稳定性和适用场景。",
    },
    {
      id: "linked",
      parentId: "array",
      title: "链表",
      status: "mastered",
      content: "链表通过指针连接节点，插入删除灵活，但随机访问效率低。",
    },
    {
      id: "binary-tree",
      parentId: "tree",
      title: "二叉树遍历",
      status: "new",
      content: "前序、中序、后序和层序遍历是二叉树题目的基础。",
    },
  ];
}

function formatTime(date = new Date()) {
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getChildren(parentId) {
  return nodes.filter((node) => node.parentId === parentId);
}

function getStatusText(status) {
  const statusMap = {
    new: "未学",
    learning: "学习中",
    mastered: "已掌握",
  };

  return statusMap[status] || "未知";
}

function addHistory(node, action, detail) {
  historyRecords.unshift({
    id: `history-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    nodeId: node.id,
    nodeTitle: node.title,
    action,
    detail,
    time: formatTime(),
  });

  renderHistory();
}

function buildChangeSummary(before, after) {
  const changes = [];

  if (before.title !== after.title) {
    changes.push(`名称：${before.title || "空"} -> ${after.title}`);
  }

  if (before.status !== after.status) {
    changes.push(`状态：${getStatusText(before.status)} -> ${getStatusText(after.status)}`);
  }

  if (before.content !== after.content) {
    const preview = after.content ? after.content.slice(0, 42) : "清空了详细内容";
    changes.push(`内容：${preview}${after.content.length > 42 ? "..." : ""}`);
  }

  return changes.join("；");
}

function layoutNodes() {
  const positions = new Map();
  const root = nodes.find((node) => node.parentId === null);
  positions.set(root.id, { x: 300, y: 270 });

  const firstLevel = getChildren(root.id);
  firstLevel.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / firstLevel.length - Math.PI / 2;
    const x = 300 + Math.cos(angle) * 250;
    const y = 270 + Math.sin(angle) * 210;
    positions.set(node.id, { x, y });

    getChildren(node.id).forEach((child, childIndex) => {
      positions.set(child.id, {
        x: x + 220,
        y: y + childIndex * 88 - 44,
      });
    });
  });

  return positions;
}

function drawLine(from, to) {
  const fromCenter = { x: from.x + 95, y: from.y + 36 };
  const toCenter = { x: to.x + 95, y: to.y + 36 };
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;
  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const line = document.createElement("div");

  line.className = "link-line";
  line.style.left = `${fromCenter.x}px`;
  line.style.top = `${fromCenter.y}px`;
  line.style.width = `${length}px`;
  line.style.transform = `rotate(${angle}deg)`;
  mapEl.appendChild(line);
}

function renderMap() {
  mapEl.innerHTML = "";
  const positions = layoutNodes();

  nodes.forEach((node) => {
    if (!node.parentId) return;
    drawLine(positions.get(node.parentId), positions.get(node.id));
  });

  nodes.forEach((node) => {
    const position = positions.get(node.id);
    const card = document.createElement("button");
    card.type = "button";
    card.className = `node ${node.status}${node.id === selectedNodeId ? " active" : ""}`;
    card.style.left = `${position.x}px`;
    card.style.top = `${position.y}px`;
    card.dataset.id = node.id;
    card.innerHTML = `
      <div class="node-title">${node.title}</div>
      <div class="node-summary">${node.content ? node.content.slice(0, 34) : "暂无简介，可在右侧补充"}${node.content.length > 34 ? "..." : ""}</div>
    `;
    card.addEventListener("click", () => selectNode(node.id));
    mapEl.appendChild(card);
  });

  updateMetrics();
}

function renderHistory() {
  historyCountEl.textContent = `${historyRecords.length} 条`;
  historyListEl.innerHTML = "";

  if (historyRecords.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-history";
    empty.textContent = "还没有修改记录。保存、添加知识点或使用 AI 后会出现在这里。";
    historyListEl.appendChild(empty);
    return;
  }

  historyRecords.forEach((record) => {
    const item = document.createElement("li");
    item.className = "history-item";
    item.innerHTML = `
      <div class="history-meta">
        <strong>${record.nodeTitle}</strong>
        <span>${record.time}</span>
      </div>
      <div class="history-text">${record.action}：${record.detail}</div>
    `;
    historyListEl.appendChild(item);
  });
}

function selectNode(id) {
  selectedNodeId = id;
  const node = nodes.find((item) => item.id === id);
  nodeTitleEl.value = node.title;
  nodeStatusEl.value = node.status;
  nodeContentEl.value = node.content;
  renderMap();
}

function saveSelectedNode(options = {}) {
  const node = nodes.find((item) => item.id === selectedNodeId);
  const before = { ...node };

  node.title = nodeTitleEl.value.trim() || "未命名知识点";
  node.status = nodeStatusEl.value;
  node.content = nodeContentEl.value.trim();

  const detail = options.detail || buildChangeSummary(before, node);
  if (!options.silent && detail) {
    addHistory(node, options.action || "保存修改", detail);
  }

  renderMap();
  updateMetrics();
}

function addChildNode() {
  saveSelectedNode({ silent: true });
  const parent = nodes.find((node) => node.id === selectedNodeId);
  const id = `node-${Date.now()}`;
  const child = {
    id,
    parentId: parent.id,
    title: "新知识点",
    status: "new",
    content: "",
  };

  nodes.push(child);
  addHistory(child, "新增知识点", `添加到「${parent.title}」下`);
  selectNode(id);
}

function generateAiText(mode) {
  const node = nodes.find((item) => item.id === selectedNodeId);
  const parent = nodes.find((item) => item.id === node.parentId);
  const context = parent ? `它属于「${parent.title}」这一部分。` : "它是课程总览节点。";
  const currentContent = node.content || "这里可以先写下你对这个知识点的初步理解。";

  if (mode === "questions") {
    return `${currentContent}

自测题：
1. 请用自己的话解释「${node.title}」的核心概念。
2. ${context}它通常解决什么问题？
3. 学习「${node.title}」时最容易混淆的点是什么？
4. 请举一个课堂、作业或项目中的应用例子。`;
  }

  return `${currentContent}

AI 撰写草稿：
「${node.title}」是本课程中的一个关键知识点。${context}学习时可以从定义、适用场景、典型例题和常见错误四个角度展开。

建议笔记结构：
- 概念定义：说明它是什么，以及与相近概念的区别。
- 使用场景：说明什么时候会用到它。
- 解题步骤：整理成可以复用的流程。
- 易错点：记录课堂、作业和考试中常见问题。
- 例子：补充一个能帮助理解的具体案例。`;
}

function appendAiText(mode) {
  const action = mode === "questions" ? "AI 生成自测题" : "AI 撰写解释";
  nodeContentEl.value = generateAiText(mode);
  saveSelectedNode({
    action,
    detail: `为「${nodeTitleEl.value}」生成了${mode === "questions" ? "自测题" : "解释草稿"}`,
  });
}

function updateMetrics() {
  nodeCountEl.textContent = nodes.length;
  masteredCountEl.textContent = nodes.filter((node) => node.status === "mastered").length;
  weakCountEl.textContent = nodes.filter((node) => node.status !== "mastered").length;
}

function renderReviewItems() {
  const weakNodes = nodes.filter((node) => node.status !== "mastered");
  reviewListEl.innerHTML = "";
  weakNodes.forEach((node) => {
    const item = document.createElement("li");
    item.textContent = `${node.title}：补充定义、例题和易错点`;
    reviewListEl.appendChild(item);
  });
}

function generateReviewList() {
  saveSelectedNode({ action: "生成复习清单", detail: "根据当前掌握状态刷新复习内容" });
  renderReviewItems();
}

function exportJson() {
  saveSelectedNode({ action: "导出数据", detail: "导出当前知识地图 JSON 文件" });
  const data = JSON.stringify({ course: courseNameEl.value, nodes, historyRecords }, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${courseNameEl.value || "course-map"}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function rebuildCourse() {
  const courseName = courseNameEl.value.trim() || "我的课程";
  mapTitleEl.textContent = `${courseName}知识地图`;
  nodes = createDemoMap(courseName);
  historyRecords = [];
  selectedNodeId = "root";
  selectNode(selectedNodeId);
  renderReviewItems();
  renderHistory();
}

document.querySelector("#buildDemoMap").addEventListener("click", rebuildCourse);
document.querySelector("#addChild").addEventListener("click", addChildNode);
document.querySelector("#generateReview").addEventListener("click", generateReviewList);
document.querySelector("#exportJson").addEventListener("click", exportJson);
document.querySelector("#aiExplain").addEventListener("click", () => appendAiText("explain"));
document.querySelector("#aiQuestions").addEventListener("click", () => appendAiText("questions"));
document.querySelector("#saveNode").addEventListener("click", () => saveSelectedNode());

rebuildCourse();
