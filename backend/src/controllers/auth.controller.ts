import { Request, Response, NextFunction } from 'express';
import { authService, RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from '../services/auth.service';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = RegisterSchema.parse(req.body);
      const result = await authService.register(data, req.ip);
      res.status(201).json({
        message: 'Registration successful. Please check your email to verify your account.',
        userId: result.userId,
      });
    } catch (err) {
      next(err);
    }
  },

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.query as { token: string };
      if (!token) {
        res.status(400).json({ error: 'Verification token required' });
        return;
      }
      const result = await authService.verifyEmail(token);
      res.json({ message: 'Email verified successfully', email: result.email });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = LoginSchema.parse(req.body);
      const result = await authService.login(data, req.ip);

      // Set refresh token in HttpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth',
      });

      res.json({
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (err) {
      next(err);
    }
  },

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!token) {
        res.status(401).json({ error: 'Refresh token required' });
        return;
      }

      const result = await authService.refreshToken(token, req.ip);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth',
      });

      res.json({ accessToken: result.accessToken });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const accessToken = req.headers.authorization?.slice(7) || '';
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

      await authService.logout(accessToken, refreshToken);

      res.clearCookie('refreshToken', { path: '/api/auth' });
      res.json({ message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response) {
    res.json({ user: req.user });
  },
};
