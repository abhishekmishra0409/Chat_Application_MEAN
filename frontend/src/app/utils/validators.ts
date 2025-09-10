export class Validators {
  static email(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static password(password: string): boolean {
    return password.length >= 6;
  }

  static username(username: string): boolean {
    return username.length >= 3 && username.length <= 30;
  }
}
