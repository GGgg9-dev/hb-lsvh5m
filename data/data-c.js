window.QUESTION_BANK = window.QUESTION_BANK || [];

/* ============ 七、JMeter 与性能测试 ============ */
window.QUESTION_BANK.push({
  id: "c7",
  title: "JMeter 与性能测试",
  desc: "压测流程、指标、瓶颈定位",
  items: [
    {
      q: "用 JMeter 做性能测试 / 压测的流程是什么？",
      star: true,
      a: "① 需求分析：明确业务指标（TPS、RT、成功率）与场景 ② 压测方案：场景模型、并发比例、数据量、环境 ③ 脚本开发：线程组、HTTP 取样器、参数化、关联、断言 ④ 基准测试（单用户跑通）⑤ 阶梯加压找拐点 ⑥ 瓶颈定位与调优 ⑦ 稳定性测试 ⑧ 输出报告与结论。"
    },
    {
      q: "用 JMeter 做接口测试怎么做？举个例子详细说明。",
      a: "以登录接口为例：\n1）测试计划 → 添加线程组（线程数 1，循环 1）\n2）添加 HTTP 请求：协议 https、域名、路径 `/api/login`、方法 POST、Body 填 JSON\n3）添加 HTTP 信息头管理器：`Content-Type: application/json`\n4）添加响应断言：响应代码 200 + 响应文本包含 `\"code\":0\"`\n5）添加 JSON 提取器：`$.data.token` → 变量 token\n6）添加查看结果树 + 聚合报告，运行并检查\n7）用 CSV Data Set Config 参数化账号，改线程数与循环做批量或并发。"
    },
    {
      q: "场景：500 并发，包含登录接口和新增接口，新增接口达不到指标就报错，脚本怎么编？登录和新增要放两个线程组吗？",
      a: "推荐拆两个线程组：\n· **setUp 线程组**：1 个线程登录一次，用 JSON 提取器取 token，再 `__setProperty(\"token\", ${token}, false)` 写成全局属性\n· **业务线程组**：500 线程、Ramp-up 10–30s、循环 N 次，新增接口用 `${__P(token)}` 取 token，加同步定时器模拟瞬时并发\n· 断言：新增接口加响应断言 + **Duration Assertion**（如 ≤500ms），超时即标记失败\n· 监听：聚合报告 + 后端监听器 / Grafana，最后统计错误率与 P95\n如果要求「每个用户先登录再操作」，就在同一线程组里用 **Once Only Controller** 包住登录请求。"
    },
    {
      q: "JMeter 里的控制器有哪些？",
      a: "简单控制器、循环控制器、**Once Only Controller**、交替控制器、随机控制器、随机顺序控制器、**吞吐量控制器**、If 控制器、Switch 控制器、**事务控制器**、While 控制器、ForEach 控制器、Include Controller、Module Controller、Runtime Controller、录制控制器。\n最常用：事务控制器（统计整体耗时）、循环控制器、If 控制器、吞吐量控制器（按比例分流）。"
    },
    {
      q: "复杂流程控制、多个控制器叠加使用，举个例子说明。",
      a: "例：登录 → 浏览 → 下单 → 支付，需要「登录失败就跳过后续」并统计整体耗时：\n· 事务控制器包住 4 个请求（勾选 Generate parent sample）\n· If 控制器判断 `${token}` 是否为空，为空才走登录\n· 循环控制器 + CSV 实现多用户多轮\n· While 控制器轮询订单状态直到「已支付」或超时\n· 吞吐量控制器控制浏览 / 下单比例 70% / 30%。"
    },
    {
      q: "要模拟用户随机行为（50% 看订单、30% 下单、20% 看报表），用哪个控制器？",
      a: "用 **吞吐量控制器（Throughput Controller）**，模式选 Percent Executions，分别设 50 / 30 / 20，最精确。\n如果用 **随机控制器（Random Controller）**，每条分支概率均等（约 1/3），无法按比例控制，只能近似随机。"
    },
    {
      q: "JMeter 常用定时器有哪些？",
      a: "固定定时器（Constant Timer，模拟思考时间）、高斯随机定时器、均匀随机定时器、**常数吞吐量定时器**（按目标 TPS 控制节奏）、**同步定时器 Synchronizing Timer**（集合点，模拟瞬时并发）、Poisson 随机定时器、BeanShell 定时器。"
    },
    {
      q: "压测要传数据怎么办？数据量非常大怎么操作？",
      a: "用 **CSV Data Set Config** 读取参数文件（每行一组，Recycle on EOF / Stop thread on EOF 按需设置），比函数生成更真实可控。\n大数据量（百万级）：文件分片 + 多机分布式压测（每个 slave 读不同分片），或用 JDBC Request 从数据库取数，避免一次性加载占满内存；不要用 `__Random` 造唯一手机号，容易重复。"
    },
    {
      q: "JMeter 里登录获取 token 怎么做？",
      a: "登录请求后加 **JSON 提取器**（`$.data.token`）或 **正则提取器**，存为变量 token；后续请求在 HTTP 信息头管理器里用 `Bearer ${token}`。\n跨线程组时用 `__setProperty` 写全局属性，再用 `${__P(token)}` 读取（属性是全局的，变量不是）。"
    },
    {
      q: "多接口 / 串联接口怎么做批量压测？",
      a: "把多个 HTTP 取样器按业务顺序放在同一线程组里，用提取器传递动态参数，外层套事务控制器统计端到端耗时；需要并行或不同并发比例时拆多个线程组，用吞吐量控制器分配比例。"
    },
    {
      q: "聚合报告看哪些指标？平均响应时间、P90、P95 拿哪个和需求对比？",
      star: true,
      a: "Average、Median、**90% Line、95% Line、99% Line**、Min、Max、Error%、Throughput。\n和需求对比看 **P95（或 P99）**，因为平均值会被大量快请求拉低，掩盖长尾用户的真实体验；SLA 通常也按 P95 定义。"
    },
    {
      q: "为什么重点看 P95 而不是平均响应时间？",
      a: "平均值是算术平均，1% 的慢请求被 99% 的快请求稀释。例如 99 个请求 100ms、1 个 10s，平均只有 200ms，但真实有 1% 用户等了 10 秒。P95 表示 95% 的请求都快于该值，更能代表尾部体验，也是压测结论与 SLA 的通用口径。"
    },
    {
      q: "TPS、QPS、RPS 有什么区别？",
      star: true,
      a: "**TPS**（Transactions Per Second）：每秒完成的事务数，一个事务可以包含多个请求（如「下单」= 查库存 + 建单 + 扣款）。\n**QPS**（Queries Per Second）：每秒查询数，偏数据库 / 接口维度。\n**RPS**（Requests Per Second）：每秒请求数，偏 HTTP 维度。\n大多数 Web 场景 QPS ≈ RPS；TPS 更贴近业务，测试报告里要说明口径，避免和需求方对不上。"
    },
    {
      q: "TPS 上不去怎么排查？",
      star: true,
      a: "按链路排查：\n① **压测端**：线程数不足、带宽打满、端口耗尽（TIME_WAIT）、JMeter 自身 GC\n② **接入层**：Nginx 连接数、限流、超时设置\n③ **应用**：CPU 打满、Full GC、线程池 / 连接池耗尽、锁竞争、同步阻塞、日志同步写\n④ **数据库**：慢 SQL、缺索引、行锁等待、连接数不够\n⑤ **中间件**：Redis 大 key / 热 key、MQ 积压\n⑥ **网络**：带宽、跨机房延迟\n方法：阶梯加压看 TPS 是否随并发线性增长，配合 top / vmstat / iostat / jstack / arthas / 慢查询日志 / APM 定位具体环节。"
    },
    {
      q: "响应时间、并发数、吞吐量之间是什么关系？",
      a: "利特尔法则：**并发数 = 吞吐量 × 响应时间**。\n小并发下，加压 → TPS 线性上升、RT 基本稳定；到拐点后，加压 → RT 快速上升、TPS 不再增长甚至下降（资源饱和、排队）。所以「加线程就能提 TPS」在瓶颈之后是无效的。"
    },
    {
      q: "性能测试怎么判断到了拐点？",
      a: "阶梯加压（如 50 → 100 → 200 → 400 → 800 并发），每个阶梯稳定运行 5–10 分钟，观察：TPS 增幅明显放缓或下降、RT 非线性上升、错误率开始抬头、CPU / IO 接近饱和。把 TPS-并发、RT-并发曲线画出来，曲线的转折点就是拐点 / 最大处理能力。"
    },
    {
      q: "性能测试的关注点有哪些？指标怎么确定？",
      star: true,
      a: "业务指标：TPS、RT（P95/P99）、成功率、并发数；资源指标：CPU、内存、磁盘 IO、网络带宽；中间件：连接池、GC 频率、慢 SQL、缓存命中率；稳定性：长时间错误率与内存增长。\n指标来源：业务预估（日活 × 峰值系数）、历史监控峰值 × 1.5–2 倍安全系数、产品 SLA、行业经验值。"
    },
    {
      q: "性能测试用例怎么设计？参数是怎么来的？",
      a: "用例设计：单接口基准（摸清单接口能力）→ 混合业务场景（按真实比例）→ 峰值场景（大促 / 秒杀）→ 稳定性场景（8–24h）→ 异常场景（依赖服务宕机、限流）。\n参数来源：生产日志统计的真实请求比例与 RT 分布、监控历史峰值、运营活动预估、压测数据量按生产量级比例缩放。"
    },
    {
      q: "负载测试、压力测试、稳定性测试有什么区别？",
      star: true,
      a: "**负载测试**：逐步增加负载，找系统在满足指标前提下能承受的最大压力。\n**压力测试**：超过正常负载直到系统崩溃，看极限在哪、崩溃后能否恢复。\n**稳定性测试**：长时间（8–24h 或 7 天）在正常压力下运行，看内存泄漏、TPS 衰减、错误率漂移。"
    },
    {
      q: "稳定性测试怎么做？基于什么维度决定跑多长时间？",
      a: "用混合业务场景按 70%–80% 的负载持续跑 8–24 小时（重要系统 7 天），全程监控 TPS 曲线、RT、错误率、内存与 GC、连接池、磁盘。\n时长依据：业务峰值周期（是否跨日结 / 批量任务）、发布节奏、内存泄漏的暴露时间、SLA 要求。"
    },
    {
      q: "压测时出现瓶颈 / 性能不达标，怎么定位？",
      star: true,
      a: "自上而下逐层排除：压测机（CPU / 带宽 / 端口）→ 网络 → 网关 / 负载均衡 → 应用（CPU、GC、线程池、锁、慢方法）→ 缓存 → 数据库（慢 SQL、锁等待、连接数）→ 磁盘 IO。\n常用手段：top / vmstat / iostat / pidstat、jstack 看线程阻塞、arthas trace 看方法耗时、慢查询日志、APM 链路追踪、火焰图。定位到具体环节后再谈优化（加缓存、改 SQL、加索引、异步化、扩容）。"
    },
    {
      q: "你最大并发测到多少？有没有遇到过内存溢出或响应延迟？",
      a: "按实际答（如单场景 2000 并发、集群 8000）。\n遇到过的典型问题：压测中应用 OOM（大对象 + 堆内存不足），表现为 RT 从 200ms 飙升到数秒、错误率上升；处理是 dump 堆分析、调整堆与 GC 参数、优化一次性加载大列表的代码、加分页与缓存，复测后 RT 恢复到 300ms 以内。"
    },
    {
      q: "没有接口怎么做性能测试？",
      a: "① 用 JMeter 代理 / 浏览器录制把页面操作转成 HTTP 脚本 ② 抓包分析实际请求后手工构造 ③ 对后端服务做协议级压测（gRPC / Socket）④ 无接口只能压页面时，关注前端渲染与并发用户数，结论要说明局限。\n最差的情况（纯客户端软件）用 UI 自动化脚本 + 多进程模拟，成本高、精度低。"
    },
    {
      q: "测试环境和生产环境的性能差异怎么考虑？",
      a: "差异来自：机器配置与数量、数据量级、网络拓扑、共享资源、中间件参数。\n做法：按生产比例缩容但保持架构一致；结论明确标注「测试环境，配置为生产的 1/4」；重要系统做生产全链路压测（低峰期、影子库 / 影子表、流量染色、脱敏）。"
    },
    {
      q: "压测完之后怎么和数据库核对数据准确性？",
      a: "统计口径对齐：总请求数、成功数 vs 订单表记录数、库存扣减总量、支付流水总额。\nSQL 核对：订单数 = 成功事务数、库存减少量 = 销量、金额汇总 = 支付金额、无负数库存、无重复订单号。\n再查幂等（唯一索引）、状态终态分布、上下游对账，发现超卖 / 少卖 / 重复扣款即视为缺陷。"
    },
    {
      q: "性能测试结论怎么写？",
      a: "包含：测试环境与架构、场景与模型、目标指标 vs 实测结果（TPS / P95 / 错误率 / 资源占用）、瓶颈分析与调优前后对比、遗留风险、结论建议（是否满足上线、需要扩容到多少台、限流阈值建议）。用表格 + 曲线图呈现，避免只给一句「性能良好」。"
    },
    {
      q: "一个接口一般压多长时间？是在测试环境还是生产环境压？",
      a: "基准测试 5–10 分钟；峰值 / 拐点测试每个阶梯 5–10 分钟；稳定性 8–24 小时。\n一般在测试 / 预发环境压；核心交易与大型活动在生产低峰期做全链路压测，需走审批、做数据隔离与流量标识。"
    },
    {
      q: "做压测时主要观测哪些业务上的不准确（比如并发领料）？",
      a: "超卖 / 少卖、库存为负、重复领料 / 重复下单、优惠券重复使用、金额计算错误、状态流转错乱、数据倾斜（某些记录被反复更新）、消息重复消费。\n方法：压测后跑对账 SQL，比对请求量与业务单据量、汇总金额与流水，抽样核对明细。"
    }
  ],
  quiz: [
    {
      q: "与需求方对比性能指标时，最合适使用的是？",
      o: ["平均响应时间", "P95 或 P99 响应时间", "最小响应时间", "中位数响应时间"],
      k: 1,
      e: "平均值会被大量快请求稀释，掩盖长尾体验；P95/P99 才代表尾部用户真实感受，也是 SLA 的通用口径。"
    },
    {
      q: "「并发数 = 吞吐量 × 响应时间」描述的是？",
      o: ["阿姆达尔定律", "利特尔法则（Little's Law）", "摩尔定律", "二八法则"],
      k: 1,
      e: "利特尔法则揭示三者关系：在瓶颈之后继续加并发，只会推高 RT，不会提升吞吐。"
    },
    {
      q: "要精确模拟「50% 看订单、30% 下单、20% 看报表」的用户行为，应使用？",
      o: ["随机控制器", "吞吐量控制器（Percent Executions）", "交替控制器", "循环控制器"],
      k: 1,
      e: "吞吐量控制器可按百分比分配执行次数；随机控制器只能等概率随机，无法指定比例。"
    },
    {
      q: "JMeter 跨线程组传递 token，正确的做法是？",
      o: ["用 ${token} 直接引用", "用 __setProperty 写全局属性，再用 __P 读取", "用 CSV 文件保存", "用 HTTP Cookie 管理器"],
      k: 1,
      e: "线程组的变量作用域互不相通，必须用全局属性（property）传递。"
    },
    {
      q: "稳定性测试的主要目的是？",
      o: ["找系统最大处理能力", "验证长时间运行下是否内存泄漏、TPS 衰减、错误率漂移", "测试系统崩溃后的恢复", "验证单接口响应时间"],
      k: 1,
      e: "负载测试找上限，压力测试找崩溃点，稳定性测试看长时间运行的持续可靠性。"
    },
    {
      q: "压测中 TPS 不再随并发增长、RT 快速上升，说明？",
      o: ["压测脚本写错了", "系统已到性能拐点/瓶颈", "网络带宽充足", "数据库索引过多"],
      k: 1,
      e: "TPS 平台化 + RT 非线性上升是典型的拐点特征，此时继续加压只会让请求排队。"
    },
    {
      q: "要模拟 500 个用户在同一瞬间发起请求，应添加？",
      o: ["固定定时器", "同步定时器（Synchronizing Timer）", "常数吞吐量定时器", "高斯随机定时器"],
      k: 1,
      e: "同步定时器即集合点，让线程攒够指定数量后同时释放，模拟瞬时并发。"
    },
    {
      q: "压测后发现库存为负数，属于？",
      o: ["性能问题", "业务数据一致性问题（超卖），必须修复", "环境问题", "正常现象"],
      k: 1,
      e: "并发下的超卖是严重缺陷，说明库存扣减缺乏原子性或锁控制，必须修复并复测。"
    },
    {
      q: "JMeter 中统计「登录 + 下单 + 支付」的端到端耗时，应使用？",
      o: ["事务控制器", "循环控制器", "If 控制器", "模块控制器"],
      k: 0,
      e: "事务控制器可把多个取样器合并为一个事务统计总耗时，勾选 Generate parent sample 后报告中可见。"
    },
    {
      q: "应用 CPU 打满、TPS 上不去，最直接的下一步是？",
      o: ["继续加线程", "用 jstack / arthas / 火焰图分析热点方法与锁竞争", "重启服务", "增加数据库连接数"],
      k: 1,
      e: "CPU 饱和时加线程只会加剧上下文切换；应先定位热点代码（死循环、频繁 GC、锁竞争），再优化或扩容。"
    }
  ]
});

/* ============ 八、Linux ============ */
window.QUESTION_BANK.push({
  id: "c8",
  title: "Linux",
  desc: "日志、性能、权限、部署、脚本",
  items: [
    {
      q: "常用的 Linux 命令有哪些？",
      star: true,
      a: "```text\n文件：ls cd pwd cp mv rm mkdir touch find ln\n查看：cat less head tail grep awk sed wc\n系统：top ps free df du uptime vmstat iostat\n网络：ip ifconfig ss netstat ping curl telnet\n权限：chmod chown chgrp\n压缩：tar zip unzip\n传输：scp rsync\n服务：systemctl journalctl crontab\n进程：kill killall pkill lsof\n编辑：vi vim\n```"
    },
    {
      q: "怎么查看日志？怎么抓日志、过滤 error？",
      star: true,
      a: "```bash\ntail -f app.log                       # 实时跟踪\ntail -n 200 app.log                   # 看最后 200 行\ngrep -i \"error\" app.log               # 忽略大小写过滤\ngrep -in -C 3 \"Exception\" app.log     # 带行号、上下文 3 行\ntail -f app.log | grep -iE \"error|exception|fail\"\ngrep -c \"ERROR\" app.log               # 统计条数\n```\n大日志用 `less +F` 或先 `grep` 缩小范围再看。"
    },
    {
      q: "怎么查 a.log 里昨天 10 点到 11 点的 500 错误？",
      a: "```bash\n# 日志时间格式为 2024-05-01 10:23:45 时\nawk '/2024-05-01 10:00/,/2024-05-01 11:00/' a.log | grep ' 500 '\n\n# 或先按小时过滤\nsed -n '/2024-05-01 10:/,/2024-05-01 11:/p' a.log | grep -E ' 500 |status=500'\n\n# 统计数量\ngrep '2024-05-01 10:' a.log | grep -c ' 500 '\n```\n要点：先按时间范围截取，再按状态码过滤，避免全文件扫描。"
    },
    {
      q: "怎么查日志里的最后 30 行 / 文件末尾 100 行？",
      a: "```bash\ntail -n 30 a.log\ntail -n 100 a.log\ntail -100 a.log      # 简写\ntail -f a.log        # 实时追加\n```"
    },
    {
      q: "grep、awk、sed 分别用在什么场景？sed 除了替换还有什么用法？",
      a: "**grep**：按关键字 / 正则过滤行（找错误、找订单号）。\n**awk**：按列处理与统计（`awk '{print $1,$NF}'`、求和、按字段去重计数）。\n**sed**：流式编辑，替换、删除、插入、按行范围打印。\n```bash\nsed 's/old/new/g' a.log          # 全局替换\nsed -i 's/8080/9090/g' app.conf   # 直接改文件\nsed -n '10,20p' a.log            # 打印 10-20 行\nsed '/^$/d' a.log                # 删除空行\nsed '3i\\hello' a.log             # 第 3 行前插入\nsed '/debug/d' a.log             # 删除含 debug 的行\n```"
    },
    {
      q: "怎么查看磁盘空间、内存、CPU 占用？",
      a: "```bash\ndf -h                 # 磁盘各分区使用率\ndu -sh /* 2>/dev/null | sort -rh | head   # 各目录占用排行\ndu -sh *              # 当前目录下各项大小\nfree -h               # 内存（关注 available）\ntop                   # CPU、内存、负载\nuptime                # 1/5/15 分钟平均负载\nvmstat 1              # CPU、内存、IO、上下文切换\nmpstat -P ALL 1       # 每个核的 CPU 使用\n```"
    },
    {
      q: "怎么查看占用内存最多的进程？怎么看进程？",
      a: "```bash\nps aux --sort=-%mem | head -10        # 内存 TOP10\nps aux --sort=-%cpu | head -10        # CPU TOP10\nps -ef | grep java                    # 按名称查进程\ntop -o %MEM                           # 交互式按内存排序\npidof nginx                           # 取 pid\n```"
    },
    {
      q: "怎么查网络端口？怎么查防火墙是否关闭？",
      a: "```bash\nss -lntp                     # 监听端口（推荐）\nss -lntp | grep 8080\nnetstat -anp | grep 8080\nlsof -i:8080                 # 谁占用了 8080\nsystemctl status firewalld   # 防火墙状态\niptables -L -n               # 规则列表\nufw status                   # Ubuntu\n```"
    },
    {
      q: "修改文件权限用什么命令？可读可写、可读可写可执行分别怎么给？",
      a: "```bash\nchmod 666 file      # rw-rw-rw-  可读可写\nchmod 777 file      # rwxrwxrwx  可读可写可执行\nchmod u+x run.sh    # 给属主加执行权限\nchmod -R 755 dir    # 递归\nownership：chown -R app:app dir\n```"
    },
    {
      q: "权限的读写执行用数字怎么表示？给文件夹加权限怎么写？",
      a: "r=4、w=2、x=1，三组分别对应属主 / 属组 / 其他人。\n例：755 = rwxr-xr-x（属主全权限，其他读+执行），644 = rw-r--r--。\n文件夹：`chmod -R 755 /data/www`，注意目录必须有 x 才能进入。"
    },
    {
      q: "文件查找用什么命令？修改文件名用什么命令？",
      a: "```bash\nfind /var/log -name \"*.log\" -mtime -1     # 按名称+时间\nfind . -type f -size +100M                # 大于 100M 的文件\nwhich java; whereis nginx                 # 可执行文件位置\nmv old.txt new.txt                        # 重命名\nrename 's/old/new/' *.log                 # 批量重命名\n```"
    },
    {
      q: "移动文件、复制文件、两台服务器之间复制文件分别用什么命令？",
      a: "```bash\nmv /a/b.log /data/logs/                     # 移动/重命名\ncp -r /data/app /backup/                    # 递归复制\nscp -r /data/app user@192.168.1.10:/opt/    # 跨服务器复制\nrsync -avz --progress /data/ user@host:/opt/data/   # 增量同步\n```"
    },
    {
      q: "打包压缩文件用什么命令？解压呢？",
      a: "```bash\ntar -czvf logs.tar.gz /var/log/app          # 打包+gzip 压缩\ntar -tzvf logs.tar.gz                       # 查看内容\ntar -xzvf logs.tar.gz -C /tmp               # 解压到指定目录\nzip -r app.zip app/\nunzip app.zip -d /opt/\n```\n记忆：c 创建、x 解压、t 查看、z gzip、v 过程、f 文件名。"
    },
    {
      q: "软链接怎么建？",
      a: "```bash\nln -s /data/app/current /opt/app      # 建软链接（类似快捷方式）\nls -l /opt/app                        # 显示 -> 指向\nreadlink -f /opt/app                  # 查看真实路径\n```\n注意用绝对路径，否则移动后容易失效；硬链接用 `ln`（不能跨分区、不能链目录）。"
    },
    {
      q: "怎么确认一个文件是否存在？",
      a: "```bash\nls -l /path/file\n[ -f /path/file ] && echo exists\n[ -d /path/dir ] && echo dir exists\ntest -e /path/file && echo yes\n```\n脚本里用 `[ -f ]` 最规范，配合 `$?` 判断结果。"
    },
    {
      q: "怎么查 IP、改 IP？",
      a: "```bash\nip addr            # 查看（推荐）\nifconfig           # 老命令\nip route           # 网关\n```\n改 IP（CentOS 7）：编辑 `/etc/sysconfig/network-scripts/ifcfg-eth0`，设置 `BOOTPROTO=static`、`IPADDR`、`NETMASK`、`GATEWAY`、`DNS1`，然后 `systemctl restart network`。\nUbuntu 用 netplan（`/etc/netplan/*.yaml` + `netplan apply`）或 `nmcli`。"
    },
    {
      q: "Shell 脚本怎么用？你写过什么脚本？",
      a: "```bash\n#!/bin/bash\nLOG=/var/log/app\ndate=$(date +%F)\nfor f in $LOG/*.log; do\n  gzip \"$f\"\ndone\necho \"$date 清理完成\" >> /tmp/clean.log\n```\n`chmod +x clean.sh` 后执行，或加 crontab 定时。\n写过的脚本：日志清理与压缩、服务健康检查与自动重启、批量打包部署、多机批量执行命令、测试数据生成。"
    },
    {
      q: "Shell 里 #、$?、$#、$*、$2 分别代表什么？",
      a: "`#` 注释；`$?` 上一条命令的退出码（0 成功）；`$#` 参数个数；`$*` 所有参数（作为一个整体）；`$@` 所有参数（逐个）；`$2` 第二个参数；`$0` 脚本名；`$$` 当前进程 PID。"
    },
    {
      q: "自动化里怎么登录 Linux 服务器执行命令？（Python 连 Linux）",
      a: "```python\nimport paramiko\nssh = paramiko.SSHClient()\nssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())\nssh.connect(hostname=\"10.0.0.1\", username=\"root\", password=\"***\", timeout=10)\nstdin, stdout, stderr = ssh.exec_command(\"tail -n 100 /var/log/app.log | grep -i error\")\nprint(stdout.read().decode())\nssh.close()\n```\n也可用 fabric、subprocess 调 ssh、或用 Ansible 批量执行。"
    },
    {
      q: "怎么查看服务占用了哪些端口？怎么部署服务？",
      a: "```bash\nss -lntp | grep java        # 该进程监听的端口\nlsof -i -P -n | grep java\nnetstat -anp | grep 8080\n```\n部署：上传 jar / war → 备份旧版本 → 停服务（`systemctl stop app`）→ 替换包 → 启动（`systemctl start app` 或 `nohup java -jar app.jar > app.log 2>&1 &`）→ 看日志确认启动成功 → 检查端口与健康检查接口。"
    },
    {
      q: "Linux 怎么排查系统异常？",
      a: "```bash\nuptime                 # 负载是否过高\ntop                    # CPU / 内存占用\nfree -h                # 内存与 swap\ndf -h; du -sh /*       # 磁盘是否写满\niostat -x 1            # 磁盘 IO\nvmstat 1               # 上下文切换、阻塞进程\nss -s                  # 连接数\ndmesg | grep -i oom    # 是否被 OOM kill\njournalctl -xe --no-pager | tail -50\n```\n顺序：负载 → CPU / 内存 → 磁盘 → 网络 → 应用日志。"
    },
    {
      q: "CentOS 装包用什么命令？",
      a: "```bash\nyum install -y nginx\nrpm -ivh package.rpm        # 装本地 rpm\nyum remove nginx            # 卸载\nyum update                  # 更新\nyum list installed | grep nginx\nyum provides */netstat      # 查哪个包提供该命令\nrpm -qa | grep nginx\n```"
    },
    {
      q: "除了 CentOS，还了解哪些 Linux 系统？",
      a: "Debian 系：Ubuntu、Debian（包管理 apt / dpkg）；RedHat 系：RHEL、CentOS、Fedora、Rocky / AlmaLinux（yum / dnf）；轻量：Alpine（Docker 基础镜像常用）；国产：麒麟、统信 UOS、openEuler。\n服务器上主要差异在包管理、服务管理（systemd 一致）、配置路径。"
    }
  ],
  quiz: [
    {
      q: "实时跟踪应用日志的新增内容，正确的命令是？",
      o: ["cat app.log", "tail -f app.log", "head -n 100 app.log", "less app.log"],
      k: 1,
      e: "tail -f 持续输出新增行；配合 grep 可实现实时错误监控：tail -f app.log | grep -i error。"
    },
    {
      q: "统计日志中 ERROR 出现的次数，应使用？",
      o: ["grep ERROR app.log | wc -l", "tail -n 10 app.log", "ps -ef | grep ERROR", "df -h"],
      k: 0,
      e: "grep 过滤后 wc -l 计数，也可用 grep -c ERROR app.log 一步完成。"
    },
    {
      q: "权限数字 755 表示？",
      o: ["rwxr-xr-x", "rw-r--r--", "rwxrwxrwx", "r-xr-xr-x"],
      k: 0,
      e: "7=rwx（属主）、5=r-x（属组）、5=r-x（其他人）。目录需要 x 权限才能进入。"
    },
    {
      q: "查看哪个进程占用了 8080 端口，最直接的命令是？",
      o: ["ps aux | grep 8080", "lsof -i:8080 或 ss -lntp | grep 8080", "df -h | grep 8080", "free -h"],
      k: 1,
      e: "lsof -i:端口 或 ss/netstat 查看监听端口与对应进程，是最准确的方式。"
    },
    {
      q: "磁盘空间告警时，定位哪个目录占用最大，应使用？",
      o: ["du -sh /* | sort -rh | head", "df -h", "free -h", "top"],
      k: 0,
      e: "df 看分区总使用率，du 逐目录统计并排序才能定位到具体大目录。"
    },
    {
      q: "Shell 中 $? 表示？",
      o: ["脚本参数个数", "上一条命令的退出状态码", "当前进程 PID", "所有参数"],
      k: 1,
      e: "$? 返回上一条命令退出码，0 表示成功，非 0 表示失败；$# 是参数个数，$$ 是 PID。"
    },
    {
      q: "按行范围打印日志第 10 到 20 行，正确写法是？",
      o: ["sed -n '10,20p' a.log", "sed '10,20d' a.log", "grep -n 10,20 a.log", "awk '10-20' a.log"],
      k: 0,
      e: "-n 抑制默认输出，p 打印指定行范围；sed '10,20d' 是删除这些行。"
    },
    {
      q: "跨服务器复制目录并保持增量同步，最合适的是？",
      o: ["cp -r", "mv", "rsync -avz", "ln -s"],
      k: 2,
      e: "rsync 支持增量传输、断点续传与权限保持，比 scp 更适合大目录同步。"
    },
    {
      q: "系统变慢，发现某进程内存占用异常，最先应查？",
      o: ["ps aux --sort=-%mem | head 与 dmesg | grep -i oom", "df -h", "crontab -l", "history"],
      k: 0,
      e: "先定位内存 TOP 进程，再看 dmesg / messages 里是否有 OOM kill 记录，判断是否内存泄漏。"
    },
    {
      q: "CentOS 上安装 nginx 包的正确命令是？",
      o: ["apt install nginx", "yum install -y nginx", "rpm -e nginx", "tar -xzvf nginx"],
      k: 1,
      e: "CentOS 使用 yum/dnf；apt 属于 Debian/Ubuntu 系。"
    }
  ]
});

/* ============ 九、MySQL 与数据库 ============ */
window.QUESTION_BANK.push({
  id: "c9",
  title: "MySQL 与数据库",
  desc: "SQL、索引、执行计划、核对",
  items: [
    {
      q: "MySQL 增删改查语句分别怎么写？",
      star: true,
      a: "```sql\nINSERT INTO student (id, name, gender) VALUES (1, '张三', '男');\nDELETE FROM student WHERE id = 1;\nUPDATE student SET name = '李四' WHERE id = 1;\nSELECT id, name FROM student WHERE gender = '男' ORDER BY id DESC LIMIT 10;\n```\n多条插入：`INSERT INTO t (a,b) VALUES (1,2),(3,4);`"
    },
    {
      q: "多表联查怎么写？内连接和外连接的区别和使用场景？",
      star: true,
      a: "```sql\n-- 内连接：只保留两表都匹配的行\nSELECT u.name, o.amount FROM user u INNER JOIN orders o ON u.id = o.user_id;\n\n-- 左外连接：保留左表全部，右表无匹配为 NULL\nSELECT u.name, o.amount FROM user u LEFT JOIN orders o ON u.id = o.user_id;\n\n-- 右外连接\nSELECT u.name, o.amount FROM user u RIGHT JOIN orders o ON u.id = o.user_id;\n```\n内连接用于「必须有对应记录」的统计；外连接用于「主表全量 + 关联可有可无」，例如查所有用户及其订单数（含 0 单用户）。"
    },
    {
      q: "学生表有学号、姓名、性别，怎么查男女各有多少人？",
      a: "```sql\nSELECT gender, COUNT(*) AS cnt FROM student GROUP BY gender;\n\n-- 想同时显示总数\nSELECT gender, COUNT(*) FROM student GROUP BY gender WITH ROLLUP;\n```"
    },
    {
      q: "怎么查单表的第 5 到 8 条数据？怎么确定是第 5 到 8 条？",
      star: true,
      a: "```sql\nSELECT * FROM student ORDER BY id LIMIT 4, 4;   -- 跳过 4 条，取 4 条\n-- 等价写法\nSELECT * FROM student ORDER BY id LIMIT 4 OFFSET 4;\n```\n分页公式：`LIMIT (页码-1)*每页条数, 每页条数`。\n「第 5 到 8 条」必须有**确定的排序字段**（通常是主键或创建时间），否则数据库返回顺序不保证，结果不可复现。"
    },
    {
      q: "索引是什么？你了解哪些索引？怎么判断有没有走索引？",
      star: true,
      a: "索引是加速查询的数据结构，MySQL InnoDB 使用 **B+ 树**，用空间换时间。\n类型：主键（聚簇）索引、唯一索引、普通（二级）索引、联合索引、全文索引、前缀索引。\n判断：`EXPLAIN SELECT ...` 看 `key`（实际使用的索引）、`type`（ALL 表示全表扫描，ref / range / index 较好）、`rows`（预估扫描行数）、`Extra`（Using index 覆盖索引、Using filesort 需额外排序）。"
    },
    {
      q: "了解 SQL 的执行计划吗？怎么看？",
      a: "`EXPLAIN` 输出各列：id（执行顺序）、select_type、table、type（访问类型，性能从好到差：system > const > eq_ref > ref > range > index > ALL）、possible_keys、key、key_len、rows、filtered、Extra。\n重点看：type 是否为 ALL、key 是否为 NULL、rows 是否过大、Extra 是否出现 Using temporary / Using filesort。"
    },
    {
      q: "有 10 张表 user1 到 user10，结构一样，给你一个 uid 怎么查它在哪张表？",
      a: "```sql\nSELECT 'user1' AS tb, id FROM user1 WHERE uid = 123\nUNION ALL SELECT 'user2', id FROM user2 WHERE uid = 123\nUNION ALL SELECT 'user3', id FROM user3 WHERE uid = 123\n-- ... 直到 user10\n```\n也可以写脚本循环查 10 张表，命中即停。这类分表设计本身说明需要一张「uid → 表号」的映射表或一致性哈希，测试时可以指出这个设计风险。"
    },
    {
      q: "写一个你做过的比较复杂的核对 SQL，是为了验证什么？",
      a: "```sql\n-- 核对订单金额与支付流水是否一致\nSELECT o.order_no, o.amount, IFNULL(SUM(f.amount),0) AS paid\nFROM orders o\nLEFT JOIN pay_flow f ON o.order_no = f.order_no AND f.status = 'SUCCESS'\nWHERE o.create_time >= '2024-05-01'\nGROUP BY o.order_no, o.amount\nHAVING o.amount <> IFNULL(SUM(f.amount),0);\n```\n用于验证「订单金额 = 成功支付流水之和」，暴露漏记流水、重复支付、金额精度错误等问题。"
    },
    {
      q: "测试过程中数据库主要用来做什么？",
      a: "造测试数据、校验数据落库正确性（字段、精度、状态）、验证多表关联一致性、查状态流转是否合规、定位前后端问题（是否入库）、压测后对账、验证软删除与历史数据兼容。"
    },
    {
      q: "怎么用数据库验证数据一致性（前端、库、上游三方）？",
      a: "取同一业务主键，分别从「上游报文 / 接口返回 / 库表 / 页面展示」取值，逐字段比对；用 SQL 聚合做总量核对（条数、金额合计），再用脚本做明细 diff。\n关注：字段缺失、类型与精度、时间时区、枚举映射、中文与特殊字符、软删除标记。"
    },
    {
      q: "删除数据、修改数据要注意什么？",
      a: "① 先 `SELECT` 用相同 WHERE 确认影响行数 ② 加 `LIMIT` 防误伤 ③ 生产操作走工单审批、先备份 ④ 用主键或索引条件，避免全表锁 ⑤ 注意外键 / 关联数据 ⑥ 事务与回滚预案 ⑦ 避免在业务高峰执行。"
    },
    {
      q: "Redis 了解多少？在项目里怎么用？",
      a: "内存型 KV 数据库，常用作缓存、分布式锁、计数器、排行榜、Session 存储、限流。\n测试关注：缓存与数据库一致性（延迟双删 / 更新策略）、过期时间、缓存穿透 / 击穿 / 雪崩、大 key 与热 key、并发锁的正确性（超时、误删）、集群主从切换数据是否丢失。"
    },
    {
      q: "Kafka 了解吗？",
      a: "分布式消息队列，用于削峰填谷、系统解耦、异步处理。\n测试关注：消息不丢失（ack 配置、重试）、不重复（消费端幂等）、顺序性（同一分区）、积压与消费延迟、消费者扩容后 rebalance、消息过期与死信队列。"
    },
    {
      q: "存储单位有哪些？换算关系是什么？",
      a: "bit（位）< Byte（字节，1B = 8bit）< KB < MB < GB < TB < PB < EB。\n1KB = 1024B、1MB = 1024KB、1GB = 1024MB、1TB = 1024GB。\n注意：硬盘厂商标称常用 1000 进制，所以 500G 硬盘在系统里显示约 465G。"
    }
  ],
  quiz: [
    {
      q: "查询表中第 5 到第 8 条记录（每页 4 条）的正确语句是？",
      o: ["SELECT * FROM t LIMIT 5,4", "SELECT * FROM t LIMIT 4,4", "SELECT * FROM t LIMIT 4 OFFSET 8", "SELECT * FROM t WHERE id BETWEEN 5 AND 8"],
      k: 1,
      e: "LIMIT offset, count，offset 从 0 开始，第 5 条对应 offset=4。同时必须有确定排序，否则顺序不稳定。"
    },
    {
      q: "EXPLAIN 结果中 type 为 ALL 说明？",
      o: ["使用了覆盖索引", "全表扫描，通常需要优化索引", "使用了主键等值查询", "查询走了索引范围扫描"],
      k: 1,
      e: "ALL 表示全表扫描，是最差的访问类型之一；理想情况是 const / eq_ref / ref / range。"
    },
    {
      q: "内连接与左外连接的核心区别是？",
      o: ["内连接更快", "内连接只返回两表都匹配的行，左外连接保留左表全部行", "左外连接不能加 WHERE", "内连接不能用于多表"],
      k: 1,
      e: "左外连接会把左表未匹配的行也返回，右表字段为 NULL，常用于统计「包含 0 条记录」的场景。"
    },
    {
      q: "统计男女各有多少人，正确的 SQL 是？",
      o: ["SELECT COUNT(*) FROM student", "SELECT gender, COUNT(*) FROM student GROUP BY gender", "SELECT DISTINCT gender FROM student", "SELECT * FROM student ORDER BY gender"],
      k: 1,
      e: "按性别分组后计数；结合 WITH ROLLUP 还能得到总计行。"
    },
    {
      q: "判断一条 SQL 是否走了索引，最直接的方式是？",
      o: ["看 SQL 长不长", "执行 EXPLAIN 看 key 字段", "看表有多少行", "看是否用了 WHERE"],
      k: 1,
      e: "EXPLAIN 的 key 列显示实际使用的索引，为 NULL 表示未使用；同时关注 type 与 rows。"
    },
    {
      q: "生产环境执行 UPDATE 前最重要的动作是？",
      o: ["直接执行，出错再回滚", "先用相同 WHERE 执行 SELECT 确认影响行数，并备份/走审批", "加 ORDER BY", "把 WHERE 去掉更快"],
      k: 1,
      e: "先确认影响范围再执行，能避免全表误更新；无 WHERE 的 UPDATE 是典型的生产事故来源。"
    },
    {
      q: "核对「订单金额 = 支付流水之和」，应使用的 SQL 结构是？",
      o: ["INNER JOIN + WHERE", "LEFT JOIN + GROUP BY + HAVING 金额不等", "ORDER BY + LIMIT", "UNION ALL"],
      k: 1,
      e: "左连接保证无流水的订单也被发现，分组求和后 HAVING 过滤不一致项，是标准的对账写法。"
    },
    {
      q: "Redis 缓存与数据库一致性测试中，最典型的异常场景是？",
      o: ["Redis 内存太小", "更新数据库成功但缓存未失效，读到旧数据", "Redis 端口不通", "Redis 集群节点数不足"],
      k: 1,
      e: "「双写不一致」是缓存最常见的缺陷：库已更新、缓存仍是旧值，需要验证删除缓存策略与过期时间。"
    },
    {
      q: "联合索引 (a,b,c) 生效的条件是？",
      o: ["任意字段查询都能用", "必须遵循最左前缀，从 a 开始连续使用", "只能用 c 查询", "只要建了索引就一定生效"],
      k: 1,
      e: "联合索引遵循最左前缀原则：a、a+b、a+b+c 可用；单独查 b 或 c 通常用不上该索引。"
    },
    {
      q: "1GB 等于多少 MB？",
      o: ["1000", "1024", "512", "2048"],
      k: 1,
      e: "计算机内部按 1024 进制换算：1GB = 1024MB。厂商标称容量常用 1000 进制，这是「容量缩水」的原因。"
    }
  ]
});
