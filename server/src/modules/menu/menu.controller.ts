import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { MenuService } from "./menu.service";
import { UserDataBaseDto } from "../user/dto/user.dto";
import type { QueryMenuDto, CreateMenuDto, UpdateMenuDto } from "./dto/menu.dto";
import { ResponseWrapper } from "src/common/response.wrapper";

@UseGuards(JwtAuthGuard)
@Controller('system/menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /**
   * 获取用户路由菜单
   */
  @Get('getRouters')
  async getRouters(@Request() req) {
    // 从token中解析出的用户信息
    const user = req.user;

    // 构造UserDataBaseDto格式的用户数据
    const userData: UserDataBaseDto = {
      userId: user.userId,
      userName: user.userName,
      nickName: user.nickName,
      userType: user.userType,
      email: user.email,
      phonenumber: user.phonenumber,
      sex: user.sex,
      avatar: user.avatar,
      status: user.status,
      deptId: user.deptId,
      loginIp: user.loginIp,
      loginDate: user.loginDate,
      remark: user.remark,
      createTime: user.createTime,
      updateTime: user.updateTime,
    };

    return await this.menuService.getRouters(userData);
  }

  /**
   * 查询菜单列表
   */
  @Get('list')
  async listMenu(@Query() query: QueryMenuDto) {
    const { menus } = await this.menuService.findAll(query);
    return ResponseWrapper.success(menus, '获取菜单列表成功');
  }

  /**
   * 查询菜单详细
   * @param menuId 菜单ID
   */
  @Get(':menuId')
  async getMenu(@Param('menuId') menuId: number) {
    const menu = await this.menuService.findOne(+menuId);
    if (!menu) {
      return ResponseWrapper.error('菜单不存在');
    }
    return ResponseWrapper.success({
      ...menu,
      isCache: String(menu.isCache),
      isFrame: String(menu.isFrame),
    }, '查询成功');
  }

  /**
   * 查询菜单下拉树结构
   */
  @Get('treeselect')
  async treeselect() {
    const menuTree = await this.menuService.findMenuTree();
    return ResponseWrapper.success(menuTree, '查询成功');
  }

  /**
   * 根据角色ID查询菜单下拉树结构
   * @param roleId 角色ID
   */
  @Get('roleMenuTreeselect/:roleId')
  async roleMenuTreeselect(@Param('roleId') roleId: number) {
    const result = await this.menuService.findRoleMenuTree(+roleId);
    return ResponseWrapper.success(result, '查询成功');
  }

  /**
   * 根据租户套餐ID查询菜单下拉树结构
   * @param packageId 套餐ID
   */
  @Get('tenantPackageMenuTreeselect/:packageId')
  async tenantPackageMenuTreeselect(@Param('packageId') packageId: number) {
    const result = await this.menuService.findTenantPackageMenuTree(+packageId);
    return ResponseWrapper.success(result, '查询成功');
  }

  /**
   * 新增菜单
   */
  @Post()
  async addMenu(@Body() createMenuDto: CreateMenuDto) {
    const menu = await this.menuService.create(createMenuDto);
    return ResponseWrapper.success(menu, '新增成功');
  }

  /**
   * 修改菜单
   */
  @Put()
  async updateMenu(@Body() updateMenuDto: UpdateMenuDto) {
    const menu = await this.menuService.update(updateMenuDto);
    return ResponseWrapper.success(menu, '修改成功');
  }

  /**
   * 删除菜单
   */
  @Delete(':menuId')
  async delMenu(@Param('menuId') menuId: number) {
    await this.menuService.delete(+menuId);
    return ResponseWrapper.success(null, '删除成功');
  }

  /**
   * 级联删除菜单
   */
  @Delete('cascade/:menuIds')
  async cascadeDelMenu(@Param('menuIds') menuIds: string) {
    const ids = menuIds.split(',').map(id => +id);
    await this.menuService.cascadeDelete(ids);
    return ResponseWrapper.success(null, '删除成功');
  }
}