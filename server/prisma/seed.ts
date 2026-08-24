import { PrismaClient, GlobalRole, ProjectRole, Priority, TaskStatus, BoardType, MilestoneStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Automobile Industry Dataset for ProFlow...');

  // 1. Clean existing sample data
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.changeRequest.deleteMany();
  await prisma.gateCriteria.deleteMany();
  await prisma.phaseGate.deleteMany();
  await prisma.equipmentResource.deleteMany();
  await prisma.resourceProfile.deleteMany();
  await prisma.wBSNode.deleteMany();
  await prisma.eVMSnapshot.deleteMany();
  await prisma.budgetCostItem.deleteMany();
  await prisma.projectBudget.deleteMany();
  await prisma.taskBaseline.deleteMany();
  await prisma.projectBaseline.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.decision.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.taskLabel.deleteMany();
  await prisma.task.deleteMany();
  await prisma.column.deleteMany();
  await prisma.board.deleteMany();
  await prisma.label.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 12);

  // 2. Automotive Engineering Team Members
  const chiefEngineer = await prisma.user.create({
    data: {
      email: 'admin@proflow.com',
      name: 'Parth Singh (Program Director & Chief EV Architect)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      passwordHash,
      globalRole: GlobalRole.ADMIN,
    },
  });

  const batteryLead = await prisma.user.create({
    data: {
      email: 'kashish.motwani@proflow.com',
      name: 'Kashish Motwani (Battery Systems & Thermal Lead)',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      passwordHash,
      globalRole: GlobalRole.USER,
    },
  });

  const adasEngineer = await prisma.user.create({
    data: {
      email: 'rashika.sarawgi@proflow.com',
      name: 'Rashika Sarawgi (ADAS Perception & Autonomy Lead)',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      passwordHash,
      globalRole: GlobalRole.USER,
    },
  });

  const chassisLead = await prisma.user.create({
    data: {
      email: 'ritik.raj@proflow.com',
      name: 'Ritik Raj (800V SiC Powertrain & Inverter Lead)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      passwordHash,
      globalRole: GlobalRole.USER,
    },
  });

  const mfgLead = await prisma.user.create({
    data: {
      email: 'abhinav.kumar@proflow.com',
      name: 'Abhinav Kumar (Manufacturing & Tooling Specialist)',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      passwordHash,
      globalRole: GlobalRole.USER,
    },
  });

  const safetyOfficer = await prisma.user.create({
    data: {
      email: 'priyanshi.mandiya@proflow.com',
      name: 'Priyanshi Mandiya (Quality & Homologation Gatekeeper)',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      passwordHash,
      globalRole: GlobalRole.USER,
    },
  });

  // ==========================================
  // PROJECT 1: Project Apex: Next-Gen Electric SUV
  // ==========================================
  const project1 = await prisma.project.create({
    data: {
      name: 'Project Apex: Next-Gen Electric SUV',
      description: '800V architecture modular EV platform featuring 100kWh liquid-cooled NMC battery, Dual-Motor AWD (450kW), Level 3 ADAS sensor suite, and ISO 26262 ASIL-D functional safety compliance.',
      color: '#4f46e5',
      status: 'ACTIVE',
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-11-30'),
      ownerId: chiefEngineer.id,
      members: {
        create: [
          { userId: chiefEngineer.id, role: ProjectRole.ADMIN },
          { userId: batteryLead.id, role: ProjectRole.MANAGER },
          { userId: adasEngineer.id, role: ProjectRole.MEMBER },
          { userId: chassisLead.id, role: ProjectRole.MEMBER },
          { userId: mfgLead.id, role: ProjectRole.MEMBER },
          { userId: safetyOfficer.id, role: ProjectRole.MEMBER },
        ],
      },
    },
  });

  // Project 1 Labels
  const lblBattery = await prisma.label.create({ data: { projectId: project1.id, name: 'Battery Tech', color: '#0ea5e9' } });
  const lblADAS = await prisma.label.create({ data: { projectId: project1.id, name: 'ADAS / Autonomy', color: '#8b5cf6' } });
  const lblSafety = await prisma.label.create({ data: { projectId: project1.id, name: 'ISO 26262 / ASIL-D', color: '#ef4444' } });
  const lblPowertrain = await prisma.label.create({ data: { projectId: project1.id, name: 'Powertrain', color: '#f59e0b' } });
  const lblAero = await prisma.label.create({ data: { projectId: project1.id, name: 'Chassis & Aero', color: '#10b981' } });
  const lblHomologation = await prisma.label.create({ data: { projectId: project1.id, name: 'Homologation', color: '#ec4899' } });

  // Project 1 Milestones
  const m1 = await prisma.milestone.create({
    data: {
      projectId: project1.id,
      name: 'Phase 1: Thermal & CFD Simulation Sign-Off',
      description: 'Complete CFD aerodynamic drag reduction to Cd < 0.23 and battery pack thermal runaway simulation.',
      dueDate: new Date('2026-04-15'),
      status: MilestoneStatus.OPEN,
    },
  });

  const m2 = await prisma.milestone.create({
    data: {
      projectId: project1.id,
      name: 'Phase 2: Mule Vehicle Track Testing (Dyno & Proving Grounds)',
      description: 'Physical validation of Dual-Motor torque vectoring, 0-100 km/h acceleration (<3.4s), and cold-weather battery range.',
      dueDate: new Date('2026-07-30'),
      status: MilestoneStatus.OPEN,
    },
  });

  const m3 = await prisma.milestone.create({
    data: {
      projectId: project1.id,
      name: 'Phase 3: ARAI / UNECE Crash & Safety Certification',
      description: 'Full-scale physical crash tests (Euro NCAP 5-star & UNECE R100 battery safety certification).',
      dueDate: new Date('2026-10-31'),
      status: MilestoneStatus.OPEN,
    },
  });

  // Project 1 Kanban Board
  const board1 = await prisma.board.create({
    data: {
      projectId: project1.id,
      name: 'Vehicle Engineering Board',
      type: BoardType.KANBAN,
      columns: {
        create: [
          { name: 'Concept & CAD Design', order: 0, color: '#94a3b8' },
          { name: 'Simulation & CAE Testing', order: 1, color: '#3b82f6' },
          { name: 'Prototype Fabrication', order: 2, color: '#f59e0b' },
          { name: 'Track Validation & Testing', order: 3, color: '#8b5cf6' },
          { name: 'Homologation & Sign-Off', order: 4, color: '#10b981' },
        ],
      },
    },
    include: { columns: { orderBy: { order: 'asc' } } },
  });

  const [colConcept, colCAE, colProto, colTrack, colDone] = board1.columns;

  // Tasks for Project Apex
  const task1 = await prisma.task.create({
    data: {
      title: '800V SiC (Silicon Carbide) Inverter Efficiency Optimization',
      description: 'Design inverter switching gate driver circuitry for >98.5% WLTP cycle efficiency with reduced switching thermal dissipation.',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.CRITICAL,
      order: 0,
      estimatedHours: 64,
      startDate: new Date('2026-03-01'),
      dueDate: new Date('2026-04-10'),
      projectId: project1.id,
      columnId: colCAE.id,
      reporterId: chiefEngineer.id,
      assigneeId: chiefEngineer.id,
      milestoneId: m1.id,
      labels: { create: [{ labelId: lblPowertrain.id }] },
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: '100kWh Battery Enclosure Structural FEA & Crashworthiness',
      description: 'Verify bottom-impact battery intrusion resistance against UNECE R100 standard using high-strength extruded aluminum alloy.',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.CRITICAL,
      order: 1,
      estimatedHours: 80,
      startDate: new Date('2026-02-15'),
      dueDate: new Date('2026-04-05'),
      projectId: project1.id,
      columnId: colCAE.id,
      reporterId: chiefEngineer.id,
      assigneeId: batteryLead.id,
      milestoneId: m1.id,
      labels: { create: [{ labelId: lblBattery.id }, { labelId: lblSafety.id }] },
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'LiDAR + 8MP Camera Array Calibration for Highway Autopilot',
      description: 'Compute intrinsic and extrinsic transformation matrices for 3x Flash LiDAR and 8x Surround View cameras on roof pod mount.',
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      order: 0,
      estimatedHours: 45,
      startDate: new Date('2026-04-15'),
      dueDate: new Date('2026-05-20'),
      projectId: project1.id,
      columnId: colProto.id,
      reporterId: chiefEngineer.id,
      assigneeId: adasEngineer.id,
      milestoneId: m2.id,
      labels: { create: [{ labelId: lblADAS.id }] },
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: 'Active Aero Air Suspension Tuning & Underbody Venturi Channels',
      description: 'Optimize active air dam deployment at 90 km/h to reduce aerodynamic drag coefficient from 0.25 to 0.22.',
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      order: 0,
      estimatedHours: 50,
      startDate: new Date('2026-03-20'),
      dueDate: new Date('2026-04-30'),
      projectId: project1.id,
      columnId: colConcept.id,
      reporterId: chiefEngineer.id,
      assigneeId: chassisLead.id,
      milestoneId: m1.id,
      labels: { create: [{ labelId: lblAero.id }] },
    },
  });

  const task5 = await prisma.task.create({
    data: {
      title: 'BMS Cell Balancing & Cold-Weather Immersion Cooling Validation',
      description: 'Validate immersion cooling dielectric fluid circulation under -25°C fast-charging conditions (350kW DC Fast Charge).',
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      order: 0,
      completedAt: new Date('2026-03-01'),
      estimatedHours: 72,
      startDate: new Date('2026-01-20'),
      dueDate: new Date('2026-02-28'),
      projectId: project1.id,
      columnId: colDone.id,
      reporterId: chiefEngineer.id,
      assigneeId: batteryLead.id,
      milestoneId: m1.id,
      labels: { create: [{ labelId: lblBattery.id }] },
    },
  });

  const task6 = await prisma.task.create({
    data: {
      title: 'Dual-Motor Torque Vectoring & Electronic Stability Control (ESC)',
      description: 'Tune yaw moment control algorithms on Nardo proving grounds for wet-asphalt cornering stability at 120 km/h.',
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      order: 0,
      estimatedHours: 60,
      startDate: new Date('2026-05-01'),
      dueDate: new Date('2026-06-30'),
      projectId: project1.id,
      columnId: colTrack.id,
      reporterId: chiefEngineer.id,
      assigneeId: chiefEngineer.id,
      milestoneId: m2.id,
      labels: { create: [{ labelId: lblPowertrain.id }] },
    },
  });

  const task7 = await prisma.task.create({
    data: {
      title: 'ISO 26262 Functional Safety Technical Safety Concept (TSC)',
      description: 'Formalize safety goals for brake-by-wire and steer-by-wire fail-operational redundancy architecture (ASIL-D).',
      status: TaskStatus.DONE,
      priority: Priority.CRITICAL,
      order: 1,
      completedAt: new Date('2026-02-15'),
      estimatedHours: 90,
      startDate: new Date('2026-01-10'),
      dueDate: new Date('2026-02-15'),
      projectId: project1.id,
      columnId: colDone.id,
      reporterId: chiefEngineer.id,
      assigneeId: safetyOfficer.id,
      milestoneId: m1.id,
      labels: { create: [{ labelId: lblSafety.id }, { labelId: lblHomologation.id }] },
    },
  });

  const milestoneGate1 = await prisma.task.create({
    data: {
      title: '◆ Gate 1: Detailed Design Freeze & CAD Virtual Sign-Off',
      description: 'Formal APQP Gate 1 virtual CAE/FEA sign-off and Class-A styling freeze.',
      status: TaskStatus.DONE,
      priority: Priority.CRITICAL,
      isMilestone: true,
      order: 2,
      startDate: new Date('2026-04-15'),
      dueDate: new Date('2026-04-15'),
      projectId: project1.id,
      columnId: colDone.id,
      reporterId: chiefEngineer.id,
      assigneeId: chiefEngineer.id,
      milestoneId: m1.id,
      labels: { create: [{ labelId: lblSafety.id }] },
    },
  });

  const task8 = await prisma.task.create({
    data: {
      title: 'Idra 9,000-Ton Giga Press Rear Monocoque Die Tooling Release',
      description: 'Manufacture single-piece rear underbody aluminum casting die sets with high-pressure vacuum injection channels.',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.CRITICAL,
      order: 1,
      estimatedHours: 95,
      startDate: new Date('2026-04-16'),
      dueDate: new Date('2026-06-15'),
      projectId: project1.id,
      columnId: colProto.id,
      reporterId: chiefEngineer.id,
      assigneeId: mfgLead.id,
      milestoneId: m2.id,
      labels: { create: [{ labelId: lblAero.id }] },
    },
  });

  const task9 = await prisma.task.create({
    data: {
      title: '500kW Dual-Motor Dyno High-Speed Calibration & Thermal Run',
      description: 'Execute 100-hour continuous high-rpm dyno validation on dual-motor SiC inverters up to 20,000 rpm.',
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      order: 1,
      estimatedHours: 85,
      startDate: new Date('2026-04-12'),
      dueDate: new Date('2026-05-25'),
      projectId: project1.id,
      columnId: colTrack.id,
      reporterId: chiefEngineer.id,
      assigneeId: chassisLead.id,
      milestoneId: m2.id,
      labels: { create: [{ labelId: lblPowertrain.id }] },
    },
  });

  const task10 = await prisma.task.create({
    data: {
      title: 'Solid-State LiDAR Point Cloud Sensor Fusion Perception Stack',
      description: 'Train neural network point cloud clustering on NVIDIA DRIVE Orin for 360-degree 250m obstacle detection.',
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      order: 1,
      estimatedHours: 70,
      startDate: new Date('2026-05-21'),
      dueDate: new Date('2026-07-15'),
      projectId: project1.id,
      columnId: colProto.id,
      reporterId: chiefEngineer.id,
      assigneeId: adasEngineer.id,
      milestoneId: m2.id,
      labels: { create: [{ labelId: lblADAS.id }] },
    },
  });

  const task11 = await prisma.task.create({
    data: {
      title: 'Immersion Battery Cell Nail Penetration & Thermal Containment Test',
      description: 'Trigger individual cylindrical cell thermal runaway and demonstrate zero cell-to-cell thermal propagation in dielectric fluid bath.',
      status: TaskStatus.TODO,
      priority: Priority.CRITICAL,
      order: 2,
      estimatedHours: 110,
      startDate: new Date('2026-06-01'),
      dueDate: new Date('2026-07-20'),
      projectId: project1.id,
      columnId: colTrack.id,
      reporterId: chiefEngineer.id,
      assigneeId: batteryLead.id,
      milestoneId: m2.id,
      labels: { create: [{ labelId: lblBattery.id }, { labelId: lblSafety.id }] },
    },
  });

  const task12 = await prisma.task.create({
    data: {
      title: 'Final Assembly Line Takt Time & Pilot Body-in-White Validation',
      description: 'Validate 90-second takt time on pilot manufacturing line with robotic adhesive application and battery pack docking.',
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      order: 2,
      estimatedHours: 80,
      startDate: new Date('2026-07-01'),
      dueDate: new Date('2026-08-30'),
      projectId: project1.id,
      columnId: colTrack.id,
      reporterId: chiefEngineer.id,
      assigneeId: mfgLead.id,
      milestoneId: m3.id,
      labels: { create: [{ labelId: lblHomologation.id }] },
    },
  });

  const milestoneTask = await prisma.task.create({
    data: {
      title: '◆ UNECE R100 & Euro NCAP Homologation Official Sign-Off',
      description: 'Formal European type approval homologation sign-off milestone for commercial series production.',
      status: TaskStatus.TODO,
      priority: Priority.CRITICAL,
      isMilestone: true,
      order: 3,
      startDate: new Date('2026-10-31'),
      dueDate: new Date('2026-10-31'),
      projectId: project1.id,
      columnId: colDone.id,
      reporterId: chiefEngineer.id,
      assigneeId: safetyOfficer.id,
      milestoneId: m3.id,
      labels: { create: [{ labelId: lblHomologation.id }] },
    },
  });

  // ==========================================
  // CPM DEPENDENCY NETWORK (FS, SS, FF, SF)
  // ==========================================

  // Task 7 (ISO 26262 TSC) -> Task 2 (Battery FEA) [SS + 5 days lag]
  await prisma.taskDependency.create({
    data: { predecessorId: task7.id, successorId: task2.id, type: 'SS', lagDays: 5 },
  });

  // Task 1 (Inverter Efficiency) -> Milestone Gate 1 [FS]
  await prisma.taskDependency.create({
    data: { predecessorId: task1.id, successorId: milestoneGate1.id, type: 'FS', lagDays: 5 },
  });

  // Task 2 (Battery FEA) -> Milestone Gate 1 [FS]
  await prisma.taskDependency.create({
    data: { predecessorId: task2.id, successorId: milestoneGate1.id, type: 'FS', lagDays: 10 },
  });

  // Task 4 (Active Aero) -> Milestone Gate 1 [FF]
  await prisma.taskDependency.create({
    data: { predecessorId: task4.id, successorId: milestoneGate1.id, type: 'FF', lagDays: 0 },
  });

  // Milestone Gate 1 -> Task 8 (Giga Press Tooling) [FS]
  await prisma.taskDependency.create({
    data: { predecessorId: milestoneGate1.id, successorId: task8.id, type: 'FS', lagDays: 1 },
  });

  // Task 1 (Inverter) -> Task 9 (Dyno Run) [FS + 2 days lag]
  await prisma.taskDependency.create({
    data: { predecessorId: task1.id, successorId: task9.id, type: 'FS', lagDays: 2 },
  });

  // Task 3 (LiDAR Calibration) -> Task 10 (LiDAR Point Cloud Stack) [FS + 1 day lag]
  await prisma.taskDependency.create({
    data: { predecessorId: task3.id, successorId: task10.id, type: 'FS', lagDays: 1 },
  });

  // Task 5 (BMS Balancing) -> Task 11 (Nail Penetration Test) [FS + 10 days lag]
  await prisma.taskDependency.create({
    data: { predecessorId: task5.id, successorId: task11.id, type: 'FS', lagDays: 10 },
  });

  // Task 8 (Giga Press) -> Task 12 (Final Assembly Pilot) [FS + 5 days lag]
  await prisma.taskDependency.create({
    data: { predecessorId: task8.id, successorId: task12.id, type: 'FS', lagDays: 5 },
  });

  // Task 6 (Dual-Motor Torque Vectoring) -> Task 12 (Final Assembly Pilot) [SS + 15 days lag]
  await prisma.taskDependency.create({
    data: { predecessorId: task6.id, successorId: task12.id, type: 'SS', lagDays: 15 },
  });

  // Task 12 (Final Assembly Pilot) -> Final Milestone Homologation [FS + 30 days lag]
  await prisma.taskDependency.create({
    data: { predecessorId: task12.id, successorId: milestoneTask.id, type: 'FS', lagDays: 30 },
  });

  // Task 11 (Nail Penetration Test) -> Final Milestone Homologation [FS + 20 days lag]
  await prisma.taskDependency.create({
    data: { predecessorId: task11.id, successorId: milestoneTask.id, type: 'FS', lagDays: 20 },
  });

  // Subtasks for Battery Structural FEA
  await prisma.task.create({
    data: {
      title: 'CAD model mesh generation with 1.5mm tetrahedral elements',
      status: TaskStatus.DONE,
      projectId: project1.id,
      parentTaskId: task2.id,
      reporterId: chiefEngineer.id,
      assigneeId: batteryLead.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Side pole intrusion crash simulation at 32 km/h (FMVSS 214)',
      status: TaskStatus.IN_PROGRESS,
      projectId: project1.id,
      parentTaskId: task2.id,
      reporterId: chiefEngineer.id,
      assigneeId: batteryLead.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Underbody debris shield puncture test (50kN static load)',
      status: TaskStatus.TODO,
      projectId: project1.id,
      parentTaskId: task2.id,
      reporterId: chiefEngineer.id,
      assigneeId: batteryLead.id,
    },
  });

  // Comments on Task 1
  await prisma.comment.create({
    data: {
      taskId: task1.id,
      userId: chiefEngineer.id,
      content: 'Silicon Carbide (SiC) MOSFET sample batch from Infineon has arrived for thermal bench testing.',
    },
  });

  await prisma.comment.create({
    data: {
      taskId: task1.id,
      userId: batteryLead.id,
      content: 'Thermal junction temperatures stayed below 110°C during continuous 300kW dyno load. Excellent results!',
    },
  });

  // Time Entries
  await prisma.timeEntry.create({
    data: {
      taskId: task1.id,
      userId: chiefEngineer.id,
      startTime: new Date('2026-03-05T09:00:00Z'),
      endTime: new Date('2026-03-05T13:30:00Z'),
      duration: 270,
      description: 'Inverter gate driver dead-time tuning for minimal harmonic distortion',
    },
  });

  await prisma.timeEntry.create({
    data: {
      taskId: task2.id,
      userId: batteryLead.id,
      startTime: new Date('2026-03-06T10:00:00Z'),
      endTime: new Date('2026-03-06T14:00:00Z'),
      duration: 240,
      description: 'LS-DYNA crash simulation convergence run',
    },
  });

  // ==========================================
  // PROJECT 2: Project Chrono: Smart Assembly Line 4.0
  // ==========================================
  const project2 = await prisma.project.create({
    data: {
      name: 'Project Chrono: Gigafactory Assembly 4.0',
      description: 'Automated Guided Vehicle (AGV) logistics fleet, robotic spot welding cell synchronization, and AI computer vision paint defect inspection.',
      color: '#0ea5e9',
      status: 'ACTIVE',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-08-30'),
      ownerId: chiefEngineer.id,
      members: {
        create: [
          { userId: chiefEngineer.id, role: ProjectRole.ADMIN },
          { userId: chassisLead.id, role: ProjectRole.MANAGER },
          { userId: adasEngineer.id, role: ProjectRole.MEMBER },
        ],
      },
    },
  });

  const board2 = await prisma.board.create({
    data: {
      projectId: project2.id,
      name: 'Manufacturing Automation Board',
      type: BoardType.KANBAN,
      columns: {
        create: [
          { name: 'Requirements & Schematics', order: 0 },
          { name: 'PLC & Robot Programming', order: 1 },
          { name: 'Commissioning & Integration', order: 2 },
          { name: 'Line Takt-Time Verification', order: 3 },
        ],
      },
    },
    include: { columns: { orderBy: { order: 'asc' } } },
  });

  await prisma.task.create({
    data: {
      title: 'KUKA 6-Axis Spot Welding Cell Safety Laser Interlocks Integration',
      description: 'Program SIL 3 safety zones and emergency stop interlocks for 12 robotic welding stations on BIW (Body in White) line.',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      order: 0,
      estimatedHours: 40,
      projectId: project2.id,
      columnId: board2.columns[1].id,
      reporterId: chiefEngineer.id,
      assigneeId: chassisLead.id,
    },
  });

  // ==========================================
  // PROJECT 3: Project Hydra: Heavy-Duty Fuel Cell Truck
  // ==========================================
  const project3 = await prisma.project.create({
    data: {
      name: 'Project Hydra: Class 8 Hydrogen Fuel Cell Truck',
      description: '300kW Proton-Exchange Membrane (PEM) fuel cell prime mover with 700-bar carbon-composite H2 storage tanks for 1000km zero-emission long-haul freight.',
      color: '#10b981',
      status: 'ACTIVE',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-12-15'),
      ownerId: chiefEngineer.id,
      members: {
        create: [
          { userId: chiefEngineer.id, role: ProjectRole.ADMIN },
          { userId: safetyOfficer.id, role: ProjectRole.MANAGER },
          { userId: batteryLead.id, role: ProjectRole.MEMBER },
        ],
      },
    },
  });

  const board3 = await prisma.board.create({
    data: {
      projectId: project3.id,
      name: 'Powertrain & Fuel Cell Integration',
      type: BoardType.KANBAN,
      columns: {
        create: [
          { name: 'Architecture & Fuel Cell Sizing', order: 0 },
          { name: 'Cryogenic & 700-bar H2 Plumbing', order: 1 },
          { name: 'Thermal Dissipation & Radiators', order: 2 },
          { name: 'Fleet Proving Grounds Field Tests', order: 3 },
        ],
      },
    },
    include: { columns: { orderBy: { order: 'asc' } } },
  });

  await prisma.task.create({
    data: {
      title: '700-bar Type IV Carbon Fiber Hydrogen Tank Burst Pressure Validation',
      description: 'Perform hydraulic burst pressure testing up to 1575 bar (2.25x working pressure) per UN GTR No. 13.',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.CRITICAL,
      order: 0,
      estimatedHours: 55,
      projectId: project3.id,
      columnId: board3.columns[1].id,
      reporterId: chiefEngineer.id,
      assigneeId: safetyOfficer.id,
    },
  });
  await prisma.activityLog.create({
    data: {
      projectId: project1.id,
      userId: chiefEngineer.id,
      action: 'created task',
      entityType: 'Task',
      entityId: task1.id,
    },
  });

  await prisma.activityLog.create({
    data: {
      projectId: project1.id,
      userId: batteryLead.id,
      action: 'logged 4.0h time on',
      entityType: 'Task',
      entityId: task2.id,
    },
  });

  // In-app Notifications
  await prisma.notification.create({
    data: {
      userId: chiefEngineer.id,
      type: 'TASK_ASSIGNED',
      title: 'New Assignment',
      message: 'You have been assigned to 800V SiC Inverter Efficiency Optimization.',
      relatedEntityType: 'Task',
      relatedEntityId: task1.id,
    },
  });

  // ==========================================
  // PHASE 1: PROJECT CONTROLS SEED DATA
  // ==========================================

  // 1. Risk Register for Project Apex
  await prisma.risk.create({
    data: {
      projectId: project1.id,
      riskCode: 'RSK-001',
      title: 'Infineon 800V SiC MOSFET wafer shortage leading to inverter fabrication delay',
      description: 'Global supply constraint on 1200V automotive-grade Silicon Carbide wafers may delay inverter prototype delivery by 6-8 weeks.',
      category: 'SUPPLY_CHAIN',
      probability: 4,
      impact: 4,
      score: 16,
      status: 'MITIGATING',
      mitigation: 'Dual-source qualification initiated with Wolfspeed and STMicroelectronics for alternate pin-compatible SiC power modules.',
      contingency: 'Procure buffer stock of 500 qualification units from spot market distributors at premium.',
      ownerId: batteryLead.id,
      dueDate: new Date('2026-05-15'),
    },
  });

  await prisma.risk.create({
    data: {
      projectId: project1.id,
      riskCode: 'RSK-002',
      title: 'UNECE R100 Rev. 3 cold-weather (-25°C) thermal runaway test standard compliance',
      description: 'Updated European homologation criteria mandates non-propagation within 5 minutes under extreme sub-zero localized cell thermal runaway.',
      category: 'REGULATORY',
      probability: 3,
      impact: 5,
      score: 15,
      status: 'OPEN',
      mitigation: 'Implement aerogel barrier insulation blankets between parallel module bricks with directional fire-stop venting ducts.',
      contingency: 'De-rate continuous peak charge rate from 350kW to 275kW under sub-zero ambient thresholds.',
      ownerId: safetyOfficer.id,
      dueDate: new Date('2026-06-30'),
    },
  });

  await prisma.risk.create({
    data: {
      projectId: project1.id,
      riskCode: 'RSK-003',
      title: 'Aerodynamic drag coefficient exceeding Cd 0.23 threshold in high-speed wind tunnel testing',
      description: 'Preliminary full-scale mockup shows boundary layer turbulence around wheel arches and active rear wing transition zone.',
      category: 'TECHNICAL',
      probability: 3,
      impact: 3,
      score: 9,
      status: 'MITIGATING',
      mitigation: 'Optimize active front air dam deployment angle at 90 km/h and introduce underbody venturi strakes.',
      contingency: 'Adopt aero-optimized disc alloy wheels with flush spoke covers.',
      ownerId: chassisLead.id,
      dueDate: new Date('2026-04-30'),
    },
  });

  await prisma.risk.create({
    data: {
      projectId: project1.id,
      riskCode: 'RSK-004',
      title: 'Flash LiDAR optical sensor degradation in heavy precipitation / fog conditions',
      description: 'Solid-state 905nm LiDAR point cloud density decreases by >40% during heavy torrential rainfall simulation.',
      category: 'SAFETY',
      probability: 2,
      impact: 4,
      score: 8,
      status: 'OPEN',
      mitigation: 'Dynamic sensor fusion fallback algorithm that shifts primary object detection weights to 77GHz millimeter-wave radar.',
      contingency: 'Restrict Level 3 hands-free operational design domain (ODD) to clear weather driving modes.',
      ownerId: adasEngineer.id,
      dueDate: new Date('2026-07-15'),
    },
  });

  await prisma.risk.create({
    data: {
      projectId: project1.id,
      riskCode: 'RSK-005',
      title: 'Crash test chassis tooling budget overrun during high-strength aluminum die casting',
      description: 'Custom megacasting die molds exceeding initial vendor quote due to high-tensile tool steel alloy pricing.',
      category: 'FINANCIAL',
      probability: 2,
      impact: 3,
      score: 6,
      status: 'CLOSED',
      mitigation: 'Consolidated modular front subframe tooling with Project Hydra platform to amortize capital expenditures.',
      ownerId: chiefEngineer.id,
      dueDate: new Date('2026-03-01'),
    },
  });

  // 2. Issue Register for Project Apex
  await prisma.issue.create({
    data: {
      projectId: project1.id,
      issueCode: 'ISS-001',
      title: '100kWh Aluminum extrusion bottom enclosure sustained 4.2mm permanent deflection in 50kN static crush test',
      description: 'Physical hydraulic ram test on prototype battery pack showed localized plastic deformation beyond the 3.0mm clearance limit to cell modules.',
      severity: 'CRITICAL',
      status: 'INVESTIGATING',
      rootCause: 'Extrusion baseplate web thickness was machined to 2.5mm instead of drawing specification 3.2mm in prototype batch #1.',
      correctiveAction: 'Issue Engineering Change Order (ECO-402) to reinforce internal transverse ribbing with high-strength 7000-series alloy inserts.',
      ownerId: batteryLead.id,
      dueDate: new Date('2026-04-10'),
    },
  });

  await prisma.issue.create({
    data: {
      projectId: project1.id,
      issueCode: 'ISS-002',
      title: 'CAN-FD bus arbitration packet loss (>0.05%) between Brake-by-Wire ECU and Vehicle Dynamics Controller',
      description: 'Intermittent CRC error frames observed during high-frequency torque vectoring test on hardware-in-the-loop (HIL) bench.',
      severity: 'HIGH',
      status: 'OPEN',
      rootCause: 'Improper bus termination resistor impedance mismatch and common-mode electromagnetic noise coupling from inverter switching.',
      correctiveAction: 'Install shielded twisted-pair harness with 120-ohm split termination and common-mode choke filter on chassis ground.',
      ownerId: chiefEngineer.id,
      dueDate: new Date('2026-04-20'),
    },
  });

  // 3. Decision Log for Project Apex
  await prisma.decision.create({
    data: {
      projectId: project1.id,
      decisionCode: 'DEC-001',
      title: 'Transitioned Primary Traction Inverter Architecture from Silicon IGBT to 800V Silicon Carbide (SiC)',
      decisionDate: new Date('2026-02-10'),
      summary: 'Executive committee and Chief Engineer approved transition to 800V Silicon Carbide (SiC) MOSFET power stage modules.',
      rationale: 'Delivers +4.2% WLTP driving range efficiency gain, enables 350kW ultra-fast DC charging (10-80% in 18 mins), and reduces inverter thermal cooling jacket volume by 30%.',
      financialImpact: '+₹35 Lakhs (BOM cost offset by smaller battery pack required for same target range)',
      scheduleImpact: '-3 Weeks (accelerated dyno thermal validation)',
      status: 'APPROVED',
      approvedById: chiefEngineer.id,
    },
  });

  await prisma.decision.create({
    data: {
      projectId: project1.id,
      decisionCode: 'DEC-002',
      title: 'Standardized Sensor Architecture on 3x Solid-State Flash LiDAR + 8x Surround View Cameras',
      decisionDate: new Date('2026-02-25'),
      summary: 'Finalized perception hardware bill of materials for Level 3 Highway Autopilot capability.',
      rationale: 'Flash solid-state LiDAR eliminates mechanical rotating failure points while guaranteeing dense 360-degree point clouds up to 250m in variable lighting.',
      financialImpact: '+₹18 Lakhs per prototype validation build',
      scheduleImpact: 'Neutral (aligned with prototype fabrication window)',
      status: 'APPROVED',
      approvedById: chiefEngineer.id,
    },
  });

  // 4. Baseline Schedule Snapshot for Project Apex
  const apexTasks = await prisma.task.findMany({ where: { projectId: project1.id } });
  const baselineT0 = await prisma.projectBaseline.create({
    data: {
      projectId: project1.id,
      name: 'Baseline T0 — Euro NCAP & Homologation Target Schedule',
      description: 'Initial locked project baseline schedule approved by Chief EV Architect Dr. Marcus Vance prior to prototype fabrication phase.',
      createdById: chiefEngineer.id,
    },
  });

  if (apexTasks.length > 0) {
    await prisma.taskBaseline.createMany({
      data: apexTasks.map((t) => ({
        baselineId: baselineT0.id,
        taskId: t.id,
        startDate: t.startDate,
        dueDate: t.dueDate,
        estimatedHours: t.estimatedHours,
      })),
    });
  }

  // ==========================================
  // PHASE 2: FINANCIALS & EVM SEED DATA
  // ==========================================

  const apexBudget = await prisma.projectBudget.create({
    data: {
      projectId: project1.id,
      currency: 'INR',
      approvedBudget: 150000000, // ₹15.00 Crores
      contingencyReserve: 15000000, // ₹1.50 Crores
      notes: 'Approved CapEx and R&D budget for Project Apex prototype homologation build.',
    },
  });

  // Cost Breakdown Items
  await prisma.budgetCostItem.create({
    data: {
      budgetId: apexBudget.id,
      name: '800V Silicon Carbide (SiC) Inverter Module Prototype Batch (Wolfspeed / ST)',
      category: 'PROTOTYPE_BOM',
      plannedAmount: 6500000,
      committedAmount: 6500000,
      actualAmount: 6500000,
      vendor: 'Wolfspeed Power GmbH',
      purchaseOrderNo: 'PO-8821',
      invoiceNo: 'INV-4011',
      status: 'PAID',
      dueDate: new Date('2026-03-15'),
    },
  });

  await prisma.budgetCostItem.create({
    data: {
      budgetId: apexBudget.id,
      name: '100kWh Aluminum Megacasting Structural Die Sets (Giga Press)',
      category: 'TOOLING_AND_DIES',
      plannedAmount: 32000000,
      committedAmount: 34500000,
      actualAmount: 28000000,
      vendor: 'Idra Group Italy',
      purchaseOrderNo: 'PO-8822',
      invoiceNo: 'INV-4012',
      status: 'COMMITTED',
      dueDate: new Date('2026-06-30'),
    },
  });

  await prisma.budgetCostItem.create({
    data: {
      budgetId: apexBudget.id,
      name: 'Flash Solid-State LiDAR & 77GHz Radar Perception Sensor Kits',
      category: 'PROTOTYPE_BOM',
      plannedAmount: 4500000,
      committedAmount: 4500000,
      actualAmount: 4500000,
      vendor: 'Innoviz Technologies',
      purchaseOrderNo: 'PO-8823',
      invoiceNo: 'INV-4013',
      status: 'PAID',
      dueDate: new Date('2026-04-10'),
    },
  });

  await prisma.budgetCostItem.create({
    data: {
      budgetId: apexBudget.id,
      name: 'UNECE R100 Rev. 3 & Euro NCAP Full Vehicle Crash / Thermal Rig Validation',
      category: 'TESTING_AND_CERTIFICATION',
      plannedAmount: 18000000,
      committedAmount: 15000000,
      actualAmount: 7500000,
      vendor: 'UTAC Millbrook UK',
      purchaseOrderNo: 'PO-8824',
      invoiceNo: 'INV-4014',
      status: 'COMMITTED',
      dueDate: new Date('2026-08-15'),
    },
  });

  await prisma.budgetCostItem.create({
    data: {
      budgetId: apexBudget.id,
      name: 'Powertrain Simulation & Immersion Cooling R&D Engineering Manpower (12,000 hrs)',
      category: 'ENGINEERING_MANPOWER',
      plannedAmount: 45000000,
      committedAmount: 45000000,
      actualAmount: 31000000,
      vendor: 'ProFlow In-House R&D',
      purchaseOrderNo: 'PO-8825',
      invoiceNo: 'INV-4015',
      status: 'COMMITTED',
      dueDate: new Date('2026-09-30'),
    },
  });

  // Monthly EVM S-Curve Snapshots (6-month historical curve)
  await prisma.eVMSnapshot.createMany({
    data: [
      { budgetId: apexBudget.id, periodDate: new Date('2025-11-01'), pv: 15000000, ev: 16000000, ac: 14500000, cpi: 1.10, spi: 1.07, eac: 136363636, vac: 13636364 },
      { budgetId: apexBudget.id, periodDate: new Date('2025-12-01'), pv: 32000000, ev: 33500000, ac: 31000000, cpi: 1.08, spi: 1.05, eac: 138888889, vac: 11111111 },
      { budgetId: apexBudget.id, periodDate: new Date('2026-01-01'), pv: 54000000, ev: 53000000, ac: 51500000, cpi: 1.03, spi: 0.98, eac: 145631068, vac: 4368932 },
      { budgetId: apexBudget.id, periodDate: new Date('2026-02-01'), pv: 78000000, ev: 76000000, ac: 74000000, cpi: 1.03, spi: 0.97, eac: 145631068, vac: 4368932 },
      { budgetId: apexBudget.id, periodDate: new Date('2026-03-01'), pv: 102000000, ev: 99000000, ac: 95500000, cpi: 1.04, spi: 0.97, eac: 144230769, vac: 5769231 },
      { budgetId: apexBudget.id, periodDate: new Date('2026-04-01'), pv: 125000000, ev: 121000000, ac: 116500000, cpi: 1.04, spi: 0.97, eac: 144230769, vac: 5769231 },
    ],
  });

  // ==========================================
  // PHASE 3: WBS HIERARCHY SEED DATA
  // ==========================================

  // Phase 1.0
  const phase1 = await prisma.wBSNode.create({
    data: {
      projectId: project1.id,
      wbsCode: '1.0',
      name: 'Powertrain & High-Voltage Architecture',
      nodeType: 'PHASE',
      order: 0,
      progress: 75,
      plannedCost: 85000000,
      actualCost: 65000000,
      ownerId: chiefEngineer.id,
      startDate: new Date('2026-01-10'),
      dueDate: new Date('2026-07-30'),
    },
  });

  // Deliverable 1.1
  const deliv1_1 = await prisma.wBSNode.create({
    data: {
      projectId: project1.id,
      parentNodeId: phase1.id,
      wbsCode: '1.1',
      name: 'Silicon Carbide (SiC) Inverter Module',
      nodeType: 'DELIVERABLE',
      order: 0,
      progress: 90,
      plannedCost: 35000000,
      actualCost: 35000000,
      ownerId: chiefEngineer.id,
      startDate: new Date('2026-01-15'),
      dueDate: new Date('2026-05-15'),
    },
  });

  await prisma.wBSNode.create({
    data: {
      projectId: project1.id,
      parentNodeId: deliv1_1.id,
      wbsCode: '1.1.1',
      name: '800V SiC Power Stage Thermal Dyno Testing',
      nodeType: 'WORK_PACKAGE',
      order: 0,
      progress: 85,
      plannedCost: 20000000,
      actualCost: 20000000,
      ownerId: chiefEngineer.id,
      startDate: new Date('2026-01-20'),
      dueDate: new Date('2026-04-10'),
    },
  });

  await prisma.wBSNode.create({
    data: {
      projectId: project1.id,
      parentNodeId: deliv1_1.id,
      wbsCode: '1.1.2',
      name: 'Gate Driver Board PCB Fabrication & Firmware Flashing',
      nodeType: 'WORK_PACKAGE',
      order: 1,
      progress: 100,
      plannedCost: 15000000,
      actualCost: 15000000,
      ownerId: batteryLead.id,
      startDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-30'),
    },
  });

  // Deliverable 1.2
  const deliv1_2 = await prisma.wBSNode.create({
    data: {
      projectId: project1.id,
      parentNodeId: phase1.id,
      wbsCode: '1.2',
      name: '100kWh Immersion-Cooled Battery Pack',
      nodeType: 'DELIVERABLE',
      order: 1,
      progress: 60,
      plannedCost: 50000000,
      actualCost: 30000000,
      ownerId: batteryLead.id,
      startDate: new Date('2026-02-15'),
      dueDate: new Date('2026-07-30'),
    },
  });

  await prisma.wBSNode.create({
    data: {
      projectId: project1.id,
      parentNodeId: deliv1_2.id,
      wbsCode: '1.2.1',
      name: 'Immersion Dielectric Coolant Flow Mechanics CFD',
      nodeType: 'WORK_PACKAGE',
      order: 0,
      progress: 75,
      plannedCost: 25000000,
      actualCost: 18000000,
      ownerId: batteryLead.id,
      startDate: new Date('2026-02-20'),
      dueDate: new Date('2026-05-30'),
    },
  });

  await prisma.wBSNode.create({
    data: {
      projectId: project1.id,
      parentNodeId: deliv1_2.id,
      wbsCode: '1.2.2',
      name: 'Bottom Enclosure FEA Crush & Drop Protection Validation',
      nodeType: 'WORK_PACKAGE',
      order: 1,
      progress: 45,
      plannedCost: 25000000,
      actualCost: 12000000,
      ownerId: safetyOfficer.id,
      startDate: new Date('2026-03-01'),
      dueDate: new Date('2026-07-30'),
    },
  });

  // Phase 2.0
  const phase2 = await prisma.wBSNode.create({
    data: {
      projectId: project1.id,
      wbsCode: '2.0',
      name: 'Vehicle Dynamics & ADAS Homologation',
      nodeType: 'PHASE',
      order: 1,
      progress: 55,
      plannedCost: 65000000,
      actualCost: 51650000,
      ownerId: chassisLead.id,
      startDate: new Date('2026-02-01'),
      dueDate: new Date('2026-09-15'),
    },
  });

  // Deliverable 2.1
  const deliv2_1 = await prisma.wBSNode.create({
    data: {
      projectId: project1.id,
      parentNodeId: phase2.id,
      wbsCode: '2.1',
      name: 'Active Aerodynamics & Monocoque Chassis',
      nodeType: 'DELIVERABLE',
      order: 0,
      progress: 65,
      plannedCost: 40000000,
      actualCost: 35000000,
      ownerId: chassisLead.id,
      startDate: new Date('2026-02-10'),
      dueDate: new Date('2026-08-15'),
    },
  });

  // Deliverable 2.2
  const deliv2_2 = await prisma.wBSNode.create({
    data: {
      projectId: project1.id,
      parentNodeId: phase2.id,
      wbsCode: '2.2',
      name: 'Level 3 Perception Sensor Fusion Suite',
      nodeType: 'DELIVERABLE',
      order: 1,
      progress: 45,
      plannedCost: 25000000,
      actualCost: 16650000,
      ownerId: adasEngineer.id,
      startDate: new Date('2026-03-01'),
      dueDate: new Date('2026-09-15'),
    },
  });

  // ==========================================
  // PHASE 3: RESOURCE PROFILES & OVERLOAD SEED
  // ==========================================

  await prisma.resourceProfile.createMany({
    data: [
      {
        userId: chiefEngineer.id,
        projectId: project1.id,
        jobTitle: 'Program Director & Chief EV Architect',
        department: 'Executive Engineering',
        weeklyCapacityHours: 40.0,
        hourlyRate: 5500.0,
        skills: '800V SiC Architecture, APQP Stage Gates, Vehicle Integration, ISO 26262 ASIL-D',
      },
      {
        userId: batteryLead.id,
        projectId: project1.id,
        jobTitle: 'Battery Systems & Thermal Lead',
        department: 'Energy Storage Systems',
        weeklyCapacityHours: 40.0,
        hourlyRate: 4000.0,
        skills: 'Direct Immersion Dielectric Cooling, 100kWh NMC Pack, Thermal CFD',
      },
      {
        userId: adasEngineer.id,
        projectId: project1.id,
        jobTitle: 'ADAS Perception & Autonomy Lead',
        department: 'Autonomous Driving & Software',
        weeklyCapacityHours: 40.0,
        hourlyRate: 3500.0,
        skills: 'Flash LiDAR Point Cloud Fusion, 77GHz Radar, Deep Learning Vision, ROS2',
      },
      {
        userId: chassisLead.id,
        projectId: project1.id,
        jobTitle: '800V SiC Powertrain & Inverter Lead',
        department: 'Powertrain & Power Electronics',
        weeklyCapacityHours: 40.0,
        hourlyRate: 3800.0,
        skills: 'Silicon Carbide MOSFETs, 500kW Dual-Motor Dyno Tuning, Space-Vector PWM',
      },
      {
        userId: mfgLead.id,
        projectId: project1.id,
        jobTitle: 'Manufacturing & Tooling Specialist',
        department: 'Advanced Manufacturing & Production',
        weeklyCapacityHours: 40.0,
        hourlyRate: 3600.0,
        skills: 'Idra 9,000-Ton Giga Press Dies, Mold Flow FEA, Pilot Assembly Takt Time',
      },
      {
        userId: safetyOfficer.id,
        projectId: project1.id,
        jobTitle: 'Quality & Homologation Gatekeeper',
        department: 'Quality & Regulatory Compliance',
        weeklyCapacityHours: 40.0,
        hourlyRate: 4200.0,
        skills: 'UNECE R100 Rev. 3, Euro NCAP 5-Star Crash Certification, ISO 26262 Audit',
      },
    ],
  });

  // ==========================================
  // PHASE 3: SPECIALIZED TEST RIGS & EQUIPMENT
  // ==========================================

  await prisma.equipmentResource.createMany({
    data: [
      {
        projectId: project1.id,
        name: '500kW Dual-Motor High-Speed Powertrain Dyno Rig',
        category: 'Dyno Bench',
        location: 'Testing Bay 4, Powertrain Lab',
        status: 'IN_USE',
        costPerHour: 18000.0,
      },
      {
        projectId: project1.id,
        name: 'Full-Scale Aeroacoustic Automotive Wind Tunnel (300 km/h)',
        category: 'Wind Tunnel',
        location: 'Aero Testing Facility B',
        status: 'AVAILABLE',
        costPerHour: 45000.0,
      },
      {
        projectId: project1.id,
        name: 'Immersion Cell Thermal Runaway Containment Chamber',
        category: 'Thermal Chamber',
        location: 'Battery Safety Bunkers, Bay 2',
        status: 'CALIBRATING',
        costPerHour: 12000.0,
      },
      {
        projectId: project1.id,
        name: 'Hydraulic Multi-Axis Crash & Underbody Sled Test Rig',
        category: 'Crash Sled',
        location: 'Physical Impact Lab, Building C',
        status: 'AVAILABLE',
        costPerHour: 25000.0,
      },
    ],
  });

  // ==========================================
  // PHASE 4: APQP STAGE-GATES & CRITERIA SEED
  // ==========================================

  // Gate 0
  const g0 = await prisma.phaseGate.create({
    data: {
      projectId: project1.id,
      gateCode: 'G0',
      name: 'Concept Feasibility & EV Architecture Sign-Off',
      targetDate: new Date('2025-10-15'),
      status: 'APPROVED',
      reviewSummary: 'Steering Committee approved 800V silicon carbide powertrain topology and dual-motor architecture baseline.',
      signOffById: chiefEngineer.id,
      signOffDate: new Date('2025-10-15'),
      criteria: {
        create: [
          { description: 'Target range ≥ 550 km WLTP simulation validated', isMandatory: true, isMet: true, evidenceNotes: 'CFD & Powertrain 1D Model yielded 562 km WLTP estimated range.' },
          { description: 'High-voltage inverter packaging envelope fit in front monocoque', isMandatory: true, isMet: true, evidenceNotes: 'CAD volume cleared with 35mm suspension clearance.' },
        ],
      },
    },
  });

  // Gate 1
  const g1 = await prisma.phaseGate.create({
    data: {
      projectId: project1.id,
      gateCode: 'G1',
      name: 'Detailed Engineering Design & CAD Virtual Sign-Off',
      targetDate: new Date('2026-02-15'),
      status: 'APPROVED',
      reviewSummary: 'CAD Class-A surfaces frozen; Inverter thermal CFD simulation converged under 65°C junction temp.',
      signOffById: chiefEngineer.id,
      signOffDate: new Date('2026-02-15'),
      criteria: {
        create: [
          { description: '800V Inverter Thermal CFD simulation converged under 65°C junction temp', isMandatory: true, isMet: true, evidenceNotes: 'Peak temp reached 62.4°C at 500A continuous boost.' },
          { description: '100kWh Immersion battery pack structural drop simulation passed', isMandatory: true, isMet: true, evidenceNotes: 'CAE FEA impact simulation showed 0% enclosure breach.' },
          { description: 'Automotive safety hazard analysis & ASIL-D decomposition signed off', isMandatory: true, isMet: true, evidenceNotes: 'TUV Rheinland preliminary ISO 26262 audit passed.' },
        ],
      },
    },
  });

  // Gate 2 (Current Gate)
  const g2 = await prisma.phaseGate.create({
    data: {
      projectId: project1.id,
      gateCode: 'G2',
      name: 'Tooling Release & Prototype Rig Assembly',
      targetDate: new Date('2026-05-30'),
      status: 'IN_REVIEW',
      reviewSummary: 'Current active gate review. Idra Giga Press die sets in shipment; Battery pack prototype cells delivered.',
      criteria: {
        create: [
          { description: 'Giga Press aluminum casting die set CAD validated with mold flow analysis', isMandatory: true, isMet: true, evidenceNotes: 'Idra Group verified tooling drawings and flow simulation.' },
          { description: 'Flash LiDAR sensor fusion optical bench calibration complete', isMandatory: true, isMet: false, evidenceNotes: 'Optical calibration in progress on Bench #3.' },
          { description: 'Functional safety ISO 26262 Gate 2 audit findings remediated', isMandatory: true, isMet: true, evidenceNotes: 'All 4 audit non-conformances closed.' },
        ],
      },
    },
  });

  // Gate 3
  const g3 = await prisma.phaseGate.create({
    data: {
      projectId: project1.id,
      gateCode: 'G3',
      name: 'UNECE R100 Rev. 3 Homologation & Crash Test Pass',
      targetDate: new Date('2026-08-30'),
      status: 'UPCOMING',
      criteria: {
        create: [
          { description: 'Zero thermal runaway propagation under nail penetration (UNECE R100)', isMandatory: true, isMet: false },
          { description: 'Euro NCAP 50 km/h mobile barrier side impact under 18mm battery deflection', isMandatory: true, isMet: false },
        ],
      },
    },
  });

  // Gate 4
  const g4 = await prisma.phaseGate.create({
    data: {
      projectId: project1.id,
      gateCode: 'G4',
      name: 'SOP (Start of Production) Series Assembly Run',
      targetDate: new Date('2026-11-30'),
      status: 'UPCOMING',
      criteria: {
        create: [
          { description: 'Final Assembly Line takt time ≤ 90 seconds verified', isMandatory: true, isMet: false },
          { description: 'Overall plant first-time-yield > 98.5%', isMandatory: true, isMet: false },
        ],
      },
    },
  });

  // ==========================================
  // PHASE 4: ENGINEERING CHANGE ORDERS (ECO)
  // ==========================================

  await prisma.changeRequest.create({
    data: {
      projectId: project1.id,
      ecoCode: 'ECO-0104',
      title: 'Transition from 400V IGBT to 800V Silicon Carbide (SiC) Power Stage',
      description: 'Upgrade the main front and rear traction inverter modules from 400V silicon IGBTs to 800V planar SiC MOSFETs to enable 10-80% 350kW DC fast-charging in under 18 minutes.',
      reason: 'Competitive benchmarking against Porsche Taycan and Hyundai E-GMP 800V platforms.',
      costImpact: 3500000, // +₹35.0 Lakhs
      scheduleImpactDays: 14, // +14 Days
      riskImpact: 'Moderate component supply lead-time risk from STMicroelectronics / Wolfspeed.',
      status: 'APPROVED',
      requestedById: chiefEngineer.id,
      approvedById: chiefEngineer.id,
      approvedAt: new Date('2026-01-20'),
    },
  });

  await prisma.changeRequest.create({
    data: {
      projectId: project1.id,
      ecoCode: 'ECO-0105',
      title: 'Addition of Dual 128-Beam Solid-State LiDAR for Level 3 Urban Pilot',
      description: 'Integrate two flush-mounted solid-state LiDAR sensors behind the front bumper fascia to satisfy redundancy requirements for Level 3 hands-off highway chauffeur.',
      reason: 'Enhanced safety redundancy in adverse fog and nighttime driving conditions.',
      costImpact: 1500000, // +₹15.0 Lakhs
      scheduleImpactDays: 7, // +7 Days
      riskImpact: 'Higher thermal load and CAN-FD bandwidth consumption on the perception ECU.',
      status: 'IN_REVIEW',
      requestedById: adasEngineer.id,
    },
  });

  await prisma.changeRequest.create({
    data: {
      projectId: project1.id,
      ecoCode: 'ECO-0106',
      title: 'Switch to Direct Cell Immersion Dielectric Coolant Fluid',
      description: 'Replace standard water-glycol serpentine cold-plates with direct dielectric immersion fluid bath for the 100kWh cylindrical cell battery pack.',
      reason: 'Eliminates thermal runaway risk and reduces pack weight by 14 kg.',
      costImpact: -1000000, // -₹10.0 Lakhs (Cost Savings)
      scheduleImpactDays: -5, // -5 Days (Simpler assembly)
      riskImpact: 'Requires high-durability fluoropolymer elastomer seals.',
      status: 'APPROVED',
      requestedById: batteryLead.id,
      approvedById: chiefEngineer.id,
      approvedAt: new Date('2026-02-10'),
    },
  });

  console.log('Automobile Industry Dataset with Stage Gates, ECOs & Project Controls seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
