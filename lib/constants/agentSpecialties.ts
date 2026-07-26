// Shared between the agents directory filter (app/(public)/agents/page.tsx)
// and the agent profile editor (components/dashboard/profile/ProfileEditor.tsx)
// so the filter's values always match what agents can actually select.
export const AGENT_SPECIALTIES = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "plots", label: "Plots" },
  { value: "new_projects", label: "New Projects" },
  { value: "rental", label: "Rental" },
  { value: "investment", label: "Investment" },
  { value: "industrial", label: "Industrial" },
  { value: "agricultural", label: "Agricultural" },
] as const;
