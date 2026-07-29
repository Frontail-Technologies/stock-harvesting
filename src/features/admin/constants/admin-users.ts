import type {
  AdminPlanFilter,
  AdminRoleFilter,
  AdminSortDirection,
  AdminUserFilters,
  AdminUserSortField,
} from "../types";

export const ADMIN_USER_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const ADMIN_USER_SORT_OPTIONS: {
  value: AdminUserSortField;
  label: string;
}[] = [
  { value: "createdAt", label: "Created date" },
  { value: "email", label: "Email" },
  { value: "name", label: "Name" },
  { value: "role", label: "Role" },
  { value: "plan", label: "Plan" },
];

export const ADMIN_USER_ROLE_OPTIONS: {
  value: AdminRoleFilter;
  label: string;
}[] = [
  { value: "", label: "Any role" },
  { value: "admin", label: "Admin" },
  { value: "user", label: "User" },
];

export const ADMIN_USER_PLAN_OPTIONS: {
  value: AdminPlanFilter;
  label: string;
}[] = [
  { value: "", label: "Any plan" },
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
];

export const ADMIN_USER_DIRECTION_OPTIONS: {
  value: AdminSortDirection;
  label: string;
}[] = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
];

export const DEFAULT_ADMIN_USER_FILTERS: AdminUserFilters = {
  q: "",
  role: "",
  plan: "",
  page: 1,
  limit: 20,
  sort: "createdAt",
  direction: "desc",
};
