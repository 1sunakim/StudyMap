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

let selectedNodeId = "root";
let nodes = [];

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

function getChildren(parentId) {
  return nodes.filter((node) => node.parentId === parentId);
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
        x: x + 210,
        y: y + childIndex * 82 - 42,
      });
    });
  });

  return positions;
}

function drawLine(from, to) {
  const fromCenter = { x: from.x + 87, y: from.y + 27 };
  const toCenter = { x: to.x + 87, y: to.y + 27 };
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
      <div class="node-summary">${node.content.slice(0, 34)}${node.content.length > 34 ? "..." : ""}</div>
    `;
    card.addEventListener("click", () => selectNode(node.id));
    mapEl.appendChild(card);
  });

  updateMetrics();
}

function selectNode(id) {
  selectedNodeId = id;
  const node = nodes.find((item) => item.id === id);
  nodeTitleEl.value = node.title;
  nodeStatusEl.value = node.status;
  nodeContentEl.value = node.content;
  renderMap();
}

function saveSelectedNode() {
  const node = nodes.find((item) => item.id === selectedNodeId);
  node.title = nodeTitleEl.value.trim() || "未命名知识点";
  node.status = nodeStatusEl.value;
  node.content = nodeContentEl.value.trim();
  renderMap();
  updateMetrics();
}

function addChildNode() {
  saveSelectedNode();
  const parent = nodes.find((node) => node.id === selectedNodeId);
  const id = `node-${Date.now()}`;
  nodes.push({
    id,
    parentId: parent.id,
    title: "新知识点",
    status: "new",
    content: `这是「${parent.title}」下的新知识点。可以在这里补充定义、例子、公式、易错点和复习题。`,
  });
  selectNode(id);
}

function generateAiText(mode) {
  const node = nodes.find((item) => item.id === selectedNodeId);
  const parent = nodes.find((item) => item.id === node.parentId);
  const context = parent ? `它属于「${parent.title}」这一部分。` : "它是课程总览节点。";

  if (mode === "questions") {
    return `${node.content}

自测题：
1. 请用自己的话解释「${node.title}」的核心概念。
2. ${context}它通常解决什么问题？
3. 学习「${node.title}」时最容易混淆的点是什么？
4. 请举一个课堂、作业或项目中的应用例子。`;
  }

  return `${node.content}

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
  nodeContentEl.value = generateAiText(mode);
  saveSelectedNode();
}

function updateMetrics() {
  nodeCountEl.textContent = nodes.length;
  masteredCountEl.textContent = nodes.filter((node) => node.status === "mastered").length;
  weakCountEl.textContent = nodes.filter((node) => node.status !== "mastered").length;
}

function generateReviewList() {
  saveSelectedNode();
  const weakNodes = nodes.filter((node) => node.status !== "mastered");
  reviewListEl.innerHTML = "";
  weakNodes.forEach((node) => {
    const item = document.createElement("li");
    item.textContent = `${node.title}：补充定义、例题和易错点`;
    reviewListEl.appendChild(item);
  });
}

function exportJson() {
  saveSelectedNode();
  const data = JSON.stringify({ course: courseNameEl.value, nodes }, null, 2);
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
  selectedNodeId = "root";
  selectNode(selectedNodeId);
  generateReviewList();
}

document.querySelector("#buildDemoMap").addEventListener("click", rebuildCourse);
document.querySelector("#addChild").addEventListener("click", addChildNode);
document.querySelector("#generateReview").addEventListener("click", generateReviewList);
document.querySelector("#exportJson").addEventListener("click", exportJson);
document.querySelector("#aiExplain").addEventListener("click", () => appendAiText("explain"));
document.querySelector("#aiQuestions").addEventListener("click", () => appendAiText("questions"));
document.querySelector("#saveNode").addEventListener("click", saveSelectedNode);

rebuildCourse();
