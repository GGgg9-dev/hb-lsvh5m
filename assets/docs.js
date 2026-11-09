/* =========================================================
   项目口述稿 · 独立视图
   ---------------------------------------------------------
   题库按「文档@版本」隔离：wh@v1/u3
   换文档 → 出新版本题库 → 旧版本自动变成「历史版本」，
   题还在、记录还在，只是默认不显示。
   ========================================================= */
(function () {
  "use strict";

  var U = window.__hbUI;
  var LIB = window.DOC_LIB || [];
  var BANKS = window.DOC_BANK || {};
  var UKEY = "stqb_docui_v1";
  var host = document.getElementById("docView");
  if (!host || !U) return;

  var ui = (function () {
    try { return JSON.parse(localStorage.getItem(UKEY)) || {}; } catch (e) { return {}; }
  })();
  ui.tab = ui.tab === "prac" ? "prac" : "read";
  ui.ver = ui.ver || {};
  function saveUI() { try { localStorage.setItem(UKEY, JSON.stringify(ui)); } catch (e) {} }

  /* ---------------- 展开题库 ---------------- */
  var DOC_ALL = {};
  var DOCS = [];

  function build() {
    DOC_ALL = {};
    DOCS = LIB.map(function (doc) {
      var vers = (doc.versions || []).slice();
      var cur = doc.current || (vers.length ? vers[vers.length - 1].ver : "");
      var map = {}, order = [];
      vers.forEach(function (v) {
        var raw = BANKS[doc.id + "@" + v.ver];
        var pack = { ver: v.ver, info: v, chapters: [], all: [], missing: !raw || !raw.chapters };
        if (!pack.missing) {
          raw.chapters.forEach(function (ch, ci) {
            var items = [];
            (ch.items || []).forEach(function (it, ii) {
              if (!it || !it.q) return;
              var q = {
                key: doc.id + "@" + v.ver + "/" + (it.k || (ci + 1) + "-" + (ii + 1)),
                q: it.q,
                a: it.a || "",
                d: it.d || "",
                bad: it.bad || "",
                seq: ii + 1,
                kind: "orig",
                star: !!it.star,
                chap: ch.title || "",
                docId: doc.id,
                ver: v.ver
              };
              items.push(q);
              pack.all.push(q);
              DOC_ALL[q.key] = q;
            });
            if (items.length) {
              pack.chapters.push({ id: ch.id || "c" + ci, title: ch.title || "第 " + (ci + 1) + " 章", items: items });
            }
          });
        }
        map[v.ver] = pack;
        order.push(v.ver);
      });
      return { id: doc.id, title: doc.title, desc: doc.desc || "", cur: cur, vers: vers, order: order, map: map };
    });
    window.DOC_ALL = DOC_ALL;
    if (!DOCS.length) return;
    if (!ui.docId || !DOCS.filter(function (d) { return d.id === ui.docId; }).length) ui.docId = DOCS[0].id;
  }

  function docOf() {
    return DOCS.filter(function (d) { return d.id === ui.docId; })[0] || DOCS[0];
  }
  function verOf(doc) {
    var v = ui.ver[doc.id];
    if (!v || !doc.map[v]) v = doc.cur;
    ui.ver[doc.id] = v;
    return v;
  }
  function packOf() {
    var d = docOf();
    if (!d) return null;
    return d.map[verOf(d)] || null;
  }

  /* ---------------- 统计 ---------------- */
  function statsOf(pack) {
    var ws = U.wstate(), done = 0, sum = 0, n = 0;
    if (!pack) return { total: 0, done: 0, avg: 0, graded: 0 };
    pack.all.forEach(function (q) {
      var st = ws[q.key];
      if (st && st.done) done++;
      if (st && st.g && typeof st.g.s === "number") { sum += st.g.s; n++; }
    });
    return { total: pack.all.length, done: done, avg: n ? Math.round(sum / n) : 0, graded: n };
  }
  function allStats(doc) {
    var ws = U.wstate(), done = 0, total = 0;
    doc.order.forEach(function (v) {
      var p = doc.map[v];
      if (!p) return;
      total += p.all.length;
      p.all.forEach(function (q) { if (ws[q.key] && ws[q.key].done) done++; });
    });
    return { total: total, done: done };
  }

  /* ---------------- 渲染 ---------------- */
  var bodyEl = null;

  function renderSide() {
    var html = DOCS.map(function (d) {
      var on = d.id === ui.docId;
      var v = ui.ver[d.id] || d.cur;
      var s = statsOf(d.map[v] || d.map[d.cur]);
      var pct = s.total ? Math.round(s.done / s.total * 100) : 0;
      var nVer = d.vers.length > 1 ? '<span class="ver-badge old">' + d.vers.length + " 个版本</span>" : "";
      return (
        '<button class="doc-item' + (on ? " on" : "") + '" data-doc="' + d.id + '">' +
        '<span class="di-title">' + U.esc(d.title) + "</span>" +
        '<span class="di-meta">' + s.total + " 题 · 已答 " + s.done + nVer + "</span>" +
        '<span class="di-bar"><i style="width:' + pct + '%"></i></span>' +
        "</button>"
      );
    }).join("");
    if (!html) html = '<div class="doc-empty">还没有放入文档。</div>';

    var totalQ = DOCS.reduce(function (a, d) {
      var v = ui.ver[d.id] || d.cur;
      return a + statsOf(d.map[v] || d.map[d.cur]).total;
    }, 0);
    return (
      '<aside class="doc-side">' +
      '<div class="doc-side-head">' +
      '<button class="doc-back" id="docBack">' +
      '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>' +
      "返回题库</button>" +
      "<h2>项目口述稿</h2>" +
      '<p class="side-sub">' + DOCS.length + " 篇 · 共 " + totalQ + " 题</p>" +
      "</div>" +
      '<div class="doc-list">' + html + "</div>" +
      '<div class="side-foot"><div class="progress-card">' +
      '<div class="pc-top"><span>本篇完成度</span><span id="dpNum">—</span></div>' +
      '<div class="pc-bar"><i id="dpBar"></i></div>' +
      '<div class="pc-bottom"><span id="dpAvg">—</span>' +
      '<button class="link-btn" id="dpClear">清空本篇</button></div>' +
      "</div></div></aside>"
    );
  }

  function renderMain(doc, pack) {
    var isCur = pack && pack.ver === doc.cur;
    var opts = doc.vers.map(function (v) {
      var t = v.ver + " · " + (v.label || v.at || "");
      if (v.ver === doc.cur) t += "（最新）";
      else t += "（历史）";
      return '<option value="' + v.ver + '"' + (pack && v.ver === pack.ver ? " selected" : "") + ">" + U.esc(t) + "</option>";
    }).join("");

    var s = statsOf(pack);
    var pct = s.total ? Math.round(s.done / s.total * 100) : 0;

    return (
      '<main class="doc-main">' +
      '<div class="doc-head"><div>' +
      "<h2>" + U.esc(doc.title) + "</h2>" +
      '<p class="dh-sub">' + U.esc(doc.desc || "") + "</p>" +
      "</div>" +
      '<div class="doc-tools">' +
      '<div class="doc-seg" id="docSeg">' +
      '<button data-tab="read"' + (ui.tab === "read" ? ' class="on"' : "") + ">原文</button>" +
      '<button data-tab="prac"' + (ui.tab === "prac" ? ' class="on"' : "") + ">练习</button>" +
      "</div>" +
      '<span class="ver-wrap">版本 <select id="verSel">' + opts + "</select></span>" +
      '<button class="btn ghost" id="docExport">导出本篇</button>' +
      "</div></div>" +
      '<div class="doc-stat">' +
      "<span>本版 <b>" + s.total + "</b> 题</span>" +
      "<span>已答 <b>" + s.done + "</b></span>" +
      "<span>均分 <b>" + (s.avg || "—") + "</b></span>" +
      '<span class="ds-bar"><i style="width:' + pct + '%"></i></span>' +
      "<span>" + pct + "%</span>" +
      "</div>" +
      '<div id="docBody"></div>' +
      "</main>"
    );
  }

  function renderBody() {
    var doc = docOf(), pack = packOf();
    if (!bodyEl || !doc || !pack) return;

    /* 提示条：历史版本 / 题库缺失 */
    var notes = [];
    if (!pack.missing && pack.ver !== doc.cur) {
      var curPack = doc.map[doc.cur];
      notes.push(
        '<div class="doc-note"><b>这是历史版本（' + pack.ver + (pack.info.label ? " · " + pack.info.label : "") + "）。</b>" +
        "题目是按当时那份文档出的，仍可正常作答和判分，记录与最新版分开保存。" +
        (curPack && !curPack.missing ? '想练新题，把右上角版本切到 <b>' + doc.cur + "</b>。" : "") +
        "</div>"
      );
    }
    if (pack.missing) {
      notes.push('<div class="doc-note"><b>这一版还没有题库。</b>原文可以正常查看；需要出题时告诉我，我会按这一版内容重新生成，旧版本的题不会动。</div>');
    }

    if (ui.tab === "read") {
      bodyEl.innerHTML =
        notes.join("") +
        '<div class="doc-frame">' +
        '<div class="doc-frame-bar"><span class="dfb-tip"><i></i>原文 · ' + U.esc(pack.info.file.split("/").pop()) + "</span>" +
        '<a href="' + pack.info.file + '" target="_blank" rel="noopener" style="color:var(--purple)">新窗口打开 ↗</a></div>' +
        '<iframe src="' + pack.info.file + '" title="' + U.esc(doc.title) + '" loading="lazy"></iframe>' +
        "</div>";
      return;
    }

    if (!pack.all.length) {
      bodyEl.innerHTML = notes.join("") + '<div class="doc-empty">这一版还没有题目。</div>';
      return;
    }

    var seq = 0;
    var chapters = pack.chapters.map(function (ch, ci) {
      var inner = ch.items.map(function (q) {
        seq++;
        return U.wItemHTML(q, q.seq - 1, "orig");
      }).join("");
      return (
        '<section class="doc-chap">' +
        '<div class="doc-chap-head"><span class="ch-idx">' + String(ci + 1).padStart(2, "0") + "</span>" +
        "<h3>" + U.esc(ch.title) + "</h3>" +
        '<span class="ch-meta">' + ch.items.length + " 题</span></div>" +
        inner + "</section>"
      );
    }).join("");

    bodyEl.innerHTML =
      notes.join("") +
      '<div class="doc-tips">' +
      '<div class="doc-tip"><b>按原文答</b>题目全部出自左边这份稿子，答不上来就切回「原文」看对应小节。</div>' +
      '<div class="doc-tip"><b>答完判分</b>点「答题结束 · 判分」先出分数和缺口，再对照参考答案；语音输入同样可用。</div>' +
      '<div class="doc-tip"><b>换稿不丢题</b>你改了原文，新题会挂在下一个版本上；旧题留在「历史版本」里，随时能切回去接着答。</div>' +
      "</div>" +
      '<div class="doc-prac">' + chapters + "</div>";

    U.setAnsView(bodyEl, U.view().ans);
    requestAnimationFrame(U.autoGrow);
  }

  function refreshStats() {
    var doc = docOf(), pack = packOf();
    if (!doc) return;
    var s = statsOf(pack);
    var pct = s.total ? Math.round(s.done / s.total * 100) : 0;
    var num = document.getElementById("dpNum");
    var bar = document.getElementById("dpBar");
    var avg = document.getElementById("dpAvg");
    if (num) num.textContent = s.done + " / " + s.total;
    if (bar) bar.style.width = pct + "%";
    if (avg) avg.textContent = s.graded ? "均分 " + s.avg : "还没开始";
    var stat = host.querySelector(".doc-stat");
    if (stat) {
      var bs = stat.querySelectorAll("b");
      if (bs.length >= 3) {
        bs[0].textContent = s.total;
        bs[1].textContent = s.done;
        bs[2].textContent = s.graded ? s.avg : "—";
      }
      var sb = stat.querySelector(".ds-bar i");
      if (sb) sb.style.width = pct + "%";
      var last = stat.lastElementChild;
      if (last && last.tagName === "SPAN") last.textContent = pct + "%";
    }
    var item = host.querySelector('.doc-item[data-doc="' + doc.id + '"]');
    if (item) {
      var m = item.querySelector(".di-meta");
      var a = statsOf(pack);
      if (m) m.textContent = a.total + " 题 · 已答 " + a.done;
      var ib = item.querySelector(".di-bar i");
      if (ib) ib.style.width = (a.total ? Math.round(a.done / a.total * 100) : 0) + "%";
    }
  }

  function renderAll() {
    var doc = docOf();
    if (!doc) {
      host.innerHTML = '<div class="doc-main"><div class="doc-empty">还没有文档。把 HTML 放进 docs/ 目录，并在 docs/manifest.js 里登记即可。</div></div>';
      return;
    }
    var pack = packOf();
    host.innerHTML = renderSide() + renderMain(doc, pack);
    bodyEl = document.getElementById("docBody");
    renderBody();
    refreshStats();
    /* 手机上文档列表是横向滚动的，把当前选中项滚进可视区，免得看着像只有一篇 */
    var cur = host.querySelector(".doc-item.on");
    var list = host.querySelector(".doc-list");
    if (cur && list && list.scrollWidth > list.clientWidth + 4) {
      var cr = cur.getBoundingClientRect(), lr = list.getBoundingClientRect();
      if (cr.left < lr.left || cr.right > lr.right) {
        list.scrollLeft += cr.left - lr.left - 8;
      }
    }
  }

  /* ---------------- 导出 ---------------- */
  function pad(n) { return String(n).padStart(2, "0"); }
  function exportDoc() {
    var doc = docOf(), pack = packOf();
    if (!doc || !pack || !pack.all.length) { U.toast("这一版还没有题目"); return; }
    var ws = U.wstate();
    var now = new Date();
    var stamp = now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + "-" + pad(now.getHours()) + pad(now.getMinutes());
    var timeStr = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) + " " + pad(now.getHours()) + ":" + pad(now.getMinutes());

    var lines = [];
    var s = statsOf(pack);
    var answered = pack.all.filter(function (q) { return ws[q.key] && ws[q.key].done; });
    lines.push("# " + doc.title + " · 默写记录");
    lines.push("");
    lines.push("- 导出时间：" + timeStr);
    lines.push("- 依据文档：" + pack.info.file + "（" + pack.ver + "）");
    lines.push("- 已作答：" + answered.length + " / " + s.total + " 题" + (s.graded ? " · 本机自评均分 " + s.avg : ""));
    lines.push("");
    lines.push("> 请按这份口述稿逐题批改：先说结构（输入—活动—输出是否完整），再说内容与原文的出入，最后给出更优的口述版本。每题附的本机自评是关键词覆盖粗算，仅供参考。");
    lines.push("");

    pack.chapters.forEach(function (ch) {
      var block = [];
      ch.items.forEach(function (q, i) {
        var st = ws[q.key] || {};
        if (!st.done && !st.t) return;
        block.push("### 第 " + (i + 1) + " 题｜" + q.q);
        block.push("");
        block.push("**我的回答**：");
        block.push(String(st.t || "").trim() || "*(未作答)*");
        block.push("");
        if (st.g) {
          block.push("**本机自评**：" + st.g.s + " 分 · 要点 " + st.g.hn + "/" + st.g.total + " · " + U.gradeLevel(st.g.s).t);
          if (st.g.m && st.g.m.length) block.push("**主要缺口**：" + st.g.m.slice(0, 5).join("、"));
          block.push("");
        }
        if (q.a) { block.push("**参考答案**：" + String(q.a).replace(/\n/g, " ")); block.push(""); }
      });
      if (!block.length) return;
      lines.push("---");
      lines.push("");
      lines.push("## " + ch.title);
      lines.push("");
      lines.push.apply(lines, block);
    });

    if (lines.length < 8) { U.toast("还没有作答内容，先写两题再导出"); return; }
    var blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "项目口述-" + doc.title + "-" + pack.ver + "-" + stamp + ".md";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
    U.toast("已导出 " + answered.length + " 题的记录");
  }

  /* ---------------- 清空 ---------------- */
  function clearDoc() {
    var doc = docOf();
    if (!doc) return;
    var ws = U.wstate(), keys = [];
    doc.order.forEach(function (v) {
      var p = doc.map[v];
      if (!p) return;
      p.all.forEach(function (q) { if (ws[q.key]) keys.push(q.key); });
    });
    if (!keys.length) { U.toast("本篇还没有记录"); return; }
    U.confirmBox(
      "清空《" + doc.title + "》的记录",
      "将清除这篇文档全部 " + keys.length + " 条作答（含历史版本），题目本身不受影响。",
      function () {
        keys.forEach(function (k) { delete ws[k]; });
        U.saveW();
        doc.order.forEach(function (v) {
          var p = doc.map[v];
          if (p) p.all.forEach(function (q) { U.rerender(q.key); });
        });
        refreshStats();
        U.toast("已清空 " + keys.length + " 条记录");
      }
    );
  }

  /* ---------------- 事件 ---------------- */
  host.addEventListener("click", function (e) {
    var t = e.target;
    var back = t.closest("#docBack");
    if (back) { close(); return; }

    var item = t.closest("[data-doc]");
    if (item) {
      ui.docId = item.getAttribute("data-doc");
      saveUI();
      renderAll();
      return;
    }
    var seg = t.closest("#docSeg button");
    if (seg) {
      ui.tab = seg.getAttribute("data-tab");
      saveUI();
      host.querySelectorAll("#docSeg button").forEach(function (b) {
        b.classList.toggle("on", b.getAttribute("data-tab") === ui.tab);
      });
      renderBody();
      return;
    }
    if (t.closest("#docExport")) { exportDoc(); return; }
    if (t.closest("#dpClear")) { clearDoc(); return; }
  });

  host.addEventListener("change", function (e) {
    var sel = e.target.closest("#verSel");
    if (!sel) return;
    var doc = docOf();
    ui.ver[doc.id] = sel.value;
    saveUI();
    renderAll();
  });

  /* 练习区提交后刷新侧栏进度 */
  document.addEventListener("click", function (e) {
    if (document.body.getAttribute("data-mode") !== "docs") return;
    if (e.target.closest && e.target.closest(".w-done, .w-clear")) {
      setTimeout(refreshStats, 30);
    }
  });

  function open() {
    build();
    document.body.setAttribute("data-mode", "docs");
    host.hidden = false;
    window.scrollTo(0, 0);
    renderAll();
  }
  function close() {
    if (U.stopVoice) U.stopVoice();
    host.hidden = true;
    var mode = U.view().mode || "book";
    document.body.setAttribute("data-mode", mode);
    document.querySelectorAll("#modeSeg .seg-btn").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-mode") === mode);
    });
    window.scrollTo(0, 0);
  }

  var btn = document.getElementById("docsBtn");
  if (btn) btn.addEventListener("click", function () {
    if (document.body.getAttribute("data-mode") === "docs") close();
    else open();
  });

  build();
  /* 首次进入不渲染，等用户点按钮，避免拖慢主手册首屏 */
})();
