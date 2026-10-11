// 验证 BanStep 的筛选逻辑（与组件内 useMemo 逻辑一致）
type Lineup = {
  id: string;
  name: string;
  tier: 'T0' | 'T1' | 'T2';
  fitType: '经济运营型' | '战斗增益型';
  coreHeroes: string[];
  lateHeroes?: string[];
};

const lineups: Lineup[] = [
  { id: 'a', name: '三分倒转流', tier: 'T0', fitType: '经济运营型', coreHeroes: ['曹操', '甄姬'], lateHeroes: ['露娜'] },
  { id: 'b', name: '复活木兰拉扯流', tier: 'T0', fitType: '战斗增益型', coreHeroes: ['花木兰'], lateHeroes: [] },
  { id: 'c', name: '大河图腾流', tier: 'T1', fitType: '战斗增益型', coreHeroes: ['敖隐', '虞姬'], lateHeroes: ['张良'] },
  { id: 'd', name: '雷霆战机嬴政', tier: 'T1', fitType: '经济运营型', coreHeroes: ['嬴政'], lateHeroes: [] },
];

function filter(
  list: Lineup[],
  query: string,
  typeFilter: string,
  tierFilter: string,
): Lineup[] {
  const q = query.trim();
  return list.filter((l) => {
    if (typeFilter !== '全部' && l.fitType !== typeFilter) return false;
    if (tierFilter !== '全部' && l.tier !== tierFilter) return false;
    if (q) {
      const hay = [l.name, ...l.coreHeroes, ...(l.lateHeroes ?? [])].join(' ');
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function assert(c: boolean, m: string) {
  if (!c) {
    console.error('❌ FAIL:', m);
    process.exit(1);
  }
}

assert(filter(lineups, '', '全部', '全部').length === 4, '默认不过滤');
assert(filter(lineups, '木兰', '全部', '全部').map((x) => x.id).join() === 'b', '按英雄名搜索 木兰');
assert(filter(lineups, '嬴政', '全部', '全部').map((x) => x.id).join() === 'd', '按英雄名搜索 嬴政');
assert(filter(lineups, '三分', '全部', '全部').map((x) => x.id).join() === 'a', '按阵容名搜索 三分');
assert(filter(lineups, '', '战斗增益型', '全部').map((x) => x.id).join() === 'b,c', '按类型筛选');
assert(filter(lineups, '', '全部', 'T0').map((x) => x.id).join() === 'a,b', '按强度筛选 T0');
assert(filter(lineups, '嬴政', '战斗增益型', '全部').length === 0, '组合：英雄+类型 无交集');
assert(filter(lineups, '敖隐', '战斗增益型', 'T1').map((x) => x.id).join() === 'c', '组合：英雄+类型+强度');

console.log('✅ BanStep 筛选逻辑全部通过（7 条断言）');
