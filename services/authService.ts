
import { User, UserRole, AuthSession } from '../types';
import { supabase } from './supabaseClient';

export const authService = {
  register: async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role
        }
      }
    });

    if (error) throw error;
  },

  login: async (email: string, password: string): Promise<AuthSession> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    if (!data.user) throw new Error('Usuário não encontrado.');

    // Buscar perfil na tabela pública para verificar aprovação e dados extras
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) throw profileError;

    if (!profile.approved) {
      // Se não aprovado, faz sign out imediatamente
      await supabase.auth.signOut();
      throw new Error('Conta pendente de aprovação pelo administrador.');
    }

    return {
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role as UserRole,
        avatar: profile.avatar,
        createdAt: new Date(profile.created_at).getTime(),
        approved: profile.approved
      },
      token: data.session?.access_token || ''
    };
  },

  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({
        name: data.name,
        avatar: data.avatar,
        // email não é alterado aqui geralmente no Supabase Auth sem fluxo de confirmação
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: updatedProfile.id,
      name: updatedProfile.name,
      email: updatedProfile.email,
      role: updatedProfile.role as UserRole,
      avatar: updatedProfile.avatar,
      createdAt: new Date(updatedProfile.created_at).getTime(),
      approved: updatedProfile.approved
    };
  },

  changePassword: async (userId: string, currentPass: string, newPass: string): Promise<void> => {
    // Nota: O Supabase Auth geralmente requer que o usuário esteja logado
    // ou use um fluxo de reset. Aqui simplificamos usando updatePassword.
    const { error } = await supabase.auth.updateUser({
      password: newPass
    });

    if (error) throw error;
  },

  // --- Funções Administrativas ---

  getAllUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      role: p.role as UserRole,
      avatar: p.avatar,
      createdAt: new Date(p.created_at).getTime(),
      approved: p.approved
    }));
  },

  approveUser: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .update({ approved: true })
      .eq('id', userId);

    if (error) throw error;
  },

  deleteUser: async (userId: string): Promise<void> => {
    // Nota: Deletar o perfil na tabela pública é Cascade se configurado no SQL,
    // mas deletar do Auth requer privilégios de Admin (Service Role) que não
    // devem estar no frontend. Geralmente o Admin desativa ou o perfil é removido.
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  }
};
