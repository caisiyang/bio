export interface Project {
  id: string;
  title: string;
  image: string;
  link?: string;
}

export interface SocialLink {
  id: string;
  platform: string; // 'instagram', 'linkedin', 'twitter', 'email', 'github', 'youtube', 'medium', 'web'
  url: string;
}

export interface ProfileData {
  name: string;
  title: string;
  avatar: string;
  contactText: string;
  contactUrl: string;
  socials: SocialLink[];
  projects: Project[];
}

export interface GistConfig {
  token: string;
  gistId: string;
}

export enum IconType {
  Instagram = 'instagram',
  LinkedIn = 'linkedin',
  Twitter = 'twitter',
  Email = 'email',
  GitHub = 'github',
  YouTube = 'youtube',
  Web = 'web',
  Medium = 'medium',
}