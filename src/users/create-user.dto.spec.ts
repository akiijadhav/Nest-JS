import { CreateUserDto } from './create-user.dto';
import { validate, ValidationError } from 'class-validator';

describe('CreateUserDto', () => {
  let dto = new CreateUserDto();
  beforeEach(() => {
    dto = new CreateUserDto();
    dto.email = 'test@test.com';
    dto.name = 'Akii';
    dto.password = '123456A#';
  });

  const testPassword = async (password: string, message: string) => {
    //3x A
    // Arrange
    dto.password = password;
    // Act
    const errors: ValidationError[] = await validate(dto);
    const passwordError = errors.find((e) => e.property === 'password');
    // Assert
    console.log(errors);
    expect(passwordError).not.toBeUndefined();
    const messages = Object.values(passwordError?.constraints ?? {});
    expect(messages).toContain(message);
  };

  it('should validate complete valid data', async () => {
    //3x A
    // Arrange
    // Act
    const errors: ValidationError[] = await validate(dto);
    // Assert
    expect(errors.length).toBe(0);
  });

  it('should fail on invalid email', async () => {
    //3x A
    // Arrange
    dto.email = 'invalid-email';
    // Act
    const errors: ValidationError[] = await validate(dto);
    // Assert
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should not have empty name', async () => {
    //3x A
    // Arrange
    dto.name = '';
    // Act
    const errors: ValidationError[] = await validate(dto);
    // Assert
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('name');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  // 1) At least 1 uppercase letter
  // 2) at least 1 number
  // 3) At least 1 special character
  it('should fail without 1 uppercase letter', async () => {
    //3x A
    await testPassword('abcdfa', 'Password must contain 1 uppercase letter');
  });

  it('should fail without at least 1 number', async () => {
    //3x A
    await testPassword('AbcdefA', 'Password must contain at least 1 number');
  });

  it('should fail without at least 1 special character', async () => {
    //3x A
    await testPassword(
      'AbcdefA1',
      'Password must contain at least 1 special character',
    );
  });
});
