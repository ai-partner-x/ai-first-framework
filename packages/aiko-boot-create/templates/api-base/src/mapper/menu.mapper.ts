import 'reflect-metadata';
import { Mapper, BaseMapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { Menu } from '../entity/menu.entity.js';

@Mapper(Menu)
export class MenuMapper extends BaseMapper<Menu> {}

