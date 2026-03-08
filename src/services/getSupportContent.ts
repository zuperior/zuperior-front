import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';

export interface SupportArticle {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: string;
  tags: string[];
  views: number;
  helpful_count: number;
  not_helpful_count: number;
  is_published: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpful_count: number;
  not_helpful_count: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupportCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GetArticlesParams {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface GetArticlesResponse {
  success: boolean;
  data: SupportArticle[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetArticleResponse {
  success: boolean;
  data: SupportArticle;
}

export interface GetFAQParams {
  category?: string;
  search?: string;
  limit?: number;
}

export interface GetFAQResponse {
  success: boolean;
  data: FAQ[];
  count: number;
}

export interface GetCategoriesResponse {
  success: boolean;
  data: SupportCategory[];
}

/**
 * Get support articles
 */
export async function getSupportArticles(
  params: GetArticlesParams = {},
  access_token: string
): Promise<GetArticlesResponse['data']> {
  try {
    const queryParams = new URLSearchParams();
    if (params.category) queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const response = await axios.get<GetArticlesResponse>(
      `${API_URL}/support/articles?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw error;
  }
}

/**
 * Get a single article by slug
 */
export async function getArticleBySlug(
  slug: string,
  access_token: string
): Promise<SupportArticle> {
  try {
    const response = await axios.get<GetArticleResponse>(
      `${API_URL}/support/articles/${slug}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('Error fetching article:', error);
    throw error;
  }
}

/**
 * Get FAQ items
 */
export async function getFAQ(
  params: GetFAQParams = {},
  access_token: string
): Promise<FAQ[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params.category) queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await axios.get<GetFAQResponse>(
      `${API_URL}/support/faq?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    throw error;
  }
}

/**
 * Get support categories
 */
export async function getSupportCategories(
  access_token: string
): Promise<SupportCategory[]> {
  try {
    const response = await axios.get<GetCategoriesResponse>(
      `${API_URL}/support/categories`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

