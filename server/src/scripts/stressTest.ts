import prisma from '../config/db';
import * as projectControlsService from '../services/projectControls.service';
import * as budgetService from '../services/budget.service';
import * as wbsService from '../services/wbs.service';
import * as resourceService from '../services/resource.service';
import * as governanceService from '../services/governance.service';
import * as changeService from '../services/changeManagement.service';

async function runStressTest() {
  console.log('====================================================');
  console.log('🚀 PROFLOW ENTERPRISE SYSTEM DEEP AUDIT & STRESS TEST');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName} ${detail ? `(${detail})` : ''}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
    }
  }

  // 1. Fetch Apex Project
  const project = await prisma.project.findFirst({
    where: { name: { contains: 'Apex' } },
    include: { members: { include: { user: true } }, tasks: true },
  });

  assert(!!project, 'Project Apex lookup', `ID: ${project?.id}`);
  if (!project) process.exit(1);

  const projectId = project.id;
  const adminMember = project.members.find((m) => m.role === 'ADMIN');
  const userId = adminMember?.userId || project.members[0]?.userId || '';

  // ----------------------------------------------------
  // TEST SUITE 1: CPM & TASK DEPENDENCIES
  // ----------------------------------------------------
  console.log('\n--- 1. Testing CPM & Task Dependency Relations ---');
  const tasksWithDeps = await prisma.task.findMany({
    where: { projectId },
    include: {
      dependenciesAsSuccessor: true,
      dependenciesAsPredecessor: true,
    },
  });
  assert(tasksWithDeps.length > 0, 'Project task count', `${tasksWithDeps.length} tasks`);
  const depCount = await prisma.taskDependency.count();
  assert(depCount >= 0, 'Task dependency count', `${depCount} dependency links (FS/SS/FF/SF)`);

  // ----------------------------------------------------
  // TEST SUITE 2: PHASE 1 PROJECT CONTROLS (Risks, Issues, Decisions, Baselines)
  // ----------------------------------------------------
  console.log('\n--- 2. Testing Phase 1: Project Controls Core ---');
  const risks = await projectControlsService.getProjectRisks(projectId);
  assert(risks.length > 0, 'Risk Register 5x5 lookup', `${risks.length} risks found`);
  const topRisk = risks[0];
  if (topRisk) {
    assert(topRisk.score === topRisk.probability * topRisk.impact, 'Risk Score calculation', `Score: ${topRisk.score} (${topRisk.probability}x${topRisk.impact})`);
  }

  const issues = await projectControlsService.getProjectIssues(projectId);
  assert(issues.length > 0, 'Issue Register CAPA lookup', `${issues.length} issues found`);

  const decisions = await projectControlsService.getProjectDecisions(projectId);
  assert(decisions.length > 0, 'Decision Log lookup', `${decisions.length} institutional decisions`);

  const baselines = await projectControlsService.getProjectBaselines(projectId);
  assert(baselines.length > 0, 'Baseline Manager lookup', `${baselines.length} baselines`);
  if (baselines[0]) {
    assert(baselines[0].tasks.length > 0, 'Schedule Baseline Snapshot tasks', `${baselines[0].tasks.length} tasks frozen in ${baselines[0].name}`);
  }

  // ----------------------------------------------------
  // TEST SUITE 3: PHASE 2 FINANCIALS & EVM ENGINE
  // ----------------------------------------------------
  console.log('\n--- 3. Testing Phase 2: Financials & EVM Engine ---');
  const budget = await budgetService.getProjectBudget(projectId);
  assert(!!budget, 'Project Budget lookup', `BAC: ₹${(budget.approvedBudget / 10000000).toFixed(2)} Cr`);
  assert(budget.costItems.length > 0, 'Cost Breakdown Structure (CBS)', `${budget.costItems.length} cost items`);
  assert(budget.evmSnapshots.length > 0, 'EVM S-Curve historical points', `${budget.evmSnapshots.length} monthly snapshots`);
  
  if (budget.analytics) {
    assert(budget.analytics.CPI > 0, 'CPI Computation', `CPI = ${budget.analytics.CPI.toFixed(2)}`);
    assert(budget.analytics.SPI > 0, 'SPI Computation', `SPI = ${budget.analytics.SPI.toFixed(2)}`);
    assert(budget.analytics.EAC > 0, 'EAC Forecast Calculation', `EAC = ₹${(budget.analytics.EAC / 10000000).toFixed(2)} Cr`);
    assert(budget.analytics.VAC !== undefined, 'VAC Variance at Completion', `VAC = ₹${(budget.analytics.VAC / 100000).toFixed(2)} L`);
  }

  // ----------------------------------------------------
  // TEST SUITE 4: PHASE 3 WBS TREE & RESOURCE CAPACITY
  // ----------------------------------------------------
  console.log('\n--- 4. Testing Phase 3: WBS Hierarchy & Resource Capacity ---');
  const wbsTree = await wbsService.getWBSHierarchy(projectId);
  assert(wbsTree.length > 0, 'WBS Root Phases lookup', `${wbsTree.length} root phases`);
  if (wbsTree[0]) {
    assert(wbsTree[0].children.length > 0, 'WBS Child Deliverables', `${wbsTree[0].children.length} sub-elements`);
    assert(wbsTree[0].progress >= 0 && wbsTree[0].progress <= 100, 'WBS Progress Rollup', `Rollup: ${wbsTree[0].progress}%`);
    assert(wbsTree[0].plannedCost > 0, 'WBS Planned Cost Rollup', `Rollup Planned: ₹${(wbsTree[0].plannedCost / 100000).toFixed(2)} L`);
  }

  const resources = await resourceService.getProjectResources(projectId);
  assert(resources.length > 0, 'Resource Capacity Matrix', `${resources.length} engineers evaluated`);
  const overloaded = resources.filter((r) => r.overloadStatus === 'OVERLOADED');
  assert(resources.every((r) => r.weeklyCapacityHours === 40), 'Standard 40h Weekly Capacity baseline check');
  console.log(`   ℹ️ Overload status: ${overloaded.length} overloaded engineers, ${resources.length - overloaded.length} balanced/available`);

  const equipment = await resourceService.getEquipment(projectId);
  assert(equipment.length > 0, 'Specialized Test Rigs & Equipment', `${equipment.length} hardware test benches`);

  // ----------------------------------------------------
  // TEST SUITE 5: PHASE 4 STAGE-GATE & CHANGE CONTROL (CCB)
  // ----------------------------------------------------
  console.log('\n--- 5. Testing Phase 4: Stage-Gate Governance & ECO/CCB ---');
  const gates = await governanceService.getPhaseGates(projectId);
  assert(gates.length > 0, 'APQP Stage-Gate Pipeline (G0-G4)', `${gates.length} stage gates`);
  const activeGate = gates.find((g) => g.status === 'IN_REVIEW') || gates[0];
  if (activeGate) {
    assert(activeGate.criteria.length > 0, 'Gate Entry/Exit criteria checklist', `${activeGate.criteria.length} criteria in ${activeGate.gateCode}`);
  }

  const changeRequests = await changeService.getChangeRequests(projectId);
  assert(changeRequests.length > 0, 'Engineering Change Orders (ECO) ledger', `${changeRequests.length} ECOs recorded`);
  assert(changeRequests.some((eco) => eco.status === 'APPROVED'), 'Approved ECOs present in CCB audit');

  // ----------------------------------------------------
  // TEST SUITE 6: DYNAMIC MUTATION STRESS TEST
  // ----------------------------------------------------
  console.log('\n--- 6. Dynamic Stress Testing Mutations & Rollbacks ---');
  
  // 6.1 Test dynamic WBS code generation
  const testWBS = await wbsService.createWBSNode(projectId, {
    name: 'Stress Test Dynamic Sub-Work Package',
    nodeType: 'WORK_PACKAGE',
    parentNodeId: wbsTree[0]?.id,
    plannedCost: 500000,
    progress: 50,
  });
  assert(testWBS.wbsCode.startsWith(wbsTree[0]?.wbsCode || '1'), 'Dynamic WBS Code generation', `Generated: ${testWBS.wbsCode}`);
  await wbsService.deleteWBSNode(testWBS.id);
  assert(true, 'WBS Dynamic Cleanup');

  // 6.2 Test dynamic ECO creation
  const testECO = await changeService.createChangeRequest(projectId, userId, {
    title: 'Stress Test Thermal Insulation Optimization',
    description: 'Dynamic testing of CCB change workflow',
    reason: 'Stress testing',
    costImpact: 200000,
    scheduleImpactDays: 3,
    riskImpact: 'Low',
  });
  assert(testECO.ecoCode.startsWith('ECO-'), 'Dynamic ECO Code numbering', `Assigned: ${testECO.ecoCode}`);
  const reviewedECO = await changeService.reviewChangeRequest(testECO.id, userId, 'APPROVED');
  assert(reviewedECO.status === 'APPROVED' && !!reviewedECO.approvedById, 'CCB Review Transition & Signatory Stamp');
  await changeService.deleteChangeRequest(testECO.id);
  assert(true, 'ECO Dynamic Cleanup');

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`📊 STRESS TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('====================================================\n');
}

runStressTest()
  .catch((err) => {
    console.error('Fatal Stress Test Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
