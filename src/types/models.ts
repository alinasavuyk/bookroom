export interface BookSummary {
  _id: string;
  title: string;
  author: string;
  coverImage?: string;
  price: number;
  avgRating?: number;
  reviewCount?: number;
}

export interface BookOwner {
  _id: string;
  name: string;
  avatar?: string;
  rating?: number;
}

export interface BookDetail extends BookSummary {
  description: string;
  genres: string[];
  type: 'sale' | 'exchange' | 'both';
  status: 'available' | 'reserved' | 'sold';
  owner: BookOwner;
}

export interface CommentAuthor {
  _id: string;
  name: string;
  avatar?: string;
}

export interface CommentDTO {
  _id: string;
  text: string;
  rating?: number;
  author: CommentAuthor;
  createdAt: string;
}
