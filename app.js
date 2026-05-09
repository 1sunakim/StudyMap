const mapViewportEl = document.querySelector("#mapViewport");
const mapEl = document.querySelector("#mindMap");
const mapSelectorEl = document.querySelector("#mapSelector");
const courseNameEl = document.querySelector("#courseName");
const mapTitleEl = document.querySelector("#mapTitle");
const nodeTitleEl = document.querySelector("#nodeTitle");
const nodeStatusEl = document.querySelector("#nodeStatus");
const nodeIntroEl = document.querySelector("#nodeIntro");
const nodeQuestionsEl = document.querySelector("#nodeQuestions");
const aiDraftEl = document.querySelector("#aiDraft");
const draftTypeEl = document.querySelector("#draftType");
const reviewListEl = document.querySelector("#reviewList");
const learningChainEl = document.querySelector("#learningChain");
const nodeCountEl = document.querySelector("#nodeCount");
const masteredCountEl = document.querySelector("#masteredCount");
const weakCountEl = document.querySelector("#weakCount");
const historyListEl = document.querySelector("#historyList");
const historyCountEl = document.querySelector("#historyCount");
const zoomRangeEl = document.querySelector("#zoomRange");
const zoomValueEl = document.querySelector("#zoomValue");
const deleteNodeEl = document.querySelector("#deleteNode");
const importFileEl = document.querySelector("#importFile");

let selectedNodeId = "root";
let nodes = [];
let historyRecords = [];
let maps = [];
let activeMapId = "";
let aiDraftType = "";
let mapTransform = { x: 40, y: 40, scale: 1 };
let dragState = null;
let nodePressState = null;
let nodeDragState = null;
let currentPositions = new Map();

function createMapState({ id, name, course, nodes: mapNodes, historyRecords: mapHistory = [], selectedNodeId: selected = "root", transform = { x: 40, y: 40, scale: 1 } }) {
  return {
    id: id || `map-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    course,
    nodes: mapNodes,
    historyRecords: mapHistory,
    selectedNodeId: selected,
    transform,
  };
}

function createNode({ id, parentId, title, status, intro, questions = "", x = null, y = null }) {
  return { id, parentId, title, status, intro, questions, x, y };
}

function createDemoMap(courseName) {
  return [
    createNode({
      id: "root",
      parentId: null,
      title: courseName,
      status: "learning",
      intro: `${courseName}的课程总览。这里可以沉淀课堂笔记、考试重点、知识结构和报告素材。`,
      questions: "自测：请列出本课程最重要的三个章节，并说明它们之间的关系。",
    }),
    createNode({
      id: "array",
      parentId: "root",
      title: "线性表",
      status: "mastered",
      intro: "线性表是一组具有前后关系的数据元素。重点比较顺序表和链表的存储方式、插入删除复杂度。",
      questions: "例题：为什么顺序表适合随机访问，而链表适合频繁插入和删除？",
    }),
    createNode({
      id: "stack",
      parentId: "root",
      title: "栈与队列",
      status: "learning",
      intro: "栈遵循后进先出，队列遵循先进先出。常见题型包括括号匹配、表达式求值、广度优先搜索。",
      questions: "自测：用栈判断一段括号序列是否合法，并写出核心步骤。",
    }),
    createNode({
      id: "tree",
      parentId: "root",
      title: "树与二叉树",
      status: "new",
      intro: "需要掌握遍历方式、二叉搜索树、平衡树的基本思想，以及堆结构。",
      questions: "例题：给定前序和中序遍历结果，尝试还原一棵二叉树。",
    }),
    createNode({
      id: "graph",
      parentId: "root",
      title: "图",
      status: "new",
      intro: "图适合描述复杂关系。重点包括邻接矩阵、邻接表、DFS、BFS、最短路径和最小生成树。",
      questions: "自测：比较邻接矩阵和邻接表在稀疏图中的空间消耗。",
    }),
    createNode({
      id: "sort",
      parentId: "root",
      title: "排序算法",
      status: "learning",
      intro: "比较冒泡、选择、插入、归并、快速排序的时间复杂度、稳定性和适用场景。",
      questions: "例题：解释快速排序在最坏情况下为什么会退化到 O(n²)。",
    }),
    createNode({
      id: "linked",
      parentId: "array",
      title: "链表",
      status: "mastered",
      intro: "链表通过指针连接节点，插入删除灵活，但随机访问效率低。",
      questions: "自测：如何用双指针找到链表的中间节点？",
    }),
    createNode({
      id: "binary-tree",
      parentId: "tree",
      title: "二叉树遍历",
      status: "new",
      intro: "前序、中序、后序和层序遍历是二叉树题目的基础。",
      questions: "例题：分别写出递归版和迭代版中序遍历思路。",
    }),
  ];
}

function normalizeNode(node) {
  return {
    id: node.id || `node-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    parentId: node.parentId ?? null,
    title: node.title || "未命名知识点",
    status: node.status || "new",
    intro: node.intro ?? node.content ?? "",
    questions: node.questions || "",
    x: Number.isFinite(node.x) ? node.x : null,
    y: Number.isFinite(node.y) ? node.y : null,
  };
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

function getActiveMap() {
  return maps.find((map) => map.id === activeMapId);
}

function getRootNode(mapNodes = nodes) {
  return mapNodes.find((node) => node.parentId === null);
}

function saveActiveMapState() {
  const activeMap = getActiveMap();
  if (!activeMap) return;

  const root = getRootNode();
  activeMap.course = courseNameEl.value.trim() || root?.title || activeMap.course;
  activeMap.name = activeMap.course;
  activeMap.nodes = nodes.map((node) => ({ ...node }));
  activeMap.historyRecords = historyRecords.map((record) => ({ ...record }));
  activeMap.selectedNodeId = selectedNodeId;
  activeMap.transform = { ...mapTransform };
}

function loadMapState(mapId) {
  const map = maps.find((item) => item.id === mapId);
  if (!map) return;

  activeMapId = map.id;
  nodes = map.nodes.map(normalizeNode);
  historyRecords = map.historyRecords.map((record) => ({ ...record }));
  selectedNodeId = nodes.some((node) => node.id === map.selectedNodeId) ? map.selectedNodeId : getRootNode()?.id || "root";
  mapTransform = { ...map.transform };
  courseNameEl.value = map.course;
  mapTitleEl.textContent = `${map.course}知识地图`;
  zoomRangeEl.value = String(Math.round(mapTransform.scale * 100));
  clearDraft();
  renderMapSelector();
  selectNode(selectedNodeId);
  renderReviewItems();
  renderHistory();
}

function renderMapSelector() {
  mapSelectorEl.innerHTML = "";
  maps.forEach((map) => {
    const option = document.createElement("option");
    option.value = map.id;
    option.textContent = map.name || map.course || "未命名导图";
    option.selected = map.id === activeMapId;
    mapSelectorEl.appendChild(option);
  });
}

function getNodeText(node) {
  return [node.intro, node.questions].filter(Boolean).join("\n");
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
  saveActiveMapState();
}

function buildChangeSummary(before, after) {
  const changes = [];

  if (before.title !== after.title) {
    changes.push(`名称：${before.title || "空"} -> ${after.title}`);
  }

  if (before.status !== after.status) {
    changes.push(`状态：${getStatusText(before.status)} -> ${getStatusText(after.status)}`);
  }

  if (before.intro !== after.intro) {
    const preview = after.intro ? after.intro.slice(0, 36) : "清空了知识点介绍";
    changes.push(`介绍：${preview}${after.intro.length > 36 ? "..." : ""}`);
  }

  if (before.questions !== after.questions) {
    const preview = after.questions ? after.questions.slice(0, 36) : "清空了题目";
    changes.push(`题目：${preview}${after.questions.length > 36 ? "..." : ""}`);
  }

  return changes.join("；");
}

function getNodeDepth(nodeId) {
  let depth = 0;
  let current = nodes.find((node) => node.id === nodeId);

  while (current && current.parentId) {
    depth += 1;
    current = nodes.find((node) => node.id === current.parentId);
  }

  return depth;
}

function layoutNodes() {
  const positions = new Map();
  const root = nodes.find((node) => node.parentId === null);
  let row = 0;
  const rowHeight = 122;
  const colWidth = 265;
  const marginX = 70;
  const marginY = 70;

  function walk(node, depth) {
    const children = getChildren(node.id);

    if (children.length === 0) {
      const y = marginY + row * rowHeight;
      row += 1;
      positions.set(node.id, { x: marginX + depth * colWidth, y });
      return y;
    }

    const childYs = children.map((child) => walk(child, depth + 1));
    const y = childYs.reduce((sum, value) => sum + value, 0) / childYs.length;
    positions.set(node.id, { x: marginX + depth * colWidth, y });
    return y;
  }

  walk(root, 0);

  nodes.forEach((node) => {
    if (Number.isFinite(node.x) && Number.isFinite(node.y)) {
      positions.set(node.id, { x: node.x, y: node.y });
    }
  });

  return positions;
}

function fitMapSize(positions) {
  let maxX = 0;
  let maxY = 0;

  positions.forEach((position) => {
    maxX = Math.max(maxX, position.x + 260);
    maxY = Math.max(maxY, position.y + 150);
  });

  mapEl.style.width = `${Math.max(maxX, 1000)}px`;
  mapEl.style.height = `${Math.max(maxY, 720)}px`;
}

function applyMapTransform() {
  mapEl.style.transform = `translate(${mapTransform.x}px, ${mapTransform.y}px) scale(${mapTransform.scale})`;
  zoomValueEl.textContent = `${Math.round(mapTransform.scale * 100)}%`;
}

function drawLine(from, to) {
  const fromCenter = { x: from.x + 190, y: from.y + 36 };
  const toCenter = { x: to.x, y: to.y + 36 };
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
  currentPositions = positions;
  fitMapSize(positions);

  nodes.forEach((node) => {
    if (!node.parentId) return;
    drawLine(positions.get(node.parentId), positions.get(node.id));
  });

  nodes.forEach((node) => {
    const position = positions.get(node.id);
    const text = getNodeText(node);
    const card = document.createElement("button");
    card.type = "button";
    card.className = `node ${node.status}${node.id === selectedNodeId ? " active" : ""}${nodeDragState?.nodeId === node.id ? " dragging-node" : ""}`;
    card.style.left = `${position.x}px`;
    card.style.top = `${position.y}px`;
    card.dataset.id = node.id;
    card.innerHTML = `
      <div class="node-title">${node.title}</div>
      <div class="node-summary">${text ? text.slice(0, 34) : "暂无简介，可在右侧补充"}${text.length > 34 ? "..." : ""}</div>
    `;
    card.addEventListener("pointerdown", (event) => startNodePress(event, node.id, position));
    card.addEventListener("click", (event) => {
      event.stopPropagation();
      if (nodeDragState?.moved) return;
      selectNode(node.id);
    });
    mapEl.appendChild(card);
  });

  updateMetrics();
  updateDeleteButton();
  renderLearningChain();
  applyMapTransform();
}

function getLearningOrder() {
  const root = getRootNode();
  if (!root) return [];
  const ordered = [];

  function walk(node) {
    ordered.push(node);
    getChildren(node.id).forEach(walk);
  }

  walk(root);
  return ordered;
}

function renderLearningChain() {
  learningChainEl.innerHTML = "";
  getLearningOrder().forEach((node, index) => {
    const item = document.createElement("li");
    item.className = `${node.status}${node.id === selectedNodeId ? " active" : ""}`;
    item.innerHTML = `
      <span class="chain-title">${index + 1}. ${node.title}</span>
      <span class="chain-status">${getStatusText(node.status)}</span>
    `;
    item.addEventListener("click", () => selectNode(node.id));
    learningChainEl.appendChild(item);
  });
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

function updateDeleteButton() {
  const selected = nodes.find((node) => node.id === selectedNodeId);
  deleteNodeEl.disabled = !selected || selected.parentId === null;
}

function selectNode(id) {
  selectedNodeId = id;
  const node = nodes.find((item) => item.id === id);
  if (!node) return;
  nodeTitleEl.value = node.title;
  nodeStatusEl.value = node.status;
  nodeIntroEl.value = node.intro;
  nodeQuestionsEl.value = node.questions;
  renderMap();
  saveActiveMapState();
}

function saveSelectedNode(options = {}) {
  const node = nodes.find((item) => item.id === selectedNodeId);
  const before = { ...node };

  node.title = nodeTitleEl.value.trim() || "未命名知识点";
  node.status = nodeStatusEl.value;
  node.intro = nodeIntroEl.value.trim();
  node.questions = nodeQuestionsEl.value.trim();

  const detail = options.detail || buildChangeSummary(before, node);
  if (!options.silent && detail) {
    addHistory(node, options.action || "保存修改", detail);
  }

  renderMap();
  renderReviewItems();
  saveActiveMapState();
}

function addChildNode() {
  saveSelectedNode({ silent: true });
  const parent = nodes.find((node) => node.id === selectedNodeId);
  const id = `node-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const child = createNode({
    id,
    parentId: parent.id,
    title: "新知识点",
    status: "new",
    intro: "",
    questions: "",
    x: null,
    y: null,
  });

  nodes.push(child);
  addHistory(child, "新增知识点", `添加到「${parent.title}」下`);
  selectNode(id);
}

function getDescendantIds(nodeId) {
  const ids = [];

  function collect(id) {
    getChildren(id).forEach((child) => {
      ids.push(child.id);
      collect(child.id);
    });
  }

  collect(nodeId);
  return ids;
}

function deleteSelectedNode() {
  const selected = nodes.find((node) => node.id === selectedNodeId);
  if (!selected || selected.parentId === null) return;

  const idsToDelete = [selected.id, ...getDescendantIds(selected.id)];
  const parentId = selected.parentId;
  nodes = nodes.filter((node) => !idsToDelete.includes(node.id));
  addHistory(selected, "删除知识点", `删除「${selected.title}」及其 ${idsToDelete.length - 1} 个子知识点`);
  selectNode(parentId);
  renderReviewItems();
  saveActiveMapState();
}

function generateAiText(mode) {
  const node = nodes.find((item) => item.id === selectedNodeId);
  const parent = nodes.find((item) => item.id === node.parentId);
  const context = parent ? `它属于「${parent.title}」这一部分。` : "它是课程总览节点。";
  const currentIntro = nodeIntroEl.value.trim() || node.intro || "这里可以先写下你对这个知识点的初步理解。";

  if (mode === "questions") {
    return `自测题：
1. 请用自己的话解释「${node.title}」的核心概念。
2. ${context}它通常解决什么问题？
3. 学习「${node.title}」时最容易混淆的点是什么？

例题：
给出一个与「${node.title}」相关的课堂场景，说明你会如何判断使用条件，并写出解题步骤。

参考答题框架：
- 先写出定义或判断依据。
- 再列出关键步骤。
- 最后说明容易出错的地方。`;
  }

  return `「${node.title}」是本课程中的一个关键知识点。${context}

知识点介绍草稿：
${currentIntro}

建议补充方向：
- 概念定义：说明它是什么，以及与相近概念的区别。
- 使用场景：说明什么时候会用到它。
- 解题步骤：整理成可以复用的流程。
- 易错点：记录课堂、作业和考试中常见问题。
- 例子：补充一个能帮助理解的具体案例。`;
}

function setDraft(mode) {
  aiDraftType = mode;
  aiDraftEl.value = generateAiText(mode);
  draftTypeEl.textContent = mode === "questions" ? "题目草稿" : "介绍草稿";
  addHistory(nodes.find((node) => node.id === selectedNodeId), mode === "questions" ? "AI 生成题目草稿" : "AI 生成介绍草稿", "已放入临时草稿，等待用户确认");
}

function applyDraft(target) {
  const draft = aiDraftEl.value.trim();
  if (!draft) return;

  if (target === "intro") {
    nodeIntroEl.value = nodeIntroEl.value.trim() ? `${nodeIntroEl.value.trim()}\n\n${draft}` : draft;
  } else {
    nodeQuestionsEl.value = nodeQuestionsEl.value.trim() ? `${nodeQuestionsEl.value.trim()}\n\n${draft}` : draft;
  }

  saveSelectedNode({
    action: target === "intro" ? "采纳 AI 介绍" : "采纳 AI 题目",
    detail: `将临时草稿放入${target === "intro" ? "知识点介绍" : "题目与例题"}`,
  });
}

function clearDraft() {
  aiDraftType = "";
  aiDraftEl.value = "";
  draftTypeEl.textContent = "等待生成";
}

function updateMetrics() {
  nodeCountEl.textContent = nodes.length;
  masteredCountEl.textContent = nodes.filter((node) => node.status === "mastered").length;
  weakCountEl.textContent = nodes.filter((node) => node.status !== "mastered").length;
}

function updateSelectedStatus() {
  const node = nodes.find((item) => item.id === selectedNodeId);
  if (!node) return;

  const before = { ...node };
  node.status = nodeStatusEl.value;
  const detail = buildChangeSummary(before, node);
  if (detail) {
    addHistory(node, "更新学习状态", detail);
  }
  renderMap();
  renderReviewItems();
  saveActiveMapState();
}

function renderReviewItems() {
  const weakNodes = nodes.filter((node) => node.status !== "mastered");
  reviewListEl.innerHTML = "";
  weakNodes.forEach((node) => {
    const item = document.createElement("li");
    item.textContent = `${node.title}：补充介绍、例题和易错点`;
    reviewListEl.appendChild(item);
  });
}

function generateReviewList() {
  saveSelectedNode({ action: "生成复习清单", detail: "根据当前掌握状态刷新复习内容" });
  renderReviewItems();
}

function exportJson() {
  saveSelectedNode({ action: "导出数据", detail: "导出当前知识地图 JSON 文件" });
  saveActiveMapState();
  const data = JSON.stringify({ activeMapId, maps, course: courseNameEl.value, nodes, historyRecords }, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${courseNameEl.value || "course-map"}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function createBlankMap() {
  saveActiveMapState();
  const courseName = courseNameEl.value.trim() || "新课程";
  const newNodes = [
    createNode({
      id: "root",
      parentId: null,
      title: courseName,
      status: "new",
      intro: "",
      questions: "",
      x: 70,
      y: 120,
    }),
  ];
  const map = createMapState({
    name: courseName,
    course: courseName,
    nodes: newNodes,
    historyRecords: [],
    selectedNodeId: "root",
  });
  maps.push(map);
  loadMapState(map.id);
  addHistory(nodes[0], "新建思维导图", `创建「${courseName}」空白导图`);
}

function importMapFile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const data = JSON.parse(reader.result);
      if (Array.isArray(data.maps)) {
        saveActiveMapState();
        maps = data.maps.map((map) =>
          createMapState({
            ...map,
            nodes: Array.isArray(map.nodes) ? map.nodes.map(normalizeNode) : [],
            historyRecords: Array.isArray(map.historyRecords) ? map.historyRecords : [],
          }),
        );
        const nextMap = maps.find((map) => map.id === data.activeMapId) || maps[0];
        if (!nextMap) throw new Error("文件中没有可用的思维导图。");
        loadMapState(nextMap.id);
        addHistory(getRootNode(), "导入思维导图集", `从 ${file.name} 导入 ${maps.length} 张导图`);
        return;
      }

      const importedNodes = Array.isArray(data.nodes) ? data.nodes.map(normalizeNode) : null;
      const root = importedNodes?.find((node) => node.parentId === null);

      if (!importedNodes || !root) {
        throw new Error("文件中没有可用的 nodes 或根节点。");
      }

      const courseName = data.course || root.title || "导入课程";
      saveActiveMapState();
      const map = createMapState({
        name: courseName,
        course: courseName,
        nodes: importedNodes,
        historyRecords: Array.isArray(data.historyRecords) ? data.historyRecords : [],
        selectedNodeId: root.id,
      });
      maps.push(map);
      loadMapState(map.id);
      addHistory(root, "导入思维导图", `从 ${file.name} 导入 ${nodes.length} 个知识点`);
    } catch (error) {
      alert(`导入失败：${error.message}`);
    } finally {
      importFileEl.value = "";
    }
  });
  reader.readAsText(file, "utf-8");
}

function rebuildCourse() {
  saveActiveMapState();
  const courseName = courseNameEl.value.trim() || "我的课程";
  const activeMap = getActiveMap();
  if (!activeMap) return;
  activeMap.course = courseName;
  activeMap.name = courseName;
  activeMap.nodes = createDemoMap(courseName).map(normalizeNode);
  activeMap.historyRecords = [];
  activeMap.selectedNodeId = "root";
  activeMap.transform = { x: 40, y: 40, scale: 1 };
  loadMapState(activeMap.id);
}

function resetMapView() {
  mapTransform = { x: 40, y: 40, scale: 1 };
  zoomRangeEl.value = "100";
  applyMapTransform();
  saveActiveMapState();
}

function startDrag(event) {
  if (event.target.closest(".node")) return;

  dragState = {
    startX: event.clientX,
    startY: event.clientY,
    originX: mapTransform.x,
    originY: mapTransform.y,
  };
  mapViewportEl.classList.add("dragging");
}

function moveDrag(event) {
  if (!dragState) return;

  mapTransform.x = dragState.originX + event.clientX - dragState.startX;
  mapTransform.y = dragState.originY + event.clientY - dragState.startY;
  applyMapTransform();
  saveActiveMapState();
}

function stopDrag() {
  dragState = null;
  mapViewportEl.classList.remove("dragging");
}

function updateZoom() {
  mapTransform.scale = Number(zoomRangeEl.value) / 100;
  applyMapTransform();
  saveActiveMapState();
}

function zoomAtPoint(nextScale, clientX, clientY) {
  const scale = Math.min(1.5, Math.max(0.5, nextScale));
  const rect = mapViewportEl.getBoundingClientRect();
  const pointX = (clientX - rect.left - mapTransform.x) / mapTransform.scale;
  const pointY = (clientY - rect.top - mapTransform.y) / mapTransform.scale;

  mapTransform.x = clientX - rect.left - pointX * scale;
  mapTransform.y = clientY - rect.top - pointY * scale;
  mapTransform.scale = scale;
  zoomRangeEl.value = String(Math.round(scale * 100));
  applyMapTransform();
  saveActiveMapState();
}

function handleWheelZoom(event) {
  event.preventDefault();
  const delta = event.deltaY > 0 ? -0.08 : 0.08;
  zoomAtPoint(mapTransform.scale + delta, event.clientX, event.clientY);
}

function startNodePress(event, nodeId, position) {
  event.stopPropagation();
  nodePressState = {
    nodeId,
    startX: event.clientX,
    startY: event.clientY,
    originX: position.x,
    originY: position.y,
    timer: null,
  };

  nodePressState.timer = window.setTimeout(() => {
    const node = nodes.find((item) => item.id === nodeId);
    if (!nodePressState || !node) return;

    nodeDragState = {
      nodeId,
      startX: nodePressState.startX,
      startY: nodePressState.startY,
      originX: node.x ?? nodePressState.originX,
      originY: node.y ?? nodePressState.originY,
      moved: false,
    };
    nodePressState = null;
    mapViewportEl.classList.add("dragging");
    selectNode(nodeId);
  }, 360);
}

function cancelNodePress() {
  if (!nodePressState) return;
  window.clearTimeout(nodePressState.timer);
  nodePressState = null;
}

function moveNodeDrag(event) {
  if (nodePressState) {
    const moved = Math.hypot(event.clientX - nodePressState.startX, event.clientY - nodePressState.startY);
    if (moved > 8) cancelNodePress();
  }

  if (!nodeDragState) return false;

  const node = nodes.find((item) => item.id === nodeDragState.nodeId);
  if (!node) return false;

  node.x = nodeDragState.originX + (event.clientX - nodeDragState.startX) / mapTransform.scale;
  node.y = nodeDragState.originY + (event.clientY - nodeDragState.startY) / mapTransform.scale;
  nodeDragState.moved = true;
  renderMap();
  saveActiveMapState();
  return true;
}

function stopNodeDrag() {
  cancelNodePress();
  if (!nodeDragState) return false;

  const node = nodes.find((item) => item.id === nodeDragState.nodeId);
  if (nodeDragState.moved && node) {
    addHistory(node, "调整知识点位置", `移动「${node.title}」到画布新位置`);
  }

  nodeDragState = null;
  mapViewportEl.classList.remove("dragging");
  renderMap();
  return true;
}

function resetSelectedNodePosition() {
  const node = nodes.find((item) => item.id === selectedNodeId);
  if (!node) return;
  node.x = null;
  node.y = null;
  addHistory(node, "重置知识点位置", `恢复「${node.title}」到自动布局`);
  renderMap();
  saveActiveMapState();
}

function initializeMaps() {
  const courseName = courseNameEl.value.trim() || "数据结构";
  maps = [
    createMapState({
      id: "map-demo",
      name: courseName,
      course: courseName,
      nodes: createDemoMap(courseName).map(normalizeNode),
      historyRecords: [],
      selectedNodeId: "root",
    }),
    createMapState({
      id: "map-blank",
      name: "我的空白导图",
      course: "我的空白导图",
      nodes: [
        createNode({
          id: "root",
          parentId: null,
          title: "我的空白导图",
          status: "new",
          intro: "",
          questions: "",
          x: 70,
          y: 120,
        }),
      ],
      historyRecords: [],
      selectedNodeId: "root",
    }),
  ];
  loadMapState(maps[0].id);
}

mapSelectorEl.addEventListener("change", () => {
  saveActiveMapState();
  loadMapState(mapSelectorEl.value);
});
document.querySelector("#newMap").addEventListener("click", createBlankMap);
document.querySelector("#buildDemoMap").addEventListener("click", rebuildCourse);
document.querySelector("#addChild").addEventListener("click", addChildNode);
document.querySelector("#deleteNode").addEventListener("click", deleteSelectedNode);
document.querySelector("#importMap").addEventListener("click", () => importFileEl.click());
importFileEl.addEventListener("change", () => importMapFile(importFileEl.files[0]));
document.querySelector("#generateReview").addEventListener("click", generateReviewList);
document.querySelector("#exportJson").addEventListener("click", exportJson);
document.querySelector("#aiExplain").addEventListener("click", () => setDraft("intro"));
document.querySelector("#aiQuestions").addEventListener("click", () => setDraft("questions"));
document.querySelector("#applyDraftIntro").addEventListener("click", () => applyDraft("intro"));
document.querySelector("#applyDraftQuestions").addEventListener("click", () => applyDraft("questions"));
document.querySelector("#clearDraft").addEventListener("click", clearDraft);
document.querySelector("#saveNode").addEventListener("click", () => saveSelectedNode());
nodeStatusEl.addEventListener("change", updateSelectedStatus);
zoomRangeEl.addEventListener("input", updateZoom);
mapViewportEl.addEventListener("wheel", handleWheelZoom, { passive: false });
mapViewportEl.addEventListener("pointerdown", startDrag);
window.addEventListener("pointermove", (event) => {
  if (!moveNodeDrag(event)) moveDrag(event);
});
window.addEventListener("pointerup", () => {
  if (!stopNodeDrag()) stopDrag();
});
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r") resetSelectedNodePosition();
});

initializeMaps();
