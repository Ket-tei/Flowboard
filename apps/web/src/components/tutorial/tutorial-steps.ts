export type TutorialStep = {
  id: string;
  titleKey: string;
  descKey: string;
  target?: string;
};

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    titleKey: "tutorial.step1Title",
    descKey: "tutorial.step1Desc",
  },
  {
    id: "nav-dashboard",
    titleKey: "tutorial.step2Title",
    descKey: "tutorial.step2Desc",
    target: '[data-tutorial="nav-dashboard"]',
  },
  {
    id: "nav-screens",
    titleKey: "tutorial.step3Title",
    descKey: "tutorial.step3Desc",
    target: '[data-tutorial="nav-screens"]',
  },
  {
    id: "nav-accounts",
    titleKey: "tutorial.step4Title",
    descKey: "tutorial.step4Desc",
    target: '[data-tutorial="nav-accounts"]',
  },
  {
    id: "nav-settings",
    titleKey: "tutorial.step5Title",
    descKey: "tutorial.step5Desc",
    target: '[data-tutorial="nav-settings"]',
  },
  {
    id: "dashboard-add-widget",
    titleKey: "tutorial.step6Title",
    descKey: "tutorial.step6Desc",
    target: '[data-tutorial="dashboard-add-widget"]',
  },
  {
    id: "done",
    titleKey: "tutorial.step7Title",
    descKey: "tutorial.step7Desc",
  },
];
