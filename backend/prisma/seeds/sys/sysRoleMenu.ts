import { Prisma } from '@prisma/client';

import { prisma } from '../helper';

export const initSysRoleMenu = async () => {
  const data: Prisma.SysRoleMenuCreateInput[] = [
    {
      roleId: '1',
      menuId: 50,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 54,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 62,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 63,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 64,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 65,
      domain: 'built-in',
    },
    {
      roleId: '2',
      menuId: 50,
      domain: 'built-in',
    },
    {
      roleId: '2',
      menuId: 62,
      domain: 'built-in',
    },
    {
      roleId: '3',
      menuId: 50,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 51,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 52,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 71,
      domain: 'built-in',
    },
    {
      roleId: '1',
      menuId: 72,
      domain: 'built-in',
    },
  ];

  for (const rm of data) {
    await prisma.sysRoleMenu.upsert({
      where: { roleId_menuId_domain: { roleId: rm.roleId, menuId: rm.menuId, domain: rm.domain } },
      update: rm,
      create: rm,
    });
  }
};
