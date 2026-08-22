import { Request, Response, NextFunction } from 'express';

/**
 * Role-based access control middleware.
 * Usage: requireRole('admin') or requireRole('admin', 'student')
 * Must be used AFTER authenticate middleware.
 */
function requireRole(...roles: Array<'student' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
      return;
    }
    next();
  };
}

export default requireRole;
