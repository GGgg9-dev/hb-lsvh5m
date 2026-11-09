/* =========================================================
   软件测试面试题 · 答案手册
   两种模式：背题手册（阅读）/ 默写自测（答题 + 导出）
   答案两档：简洁 / 详细（每题可单独切换）
   ========================================================= */
(function () {
  "use strict";

  var BANK = window.QUESTION_BANK || [];
  var DETAIL = window.DETAIL || {};
  var ASK = window.ASK || {};
  var WKEY = "stqb_write_v1";
  var DWKEY = "stqb_docwrite_v1";
  var VKEY = "stqb_view_v1";

  /* ---------------- 索引 ---------------- */
  BANK.forEach(function (cat, ci) {
    cat.index = ci;
    cat.items.forEach(function (it, i) {
      it.catId = cat.id;
      it.catTitle = cat.title;
      it.seq = i + 1;
      it.key = cat.id + "-" + (i + 1);
    });
    cat.asks = ASK[cat.id] || [];
    cat.asks.forEach(function (q, i) {
      q.key = cat.id + "-ask-" + i;
    });
  });
  var ALL_Q = [];
  BANK.forEach(function (c) { c.items.forEach(function (i) { ALL_Q.push(i); }); });
  var ALL_ASK = [];
  BANK.forEach(function (c) { c.asks.forEach(function (q) { ALL_ASK.push(q); }); });
  var TOTAL_WRITE = ALL_Q.length + ALL_ASK.length;

  /* ---------------- 状态 ---------------- */
  /* 项目口述稿的答题记录单独存 DWKEY，键形如 wh@v1/u3。
     内存里合并成一个对象，写盘时再按「键里有没有 @」拆回去，
     这样主手册的「一键清空」不会误伤文档库的记录。 */
  var wstate = (function () {
    var o = {};
    [WKEY, DWKEY].forEach(function (k) {
      try {
        var d = JSON.parse(localStorage.getItem(k)) || {};
        Object.keys(d).forEach(function (kk) { o[kk] = d[kk]; });
      } catch (e) {}
    });
    return o;
  })();
  var vstate = (function () {
    try { return JSON.parse(localStorage.getItem(VKEY)) || {}; } catch (e) { return {}; }
  })();
  vstate.mode = vstate.mode === "write" ? "write" : "book";
  vstate.ans = vstate.ans === "detail" ? "detail" : "brief";
  function saveW() {
    var main = {}, doc = {};
    Object.keys(wstate).forEach(function (k) {
      if (k.indexOf("@") > -1) doc[k] = wstate[k];
      else main[k] = wstate[k];
    });
    try { localStorage.setItem(WKEY, JSON.stringify(main)); } catch (e) {}
    try { localStorage.setItem(DWKEY, JSON.stringify(doc)); } catch (e) {}
  }
  function saveV() { try { localStorage.setItem(VKEY, JSON.stringify(vstate)); } catch (e) {} }

  /* ---------------- 工具 ---------------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function inlineFmt(t) {
    return esc(t)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }
  /* 轻量 Markdown：``` 代码块 / GFM 表格 / 有序无序列表 / 引用 / 段落 / 行内 `code` **粗体** */
  function fmt(text) {
    var lines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
    var out = [];
    var i = 0, n = lines.length;

    function blank(l) { return !l.trim(); }
    function fence(l) { return /^\s*```/.test(l); }
    function quote(l) { return /^\s*>\s?/.test(l); }
    function li(l) {
      var m = /^(\s*)(?:([-*+\u00b7])|(\d+\.))\s+(.*)$/.exec(l);
      if (!m) return null;
      return { indent: m[1].replace(/\t/g, "  ").length, ord: !!m[3], text: m[4] };
    }
    function tableStart(k) {
      return lines[k] && lines[k].indexOf("|") > -1 && lines[k + 1] &&
        /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(lines[k + 1]) && lines[k + 1].indexOf("-") > -1;
    }
    function cells(l) {
      var s = l.trim();
      if (s.charAt(0) === "|") s = s.slice(1);
      if (s.charAt(s.length - 1) === "|") s = s.slice(0, -1);
      return s.split("|").map(function (c) { return c.trim(); });
    }

    while (i < n) {
      var line = lines[i];
      if (blank(line)) { i++; continue; }

      if (fence(line)) {
        var buf = [], j = i + 1;
        while (j < n && !fence(lines[j])) { buf.push(lines[j]); j++; }
        out.push("<pre><code>" + esc(buf.join("\n")) + "</code></pre>");
        i = j + 1;
        continue;
      }

      if (tableStart(i)) {
        var head = cells(lines[i]);
        i += 2;
        var rows = [];
        while (i < n && !blank(lines[i]) && lines[i].indexOf("|") > -1) { rows.push(cells(lines[i])); i++; }
        out.push(
          '<div class="md-table-wrap"><table class="md-table"><thead><tr>' +
          head.map(function (h) { return "<th>" + inlineFmt(h) + "</th>"; }).join("") +
          "</tr></thead><tbody>" +
          rows.map(function (r) {
            return "<tr>" + r.map(function (c) { return "<td>" + inlineFmt(c) + "</td>"; }).join("") + "</tr>";
          }).join("") +
          "</tbody></table></div>"
        );
        continue;
      }

      var lm = li(line);
      if (lm) {
        var ord = lm.ord, base = lm.indent, items = [];
        while (i < n) {
          var m2 = li(lines[i]);
          if (!m2) break;
          if (m2.indent > base) {
            var nested = [];
            while (i < n) {
              var m3 = li(lines[i]);
              if (!m3 || m3.indent <= base) break;
              nested.push("<li>" + inlineFmt(m3.text) + "</li>");
              i++;
            }
            if (nested.length && items.length) {
              items[items.length - 1] += '<ul class="md-list md-sub">' + nested.join("") + "</ul>";
            } else if (nested.length) {
              items.push('<ul class="md-list md-sub">' + nested.join("") + "</ul>");
            }
            continue;
          }
          if (m2.ord !== ord) break;
          items.push(inlineFmt(m2.text));
          i++;
        }
        var tag = ord ? "ol" : "ul";
        out.push(
          "<" + tag + ' class="md-list">' +
          items.map(function (t) { return "<li>" + t + "</li>"; }).join("") +
          "</" + tag + ">"
        );
        continue;
      }

      if (quote(line)) {
        var qs = [];
        while (i < n && quote(lines[i])) {
          qs.push(inlineFmt(lines[i].replace(/^\s*>\s?/, "")));
          i++;
        }
        out.push('<blockquote class="md-quote">' + qs.join("<br>") + "</blockquote>");
        continue;
      }

      var par = [];
      while (i < n && !blank(lines[i]) && !fence(lines[i]) && !quote(lines[i]) &&
             !li(lines[i]) && !tableStart(i)) {
        par.push(inlineFmt(lines[i]));
        i++;
      }
      if (par.length) out.push("<p>" + par.join("<br>") + "</p>");
      else i++;
    }
    return out.join("");
  }
  function kwReg(kw, flags) {
    var safe = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    var ascii = /^[\x00-\x7F]+$/.test(kw);
    var body = ascii ? "(?<![A-Za-z0-9_])" + safe + "(?![A-Za-z0-9_])" : safe;
    return new RegExp(body, flags || "gi");
  }
  function matches(t, kw) { return kwReg(kw, "i").test(String(t || "")); }
  function highlight(html, kw) {
    if (!kw) return html;
    return html.replace(kwReg(kw, "gi"), function (m) { return "<mark>" + m + "</mark>"; });
  }
  function highlightHTML(html, kw) {
    if (!kw) return html;
    return html.split(/(<[^>]+>)/).map(function (part) {
      if (part.charAt(0) === "<") return part;
      return part.replace(kwReg(kw, "gi"), function (m) { return "<mark>" + m + "</mark>"; });
    }).join("");
  }
  function toast(msg) {
    var el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove("show"); }, 1800);
  }
  function getDetail(key) {
    var d = DETAIL[key];
    return d ? fmt(d) : '<p class="no-detail">本题暂无详细版</p>';
  }

  /* ---------------- 目录 ---------------- */
  function renderSidebar() {
    var nav = document.getElementById("catList");
    nav.innerHTML = BANK.map(function (cat, i) {
      var dot = catDone(cat) ? '<span class="done"></span>' : "";
      return (
        '<a class="cat-item" href="#" data-cat="' + cat.id + '">' +
        '<span class="num">' + toCn(i + 1) + "</span>" +
        '<span class="name">' + esc(cat.title) + "</span>" + dot +
        '<span class="cnt">' + cat.items.length + "</span>" +
        "</a>"
      );
    }).join("");
  }
  function toCn(n) {
    var d = ["一","二","三","四","五","六","七","八","九","十"];
    if (n <= 10) return d[n - 1];
    if (n < 20) return "十" + d[n - 11];
    return "二十";
  }
  function catSubmitted(cat) {
    var n = 0;
    cat.items.forEach(function (it) { if (wstate[it.key] && wstate[it.key].done) n++; });
    cat.asks.forEach(function (q) { if (wstate[q.key] && wstate[q.key].done) n++; });
    return n;
  }
  function catDone(cat) {
    var total = cat.items.length + cat.asks.length;
    return total > 0 && catSubmitted(cat) === total;
  }
  function catAvg(cat) {
    var s = 0, n = 0;
    cat.items.concat(cat.asks).forEach(function (q) {
      var st = wstate[q.key];
      if (st && st.g && typeof st.g.s === "number") { s += st.g.s; n++; }
    });
    return n ? Math.round(s / n) : 0;
  }

  /* ---------------- 卡片公共件 ---------------- */
  function ansSwitch() {
    return (
      '<div class="ans-switch">' +
      '<button class="sw-btn" data-view="brief">简洁</button>' +
      '<button class="sw-btn" data-view="detail">详细</button>' +
      "</div>"
    );
  }
  /* rawDetail：追问（window.ASK）自带的详细答案，直接内联；原题走 data-dkey 惰性注入 */
  function ansArea(briefHTML, detailKey, kw, rawDetail) {
    var brief = highlightHTML(briefHTML, kw);
    var hasRaw = !!(rawDetail && String(rawDetail).trim());
    return (
      '<div class="ans-area" data-view="' + vstate.ans + '">' +
      '<div class="ans-label b-label">一句话回答</div>' +
      '<div class="q-answer">' + brief + "</div>" +
      '<div class="ans-label d-label">详细展开</div>' +
      '<div class="q-detail" data-dkey="' + detailKey + '"' +
      (hasRaw ? ' data-ready="1"' : "") + ">" +
      (hasRaw ? highlightHTML(fmt(rawDetail), kw) : "") +
      "</div>" +
      "</div>"
    );
  }
  /* 详细内容惰性注入，避免首屏渲染几十万字 */
  function fillDetail(area) {
    var box = area.querySelector(".q-detail");
    if (!box || box._filled || box.getAttribute("data-ready")) return;
    box._filled = true;
    box.innerHTML = getDetail(box.getAttribute("data-dkey"));
  }
  function setAnsView(scope, view) {
    vstate.ans = view;
    saveV();
    syncAnsSeg();
    scope.querySelectorAll(".ans-area").forEach(function (a) {
      a.setAttribute("data-view", view);
      if (view === "detail") fillDetail(a);
    });
    scope.querySelectorAll(".ans-switch").forEach(function (s) {
      s.querySelectorAll(".sw-btn").forEach(function (b) {
        b.classList.toggle("on", b.getAttribute("data-view") === view);
      });
    });
  }
  function syncAnsSeg() {
    document.querySelectorAll("#ansSeg .seg-btn").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-ans") === vstate.ans);
    });
  }

  /* ---------------- 背题模式 ---------------- */
  function qCard(item, kw) {
    return (
      '<article class="q-card" data-key="' + item.key + '">' +
      '<div class="q-head">' +
      '<span class="q-no">' + item.seq + "</span>" +
      '<div class="q-text">' + highlight(esc(item.q), kw) +
      (item.star ? '<span class="star">高频</span>' : "") + "</div>" +
      ansSwitch() +
      "</div>" +
      ansArea(fmt(item.a), item.key, kw) +
      '<span class="answer-tip">点击查看本题答案</span>' +
      "</article>"
    );
  }
  function askCard(q, kw) {
    return (
      '<article class="q-card ask-card" data-key="' + q.key + '">' +
      '<div class="q-head">' +
      '<span class="q-no ask-no">追</span>' +
      '<div class="q-text">' + highlight(esc(q.q), kw) + "</div>" +
      ansSwitch() +
      "</div>" +
      ansArea(fmt(q.a), q.key, kw, q.d) +
      "</article>"
    );
  }
  function askBlockBook(cat) {
    if (!cat.asks.length) return "";
    return (
      '<section class="ask-block">' +
      '<div class="blk-head"><span class="qh-badge">追问</span><h3>面试官追问 · 进阶</h3>' +
      '<span class="qh-sub">开放式深挖题，先自己想再看答案</span></div>' +
      cat.asks.map(function (q) { return askCard(q, ""); }).join("") +
      "</section>"
    );
  }
  function renderBook() {
    var wrap = document.getElementById("bookSections");
    wrap.innerHTML = BANK.map(function (cat, i) {
      return (
        '<section class="cat-section" id="sec-' + cat.id + '" data-cat="' + cat.id + '">' +
        '<div class="cat-head">' +
        '<div class="cat-title">' +
        '<span class="idx">' + String(i + 1).padStart(2, "0") + "</span>" +
        "<h2>" + esc(cat.title) + "</h2>" +
        (cat.desc ? '<span class="desc">' + esc(cat.desc) + "</span>" : "") +
        "</div>" +
        '<div class="cat-meta"><b>' + cat.items.length + "</b> 道题" +
        (cat.asks.length ? " · <b>" + cat.asks.length + "</b> 道追问" : "") +
        "</div></div>" +
        cat.items.map(function (it) { return qCard(it, ""); }).join("") +
        askBlockBook(cat) +
        "</section>"
      );
    }).join("");
    setAnsView(document.body, vstate.ans);
  }

  /* ---------------- 默写模式 ---------------- */
  function wItemHTML(q, idx, kind) {
    var st = wstate[q.key] || {};
    var done = !!st.done;
    /* 老数据（判题功能上线前提交的）在这里补算一次 */
    if (done && !st.g && st.t && q.a) st.g = gradeAnswer(st.t, q);
    var ph = kind === "ask"
      ? "按「输入—活动—输出」组织你的回答……"
      : "先默写 / 写逐字稿，再点「答题结束 · 判分」。框架：输入（场景）→ 活动（动作）→ 输出（结果）";
    return (
      '<div class="w-item' + (done ? " done" : "") + '" data-key="' + q.key + '">' +
      '<div class="w-top">' +
      '<span class="q-no">' + (kind === "ask" ? "追" : idx + 1) + "</span>" +
      '<div class="q-text">' + esc(q.q) + (q.star ? '<span class="star">高频</span>' : "") + "</div>" +
      "</div>" +
      '<textarea class="w-area" data-wkey="' + q.key + '" rows="3" placeholder="' + ph + '"' +
      (done ? " readonly" : "") + ">" + esc(st.t || "") + "</textarea>" +
      '<div class="w-bar">' +
      '<span class="w-count">' + (st.t || "").length + " 字</span>" +
      '<div class="w-btns">' +
      (done ? "" :
        '<button class="w-mic" title="语音输入：点一下开始说，再点一下停止">' +
        '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>' +
        '<span>语音</span></button>') +
      '<button class="w-clear">清空本题</button>' +
      '<button class="w-done">' + (done ? "重新作答" : "答题结束 · 判分") + "</button>" +
      "</div></div>" +
      '<div class="w-live" hidden><i class="pulse"></i><span class="live-txt"></span></div>' +
      (done ? gradeCardHTML(st) : "") +
      (done && q.bad
        ? '<div class="w-bad"><b>常见差答</b><span>说了这句，对方一定继续追打</span><em>' + esc(q.bad) + "</em></div>"
        : "") +
      '<div class="w-ref"' + (done ? "" : " hidden") + ">" +
      '<div class="w-ref-head"><span class="ref-tag">参考答案</span>' + ansSwitch() + "</div>" +
      '<div class="w-ref-body">' +
      ansArea(fmt(q.a), q.key, "", q.d) +
      "</div></div>" +
      "</div>"
    );
  }
  /* 提交后把答案框撑开，方便对照判题结果回看自己写了什么 */
  function autoGrowDone() {
    var list = document.querySelectorAll(".w-item.done .w-area");
    Array.prototype.forEach.call(list, function (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight + 2, 520) + "px";
    });
  }

  function renderWrite() {
    var wrap = document.getElementById("writeSections");
    if (wrap._built) return;
    wrap._built = true;
    wrap.innerHTML = BANK.map(function (cat, i) {
      return (
        '<section class="cat-section wcat" id="wsec-' + cat.id + '" data-cat="' + cat.id + '">' +
        '<div class="cat-head">' +
        '<div class="cat-title">' +
        '<span class="idx">' + String(i + 1).padStart(2, "0") + "</span>" +
        "<h2>" + esc(cat.title) + "</h2>" +
        '<span class="desc">默写自测</span>' +
        "</div>" +
        '<div class="cat-meta wmeta"><span class="score-chip" data-wscore="' + cat.id + '"></span>' +
        '<button class="mini-btn" data-exportcat="' + cat.id + '">导出本类</button>' +
        '<button class="mini-btn" data-wclear-cat="' + cat.id + '">清空本类</button>' +
        "</div></div>" +
        '<div class="write-hint">口述框架：<b>输入</b>（什么场景/任务）→ <b>活动</b>（你做了什么，具体到工具和数字）→ <b>输出</b>（结果/数据/反思）。<br>不想打字就点右侧「<b>语音</b>」直接说，说完自动转成文字；答完点「<b>答题结束 · 判分</b>」，先出分数和缺口，再对照参考答案。</div>' +
        (cat.asks.length
          ? '<div class="blk-head"><span class="qh-badge">追问</span><h3>面试官追问 · 进阶</h3><span class="qh-sub">共 ' + cat.asks.length + " 题</span></div>" +
            cat.asks.map(function (q, j) { return wItemHTML(q, j, "ask"); }).join("")
          : "") +
        '<div class="blk-head"><span class="qh-badge">原题</span><h3>本类原题默写</h3><span class="qh-sub">共 ' + cat.items.length + " 题</span></div>" +
        cat.items.map(function (it, j) { return wItemHTML(it, j, "orig"); }).join("") +
        "</section>"
      );
    }).join("");
    refreshWriteStats();
    setAnsView(document.body, vstate.ans);
    requestAnimationFrame(autoGrowDone);
  }

  function refreshWriteStats() {
    var done = 0;
    ALL_Q.forEach(function (it) { if (wstate[it.key] && wstate[it.key].done) done++; });
    ALL_ASK.forEach(function (q) { if (wstate[q.key] && wstate[q.key].done) done++; });
    document.getElementById("pcNum").textContent = done + " / " + TOTAL_WRITE;
    document.getElementById("pcDone").textContent = done;
    document.getElementById("pcBar").style.width = (TOTAL_WRITE ? (done / TOTAL_WRITE) * 100 : 0) + "%";
    var gsum = 0, gnum = 0;
    ALL_Q.concat(ALL_ASK).forEach(function (q) {
      var st = wstate[q.key];
      if (st && st.g && typeof st.g.s === "number") { gsum += st.g.s; gnum++; }
    });
    var avgEl = document.getElementById("pcAvg");
    if (avgEl) avgEl.textContent = gnum ? String(Math.round(gsum / gnum)) : "—";
    BANK.forEach(function (cat) {
      var chip = document.querySelector('[data-wscore="' + cat.id + '"]');
      var total = cat.items.length + cat.asks.length;
      var avg = catAvg(cat);
      if (chip) {
        chip.innerHTML = "已默写 <b>" + catSubmitted(cat) + "</b>/" + total +
          (avg ? " · 均分 <b>" + avg + "</b>" : "");
      }
    });
    BANK.forEach(function (cat) {
      var link = document.querySelector('.cat-item[data-cat="' + cat.id + '"]');
      if (!link) return;
      var dot = link.querySelector(".done");
      if (catDone(cat)) {
        if (!dot) {
          var s = document.createElement("span");
          s.className = "done";
          link.insertBefore(s, link.querySelector(".cnt"));
        }
      } else if (dot) dot.remove();
    });
  }

  /* ---------------- 判题：本地要点覆盖分析 ---------------- */
  /* 纯本地规则，不联网、不上传：把参考答案拆成「要点」，看你的回答命中多少，
     再叠加篇幅、结构两项，合成 0-100 分。语义准不准仍需自己核 / 导出后让 AI 批。 */

  var SYN = [
    [/\bbug(s)?\b/gi, "缺陷"], [/问题单|\bdefects?\b/gi, "缺陷"],
    [/\bapi(s)?\b/gi, "接口"], [/\bcases?\b/gi, "用例"], [/测试用例/g, "用例"],
    [/\breview\b/gi, "评审"], [/压测|压力测试|性能测试/g, "性能"],
    [/\bjenkins\b|\bci\b|流水线|持续集成/gi, "ci"],
    [/\bjmeter\b|\bloadrunner\b/gi, "性能"],
    [/\bpostman\b|\bswagger\b/gi, "接口"],
    [/\bmysql\b|\bredis\b|\bsql\b|数据库/gi, "数据库"],
    [/边界值|边界条件/g, "边界"], [/等价类/g, "等价"]
  ];
  var PUNCT = /[\s\u3000，。、；：！？,.;:!?（）()【】\[\]「」『』“”"'’‘`·|>#*_—…～~\/\\-]+/g;

  function normTxt(s) {
    var t = String(s == null ? "" : s).toLowerCase();
    for (var i = 0; i < SYN.length; i++) t = t.replace(SYN[i][0], SYN[i][1]);
    return t.replace(PUNCT, "");
  }
  function plainLen(s) { return String(s == null ? "" : s).replace(/[\s*`>#|]/g, "").length; }

  var POINT_STOP = /^(等等|例如|比如|包括|主要|一般|可以|需要|进行|以及|其他|相关|情况|问题|内容|方式|时候|一个|这个|什么|怎么|如何|注意|要点|说明|特点|如下|以上|同时|另外|此外)$/;

  function cleanPoint(s) {
    return String(s == null ? "" : s)
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/[*`>#]/g, "")
      .replace(/^[\s·•\-—]+/, "")
      .replace(/（[^）)]{0,40}）/g, "")
      .replace(/\s+/g, " ")
      .replace(/^[，。；、：:,.;!?！？]+|[，。；、：:,.;!?！？]+$/g, "")
      .trim();
  }
  function extractPoints(ref) {
    var lines = String(ref || "").replace(/\r\n?/g, "\n").split("\n");
    var out = [], seen = {};

    function add(text, w) {
      var t = cleanPoint(text);
      if (!t || POINT_STOP.test(t)) return;
      var key = normTxt(t);
      if (!key || key.length < 2) return;
      if (seen[key]) { if (w > seen[key].w) seen[key].w = w; return; }
      var p = { text: t.length > 24 ? t.slice(0, 24) + "…" : t, w: w, key: key };
      seen[key] = p;
      out.push(p);
    }

    lines.forEach(function (line) {
      var l = line.trim();
      if (!l) return;
      if (l.indexOf("|") > -1 && /^\|?[\s:|-]*-[\s:|-]*\|?$/.test(l)) return; // 表格分隔行
      if (l.indexOf("|") > -1) {
        var cells = l.replace(/^\||\|$/g, "").split("|");
        var c0 = cleanPoint(cells[0] || "");
        if (c0 && c0.length <= 20) add(c0, 1.25);
        var c1 = cleanPoint(cells[1] || "");
        if (c1) add(c1, 1);
        return;
      }
      var isLi = /^(?:[-*+·•]|\d+[.、)])\s+/.test(l);
      var body = l.replace(/^(?:[-*+·•]|\d+[.、)])\s+/, "");
      var w = isLi ? 1.2 : 1;
      body.split(/[。！？!?；;]+/).forEach(function (sent) {
        sent = sent.trim();
        if (!sent) return;
        var ci = sent.indexOf("：");
        if (ci < 0) ci = sent.indexOf(":");
        if (ci > 0 && ci <= 14) { add(sent.slice(0, ci), w + 0.15); sent = sent.slice(ci + 1); }
        var parts = sent.split(/→|->|\/|、/);
        if (parts.length > 1) parts.forEach(function (p) { add(p, w); });
        else add(sent, w);
      });
    });

    out = out.filter(function (p) { return p.key.replace(/[^\u4e00-\u9fa5a-z0-9]/g, "").length >= 2; });
    /* 整段式答案颗粒太粗，再按逗号补一层，避免「一个要点=整段话」 */
    if (out.length < 3) {
      String(ref).replace(/[*`>#]/g, "").split(/[，,]/).forEach(function (seg) { add(seg, 0.9); });
      out = out.filter(function (p) { return p.key.replace(/[^\u4e00-\u9fa5a-z0-9]/g, "").length >= 2; });
    }
    return out.slice(0, 14);
  }

  /* 2 = 说到位，1 = 沾了边，0 = 没说
     中文用字符二元组算覆盖，能容忍「冒烟」对「冒烟测试」这类简写 */
  function bigrams(s) {
    var out = [], seen = {}, i, g;
    for (i = 0; i < s.length - 1; i++) {
      g = s.slice(i, i + 2);
      if (!seen[g]) { seen[g] = 1; out.push(g); }
    }
    return out;
  }
  function bigramCover(a, b) {
    var g = bigrams(a);
    if (!g.length) return 0;
    var n = 0;
    g.forEach(function (x) { if (b.indexOf(x) > -1) n++; });
    return n / g.length;
  }
  /* 虚词不承载语义，先剔掉再切双字组，"环境与数据准备"才不会白丢分 */
  function coreKey(k) {
    var t = String(k).replace(/[与和的及或等之了着把被对从在为以也都更最每个种些该此其]/g, "");
    return t.length >= 2 ? t : String(k);
  }
  /* 在多个要点里都出现的双字组（如「测试」）区分度低，不算命中 */
  function dfOf(pts) {
    var df = {};
    pts.forEach(function (p) {
      var seen = {};
      bigrams(coreKey(p.key)).forEach(function (g) {
        if (!seen[g]) { seen[g] = 1; df[g] = (df[g] || 0) + 1; }
      });
    });
    return df;
  }
  function pointLevel(p, userRaw, userNorm, df) {
    if (/^[\x00-\x7F]+$/.test(p.text)) {
      return userRaw.toLowerCase().indexOf(p.text.toLowerCase()) > -1 ? 2 : 0;
    }
    if (userNorm.indexOf(p.key) > -1) return 2;
    if (p.key.length < 2) return 0;
    var bg = bigrams(coreKey(p.key));
    if (!bg.length) return 0;
    var valid = bg.filter(function (g) { return !df || (df[g] || 0) < 3; });
    if (valid.length < 2) valid = bg;
    var n = 0;
    valid.forEach(function (g) { if (userNorm.indexOf(g) > -1) n++; });
    /* 四字以内的短要点，说到其中一半就算说到 */
    if (valid.length <= 2) return n >= 1 ? 2 : 0;
    var r = n / valid.length;
    if (r >= 0.5) return 2;
    if (r >= 0.3) return 1;
    return 0;
  }

  function lenScoreOf(r) {
    if (r < 0.2) return 0.12;
    if (r < 0.35) return 0.4;
    if (r < 0.55) return 0.62;
    if (r < 0.8) return 0.84;
    if (r <= 2) return 1;
    if (r <= 3) return 0.86;
    return 0.72;
  }
  function structScoreOf(t) {
    var s = 0;
    if (/(^|\n)\s*(?:\d+[.、)]|[·•\-*]|首先|其次|然后|接着|最后|第一|第二|第三|其一|其二)/.test(t)) s += 1;
    if (/\d+(?:\.\d+)?\s*(?:%|个|条|次|天|小时|分钟|秒|人|轮|版|万|千|qps|tps|ms)/i.test(t) || /\d{3,}/.test(t)) s += 1;
    if (/我(?:们)?(?:在|上个|之前|当时|做|负责)|项目|上线|提测|团队|公司|业务|需求方/.test(t)) s += 1;
    if (/输入|活动|输出|背景|做法|结果|原因|方案|结论|收获|反思/.test(t)) s += 1;
    return Math.min(1, s / 3);
  }

  /* 代码题（答案以代码块为主）：按关键函数 / 命令的覆盖判，不强求文字要点 */
  function isCodeHeavy(ref) {
    var s = String(ref || "");
    var m = s.match(/```[\s\S]*?```/g) || [];
    var cl = 0;
    m.forEach(function (f) { cl += f.length; });
    return cl > s.length * 0.5;
  }
  function codeTokens(s) {
    var t = String(s)
      .replace(/```[a-zA-Z]*/g, " ")
      .replace(/#[^\n]*/g, " ")
      .replace(/\/\/[^\n]*/g, " ");
    var m = t.match(/[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?/g) || [];
    var seen = {}, out = [];
    m.forEach(function (x) {
      var k = x.toLowerCase();
      if (k.length < 2 && !/\d/.test(k)) return;
      if (!seen[k]) { seen[k] = 1; out.push(k); }
    });
    return out;
  }
  function gradeCode(userRaw, q) {
    var ref = String(q.a || "");
    var rt = codeTokens(ref), ut = codeTokens(userRaw);
    var uSet = {};
    ut.forEach(function (t) { uSet[t] = 1; });
    var hit = [], miss = [];
    rt.forEach(function (t) { (uSet[t] ? hit : miss).push(t); });
    var cover = rt.length ? hit.length / rt.length : 0;
    var hasCode = /```|(?:^|\n)\s*(?:\$ |def |for |print|if |import |from |select |update |insert |df |docker |kubectl |git |curl |cat |grep )/i.test(String(userRaw));
    var score = Math.round(cover * 84 + (hasCode ? 16 : 0));
    if (plainLen(userRaw) < 6) score = Math.min(score, 20);
    var tips = [];
    if (!hasCode && cover < 0.7) tips.push("这题是代码／命令题，直接写出能跑的内容，比用文字描述更有效");
    if (miss.length && cover < 0.85) tips.push("参考里这几个没出现：" + miss.slice(0, 5).join("、") + (miss.length > 5 ? " 等" : ""));
    if (cover >= 0.85 && hasCode) tips.push("关键函数 / 命令基本齐了，面试时补一句「这条命令看什么指标」会更完整");
    return {
      s: score,
      cover: Math.round(Math.min(1, cover) * 100),
      h: hit.slice(0, 10).map(function (t) { return { t: t, p: 0 }; }), hn: hit.length,
      m: miss.slice(0, 8), mn: miss.length,
      part: 0, total: rt.length,
      tips: tips.slice(0, 3),
      len: plainLen(userRaw), refLen: plainLen(ref), code: 1
    };
  }

  function findQByKey(key) {
    if (window.DOC_ALL && window.DOC_ALL[key]) return window.DOC_ALL[key];
    for (var i = 0; i < BANK.length; i++) {
      var c = BANK[i], j;
      for (j = 0; j < c.items.length; j++) if (c.items[j].key === key) return c.items[j];
      for (j = 0; j < c.asks.length; j++) if (c.asks[j].key === key) return c.asks[j];
    }
    return null;
  }
  /* 只用「一句话回答」作判题基准：详细版是扩展阅读，不该当成及格线 */
  function refOf(q) {
    var a = String(q.a || "");
    var pts = extractPoints(a);
    return {
      pts: pts, df: dfOf(pts),
      len: Math.min(340, Math.max(40, plainLen(a))),
      key: normTxt(a)
    };
  }

  function gradeAnswer(userRaw, q) {
    if (isCodeHeavy(q.a)) return gradeCode(userRaw, q);
    var user = String(userRaw || "").trim();
    var ref = refOf(q);
    var un = normTxt(user);
    var hit = [], miss = [], wSum = 0, wHit = 0, part = 0;

    ref.pts.forEach(function (p) {
      var lv = pointLevel(p, user, un, ref.df);
      wSum += p.w;
      if (lv === 2) { wHit += p.w; hit.push({ t: p.text, p: 0 }); }
      else if (lv === 1) { wHit += p.w * 0.5; hit.push({ t: p.text, p: 1 }); part++; }
      else miss.push(p.text);
    });

    var cover = wSum ? wHit / wSum : 0;
    var ulen = plainLen(user);
    var rlen = ref.len || 120;
    var lr = ulen / rlen;
    var copyLike = !!(ref.key && un.length >= ref.key.length * 0.75 && bigramCover(ref.key, un) >= 0.88);
    var ss = structScoreOf(user);
    /* 内容写得和参考答案一样全，就不该因为参考答案本身没分点而扣结构分 */
    if (copyLike) ss = Math.max(ss, 0.8);
    var score = Math.round(cover * 66 + lenScoreOf(lr) * 17 + ss * 17);
    if (copyLike) score = Math.max(score, 92);   // 内容与参考答案一致，不该被要点切分方式拖低
    if (ulen < 8) score = Math.min(score, 20);
    if (!ref.pts.length) score = Math.min(score, 55);

    var tips = [];
    if (copyLike) tips.push("这段和参考答案几乎逐字重合，多半是照着写的；建议合上答案，用自己的话再讲一遍");
    if (miss.length) {
      tips.push("还差 " + miss.length + " 个要点，优先补「" + miss.slice(0, 3).join("、") + "」" + (miss.length > 3 ? " 等" : ""));
    }
    if (lr < 0.5) tips.push("只写了 " + ulen + " 字（参考约 " + rlen + " 字），面试口述 45~90 秒，别一句带过");
    if (!copyLike) {
      if (!/\d/.test(user)) tips.push("全文没有数字，补一个「多少条用例 / 多少并发 / 提升几个点」，立刻像做过项目");
      if (!/我|项目|上线|提测|团队/.test(user) && ulen > 30) tips.push("缺少项目视角，按「输入—活动—输出」补一句自己做过的实例");
    }
    if (ulen > 120 && !/(^|\n)\s*(?:\d+[.、)]|[·•\-*]|首先|其次|最后|第一)/.test(user))
      tips.push("整段连写，建议分点说（第一…第二…），面试官更容易跟上");
    if (score >= 85 && !tips.length) tips.push("覆盖和结构都到位，接着打磨语速和结尾那句总结就行");

    return {
      s: score,
      cover: Math.round(Math.min(1, cover) * 100),
      h: hit.slice(0, 10), hn: hit.length,
      m: miss.slice(0, 8), mn: miss.length,
      part: part,
      total: ref.pts.length,
      tips: tips.slice(0, 3),
      len: ulen, refLen: rlen
    };
  }
  function gradeLevel(s) {
    if (s >= 85) return { k: "ok", t: "说得很完整", d: "要点齐、有细节，可以照这个说" };
    if (s >= 70) return { k: "good", t: "基本合格", d: "骨架有了，补上缺口更稳" };
    if (s >= 50) return { k: "warn", t: "还差火候", d: "关键几块没说，容易被追问" };
    return { k: "bad", t: "需要重写", d: "先把参考答案过一遍" };
  }
  function gradeCardHTML(st) {
    var g = st && st.g;
    if (!g) return "";
    var lv = gradeLevel(g.s);
    var dash = (Math.max(3, g.s) / 100 * 113).toFixed(1);
    function chip(t, kind) { return '<span class="gd-chip ' + kind + '">' + esc(t) + "</span>"; }
    return (
      '<div class="gd-card k-' + lv.k + '">' +
      '<div class="gd-head"><div class="gd-ring-wrap">' +
      '<svg viewBox="0 0 44 44" aria-hidden="true">' +
      '<circle class="gd-ring-bg" cx="22" cy="22" r="18"/>' +
      '<circle class="gd-ring-fg" cx="22" cy="22" r="18" stroke-dasharray="' + dash + ' 113"/>' +
      "</svg>" +
      '<div class="gd-num"><b>' + g.s + "</b><i>分</i></div></div>" +
      '<div class="gd-sum"><div class="gd-lv">' + lv.t + "<span>" + lv.d + "</span></div>" +
      '<div class="gd-meta">' + (g.code ? "代码要点 " : "要点 ") + '<b>' + g.hn + "/" + g.total + "</b>" +
      (g.part ? "（" + g.part + " 处不完整）" : "") +
      " · 回答 " + g.len + " 字 · 参考约 " + g.refLen + " 字</div>" +
      "</div></div>" +
      (g.h.length
        ? '<div class="gd-row"><em class="ok">答到了</em>' +
          g.h.map(function (o) { return chip(o.t, o.p ? "hp" : "h"); }).join("") +
          (g.hn > g.h.length ? '<span class="gd-more">等 ' + g.hn + " 个</span>" : "") + "</div>"
        : "") +
      (g.m.length
        ? '<div class="gd-row"><em class="bad">还缺</em>' +
          g.m.map(function (t) { return chip(t, "m"); }).join("") +
          (g.mn > g.m.length ? '<span class="gd-more">等 ' + g.mn + " 个</span>" : "") + "</div>"
        : "") +
      (g.tips.length ? '<ul class="gd-tips">' + g.tips.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "") +
      '<div class="gd-note">' +
      (g.code
        ? "代码题按关键函数 / 命令的覆盖粗判：换一种写法只要能跑通，同样算对。"
        : "本地规则比对（要点覆盖 / 篇幅 / 结构），浅色 = 提到了但不够完整；语义准不准还得你自己核。") +
      "想要逐题精批就点「导出默写」发给 AI。</div>" +
      "</div>"
    );
  }

  /* ---------------- 默写交互 ---------------- */
  function findWriteHost(key) {
    return document.querySelector('.w-item[data-key="' + key + '"]');
  }
  function rerenderWriteItem(key) {
    stopVoice();
    var obj = null, idx = 0, kind = "orig";
    BANK.forEach(function (c) {
      c.items.forEach(function (it, i) { if (it.key === key) { obj = it; idx = i; } });
      c.asks.forEach(function (q, i) { if (q.key === key) { obj = q; idx = i; kind = "ask"; } });
    });
    if (!obj) {
      var dq = window.DOC_ALL && window.DOC_ALL[key];
      if (dq) { obj = dq; idx = (dq.seq || 1) - 1; kind = dq.kind || "orig"; }
    }
    if (!obj) return;
    var host = findWriteHost(key);
    if (!host) return;
    var tmp = document.createElement("div");
    tmp.innerHTML = wItemHTML(obj, idx, kind);
    var next = tmp.firstElementChild;
    next.querySelectorAll(".ans-area").forEach(function (a) {
      a.setAttribute("data-view", vstate.ans);
      if (vstate.ans === "detail") fillDetail(a);
    });
    next.querySelectorAll(".ans-switch .sw-btn").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-view") === vstate.ans);
    });
    host.replaceWith(next);
    refreshWriteStats();
    requestAnimationFrame(autoGrowDone);
  }

  function submitWrite(key, redo) {
    if (!redo) {
      var host = findWriteHost(key);
      var ta = host ? host.querySelector(".w-area") : null;
      if (!ta) return;
      var text = ta.value.trim();
      if (!text) { toast("先写点内容，再点「答题结束」"); ta.focus(); return; }
      var q0 = findQByKey(key);
      wstate[key] = { t: ta.value, done: true, ts: Date.now() };
      if (q0) wstate[key].g = gradeAnswer(ta.value, q0);
      saveW();
      rerenderWriteItem(key);
      var g0 = wstate[key].g;
      toast(g0 ? "已判分 " + g0.s + " 分 · " + gradeLevel(g0.s).t : "已提交，对照参考答案看看差距");
    } else {
      if (wstate[key]) { wstate[key].done = false; saveW(); }
      rerenderWriteItem(key);
      var h2 = findWriteHost(key);
      if (h2) {
        var ta2 = h2.querySelector(".w-area");
        ta2.focus();
        ta2.selectionStart = ta2.selectionEnd = ta2.value.length;
      }
    }
  }
  function clearWrite(key) {
    delete wstate[key];
    saveW();
    rerenderWriteItem(key);
    toast("已清除本题默写");
  }
  function clearCatWrite(catId) {
    var cat = BANK.filter(function (c) { return c.id === catId; })[0];
    if (!cat) return;
    var n = 0;
    cat.items.concat(cat.asks).forEach(function (q) {
      if (wstate[q.key]) { delete wstate[q.key]; n++; }
    });
    saveW();
    cat.items.concat(cat.asks).forEach(function (q) { rerenderWriteItem(q.key); });
    toast(n ? "已清空「" + cat.title + "」" + n + " 道默写" : "本类还没有默写记录");
  }
  function clearAllWrite() {
    /* 只清主手册的键，文档库（key 带 @）由文档页自己的清空按钮负责 */
    var keys = Object.keys(wstate).filter(function (k) { return k.indexOf("@") < 0; });
    if (!keys.length) { toast("当前没有任何默写记录"); return; }
    keys.forEach(function (k) { delete wstate[k]; });
    saveW();
    BANK.forEach(function (c) {
      c.items.concat(c.asks).forEach(function (q) { rerenderWriteItem(q.key); });
    });
    toast("已清空全部 " + keys.length + " 条默写记录");
  }

  /* ---------------- 语音输入（Web Speech API） ---------------- */
  var SRClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  var voice = { rec: null, ta: null, active: false, fatal: false, idle: null };

  function voiceBlockReason() {
    if (!SRClass) return "no-support";
    if (window.isSecureContext === false) return "insecure";
    return "";
  }
  function voiceFallbackMsg(why) {
    if (why === "no-support")
      return "这个浏览器不支持网页内语音：手机端可直接点输入法键盘上的麦克风说话";
    return "语音输入需要 HTTPS 打开：换成发布后的链接，或先用键盘麦克风";
  }
  function liveOf(ta) {
    var host = ta && ta.closest ? ta.closest(".w-item") : null;
    return host ? host.querySelector(".w-live") : null;
  }
  function setMicUI(ta, on) {
    var host = ta && ta.closest ? ta.closest(".w-item") : null;
    if (!host) return;
    var btn = host.querySelector(".w-mic");
    var live = host.querySelector(".w-live");
    if (btn) {
      btn.classList.toggle("rec", on);
      var lb = btn.querySelector("span");
      if (lb) lb.textContent = on ? "停止" : "语音";
      btn.setAttribute("title", on ? "点一下结束录音" : "语音输入：点一下开始说，再点一下停止");
    }
    if (live) {
      live.hidden = !on;
      var tx = live.querySelector(".live-txt");
      if (tx) tx.textContent = on ? "正在听…" : "";
    }
    host.classList.toggle("recording", on);
  }
  /* 按光标位置插入识别结果，必要时补一个中文逗号，避免两句粘在一起 */
  function insertSpeech(ta, text) {
    if (!ta || !text) return;
    var v = ta.value;
    var s = ta.selectionStart, e = ta.selectionEnd;
    if (typeof s !== "number") { s = v.length; e = v.length; }
    var head = v.slice(0, s), tail = v.slice(e);
    var add = text;
    var lastCh = head.replace(/\s+$/, "").slice(-1);
    var stop = /[\s\n，。、；：！？…—,.;:!?"”'）)】]/;
    if (lastCh && !stop.test(lastCh) && !/^[，。、；：！？,.;:!?）)]/.test(add)) add = "，" + add;
    ta.value = head + add + tail;
    var pos = head.length + add.length;
    ta.selectionStart = ta.selectionEnd = pos;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function startVoice(ta) {
    var why = voiceBlockReason();
    if (why) { toast(voiceFallbackMsg(why)); return; }
    if (voice.ta === ta && voice.active) { stopVoice(); return; }
    stopVoice();
    var host = ta.closest(".w-item");
    if (host && host.classList.contains("done")) {
      toast("已提交，点「重新作答」后可继续语音输入");
      return;
    }
    var rec = new SRClass();
    rec.lang = "zh-CN";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    voice.rec = rec; voice.ta = ta; voice.active = true; voice.fatal = false;
    setMicUI(ta, true);
    var fab = document.getElementById("voiceFab");
    if (fab) fab.hidden = false;
    /* 录音时收起软键盘，把屏幕让给识别结果 */
    if (document.activeElement === ta) ta.blur();

    var errMsg = {
      "not-allowed": "麦克风被拒绝：允许本页使用麦克风后再试",
      "service-not-allowed": "当前环境不允许语音识别，请用 HTTPS 链接打开",
      "audio-capture": "没找到麦克风设备",
      "network": "语音服务连不上，检查网络后重试",
      "no-speech": "没听到声音，靠近一点再说"
    };

    rec.onresult = function (ev) {
      armIdle();
      var interim = "";
      for (var i = ev.resultIndex; i < ev.results.length; i++) {
        var r = ev.results[i];
        var txt = (r[0] && r[0].transcript) || "";
        txt = txt.trim();
        if (r.isFinal) { if (txt) insertSpeech(voice.ta, txt); }
        else if (txt) interim += txt;
      }
      var live = liveOf(voice.ta);
      if (live) {
        var tx = live.querySelector(".live-txt");
        if (tx) tx.textContent = interim || "正在听…";
      }
    };
    rec.onerror = function (ev) {
      var code = ev.error || "unknown";
      if (code === "not-allowed" || code === "service-not-allowed") voice.fatal = true;
      if (code !== "no-speech") toast(errMsg[code] || ("语音识别出错：" + code));
      if (voice.fatal) stopVoice();
    };
    rec.onend = function () {
      /* 浏览器静音几秒会自动断，用户没点停止就续上 */
      if (voice.active && !voice.fatal && voice.ta) {
        try { rec.start(); return; } catch (e) {}
      }
      stopVoice();
    };
    try { rec.start(); armIdle(); }
    catch (e) { toast("语音启动失败，请重试"); stopVoice(); }
  }
  var voiceFab = document.getElementById("voiceFab");
  if (voiceFab) {
    voiceFab.addEventListener("click", function (e) {
      if (e.target.closest(".fab-stop") || e.target === voiceFab) stopVoice();
    });
  }
  function stopVoice() {
    var t = voice.ta, rec = voice.rec;
    voice.active = false; voice.rec = null; voice.ta = null;
    if (voice.idle) { clearTimeout(voice.idle); voice.idle = null; }
    if (rec) {
      rec.onresult = rec.onerror = rec.onend = null;
      try { rec.stop(); } catch (e) {}
    }
    if (t) setMicUI(t, false);
    var fab = document.getElementById("voiceFab");
    if (fab) fab.hidden = true;
  }
  /* 60 秒没识别到任何内容就自动停，避免人走了麦克风还一直开着 */
  function armIdle() {
    if (voice.idle) clearTimeout(voice.idle);
    voice.idle = setTimeout(function () {
      if (!voice.active) return;
      stopVoice();
      toast("60 秒没听到内容，已自动停止录音");
    }, 60000);
  }
  /* 切到别的 App、锁屏、页面前进后退：立刻释放麦克风 */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && voice.active) {
      stopVoice();
      toast("已离开页面，录音已停止");
    }
  });
  window.addEventListener("pagehide", function () { if (voice.active) stopVoice(); });


  /* ---------------- 弹窗 ---------------- */
  var modalOk = null;
  function confirmBox(title, text, onOk) {
    document.getElementById("modalTitle").textContent = title;
    document.getElementById("modalText").textContent = text;
    modalOk = onOk;
    document.getElementById("modalMask").hidden = false;
  }
  document.getElementById("modalCancel").onclick = function () {
    document.getElementById("modalMask").hidden = true;
  };
  document.getElementById("modalOk").onclick = function () {
    document.getElementById("modalMask").hidden = true;
    if (modalOk) modalOk();
  };
  document.getElementById("modalMask").addEventListener("click", function (e) {
    if (e.target === this) this.hidden = true;
  });
  document.getElementById("howBtn").onclick = function () {
    document.getElementById("howMask").hidden = false;
  };
  document.getElementById("howClose").onclick = function () {
    document.getElementById("howMask").hidden = true;
  };
  document.getElementById("howMask").addEventListener("click", function (e) {
    if (e.target === this) this.hidden = true;
  });

  /* ---------------- 搜索 ---------------- */
  var searchInput = document.getElementById("search");
  var clearSearchBtn = document.getElementById("clearSearch");
  var searchView = document.getElementById("searchView");
  var searchBody = document.getElementById("svBody");
  var catSections = document.getElementById("catSections");
  var searchHint = document.getElementById("searchHint");

  function doSearch() {
    var kw = searchInput.value.trim();
    clearSearchBtn.classList.toggle("show", !!kw);
    if (!kw) {
      searchView.hidden = true;
      catSections.hidden = false;
      searchHint.textContent = "";
      return;
    }
    var hits = [];
    ALL_Q.forEach(function (it) {
      if (matches(it.q, kw) || matches(it.a, kw) || matches(DETAIL[it.key], kw))
        hits.push({ type: "orig", catId: it.catId, item: it });
    });
    ALL_ASK.forEach(function (q) {
      if (matches(q.q, kw) || matches(q.a, kw) || matches(q.d, kw))
        hits.push({ type: "ask", catId: q.key.split("-")[0], item: q });
    });
    searchHint.textContent = "找到 " + hits.length + " 条相关内容（含详细答案）";

    if (!hits.length) {
      searchBody.innerHTML =
        '<div class="empty"><div>没有找到包含「' + esc(kw) + "」的题目</div>" +
        '<div style="font-size:12.5px;margin-top:6px">试试「边界值」「TPS」「Jenkins」等关键词</div></div>';
    } else {
      var groups = {};
      hits.forEach(function (h) { (groups[h.catId] = groups[h.catId] || []).push(h); });
      searchBody.innerHTML = BANK.filter(function (c) { return groups[c.id]; })
        .map(function (c) {
          return (
            '<div class="sv-group-title">' + esc(c.title) + " · " + groups[c.id].length + " 条</div>" +
            groups[c.id].map(function (h) {
              return h.type === "ask" ? askCard(h.item, kw) : qCard(h.item, kw);
            }).join("")
          );
        })
        .join("");
      setAnsView(searchBody, vstate.ans);
    }
    document.getElementById("svCount").textContent = hits.length + " 条结果";
    searchView.hidden = false;
    catSections.hidden = true;
    window.scrollTo({ top: 0, behavior: "auto" });
  }
  searchInput.addEventListener("input", doSearch);
  clearSearchBtn.onclick = function () {
    searchInput.value = "";
    doSearch();
    searchInput.focus();
  };
  document.addEventListener("keydown", function (e) {
    var tag = document.activeElement ? document.activeElement.tagName : "";
    if (e.key === "/" && document.activeElement !== searchInput && !/TEXTAREA|INPUT/.test(tag)) {
      e.preventDefault();
      searchInput.focus();
    }
    if (e.key === "Escape") {
      ["modalMask", "howMask", "exportMask"].forEach(function (id) {
        document.getElementById(id).hidden = true;
      });
      if (document.activeElement === searchInput) {
        searchInput.value = "";
        doSearch();
        searchInput.blur();
      }
    }
  });

  /* ---------------- 模式切换 ---------------- */
  function setMode(mode) {
    if (mode !== "write") stopVoice();
    vstate.mode = mode;
    saveV();
    document.body.setAttribute("data-mode", mode);
    document.querySelectorAll("#modeSeg .seg-btn").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-mode") === mode);
    });
    if (mode === "write") renderWrite();
    if (searchInput.value.trim()) doSearch();
    else onScroll();
  }
  document.getElementById("modeSeg").addEventListener("click", function (e) {
    var b = e.target.closest(".seg-btn");
    if (b) setMode(b.getAttribute("data-mode"));
  });
  document.getElementById("ansSeg").addEventListener("click", function (e) {
    var b = e.target.closest(".seg-btn");
    if (b) {
      var view = b.getAttribute("data-ans");
      /* 搜索视图与两个模式容器一起生效 */
      setAnsView(document.body, view);
      if (!searchView.hidden) setAnsView(searchBody, view);
    }
  });

  /* ---------------- 事件委托 ---------------- */
  document.addEventListener("click", function (e) {
    var t = e.target;

    var sw = t.closest ? t.closest(".sw-btn") : null;
    if (sw) {
      var card = sw.closest(".q-card, .w-item");
      if (card) setAnsView(card, sw.getAttribute("data-view"));
      return;
    }

    if (document.body.classList.contains("hide-answers")) {
      var ans = t.closest ? t.closest(".ans-area, .answer-tip") : null;
      if (ans) ans.closest(".q-card").classList.add("peek");
    }
  });

  /* 默写区：输入与按钮 */
  document.addEventListener("input", function (e) {
    var ta = e.target.closest ? e.target.closest(".w-area") : null;
    if (!ta) return;
    var key = ta.getAttribute("data-wkey");
    var host = ta.closest(".w-item");
    var c = host.querySelector(".w-count");
    if (c) c.textContent = ta.value.length + " 字";
    if (!wstate[key] || !wstate[key].done) {
      wstate[key] = wstate[key] || {};
      wstate[key].t = ta.value;
      saveW();
    }
  });
  document.addEventListener("click", function (e) {
    var t = e.target;
    var doneBtn = t.closest ? t.closest(".w-done") : null;
    if (doneBtn) {
      var item = doneBtn.closest(".w-item");
      submitWrite(item.getAttribute("data-key"), item.classList.contains("done"));
      return;
    }
    var clrBtn = t.closest ? t.closest(".w-clear") : null;
    if (clrBtn) {
      clearWrite(clrBtn.closest(".w-item").getAttribute("data-key"));
      return;
    }
    var micBtn = t.closest ? t.closest(".w-mic") : null;
    if (micBtn) {
      var micHost = micBtn.closest(".w-item");
      var micTa = micHost ? micHost.querySelector(".w-area") : null;
      if (micTa) startVoice(micTa);
      return;
    }
    var catClr = t.closest ? t.closest("[data-wclear-cat]") : null;
    if (catClr) {
      var cid = catClr.getAttribute("data-wclear-cat");
      var cat0 = BANK.filter(function (c) { return c.id === cid; })[0];
      confirmBox(
        "清空本类默写",
        "将清除「" + (cat0 ? cat0.title : "") + "」全部 " + (cat0 ? cat0.items.length + cat0.asks.length : 0) + " 题的默写内容（含已提交的），题目本身不受影响。",
        function () { clearCatWrite(cid); }
      );
      return;
    }
    var expCat = t.closest ? t.closest("[data-exportcat]") : null;
    if (expCat) {
      openExport(expCat.getAttribute("data-exportcat"));
    }
  });

  /* ---------------- 导出 ---------------- */
  var expMask = document.getElementById("exportMask");
  var expScope = document.getElementById("expScope");
  function openExport(presetCat) {
    var opts = ['<option value="all">全部 20 个分类</option>'];
    BANK.forEach(function (c) {
      opts.push('<option value="' + c.id + '">' + toCn(c.index + 1) + "、" + esc(c.title) + "</option>");
    });
    expScope.innerHTML = opts.join("");
    expScope.value = presetCat || "all";
    expMask.hidden = false;
  }
  document.getElementById("exportBtn").onclick = function () { openExport("all"); };
  document.getElementById("exportCancel").onclick = function () { expMask.hidden = true; };
  expMask.addEventListener("click", function (e) { if (e.target === expMask) expMask.hidden = true; });

  document.getElementById("exportOk").onclick = function () {
    var catId = expScope.value;
    var withRef = document.getElementById("expRef").checked;
    var onlyDone = document.getElementById("expDone").checked;
    var cats = catId === "all" ? BANK : BANK.filter(function (c) { return c.id === catId; });
    var now = new Date();
    var pad = function (n) { return String(n).padStart(2, "0"); };
    var stamp = String(now.getFullYear()) + pad(now.getMonth() + 1) + pad(now.getDate()) + "-" + pad(now.getHours()) + pad(now.getMinutes());
    var timeStr = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) + " " + pad(now.getHours()) + ":" + pad(now.getMinutes());

    var lines = [];
    var totalQ = 0, answeredQ = 0;
    cats.forEach(function (c) { totalQ += c.items.length + c.asks.length; answeredQ += catSubmitted(c); });

    lines.push("# 软件测试面试 · 默写记录");
    lines.push("");
    lines.push("- 导出时间：" + timeStr);
    lines.push("- 范围：" + (catId === "all" ? "全部分类" : (BANK.filter(function (c) { return c.id === catId; })[0] || {}).title || catId) + "（" + totalQ + " 题）");
    lines.push("- 已作答：" + answeredQ + " 题" + (onlyDone ? "（本次只导出已作答）" : ""));
    var gAll = 0, gN = 0;
    cats.forEach(function (c) {
      c.items.concat(c.asks).forEach(function (q) {
        var st = wstate[q.key];
        if (onlyDone && !(st && st.done)) return;
        if (st && st.g) { gAll += st.g.s; gN++; }
      });
    });
    if (gN) lines.push("- 本机自评均分：" + Math.round(gAll / gN) + "（" + gN + " 题已有分数）");
    lines.push("");
    lines.push("> 请批改我的回答：按「输入—活动—输出」结构完整性、内容正确性、是否像做过项目来逐题点评，并给出更优的口述版本。每题附有本机粗评（关键词覆盖 + 篇幅 + 结构），仅供参考，请以你的判断为准。");
    lines.push("");

    var pushed = 0;
    cats.forEach(function (c) {
      var block = [];
      var any = false;
      function pushOne(kind, q, idx) {
        var st = wstate[q.key] || {};
        var isDone = !!st.done;
        if (onlyDone && !isDone) return;
        any = true;
        block.push("### " + (kind === "ask" ? "追问" : "第 " + (idx + 1) + " 题") + "｜" + q.q + (q.star ? "（高频）" : ""));
        block.push("");
        block.push("**我的回答**：");
        var txt = String(st.t || "").trim();
        block.push(txt ? txt : "*(未作答)*");
        block.push("");
        if (st.g) {
          block.push("**本机自评**：" + st.g.s + " 分 · 要点 " + st.g.hn + "/" + st.g.total + " 个 · " + gradeLevel(st.g.s).t);
          if (st.g.m && st.g.m.length) block.push("**主要缺口**：" + st.g.m.slice(0, 5).join("、"));
          block.push("");
        }
        if (withRef) {
          block.push("**参考答案（口述骨架）**：");
          block.push(String(q.a || "").replace(/\n/g, " "));
          block.push("");
        }
        pushed++;
      }
      c.asks.forEach(function (q, i) { pushOne("ask", q, i); });
      c.items.forEach(function (it, i) { pushOne("orig", it, i); });
      if (!any && onlyDone) return;
      lines.push("---");
      lines.push("");
      lines.push("## " + toCn(c.index + 1) + "、" + c.title);
      lines.push("");
      lines.push.apply(lines, block);
    });

    if (!pushed) {
      toast("该范围内没有可导出的作答（试试取消「只导出已作答」）");
      return;
    }
    var blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "软件测试面试-默写-" + stamp + ".md";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 400);
    expMask.hidden = true;
    toast("已导出 " + pushed + " 题的默写记录");
  };

  /* ---------------- 清空 ---------------- */
  document.getElementById("clearAll").onclick = function () {
    /* 只数主手册的键；文档库（key 带 @）由文档页自己的按钮清 */
    var n = Object.keys(wstate).filter(function (k) { return k.indexOf("@") < 0; }).length;
    if (!n) { toast("当前没有任何答题痕迹"); return; }
    confirmBox(
      "一键清空答题痕迹",
      "将清除全部 " + n + " 条默写记录（含已提交的答案文本），所有题目恢复未作答状态。此操作不影响题目内容。",
      clearAllWrite
    );
  };
  document.getElementById("clearAllSide").onclick = function () {
    document.getElementById("clearAll").click();
  };

  /* ---------------- 隐藏 / 显示答案 ---------------- */
  var toggleBtn = document.getElementById("toggleAnswers");
  toggleBtn.onclick = function () {
    var hidden = document.body.classList.toggle("hide-answers");
    document.querySelectorAll(".q-card.peek").forEach(function (c) { c.classList.remove("peek"); });
    toggleBtn.classList.toggle("off", hidden);
    toggleBtn.innerHTML = '<span class="dot"></span>' + (hidden ? "显示答案" : "隐藏答案");
    toast(hidden ? "已隐藏答案，点击答案区可临时查看" : "已显示全部答案");
  };

  /* ---------------- 顶栏收起 / 展开（窄屏） ---------------- */
  var barToggle = document.getElementById("barToggle");
  var barActions = document.getElementById("barActions");
  var BARKEY = "stqb_bar_collapsed";
  function setBarCollapsed(v) {
    document.body.classList.toggle("bar-collapsed", !!v);
    if (barToggle) {
      barToggle.setAttribute("aria-expanded", v ? "false" : "true");
      var lb = barToggle.querySelector(".bt-label");
      if (lb) lb.textContent = v ? "展开工具" : "收起工具";
    }
    try { localStorage.setItem(BARKEY, v ? "1" : "0"); } catch (e) {}
  }
  if (barToggle) barToggle.onclick = function () {
    var next = !document.body.classList.contains("bar-collapsed");
    setBarCollapsed(next);
    if (!next && barActions) {
      barActions.classList.remove("bar-in");
      void barActions.offsetWidth;
      barActions.classList.add("bar-in");
    }
  };

  /* ---------------- 手机端目录折叠 ---------------- */
  var sideToggle = document.getElementById("sideToggle");
  function isNarrow() { return window.innerWidth <= 900; }
  function setCatCollapsed(v) {
    document.body.classList.toggle("cat-collapsed", !!v);
    var lb = sideToggle.querySelector("span");
    if (lb) lb.textContent = v ? "展开" : "收起";
    try { localStorage.setItem("stqb_cat_collapsed", v ? "1" : "0"); } catch (e) {}
  }
  sideToggle.onclick = function () {
    setCatCollapsed(!document.body.classList.contains("cat-collapsed"));
  };

  /* ---------------- 目录点击 & 滚动 ---------------- */
  document.getElementById("catList").addEventListener("click", function (e) {
    var a = e.target.closest(".cat-item");
    if (!a) return;
    e.preventDefault();
    if (searchInput.value.trim()) {
      searchInput.value = "";
      doSearch();
    }
    var id = a.getAttribute("data-cat");
    if (vstate.mode === "write" && !document.getElementById("writeSections")._built) renderWrite();
    var prefix = vstate.mode === "write" ? "wsec-" : "sec-";
    var sec = document.getElementById(prefix + id);
    if (sec) {
      var y = sec.getBoundingClientRect().top + window.pageYOffset - 74;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
    if (isNarrow()) setCatCollapsed(true);
  });

  var links = [];
  function onScroll() {
    var top = window.pageYOffset;
    document.getElementById("toTop").classList.toggle("show", top > 400);
    if (catSections.hidden) return;
    var current = null;
    var prefix = vstate.mode === "write" ? "wsec-" : "sec-";
    BANK.forEach(function (cat) {
      var sec = document.getElementById(prefix + cat.id);
      if (sec && sec.getBoundingClientRect().top <= 140) current = cat.id;
    });
    if (!links.length) links = Array.prototype.slice.call(document.querySelectorAll(".cat-item"));
    links.forEach(function (l) {
      l.classList.toggle("active", l.getAttribute("data-cat") === current);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  document.getElementById("toTop").onclick = function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------------- 启动 ---------------- */
  function boot() {
    document.getElementById("statCats").textContent = BANK.length;
    document.getElementById("statQs").textContent = ALL_Q.length;
    document.getElementById("statQuiz").textContent = ALL_ASK.length;
    document.getElementById("footQs").textContent = ALL_Q.length;
    document.getElementById("footQuiz").textContent = ALL_ASK.length;
    document.getElementById("sideSub").textContent =
      BANK.length + " 个分类 · " + ALL_Q.length + " 道题 · " + ALL_ASK.length + " 道追问";

    renderSidebar();
    try {
      if (isNarrow() && localStorage.getItem("stqb_cat_collapsed") === "1") setCatCollapsed(true);
    } catch (e) {}
    /* 窄屏默认把顶栏工具收起来，只留一条细栏；用户手动展开过就记住 */
    try {
      if (isNarrow() && localStorage.getItem(BARKEY) !== "0") setBarCollapsed(true);
    } catch (e) {}
    renderBook();
    if (vstate.mode === "write") setMode("write");
    else {
      document.body.setAttribute("data-mode", "book");
      document.querySelectorAll("#modeSeg .seg-btn").forEach(function (b) {
        b.classList.toggle("on", b.getAttribute("data-mode") === "book");
      });
    }
    syncAnsSeg();
    onScroll();
  }
  boot();

  window.__handbook = {
    bank: BANK,
    detail: DETAIL,
    write: function () { return wstate; },
    clearAll: clearAllWrite,
    grade: function (key, text) { var q = findQByKey(key); return q ? gradeAnswer(text, q) : null; },
    points: function (key) {
      var q = findQByKey(key);
      return q ? refOf(q).pts.map(function (p) { return p.text; }) : null;
    }
  };
  /* 项目口述稿页复用这里的渲染与判题，避免两套逻辑各写一遍 */
  window.__hbUI = {
    esc: esc, fmt: fmt, inlineFmt: inlineFmt, toast: toast, confirmBox: confirmBox,
    ansSwitch: ansSwitch, ansArea: ansArea, setAnsView: setAnsView,
    wItemHTML: wItemHTML, gradeCardHTML: gradeCardHTML, gradeAnswer: gradeAnswer,
    gradeLevel: gradeLevel, rerender: rerenderWriteItem, autoGrow: autoGrowDone,
    saveW: saveW, wstate: function () { return wstate; },
    view: function () { return vstate; }, saveV: saveV, stopVoice: stopVoice
  };
})();
