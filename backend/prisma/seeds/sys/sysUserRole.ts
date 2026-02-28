import { Prisma } from '@prisma/client';

import { prisma } from '../helper';

export const initSysUserRole = async () => {
  const data: Prisma.SysUserRoleCreateInput[] = [
    {
      userId: '1',
      roleId: '1',
    },
    {
      userId: '2',
      roleId: '2',
    },
    {
      userId: '3',
      roleId: '3',
    },
  ];

  for (const ur of data) {
    await prisma.sysUserRole.upsert({
      where: { userId_roleId: { userId: ur.userId, roleId: ur.roleId } },
      update: ur,
      create: ur,
    });
  }
};
