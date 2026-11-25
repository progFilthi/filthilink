import { fetchClient } from './client';
import type {
  CreateLinkRequestDto,
  LinkResponseDto,
  LinkUsageResponseDto,
  PagedModelLinkResponseDto,
  UpdateLinkRequestDto,
} from '@/types/api';

export const LinksService = {
  createLink: (data: CreateLinkRequestDto) => {
    return fetchClient<LinkResponseDto>('/api/v1/links/shorten', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateLink: (id: number, data: UpdateLinkRequestDto) => {
    return fetchClient<LinkResponseDto>(`/api/v1/links/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteLink: (id: number) => {
    return fetchClient<void>(`/api/v1/links/${id}`, {
      method: 'DELETE',
    });
  },

  getUsage: () => {
    return fetchClient<LinkUsageResponseDto>('/api/v1/links/usage', {
      method: 'GET',
    });
  },

  getLinks: (page = 0, size = 100) => {
    return fetchClient<PagedModelLinkResponseDto>('/api/v1/links?page=' + page + '&size=' + size, {
      method: 'GET',
    });
  }
};
