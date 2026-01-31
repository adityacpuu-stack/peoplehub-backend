import {
  emailSchema,
  passwordSchema,
  phoneSchema,
  nikSchema,
  paginationSchema,
  dateStringSchema,
} from '../../validations/common.schema';
import { loginSchema, changePasswordSchema } from '../../validations/auth.schema';

describe('Validation Schemas', () => {
  describe('Common Schemas', () => {
    describe('emailSchema', () => {
      it('should accept valid email', () => {
        const result = emailSchema.safeParse('test@example.com');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe('test@example.com');
        }
      });

      it('should reject invalid email', () => {
        const result = emailSchema.safeParse('invalid-email');
        expect(result.success).toBe(false);
      });

      it('should lowercase email', () => {
        const result = emailSchema.safeParse('TEST@EXAMPLE.COM');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe('test@example.com');
        }
      });
    });

    describe('passwordSchema', () => {
      it('should accept valid password', () => {
        const result = passwordSchema.safeParse('Password123');
        expect(result.success).toBe(true);
      });

      it('should reject short password', () => {
        const result = passwordSchema.safeParse('Pass1');
        expect(result.success).toBe(false);
      });

      it('should reject password without uppercase', () => {
        const result = passwordSchema.safeParse('password123');
        expect(result.success).toBe(false);
      });

      it('should reject password without lowercase', () => {
        const result = passwordSchema.safeParse('PASSWORD123');
        expect(result.success).toBe(false);
      });

      it('should reject password without number', () => {
        const result = passwordSchema.safeParse('PasswordABC');
        expect(result.success).toBe(false);
      });
    });

    describe('phoneSchema', () => {
      it('should accept valid Indonesian phone number', () => {
        const validNumbers = ['081234567890', '6281234567890', '+6281234567890'];
        validNumbers.forEach((num) => {
          const result = phoneSchema.safeParse(num);
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid phone number', () => {
        const result = phoneSchema.safeParse('123456');
        expect(result.success).toBe(false);
      });
    });

    describe('nikSchema', () => {
      it('should accept valid NIK (16 digits)', () => {
        const result = nikSchema.safeParse('3201234567890001');
        expect(result.success).toBe(true);
      });

      it('should reject NIK with wrong length', () => {
        const result = nikSchema.safeParse('12345');
        expect(result.success).toBe(false);
      });

      it('should reject NIK with non-numeric characters', () => {
        const result = nikSchema.safeParse('320123456789000A');
        expect(result.success).toBe(false);
      });
    });

    describe('paginationSchema', () => {
      it('should accept valid pagination', () => {
        const result = paginationSchema.safeParse({ page: 1, limit: 20 });
        expect(result.success).toBe(true);
      });

      it('should use defaults when not provided', () => {
        const result = paginationSchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
          expect(result.data.limit).toBe(20);
        }
      });

      it('should reject negative page', () => {
        const result = paginationSchema.safeParse({ page: -1, limit: 20 });
        expect(result.success).toBe(false);
      });

      it('should reject limit over 100', () => {
        const result = paginationSchema.safeParse({ page: 1, limit: 200 });
        expect(result.success).toBe(false);
      });

      it('should coerce string to number', () => {
        const result = paginationSchema.safeParse({ page: '2', limit: '30' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(2);
          expect(result.data.limit).toBe(30);
        }
      });
    });

    describe('dateStringSchema', () => {
      it('should accept valid date string', () => {
        const result = dateStringSchema.safeParse('2024-01-15');
        expect(result.success).toBe(true);
      });

      it('should reject invalid date format', () => {
        const invalidDates = ['2024/01/15', '15-01-2024', '2024-1-15'];
        invalidDates.forEach((date) => {
          const result = dateStringSchema.safeParse(date);
          expect(result.success).toBe(false);
        });
      });
    });
  });

  describe('Auth Schemas', () => {
    describe('loginSchema', () => {
      it('should accept valid login data', () => {
        const result = loginSchema.safeParse({
          email: 'user@example.com',
          password: 'password123',
        });
        expect(result.success).toBe(true);
      });

      it('should reject missing email', () => {
        const result = loginSchema.safeParse({ password: 'password123' });
        expect(result.success).toBe(false);
      });

      it('should reject missing password', () => {
        const result = loginSchema.safeParse({ email: 'user@example.com' });
        expect(result.success).toBe(false);
      });
    });

    describe('changePasswordSchema', () => {
      it('should accept valid password change', () => {
        const result = changePasswordSchema.safeParse({
          current_password: 'OldPassword123',
          new_password: 'NewPassword123',
          confirm_password: 'NewPassword123',
        });
        expect(result.success).toBe(true);
      });

      it('should reject mismatched passwords', () => {
        const result = changePasswordSchema.safeParse({
          current_password: 'OldPassword123',
          new_password: 'NewPassword123',
          confirm_password: 'DifferentPassword123',
        });
        expect(result.success).toBe(false);
      });
    });
  });
});
