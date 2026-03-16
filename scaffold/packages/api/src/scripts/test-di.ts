import 'reflect-metadata';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createApp, Container, injectAutowiredProperties, getAutowiredProperties } from '@ai-partner-x/aiko-boot';
import { AuthService } from '../service/auth.service.js';
import { UserMapper } from '../mapper/user.mapper.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function test() {
    console.log('Creating app context...');
    const app = await createApp({ srcDir: __dirname });
    await app.run();

    console.log('Testing AuthService dependency injection...');

    try {
        const authService = Container.resolve(AuthService);
        console.log('AuthService resolved:', authService);
        console.log('AuthService constructor:', authService.constructor);
        console.log('AuthService constructor name:', authService.constructor.name);

        const autowiredProps = getAutowiredProperties(authService.constructor);
        console.log('Autowired properties:', autowiredProps);

        console.log('AuthService.userMapper:', authService.userMapper);
        console.log('AuthService.userRoleMapper:', authService.userRoleMapper);
        console.log('AuthService.roleMapper:', authService.roleMapper);
        console.log('AuthService.roleMenuMapper:', authService.roleMenuMapper);
        console.log('AuthService.menuMapper:', authService.menuMapper);

        if (authService.login) {
            console.log('AuthService.login method exists');
        } else {
            console.log('AuthService.login method does NOT exist');
        }
    } catch (e: any) {
        console.error('Failed to resolve AuthService:', e.message);
        console.error(e.stack);
    }

    process.exit(0);
}

test().catch(console.error);
