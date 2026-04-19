export type UserRow = {
  id: number;
  username: string;
  role: "ADMIN" | "USER";
  createdAt: string;
};
