import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Menu } from "src/entities/menu.entity";
import { MenuController } from "./menu.controller";
import { MenuService } from "./menu.service";
import { AuthModule } from "../auth/auth.module";


@Module({
  imports: [TypeOrmModule.forFeature([Menu]), AuthModule],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService],
})

export class MenuModule {

}