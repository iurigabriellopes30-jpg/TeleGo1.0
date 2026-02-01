
import { User, UserRole, AuthSession } from '../types';

const USERS_DB_KEY = 'telego_users_db';

export const authService = {
  register: async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Delay simulado
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    if (users.find((u: any) => u.email === email)) throw new Error('E-mail já cadastrado.');

    const newUser: User = {
      id: `user_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      role,
      createdAt: Date.now(),
      // Admins se auto-aprovam (pois possuem a chave secreta), outros precisam de aprovação
      approved: role === UserRole.ADMIN 
    };

    // Salva com a senha (simulação insegura de backend)
    users.push({ ...newUser, password });
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

    // NÃO retorna sessão para fluxo normal, mas Admin já entra aprovado
  },

  login: async (email: string, password: string): Promise<AuthSession> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    const userMatch = users.find((u: any) => u.email === email && u.password === password);
    
    if (!userMatch) throw new Error('Credenciais inválidas.');
    
    // Verificação de Aprovação
    if (!userMatch.approved) {
      throw new Error('Conta pendente de aprovação pelo administrador.');
    }

    const { password: _, ...user } = userMatch;
    return { user: user as User, token: `jwt-${user.id}` };
  },

  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    const index = users.findIndex((u: any) => u.id === userId);
    if (index === -1) throw new Error('Usuário não encontrado.');
    
    // Se estiver tentando alterar o email, verificar se já existe outro usuário com esse email
    if (data.email && data.email !== users[index].email) {
      const emailExists = users.some((u: any) => u.email === data.email && u.id !== userId);
      if (emailExists) throw new Error('Este e-mail já está em uso por outro usuário.');
    }
    
    users[index] = { ...users[index], ...data };
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    const { password: _, ...user } = users[index];
    return user as User;
  },

  changePassword: async (userId: string, currentPass: string, newPass: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    const index = users.findIndex((u: any) => u.id === userId);
    
    if (index === -1) throw new Error('Usuário não encontrado.');
    if (users[index].password !== currentPass) throw new Error('Senha atual incorreta.');
    
    users[index].password = newPass;
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  },

  // --- Funções Administrativas ---

  getAllUsers: (): User[] => {
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    return users.map((u: any) => {
      const { password, ...user } = u;
      return user;
    });
  },

  approveUser: (userId: string): void => {
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    const updatedUsers = users.map((u: any) => 
      u.id === userId ? { ...u, approved: true } : u
    );
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(updatedUsers));
  },

  deleteUser: (userId: string): void => {
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    const filteredUsers = users.filter((u: any) => u.id !== userId);
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(filteredUsers));
  }
};
