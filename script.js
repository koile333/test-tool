// ===== 工具切换 =====
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        const tool = this.dataset.tool;
        // 更新导航
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        this.classList.add('active');
        // 切换面板
        document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('panel-' + tool).classList.add('active');
    });
});

// ===== 侧边栏折叠 =====
document.getElementById('sidebarToggle').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('collapsed');
    const icon = this;
    icon.textContent = icon.textContent === '◀' ? '▶' : '◀';
});

// ===== Toast =====
function showToast(msg) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// ===== 工具：JSON 格式化 =====
const tool_json = {
    format() {
        const input = document.getElementById('json-input').value.trim();
        if (!input) return;
        try {
            const obj = JSON.parse(input);
            document.getElementById('json-output').value = JSON.stringify(obj, null, 2);
            document.getElementById('json-status').textContent = '✅ JSON 有效';
            document.getElementById('json-status').className = 'toolbar-status success';
        } catch (e) {
            document.getElementById('json-status').textContent = '❌ ' + e.message;
            document.getElementById('json-status').className = 'toolbar-status error';
        }
    },
    compress() {
        const input = document.getElementById('json-input').value.trim();
        if (!input) return;
        try {
            document.getElementById('json-output').value = JSON.stringify(JSON.parse(input));
            document.getElementById('json-status').textContent = '✅ 已压缩';
            document.getElementById('json-status').className = 'toolbar-status success';
        } catch (e) {
            document.getElementById('json-status').textContent = '❌ ' + e.message;
            document.getElementById('json-status').className = 'toolbar-status error';
        }
    },
    validate() {
        const input = document.getElementById('json-input').value.trim();
        if (!input) { showToast('请先输入JSON数据'); return; }
        try {
            JSON.parse(input);
            showToast('✅ JSON 格式正确');
        } catch (e) {
            showToast('❌ ' + e.message);
        }
    },
    clear() {
        document.getElementById('json-input').value = '';
        document.getElementById('json-output').value = '';
        document.getElementById('json-status').textContent = '';
    }
};

// ===== 工具：文本差异对比 =====
const tool_diff = {
    compare() {
        let left = document.getElementById('diff-left').value;
        let right = document.getElementById('diff-right').value;
        const ignoreSpace = document.getElementById('diff-ignore-space').checked;
        const ignoreCase = document.getElementById('diff-ignore-case').checked;

        if (ignoreCase) {
            left = left.toLowerCase();
            right = right.toLowerCase();
        }

        const leftLines = left.split('\n');
        const rightLines = right.split('\n');

        const resultDiv = document.getElementById('diff-result');

        if (left === right && !ignoreSpace) {
            resultDiv.innerHTML = '<div class="diff-summary">✅ 两段文本完全一致</div>';
            return;
        }

        // 使用 LCS 进行逐行对比
        const lcs = this._lcs(leftLines, rightLines);

        let html = '<div class="diff-summary">';
        const added = rightLines.length - lcs.length;
        const removed = leftLines.length - lcs.length;
        html += `差异：<span style="color:var(--danger)">-${removed}行</span> <span style="color:var(--success)">+${added}行</span>`;
        html += '</div>';

        // 按行对比
        const maxLen = Math.max(leftLines.length, rightLines.length);
        let i = 0, j = 0;
        while (i < leftLines.length || j < rightLines.length) {
            const lLine = ignoreSpace ? leftLines[i]?.replace(/\s+/g, '') : leftLines[i];
            const rLine = ignoreSpace ? rightLines[j]?.replace(/\s+/g, '') : rightLines[j];

            if (lLine === rLine && lLine !== undefined) {
                html += `<div class="diff-line unchanged">  ${this._escape(leftLines[i])}</div>`;
                i++; j++;
            } else if (i < leftLines.length && (j >= rightLines.length || !rightLines.slice(j).some(rl => (ignoreSpace ? rl.replace(/\s+/g, '') : rl) === lLine))) {
                html += `<div class="diff-line removed">- ${this._escape(leftLines[i])}</div>`;
                i++;
            } else if (j < rightLines.length) {
                html += `<div class="diff-line added">+ ${this._escape(rightLines[j])}</div>`;
                j++;
            } else {
                break;
            }
        }

        resultDiv.innerHTML = html;
    },
    _lcs(a, b) {
        const m = a.length, n = b.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
        for (let i = 1; i <= m; i++)
            for (let j = 1; j <= n; j++)
                dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
        const result = [];
        let i = m, j = n;
        while (i > 0 && j > 0) {
            if (a[i-1] === b[j-1]) { result.unshift(a[i-1]); i--; j--; }
            else if (dp[i-1][j] > dp[i][j-1]) i--;
            else j--;
        }
        return result;
    },
    _escape(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); },
    clear() {
        document.getElementById('diff-left').value = '';
        document.getElementById('diff-right').value = '';
        document.getElementById('diff-result').innerHTML = '';
    }
};

// ===== 工具：SQL 格式化 =====
const tool_sql = {
    format() {
        const input = document.getElementById('sql-input').value.trim();
        if (!input) return;
        document.getElementById('sql-output').value = this._formatSQL(input);
    },
    compress() {
        const input = document.getElementById('sql-input').value.trim();
        if (!input) return;
        document.getElementById('sql-output').value = input.replace(/\s+/g, ' ').trim();
    },
    clear() {
        document.getElementById('sql-input').value = '';
        document.getElementById('sql-output').value = '';
    },
    _formatSQL(sql) {
        const keywords = ['SELECT','FROM','WHERE','AND','OR','ORDER BY','GROUP BY','HAVING',
            'LIMIT','OFFSET','INSERT INTO','VALUES','UPDATE','SET','DELETE FROM',
            'CREATE TABLE','ALTER TABLE','DROP TABLE','JOIN','LEFT JOIN','RIGHT JOIN',
            'INNER JOIN','OUTER JOIN','ON','AS','DISTINCT','UNION','ALL','IN','NOT IN',
            'BETWEEN','LIKE','IS NULL','IS NOT NULL','EXISTS','CASE','WHEN','THEN','ELSE','END'];
        let result = sql.replace(/\s+/g, ' ').trim();
        // 主要关键字前换行
        const majorKw = ['SELECT','INSERT INTO','UPDATE','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE'];
        majorKw.forEach(kw => {
            const re = new RegExp('\\b' + kw.replace(/\s/g, '\\s') + '\\b', 'gi');
            result = result.replace(re, '\n$&');
        });
        keywords.forEach(kw => {
            const re = new RegExp('\\b' + kw.replace(/\s/g, '\\s') + '\\b', 'gi');
            result = result.replace(re, '\n  $&');
        });
        result = result.replace(/\(\s*/g, '(\n    ').replace(/\s*\)/g, '\n  )');
        result = result.replace(/,\s*/g, ',\n    ');
        result = result.replace(/\n\s*\n/g, '\n').trim();
        // 缩进
        const lines = result.split('\n');
        let indent = 0;
        const out = lines.map(line => {
            const t = line.trim();
            if (t.startsWith(')')) indent = Math.max(0, indent - 1);
            const s = '  '.repeat(indent) + t;
            if (t.endsWith('(')) indent++;
            return s;
        });
        return out.join('\n');
    }
};

// ===== 工具：Base64 编解码 =====
const tool_base64 = {
    encode() {
        const input = document.getElementById('base64-input').value;
        if (!input) return;
        try {
            document.getElementById('base64-output').value = btoa(unescape(encodeURIComponent(input)));
        } catch (e) {
            showToast('编码失败：' + e.message);
        }
    },
    decode() {
        const input = document.getElementById('base64-input').value.trim();
        if (!input) return;
        try {
            document.getElementById('base64-output').value = decodeURIComponent(escape(atob(input)));
        } catch (e) {
            showToast('解码失败，请检查输入是否为有效的Base64字符串');
        }
    },
    clear() {
        document.getElementById('base64-input').value = '';
        document.getElementById('base64-output').value = '';
    }
};

// ===== 工具：URL 编解码 =====
const tool_url = {
    encode() {
        const input = document.getElementById('url-input').value;
        if (!input) return;
        document.getElementById('url-output').value = encodeURIComponent(input);
    },
    decode() {
        const input = document.getElementById('url-input').value.trim();
        if (!input) return;
        try {
            document.getElementById('url-output').value = decodeURIComponent(input);
        } catch (e) {
            showToast('解码失败：' + e.message);
        }
    },
    clear() {
        document.getElementById('url-input').value = '';
        document.getElementById('url-output').value = '';
    }
};

// ===== 工具：Unicode 转换 =====
const tool_unicode = {
    toUnicode() {
        const input = document.getElementById('unicode-input').value;
        if (!input) return;
        let result = '';
        for (let i = 0; i < input.length; i++) {
            const code = input.charCodeAt(i).toString(16).toUpperCase();
            result += '\\u' + '0000'.slice(code.length) + code;
        }
        document.getElementById('unicode-output').value = result;
    },
    toString() {
        const input = document.getElementById('unicode-input').value.trim();
        if (!input) return;
        try {
            document.getElementById('unicode-output').value = input.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
                String.fromCharCode(parseInt(hex, 16))
            );
        } catch (e) {
            showToast('转换失败，请检查格式');
        }
    },
    clear() {
        document.getElementById('unicode-input').value = '';
        document.getElementById('unicode-output').value = '';
    }
};

// ===== 工具：时间戳转换 =====
const tool_timestamp = {
    _updateCurrent() {
        const now = Date.now();
        document.getElementById('current-ts').textContent = Math.floor(now / 1000);
        document.getElementById('current-ts-ms').textContent = now;
    },
    tsToDate() {
        let ts = document.getElementById('ts-input').value.trim();
        if (!ts) return;
        ts = parseInt(ts);
        // 判断秒还是毫秒（秒级时间戳大约10位，毫秒13位）
        if (ts < 10000000000) ts *= 1000;
        const d = new Date(ts);
        if (isNaN(d.getTime())) {
            document.getElementById('ts-date-result').textContent = '无效的时间戳';
            return;
        }
        document.getElementById('ts-date-result').innerHTML = `
            <div>📅 ${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}</div>
            <div>⏰ ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}</div>
            <div>📆 ${['周日','周一','周二','周三','周四','周五','周六'][d.getDay()]}</div>
            <div>🌍 UTC: ${d.toUTCString()}</div>
            <div>📍 ISO: ${d.toISOString()}</div>`;
    },
    dateToTs() {
        const val = document.getElementById('date-input').value;
        if (!val) return;
        const d = new Date(val);
        document.getElementById('date-ts-result').innerHTML = `
            <div>秒：<code>${Math.floor(d.getTime()/1000)}</code></div>
            <div>毫秒：<code>${d.getTime()}</code></div>`;
    },
    init() {
        this._updateCurrent();
        setInterval(() => this._updateCurrent(), 1000);
        // 默认填入当前日期时间
        const now = new Date();
        document.getElementById('date-input').value = now.toISOString().slice(0, 16);
    }
};

// ===== 工具：正则测试 =====
const tool_regex = {
    test() {
        const pattern = document.getElementById('regex-pattern').value.trim();
        const text = document.getElementById('regex-input').value;
        const resultEl = document.getElementById('regex-result');
        const highlightEl = document.getElementById('regex-highlight');

        if (!pattern) { showToast('请输入正则表达式'); return; }
        if (!text) { showToast('请输入测试文本'); return; }

        try {
            let flags = '';
            if (document.getElementById('regex-global').checked) flags += 'g';
            if (document.getElementById('regex-ignore').checked) flags += 'i';
            if (document.getElementById('regex-multiline').checked) flags += 'm';

            const re = new RegExp(pattern, flags);
            const matches = [...text.matchAll(re)];

            if (matches.length === 0) {
                resultEl.innerHTML = '<div class="match-count">❌ 没有匹配到任何内容</div>';
                highlightEl.innerHTML = this._escape(text);
                return;
            }

            // 结果列表
            let html = `<div class="match-count">✅ 匹配到 ${matches.length} 处</div>`;
            matches.forEach((m, i) => {
                html += `<div class="match-item"><b>#${i+1}:</b> <code>${this._escape(m[0])}</code>`;
                if (m.index !== undefined) html += ` <span style="color:var(--text-light);font-size:12px">位置:${m.index}</span>`;
                if (m.groups) {
                    const groups = Object.entries(m.groups).filter(([,v]) => v !== undefined);
                    if (groups.length > 0) html += '<br><span style="font-size:12px;color:var(--text-light)">分组: ' + groups.map(([k,v]) => `<code>${k}=${v}</code>`).join(', ') + '</span>';
                }
                html += '</div>';
            });
            resultEl.innerHTML = html;

            // 高亮
            let highlighted = '';
            let lastIdx = 0;
            // 去重位置排序
            const sorted = [...matches].sort((a,b) => a.index - b.index).filter((m,i,arr) =>
                i === 0 || m.index !== arr[i-1].index
            );
            sorted.forEach(m => {
                if (m.index > lastIdx) highlighted += this._escape(text.slice(lastIdx, m.index));
                highlighted += '<span class="hl-match">' + this._escape(m[0]) + '</span>';
                lastIdx = m.index + m[0].length;
            });
            highlighted += this._escape(text.slice(lastIdx));
            highlightEl.innerHTML = highlighted || this._escape(text);
        } catch (e) {
            resultEl.innerHTML = `<div style="color:var(--danger)">❌ 正则表达式错误：${e.message}</div>`;
            highlightEl.innerHTML = '';
        }
    },
    _escape(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
};

// ===== 工具：哈希生成 =====
const tool_hash = {
    generate(algo) {
        const input = document.getElementById('hash-input').value;
        if (!input) { showToast('请先输入文本'); return; }
        this._hash(input, algo).then(hash => {
            const resultsEl = document.getElementById('hash-results');
            // 检查是否已存在
            const existing = resultsEl.querySelector(`[data-algo="${algo}"]`);
            const rowHTML = `<div class="hash-row" data-algo="${algo}">
                <span class="hash-type">${algo}</span>
                <span class="hash-value">${hash}</span>
                <button class="hash-copy" onclick="tool_hash.copyHash('${hash}')">📋 复制</button>
            </div>`;
            if (existing) {
                existing.outerHTML = rowHTML;
            } else {
                resultsEl.insertAdjacentHTML('beforeend', rowHTML);
            }
        });
    },
    async _hash(input, algo) {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuffer = await crypto.subtle.digest(algo, data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },
    copyHash(hash) {
        navigator.clipboard.writeText(hash).then(() => showToast('已复制到剪贴板'));
    },
    clear() {
        document.getElementById('hash-input').value = '';
        document.getElementById('hash-results').innerHTML = '';
    }
};

// ===== 工具：随机数据生成 =====
const tool_random = {
    _history: [],
    _currentPage: 1,
    _pageSize: 10,
    generate(type) {
        let value = '';
        switch (type) {
            case 'name': value = this._genName(); break;
            case 'phone': value = this._genPhone(); break;
            case 'email': value = this._genEmail(); break;
            case 'idcard': value = this._genIdCard(); break;
            case 'uuid': value = crypto.randomUUID(); break;
            case 'number': value = String(Math.floor(Math.random() * 100000)); break;
            case 'string': value = this._genString(12); break;
        }
        const typeNames = {
            name: '姓名', phone: '手机号', email: '邮箱',
            idcard: '身份证号', uuid: 'UUID', number: '数字', string: '随机字符串'
        };
        const now = new Date();
        const time = String(now.getHours()).padStart(2,'0') + ':' +
                     String(now.getMinutes()).padStart(2,'0') + ':' +
                     String(now.getSeconds()).padStart(2,'0');
        this._history.unshift({ type, typeName: typeNames[type], value, time });
        if (this._history.length > 50) this._history.length = 50;
        this._render();
    },
    _genName() {
        const surnames = ['王','李','张','刘','陈','杨','赵','黄','周','吴','徐','孙','马','朱','胡','郭','何','高','林','罗','郑','梁','谢','宋','唐'];
        const names = ['伟','芳','娜','敏','静','涛','勇','艳','杰','磊','强','军','洋','斌','华','明','丽','平','刚','文','辉','玲','超','鑫','宇','浩','然','博','涵','萱'];
        return surnames[Math.floor(Math.random() * surnames.length)] +
               names[Math.floor(Math.random() * names.length)] +
               (Math.random() > 0.5 ? names[Math.floor(Math.random() * names.length)] : '');
    },
    _genPhone() {
        const prefixes = ['130','131','132','133','134','135','136','137','138','139','150','151','152','153','155','156','157','158','159','176','177','178','180','181','182','183','184','185','186','187','188','189'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        let suffix = '';
        for (let i = 0; i < 8; i++) suffix += Math.floor(Math.random() * 10);
        return prefix + suffix;
    },
    _genEmail() {
        const domains = ['qq.com','163.com','gmail.com','outlook.com','sina.com','foxmail.com','aliyun.com','126.com'];
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let name = '';
        const len = Math.floor(Math.random() * 8) + 5;
        for (let i = 0; i < len; i++) name += chars[Math.floor(Math.random() * chars.length)];
        return name + '@' + domains[Math.floor(Math.random() * domains.length)];
    },
    _genIdCard() {
        // 生成符合校验规则的模拟身份证号
        const areas = ['110101','310101','440103','320102','330102','500103','610103','420103'];
        const area = areas[Math.floor(Math.random() * areas.length)];
        const year = 1970 + Math.floor(Math.random() * 40);
        const month = String(Math.floor(Math.random() * 12) + 1).padStart(2,'0');
        const day = String(Math.floor(Math.random() * 28) + 1).padStart(2,'0');
        let id = area + year + month + day;
        for (let i = 0; i < 3; i++) id += Math.floor(Math.random() * 10);
        // 校验位简单处理：随机生成最后一位（数字或X）
        const last = Math.random() > 0.1 ? String(Math.floor(Math.random() * 10)) : 'X';
        return id + last;
    },
    _genString(len) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < len; i++) result += chars[Math.floor(Math.random() * chars.length)];
        return result;
    },
    _render() {
        const container = document.getElementById('random-output');
        if (this._history.length === 0) {
            container.innerHTML = '<div class="random-placeholder">点击上方按钮生成测试数据</div>';
            document.getElementById('random-pagination').innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(this._history.length / this._pageSize);
        // 防止当前页超出范围
        if (this._currentPage > totalPages) this._currentPage = totalPages;
        if (this._currentPage < 1) this._currentPage = 1;

        const start = (this._currentPage - 1) * this._pageSize;
        const pageItems = this._history.slice(start, start + this._pageSize);

        const tableHTML = `
            <table class="random-table">
                <thead><tr><th class="col-time">时间</th><th class="col-type">类型</th><th class="col-index">序号</th><th>生成值</th></tr></thead>
                <tbody>${pageItems.map((h, i) => `
                    <tr>
                        <td class="col-time">${h.time}</td>
                        <td class="col-type">${h.typeName}</td>
                        <td class="col-index">${start + i + 1}</td>
                        <td>${h.value}</td>
                    </tr>
                `).join('')}</tbody>
            </table>`;

        // 分页控件
        let pagHTML = '';
        if (totalPages > 1) {
            pagHTML = '<div class="random-pagination">';
            pagHTML += `<span class="rp-info">共 ${this._history.length} 条，第 ${this._currentPage}/${totalPages} 页</span>`;
            pagHTML += '<div class="rp-btns">';
            pagHTML += `<button class="rp-btn" onclick="tool_random.goToPage(1)" ${this._currentPage === 1 ? 'disabled' : ''} title="首页">«</button>`;
            pagHTML += `<button class="rp-btn" onclick="tool_random.goToPage(${this._currentPage - 1})" ${this._currentPage === 1 ? 'disabled' : ''} title="上一页">‹</button>`;

            // 页码按钮
            const maxVisible = 5;
            let startPage = Math.max(1, this._currentPage - Math.floor(maxVisible / 2));
            let endPage = Math.min(totalPages, startPage + maxVisible - 1);
            if (endPage - startPage < maxVisible - 1) {
                startPage = Math.max(1, endPage - maxVisible + 1);
            }
            for (let p = startPage; p <= endPage; p++) {
                pagHTML += `<button class="rp-btn rp-page${p === this._currentPage ? ' active' : ''}" onclick="tool_random.goToPage(${p})">${p}</button>`;
            }

            pagHTML += `<button class="rp-btn" onclick="tool_random.goToPage(${this._currentPage + 1})" ${this._currentPage === totalPages ? 'disabled' : ''} title="下一页">›</button>`;
            pagHTML += `<button class="rp-btn" onclick="tool_random.goToPage(${totalPages})" ${this._currentPage === totalPages ? 'disabled' : ''} title="末页">»</button>`;
            pagHTML += '</div>';
            // 每页条数切换
            pagHTML += '<select class="rp-size" onchange="tool_random.changePageSize(this.value)">';
            [10, 20, 50].forEach(s => {
                pagHTML += `<option value="${s}"${this._pageSize === s ? ' selected' : ''}>每页 ${s} 条</option>`;
            });
            pagHTML += '</select>';
            pagHTML += '</div>';
        }

        container.innerHTML = tableHTML;
        document.getElementById('random-pagination').innerHTML = pagHTML;
    },
    goToPage(page) {
        const totalPages = Math.ceil(this._history.length / this._pageSize);
        if (page < 1 || page > totalPages) return;
        this._currentPage = page;
        this._render();
    },
    changePageSize(size) {
        this._pageSize = parseInt(size);
        this._currentPage = 1;
        this._render();
    },
    clear() {
        this._history = [];
        this._currentPage = 1;
        this._render();
    }
};

// ===== 工具：需求描述优化 =====
const tool_requirement = {
    optimize(mode) {
        const input = document.getElementById('req-input').value.trim();
        if (!input) { showToast('请先输入需求描述'); return; }

        document.getElementById('req-analysis').style.display = 'none';
        const output = document.getElementById('req-output');

        // 分析原始需求
        const features = this._extractFeatures(input);
        const keywords = this._extractKeywords(input);
        const roles = this._extractRoles(input);

        // 生成需求标题
        const title = this._guessTitle(input, keywords);

        // 生成结构化文档
        let html = '';

        if (mode === 'standard') {
            html = this._buildStandardDoc(title, input, features, keywords, roles);
        } else {
            html = this._buildDetailDoc(title, input, features, keywords, roles);
        }

        output.innerHTML = html;
    },

    analyze() {
        const input = document.getElementById('req-input').value.trim();
        if (!input) { showToast('请先输入需求描述'); return; }

        const analysis = document.getElementById('req-analysis');
        analysis.style.display = 'block';

        const issues = [];
        const score = { total: 100, deduct: 0 };

        // 检测模糊词汇
        const vagueWords = ['大概','可能','差不多','左右','一些','若干','部分','适当','较好','较快','基本','一般','比较','差不多','好像','似乎','或许','也许'];
        const foundVague = vagueWords.filter(w => input.includes(w));
        if (foundVague.length > 0) {
            score.deduct += foundVague.length * 3;
            issues.push({ type: 'warning', icon: '⚠️', title: '模糊描述', desc: `检测到模糊词汇：${foundVague.join('、')}。建议替换为明确的量化描述。` });
        }

        // 检测缺失验收标准关键词
        const acceptWords = ['验收标准','预期结果','预期','结果','断言','验证','检查','校验'];
        if (!acceptWords.some(w => input.includes(w))) {
            score.deduct += 10;
            issues.push({ type: 'error', icon: '❌', title: '缺少验收标准', desc: '未发现验收标准相关描述。建议补充"预期结果"或"验收条件"。' });
        }

        // 检测缺失异常处理
        const exceptionWords = ['异常','错误','失败','超时','空','null','边界','上限','下限','非法','无效'];
        if (!exceptionWords.some(w => input.includes(w))) {
            score.deduct += 8;
            issues.push({ type: 'warning', icon: '⚠️', title: '缺少异常场景', desc: '未提及异常/边界/错误处理。建议补充非法输入、超时、空值等异常场景。' });
        }

        // 检测角色不明确
        if (!/用户|管理员|游客|会员|运营|商家|审核|客服/.test(input)) {
            score.deduct += 5;
            issues.push({ type: 'info', icon: '💡', title: '角色不明确', desc: '未明确说明需求的用户角色。建议补充"作为[角色]，我希望[功能]，以便[价值]"。' });
        }

        // 检测数字/量化
        const hasNumbers = /\d+/.test(input);
        if (!hasNumbers) {
            score.deduct += 5;
            issues.push({ type: 'info', icon: '💡', title: '缺少量化指标', desc: '描述中未包含数字或量化标准。建议添加具体的数值、时间、数量等。' });
        }

        // 检测输入输出
        if (!/输入|输出|参数|字段|返回|展示|显示|页面/.test(input)) {
            score.deduct += 5;
            issues.push({ type: 'info', icon: '💡', title: '输入输出不明确', desc: '未描述具体的输入参数和输出结果。建议补充字段定义和页面展示。' });
        }

        // 检测状态变化
        const stateWords = ['状态','流转','变更','触发','条件','前置','后置'];
        if (!stateWords.some(w => input.includes(w))) {
            score.deduct += 3;
            issues.push({ type: 'info', icon: '💡', title: '状态流转未说明', desc: '未提到状态变化或触发条件。如有状态变更，建议补充流程图或状态机。' });
        }

        const finalScore = Math.max(0, score.total - score.deduct);

        let html = `<div class="req-score-bar">
            <div class="req-score-label">需求质量评分</div>
            <div class="req-score-value" style="color:${finalScore >= 80 ? 'var(--success)' : finalScore >= 60 ? 'var(--warning)' : 'var(--danger)'}">${finalScore} / 100</div>
            <div class="req-score-bar-track"><div class="req-score-bar-fill" style="width:${finalScore}%;background:${finalScore >= 80 ? 'var(--success)' : finalScore >= 60 ? 'var(--warning)' : 'var(--danger)'}"></div></div>
        </div>`;

        html += '<div class="req-issues">';
        issues.forEach(issue => {
            html += `<div class="req-issue req-issue-${issue.type}">
                <span class="req-issue-icon">${issue.icon}</span>
                <div class="req-issue-body">
                    <div class="req-issue-title">${issue.title}</div>
                    <div class="req-issue-desc">${issue.desc}</div>
                </div>
            </div>`;
        });
        if (issues.length === 0) {
            html += '<div style="color:var(--success);padding:12px">✅ 需求描述质量良好，未发现明显问题</div>';
        }
        html += '</div>';

        analysis.innerHTML = html;

        // 同时显示一个简洁的输出结果
        const output = document.getElementById('req-output');
        output.innerHTML = '<div class="req-placeholder" style="color:var(--success)">分析完成，请查看下方问题列表</div>';
    },

    _extractFeatures(input) {
        // 按常见分隔符拆分
        const features = [];
        const lines = input.split(/[；;。\n]/);
        lines.forEach(line => {
            line = line.trim();
            if (line.length > 3 && !/^[0-9\s\.,，。、]*$/.test(line)) {
                features.push(line);
            }
        });
        return features.filter(f => f.length > 0);
    },

    _extractKeywords(input) {
        const keywordMap = {
            '登录': '用户认证', '注册': '用户注册', '密码': '安全认证', '支付': '支付系统',
            '订单': '订单管理', '列表': '数据展示', '搜索': '数据检索', '上传': '文件管理',
            '导出': '数据导出', '删除': '数据操作', '编辑': '数据操作', '新增': '数据操作',
            '权限': '权限管理', '角色': '角色管理', '通知': '消息通知', '消息': '消息通知',
            '统计': '数据统计', '报表': '数据统计', '审核': '审核流程', '审批': '审核流程',
            '配置': '系统配置', '设置': '系统配置', '显示': '界面展示', '展示': '界面展示',
            '按钮': '交互操作', '点击': '交互操作', '输入': '输入校验', '校验': '输入校验',
            '接口': '接口对接', 'API': '接口对接', '数据': '数据管理', '数据库': '数据管理'
        };
        const found = new Set();
        Object.entries(keywordMap).forEach(([kw, tag]) => {
            if (input.includes(kw)) found.add(tag);
        });
        return [...found];
    },

    _extractRoles(input) {
        const roles = [];
        if (/用户|客户|消费者|买家/.test(input)) roles.push('普通用户');
        if (/管理员|后台|运营|管理/.test(input)) roles.push('管理员');
        if (/商家|店主|卖家/.test(input)) roles.push('商家');
        if (/游客|未登录|访客/.test(input)) roles.push('游客');
        if (/审核|审批/.test(input)) roles.push('审核员');
        return roles;
    },

    _guessTitle(input, keywords) {
        // 取前30字作为标题参考
        const short = input.slice(0, 60).replace(/[\n\r]/g, ' ').trim();
        return short.length > 40 ? short.slice(0, 40) + '…' : short;
    },

    _buildStandardDoc(title, input, features, keywords, roles) {
        let html = `<div class="req-doc">`;
        html += `<div class="req-doc-header">📋 优化后需求文档</div>`;

        // 1. 需求标题
        html += `<div class="req-section"><div class="req-section-title">📌 需求标题</div>`;
        html += `<div class="req-section-content">${this._escape(title)}</div></div>`;

        // 2. 涉及角色
        if (roles.length > 0) {
            html += `<div class="req-section"><div class="req-section-title">👥 涉及角色</div>`;
            html += `<div class="req-section-content"><ul class="req-list">`;
            roles.forEach(r => { html += `<li>${r}</li>`; });
            html += `</ul></div></div>`;
        }

        // 3. 需求背景
        html += `<div class="req-section"><div class="req-section-title">📖 需求背景</div>`;
        html += `<div class="req-section-content">${this._escape(input)}</div></div>`;

        // 4. 功能需求
        const reqFeatures = features.slice(0, 10);
        if (reqFeatures.length > 0) {
            html += `<div class="req-section"><div class="req-section-title">✅ 功能需求</div>`;
            html += `<div class="req-section-content"><ol class="req-list">`;
            reqFeatures.forEach((f, i) => {
                let text = f;
                // 用【】标注关键信息
                text = text.replace(/(输入|点击|选择|提交|校验|验证|显示|展示|返回|跳转|保存|删除|修改|新增|查询|搜索)/g, '【$1】');
                html += `<li>${this._escape(text)}</li>`;
            });
            html += `</ol></div></div>`;
        }

        // 5. 验收标准
        html += `<div class="req-section"><div class="req-section-title">🎯 验收标准</div>`;
        html += `<div class="req-section-content"><ul class="req-list">`;
        html += `<li>正向流程：按照需求描述正常操作，预期结果符合要求</li>`;
        html += `<li>异常场景：输入非法数据、超时、网络异常等情况，系统应有友好提示</li>`;
        html += `<li>边界测试：测试输入的最大值、最小值、空值等边界情况</li>`;
        html += `<li>兼容性：在不同浏览器/设备上功能表现一致</li>`;
        html += `</ul></div></div>`;

        // 6. 约束条件
        html += `<div class="req-section"><div class="req-section-title">📏 约束与依赖</div>`;
        html += `<div class="req-section-content"><ul class="req-list">`;
        html += `<li>需要确认前端交互细节（按钮位置、弹窗样式）</li>`;
        html += `<li>需要确认后端接口字段定义和错误码</li>`;
        html += `<li>需要确认数据校验规则（长度、格式、必填项）</li>`;
        html += `<li>需要确认权限控制逻辑</li>`;
        html += `</ul></div></div>`;

        // 7. 标签
        if (keywords.length > 0) {
            html += `<div class="req-section"><div class="req-section-title">🏷️ 关联标签</div>`;
            html += `<div class="req-section-content"><div class="req-tags">`;
            keywords.forEach(k => { html += `<span class="req-tag">${k}</span>`; });
            html += `</div></div></div>`;
        }

        html += `</div>`;
        return html;
    },

    _buildDetailDoc(title, input, features, keywords, roles) {
        let html = `<div class="req-doc">`;
        html += `<div class="req-doc-header">📑 详细展开需求文档</div>`;

        html += `<div class="req-section"><div class="req-section-title">📌 需求标题</div>`;
        html += `<div class="req-section-content">${this._escape(title)}</div></div>`;

        if (roles.length > 0) {
            html += `<div class="req-section"><div class="req-section-title">👥 涉及角色</div>`;
            html += `<div class="req-section-content"><ul class="req-list">`;
            roles.forEach(r => { html += `<li><b>${r}</b> — 系统的直接使用者</li>`; });
            html += `</ul></div></div>`;
        }

        html += `<div class="req-section"><div class="req-section-title">📖 需求背景</div>`;
        html += `<div class="req-section-content">${this._escape(input)}</div></div>`;

        const reqFeatures = features.slice(0, 10);
        if (reqFeatures.length > 0) {
            html += `<div class="req-section"><div class="req-section-title">✅ 功能需求详情</div>`;
            html += `<div class="req-section-content"><ol class="req-list">`;
            reqFeatures.forEach((f, i) => {
                let text = f;
                text = text.replace(/(输入|点击|选择|提交|校验|验证|显示|展示|返回|跳转|保存|删除|修改|新增|查询|搜索)/g, '【$1】');
                html += `<li><div class="req-feature-item">`;
                html += `<div class="req-feature-desc">${this._escape(text)}</div>`;
                html += `<div style="margin-top:4px;font-size:12px;color:var(--text-light)">`;
                html += `前置条件：用户已登录，权限满足 | `;
                html += `预期结果：操作成功，界面正确展示 | `;
                html += `异常处理：操作失败显示友好提示信息`;
                html += `</div></div></li>`;
            });
            html += `</ol></div></div>`;
        }

        html += `<div class="req-section"><div class="req-section-title">🎯 验收标准</div>`;
        html += `<div class="req-section-content"><ul class="req-list req-checklist">`;
        html += `<li><input type="checkbox" checked disabled> <b>正向流程</b>：操作符合预期，结果正确</li>`;
        html += `<li><input type="checkbox" disabled> <b>异常场景</b>：非法输入得到正确处理和提示</li>`;
        html += `<li><input type="checkbox" disabled> <b>边界测试</b>：最大值/最小值/空值/超长字符</li>`;
        html += `<li><input type="checkbox" disabled> <b>并发测试</b>：多人同时操作不出现数据异常</li>`;
        html += `<li><input type="checkbox" disabled> <b>兼容性</b>：Chrome/Firefox/Safari/移动端</li>`;
        html += `<li><input type="checkbox" disabled> <b>性能</b>：页面响应时间 &lt; 2秒</li>`;
        html += `<li><input type="checkbox" disabled> <b>安全</b>：敏感信息加密传输，无越权漏洞</li>`;
        html += `</ul></div></div>`;

        html += `<div class="req-section"><div class="req-section-title">📏 约束与依赖</div>`;
        html += `<div class="req-section-content"><ul class="req-list">`;
        html += `<li>前端：需确认 UI 交互细节（按钮文案、弹窗样式、loading 状态）</li>`;
        html += `<li>后端：需确认接口路径、请求方法、入参/出参字段定义和错误码</li>`;
        html += `<li>数据校验：确认字段类型、长度限制、格式要求、必填项规则</li>`;
        html += `<li>权限控制：确认角色权限矩阵，不同角色的可见/可操作范围</li>`;
        html += `<li>外部依赖：确认是否依赖第三方服务，超时和降级策略</li>`;
        html += `</ul></div></div>`;

        if (keywords.length > 0) {
            html += `<div class="req-section"><div class="req-section-title">🏷️ 关联标签</div>`;
            html += `<div class="req-section-content"><div class="req-tags">`;
            keywords.forEach(k => { html += `<span class="req-tag">${k}</span>`; });
            html += `</div></div></div>`;
        }

        html += `</div>`;
        return html;
    },

    _escape(s) {
        return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    },

    clear() {
        document.getElementById('req-input').value = '';
        document.getElementById('req-output').innerHTML = '<div class="req-placeholder">点击「标准优化」或「详细展开」生成结构化需求文档</div>';
        document.getElementById('req-analysis').style.display = 'none';
    }
};

// ===== 工具：生成测试用例 =====
const tool_testcase = {
    _cases: [],

    generate(mode) {
        const input = document.getElementById('tc-input').value.trim();
        if (!input) { showToast('请先输入需求描述'); return; }

        const features = tool_requirement._extractFeatures(input);
        const keywords = tool_requirement._extractKeywords(input);
        const roles = tool_requirement._extractRoles(input);
        const constraints = this._extractConstraints(input);
        const fields = this._extractFields(input);

        this._cases = [];
        let caseId = 1;

        const operations = this._extractOperations(input, features);

        if (mode === 'all' || mode === 'positive') {
            this._genPositiveCases(operations, fields, constraints, roles, keywords, caseId);
            caseId = this._cases.length + 1;
        }
        if (mode === 'all' || mode === 'negative') {
            this._genNegativeCases(operations, fields, constraints, roles, caseId);
            caseId = this._cases.length + 1;
        }
        if (mode === 'all' || mode === 'boundary') {
            this._genBoundaryCases(operations, fields, constraints, roles, caseId);
        }

        this._cases.forEach((c, i) => { c.id = 'TC-' + String(i + 1).padStart(3, '0'); });

        document.getElementById('tc-status').textContent = '共生成 ' + this._cases.length + ' 条用例';
        document.getElementById('tc-status').className = 'toolbar-status success';
        this._render();
    },

    _extractConstraints(input) {
        const constraints = [];
        const numPatterns = [
            /(\d+)\s*(次|天|小时|分钟|秒|个|条|元|位|字符)/g,
            /(最多|最少|不超过|不少于|大于|小于|等于|至少|至多)\s*(\d+)/g,
            /(\d+)\s*[-~至到]\s*(\d+)/g
        ];
        numPatterns.forEach(p => {
            let m;
            while ((m = p.exec(input)) !== null) {
                constraints.push({ raw: m[0], type: 'number' });
            }
        });
        if (/手机号|手机|电话/.test(input)) constraints.push({ raw: '手机号格式', type: 'format' });
        if (/邮箱|email|邮件/.test(input)) constraints.push({ raw: '邮箱格式', type: 'format' });
        if (/身份证/.test(input)) constraints.push({ raw: '身份证号格式', type: 'format' });
        if (/密码/.test(input)) constraints.push({ raw: '密码规则', type: 'format' });
        return constraints;
    },

    _extractFields(input) {
        const fields = [];
        const fieldPatterns = [
            /用户名|账号|username/i,
            /密码|password/i,
            /手机号|手机号码|联系电话/i,
            /邮箱|email|邮件/i,
            /验证码|校验码/i,
            /昵称|姓名|名称/i,
            /地址|收货地址/i,
            /身份证|证件号/i,
            /金额|价格|数量/i,
            /搜索关键词|关键字/i,
            /备注|描述|说明/i,
        ];
        const names = ['用户名','密码','手机号','邮箱','验证码','姓名','地址','身份证号','金额','搜索关键词','备注'];
        fieldPatterns.forEach((p, i) => {
            if (p.test(input) && !fields.includes(names[i])) {
                fields.push(names[i]);
            }
        });
        return fields;
    },

    _extractOperations(input, features) {
        const ops = [];
        features.forEach(f => {
            const opMatch = f.match(/(登录|注册|点击|输入|提交|搜索|查询|删除|修改|编辑|新增|添加|上传|下载|导出|导入|保存|取消|返回|跳转|刷新|切换|选择|勾选|拖动|支付|退款|审核|审批|确认|重置|清空)/);
            if (opMatch) {
                ops.push({ action: opMatch[1], description: f });
            }
        });
        if (ops.length === 0) {
            features.slice(0, 8).forEach(f => {
                ops.push({ action: '操作', description: f });
            });
        }
        return ops;
    },

    _genPositiveCases(operations, fields, constraints, roles, keywords, startId) {
        let id = startId;
        this._cases.push({
            id: '',
            title: '正常流程验证',
            type: '功能测试',
            priority: 'P0',
            precondition: '用户已登录系统，具备操作权限',
            steps: operations.slice(0, 5).map((o, i) => (i + 1) + '. ' + o.description).join('\n'),
            expected: '所有步骤按预期执行，系统状态正确更新，无报错',
            category: '正向用例'
        });

        fields.slice(0, 5).forEach(f => {
            this._cases.push({
                id: '',
                title: f + '正常输入验证',
                type: '功能测试',
                priority: 'P1',
                precondition: '页面正常加载',
                steps: '1. 在' + f + '输入框中输入合法值\n2. 提交或触发校验',
                expected: f + '输入被正确接受，无错误提示',
                category: '正向用例'
            });
        });

        if (roles.length > 1) {
            roles.forEach(role => {
                this._cases.push({
                    id: '',
                    title: role + '权限验证',
                    type: '功能测试',
                    priority: 'P1',
                    precondition: '以' + role + '身份登录',
                    steps: '1. 执行需求中描述的操作\n2. 验证可见性和可操作性',
                    expected: role + '仅能查看和操作权限范围内的内容',
                    category: '正向用例'
                });
            });
        }
    },

    _genNegativeCases(operations, fields, constraints, roles, startId) {
        fields.slice(0, 4).forEach(f => {
            this._cases.push({
                id: '',
                title: f + '为空/不填验证',
                type: '功能测试',
                priority: 'P1',
                precondition: '页面正常加载',
                steps: '1. 不填写' + f + '\n2. 提交表单或触发操作',
                expected: '系统提示"' + f + '不能为空"或类似友好提示，阻止提交',
                category: '异常场景'
            });
        });

        fields.slice(0, 4).forEach(f => {
            let invalidValue = '无效输入数据';
            if (f.includes('邮箱')) invalidValue = '非法邮箱格式(如 "abc"、"@.com")';
            else if (f.includes('手机')) invalidValue = '非法手机号(如 "123"、"abcdefg")';
            else if (f.includes('身份证')) invalidValue = '非法身份证号(如 "1234567890")';
            else if (f.includes('密码')) invalidValue = '不符合密码规则的字符串';
            else if (f.includes('金额')) invalidValue = '负数金额(如 "-100")';
            else if (f.includes('数量')) invalidValue = '负数值(如 "-5")';

            this._cases.push({
                id: '',
                title: f + '输入非法格式验证',
                type: '功能测试',
                priority: 'P2',
                precondition: '页面正常加载',
                steps: '1. 在' + f + '输入框中输入"' + invalidValue + '"\n2. 提交表单或触发操作',
                expected: '系统提示"' + f + '格式不正确"或类似友好提示，数据不被提交',
                category: '异常场景'
            });
        });

        const actionOps = operations.filter(o => ['登录','注册','提交','支付','删除','修改','上传'].includes(o.action));
        if (actionOps.length > 0) {
            this._cases.push({
                id: '',
                title: '网络异常/超时处理验证',
                type: '功能测试',
                priority: 'P1',
                precondition: '页面正常加载，模拟网络断开或超时',
                steps: '1. 填写必要信息\n2. 点击提交/操作按钮时断开网络\n3. 观察系统表现',
                expected: '系统显示网络异常提示，操作可重试，数据不丢失',
                category: '异常场景'
            });
        }

        if (roles.length > 0) {
            this._cases.push({
                id: '',
                title: '无权限用户操作验证',
                type: '功能测试',
                priority: 'P1',
                precondition: '以无权限的普通用户身份登录',
                steps: '1. 尝试访问需要权限的功能\n2. 尝试直接调用接口',
                expected: '系统阻止访问，显示权限不足提示或跳转到登录页',
                category: '异常场景'
            });
        }
    },

    _genBoundaryCases(operations, fields, constraints, roles, startId) {
        constraints.forEach(c => {
            if (c.type === 'number') {
                const nums = c.raw.match(/\d+/g);
                if (nums && nums.length >= 1) {
                    const val = parseInt(nums[0]);
                    this._cases.push({
                        id: '',
                        title: '边界值测试：' + c.raw,
                        type: '功能测试',
                        priority: 'P1',
                        precondition: '按需求描述进入对应页面',
                        steps: '1. 输入临界值 ' + val + '\n2. 输入临界值 ' + (val - 1) + '（低于阈值）\n3. 输入临界值 ' + (val + 1) + '（高于阈值）',
                        expected: '等于' + val + '时按需求规则处理，' + (val - 1) + '和' + (val + 1) + '按边界规则处理',
                        category: '边界测试'
                    });
                }
            }
        });

        fields.slice(0, 4).forEach(f => {
            this._cases.push({
                id: '',
                title: f + '长度边界测试',
                type: '功能测试',
                priority: 'P2',
                precondition: '页面正常加载',
                steps: '1. 输入1个字符（最小长度）\n2. 输入超长字符(如500个字符)\n3. 输入特殊字符(如<script>、表情符号等)',
                expected: '最小长度正常接受；超长字符给出长度限制提示；特殊字符正确转义处理',
                category: '边界测试'
            });

            this._cases.push({
                id: '',
                title: f + '特殊值验证',
                type: '功能测试',
                priority: 'P2',
                precondition: '页面正常加载',
                steps: "1. 输入空格/全空格\n2. 输入SQL注入字符(如 ' OR '1'='1)\n3. 输入XSS字符(如 <script>alert(1)</script>)",
                expected: '空格按业务规则处理；注入字符正确转义，不触发安全漏洞',
                category: '边界测试'
            });
        });

        const hasModify = operations.some(o => ['删除','修改','编辑'].includes(o.action));
        if (hasModify) {
            this._cases.push({
                id: '',
                title: '并发操作边界测试',
                type: '功能测试',
                priority: 'P1',
                precondition: '两个用户同时登录',
                steps: '1. 用户A和用户B同时对同一数据执行操作\n2. 观察数据处理结果',
                expected: '数据一致性保持，后提交的操作得到合理反馈（成功或冲突提示）',
                category: '边界测试'
            });
        }
    },

    _render() {
        const container = document.getElementById('tc-output');
        if (this._cases.length === 0) {
            container.innerHTML = '<div class="tc-placeholder">点击上方按钮生成测试用例</div>';
            return;
        }

        const stats = {};
        this._cases.forEach(c => {
            stats[c.category] = (stats[c.category] || 0) + 1;
        });

        let html = '<div class="tc-summary-bar">';
        Object.entries(stats).forEach(([cat, count]) => {
            const color = cat === '正向用例' ? 'var(--success)' : cat === '异常场景' ? 'var(--danger)' : 'var(--warning)';
            html += '<span class="tc-stat-badge" style="border-left:3px solid ' + color + '">' + cat + ': ' + count + '条</span>';
        });
        html += '</div>';

        html += '<div class="tc-table-wrap"><table class="tc-table"><thead><tr>';
        html += '<th class="tc-col-id">用例ID</th>';
        html += '<th class="tc-col-title">用例标题</th>';
        html += '<th class="tc-col-type">类别</th>';
        html += '<th class="tc-col-pri">优先级</th>';
        html += '<th class="tc-col-pre">前置条件</th>';
        html += '<th class="tc-col-steps">测试步骤</th>';
        html += '<th class="tc-col-expect">预期结果</th>';
        html += '</tr></thead><tbody>';

        this._cases.forEach(c => {
            const catColor = c.category === '正向用例' ? 'tc-cat-positive' : c.category === '异常场景' ? 'tc-cat-negative' : 'tc-cat-boundary';
            const priColor = c.priority === 'P0' ? 'tc-pri-p0' : c.priority === 'P1' ? 'tc-pri-p1' : 'tc-pri-p2';
            html += '<tr>';
            html += '<td class="tc-col-id">' + c.id + '</td>';
            html += '<td class="tc-col-title">' + c.title + '</td>';
            html += '<td class="tc-col-type"><span class="tc-cat ' + catColor + '">' + c.category + '</span></td>';
            html += '<td class="tc-col-pri"><span class="tc-pri ' + priColor + '">' + c.priority + '</span></td>';
            html += '<td class="tc-col-pre">' + c.precondition + '</td>';
            html += '<td class="tc-col-steps">' + c.steps.replace(/\n/g, '<br>') + '</td>';
            html += '<td class="tc-col-expect">' + c.expected + '</td>';
            html += '</tr>';
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;
    },

    exportCSV() {
        if (this._cases.length === 0) { showToast('请先生成测试用例'); return; }
        const header = ['用例ID', '用例标题', '测试类型', '类别', '优先级', '前置条件', '测试步骤', '预期结果'];
        const rows = this._cases.map(c => [
            c.id, c.title, c.type, c.category, c.priority,
            c.precondition, c.steps.replace(/\n/g, ' | '), c.expected
        ]);
        const csvContent = '\uFEFF' + header.join(',') + '\n' + rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '测试用例_' + new Date().toISOString().slice(0, 10) + '.csv';
        a.click();
        URL.revokeObjectURL(url);
        showToast('CSV 文件已下载');
    },

    clear() {
        document.getElementById('tc-input').value = '';
        document.getElementById('tc-output').innerHTML = '<div class="tc-placeholder">点击上方按钮生成测试用例</div>';
        document.getElementById('tc-status').textContent = '';
        this._cases = [];
    }
};

// ===== 工具：生成 Postman 测试脚本 =====
const tool_postman = {
    _apis: [],
    _mode: null,
    _pageSize: 110,
    _pageStates: {},
    _expandedApis: new Set(),

    generate(mode) {
        const input = document.getElementById('pm-input').value.trim();
        if (!input) { showToast('请先输入接口文档'); return; }

        if (!mode || !['cases', 'scripts'].includes(mode)) {
            showToast('请选择生成模式：接口测试用例 或 Postman脚本'); return;
        }
        this._mode = mode;
        this._apis = [];
        this._pageStates = {};
        this._expandedApis = new Set();

        // 尝试解析 OpenAPI/Swagger JSON
        try {
            const json = JSON.parse(input);
            if (json.openapi || json.swagger) {
                this._parseOpenAPI(json);
            } else {
                showToast('JSON 格式无法识别为接口定义，请使用 OpenAPI/Swagger 或自由文本格式');
                return;
            }
        } catch (e) {
            // 不是 JSON，按自由文本格式解析
            this._parseFreeText(input);
        }

        if (this._apis.length === 0) {
            showToast('未能解析到接口定义，请检查输入格式');
            return;
        }

        const modeLabels = { cases: '测试用例', scripts: '脚本' };
        document.getElementById('pm-status').textContent = '共解析 ' + this._apis.length + ' 个接口（' + modeLabels[this._mode] + '）';
        document.getElementById('pm-status').className = 'toolbar-status success';
        this._render();
    },

    _parseOpenAPI(json) {
        const version = json.openapi || json.swagger;
        const baseUrl = json.servers?.[0]?.url || (json.host ? (json.schemes?.[0] || 'http') + '://' + json.host + (json.basePath || '') : '');

        const paths = json.paths || {};
        Object.entries(paths).forEach(([path, methods]) => {
            Object.entries(methods).forEach(([method, detail]) => {
                if (!['get','post','put','delete','patch','head','options'].includes(method)) return;

                const api = {
                    method: method.toUpperCase(),
                    path: path,
                    summary: detail.summary || detail.description || '',
                    headers: [],
                    queryParams: [],
                    pathParams: [],
                    body: null,
                    response: null,
                    responseStatus: 200
                };

                // 解析参数
                (detail.parameters || []).forEach(p => {
                    if (p.in === 'header') {
                        api.headers.push({ key: p.name, value: p.example || '', description: p.description || '', required: p.required });
                    } else if (p.in === 'query') {
                        api.queryParams.push({ key: p.name, value: p.example || '', description: p.description || '', required: p.required });
                    } else if (p.in === 'path') {
                        api.pathParams.push({ key: p.name, value: p.example || '', description: p.description || '' });
                    }
                });

                // 请求体
                if (detail.requestBody) {
                    const content = detail.requestBody.content || {};
                    const jsonContent = content['application/json'];
                    if (jsonContent && jsonContent.schema) {
                        api.body = this._schemaToSample(jsonContent.schema);
                        api._bodySchema = jsonContent.schema;
                        api._bodyRequired = detail.requestBody.required;
                    }
                }

                // 响应
                const responses = detail.responses || {};
                api._responseCodes = Object.keys(responses);
                api._responseDescs = {};
                Object.entries(responses).forEach(([code, r]) => {
                    api._responseDescs[code] = r.description || '';
                });
                const successKey = Object.keys(responses).find(k => k.startsWith('2')) || Object.keys(responses)[0];
                if (successKey && responses[successKey]) {
                    api.responseStatus = parseInt(successKey) || 200;
                    const respContent = responses[successKey].content || {};
                    const respJson = respContent['application/json'];
                    if (respJson && respJson.schema) {
                        api.response = this._schemaToSample(respJson.schema);
                    }
                }

                this._apis.push(api);
            });
        });
    },

    _schemaToSample(schema, depth) {
        if (!depth) depth = 0;
        if (depth > 5) return '...';
        if (!schema) return null;

        if (schema.example !== undefined) return schema.example;

        switch (schema.type) {
            case 'object':
                const obj = {};
                if (schema.properties) {
                    Object.entries(schema.properties).forEach(([k, v]) => {
                        obj[k] = this._schemaToSample(v, depth + 1);
                    });
                }
                return obj;
            case 'array':
                const items = schema.items ? [this._schemaToSample(schema.items, depth + 1)] : [];
                return items;
            case 'string':
                if (schema.enum) return schema.enum[0];
                if (schema.format === 'date-time') return '2024-01-01T00:00:00Z';
                if (schema.format === 'date') return '2024-01-01';
                if (schema.format === 'email') return 'test@example.com';
                return 'string';
            case 'integer': return 0;
            case 'number': return 0.0;
            case 'boolean': return true;
            default: return null;
        }
    },

    _parseFreeText(text) {
        // 按空行分割接口块
        const blocks = text.split(/\n\s*\n/).filter(b => b.trim());
        blocks.forEach(block => {
            const api = this._parseBlock(block.trim());
            if (api) this._apis.push(api);
        });

        // 如果没分出来，尝试按接口方法分割
        if (this._apis.length === 0) {
            const parts = text.split(/\n(?=(?:GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s)/i);
            parts.forEach(part => {
                if (!part.trim()) return;
                const api = this._parseBlock(part.trim());
                if (api) this._apis.push(api);
            });
        }
    },

    _parseBlock(block) {
        const lines = block.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length === 0) return null;

        // 第一行：方法 + 路径 + 描述
        const firstLine = lines[0];
        const methodPathMatch = firstLine.match(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(\S+)\s*(.*)/i);
        if (!methodPathMatch) return null;

        const api = {
            method: methodPathMatch[1].toUpperCase(),
            path: methodPathMatch[2],
            summary: methodPathMatch[3].replace(/^[-–—:\s]+/, '').trim(),
            headers: [],
            queryParams: [],
            pathParams: [],
            body: null,
            response: null,
            responseStatus: 200
        };

        // 解析路径参数
        const pathParamMatches = api.path.match(/\{(\w+)\}/g) || api.path.match(/:(\w+)/g);
        if (pathParamMatches) {
            pathParamMatches.forEach(m => {
                const key = m.replace(/[{}:]/g, '');
                api.pathParams.push({ key: key, value: '1', description: '' });
            });
        }

        // 解析 URL 中的 query 参数
        const qIndex = api.path.indexOf('?');
        if (qIndex > -1) {
            const qs = api.path.slice(qIndex + 1);
            api.path = api.path.slice(0, qIndex);
            qs.split('&').forEach(pair => {
                const [k, v] = pair.split('=');
                if (k) api.queryParams.push({ key: k, value: v || '', description: '', required: false });
            });
        }

        let bodyLines = [];
        let responseLines = [];
        let currentSection = '';

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];

            // 请求头
            const headerMatch = line.match(/^(?:请求头|header)[:：]\s*(.+)/i);
            if (headerMatch) {
                headerMatch[1].split(/[;,]/).forEach(h => {
                    const [k, ...v] = h.trim().split(/[:=]/);
                    if (k) api.headers.push({ key: k.trim(), value: v.join(':').trim(), description: '', required: false });
                });
                continue;
            }

            // 单独的 Header 行
            const singleHeader = line.match(/^(\S+?)[:：]\s*(.+)/);
            const lowerLine = line.toLowerCase();
            if (singleHeader && !currentSection &&
                (lowerLine.includes('content-type') || lowerLine.includes('authorization') ||
                 lowerLine.includes('accept') || lowerLine.includes('cookie') ||
                 lowerLine.includes('x-') || lowerLine.includes('token'))) {
                api.headers.push({ key: singleHeader[1].trim(), value: singleHeader[2].trim(), description: '', required: false });
                continue;
            }

            // 段落切换
            if (/^(?:请求体|request\s*body|body)[:：]/i.test(line)) {
                currentSection = 'body';
                const bodyAfter = line.replace(/^(?:请求体|request\s*body|body)[:：]\s*/i, '').trim();
                if (bodyAfter) bodyLines.push(bodyAfter);
                continue;
            }
            if (/^(?:响应|response|返回)[:：]/i.test(line)) {
                currentSection = 'response';
                const respAfter = line.replace(/^(?:响应|response|返回)[:：]\s*/i, '').trim();
                if (respAfter) responseLines.push(respAfter);
                continue;
            }
            if (/^请求参数[:：]/i.test(line)) {
                currentSection = 'params';
                continue;
            }
            if (/^响应状态[:：]/i.test(line)) {
                const sc = line.match(/(\d{3})/);
                if (sc) api.responseStatus = parseInt(sc[1]);
                continue;
            }

            // 收集内容
            if (currentSection === 'body') {
                bodyLines.push(line);
            } else if (currentSection === 'response') {
                responseLines.push(line);
            } else if (currentSection === 'params') {
                const pm = line.match(/^(\w+)\s*[\(（](.+?)[\)）]/);
                if (pm) {
                    if (line.toLowerCase().includes('header') || line.toLowerCase().includes('请求头')) {
                        api.headers.push({ key: pm[1], value: '', description: pm[2], required: line.includes('必填') });
                    } else {
                        api.queryParams.push({ key: pm[1], value: '', description: pm[2], required: line.includes('必填') });
                    }
                }
            }

            // 如果还没进入 section，检查是否是请求体行
            if (!currentSection && (line.startsWith('{') || line.startsWith('['))) {
                currentSection = 'body';
                bodyLines.push(line);
            }
            if (!currentSection && line.startsWith('{') && i > lines.length / 2) {
                currentSection = 'response';
                responseLines.push(line);
            }
        }

        // 智能识别：如果只有一段 JSON 且在第一行之后较远位置，可能是请求体
        if (!currentSection && bodyLines.length === 0 && responseLines.length === 0) {
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                if (line.startsWith('{') || line.startsWith('[')) {
                    if (['POST','PUT','PATCH'].includes(api.method)) {
                        bodyLines = lines.slice(i);
                    } else {
                        responseLines = lines.slice(i);
                    }
                    break;
                }
            }
        }

        // 解析 body
        if (bodyLines.length > 0) {
            const bodyText = bodyLines.join('');
            try {
                api.body = JSON.parse(bodyText);
            } catch (e) {
                api.body = bodyText;
            }
        }

        // 解析 response
        if (responseLines.length > 0) {
            const respText = responseLines.join('');
            try {
                api.response = JSON.parse(respText);
            } catch (e) {
                api.response = respText;
            }
        }

        return api;
    },

    _genPreRequestScript(api) {
        let script = '';
        const needTimestamp = api.path.includes('timestamp') || api.summary.includes('时间戳') || api.summary.includes('签名');
        const hasAuth = api.headers.some(h => /authorization|token/i.test(h.key));
        const hasPostBody = ['POST','PUT','PATCH'].includes(api.method) && api.body;

        script += '// ===== 预请求脚本 =====\n';

        if (needTimestamp) {
            script += '// 生成时间戳\n';
            script += 'const ts = Math.floor(Date.now() / 1000);\n';
            script += 'pm.variables.set("timestamp", ts);\n';
            script += 'pm.variables.set("timestamp_ms", Date.now());\n\n';
        }

        if (hasAuth) {
            script += '// 设置认证令牌（从环境变量获取，如未设置则警告）\n';
            script += 'const token = pm.environment.get("token") || pm.variables.get("token");\n';
            script += 'if (!token) {\n';
            script += '    console.warn("⚠️ 环境变量 token 未设置，请先执行登录接口获取token");\n';
            script += '}\n\n';
        }

        script += '// 通用请求头\n';
        script += 'pm.request.headers.add({ key: "Content-Type", value: "application/json" });\n';
        script += 'pm.request.headers.add({ key: "Accept", value: "application/json" });\n';
        script += 'pm.request.headers.add({ key: "X-Request-Id", value: "pm-' + api.method.toLowerCase() + '-' + api.path.replace(/[^\w]/g, '-').slice(0, 20) + '-{{$randomUUID}}" });\n\n';

        script += '// 记录请求开始时间（用于性能断言）\n';
        script += 'pm.variables.set("__req_start", Date.now());\n';

        return script;
    },

    _genTestScript(api) {
        let script = '';
        script += '// ===== 测试断言脚本 =====\n\n';

        // 1. 状态码断言
        script += '// ✅ 1. 状态码断言\n';
        script += 'pm.test("状态码为 ' + api.responseStatus + '", function () {\n';
        script += '    pm.response.to.have.status(' + api.responseStatus + ');\n';
        script += '});\n\n';

        // 2. 响应时间断言
        script += '// ⏱️ 2. 响应时间断言\n';
        script += 'pm.test("响应时间 < 2000ms", function () {\n';
        script += '    pm.expect(pm.response.responseTime).to.be.below(2000);\n';
        script += '});\n\n';

        // 3. 响应体结构断言
        script += '// 📦 3. 响应体结构断言\n';
        const resp = api.response;
        if (resp && typeof resp === 'object' && !Array.isArray(resp)) {
            script += 'const jsonData = pm.response.json();\n\n';

            // code 字段
            if ('code' in resp) {
                const codeVal = resp.code;
                script += 'pm.test("code 字段值为 ' + codeVal + '", function () {\n';
                script += '    pm.expect(jsonData.code).to.eql(' + JSON.stringify(codeVal) + ');\n';
                script += '});\n\n';
            }

            // message/msg
            if ('message' in resp || 'msg' in resp) {
                const msgKey = 'message' in resp ? 'message' : 'msg';
                script += 'pm.test("' + msgKey + ' 字段存在且为字符串", function () {\n';
                script += '    pm.expect(jsonData.' + msgKey + ').to.be.a("string");\n';
                script += '});\n\n';
            }

            // data 字段
            if ('data' in resp) {
                const data = resp.data;
                script += '// data 字段断言\n';
                script += 'pm.test("data 字段存在", function () {\n';
                script += '    pm.expect(jsonData).to.have.property("data");\n';
                script += '});\n\n';

                if (data && typeof data === 'object') {
                    if (Array.isArray(data)) {
                        script += 'pm.test("data 为数组类型", function () {\n';
                        script += '    pm.expect(jsonData.data).to.be.an("array");\n';
                        script += '});\n\n';
                    } else {
                        // data 是对象，遍历顶层字段
                        Object.keys(data).forEach((k, i) => {
                            if (i >= 8) return; // 最多 8 个字段
                            const val = data[k];
                            const type = Array.isArray(val) ? 'array' : typeof val;
                            script += 'pm.test("data.' + k + ' 字段存在", function () {\n';
                            script += '    pm.expect(jsonData.data).to.have.property("' + k + '");\n';
                            script += '});\n';
                            // 如果 token 之类的敏感字段，存到环境变量
                            if (/token|access_token|jwt/i.test(k)) {
                                script += '// 保存 token 到环境变量\n';
                                script += 'pm.environment.set("token", jsonData.data.' + k + ');\n';
                            }
                        });
                    }
                }
            }

            // 如果没有 code/data 标准结构，检查顶层字段
            if (!('code' in resp) && !('data' in resp)) {
                script += 'const jsonData = pm.response.json();\n';
                Object.keys(resp).slice(0, 6).forEach(k => {
                    script += 'pm.test("' + k + ' 字段存在", function () {\n';
                    script += '    pm.expect(jsonData).to.have.property("' + k + '");\n';
                    script += '});\n';
                });
            }
        } else {
            script += '// 获取响应体\n';
            script += 'const jsonData = pm.response.json();\n';
            script += 'pm.test("响应体为有效 JSON", function () {\n';
            script += '    pm.expect(jsonData).to.not.be.undefined;\n';
            script += '});\n\n';
        }

        // 4. 响应头断言
        script += '// 📋 4. 响应头断言\n';
        script += 'pm.test("Content-Type 包含 application/json", function () {\n';
        script += '    pm.response.to.have.header("Content-Type");\n';
        script += '    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");\n';
        script += '});\n';

        return script;
    },

    // ===== 规则引擎：根据 OpenAPI Schema 生成结构化测试点 =====
    _genTestPoints(api) {
        const points = [];
        const schema = api._bodySchema;
        const props = schema ? (schema.properties || {}) : {};
        const required = schema ? (schema.required || []) : [];
        const allKeys = Object.keys(props);
        const hasBody = !!schema;
        const hasWriteMethod = ['POST','PUT','PATCH'].includes(api.method);
        const hasPathVars = /\{(\w+)\}/.test(api.path);

        let id = 0;
        const nextId = () => { id++; return 'TP-' + String(id).padStart(3, '0'); };
        const add = (dim, desc, pri, pre, exp, method) => {
            points.push({ id: nextId(), dimension: dim, description: desc, priority: pri, precondition: pre || '无', expected: exp, method: method || '-' });
        };

        // ---------- 1. 功能测试 (P0-P1) ----------
        if (hasWriteMethod && hasBody) {
            // 合法请求（全必填字段）
            const reqFields = required.length > 0 ? required.join(' + ') + '（必填）' : '合法字段';
            add('功能测试', '请求体包含合法' + reqFields + '，验证返回成功', 'P0', '', 'HTTP ' + api.responseStatus + '，返回正确的响应数据', '场景法');

            // 每个必填字段缺失
            required.forEach(f => {
                add('功能测试', '请求体缺少必填字段【' + f + '】，验证接口校验', 'P0', '', 'HTTP 400 或错误码，提示' + f + '为必填字段', '等价类划分法');
            });

            // 全部必填字段缺失
            if (required.length >= 2) {
                add('功能测试', '请求体缺少全部必填字段（' + required.join('/') + '），验证接口逐一校验', 'P1', '', 'HTTP 400，错误信息指出全部缺失的必填字段', '正交实验法');
            }

            // 空请求体
            if (api._bodyRequired) {
                add('功能测试', '请求体为空对象 {}，验证接口处理', 'P1', '', 'HTTP 400，提示请求体不能为空', '错误推测法');
            }

            // 选填字段校验
            const optionalFields = allKeys.filter(k => !required.includes(k));
            if (optionalFields.length > 0) {
                add('功能测试', '只填必填字段（' + (required.length > 0 ? required.join('/') : '无') + '），不填选填字段，验证接口正常处理', 'P1', '', 'HTTP ' + api.responseStatus + '，选填字段允许为空', '等价类划分法');
            }
        } else if (api.method === 'GET') {
            add('功能测试', '发送GET请求获取资源列表/详情，验证返回正确数据', 'P0', '', 'HTTP 200，返回数据结构与文档一致', '场景法');
            if (api.queryParams.length > 0) {
                const reqQs = api.queryParams.filter(q => q.required);
                if (reqQs.length > 0) {
                    reqQs.forEach(q => {
                        add('功能测试', '不传必填Query参数【' + q.key + '】，验证接口返回错误', 'P0', '', 'HTTP 400 或错误码', '等价类划分法');
                    });
                }
            }
        }

        // 路径参数测试
        if (hasPathVars) {
            add('功能测试', '传入有效路径参数值，验证接口正常返回', 'P0', '', 'HTTP ' + api.responseStatus + '，返回对应资源数据', '场景法');
            add('功能测试', '传入不存在的路径参数值（如id=999999），验证404处理', 'P1', '', 'HTTP 404 或相应错误码，提示资源不存在', '错误推测法');
        }

        // ---------- 2. 边界值测试 (P2) ----------
        if (hasWriteMethod && hasBody) {
            allKeys.forEach(fieldName => {
                const prop = props[fieldName];
                const isRequired = required.includes(fieldName);
                const priority = isRequired ? 'P1' : 'P2';

                if (prop.type === 'string') {
                    add('边界值', '字段【' + fieldName + '】传入空字符串 ""', priority, '', '根据业务规则：拒绝并返回400，或接受', '边界值分析法');
                    add('边界值', '字段【' + fieldName + '】传入超长字符串（10000字符）', 'P2', '', '不崩溃，根据业务规则返回400或成功', '边界值分析法');
                    add('边界值', '字段【' + fieldName + '】传入单字符', 'P2', '', '根据业务规则正常处理或拒绝', '边界值分析法');
                    if (prop.format === 'email') {
                        add('边界值', '字段【' + fieldName + '】传入不含@的字符串，验证邮箱格式校验', priority, '', '返回400，提示邮箱格式错误', '边界值分析法');
                        add('边界值', '字段【' + fieldName + '】传入含特殊字符的邮箱', 'P2', '', '根据业务规则：拒绝或接受', '边界值分析法');
                    }
                    if (prop.maxLength) {
                        add('边界值', '字段【' + fieldName + '】传入 maxLength+1 长度字符串', 'P2', '', '返回400，提示超过最大长度限制（' + prop.maxLength + '）', '边界值分析法');
                    }
                    if (prop.minLength) {
                        add('边界值', '字段【' + fieldName + '】传入 minLength-1 长度字符串', 'P2', '', '返回400，提示低于最小长度限制（' + prop.minLength + '）', '边界值分析法');
                    }
                } else if (prop.type === 'number' || prop.type === 'integer') {
                    add('边界值', '字段【' + fieldName + '】传入 0', priority, '', '根据业务规则：接受或返回400', '边界值分析法');
                    add('边界值', '字段【' + fieldName + '】传入负数 -1', priority, '', '根据业务规则：接受或返回400', '边界值分析法');
                    add('边界值', '字段【' + fieldName + '】传入极大值 999999999', 'P2', '', '不崩溃，根据业务规则返回200或400', '边界值分析法');
                    if (prop.type === 'integer') {
                        add('边界值', '字段【' + fieldName + '】传入浮点数（如1.5），验证类型处理', 'P2', '', '根据业务规则：取整处理或返回400', '边界值分析法');
                    }
                    if (prop.minimum !== undefined) {
                        add('边界值', '字段【' + fieldName + '】传入 minimum-1 的值', 'P2', '', '返回400，提示取值不能低于' + prop.minimum, '边界值分析法');
                    }
                    if (prop.maximum !== undefined) {
                        add('边界值', '字段【' + fieldName + '】传入 maximum+1 的值', 'P2', '', '返回400，提示取值不能超过' + prop.maximum, '边界值分析法');
                    }
                } else if (prop.type === 'boolean') {
                    add('边界值', '字段【' + fieldName + '】传入字符串"true"替代boolean类型', 'P2', '', '根据业务规则：类型转换或返回400', '边界值分析法');
                }
            });
        }

        // Query 参数边界值（GET 请求）
        if (api.method === 'GET' && api.queryParams.length > 0) {
            api.queryParams.forEach(q => {
                add('边界值', 'Query参数【' + q.key + '】传入超大页码（如page=99999）', 'P2', '', 'HTTP 200，返回空列表，不崩溃', '边界值分析法');
            });
        }

        // ---------- 3. 异常处理 (P1-P2) ----------
        if (hasWriteMethod && hasBody) {
            add('异常处理', '请求体传入非法JSON（如缺少闭合括号），验证容错能力', 'P1', '', 'HTTP 400，提示请求体格式错误', '错误推测法');
            add('异常处理', 'Content-Type 设置为 text/plain，请求体为JSON，验证接口处理', 'P1', '', 'HTTP 400 或 415 Unsupported Media Type', '错误推测法');
            add('异常处理', '请求体不传 Content-Type 头', 'P1', '', 'HTTP 400 或 415，提示缺少 Content-Type', '错误推测法');

            // 未知字段
            if (allKeys.length > 0) {
                add('异常处理', '请求体额外传入未知字段 extraField: "test"', 'P2', '', '不报错，忽略未知字段；或返回400提示未知字段', '错误推测法');
            }

            // 类型错误
            allKeys.forEach(fieldName => {
                const prop = props[fieldName];
                if (prop.type === 'string') {
                    if (prop.enum) {
                        add('异常处理', '字段【' + fieldName + '】传入不在enum中的值（如"invalid_enum_value"）', 'P1', '', 'HTTP 400，提示值必须在枚举范围内', '错误推测法');
                    } else {
                        add('异常处理', '字段【' + fieldName + '】传入数字类型替代字符串类型', 'P2', '', '根据业务：类型转换或返回400', '错误推测法');
                    }
                } else if (prop.type === 'number' || prop.type === 'integer') {
                    add('异常处理', '字段【' + fieldName + '】传入字符串替代数字类型（如"abc"）', 'P1', '', 'HTTP 400，提示' + fieldName + '应为数字类型', '错误推测法');
                }
            });

            if (api._bodyRequired) {
                add('异常处理', '请求体传入 null', 'P2', '', 'HTTP 400，提示请求体不能为空', '错误推测法');
            }
        }

        // 超时/网络
        add('异常处理', '模拟网络超时场景，设置极短超时时间（如100ms），验证客户端处理', 'P2', '模拟网络慢', '客户端收到超时错误，不会无限等待', '错误推测法');

        // ---------- 4. 安全测试 (P3) ----------
        if (hasWriteMethod && hasBody) {
            allKeys.forEach(fieldName => {
                const prop = props[fieldName];
                if (prop.type === 'string') {
                    add('安全测试', '字段【' + fieldName + '】注入SQL语句（如"DROP TABLE users;--"），验证防注入', 'P3', '', '不执行注入操作，正常创建或返回400', '错误推测法');
                    add('安全测试', '字段【' + fieldName + '】注入XSS脚本（<script>alert(1)</script>），验证输出转义', 'P3', '', '脚本被转义存储/输出，不会被浏览器执行', '错误推测法');
                }
            });
        }
        add('安全测试', '验证接口使用HTTPS加密传输（若baseUrl为http则视环境决定是否拦截）', 'P3', '', '生产环境强制HTTPS', '场景法');

        // ---------- 5. 性能测试 (P3) ----------
        add('性能测试', '单次请求，验证响应时间可接受', 'P3', '', '响应时间 < 2000ms（根据实际业务调整）', '基准测试');
        add('性能测试', '连续发送10次相同请求，验证接口稳定性和响应时间波动', 'P3', '', '无500错误，响应时间无显著递增', '压力测试');
        add('性能测试', '并发发送5个请求，验证接口并发处理能力', 'P3', '', '所有请求正常返回，无死锁或雪崩', '并发测试');

        // ---------- 6. 兼容性测试 (P3) ----------
        add('兼容性测试', '使用不同HTTP客户端（fetch/axios/curl）发送相同请求，验证结果一致性', 'P3', '', '各客户端返回结果一致（状态码、响应体结构）', '对比测试');
        add('兼容性测试', '验证接口在不同Content-Type投递方式下的表现', 'P3', '', '按文档约定的Content-Type正常处理', '对比测试');

        // ---------- 7. 易用性测试 (P3) ----------
        if (hasWriteMethod && hasBody && required.length > 0) {
            add('易用性测试', '缺少必填字段时，验证错误信息是否能明确指出缺失的字段名', 'P3', '', '错误信息具体清晰，如"title为必填字段"', '启发式评估');
        }
        add('易用性测试', '成功响应中是否包含完整的创建/查询数据，便于前端直接使用', 'P3', '', '响应JSON结构完整，含必要字段（如id、创建时间等）', '启发式评估');
        if (hasWriteMethod && hasBody) {
            add('易用性测试', '验证接口错误响应的格式是否统一（code/message/error等规范结构）', 'P3', '', '错误响应有统一的JSON结构', '启发式评估');
        }

        // 统计各维度测试点数量，附加到API
        api._testPoints = points;
        return points;
    },

    _render() {
        const container = document.getElementById('pm-output');
        if (this._apis.length === 0) {
            container.innerHTML = '<div class="pm-placeholder">粘贴接口文档后点击「生成接口测试用例」或「生成Postman脚本」</div>';
            return;
        }

        const showCases = this._mode === 'cases';
        const showScripts = this._mode === 'scripts';

        // 统计
        const methodCounts = {};
        this._apis.forEach(a => { methodCounts[a.method] = (methodCounts[a.method] || 0) + 1; });

        let html = '<div class="pm-summary-bar">';
        html += '<span class="pm-stat-badge">📡 接口总数: ' + this._apis.length + '</span>';
        Object.entries(methodCounts).forEach(([m, c]) => {
            const colorMap = { GET: 'var(--success)', POST: 'var(--warning)', PUT: 'var(--primary)', DELETE: 'var(--danger)', PATCH: '#8b5cf6' };
            html += '<span class="pm-stat-badge" style="border-left:3px solid ' + (colorMap[m] || 'var(--text-light)') + '">' + m + ': ' + c + '</span>';
        });

        // cases 模式：统计测试点
        if (showCases) {
            let totalPoints = 0;
            const dimCounts = {};
            const priorityCounts = {};
            this._apis.forEach(api => {
                const pts = this._genTestPoints(api);
                totalPoints += pts.length;
                pts.forEach(p => {
                    dimCounts[p.dimension] = (dimCounts[p.dimension] || 0) + 1;
                    priorityCounts[p.priority] = (priorityCounts[p.priority] || 0) + 1;
                });
            });
            html += '<span class="pm-stat-badge" style="border-left:3px solid #10b981">📋 测试点总数: ' + totalPoints + '</span>';
            html += '<span class="pm-stat-badge" style="border-left:3px solid #ef4444">P0: ' + (priorityCounts['P0'] || 0) + '</span>';
            html += '<span class="pm-stat-badge" style="border-left:3px solid #f59e0b">P1: ' + (priorityCounts['P1'] || 0) + '</span>';
            html += '<span class="pm-stat-badge" style="border-left:3px solid #6366f1">P2: ' + (priorityCounts['P2'] || 0) + '</span>';
            html += '<span class="pm-stat-badge" style="border-left:3px solid #94a3b8">P3: ' + (priorityCounts['P3'] || 0) + '</span>';
            html += '<span class="pm-stat-badge pm-stat-dim">' + Object.keys(dimCounts).length + ' 个测试维度</span>';
        }
        html += '</div>';

        html += '<div class="pm-api-list">';
        this._apis.forEach((api, idx) => {
            const methodClass = 'pm-method-' + api.method.toLowerCase();
            const apiId = 'pm-api-' + idx;
            const preScript = this._genPreRequestScript(api);
            const testScript = this._genTestScript(api);

            html += '<div class="pm-api-card">';
            html += '<div class="pm-api-header" onclick="tool_postman._toggle(\'' + apiId + '\')">';
            html += '<span class="pm-arrow" id="' + apiId + '-arrow">▶</span>';
            html += '<span class="pm-method ' + methodClass + '">' + api.method + '</span>';
            html += '<span class="pm-path">' + this._escape(api.path) + '</span>';
            if (api.summary) html += '<span class="pm-summary">' + this._escape(api.summary) + '</span>';
            let hintText = '';
            if (showCases) {
                const pts = this._genTestPoints(api);
                hintText = pts.length + ' 个测试点';
            } else {
                hintText = '点击展开脚本';
            }
            html += '<span class="pm-expand-hint">' + hintText + '</span>';
            html += '</div>';

            html += '<div class="pm-api-detail" id="' + apiId + '" style="display:none">';

            // cases 模式：测试点表格
            if (showCases) {
                const points = this._genTestPoints(api);

                // 维度分组统计
                const dimSum = {};
                points.forEach(p => { dimSum[p.dimension] = (dimSum[p.dimension] || 0) + 1; });

                // 请求摘要
                html += '<div class="tp-info-bar">';
                if (api._bodySchema) {
                    const reqFields = api._bodySchema.required || [];
                    const keys = Object.keys(api._bodySchema.properties || {});
                    html += '<span><b>必填字段：</b>' + (reqFields.length > 0 ? reqFields.join(', ') : '无') + '</span>';
                    html += '<span><b>可选字段：</b>' + keys.filter(k => !reqFields.includes(k)).join(', ') || '无' + '</span>';
                }
                html += '<span><b>成功响应：</b>HTTP ' + api.responseStatus + '</span>';
                if (api._responseCodes && api._responseCodes.filter(c => !c.startsWith('2')).length > 0) {
                    html += '<span><b>错误码：</b>' + api._responseCodes.filter(c => !c.startsWith('2')).join(', ') + '</span>';
                }
                html += '</div>';

                // 维度分布
                html += '<div class="tp-dim-bar">';
                const dimOrder = ['功能测试', '边界值', '异常处理', '安全', '性能', '兼容性', '易用性'];
                dimOrder.forEach(d => {
                    if (dimSum[d]) {
                        html += '<span class="tp-dim-tag tp-dim-' + d + '">' + d + ' ×' + dimSum[d] + '</span>';
                    }
                });
                html += '</div>';

                // 测试点表格（带分页）
                const totalPageCount = Math.ceil(points.length / this._pageSize);
                let apiPage = this._pageStates[idx] || 1;
                if (apiPage > totalPageCount) { apiPage = totalPageCount; this._pageStates[idx] = apiPage; }
                if (apiPage < 1) { apiPage = 1; this._pageStates[idx] = 1; }
                const startIdx = (apiPage - 1) * this._pageSize;
                const pagePoints = points.slice(startIdx, startIdx + this._pageSize);

                html += '<div class="tp-table-wrap">';
                html += '<table class="tp-table">';
                html += '<thead><tr>';
                html += '<th class="tp-col-id">编号</th><th class="tp-col-dim">维度</th><th class="tp-col-desc">测试点描述</th>';
                html += '<th class="tp-col-pri">优先级</th><th class="tp-col-pre">前置条件</th><th class="tp-col-exp">预期结果</th><th class="tp-col-method">方法</th>';
                html += '</tr></thead><tbody>';

                pagePoints.forEach(p => {
                    const priClass = 'tp-pri-' + p.priority.toLowerCase();
                    html += '<tr>';
                    html += '<td class="tp-col-id">' + p.id + '</td>';
                    html += '<td class="tp-col-dim"><span class="tp-dim-' + p.dimension + '">' + p.dimension + '</span></td>';
                    html += '<td class="tp-col-desc">' + this._escape(p.description) + '</td>';
                    html += '<td class="tp-col-pri"><span class="' + priClass + '">' + p.priority + '</span></td>';
                    html += '<td class="tp-col-pre">' + this._escape(p.precondition) + '</td>';
                    html += '<td class="tp-col-exp">' + this._escape(p.expected) + '</td>';
                    html += '<td class="tp-col-method">' + p.method + '</td>';
                    html += '</tr>';
                });

                html += '</tbody></table>';
                html += '</div>';

                // 分页控件
                if (totalPageCount > 1) {
                    html += '<div class="tp-pagination">';
                    html += '<span class="tp-pg-info">共 ' + points.length + ' 条，第 ' + apiPage + '/' + totalPageCount + ' 页</span>';
                    html += '<div class="tp-pg-btns">';
                    html += '<button class="tp-pg-btn" onclick="tool_postman._goToPage(' + idx + ',1)" ' + (apiPage === 1 ? 'disabled' : '') + ' title="首页">&laquo;</button>';
                    html += '<button class="tp-pg-btn" onclick="tool_postman._goToPage(' + idx + ',' + (apiPage - 1) + ')" ' + (apiPage === 1 ? 'disabled' : '') + ' title="上一页">&lsaquo;</button>';

                    const maxVisible = 5;
                    let pgStart = Math.max(1, apiPage - Math.floor(maxVisible / 2));
                    let pgEnd = Math.min(totalPageCount, pgStart + maxVisible - 1);
                    if (pgEnd - pgStart < maxVisible - 1) {
                        pgStart = Math.max(1, pgEnd - maxVisible + 1);
                    }
                    for (let p = pgStart; p <= pgEnd; p++) {
                        html += '<button class="tp-pg-btn tp-pg-num' + (p === apiPage ? ' active' : '') + '" onclick="tool_postman._goToPage(' + idx + ',' + p + ')">' + p + '</button>';
                    }

                    html += '<button class="tp-pg-btn" onclick="tool_postman._goToPage(' + idx + ',' + (apiPage + 1) + ')" ' + (apiPage === totalPageCount ? 'disabled' : '') + ' title="下一页">&rsaquo;</button>';
                    html += '<button class="tp-pg-btn" onclick="tool_postman._goToPage(' + idx + ',' + totalPageCount + ')" ' + (apiPage === totalPageCount ? 'disabled' : '') + ' title="末页">&raquo;</button>';
                    html += '</div>';
                    html += '<select class="tp-pg-size" onchange="tool_postman._changePageSize(' + idx + ',this.value)">';
                    [50, 110, 200, 500].forEach(s => {
                        html += '<option value="' + s + '"' + (this._pageSize === s ? ' selected' : '') + '>每页 ' + s + ' 条</option>';
                    });
                    html += '</select>';
                    html += '</div>';
                }

                // 测试方法说明
                const allMethods = [...new Set(points.map(p => p.method).filter(m => m !== '-'))];
                if (allMethods.length > 0) {
                    html += '<div class="tp-method-note"><b>测试设计方法：</b>' + allMethods.join('、') + '</div>';
                }
            }

            // scripts 模式
            if (showScripts) {
                html += '<div class="pm-detail-section">';
                html += '<div class="pm-detail-title">⚡ Pre-request Script</div>';
                html += '<div class="pm-detail-content">';
                html += '<div class="pm-code-wrap"><pre class="pm-code"><code>' + this._escape(preScript) + '</code></pre>';
                html += '<button class="btn btn-small btn-outline pm-copy-btn" onclick="tool_postman._copyCode(this, \'' + apiId + '-pre\')">📋 复制</button>';
                html += '</div></div></div>';

                html += '<div class="pm-detail-section">';
                html += '<div class="pm-detail-title">🧪 Tests 脚本</div>';
                html += '<div class="pm-detail-content">';
                html += '<div class="pm-code-wrap"><pre class="pm-code"><code>' + this._escape(testScript) + '</code></pre>';
                html += '<button class="btn btn-small btn-outline pm-copy-btn" onclick="tool_postman._copyCode(this, \'' + apiId + '-test\')">📋 复制</button>';
                html += '</div></div></div>';
            }

            html += '<textarea style="display:none" id="' + apiId + '-pre">' + this._escape(preScript) + '</textarea>';
            html += '<textarea style="display:none" id="' + apiId + '-test">' + this._escape(testScript) + '</textarea>';

            html += '</div></div>';
        });
        html += '</div>';

        container.innerHTML = html;

        // 恢复展开状态
        this._expandedApis.forEach(idx => {
            const detail = document.getElementById('pm-api-' + idx);
            const arrow = document.getElementById('pm-api-' + idx + '-arrow');
            if (detail) { detail.style.display = 'block'; }
            if (arrow) { arrow.textContent = '▼'; }
        });
    },

    _toggle(apiId) {
        const detail = document.getElementById(apiId);
        const arrow = document.getElementById(apiId + '-arrow');
        const idx = parseInt(apiId.replace('pm-api-', ''));
        if (detail.style.display === 'none') {
            detail.style.display = 'block';
            arrow.textContent = '▼';
            this._expandedApis.add(idx);
        } else {
            detail.style.display = 'none';
            arrow.textContent = '▶';
            this._expandedApis.delete(idx);
        }
    },

    _goToPage(apiIdx, page) {
        this._pageStates[apiIdx] = page;
        this._render();
    },

    _changePageSize(apiIdx, size) {
        this._pageSize = parseInt(size);
        this._pageStates = {};
        this._render();
    },

    _copyCode(btn, textareaId) {
        const textarea = document.getElementById(textareaId);
        if (!textarea) return;
        const text = textarea.value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        navigator.clipboard.writeText(text).then(() => {
            const orig = btn.textContent;
            btn.textContent = '✅ 已复制';
            btn.style.color = 'var(--success)';
            setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 1500);
        });
    },

    exportCollection() {
        if (this._apis.length === 0) { showToast('请先生成脚本'); return; }

        const items = this._apis.map((api, idx) => {
            const item = {
                name: (api.summary || api.path) + ' - ' + api.method,
                request: {
                    method: api.method,
                    header: [],
                    url: {
                        raw: '{{baseUrl}}' + api.path,
                        host: ['{{baseUrl}}'],
                        path: api.path.split('/').filter(Boolean)
                    },
                    description: api.summary || ''
                },
                response: []
            };

            // Headers
            const hasJson = ['POST','PUT','PATCH'].includes(api.method) && typeof api.body === 'object';
            if (hasJson) {
                item.request.header.push({ key: 'Content-Type', value: 'application/json' });
            }
            item.request.header.push({ key: 'Accept', value: 'application/json' });
            api.headers.forEach(h => {
                item.request.header.push({ key: h.key, value: h.value });
            });

            // URL params
            if (api.queryParams.length > 0) {
                item.request.url.query = api.queryParams.map(q => ({ key: q.key, value: q.value }));
                item.request.url.raw += '?' + api.queryParams.map(q => q.key + '=' + q.value).join('&');
            }

            // Path variables
            if (api.pathParams.length > 0) {
                item.request.url.variable = api.pathParams.map(p => ({ key: p.key, value: p.value }));
            }

            // Body
            if (['POST','PUT','PATCH'].includes(api.method) && api.body) {
                item.request.body = {
                    mode: 'raw',
                    raw: JSON.stringify(api.body, null, 2),
                    options: { raw: { language: 'json' } }
                };
            }

            // 预请求脚本
            item.event = [];
            item.event.push({
                listen: 'prerequest',
                script: {
                    type: 'text/javascript',
                    exec: this._genPreRequestScript(api).split('\n')
                }
            });

            // 测试脚本
            item.event.push({
                listen: 'test',
                script: {
                    type: 'text/javascript',
                    exec: this._genTestScript(api).split('\n')
                }
            });

            return item;
        });

        const collection = {
            info: {
                name: 'API 测试集合',
                description: '由测试工具箱自动生成',
                schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
            },
            item: items,
            variable: [
                { key: 'baseUrl', value: 'http://localhost:8080' },
                { key: 'token', value: '' }
            ]
        };

        this._downloadJSON(collection, 'postman_collection.json');
        showToast('Postman Collection 已下载');
    },

    exportEnv() {
        const envVars = [];
        this._apis.forEach(api => {
            api.headers.forEach(h => {
                if (h.value && h.value.match(/\{\{(\w+)\}\}/) && !envVars.find(v => v.key === RegExp.$1)) {
                    envVars.push({ key: RegExp.$1, value: '' });
                }
            });
        });

        if (envVars.length === 0) {
            envVars.push({ key: 'baseUrl', value: 'http://localhost:8080' });
            envVars.push({ key: 'token', value: '' });
        }

        const environment = {
            name: 'API 测试环境',
            values: envVars.map(v => ({
                key: v.key,
                value: v.value,
                type: 'default',
                enabled: true
            })),
            _postman_variable_scope: 'environment'
        };

        this._downloadJSON(environment, 'postman_environment.json');
        showToast('Postman 环境变量文件已下载');
    },

    _downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    _escape(s) {
        if (typeof s !== 'string') s = String(s);
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    exportTestCasesCSV() {
        if (this._apis.length === 0) { showToast('请先生成测试用例'); return; }

        const csvHeader = '编号,接口,维度,测试点描述,优先级,前置条件,预期结果,测试方法';
        const csvRows = [csvHeader];

        this._apis.forEach(api => {
            const points = this._genTestPoints(api);
            const escapeCsv = v => '\"' + String(v || '').replace(/\"/g, '\"\"') + '\"';
            points.forEach(p => {
                const row = [
                    p.id,
                    escapeCsv(api.method + ' ' + api.path),
                    p.dimension,
                    escapeCsv(p.description),
                    p.priority,
                    escapeCsv(p.precondition),
                    escapeCsv(p.expected),
                    p.method
                ];
                csvRows.push(row.join(','));
            });
        });

        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = 'test-cases.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('CSV 已下载');
    },

    clear() {
        document.getElementById('pm-input').value = '';
        document.getElementById('pm-output').innerHTML = '<div class="pm-placeholder">粘贴接口文档后点击「生成测试用例」或「生成Postman脚本」</div>';
        document.getElementById('pm-status').textContent = '';
        this._apis = [];
        this._mode = null;
        this._pageStates = {};
        this._expandedApis = new Set();
    }
};

// ===== 工具：简单接口测试 =====
const tool_apitest = {
    _headers: [{ key: 'Content-Type', value: 'application/json' }],

    send() {
        const method = document.getElementById('api-method').value;
        const url = document.getElementById('api-url').value.trim();
        const bodyText = document.getElementById('api-body').value.trim();
        const statusEl = document.getElementById('api-status');
        const responseArea = document.getElementById('api-response-area');

        if (!url) { showToast('请输入接口地址'); return; }

        // 收集请求头
        const headers = {};
        const headerRows = document.querySelectorAll('#api-headers .api-header-row');
        headerRows.forEach(row => {
            const keyEl = row.querySelector('.api-header-key');
            const valEl = row.querySelector('.api-header-value');
            if (keyEl && valEl) {
                const k = keyEl.value.trim();
                const v = valEl.value.trim();
                if (k) headers[k] = v;
            }
        });

        // 构建请求配置
        const fetchOptions = {
            method: method,
            headers: headers
        };

        if (['POST', 'PUT', 'PATCH'].includes(method) && bodyText) {
            fetchOptions.body = bodyText;
        }

        // 显示 loading
        statusEl.textContent = '⏳ 请求中...';
        statusEl.className = 'toolbar-status';
        responseArea.style.display = 'block';
        document.getElementById('api-response-body').textContent = '请求中...';
        document.getElementById('api-response-meta').innerHTML = '';
        document.getElementById('api-response-time').textContent = '';

        const startTime = Date.now();

        // 发送请求
        fetch(url, fetchOptions)
            .then(async (res) => {
                const elapsed = Date.now() - startTime;
                const contentType = res.headers.get('content-type') || '';
                const status = res.status;
                const statusText = res.statusText;

                let resBody;
                if (contentType.includes('application/json')) {
                    try {
                        resBody = JSON.stringify(await res.json(), null, 2);
                    } catch (e) {
                        resBody = await res.text();
                    }
                } else {
                    resBody = await res.text();
                }

                // 状态标记
                statusEl.textContent = status >= 200 && status < 300 ? '✅ 请求成功' : '⚠️ 请求完成';
                statusEl.className = 'toolbar-status ' + (status >= 200 && status < 300 ? 'success' : 'error');

                document.getElementById('api-response-time').textContent = elapsed + 'ms';

                // 元信息
                let metaHTML = '<span class="api-status-code ' + (status >= 200 && status < 300 ? 'api-status-ok' : 'api-status-err') + '">' + status + ' ' + statusText + '</span>';
                document.getElementById('api-response-meta').innerHTML = metaHTML;

                document.getElementById('api-response-body').textContent = resBody;
            })
            .catch((err) => {
                const elapsed = Date.now() - startTime;
                statusEl.textContent = '❌ 请求失败';
                statusEl.className = 'toolbar-status error';

                document.getElementById('api-response-time').textContent = elapsed + 'ms';
                document.getElementById('api-response-meta').innerHTML = '<span class="api-status-code api-status-err">请求失败</span>';
                document.getElementById('api-response-body').textContent = err.message + '\n\n提示：浏览器端请求可能受 CORS 策略限制，请确保接口允许跨域访问。';
            });
    },

    _addHeaderRow() {
        const container = document.getElementById('api-headers');
        const row = document.createElement('div');
        row.className = 'api-header-row';
        row.innerHTML = `
            <input type="text" class="api-header-key" placeholder="Header Key">
            <input type="text" class="api-header-value" placeholder="Header Value">
            <button class="api-header-remove" onclick="tool_apitest._removeHeaderRow(this)" title="删除">×</button>
        `;
        container.appendChild(row);
    },

    _removeHeaderRow(btn) {
        const container = document.getElementById('api-headers');
        if (container.querySelectorAll('.api-header-row').length <= 1) {
            showToast('至少保留一个请求头');
            return;
        }
        btn.parentElement.remove();
    },

    generateOpenAPI() {
        try {
            this._doGenerateOpenAPI();
        } catch (e) {
            console.error('生成OpenAPI失败:', e);
            showToast('生成失败：' + (e.message || '未知错误'));
        }
    },

    _doGenerateOpenAPI() {
        const methodEl = document.getElementById('api-method');
        const urlEl = document.getElementById('api-url');
        const bodyEl = document.getElementById('api-body');
        if (!methodEl || !urlEl || !bodyEl) { showToast('页面元素未就绪，请刷新页面'); return; }

        const method = methodEl.value.toLowerCase();
        const urlStr = urlEl.value.trim();
        const bodyText = bodyEl.value.trim();

        if (!urlStr) { showToast('请先输入接口地址'); return; }

        // 解析 URL（兼容无协议头的输入）
        let url;
        try {
            url = new URL(urlStr.startsWith('http') ? urlStr : 'http://' + urlStr);
        } catch (e) {
            showToast('接口地址格式不正确'); return;
        }

        const host = url.host;
        const path = url.pathname + url.search;
        const scheme = url.protocol.replace(':', '');

        // 收集请求头
        const headers = {};
        const headerRows = document.querySelectorAll('#api-headers .api-header-row');
        if (headerRows && headerRows.length > 0) {
            headerRows.forEach(row => {
                const keyEl = row.querySelector('.api-header-key');
                const valEl = row.querySelector('.api-header-value');
                if (keyEl && valEl) {
                    const k = keyEl.value.trim();
                    const v = valEl.value.trim();
                    if (k) headers[k] = v;
                }
            });
        }

        // 提取 tag（路径第一段作为分组）
        const cleanPath = url.pathname.replace(/^\/+|\/+$/g, '');
        const pathParts = cleanPath ? cleanPath.split('/') : [];
        const tagName = pathParts[0] || 'default';
        const opId = (method + '_' + (cleanPath || 'root').replace(/[^a-zA-Z0-9]/g, '_')).replace(/__+/g, '_').replace(/^_|_$/g, '');

        // 构建 OpenAPI 3.0 文档
        const pathObj = {};
        pathObj[method] = {
            tags: [tagName],
            summary: opId.replace(/_/g, ' '),
            operationId: opId,
            responses: {
                '200': { description: '成功响应', content: {} },
                '400': { description: '请求参数错误' },
                '500': { description: '服务器内部错误' }
            }
        };

        // 提取 query 参数（兼容不支持 forEach 的环境）
        const params = [];
        if (url.searchParams && typeof url.searchParams.forEach === 'function') {
            url.searchParams.forEach((value, key) => {
                params.push({ name: key, in: 'query', schema: { type: 'string', example: value || '' }, description: '' });
            });
        } else if (url.search) {
            // 兼容旧浏览器
            url.search.replace(/^\?/, '').split('&').forEach(pair => {
                if (!pair) return;
                const [key, val] = pair.split('=');
                if (key) params.push({ name: decodeURIComponent(key), in: 'query', schema: { type: 'string', example: decodeURIComponent(val || '') }, description: '' });
            });
        }
        if (params.length > 0) pathObj[method].parameters = params;

        // 路径参数
        url.pathname.split('/').forEach(seg => {
            if (seg.startsWith('{') && seg.endsWith('}')) {
                const paramName = seg.slice(1, -1);
                pathObj[method].parameters = pathObj[method].parameters || [];
                if (!pathObj[method].parameters.some(p => p.name === paramName)) {
                    pathObj[method].parameters.push({
                        name: paramName, in: 'path', required: true,
                        schema: { type: 'string' }, description: ''
                    });
                }
            }
        });

        // 请求体
        if (['post', 'put', 'patch'].includes(method) && bodyText) {
            let schema;
            try {
                const bodyJson = JSON.parse(bodyText);
                schema = this._inferSchema(bodyJson);
            } catch (e) {
                schema = { type: 'string', example: bodyText };
            }
            pathObj[method].requestBody = {
                required: true,
                content: {}
            };
            const ct = headers['Content-Type'] || headers['content-type'] || 'application/json';
            pathObj[method].requestBody.content[ct] = { schema: schema };
        }

        // 构建完整文档
        const openapi = {
            openapi: '3.0.3',
            info: {
                title: tagName + ' API',
                description: '接口描述（请根据实际情况修改）',
                version: '1.0.0'
            },
            servers: [{ url: scheme + '://' + host, description: host }],
            paths: {}
        };
        openapi.paths[path] = pathObj;

        // 显示结果
        const output = document.getElementById('api-openapi-output');
        const area = document.getElementById('api-openapi-area');
        if (!output || !area) { showToast('页面元素未就绪，请刷新页面'); return; }

        output.textContent = JSON.stringify(openapi, null, 2);
        area.style.display = 'block';
        try { area.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
    },

    _copyOpenAPI() {
        try {
            const el = document.getElementById('api-openapi-output');
            if (!el) { showToast('请先生成OpenAPI文档'); return; }
            navigator.clipboard.writeText(el.textContent).then(
                () => showToast('已复制到剪贴板'),
                () => showToast('复制失败，请手动复制')
            );
        } catch (e) { showToast('复制失败'); }
    },

    _downloadOpenAPI() {
        try {
            const el = document.getElementById('api-openapi-output');
            if (!el) { showToast('请先生成OpenAPI文档'); return; }
            const blob = new Blob([el.textContent], { type: 'application/json;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'openapi.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        } catch (e) { showToast('下载失败'); }
    },

    _inferSchema(obj) {
        if (Array.isArray(obj)) {
            if (obj.length > 0) return { type: 'array', items: this._inferSchema(obj[0]) };
            return { type: 'array', items: { type: 'string' } };
        }
        if (typeof obj === 'object' && obj !== null) {
            const props = {}, required = [];
            Object.keys(obj).forEach(key => {
                const value = obj[key];
                props[key] = this._inferSchema(value);
                if (value !== null && value !== undefined) required.push(key);
            });
            const result = { type: 'object', properties: props };
            if (required.length > 0) result.required = required;
            return result;
        }
        if (obj === null) return { type: 'string', nullable: true };
        const typeMap = { 'string': 'string', 'number': 'number', 'boolean': 'boolean' };
        const schemaType = typeMap[typeof obj] || 'string';
        return { type: schemaType, example: obj !== undefined ? obj : '' };
    },

    clear() {
        document.getElementById('api-url').value = '';
        document.getElementById('api-body').value = '';
        document.getElementById('api-method').value = 'GET';
        document.getElementById('api-status').textContent = '';
        document.getElementById('api-status').className = 'toolbar-status';
        document.getElementById('api-response-area').style.display = 'none';
        document.getElementById('api-openapi-area').style.display = 'none';

        // 重置请求头
        const container = document.getElementById('api-headers');
        container.innerHTML = `
            <div class="api-header-row">
                <input type="text" class="api-header-key" placeholder="Header Key" value="Content-Type">
                <input type="text" class="api-header-value" placeholder="Header Value" value="application/json">
                <button class="api-header-remove" onclick="tool_apitest._removeHeaderRow(this)" title="删除">×</button>
            </div>
        `;
    }
};

// ===== 初始化 =====
tool_timestamp.init();

// ===== 正则实时测试 =====
['regex-pattern','regex-input'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        if (document.getElementById('regex-pattern').value.trim() && document.getElementById('regex-input').value) {
            tool_regex.test();
        }
    });
});

// ===== 复选框变化自动重新匹配 =====
['regex-global','regex-ignore','regex-multiline'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
        if (document.getElementById('regex-pattern').value.trim() && document.getElementById('regex-input').value) {
            tool_regex.test();
        }
    });
});
