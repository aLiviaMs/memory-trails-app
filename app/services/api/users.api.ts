import { HttpBase } from "./httpBase"

// Define your response types
interface User {
  id: number
  name: string
  email: string
}

export class UsersApi extends HttpBase {
  constructor() {
    // Pass the entity (endpoint) name to the base class
    super("users")
  }

  // Implement your specific endpoint methods
  async getUsers() {
    return this.get<User[]>()
  }

  async getUser(id: number) {
    return this.get<User>(`/${id}`)
  }

  async createUser(userData: Omit<User, "id">) {
    return this.post<User>("", userData)
  }

  async updateUser(id: number, userData: Partial<User>) {
    return this.put<User>(`/${id}`, userData)
  }

  async deleteUser(id: number) {
    return this.delete<void>(`/${id}`)
  }
}
