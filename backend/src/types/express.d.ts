// Augment Express Request to carry the decoded JWT payload
declare namespace Express {
  interface Request {
    user?: {
      id: number;
      role: 'student' | 'admin';
    };
  }
}
