export default async function run(page) {
  const errors = [];
  let current = 'initial';
  page.on('pageerror', e => errors.push({ tab: current, err: String(e).slice(0, 300) }));
  page.on('console', m => { if (m.type() === 'error') errors.push({ tab: current, err: m.text().slice(0, 300) }); });
  const tabs = ['2D MEA Grid','3D Spatial View','Wetware Experiments','Stimulation Workbench','Neural Analytics','SQL & Datasets','Maze & Pathfinding','Math Teaching','Neurocognitive AI','Python SDK Runner','CL1 Visualizer','Research Library','Settings & Menus'];
  const results = {};
  for (const t of tabs) {
    current = t;
    try {
      await page.getByText(t, { exact: true }).first().click({ timeout: 5000, force: true });
      await page.waitForTimeout(1500);
      results[t] = await page.evaluate(() => document.body.innerText.length);
    } catch (e) { results[t] = 'CLICK FAIL: ' + String(e).slice(0, 120); }
  }
  return { results, errors };
}
