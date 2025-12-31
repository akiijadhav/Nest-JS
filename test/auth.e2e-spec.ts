import request from 'supertest';
import { TestSetup } from './utils/test-setup';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/user.entity';
import { PasswordService } from '../src/users/password/password.service';
import { Role } from '../src/users/role.enum';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';

describe('Authentication & Authorization (e2e)', () => {
  let testSetup: TestSetup;

  beforeEach(async () => {
    testSetup = await TestSetup.create(AppModule);
  });

  afterEach(async () => {
    await testSetup.cleanup();
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  const testUser = {
    email: 'test@example.com',
    password: 'Password123!',
    name: 'Test User',
  };

  it('should require auth', () => {
    return request(testSetup.app.getHttpServer()).get('/tasks').expect(401);
  });

  it('should allow public route access', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send(testUser)
      .expect(201);
  });

  it('should include roles in JWT token', async () => {
    const userRepo = testSetup.app.get<Repository<User>>(
      getRepositoryToken(User),
    );

    const passwordService = testSetup.app.get(PasswordService);
    const hashedPassword = await passwordService.hash(testUser.password);

    await userRepo.save({
      ...testUser,
      roles: [Role.ADMIN],
      password: hashedPassword,
    });

    const response = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
        name: testUser.name,
      });
    const body = response.body as { accessToken: string };
    const jwtService = testSetup.app.get(JwtService);
    const decoded = jwtService.verify<{ roles: Role[] }>(body.accessToken);

    expect(decoded.roles).toBeDefined();
    expect(decoded.roles).toContain(Role.ADMIN);
  });

  it('/auth/register (POST)', async () => {
    return request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201)
      .then((res) => {
        const { email, name } = res.body as { email: string; name: string };
        expect(email).toBe(testUser.email);
        expect(name).toBe(testUser.name);
        expect(res.body).not.toHaveProperty('password');
      });
  });

  it('/auth/register (POST) - duplicate email', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(409);
  });

  it('/auth/login (POST)', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const response = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
        name: testUser.name,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('accessToken');
  });

  it('/auth/profile (GET)', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const response = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
        name: testUser.name,
      });

    const token = response.body as {
      accessToken?: string;
    };

    return await request(testSetup.app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${token.accessToken}`)
      .expect(200)
      .expect((res) => {
        const body = res.body as {
          email: string;
          name: string;
          password?: string;
          accessToken?: string;
        };

        expect(body.email).toBe(testUser.email);
        expect(body.name).toBe(testUser.name);
        expect(body).not.toHaveProperty('password');
      });
  });

  it('/auth/admin (GET) - admin access', async () => {
    const userRepo = testSetup.app.get<Repository<User>>(
      getRepositoryToken(User),
    );

    const passwordService = testSetup.app.get(PasswordService);
    const hashedPassword = await passwordService.hash(testUser.password);

    await userRepo.save({
      ...testUser,
      roles: [Role.ADMIN],
      password: hashedPassword,
    });

    const response = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
        name: testUser.name,
      });

    const token = response.body as {
      accessToken?: string;
    };

    return request(testSetup.app.getHttpServer())
      .get('/auth/admin')
      .set('Authorization', `Bearer ${token.accessToken}`)
      .expect(200)
      .expect((res) => {
        const body = res.body as { message: string };
        expect(body.message).toBe('This is for admin only!');
      });
  });

  it('/auth/admin (GET) - regular user denied', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const response = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    const token = response.body as { accessToken?: string };

    return await request(testSetup.app.getHttpServer())
      .get('/auth/admin')
      .set('Authorization', `Bearer ${token.accessToken}`)
      .expect(403);
  });

  it('/auth/register (POST) - attempting to register as an admin', async () => {
    const userAdmin = {
      ...testUser,
      roles: [Role.ADMIN],
    };
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(userAdmin)
      .expect(201)
      .expect((res) => {
        const { roles } = res.body as { roles: Role[] };
        expect(roles).toEqual([Role.USER]);
      });
  });
});
