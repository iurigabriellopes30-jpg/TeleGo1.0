
import { User, UserRole, AuthSession } from '../types';
import { supabase } from './supabaseClient';

export const authService = {
  register: async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
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
      await supabase.auth.signOut();
      throw new Error('Conta pendente de aprovação pelo administrador.');
    }

    // Buscar ID específico da role
    let roleSpecificId = profile.id;
    if (profile.role === UserRole.RESTAURANT) {
      const { data: rest } = await supabase.from('restaurants').select('id').eq('profile_id', profile.id).single();
      if (rest) roleSpecificId = rest.id;
    } else if (profile.role === UserRole.COURIER) {
      const { data: cour } = await supabase.from('couriers').select('id').eq('profile_id', profile.id).single();
      if (cour) roleSpecificId = cour.id;
    }

    return {
      user: {
        id: profile.id,
        roleSpecificId: roleSpecificId, // Novo campo para facilitar FKs
        name: profile.full_name || profile.name,
        email: profile.email,
        role: profile.role as UserRole,
        avatar: profile.avatar_url,
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
        full_name: data.name,
        avatar_url: data.avatar,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: updatedProfile.id,
      name: updatedProfile.full_name,
      email: updatedProfile.email,
      role: updatedProfile.role as UserRole,
      avatar: updatedProfile.avatar_url,
      createdAt: new Date(updatedProfile.created_at).getTime(),
      approved: updatedProfile.approved
    };
  },

  changePassword: async (userId: string, currentPass: string, newPass: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({
      password: newPass
    });
    if (error) throw error;
  },

  getAllUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(p => ({
      id: p.id,
      name: p.full_name,
      email: p.email,
      role: p.role as UserRole,
      avatar: p.avatar_url,
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
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  }
};
