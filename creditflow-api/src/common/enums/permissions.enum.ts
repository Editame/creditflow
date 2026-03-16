export enum PermissionActions {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
}

export enum PermissionModules {
  USERS = 'users',
  ROLES = 'roles',
  PERMISSIONS = 'permissions',
  ROUTES = 'routes',
  CLIENTS = 'clients',
  LOANS = 'loans',
  PAYMENTS = 'payments',
  EXPENSES = 'expenses',
  REPORTS = 'reports',
  CONCEPTS = 'concepts',
  TENANTS = 'tenants',
  ADMIN = 'admin',
}

export enum Permission {
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export class Permissions {
  // Users
  static readonly USERS_CREATE = `${PermissionModules.USERS}.${PermissionActions.CREATE}`;
  static readonly USERS_READ = `${PermissionModules.USERS}.${PermissionActions.READ}`;
  static readonly USERS_UPDATE = `${PermissionModules.USERS}.${PermissionActions.UPDATE}`;
  static readonly USERS_DELETE = `${PermissionModules.USERS}.${PermissionActions.DELETE}`;

  // Roles
  static readonly ROLES_CREATE = `${PermissionModules.ROLES}.${PermissionActions.CREATE}`;
  static readonly ROLES_READ = `${PermissionModules.ROLES}.${PermissionActions.READ}`;
  static readonly ROLES_UPDATE = `${PermissionModules.ROLES}.${PermissionActions.UPDATE}`;
  static readonly ROLES_DELETE = `${PermissionModules.ROLES}.${PermissionActions.DELETE}`;

  // Permissions
  static readonly PERMISSIONS_CREATE = `${PermissionModules.PERMISSIONS}.${PermissionActions.CREATE}`;
  static readonly PERMISSIONS_READ = `${PermissionModules.PERMISSIONS}.${PermissionActions.READ}`;
  static readonly PERMISSIONS_UPDATE = `${PermissionModules.PERMISSIONS}.${PermissionActions.UPDATE}`;
  static readonly PERMISSIONS_DELETE = `${PermissionModules.PERMISSIONS}.${PermissionActions.DELETE}`;

  // Routes
  static readonly ROUTES_CREATE = `${PermissionModules.ROUTES}.${PermissionActions.CREATE}`;
  static readonly ROUTES_READ = `${PermissionModules.ROUTES}.${PermissionActions.READ}`;
  static readonly ROUTES_UPDATE = `${PermissionModules.ROUTES}.${PermissionActions.UPDATE}`;
  static readonly ROUTES_DELETE = `${PermissionModules.ROUTES}.${PermissionActions.DELETE}`;

  // Clients
  static readonly CLIENTS_CREATE = `${PermissionModules.CLIENTS}.${PermissionActions.CREATE}`;
  static readonly CLIENTS_READ = `${PermissionModules.CLIENTS}.${PermissionActions.READ}`;
  static readonly CLIENTS_UPDATE = `${PermissionModules.CLIENTS}.${PermissionActions.UPDATE}`;
  static readonly CLIENTS_DELETE = `${PermissionModules.CLIENTS}.${PermissionActions.DELETE}`;

  // Loans
  static readonly LOANS_CREATE = `${PermissionModules.LOANS}.${PermissionActions.CREATE}`;
  static readonly LOANS_READ = `${PermissionModules.LOANS}.${PermissionActions.READ}`;
  static readonly LOANS_UPDATE = `${PermissionModules.LOANS}.${PermissionActions.UPDATE}`;
  static readonly LOANS_DELETE = `${PermissionModules.LOANS}.${PermissionActions.DELETE}`;

  // Payments
  static readonly PAYMENTS_CREATE = `${PermissionModules.PAYMENTS}.${PermissionActions.CREATE}`;
  static readonly PAYMENTS_READ = `${PermissionModules.PAYMENTS}.${PermissionActions.READ}`;
  static readonly PAYMENTS_UPDATE = `${PermissionModules.PAYMENTS}.${PermissionActions.UPDATE}`;
  static readonly PAYMENTS_DELETE = `${PermissionModules.PAYMENTS}.${PermissionActions.DELETE}`;

  // Expenses
  static readonly EXPENSES_CREATE = `${PermissionModules.EXPENSES}.${PermissionActions.CREATE}`;
  static readonly EXPENSES_READ = `${PermissionModules.EXPENSES}.${PermissionActions.READ}`;
  static readonly EXPENSES_UPDATE = `${PermissionModules.EXPENSES}.${PermissionActions.UPDATE}`;
  static readonly EXPENSES_DELETE = `${PermissionModules.EXPENSES}.${PermissionActions.DELETE}`;

  // Reports
  static readonly REPORTS_READ = `${PermissionModules.REPORTS}.${PermissionActions.READ}`;
  static readonly REPORTS_EXPORT = `${PermissionModules.REPORTS}.${PermissionActions.EXPORT}`;

  // Concepts
  static readonly CONCEPTS_CREATE = `${PermissionModules.CONCEPTS}.${PermissionActions.CREATE}`;
  static readonly CONCEPTS_READ = `${PermissionModules.CONCEPTS}.${PermissionActions.READ}`;
  static readonly CONCEPTS_UPDATE = `${PermissionModules.CONCEPTS}.${PermissionActions.UPDATE}`;
  static readonly CONCEPTS_DELETE = `${PermissionModules.CONCEPTS}.${PermissionActions.DELETE}`;

  // Tenants
  static readonly TENANTS_CREATE = `${PermissionModules.TENANTS}.${PermissionActions.CREATE}`;
  static readonly TENANTS_READ = `${PermissionModules.TENANTS}.${PermissionActions.READ}`;
  static readonly TENANTS_UPDATE = `${PermissionModules.TENANTS}.${PermissionActions.UPDATE}`;
  static readonly TENANTS_DELETE = `${PermissionModules.TENANTS}.${PermissionActions.DELETE}`;

  // Admin
  static readonly ADMIN_ALL = `${PermissionModules.ADMIN}.all`;
}
