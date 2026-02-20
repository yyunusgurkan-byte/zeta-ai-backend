// backend/tools/packageAnalyzer.js
const axios = require('axios');

const NPM_REGISTRY = 'https://registry.npmjs.org';

const checkPackage = async (name, requestedRange) => {
  try {
    const res = await axios.get(`${NPM_REGISTRY}/${encodeURIComponent(name)}`, {
      timeout: 6000,
      headers: { 'Accept': 'application/vnd.npm.install-v1+json' },
    });

    const data = res.data;
    const latestVersion = data['dist-tags']?.latest || null;
    const allVersions = Object.keys(data.versions || {});
    const cleaned = requestedRange.replace(/[\^~>=<]/g, '').trim();
    const exactExists = allVersions.includes(cleaned);
    const compatible = findCompatible(allVersions, requestedRange, cleaned);

    return {
      name,
      requested: requestedRange,
      requestedClean: cleaned,
      latest: latestVersion,
      exactExists,
      compatible,
      status: getStatus(exactExists, compatible, cleaned, latestVersion),
    };
  } catch (err) {
    if (err.response?.status === 404) {
      return { name, requested: requestedRange, status: 'NOT_FOUND', error: 'Paket bulunamadı' };
    }
    return { name, requested: requestedRange, status: 'ERROR', error: err.message };
  }
};

const semverSort = (a, b) => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
};

const findCompatible = (allVersions, range, cleaned) => {
  const [major, minor] = cleaned.split('.').map(Number);
  const stable = allVersions.filter(v => !v.includes('-'));

  if (range.startsWith('^')) {
    const matches = stable.filter(v => v.split('.').map(Number)[0] === major);
    return matches.sort(semverSort).at(-1) || null;
  }
  if (range.startsWith('~')) {
    const matches = stable.filter(v => {
      const [vM, vm] = v.split('.').map(Number);
      return vM === major && vm === minor;
    });
    return matches.sort(semverSort).at(-1) || null;
  }
  return stable.includes(cleaned) ? cleaned : null;
};

const getStatus = (exactExists, compatible, cleaned, latest) => {
  if (!exactExists && !compatible) return 'VERSION_NOT_FOUND';
  if (!exactExists && compatible)  return 'VERSION_RESOLVED';
  if (exactExists && cleaned !== latest) return 'OUTDATED';
  if (exactExists && cleaned === latest) return 'OK';
  return 'UNKNOWN';
};

const buildSummary = ({ critical, warnings, outdated, notFound, ok, results }) => {
  const lines = [`📦 **${results.length} paket analiz edildi**\n`];

  if (critical.length > 0) {
    lines.push(`🔴 **Kritik Hatalar (${critical.length})** — npm install çalışmaz:\n`);
    critical.forEach(r => {
      lines.push(`  • \`${r.name}@${r.requested}\` → Bu versiyon **mevcut değil**!`);
      if (r.compatible) lines.push(`    ✅ Önerilen: \`${r.name}@^${r.compatible}\``);
    });
    lines.push('');
  }
  if (notFound.length > 0) {
    lines.push(`❌ **Bulunamayan Paketler (${notFound.length})**:\n`);
    notFound.forEach(r => lines.push(`  • \`${r.name}\` — npm'de kayıtlı değil`));
    lines.push('');
  }
  if (outdated.length > 0) {
    lines.push(`🟠 **Güncel Olmayan Paketler (${outdated.length})**:\n`);
    outdated.forEach(r => lines.push(`  • \`${r.name}@${r.requestedClean}\` → Son sürüm: \`${r.latest}\``));
    lines.push('');
  }
  if (warnings.length > 0) {
    lines.push(`🟡 **Uyarılar (${warnings.length})**:\n`);
    warnings.forEach(r => lines.push(`  • \`${r.name}@${r.requested}\` → npm \`${r.compatible}\` kullanacak`));
    lines.push('');
  }
  if (ok.length > 0 && critical.length === 0) {
    lines.push(`✅ **${ok.length} paket sorunsuz**`);
  }
  return lines.join('\n');
};

const buildFixed = (original, results) => {
  const fixed = JSON.parse(JSON.stringify(original));
  results.forEach(r => {
    if (r.status === 'VERSION_NOT_FOUND' && r.compatible) {
      const prefix = r.requested.startsWith('^') ? '^' : r.requested.startsWith('~') ? '~' : '';
      const fixedVersion = `${prefix}${r.compatible}`;
      if (fixed.dependencies?.[r.name])    fixed.dependencies[r.name] = fixedVersion;
      if (fixed.devDependencies?.[r.name]) fixed.devDependencies[r.name] = fixedVersion;
    }
  });
  return fixed;
};

const analyzePackageJson = async (packageJsonContent) => {
  let parsed;
  try {
    parsed = typeof packageJsonContent === 'string'
      ? JSON.parse(packageJsonContent)
      : packageJsonContent;
  } catch {
    return { success: false, error: 'Geçersiz JSON formatı' };
  }

  const deps = { ...(parsed.dependencies || {}), ...(parsed.devDependencies || {}) };
  const entries = Object.entries(deps);
  if (entries.length === 0) return { success: true, results: [], summary: 'Bağımlılık bulunamadı.' };

  console.log(`[PackageAnalyzer] ${entries.length} paket kontrol ediliyor...`);

  const results = [];
  const chunkSize = 5;
  for (let i = 0; i < entries.length; i += chunkSize) {
    const chunk = entries.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(([name, version]) => checkPackage(name, version))
    );
    results.push(...chunkResults);
  }

  const critical = results.filter(r => r.status === 'VERSION_NOT_FOUND');
  const warnings  = results.filter(r => r.status === 'VERSION_RESOLVED');
  const outdated  = results.filter(r => r.status === 'OUTDATED');
  const notFound  = results.filter(r => r.status === 'NOT_FOUND');
  const ok        = results.filter(r => r.status === 'OK');

  return {
    success: true,
    results,
    stats: { total: results.length, critical: critical.length, warnings: warnings.length, outdated: outdated.length, notFound: notFound.length, ok: ok.length },
    summary: buildSummary({ critical, warnings, outdated, notFound, ok, results }),
    fixedPackageJson: buildFixed(parsed, results),
  };
};

const packageAnalyzerHandler = async (req, res) => {
  try {
    const { content, json } = req.body;
    const input = json || content;
    if (!input) return res.status(400).json({ error: 'package.json içeriği gerekli' });
    const result = await analyzePackageJson(input);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { analyzePackageJson, packageAnalyzerHandler };
