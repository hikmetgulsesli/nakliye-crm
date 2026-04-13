import { Request, Response, NextFunction } from 'express';

export function rbac(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Yetkilendirme gerekli' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Bu islem icin yetkiniz yok' });
    }
    next();
  };
}
