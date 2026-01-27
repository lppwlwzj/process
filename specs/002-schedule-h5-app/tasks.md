# Tasks: 智能排班助手H5前端应用 - React技术栈迁移

**Input**: Design documents from `/specs/002-schedule-h5-app/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `schedule-h5-react/src/` at repository root
- Paths shown below follow the structure defined in plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure `schedule-h5-react/` with directories per plan.md
- [x] T002 Initialize React + TypeScript project using Vite template in `schedule-h5-react/`
- [x] T003 [P] Install core dependencies (react-router-dom, zustand, dayjs, axios, sass, clsx) in `schedule-h5-react/package.json`
- [x] T004 [P] Configure Vite build tool in `schedule-h5-react/vite.config.ts`
- [x] T005 [P] Configure TypeScript compiler in `schedule-h5-react/tsconfig.json`
- [x] T006 [P] Setup path aliases (@/*) in `schedule-h5-react/vite.config.ts` and `schedule-h5-react/tsconfig.json`
- [x] T007 Create `schedule-h5-react/index.html` with viewport meta tag for mobile
- [x] T008 [P] Copy static assets (tab icons) to `schedule-h5-react/public/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Type Definitions

- [x] T009 [P] [US1] Create ChatMessage and SuggestedSchedule types in `schedule-h5-react/src/types/chat.ts`
- [x] T010 [P] [US2] Create Schedule, ScheduleFilter, ProjectType types in `schedule-h5-react/src/types/schedule.ts`

### Utility Functions

- [x] T011 [P] Implement HTTP request utility with axios interceptors in `schedule-h5-react/src/utils/request.ts`
- [x] T012 [P] Implement SSE stream utility with AsyncGenerator in `schedule-h5-react/src/utils/sse.ts`

### State Management Stores

- [x] T013 [P] [US1] Create ChatStore with Zustand and persist middleware in `schedule-h5-react/src/stores/chatStore.ts`
- [x] T014 [P] [US2] Create ScheduleStore with Zustand in `schedule-h5-react/src/stores/scheduleStore.ts`

### API Services

- [x] T015 [P] [US1] Create AI schedule API service (sendChatMessage, confirmSchedule, getChatHistory) in `schedule-h5-react/src/services/aiSchedule.ts`
- [x] T016 [P] [US2] Create schedule API service (getScheduleList) in `schedule-h5-react/src/services/schedule.ts`

### Custom Hooks

- [x] T017 [US1] Create useSSE hook for handling SSE stream in `schedule-h5-react/src/hooks/useSSE.ts`
- [x] T018 [US2] Create useScroll hook for scroll position management in `schedule-h5-react/src/hooks/useScroll.ts`

### Global Styles

- [x] T019 [P] Create SCSS variables file in `schedule-h5-react/src/styles/variables.scss`
- [x] T020 [P] Create SCSS mixins file in `schedule-h5-react/src/styles/mixins.scss`
- [x] T021 Create global styles with mobile adaptation in `schedule-h5-react/src/styles/index.scss`

### Routing Setup

- [x] T022 Configure React Router with routes in `schedule-h5-react/src/App.tsx`
- [x] T023 Create main entry point in `schedule-h5-react/src/main.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 智能对话AI页面 (Priority: P1) 🎯 MVP

**Goal**: 用户通过自然语言对话与AI助手交互，查询排班情况、检查时间冲突、创建排班记录。支持SSE流式响应、对话历史保存、VIP优先插入确认。

**Independent Test**: 用户可以打开对话页面，发送消息，接收AI流式响应，确认创建排班，查看对话历史。所有功能独立于日程页面工作。

### Implementation for User Story 1

- [x] T024 [P] [US1] Create ChatMessage component in `schedule-h5-react/src/components/ChatMessage/index.tsx`
- [x] T025 [P] [US1] Create ChatMessage styles in `schedule-h5-react/src/components/ChatMessage/index.module.scss`
- [x] T026 [US1] Implement Chat page component with message list and input in `schedule-h5-react/src/pages/Chat/index.tsx`
- [x] T027 [US1] Create Chat page styles in `schedule-h5-react/src/pages/Chat/index.module.scss`
- [x] T028 [US1] Integrate useSSE hook in Chat page for sending messages
- [x] T029 [US1] Implement message list rendering with auto-scroll in Chat page
- [x] T030 [US1] Implement input handling and send button in Chat page
- [x] T031 [US1] Add loading state and error handling in Chat page
- [x] T032 [US1] Implement schedule confirmation UI in ChatMessage component
- [x] T033 [US1] Integrate confirmSchedule API call when user confirms
- [x] T034 [US1] Load chat history on page mount using getChatHistory API
- [x] T035 [US1] Implement session ID persistence in ChatStore
- [x] T036 [US1] Add network error retry mechanism in useSSE hook
- [x] T037 [US1] Implement typing indicator during SSE streaming

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - 日历日程页面 (Priority: P1)

**Goal**: 用户通过日历视图查看和管理排班日程，支持按日期、医生、诊室筛选。点击日历上的日期可跳转到该日期的详情页，查看该日期的所有排班记录，按时间段分组显示。

**Independent Test**: 用户可以打开日程页面，查看日历，选择日期查看详情，筛选排班记录。所有功能独立于对话页面工作。

### Implementation for User Story 2

- [X] T038 [P] [US2] Create Calendar component in `schedule-h5-react/src/components/Calendar/index.tsx`
- [X] T039 [P] [US2] Create Calendar styles in `schedule-h5-react/src/components/Calendar/index.module.scss`
- [X] T040 [P] [US2] Create ScheduleItem component in `schedule-h5-react/src/components/ScheduleItem/index.tsx`
- [X] T041 [P] [US2] Create ScheduleItem styles in `schedule-h5-react/src/components/ScheduleItem/index.module.scss`
- [X] T042 [US2] Implement Schedule page with calendar and filter bar in `schedule-h5-react/src/pages/Schedule/index.tsx`
- [X] T043 [US2] Create Schedule page styles in `schedule-h5-react/src/pages/Schedule/index.module.scss`
- [X] T044 [US2] Implement date selection handler in Calendar component
- [X] T045 [US2] Implement doctor filter dropdown in Schedule page
- [X] T046 [US2] Implement room filter dropdown in Schedule page
- [X] T047 [US2] Load schedule list on page mount and filter change
- [X] T048 [US2] Implement schedule list rendering in Schedule page
- [X] T049 [US2] Create Schedule Detail page in `schedule-h5-react/src/pages/Schedule/Detail/index.tsx`
- [X] T050 [US2] Create Schedule Detail page styles in `schedule-h5-react/src/pages/Schedule/Detail/index.module.scss`
- [X] T051 [US2] Implement time slot grouping logic (morning/afternoon) in Schedule Detail page
- [X] T052 [US2] Render schedule items grouped by time period in Schedule Detail page
- [X] T053 [US2] Display schedule details (time, doctor, nurse, customer, project, remark) in ScheduleItem
- [X] T054 [US2] Implement navigation from Schedule page to Detail page
- [X] T055 [US2] Implement back button navigation in Detail page
- [X] T056 [US2] Add empty state when no schedules found
- [X] T057 [US2] Implement pull-to-refresh in Schedule page
- [X] T058 [US2] Add loading state during schedule list fetch

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - 底部Tab导航 (Priority: P2)

**Goal**: 用户通过底部Tab栏在对话页面和日程页面之间切换，保持页面状态和滚动位置。

**Independent Test**: 用户可以点击Tab切换页面，切换后状态保持，滚动位置保持。

### Implementation for User Story 3

- [X] T059 [P] [US3] Create TabBar component in `schedule-h5-react/src/components/TabBar/index.tsx`
- [X] T060 [P] [US3] Create TabBar styles in `schedule-h5-react/src/components/TabBar/index.module.scss`
- [X] T061 [US3] Implement tab icons (chat, schedule) in TabBar component
- [X] T062 [US3] Implement active tab highlighting in TabBar component
- [X] T063 [US3] Integrate TabBar with React Router navigation
- [X] T064 [US3] Implement route-based active tab state in TabBar
- [X] T065 [US3] Add scroll position preservation using useScroll hook
- [X] T066 [US3] Ensure page state persistence when switching tabs
- [X] T067 [US3] Add TabBar to App.tsx layout

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T068 [P] Add error boundary component in `schedule-h5-react/src/components/ErrorBoundary/index.tsx`
- [X] T069 [P] Implement mobile viewport optimization (prevent zoom, safe area)
- [X] T070 [P] Add loading spinner component in `schedule-h5-react/src/components/Loading/index.tsx`
- [X] T071 [P] Add empty state component in `schedule-h5-react/src/components/EmptyState/index.tsx`
- [X] T072 Optimize bundle size with code splitting for routes
- [X] T073 Add performance monitoring for page load times
- [X] T074 Implement offline detection and error messaging
- [X] T075 Add keyboard accessibility support
- [ ] T076 Optimize images and assets for mobile
- [X] T077 Add meta tags for mobile web app
- [ ] T078 Test on iOS Safari and Android Chrome
- [ ] T079 Test responsive layout (320px-768px width)
- [ ] T080 Test landscape orientation support
- [ ] T081 Run quickstart.md validation
- [X] T082 Code cleanup and refactoring
- [X] T083 Update README with setup and run instructions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent of US1, can run in parallel
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 and US2 pages existing

### Within Each User Story

- Type definitions before components
- Components before pages
- Hooks before page integration
- Core implementation before error handling
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003-T008)
- All Foundational type definitions marked [P] can run in parallel (T009-T010)
- All Foundational utilities marked [P] can run in parallel (T011-T012)
- All Foundational stores marked [P] can run in parallel (T013-T014)
- All Foundational API services marked [P] can run in parallel (T015-T016)
- All Foundational styles marked [P] can run in parallel (T019-T020)
- Once Foundational phase completes, US1 and US2 can start in parallel
- Components within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all components for User Story 1 together:
Task: "Create ChatMessage component in schedule-h5-react/src/components/ChatMessage/index.tsx"
Task: "Create ChatMessage styles in schedule-h5-react/src/components/ChatMessage/index.module.scss"

# These can run in parallel as they touch different files
```

---

## Parallel Example: User Story 2

```bash
# Launch all components for User Story 2 together:
Task: "Create Calendar component in schedule-h5-react/src/components/Calendar/index.tsx"
Task: "Create Calendar styles in schedule-h5-react/src/components/Calendar/index.module.scss"
Task: "Create ScheduleItem component in schedule-h5-react/src/components/ScheduleItem/index.tsx"
Task: "Create ScheduleItem styles in schedule-h5-react/src/components/ScheduleItem/index.module.scss"

# All component creation tasks can run in parallel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Chat page)
   - Developer B: User Story 2 (Schedule page)
   - Developer C: User Story 3 (TabBar) - can start after US1/US2 pages exist
3. Stories complete and integrate independently

---

## Task Summary

- **Total Tasks**: 83
- **Phase 1 (Setup)**: 8 tasks
- **Phase 2 (Foundational)**: 15 tasks
- **Phase 3 (US1 - Chat)**: 14 tasks
- **Phase 4 (US2 - Schedule)**: 21 tasks
- **Phase 5 (US3 - TabBar)**: 9 tasks
- **Phase 6 (Polish)**: 16 tasks

**Parallel Opportunities**: 
- 35+ tasks can run in parallel (marked with [P])
- US1 and US2 can be developed in parallel after Foundational phase

**Suggested MVP Scope**: 
- Phase 1 (Setup) + Phase 2 (Foundational) + Phase 3 (US1 - Chat) = 37 tasks
- This delivers a working chat interface with AI integration

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Mobile-first: All components must be designed for mobile H5 (320px-768px width)
- Performance: Ensure page load < 3s, SSE first chunk < 1s, tab switch < 5s
